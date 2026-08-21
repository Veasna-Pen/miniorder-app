import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { OrdersServiceController } from './orders-service.controller';
import { OrdersServiceService } from './orders-service.service';

describe('OrdersServiceController', () => {
  let controller: OrdersServiceController;
  let mockService: Partial<Record<keyof OrdersServiceService, jest.Mock>>;

  beforeEach(async () => {
    mockService = {
      addMenuItem: jest.fn(),
      getMenuItem: jest.fn(),
      createOrder: jest.fn(),
    };

    const app: TestingModule = await Test.createTestingModule({
      controllers: [OrdersServiceController],
      providers: [
        {
          provide: OrdersServiceService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = app.get<OrdersServiceController>(OrdersServiceController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createOrder', () => {
    it('should throw BadRequestException if x-user-id header is missing', async () => {
      expect(() =>
        controller.createOrder('', 'key-123', {
          items: [{ menuItemId: 'menu-1', quantity: 1 }],
        }),
      ).toThrow(BadRequestException);
    });

    it('should throw BadRequestException if Idempotency-Key header is missing', async () => {
      expect(() =>
        controller.createOrder('user-123', '', {
          items: [{ menuItemId: 'menu-1', quantity: 1 }],
        }),
      ).toThrow(BadRequestException);
    });

    it('should forward parameters to service', async () => {
      const dto = { items: [{ menuItemId: 'menu-1', quantity: 1 }] };
      const expectedResponse = { message: 'Order created successfully', order: {} as any };
      (mockService.createOrder as jest.Mock).mockResolvedValue(expectedResponse);

      const result = await controller.createOrder('user-123', 'key-123', dto);

      expect(mockService.createOrder).toHaveBeenCalledWith('user-123', 'key-123', dto);
      expect(result).toBe(expectedResponse);
    });
  });
});

