import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { Request, Response, NextFunction } from 'express';

const ENV = process.env.NODE_ENV || 'DEV';
const front_URL = process.env.FRONTEND_URL || 'https://localhost:5174';

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

  // Cookie parser
  app.use(cookieParser());

  // CORS configuration
  app.enableCors({
    origin: 'https://genie-construction-eben-ezer.vercel.app',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Middleware for setting headers
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Access-Control-Allow-Origin', 'https://genie-construction-eben-ezer.vercel.app');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    next();
  });

  // Middleware for logging requests
  app.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`[${req.method}] ${req.url}`);
    next();
  });

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
