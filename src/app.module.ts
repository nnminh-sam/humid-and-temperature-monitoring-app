import { Module, Logger } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import mongoose from 'mongoose';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongooseModule.forRoot(
      process.env.MODE === 'prod'
        ? `${process.env.DATABASE_HOST_PROD}/${process.env.DATABASE_NAME_DEV}`
        : `${process.env.DATABASE_HOST_DEV}/${process.env.DATABASE_NAME_DEV}`,
    ),
    UserModule,
    AuthModule,
  ],
})
export class AppModule {
  constructor() {
    if (process.env.DATABASE_DEBUG === 'true') {
      mongoose.set('debug', true);
    }
  }
}
