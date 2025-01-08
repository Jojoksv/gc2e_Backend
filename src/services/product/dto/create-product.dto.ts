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
  Max,
  ArrayMinSize,
} from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty({ message: 'Le nom du produit est obligatoire.' })
  @MaxLength(100, {
    message: 'Le nom du produit ne doit pas dépasser 100 caractères.',
  })
  name: string;

  @IsNumber(
    { allowNaN: false, allowInfinity: false },
    { message: 'Le prix doit être un nombre valide.' },
  )
  @IsPositive({ message: 'Le prix doit être un nombre positif.' })
  price: number;

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

  @IsNumber(
    { allowNaN: false, allowInfinity: false },
    { message: 'La note doit être un nombre valide.' },
  )
  @Min(0, { message: 'La note minimale est 0.' })
  @Max(5, { message: 'La note maximale est 5.' })
  rating: number;

  @IsNumber(
    { allowNaN: false, allowInfinity: false },
    { message: 'Le nombre d’avis doit être un entier valide.' },
  )
  @Min(0, { message: 'Le nombre d’avis doit être au minimum 0.' })
  reviews: number;

  @IsString()
  @IsNotEmpty({ message: 'La description est obligatoire.' })
  @MaxLength(1000, {
    message: 'La description ne doit pas dépasser 1000 caractères.',
  })
  description: string;

  @IsArray({
    message: 'Les fonctionnalités doivent être un tableau de chaînes.',
  })
  @ArrayMinSize(1, { message: 'Au moins une fonctionnalité est requise.' })
  @IsString({
    each: true,
    message: 'Chaque fonctionnalité doit être une chaîne valide.',
  })
  features: string[];

  @IsArray({ message: 'Les images doivent être un tableau de chaînes.' })
  @ArrayMinSize(1, { message: 'Au moins une image est requise.' })
  @IsString({
    each: true,
    message:
      'Chaque image doit être une chaîne valide représentant un chemin ou une URL.',
  })
  @IsOptional()
  images?: string[];
}
