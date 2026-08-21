import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Post,
} from '@nestjs/common';
import { OrdersServiceService } from './orders-service.service';
import { CreateOrderDto, MenuItemsDto } from '@app/common';

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

