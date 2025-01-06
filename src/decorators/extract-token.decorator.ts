import { createParamDecorator, ExecutionContext } from '@nestjs/common';

// Un décorateur personnalisé pour extraire le token des cookies
export const TokenFromCookie = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const token = request.cookies?.access_token;

    if (token) {
      console.log('Token trouvé:', token);
      return token;
    }

    console.warn('Aucun token trouvé dans les cookies.');
    return null;
  },
);
