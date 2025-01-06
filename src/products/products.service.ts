import { HttpStatus, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaClient } from '@prisma/client';
import { PaginationDto } from 'src/common';
import { RpcException } from '@nestjs/microservices';

@Injectable()
export class ProductsService extends PrismaClient implements OnModuleInit {

  private readonly logger = new Logger(ProductsService.name);

  onModuleInit() {
    this.$connect();
    this.logger.log('Connected to the database');
  }

  create(createProductDto: CreateProductDto) {

    return this.product.create({
      data: createProductDto
    });
  }

  async findAll(paginationDto: PaginationDto) {

    const { page, limit } = paginationDto; 

    const totalPages = await this.product.count({ where: { isDeleted: false } });

    const lastPage = Math.ceil(totalPages / limit);
    
    const data = await this.product.findMany({
      skip: (page - 1) * limit,
      take: limit,
      where: { isDeleted: false }
    });

    return {
      data: data,
      metadata: {
        page: page,
        limit: limit,
        lastPage: lastPage,
        total: totalPages
      },
    };
  }

  async findOne(id: number) {
    
    const product = await this.product.findFirst({
      where: { 
        id: id, 
        isDeleted: false 
      }
    });

    if (!product) {
      //throw new NotFoundException(`Product with id ${id} not found`);
      throw new RpcException({
        message: `Product with id ${id} not found`,
        status: HttpStatus.BAD_REQUEST
      });
    }

    return product;
  }

  async update(updateProductDto: UpdateProductDto) {

    const { id, ...data } = updateProductDto;

    await this.findOne(id);

    return this.product.update({
      where: { id: id },
      data: data,
    });
  }

  async remove(id: number) {

    await this.findOne(id);
    
    const product = await this.product.update({
      where: { id: id },
      data: {
        isDeleted: true
      }
    });

    return product;
  }
}
