import {
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

const limiter = new RateLimiterMemory({
  points: 5,
  duration: 10,
});

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

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
      where: {
        email: email,
      },
    });

    if (existingUser) {
      throw new ConflictException('Identifiants invalides');
    }

    const hashPassword = await this.hashPassword({ password });

    const createdUser = await this.prisma.user.create({
      data: {
        email,
        name,
        password: hashPassword,
      },
    });

    return this.authenticateUser({
      userId: createdUser.id,
      role: 'user',
    });
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
}
