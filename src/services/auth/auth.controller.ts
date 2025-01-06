import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../../guards/jwt.auth.guard';
import { CreateUser } from 'src/types/types';
import { UserService } from '../user/user.service';
import { RateLimit } from 'nestjs-rate-limiter';
import { LoginDto } from 'src/dtos/loginDTO';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  @RateLimit({ points: 5, duration: 10 })
  async login(@Body() loginData: LoginDto, @Res() res: any) {
    const { access_token } = await this.authService.login({ loginData });

    res.cookie('access_token', access_token, {
      httpOnly: true, // Empêche l'accès via JavaScript
      secure: process.env.NODE_ENV === 'PROD', // Seulement en HTTPS en production
      sameSite: 'strict', // Empêche les attaques CSRF
      maxAge: 24 * 60 * 60 * 1000, // Expiration dans 24 heures
    });

    return res.send({ message: 'Connexion réussie !' });
  }

  @HttpCode(HttpStatus.OK)
  @Post('register')
  @RateLimit({ points: 5, duration: 10 })
  async register(
    @Body() registerData: CreateUser,
    @Res({ passthrough: true }) res: any,
  ) {
    const { access_token } = await this.authService.register({ registerData });

    res.cookie('access_token', access_token, {
      httpOnly: true, // Empêche l'accès via JavaScript
      secure: process.env.NODE_ENV === 'PROD', // Seulement en HTTPS en production
      sameSite: 'strict', // Empêche les attaques CSRF
      maxAge: 24 * 60 * 60 * 1000, // Expiration dans 24 heures
    });

    return res.send({ message: 'Inscription réussie !' });
    // return this.authService.register({ registerData });
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async getAuthenticatedUser(@Req() request: any) {
    return await this.userService.getUser({
      userId: request.user.userId,
    });
  }
}
