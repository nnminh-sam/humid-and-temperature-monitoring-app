import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { Channel } from 'src/channel/entities/channel.entity';

@Schema({ timestamps: true })
export class Feed {
  id: string;

  @Prop({ required: true })
  temperature: number;

  @Prop({ required: true })
  humidity: number;

  @Prop({ required: true })
  temperatureThreshold: number;

  @Prop({ required: true })
  humidityThreshold: number;

  @Prop({
    ref: Channel.name,
    type: String,
    required: true,
  })
  channel: string;
}

export type FeedDocument = Feed & Document & { _id: Types.ObjectId };

export type PopulatedFeed = Feed & {
  channel: Channel;
};

const FeedSchema = SchemaFactory.createForClass(Feed);

export { FeedSchema };
