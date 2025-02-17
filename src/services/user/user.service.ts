import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService,
  ) {}

  async getUser({ userId }: { userId: string }) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    return user;
  }

  async findAll() {
    try {
      return await this.prisma.user.findMany();
    } catch (error) {
      throw new Error('Erreur lors de la récupération des utilisateurs');
    }
  }
}
