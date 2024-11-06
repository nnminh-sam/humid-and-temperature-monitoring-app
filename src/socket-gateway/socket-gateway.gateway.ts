import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PopulatedFeed } from 'src/feed/entities/feed.entity';

@WebSocketGateway()
export class SocketGatewayGateway {
  @WebSocketServer()
  private readonly server: Server;

  @SubscribeMessage('joinRoom')
  joinRoom(client: Socket, payload: Record<string, string>) {
    const { channelId } = payload;
    client.join(channelId);
  }

  create(channelId: string, @MessageBody() newFeed: PopulatedFeed) {
    this.server.to(channelId).emit('newFeed', newFeed);
  }
}
