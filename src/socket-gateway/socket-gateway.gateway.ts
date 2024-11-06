import { Logger } from '@nestjs/common';
import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PopulatedFeed } from 'src/feed/entities/feed.entity';
import * as dotenv from 'dotenv';
dotenv.config();

@WebSocketGateway({
  cors: {
    origin: process.env.ALLOW_ORIGIN,
    allowedHeaders: '*',
  },
})
export class SocketGatewayGateway {
  private readonly logger = new Logger(SocketGatewayGateway.name);

  @WebSocketServer()
  private readonly server: Server;

  @SubscribeMessage('joinRoom')
  joinRoom(client: Socket, payload: Record<string, string>) {
    const { channelId } = payload;
    client.join(channelId);
    this.logger.log(`Client joined room: ${channelId}`);
  }

  create(channelId: string, @MessageBody() newFeed: PopulatedFeed) {
    this.server.to(channelId).emit('newFeed', newFeed);
    this.logger.log(`New feed created in room: ${channelId}`);
  }
}
