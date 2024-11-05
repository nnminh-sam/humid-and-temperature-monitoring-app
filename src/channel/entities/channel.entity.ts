import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { read } from 'fs';
import { Types } from 'mongoose';
import { User } from 'src/user/entities/user.entity';

@Schema({ timestamps: true })
export class Channel {
  id: string;

  @Prop({ required: true })
  name: string;

  @Prop({ default: '' })
  description: string;

  @Prop({
    ref: User.name,
    type: String,
    required: true,
  })
  user: string;

  @Prop({ required: false, unique: true })
  readKey: string;

  @Prop({ required: false, unique: true })
  writeKey: string;
}

export type ChannelDocument = Channel & Document & { _id: Types.ObjectId };

export type PopulatedChannel = Channel & {
  user: User;
};

const ChannelSchema = SchemaFactory.createForClass(Channel);

ChannelSchema.index({ readKey: 1, writeKey: 1 }, { unique: true });

export { ChannelSchema };
