import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { ServiceCategoryEntity } from './service-category.entity';
import { CreateServiceCategoryDto } from './dto/create-service-category.dto';
import { UpdateServiceCategoryDto } from './dto/update-service-category.dto';

@Injectable()
export class ServiceCategoryService {
  constructor(
    @InjectRepository(ServiceCategoryEntity)
    private categoryRepository: Repository<ServiceCategoryEntity>,
  ) {}

  async create(createCategoryDto: CreateServiceCategoryDto): Promise<ServiceCategoryEntity> {
    // 检查编码是否已存在
    if (createCategoryDto.code) {
      const existing = await this.categoryRepository.findOne({ 
        where: { code: createCategoryDto.code } 
      });
      if (existing) {
        throw new BadRequestException('分类编码已存在');
      }
    }

    // 检查父分类是否存在
    if (createCategoryDto.parentId) {
      const parent = await this.categoryRepository.findOne({ 
        where: { id: createCategoryDto.parentId } 
      });
      if (!parent) {
        throw new NotFoundException('父分类不存在');
      }
    }

    const category = this.categoryRepository.create(createCategoryDto);
    return this.categoryRepository.save(category);
  }

  async findAll(includeInactive = false): Promise<ServiceCategoryEntity[]> {
    const query = this.categoryRepository.createQueryBuilder('category')
      .leftJoinAndSelect('category.services', 'service');

    if (!includeInactive) {
      query.where('category.isActive IN (:...activeValues)', { activeValues: ['1', 1, 'true'] });
    }

    return query.orderBy('category.sort', 'ASC').addOrderBy('category.createdAt', 'DESC').getMany();
  }

  async findTree(): Promise<ServiceCategoryEntity[]> {
    const allCategories = await this.categoryRepository.find({
      order: { sort: 'ASC', createdAt: 'DESC' },
    });

    // 构建树形结构
    const rootCategories = allCategories.filter(c => !c.parentId);
    const buildTree = (parent: ServiceCategoryEntity) => {
      const children = allCategories.filter(c => c.parentId === parent.id);
      (parent as any).children = children.map(buildTree);
      return parent;
    };

    return rootCategories.map(buildTree);
  }

  async findOne(id: string): Promise<ServiceCategoryEntity> {
    const category = await this.categoryRepository.findOne({ 
      where: { id },
      relations: ['services'],
    });
    
    if (!category) {
      throw new NotFoundException('服务分类不存在');
    }
    
    return category;
  }

  async update(id: string, updateCategoryDto: UpdateServiceCategoryDto): Promise<ServiceCategoryEntity> {
    const category = await this.findOne(id);

    // 检查编码是否被其他分类使用
    if (updateCategoryDto.code && updateCategoryDto.code !== category.code) {
      const existing = await this.categoryRepository.findOne({ 
        where: { code: updateCategoryDto.code } 
      });
      if (existing && existing.id !== id) {
        throw new BadRequestException('分类编码已存在');
      }
    }

    // 检查父分类
    if (updateCategoryDto.parentId) {
      if (updateCategoryDto.parentId === id) {
        throw new BadRequestException('不能将自己设为父分类');
      }
      const parent = await this.categoryRepository.findOne({ 
        where: { id: updateCategoryDto.parentId } 
      });
      if (!parent) {
        throw new NotFoundException('父分类不存在');
      }
    }

    Object.assign(category, updateCategoryDto);
    return this.categoryRepository.save(category);
  }

  async remove(id: string): Promise<void> {
    const category = await this.findOne(id);

    // 检查是否有子分类
    const children = await this.categoryRepository.find({ 
      where: { parentId: id } 
    });
    if (children.length > 0) {
      throw new BadRequestException('该分类下有子分类，无法删除');
    }

    // 检查是否有关联的服务
    if (category.services && category.services.length > 0) {
      throw new BadRequestException('该分类下有服务项目，无法删除');
    }

    await this.categoryRepository.remove(category);
  }

  async updateSort(id: string, sort: number): Promise<ServiceCategoryEntity> {
    const category = await this.findOne(id);
    category.sort = sort;
    return this.categoryRepository.save(category);
  }

  async toggleActive(id: string): Promise<ServiceCategoryEntity> {
    const category = await this.findOne(id);
    category.isActive = !category.isActive;
    return this.categoryRepository.save(category);
  }
}
