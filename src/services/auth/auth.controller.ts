import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Put,
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
import { UpdateUserDto } from '../../dtos/updateUserDTO';

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
        `Tentative de connexion pour l'utilisateur ${loginData.email}`,
      );
      const { access_token } = await this.authService.login({ loginData });

      res.cookie('access_token', access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'PROD' ? true : false,
        sameSite: process.env.NODE_ENV === 'PROD' ? 'none' : 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000,
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
      secure: process.env.NODE_ENV === 'DEV',
      sameSite: 'none',
      maxAge: 30 * 24 * 60 * 60 * 1000,
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

  @Put('update')
  @UseGuards(JwtAuthGuard)
  async updateUser(@Req() req: any, @Body() updateData: UpdateUserDto) {
    const userId = req.user.userId;

    // Récupérer les infos actuelles de l'utilisateur
    const currentUser = await this.userService.getUser({ userId });

    if (!currentUser) {
      throw new UnauthorizedException("Utilisateur non trouvé.");
    }

    // Vérifier que l'email et le rôle envoyés correspondent à l'utilisateur actuel
    if (updateData.email !== currentUser.email || updateData.role !== currentUser.role) {
      throw new UnauthorizedException("Vous ne pouvez pas modifier l'email ou le rôle.");
    }

    // Mise à jour des informations utilisateur
    return await this.authService.updateUser(userId, updateData);
  }
}
