import { IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class LoginDto {
  /**
   * Adresse email de l'utilisateur.
   * Validation :
   * - Doit être une adresse email valide.
   * - Longueur minimale : 5 caractères.
   * - Longueur maximale : 50 caractères.
   * - Rejette les adresses provenant de domaines temporaires.
   */
  @IsString({ message: "L'email doit être une chaîne de caractères." })
  @MinLength(5, { message: "L'email doit comporter au moins 5 caractères." })
  @MaxLength(50, { message: "L'email ne peut pas dépasser 50 caractères." })
  email: string;

  /**
   * Mot de passe de l'utilisateur.
   * Validation :
   * - Doit être une chaîne de caractères.
   * - Longueur minimale : 8 caractères.
   * - Longueur maximale : 32 caractères.
   * - Doit inclure au moins une majuscule, une minuscule, un chiffre et un caractère spécial.
   */
  @IsString({ message: 'Le mot de passe doit être une chaîne de caractères.' })
  @MinLength(8, {
    message: 'Le mot de passe doit comporter au moins 8 caractères.',
  })
  @MaxLength(32, {
    message: 'Le mot de passe ne peut pas dépasser 32 caractères.',
  })
  @Matches(/(?=.*[a-z])/, {
    message: 'Le mot de passe doit contenir au moins une lettre minuscule.',
  })
  @Matches(/(?=.*[A-Z])/, {
    message: 'Le mot de passe doit contenir au moins une lettre majuscule.',
  })
  @Matches(/(?=.*\d)/, {
    message: 'Le mot de passe doit contenir au moins un chiffre.',
  })
  @Matches(/(?=.*[@$!%*?&])/, {
    message:
      'Le mot de passe doit contenir au moins un caractère spécial (@, $, !, %, *, ?, &).',
  })
  password: string;
}
