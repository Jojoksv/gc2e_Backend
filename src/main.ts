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
      if (!origin || whitelist.indexOf(origin) !== -1) {
        callback(null, true)
      } else {
        callback(new Error('Not allowed by CORS'))
      }
    },
  allowedHeaders: 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept, Observe', // En-têtes autorisés
  methods: 'GET,PUT,POST,DELETE,UPDATE,OPTIONS', // Méthodes HTTP autorisées
  // credentials: true,
});


  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
