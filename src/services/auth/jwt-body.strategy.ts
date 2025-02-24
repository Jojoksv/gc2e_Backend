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
          // Vérifie dans `query`, `body`, puis `Authorization`
          return (
            request?.query?.token || 
            request?.body?.token || 
            request?.headers?.authorization?.replace('Bearer ', '')
          );
        },
      ]),
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: any) {
    if (!payload) {
      throw new UnauthorizedException();
    }
    return { userId: payload.sub }; // Retourne l'ID utilisateur
  }
}
