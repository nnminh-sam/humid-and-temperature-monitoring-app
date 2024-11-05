import { IsMongoId, IsPositive } from 'class-validator';

export class CreateFeedDto {
  @IsMongoId()
  channelId: string;

  @IsPositive()
  temperature: number;

  @IsPositive()
  humidity: number;

  @IsPositive()
  temperatureThreshold: number;

  @IsPositive()
  humidityThreshold: number;
}
