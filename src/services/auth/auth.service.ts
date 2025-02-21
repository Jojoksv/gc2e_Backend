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
<<<<<<< HEAD
=======
import * as brevo from '@getbrevo/brevo';
>>>>>>> fa80b37 (Setting email)

const limiter = new RateLimiterMemory({
  points: 5,
  duration: 10,
});

// const client = new brevo.TransactionalEmailsApi();
// client.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY2);

// const client = new brevo.ApiClient();

const client = new brevo.TransactionalEmailsApi();
client.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY2);


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

    (async () => {
      const result = await this.sendEmail(name, email);
      if(result){
          return { message: 'Email enregistré. Vous allez recevoir un email de confirmation de la structure organisatrice, ESMT BURKINA!' }
      } else {
          return { message: 'Erreur durant la soumission du formulaire' }
      };
  })();

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

  sendEmail = async (name: string, email: string): Promise<boolean> => {

    const emailContent: string = `
        <html lang="fr">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Confirmation d'inscription</title>
            </head>
            <body>
                <h2>Confirmation d'inscription</h2>
                <p>Cher(e) ${name},</p>
                <p>Votre inscription a bien été enregistrée. Veuillez s'il vous plait cliquer sur oui pour confirmer votre inscription de façon définitive.</p>
                
                <div class="mt-6 text-center text-sm text-gray-500">
                    <p>Merci de votre confiance.</p>
                    <p>© 2024 {{ params.sender }}. Tous droits réservés.</p>
                </div>
            </body>
        </html>
    `;

    interface SendEmailParams {
        name: string;
        email: string;
        subject: string;
        content: string;
    }

    const sendEmailToME = async ({ name, email, subject, content }: SendEmailParams): Promise<boolean> => {
        try {
            const response = await client.transactionalEmailsApi({
                sender: { name: process.env.USER_NAME, email: process.env.USER_EMAIL },
                to: [{ email: email, name: name }],
                htmlContent: content,
                subject: subject,
                params: { sender: process.env.USER_NAME },
            });
            return true;
        } catch (error) {
            console.error("Email sending error:", error);
            return false;
        }
    };

    const subject: string = "Confirmation d'inscription !";

    // Envoi de l'email avec les détails des utilisateurs
    const result: boolean = await sendEmailToME({ name: name, email: email, subject, content: emailContent });

    if (result) {
        console.log("Email envoyé avec succès !");
    } else {
        console.error("Erreur lors de l'envoi de l'email !");
    }

    return result;
};

}
