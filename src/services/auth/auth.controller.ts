import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Post,
  Put,
  Query,
  Req,
  Request,
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
import { AuthGuard } from '@nestjs/passport';

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
    // @Res({ passthrough: true }) res: any,
  ) {
    // const { access_token } = await this.authService.register({ registerData });

    // res.cookie('access_token', access_token, {
    //   httpOnly: true,
    //   secure: process.env.NODE_ENV === 'PROD' ? true : false,
    //   sameSite: process.env.NODE_ENV === 'PROD' ? 'none' : 'lax',
    //   maxAge: 30 * 24 * 60 * 60 * 1000,
    // });

    // return res.send({ message: 'Inscription réussie !' });
    return await this.authService.register({ registerData });
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

  @Get('confirm-subscription')
@UseGuards(AuthGuard('jwt-body'))
async confirmSubscription(
  @Request() req: any,
  @Query('token') token: string,
  @Query('confirmed') confirmed: boolean,
  @Res() res: any
): Promise<string> {
  try {
    console.log('[CONFIRM SUBSCRIPTION] Requête reçue avec :', { token, confirmed });

    const userId = req.user.userId;
    console.log('[CONFIRM SUBSCRIPTION] Utilisateur authentifié avec userId:', userId);

    // Vérifier la validité du token
    const tokenIsValid = await this.authService.validateToken(token, userId);
    console.log('[CONFIRM SUBSCRIPTION] Token valide:', tokenIsValid);

    if (!tokenIsValid) {
      console.error('[CONFIRM SUBSCRIPTION] Token invalide ou expiré.');
      throw new UnauthorizedException('Token invalide ou expiré');
    }

    // Vérifier si l'utilisateur existe
    const user = await this.userService.getUser({ userId });
    if (!user) {
      console.error('[CONFIRM SUBSCRIPTION] Utilisateur non trouvé:', userId);
      throw new NotFoundException('Utilisateur non trouvé');
    }

    console.log('[CONFIRM SUBSCRIPTION] Utilisateur trouvé:', user);

    // Mettre à jour la confirmation
    await this.authService.updateUserConfirmation(userId, confirmed);
    console.log('[CONFIRM SUBSCRIPTION] Confirmation mise à jour pour userId:', userId);

    return res.json({ message: 'Inscription Confirmée, merci à vous !' });

  } catch (error) {
    console.error('[CONFIRM SUBSCRIPTION] Erreur:', error.message);
    throw error;
  }
}

}
