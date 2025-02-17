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
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
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

  // @Put(':id')
  // update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
  //   return this.productService.update(id, updateProductDto);
  // }

  @Put(':id')
  @UseInterceptors(
    FilesInterceptor('images', 5, {
      storage: diskStorage({
        destination: './', // Le dossier où les fichiers seront stockés
        filename: (req, file, cb) => {
          const uniqueSuffix = uuidv4() + extname(file.originalname);
          cb(null, uniqueSuffix); // Nom unique généré pour chaque fichier
        },
      }),
      fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png/;
        const ext = allowedTypes.test(extname(file.originalname).toLowerCase());
        const mime = allowedTypes.test(file.mimetype);

        if (ext && mime) {
          cb(null, true); // Fichier accepté
        } else {
          cb(new Error('Type de fichier non supporté'), false); // Fichier non accepté
        }
      },
    }),
  )
  update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @UploadedFiles() files: Express.Multer.File[], // Capture les fichiers envoyés
  ) {
    const uploadedFilePaths: string[] = files.map((file) => file.filename);

    return this.productService.update({
      id,
      updateProductDto,
      images: uploadedFilePaths,
    });
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productService.remove(id);
  }
}
