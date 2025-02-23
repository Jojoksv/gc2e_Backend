import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/services/prisma.service';
import { CreateUser, UserPayload } from '../../types/types';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { compare, hash } from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { UpdateUserDto } from '../../dtos/updateUserDTO';
import sendEmail from './email.service.js';
import * as cron from 'node-cron';
import * as dotenv from 'dotenv';

dotenv.config();

const limiter = new RateLimiterMemory({
  points: 5,
  duration: 10,
});

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {
      // Planifie une tâche qui s'exécute toutes les heures
      cron.schedule('0 * * * *', async () => {
        console.log('🕒 Vérification des comptes non confirmés...');
        await this.cleanUpUnconfirmedAccounts();
      });
    }
  
  async cleanUpUnconfirmedAccounts() {
    const now = new Date();
    const threshold = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const deletedUsers = await this.prisma.user.deleteMany({
      where: {
        confirmed: false,
        createdAt: { lt: threshold },
      },
    });

    console.log(`🗑️ ${deletedUsers.count} comptes supprimés`);
  }

  async login({ loginData }) {
    try {
      await limiter.consume(loginData.email);
    } catch {
      throw new UnauthorizedException(
        'Trop de tentatives de connexion. Veuillez réessayer plus tard.',
      );
    }

    const { email, password } = loginData;

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!existingUser) {
      throw new NotFoundException('Identifiants invalides');
    }

    const isPasswordSame = await this.isPasswordValid({
      password,
      hashPassword: existingUser.password,
    });

    if (!isPasswordSame) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    return this.authenticateUser({
      userId: existingUser.id,
      role: existingUser.role,
    });
  }

  async register({ registerData }: { registerData: CreateUser }) {
      const { email, name, password } = registerData;

      const existingUser = await this.prisma.user.findUnique({
          where: { email },
      });

      if (existingUser) {
          throw new ConflictException('Identifiants invalides');
      }

      const hashPassword = await this.hashPassword({ password });

      const createdUser = await this.prisma.user.create({
          data: { email, name, password: hashPassword },
      });

      const token = this.authenticateUser({ userId: createdUser.id, role: 'user' });

      // Vérifier si l'email est bien envoyé
      const emailSent = await sendEmail(name, email, token );
      if (!emailSent) {
          console.error("Échec de l'envoi de l'email, l'utilisateur a été créé mais sans confirmation.");
      }

      try {
        // Hacher le token avant de l'enregistrer
        const hashedToken = await this.hashToken({ token });

        // Enregistrer le token dans la table Token
        await this.prisma.token.create({
            data: {
                token: hashedToken,    // Le token haché
                userId: createdUser.id,  // Associer le token à l'utilisateur créé
                used: false,  // Le token n'a pas encore été utilisé
            },
        });
    } catch (error) {
        console.error("Erreur lors de l'enregistrement du token:", error);
    }

      return token;
  }

  private async hashToken({ token }: { token: any }) {
    return await hash(token, 10);
  }

  private async hashPassword({ password }: { password: string }) {
    return await hash(password, 10);
  }

  private isPasswordValid({
    password,
    hashPassword,
  }: {
    password: string;
    hashPassword: string;
  }) {
    return compare(password, hashPassword);
  }

  private isTokenValid({
    token,
    hashPassword,
  }) {
    return compare(token, hashPassword);
  }

  private authenticateUser({ userId, role }: UserPayload) {
    const payload: UserPayload = { userId, role };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async updateUser(userId: string, updateData: UpdateUserDto) {
    // Vérifier si l'utilisateur existe
    const userExists = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!userExists) {
      throw new NotFoundException('Utilisateur introuvable.');
    }

    // Mettre à jour l'utilisateur
    return await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
    });
  }

  async updateUserConfirmation(userId: string, confirmed: boolean) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { confirmed: confirmed },
    });
  }

  async validateToken(token: string, userId: string): Promise<boolean> {

    const tokenRecord = await this.prisma.token.findFirst({
      where: { userId },
    });

    if (!tokenRecord) throw new BadRequestException('Utilisateur non trouvé');

    
    const isTokenSame = await this.isTokenValid({
      token,
      hashPassword: tokenRecord.token,
    });

    if (!isTokenSame) {
      throw new UnauthorizedException('Identifiants invalides');
    }
    
    const now = new Date();
    const tokenAge = (now.getTime() - tokenRecord.createdAt.getTime()) / (1000 * 60);

    if (tokenRecord.used || tokenAge > 15) {
      await this.prisma.token.delete({ where: { id: tokenRecord.id } });
      throw new BadRequestException('Token expiré ou déjà utilisé');
    }

    // Marquer le token comme utilisé
    await this.prisma.token.update({
      where: { id: tokenRecord.id },
      data: { used: true },
    });

    return true;
  }

}

