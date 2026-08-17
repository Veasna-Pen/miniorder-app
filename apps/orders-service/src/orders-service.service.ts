import { MenuItemsDto } from '@app/common';
import { DatabaseService, menu_items } from '@app/database';
import { KAFKA_SERVICE, KAFKA_TOPICS } from '@app/kafka';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';

@Injectable()
export class OrdersServiceService implements OnModuleInit {
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
}
