import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../../guards/jwt.auth.guard';
import { CreateUser } from 'src/types/types';
import { UserService } from '../user/user.service';
import { RateLimit } from 'nestjs-rate-limiter';
import { LoginDto } from '../../dtos/loginDTO';
import { Logger } from '@nestjs/common';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  logger = new Logger('AuthController');

  @Post('login')
  async login(@Body() loginData: LoginDto, @Res() res: any) {
    try {
      this.logger.log(
        `Tentative de connexion pour l'utilisateur ${loginData.username}`,
      );
      const { access_token } = await this.authService.login({ loginData });

      res.cookie('access_token', access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'PROD',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000,
      });

      return res.send({ message: 'Connexion réussie !' });
    } catch (error) {
      this.logger.error('Erreur lors de la connexion', error);
      throw new UnauthorizedException(
        'Échec de connexion. Vérifiez vos identifiants.',
      );
    }
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
      httpOnly: true,
      secure: process.env.NODE_ENV === 'PROD',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000,
    });

    return res.send({ message: 'Inscription réussie !' });
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async getAuthenticatedUser(@Req() request: any) {
    return await this.userService.getUser({
      userId: request.user.userId,
    });
  }
}
