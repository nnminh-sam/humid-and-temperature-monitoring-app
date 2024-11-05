import { IsPositive } from 'class-validator';

export class CreateChannelDto {
  @IsPositive()
  temperature: number;

  @IsPositive()
  humidity: number;

  @IsPositive()
  temperatureThreshold: number;

  @IsPositive()
  humidityThreshold: number;
}
