import { Transform, Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsOptional,
  IsArray,
  IsIn,
  MaxLength,
  Min,
} from 'class-validator';
import { HasMimeType, IsFile } from 'nestjs-form-data';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty({ message: 'Le nom du produit est obligatoire.' })
  @MaxLength(100, {
    message: 'Le nom du produit ne doit pas dépasser 100 caractères.',
  })
  name: string;

  @Type(() => Number) // Transforme la chaîne en nombre
  @IsNumber(
    { allowNaN: false, allowInfinity: false },
    { message: 'Le prix doit être un nombre valide.' },
  )
  @IsPositive({ message: 'Le prix doit être un nombre positif.' })
  price: number;

  @Type(() => Number) // Transforme la chaîne en nombre
  @IsNumber(
    { allowNaN: false, allowInfinity: false },
    { message: 'L’ancien prix doit être un nombre valide.' },
  )
  @IsOptional()
  @Min(0, { message: 'L’ancien prix doit être supérieur ou égal à 0.' })
  oldPrice?: number;

  @IsString()
  @IsNotEmpty({ message: 'La catégorie est obligatoire.' })
  @IsIn(
    [
      'Autres',
      'Portes',
      'Chaises',
      'Tables',
      'Décorations',
      'Mobilier intérieur',
      'Mobilier extérieur',
    ],
    {
      message:
        'La catégorie doit être une valeur valide : Portes, Fenêtres, Mobiliers, Décoration.',
    },
  )
  category: string;

  @IsNumber()
  @IsOptional()
  rating?: number;

  @IsNumber()
  @IsOptional()
  reviews?: number;

  @IsString()
  @IsNotEmpty({ message: 'La description est obligatoire.' })
  @MaxLength(1000, {
    message: 'La description ne doit pas dépasser 1000 caractères.',
  })
  description: string;

  @IsArray({ message: 'Les fonctionnalités doivent être un tableau.' })
  @IsString({
    each: true,
    message: 'Chaque fonctionnalité doit être une chaîne valide.',
  })
  @Transform(({ value }) => {
    // Si la valeur est une chaîne, on la convertit en tableau
    if (typeof value === 'string') {
      return value.split(',').map((feature) => feature.trim());
    }
    // Si la valeur est déjà un tableau, on le retourne tel quel
    if (Array.isArray(value)) {
      return value.map((feature) => feature.trim());
    }
    // Sinon, on retourne un tableau vide ou lève une erreur
    return [];
  })
  features: string[];

  @IsArray()
  @IsFile({ each: true })
  @HasMimeType(['image/jpeg', 'image/png', 'image/jpg'], { each: true })
  images: any[];

}
