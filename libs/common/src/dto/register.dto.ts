import { IsString, IsNotEmpty, Min } from 'class-validator'

export class RegisterDto {
    @IsString({ message: 'Email must be a string' })
    @IsNotEmpty({ message: 'Email is required' })
    email: string;

    @IsString({ message: 'Password must be a string' })
    @IsNotEmpty({ message: 'Password is required' })
    @Min(6, { message: 'Password at least 6 characters long' })
    password: string;
}