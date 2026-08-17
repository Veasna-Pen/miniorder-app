import { NestFactory } from '@nestjs/core';
import { OrdersServiceModule } from './orders-service.module';
import { SERVICE_PORTS } from '@app/common';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(OrdersServiceModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true
    }),
  );

  await app.listen(SERVICE_PORTS.ORDRER_SERVICE);

  console.log(`Order Service is running on port ${SERVICE_PORTS.ORDRER_SERVICE}`)
}
bootstrap();
