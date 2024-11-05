import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ChannelModule } from './channel/channel.module';
import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config();

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongooseModule.forRoot(
      process.env.APP_MODE === 'prod'
        ? `${process.env.DATABASE_HOST_PROD}/${process.env.DATABASE_NAME}`
        : `${process.env.DATABASE_HOST_DEV}/${process.env.DATABASE_NAME}`,
    ),
    UserModule,
    AuthModule,
    ChannelModule,
  ],
})
export class AppModule {
  constructor() {
    if (process.env.DATABASE_DEBUG === 'true') {
      mongoose.set('debug', true);
    }
  }
}
