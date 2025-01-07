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
    res.header('Access-Control-Allow-Credentials', 'true');
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
