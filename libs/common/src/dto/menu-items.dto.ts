import { IsString, IsNotEmpty, Min, IsInt, IsOptional } from 'class-validator'

export class MenuItemsDto {
    @IsString({ message: 'Name must be a string' })
    @IsNotEmpty({ message: 'Name is required' })
    name: string;

    @IsString({ message: 'Description must be a string' })
    @IsOptional()
    description: string;

    @IsInt()
    @Min(0, { message: 'Price must be at least 0' })
    price: number;
}