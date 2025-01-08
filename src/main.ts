import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { Request, NextFunction, Response } from 'express';

const ENV = process.env.NODE_ENV || 'DEV';
const front_URL = process.env.FRONTEND_URL || 'https://localhost:5174';

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

  if (ENV === 'PROD') {
    app.use((req: Request, res: Response, next: NextFunction) => {
      console.log('Request:', req);
      next();
    });
  }

  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'https://genie-construction-eben-ezer.vercel.app');
    console.log('Res header:', res.header);
    next();
  });

  app.use((req, res, next) => {
    if (req.method === 'OPTIONS') {
      res.header('Access-Control-Allow-Origin', 'https://genie-construction-eben-ezer.vercel.app');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.header('Access-Control-Allow-Credentials', 'true');
      return res.status(204).end(); // Fin de la réponse pour OPTIONS
    }
    next();
  });

  var whitelist = ['https://genie-construction-eben-ezer.vercel.app'];

  app.enableCors({
    origin: function (origin, callback) {
      console.log('Origine de la requête:', origin);
      if (origin === undefined) {
        console.log('Aucune origine définie dans la requête.');
      }

      if (whitelist.indexOf(origin) !== -1) {
        console.log('CORS autorisé pour:', origin);
        callback(null, true);
      } else {
        console.log('CORS bloqué pour:', origin);
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: 'GET, PUT, POST, DELETE, OPTIONS',
    allowedHeaders: 'X-Requested-With, Content-Type, Accept, Observe',
    credentials: true,
    preflightContinue: false,
    maxAge: 86400,
  });

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
