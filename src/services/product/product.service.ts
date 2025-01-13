import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ProductService {
  constructor(private readonly prisma: PrismaService) {}

  async createProduct({
    createProductDto,
    images,
  }: {
    createProductDto: CreateProductDto;
    images: any;
  }) {
    const {
      name,
      price,
      oldPrice,
      category,
      rating = 0,
      reviews = 0,
      description,
      features,
    } = createProductDto;

    // Validation métier : vérifier si le produit existe déjà
    const existingProduct = await this.prisma.product.findUnique({
      where: {
        name,
      },
    });

    if (existingProduct) {
      throw new BadRequestException('Un produit avec ce nom existe déjà.');
    }

    // Utilisation d'une transaction Prisma pour garantir la cohérence
    const product = await this.prisma.$transaction(async (tx) => {
      return tx.product.create({
        data: {
          name,
          price,
          oldPrice,
          category,
          rating,
          reviews,
          description,
          features,
          images: { set: images },
        },
      });
    });

    return {
      message: 'Produit créé avec succès.',
      product,
    };
  }

  async findAll() {
    try {
      const products = await this.prisma.product.findMany({
        orderBy: {
          createdAt: 'asc',
        },
      });
      return {
        message: 'All products retrieved successfully',
        data: products,
      };
    } catch (error) {
      throw new Error(`Error retrieving products: ${error.message}`);
    }
  }

  // Méthode pour récupérer un produit par ID
  async findOne(id: string) {
    try {
      const product = await this.prisma.product.findUnique({
        where: { id },
      });

      if (!product) {
        throw new NotFoundException(`Product with ID ${id} not found`);
      }

      return {
        message: 'Product retrieved successfully',
        data: product,
      };
    } catch (error) {
      throw new Error(`Error retrieving product: ${error.message}`);
    }
  }

  // Méthode pour mettre à jour un produit
  async update({
    id,
    updateProductDto,
    images,
  }: {
    id: string;
    updateProductDto: UpdateProductDto;
    images: any;
  }) {
    const {
      name,
      price,
      oldPrice,
      category,
      rating = 0,
      reviews = 0,
      description,
      features,
    } = updateProductDto;

    try {
      const product = await this.prisma.product.findUnique({
        where: { id },
      });

      if (!product) {
        throw new NotFoundException(`Product with ID ${id} not found`);
      }

      const updatedProduct = await this.prisma.product.update({
        where: { id },
        data: {
          name,
          price,
          oldPrice,
          category,
          rating,
          reviews,
          description,
          features,
          images: { set: images },
        },
      });

      return {
        message: 'Product updated successfully',
        data: updatedProduct,
      };
    } catch (error) {
      throw new Error(`Error updating product: ${error.message}`);
    }
  }

  // Méthode pour supprimer un produit
  async remove(id: string) {
    try {
      const product = await this.prisma.product.findUnique({
        where: { id },
      });

      if (!product) {
        throw new NotFoundException(`Product with ID ${id} not found`);
      }

      await this.prisma.product.delete({
        where: { id },
      });

      return {
        message: 'Product deleted successfully',
      };
    } catch (error) {
      throw new Error(`Error deleting product: ${error.message}`);
    }
  }
}
