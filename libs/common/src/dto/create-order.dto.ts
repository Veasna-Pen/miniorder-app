import {
    ArrayMinSize,
    IsArray,
    IsInt,
    IsUUID,
    Min,
    ValidateNested,
    IsNotEmpty
} from 'class-validator';
import { Type } from 'class-transformer';

export class OrderItemDto {
    @IsUUID()
    @IsNotEmpty({ message: 'menuItemId is required' })
    menuItemId: string;

    @IsInt({ message: 'Quantity must be integer' })
    @IsNotEmpty({ message: 'Quantity is required' })
    @Min(1, { message: 'Quantity must be at least 1' })
    quantity: number;
}

export class CreateOrderDto {
    @IsArray()
    @ArrayMinSize(1, { message: 'Order must contain at least one item' })
    @ValidateNested({ each: true })
    @Type(() => OrderItemDto)
    items: OrderItemDto[];
}


