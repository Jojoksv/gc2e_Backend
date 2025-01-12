import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { PrismaService } from '../prisma.service';
import { NestjsFormDataModule, MemoryStoredFile } from 'nestjs-form-data';
import { Module } from '@nestjs/common';

@Module({
  controllers: [ProductController],
  imports: [
    NestjsFormDataModule.config({
      storage: MemoryStoredFile,
    }),
  ],
  providers: [ProductService, PrismaService],
})
export class ProductModule {}
