import { Module } from '@nestjs/common';
import { ChannelService } from './channel.service';
import { ChannelController } from './channel.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Channel, ChannelSchema } from './entities/channel.entity';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Channel.name,
        schema: ChannelSchema,
        collection: 'channels',
      },
    ]),
    UserModule,
  ],
  providers: [ChannelService],
  controllers: [ChannelController],
})
export class ChannelModule {}
