import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductCategory } from '../entities/product-category.entity';
import { CreateProductCategoryDto, UpdateProductCategoryDto } from '../dto/product-category.dto';

@Injectable()
export class ProductCategoryService {
  constructor(
    @InjectRepository(ProductCategory)
    private categoryRepository: Repository<ProductCategory>,
  ) {}

  async create(dto: CreateProductCategoryDto): Promise<ProductCategory> {
    const category = this.categoryRepository.create(dto);
    return this.categoryRepository.save(category);
  }

  async findAll(): Promise<ProductCategory[]> {
    return this.categoryRepository.find({
      order: { sort: 'ASC', createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<ProductCategory> {
    const category = await this.categoryRepository.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException('商品分类不存在');
    }
    return category;
  }

  async update(id: string, dto: UpdateProductCategoryDto): Promise<ProductCategory> {
    const category = await this.findOne(id);
    Object.assign(category, dto);
    return this.categoryRepository.save(category);
  }

  async remove(id: string): Promise<void> {
    const category = await this.findOne(id);
    await this.categoryRepository.remove(category);
  }

  async findByParent(parentId: string | null): Promise<ProductCategory[]> {
    const where = parentId ? { parentId } : { parentId: null as any };
    return this.categoryRepository.find({
      where,
      order: { sort: 'ASC' },
    });
  }

  async getTree(): Promise<any[]> {
    const all = await this.findAll();
    const buildTree = (parentId: string | null): any[] => {
      return all
        .filter(item => item.parentId === parentId)
        .map(item => ({
          ...item,
          children: buildTree(item.id),
        }));
    };
    return buildTree(null);
  }
}
