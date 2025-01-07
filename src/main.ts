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
      console.log('Request Headers:', req);
      next();
    });
  }

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
    allowedHeaders:
      'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept, Observe',
    methods: 'GET,PUT,POST,DELETE,UPDATE,OPTIONS',
    credentials: true, // Autorise les cookies dans les requêtes
    preflightContinue: false, // Pré-faites les pré-vérifications si nécessaire
    maxAge: 86400, // Délai de mise en cache de la pré-vérification
  });

  app.use((req, res, next) => {
    // Ajoutez l'en-tête Access-Control-Allow-Credentials
    res.header('Access-Control-Allow-Credentials', 'true');
    next();
  });

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
