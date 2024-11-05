import { IsPositive } from 'class-validator';

export class UpdateChannelDto {
  @IsPositive()
  temperature: number;

  @IsPositive()
  humidity: number;

  @IsPositive()
  temperatureThreshold: number;

  @IsPositive()
  humidityThreshold: number;
}
