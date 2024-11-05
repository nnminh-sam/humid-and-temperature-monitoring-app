import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { User } from 'src/user/entities/user.entity';

@Schema({ timestamps: true })
export class Channel {
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
    ref: User.name,
    type: String,
    required: true,
  })
  user: string;
}

export type ChannelDocument = Channel & Document & { _id: Types.ObjectId };

export type PopulatedChannel = Channel & {
  user: User;
};

export const ChannelSchema = SchemaFactory.createForClass(Channel);
