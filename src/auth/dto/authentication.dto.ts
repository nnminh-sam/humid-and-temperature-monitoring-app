import { IsEmail, IsString } from 'class-validator';

export class AuthenticationDto {
  @IsEmail({}, { message: 'Invalid email' })
  email: string;

  @IsString()
  password: string;
}
