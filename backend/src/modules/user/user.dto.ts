import { IsEmail, IsEnum, IsNotEmpty, MinLength } from 'class-validator';
import { UserType } from 'src/shared/enums/user.enums';

export class CreateUserDto {
    @IsNotEmpty()
    username: string;

    @IsEmail()
    email: string;

    @MinLength(6)
    password: string;

    @IsEnum(UserType)
    role: UserType; 
}

export class UpdateUserDto {
    @IsNotEmpty()
    username: string;

    @IsEmail()
    email: string;

    @MinLength(6)
    password: string;
}