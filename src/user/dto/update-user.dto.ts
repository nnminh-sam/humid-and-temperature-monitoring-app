import { IsString, Length } from 'class-validator';

export class UpdateUserDto {
  @IsString()
  @Length(3, 100, { message: 'Full name must be between 3 and 100 characters' })
  fullName: string;
}
