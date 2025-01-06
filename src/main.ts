import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { Request, NextFunction, Response } from 'express';

const ENV = process.env.NODE_ENV;
const front_URL = process.env.FRONTEND_URL;

const origin = ENV === 'PROD' ? front_URL : 'https://localhost:5174';
console.log(origin);

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
    origin: ['https://genie-construction-eben-ezer.vercel.app'], // Frontend autorisé
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Méthodes autorisées
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'], // En-têtes autorisés
    credentials: true, // Autoriser les cookies
  });

  app.use(function (req: Request, res: Response, next: NextFunction) {
    if (req.method === 'OPTIONS') {
      res.header(
        'Access-Control-Allow-Origin',
        'https://genie-construction-eben-ezer.vercel.app',
      );
      res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
      res.header(
        'Access-Control-Allow-Headers',
        'Content-Type, Authorization, Accept',
      );
      res.header('Access-Control-Allow-Credentials', 'true');
      return res.status(200).json({});
    }
    next();
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
