import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateChannelDto {
  @IsOptional()
  name: string;

  @IsOptional()
  description: string;
}
