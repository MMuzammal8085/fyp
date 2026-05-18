import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail()
  @IsNotEmpty()
  @IsString()
  email: string;

  @MinLength(6)
  @IsNotEmpty()
  @IsString()
  password: string;
}
