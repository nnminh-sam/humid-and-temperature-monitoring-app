import { IsEmail, IsString, Length } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @Length(3, 100, { message: 'Full name must be between 3 and 100 characters' })
  fullName: string;

  @IsString()
  @Length(8)
  password: string;
}
