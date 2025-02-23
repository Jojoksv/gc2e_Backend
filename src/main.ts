import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import * as express from 'express';
import { join } from 'path';
import { origin } from './config/constants';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Validation pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.use(express.static(join(process.cwd(), './tmp/uploads')));

  // Cookie parser
  app.use(cookieParser());

  // CORS configuration
  app.enableCors({
    origin: [origin, "http://localhost:5174"],
    credentials: true,
    methods: 'GET, PUT, POST, DELETE, OPTIONS',
    allowedHeaders: 'X-Requested-With, Content-Type, Accept, Observe',
  });

  

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
