import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  Param,
  Post,
} from '@nestjs/common';
import { OrdersServiceService } from './orders-service.service';
import { CreateOrderDto, MenuItemsDto } from '@app/common';

@Controller()
export class OrdersServiceController {
  constructor(private readonly ordersServiceService: OrdersServiceService) { }

  @Get('health')
  getHealth() {
    return this.ordersServiceService.getHealth();
  }

  @Post('menu-items')
  addMenuItem(
    @Headers('x-user-role') role: string,
    @Body() dto: MenuItemsDto,
  ) {
    if (role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can create menu items');
    }
    return this.ordersServiceService.addMenuItem(dto);
  }

  @Get('menu-items')
  getMenuItems() {
    return this.ordersServiceService.getMenuItem();
  }


  @Get('orders/my-orders')
  getMyOrders(@Headers('x-user-id') userId: string) {
    if (!userId) {
      throw new BadRequestException('x-user-id header is required');
    }
    return this.ordersServiceService.getMyOrders(userId);
  }

  @Get('orders/:id')
  getOrderById(
    @Param('id') id: string,
    @Headers('x-user-id') userId: string,
  ) {
    if (!userId) {
      throw new BadRequestException('x-user-id header is required');
    }
    return this.ordersServiceService.getOrderById(id, userId);
  }

  @Post('orders/:id/pay')
  payOrder(
    @Param('id') id: string,
    @Headers('x-user-id') userId: string,
  ) {
    if (!userId) {
      throw new BadRequestException('x-user-id header is required');
    }
    return this.ordersServiceService.payOrder(id, userId);
  }

  @Post('orders')
  createOrder(@Headers('x-user-id') userId: string, @Headers('idempotency-key') idempotencyKey: string, @Body() dto: CreateOrderDto) {
    if (!userId) {
      throw new BadRequestException('x-user-id header is required');
    }
    if (!idempotencyKey) {
      throw new BadRequestException('Idempotency-Key header is required');
    }
    return this.ordersServiceService.createOrder(userId, idempotencyKey, dto);
  }
}

