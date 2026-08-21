import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { OrdersServiceController } from './orders-service.controller';
import { OrdersServiceService } from './orders-service.service';

describe('OrdersServiceController', () => {
  let controller: OrdersServiceController;
  let mockService: Partial<Record<keyof OrdersServiceService, jest.Mock>>;

  beforeEach(async () => {
    mockService = {
      getHealth: jest.fn(),
      addMenuItem: jest.fn(),
      getMenuItem: jest.fn(),
      createOrder: jest.fn(),
      getMyOrders: jest.fn(),
      getOrderById: jest.fn(),
      payOrder: jest.fn(),
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

  describe('getHealth', () => {
    it('should return health status', () => {
      const healthStatus = { status: 'ok', service: 'orders-service', timestamp: '2026-08-21T07:00:00.000Z' };
      (mockService.getHealth as jest.Mock).mockReturnValue(healthStatus);

      expect(controller.getHealth()).toBe(healthStatus);
    });
  });

  describe('addMenuItem', () => {
    it('should throw ForbiddenException if user is not an ADMIN', async () => {
      expect(() =>
        controller.addMenuItem('CUSTOMER', { name: 'Latte', price: 300 }),
      ).toThrow(ForbiddenException);
    });

    it('should call addMenuItem when user is an ADMIN', async () => {
      const dto = { name: 'Latte', price: 300 };
      const expectedResponse = { message: 'Menu Item created successfully', menu_item: dto as any };
      (mockService.addMenuItem as jest.Mock).mockResolvedValue(expectedResponse);

      const result = await controller.addMenuItem('ADMIN', dto);

      expect(mockService.addMenuItem).toHaveBeenCalledWith(dto);
      expect(result).toBe(expectedResponse);
    });
  });

  describe('getMenuItems', () => {
    it('should return menu items list', async () => {
      const items = [{ id: '1', name: 'Latte', price: 300, available: true }];
      (mockService.getMenuItem as jest.Mock).mockResolvedValue(items);

      const result = await controller.getMenuItems();

      expect(mockService.getMenuItem).toHaveBeenCalled();
      expect(result).toBe(items);
    });
  });


  describe('getMyOrders', () => {
    it('should throw BadRequestException if x-user-id header is missing', async () => {
      expect(() => controller.getMyOrders('')).toThrow(BadRequestException);
    });

    it('should call getMyOrders with userId and return results', async () => {
      const mockOrders = [{ id: 'order-1', userId: 'user-123', items: [] }];
      (mockService.getMyOrders as jest.Mock).mockResolvedValue(mockOrders);

      const result = await controller.getMyOrders('user-123');

      expect(mockService.getMyOrders).toHaveBeenCalledWith('user-123');
      expect(result).toBe(mockOrders);
    });
  });

  describe('getOrderById', () => {
    it('should throw BadRequestException if x-user-id header is missing', async () => {
      expect(() => controller.getOrderById('order-1', '')).toThrow(BadRequestException);
    });

    it('should call getOrderById with id and userId', async () => {
      const mockOrder = { id: 'order-1', userId: 'user-123', items: [] };
      (mockService.getOrderById as jest.Mock).mockResolvedValue(mockOrder);

      const result = await controller.getOrderById('order-1', 'user-123');

      expect(mockService.getOrderById).toHaveBeenCalledWith('order-1', 'user-123');
      expect(result).toBe(mockOrder);
    });
  });

  describe('payOrder', () => {
    it('should throw BadRequestException if x-user-id header is missing', async () => {
      expect(() => controller.payOrder('order-1', '')).toThrow(BadRequestException);
    });

    it('should call payOrder with id and userId', async () => {
      const mockResponse = { message: 'Order paid successfully', order: { id: 'order-1', status: 'PAID' } };
      (mockService.payOrder as jest.Mock).mockResolvedValue(mockResponse);

      const result = await controller.payOrder('order-1', 'user-123');

      expect(mockService.payOrder).toHaveBeenCalledWith('order-1', 'user-123');
      expect(result).toBe(mockResponse);
    });
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


