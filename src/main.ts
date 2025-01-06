import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';

const ENV = process.env.NODE_ENV;
const front_URL = process.env.FRONTEND_URL;

const origin = ENV === 'PROD' ? front_URL : 'https://localhost:5174';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.use(cookieParser());
  app.enableCors({
    origin: origin,
    credentials: true,
  });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
