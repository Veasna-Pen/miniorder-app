import { CreateOrderDto, MenuItemsDto } from '@app/common';
import { DatabaseService, menu_items, order_items, orders } from '@app/database';
import { KAFKA_SERVICE, KAFKA_TOPICS } from '@app/kafka';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { and, desc, eq, inArray } from 'drizzle-orm';
import { randomUUID } from 'crypto';



@Injectable()
export class OrdersServiceService implements OnModuleInit {
  private readonly logger = new Logger(OrdersServiceService.name);

  constructor(
    @Inject(KAFKA_SERVICE) private readonly kafkaClient: ClientKafka,
    private readonly dbService: DatabaseService,
  ) { }

  async onModuleInit() {
    await this.kafkaClient.connect();
  }

  async addMenuItem(menuItemsDto: MenuItemsDto) {
    const [menuItem] = await this.dbService.db
      .insert(menu_items)
      .values(menuItemsDto)
      .returning();

    return { message: 'Menu Item created successfully', menu_item: menuItem };
  }

  async getMenuItem() {
    return this.dbService.db
      .select()
      .from(menu_items);
  }

  async getMyOrders(userId: string) {
    const userOrders = await this.dbService.db
      .select()
      .from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt));

    if (userOrders.length === 0) {
      return [];
    }

    const orderIds = userOrders.map((o) => o.id);
    const items = await this.dbService.db
      .select()
      .from(order_items)
      .where(inArray(order_items.orderId, orderIds));

    const itemsByOrderId = new Map<string, typeof items>();
    for (const item of items) {
      const list = itemsByOrderId.get(item.orderId) || [];
      list.push(item);
      itemsByOrderId.set(item.orderId, list);
    }

    return userOrders.map((order) => ({
      ...order,
      items: itemsByOrderId.get(order.id) || [],
    }));
  }

  async getOrderById(orderId: string, userId: string) {
    const [order] = await this.dbService.db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.userId !== userId) {
      throw new ForbiddenException('You do not have permission to view this order');
    }

    const items = await this.dbService.db
      .select()
      .from(order_items)
      .where(eq(order_items.orderId, order.id));

    return {
      ...order,
      items,
    };
  }

  async payOrder(orderId: string, userId: string) {
    const [order] = await this.dbService.db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.userId !== userId) {
      throw new ForbiddenException('You do not have permission to pay for this order');
    }

    if (order.status === 'PAID') {
      throw new ConflictException('Order has already been paid');
    }

    if (order.status !== 'PENDING') {
      throw new BadRequestException(`Cannot pay order with status ${order.status}`);
    }

    const [updatedOrder] = await this.dbService.db
      .update(orders)
      .set({
        status: 'PAID',
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId))
      .returning();

    this.kafkaClient.emit(KAFKA_TOPICS.ORDER_PAID, {
      eventId: randomUUID(),
      schemaVersion: 1,
      occurredAt: new Date().toISOString(),
      orderId: updatedOrder.id,
      userId: updatedOrder.userId,
      totalPrice: updatedOrder.totalPrice,
    });

    this.logger.log(`Order ${updatedOrder.id} paid by user ${userId}`);

    return {
      message: 'Order paid successfully',
      order: updatedOrder,
    };
  }

  async createOrder(userId: string, idempotencyKey: string, dto: CreateOrderDto) {
    const [existingOrder] = await this.dbService.db
      .select()
      .from(orders)
      .where(and(
        eq(orders.userId, userId),
        eq(orders.idempotencyKey, idempotencyKey),
      ),)
      .limit(1);

    if (existingOrder) {
      const items = await this.dbService.db
        .select()
        .from(order_items)
        .where(eq(order_items.orderId, existingOrder.id));

      return {
        message: 'Order already exists',
        order: {
          ...existingOrder,
          items,
        },
      };
    }

    const itemIds = dto.items.map((i) => i.menuItemId);
    const uniqueItemIds = new Set(itemIds);
    if (uniqueItemIds.size !== itemIds.length) {
      throw new BadRequestException('Duplicate menu items in order request are not allowed');
    }

    const dbMenuItems = await this.dbService.db
      .select()
      .from(menu_items)
      .where(inArray(menu_items.id, itemIds));

    if (dbMenuItems.length !== itemIds.length) {
      throw new BadRequestException('One or more menu items were not found');
    }

    const menuMap = new Map(dbMenuItems.map((item) => [item.id, item]));

    for (const item of dto.items) {
      const dbItem = menuMap.get(item.menuItemId);
      if (!dbItem || !dbItem.available) {
        throw new BadRequestException(`Menu item ${item.menuItemId} is not available`,);
      }
    }

    let totalPrice = 0;
    const orderItemsData = dto.items.map((item) => {
      const dbItem = menuMap.get(item.menuItemId)!;
      const subTotal = dbItem.price * item.quantity;
      totalPrice += subTotal;
      return {
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        unitPrice: dbItem.price,
        subTotal,
      };
    });

    const result = await this.dbService.db.transaction(async (tx) => {
      const [newOrder] = await tx
        .insert(orders)
        .values({
          userId,
          status: 'PENDING',
          totalPrice,
          idempotencyKey,
        })
        .returning();

      const itemsToInsert = orderItemsData.map((item) => ({
        orderId: newOrder.id,
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subTotal: item.subTotal,
      }));

      const insertedItems = await tx
        .insert(order_items)
        .values(itemsToInsert)
        .returning();

      return {
        order: newOrder,
        items: insertedItems,
      };
    });

    const totalQuantity = dto.items.reduce((acc, item) => acc + item.quantity, 0);

    this.kafkaClient.emit(KAFKA_TOPICS.ORDER_CREATED, {
      eventId: randomUUID(),
      schemaVersion: 1,
      occurredAt: new Date().toISOString(),
      orderId: result.order.id,
      userId: result.order.userId,
      totalPrice: result.order.totalPrice,
      itemCount: totalQuantity,
    });

    this.logger.log(`Order ${result.order.id} created for user ${userId}`);

    return {
      message: 'Order created successfully',
      order: {
        ...result.order,
        items: result.items,
      },
    };
  }
}


