import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';

@Injectable()
export class JwtBodyStrategy extends PassportStrategy(Strategy, 'jwt-body') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          const token =
            request?.query?.token || 
            request?.body?.token || 
            request?.headers?.authorization?.replace('Bearer ', '');
          
          console.log('[JWT STRATEGY] Token extrait:', token);
          return token;
        },
      ]),
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: any) {
    console.log('[JWT STRATEGY] Payload reçu:', payload);

    if (!payload || !payload.userId) {
      console.error('[JWT STRATEGY] Erreur: Payload invalide ou userId manquant.');
      throw new UnauthorizedException();
    }

    console.log('[JWT STRATEGY] Utilisateur validé avec userId:', payload.userId);
    return { userId: payload.userId }; // Vérifie que `userId` est bien transmis
  }
}
