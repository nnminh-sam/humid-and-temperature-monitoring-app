import { Module } from '@nestjs/common';
import { FeedService } from './feed.service';
import { FeedController } from './feed.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Feed, FeedSchema } from './entities/feed.entity';
import { ChannelModule } from 'src/channel/channel.module';
import { SocketGatewayModule } from 'src/socket-gateway/socket-gateway.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Feed.name,
        schema: FeedSchema,
        collection: 'feeds',
      },
    ]),
    ChannelModule,
    SocketGatewayModule,
  ],
  providers: [FeedService],
  controllers: [FeedController],
})
export class FeedModule {}
