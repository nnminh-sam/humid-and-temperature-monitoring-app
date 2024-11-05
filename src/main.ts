import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ApiResponseTransformInterceptor } from './interceptor/api-response-transform.interceptor';
import * as dotenv from 'dotenv';
dotenv.config();

async function bootstrap() {
  const applicationPort: string = process.env.APP_PORT;

  const app: INestApplication<any> = await NestFactory.create(AppModule);
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalInterceptors(new ApiResponseTransformInterceptor());

  await app.listen(applicationPort).then(() => {
    console.log(`Application is running on: ${applicationPort}`);
    console.log(`Application is running in: ${process.env.APP_MODE} mode`);
  });
}
bootstrap();
