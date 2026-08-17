import { Module } from '@nestjs/common';
import { OrdersServiceController } from './orders-service.controller';
import { OrdersServiceService } from './orders-service.service';
import { KafkaModule } from '@app/kafka';
import { DatabaseModule } from '@app/database';

@Module({
  imports: [KafkaModule.register('orders-service-group'), DatabaseModule],
  controllers: [OrdersServiceController],
  providers: [OrdersServiceService],
})
export class OrdersServiceModule {}
