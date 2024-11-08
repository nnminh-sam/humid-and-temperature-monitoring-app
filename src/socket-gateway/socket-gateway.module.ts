import { Module } from '@nestjs/common';
import { SocketGatewayService } from './socket-gateway.service';
import { SocketGatewayGateway } from './socket-gateway.gateway';

@Module({
  providers: [SocketGatewayGateway, SocketGatewayService],
  exports: [SocketGatewayGateway],
})
export class SocketGatewayModule {}
