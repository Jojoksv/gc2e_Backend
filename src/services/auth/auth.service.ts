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
// import sendEmail from './email.service.js';
import * as cron from 'node-cron';
import * as dotenv from 'dotenv';

dotenv.config();
import Brevo from 'sib-api-v3-sdk';

const defaultClient = Brevo.ApiClient.instance;

console.log("Début de l'initialisation de l'API Key...");
  
  if (defaultClient.authentications && defaultClient.authentications['api-key']) {
    console.log("API Key trouvée : ", defaultClient.authentications['api-key']);
    defaultClient.authentications['api-key'].apiKey = process.env.BREVO_API_KEY2;
    console.log("API Key assignée avec succès.");
  } else {
    console.log("Erreur: Impossible d'initialiser l'API Key.");
  }
  
  
  // Création de l'instance API
  const apiInstance = new Brevo.TransactionalEmailsApi();
  






















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
          role: { not: "admin" },
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
      const emailSent = await this.sendEmail(name, email, token.access_token );
      if (!emailSent) {
          console.error("Échec de l'envoi de l'email, l'utilisateur a été créé mais sans confirmation.");
      }

      try {
        // Hacher le token avant de l'enregistrer
        const hashedToken = await this.hashToken({ token: token.access_token });

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

    return { message: "Inscription réussie" };
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
    try {
      console.log('[VALIDATE TOKEN] Vérification du token pour userId:', userId);
  
      // Récupérer le token en base de données
      const tokenRecord = await this.prisma.token.findFirst({
        where: { userId },
      });
  
      if (!tokenRecord) {
        console.error('[VALIDATE TOKEN] Aucun token trouvé pour userId:', userId);
        throw new BadRequestException('Utilisateur non trouvé');
      }
  
      console.log('[VALIDATE TOKEN] Token trouvé:', tokenRecord);
  
      // Comparer le token fourni avec celui stocké
      const isTokenSame = await this.isTokenValid({
        token,
        hashPassword: tokenRecord.token,
      });
  
      if (!isTokenSame) {
        console.error('[VALIDATE TOKEN] Token invalide pour userId:', userId);
        throw new UnauthorizedException('Identifiants invalides');
      }
  
      // Vérifier l'expiration du token
      const now = new Date();
      const tokenAge = (now.getTime() - tokenRecord.createdAt.getTime()) / (1000 * 60);
      console.log('[VALIDATE TOKEN] Âge du token (minutes):', tokenAge);
  
      if (tokenRecord.used || tokenAge > 45) {
        console.warn('[VALIDATE TOKEN] Token expiré ou déjà utilisé pour userId:', userId);
  
        await this.prisma.token.delete({ where: { id: tokenRecord.id } });
        throw new BadRequestException('Token expiré ou déjà utilisé');
      }
  
      // Marquer le token comme utilisé
      await this.prisma.token.update({
        where: { id: tokenRecord.id },
        data: { used: true },
      });
  
      console.log('[VALIDATE TOKEN] Token validé et marqué comme utilisé pour userId:', userId);
      return true;
  
    } catch (error) {
      console.error('[VALIDATE TOKEN] Erreur:', error.message);
      throw error;
    }
  }

  async sendEmail(name, email, access_token) {
      const backendUrl = `${process.env.BACKEND_URL}/auth`;
  
      const emailContent = `
        <html lang="fr">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Confirmation d'inscription</title>
    <style>
      body {
        font-family: 'Arial', sans-serif;
        text-align: center;
        padding: 40px 20px;
        background-color: #f9f9f9;
        color: #333;
      }
      .container {
        background: #ffffff;
        padding: 25px;
        border-radius: 8px;
        box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.08);
        max-width: 500px;
        margin: auto;
      }
      h2 {
        color: #2c3e50;
        margin-bottom: 10px;
      }
      p {
        font-size: 16px;
        color: #555;
        line-height: 1.6;
      }
      .btn-container {
        margin-top: 25px;
      }
      .btn {
        display: inline-block;
        padding: 12px 20px;
        font-size: 16px;
        color: #fff;
        border-radius: 6px;
        text-decoration: none;
        font-weight: bold;
        margin: 10px;
        transition: all 0.3s ease;
      }
      .btn-yes {
        background-color: #3a7d44;
      }
      .btn-yes:hover {
        background-color: #2e6034;
      }
      .btn-no {
        background-color: #8c979d;
      }
      .btn-no:hover {
        background-color: #757d83;
      }
      .footer {
        margin-top: 20px;
        font-size: 14px;
        color: #777;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h2>Bienvenue parmi nous, ${name} !</h2>
      <p>
        Nous sommes ravis de vous compter parmi nous. Votre inscription a bien été enregistrée.
      </p>
      <p>
        Afin de finaliser votre inscription, nous vous invitons à confirmer votre participation en cliquant sur l'un des boutons ci-dessous :
      </p>
  
      <div class="btn-container">
        <a href="${backendUrl}/confirm-subscription?token=${access_token}&confirmed=true" class="btn btn-yes">Oui, je confirme</a>
        <a href="${backendUrl}/confirm-subscription?token=${access_token}&confirmed=false" class="btn btn-no">Non, annuler</a>
      </div>
  
      <p class="footer">
        Si vous avez des questions, n’hésitez pas à nous contacter.<br>
        Merci et à bientôt !
      </p>
    </div>
  </body>
  </html>
      `;
    
      const sendEmailToME = async (name, email, subject, content) => {
        try {
          const response = await apiInstance.sendTransacEmail({
            sender: { name: process.env.USER_NAME, email: process.env.USER_EMAIL },
            to: [{ email, name }],
            htmlContent: content,
            subject: subject,
            params: { sender: process.env.USER_NAME },
          });
          return true;
        } catch (error) {
          console.error("Erreur envoi email :", error);
          return false;
        }
      };
    
      const subject = "Confirmation d'inscription";
      const result = await sendEmailToME(name, email, subject, emailContent);
    
      return result;
  }

}

