import { Body, Controller, Get, Post, Request } from '@nestjs/common';
import { OrdersServiceService } from './orders-service.service';
import { MenuItemsDto } from '@app/common';

@Controller()
export class OrdersServiceController {
  constructor(private readonly ordersServiceService: OrdersServiceService) { }

  @Post('menu-items')
  addMenuItem(@Body() dto: MenuItemsDto) {
    return this.ordersServiceService.addMenuItem(dto);
  }

  @Get('menu-items')
  getMenuItems() {
    return this.ordersServiceService.getMenuItem();
  }
}
