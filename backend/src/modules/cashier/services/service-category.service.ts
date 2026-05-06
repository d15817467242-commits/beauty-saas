import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { ServiceCategory } from '../entities/service-category.entity';
import { CreateServiceCategoryDto, UpdateServiceCategoryDto } from '../dto/service-category.dto';

@Injectable()
export class ServiceCategoryService {
  constructor(
    @InjectRepository(ServiceCategory)
    private categoryRepository: Repository<ServiceCategory>,
  ) {}

  async create(dto: CreateServiceCategoryDto): Promise<ServiceCategory> {
    const category = this.categoryRepository.create(dto);
    return this.categoryRepository.save(category);
  }

  async findAll(): Promise<ServiceCategory[]> {
    return this.categoryRepository.find({
      order: { sort: 'ASC', createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<ServiceCategory> {
    const category = await this.categoryRepository.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException('服务分类不存在');
    }
    return category;
  }

  async update(id: string, dto: UpdateServiceCategoryDto): Promise<ServiceCategory> {
    const category = await this.findOne(id);
    Object.assign(category, dto);
    return this.categoryRepository.save(category);
  }

  async remove(id: string): Promise<void> {
    const category = await this.findOne(id);
    await this.categoryRepository.remove(category);
  }

  async findByParent(parentId: string | null): Promise<ServiceCategory[]> {
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
