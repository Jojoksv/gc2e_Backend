import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import path, { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import { diskStorage, memoryStorage } from 'multer';

@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @UseInterceptors(
    FilesInterceptor('images', 5, {
      storage: memoryStorage(), // Stockage temporaire en mémoire
      fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png/;
        const ext = allowedTypes.test(extname(file.originalname).toLowerCase());
        const mime = allowedTypes.test(file.mimetype);

        if (ext && mime) {
          cb(null, true);
        } else {
          cb(new Error('Type de fichier non supporté'), false);
        }
      },
    }),
  )
  async create(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() createProductDto: CreateProductDto,
  ) {
    console.log(files, createProductDto);
    // Étape 1 : Validation de la DTO
    const errors = await this.validateDto(createProductDto);
    if (errors.length > 0) {
      throw new BadRequestException({ message: 'Validation échouée', errors });
    }

    // Étape 2 : Enregistrer les fichiers après validation
    const uploadedFilePaths: string[] = [];
    try {
      files.forEach((file) => {
        const uniqueSuffix = uuidv4() + extname(file.originalname);
        const uploadPath = path.join('./tmp/uploads', uniqueSuffix);

        // Sauvegarde du fichier sur disque
        fs.writeFileSync(uploadPath, file.buffer);
        uploadedFilePaths.push(uniqueSuffix);
      });

      // Étape 3 : Appeler le service pour créer le produit
      return await this.productService.createProduct({
        createProductDto,
        images: uploadedFilePaths,
      });
    } catch (error) {
      // Supprimer les fichiers déjà enregistrés en cas d'erreur
      uploadedFilePaths.forEach((filePath) => {
        const fullPath = path.join('./tmp/uploads', filePath);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      });
      throw new BadRequestException(
        "Erreur lors de l'enregistrement des fichiers",
        error.message,
      );
    }
  }

  private async validateDto(dto: CreateProductDto): Promise<string[]> {
    // Remplacez cette logique par la validation réelle de votre DTO
    const errors: string[] = [];
    if (!dto.name) {
      errors.push('Le nom du produit est requis.');
    }
    if (!dto.price || isNaN(dto.price)) {
      errors.push('Le prix doit être un nombre valide.');
    }
    return errors;
  }

  @Get()
  findAll() {
    return this.productService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productService.findOne(id);
  }

  @Put(':id')
  @UseInterceptors(
    FilesInterceptor('images', 5, {
      storage: diskStorage({
        destination: './tmp/uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix = uuidv4() + extname(file.originalname);
          cb(null, uniqueSuffix);
        },
      }),
      fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png/;
        const ext = allowedTypes.test(extname(file.originalname).toLowerCase());
        const mime = allowedTypes.test(file.mimetype);

        if (ext && mime) {
          cb(null, true);
        } else {
          cb(new Error('Type de fichier non supporté'), false);
        }
      },
    }),
  )
  async update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    console.log('ID reçu:', id);
    console.log('Données reçues:', updateProductDto);
    console.log('Fichiers reçus:', files);

    try {
      // 1️⃣ Récupérer l’ancien produit et ses images
      const existingProduct = await this.productService.findOne(id);
      const oldImages: string[] = existingProduct.data.images || [];

      // 2️⃣ Récupérer les nouvelles images (celles déjà en base et celles envoyées)
      const updatedImages = [...(updateProductDto.images || [])];

      // 3️⃣ Ajouter les nouveaux fichiers uploadés
      files.forEach((file) => {
        updatedImages.push(file.filename); // On ajoute seulement le nom du fichier
      });

      // 4️⃣ Supprimer les images qui ne sont plus présentes
      const filesToDelete = oldImages.filter((img) => !updatedImages.includes(img));

      filesToDelete.forEach((file) => {
        const filePath = path.join('./tmp/uploads', file);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });

      // 5️⃣ Vérification des données
      if (!updateProductDto || Object.keys(updateProductDto).length === 0) {
        throw new BadRequestException('Les données de mise à jour sont vides.');
      }

      // 6️⃣ Mise à jour du produit
      return await this.productService.update({
        id,
        updateProductDto,
        images: updatedImages, // On enregistre toutes les images mises à jour
      });

    } catch (error) {
      console.error("Erreur lors de l'update:", error);

      // Suppression des fichiers en cas d'erreur
      files.forEach((file) => {
        const filePath = path.join('./tmp/uploads', file.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });

      throw new BadRequestException(
        "Erreur lors de la mise à jour du produit",
        error.message,
      );
    }
  }


  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productService.remove(id);
  }
}
