import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Service, ServiceCategory } from './service.entity';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Injectable()
export class ServiceService {
  constructor(
    @InjectRepository(Service)
    private serviceRepository: Repository<Service>,
  ) {}

  async create(createServiceDto: CreateServiceDto): Promise<Service> {
    // 检查编码是否已存在
    if (createServiceDto.code) {
      const existing = await this.serviceRepository.findOne({ 
        where: { code: createServiceDto.code } 
      });
      if (existing) {
        throw new BadRequestException('服务编码已存在');
      }
    }

    // 确保 category 有默认值
    const data = {
      ...createServiceDto,
      category: (createServiceDto.category || 'other') as ServiceCategory
    };

    const service = this.serviceRepository.create(data as any);
    return this.serviceRepository.save(service as any) as Promise<Service>;
  }

  async findAll(
    category?: ServiceCategory, 
    isActive?: boolean,
    categoryId?: string,
    keyword?: string,
    page = 1,
    limit = 10,
  ): Promise<{ data: Service[]; total: number }> {
    const query = this.serviceRepository.createQueryBuilder('service');
    
    if (category) {
      query.andWhere('service.category = :category', { category });
    }
    
    if (isActive !== undefined) {
      query.andWhere('service.isActive = :isActive', { isActive });
    }

    if (categoryId) {
      query.andWhere('service.categoryId = :categoryId', { categoryId });
    }

    if (keyword) {
      query.andWhere('(service.name LIKE :keyword OR service.code LIKE :keyword OR service.description LIKE :keyword)', 
        { keyword: `%${keyword}%` }
      );
    }
    
    query.orderBy('service.sort', 'ASC')
      .addOrderBy('service.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await query.getManyAndCount();
    return { data, total };
  }

  async findOne(id: string): Promise<Service> {
    const service = await this.serviceRepository.findOne({ where: { id } });
    
    if (!service) {
      throw new NotFoundException('服务项目不存在');
    }
    
    return service;
  }

  async findByCode(code: string): Promise<Service> {
    const service = await this.serviceRepository.findOne({ where: { code } });
    
    if (!service) {
      throw new NotFoundException('服务项目不存在');
    }
    
    return service;
  }

  async update(id: string, updateServiceDto: UpdateServiceDto): Promise<Service> {
    const service = await this.findOne(id);

    // 检查编码是否被其他服务使用
    if (updateServiceDto.code && updateServiceDto.code !== service.code) {
      const existing = await this.serviceRepository.findOne({ 
        where: { code: updateServiceDto.code } 
      });
      if (existing && existing.id !== id) {
        throw new BadRequestException('服务编码已存在');
      }
    }

    Object.assign(service, updateServiceDto);
    return this.serviceRepository.save(service);
  }

  async remove(id: string): Promise<void> {
    const service = await this.findOne(id);
    await this.serviceRepository.remove(service);
  }

  async updateSort(id: string, sort: number): Promise<Service> {
    const service = await this.findOne(id);
    service.sort = sort;
    return this.serviceRepository.save(service);
  }

  async toggleActive(id: string): Promise<Service> {
    const service = await this.findOne(id);
    service.isActive = !service.isActive;
    return this.serviceRepository.save(service);
  }

  // 批量导入
  async batchImport(services: CreateServiceDto[]): Promise<{ success: number; failed: number; errors: string[] }> {
    const errors: string[] = [];
    let success = 0;
    let failed = 0;

    for (let i = 0; i < services.length; i++) {
      try {
        const serviceDto = services[i];
        
        // 检查编码是否已存在
        if (serviceDto.code) {
          const existing = await this.serviceRepository.findOne({ 
            where: { code: serviceDto.code } 
          });
          if (existing) {
            errors.push(`第${i + 1}条: 编码 ${serviceDto.code} 已存在`);
            failed++;
            continue;
          }
        }

        const service = this.serviceRepository.create(serviceDto as any);
        await this.serviceRepository.save(service as any);
        success++;
      } catch (error) {
        errors.push(`第${i + 1}条: ${error.message}`);
        failed++;
      }
    }

    return { success, failed, errors };
  }

  // 批量导出
  async batchExport(
    category?: ServiceCategory,
    isActive?: boolean,
    categoryId?: string,
    ids?: string[],
  ): Promise<Service[]> {
    const query = this.serviceRepository.createQueryBuilder('service');

    if (ids && ids.length > 0) {
      query.where('service.id IN (:...ids)', { ids });
    } else {
      if (category) {
        query.andWhere('service.category = :category', { category });
      }
      
      if (isActive !== undefined) {
        query.andWhere('service.isActive = :isActive', { isActive });
      }

      if (categoryId) {
        query.andWhere('service.categoryId = :categoryId', { categoryId });
      }
    }

    return query.orderBy('service.sort', 'ASC').addOrderBy('service.createdAt', 'DESC').getMany();
  }

  // 批量更新状态
  async batchUpdateActive(ids: string[], isActive: boolean): Promise<Service[]> {
    const services = await this.serviceRepository.findByIds(ids);
    for (const service of services) {
      service.isActive = isActive;
    }
    return this.serviceRepository.save(services);
  }

  // 批量删除
  async batchRemove(ids: string[]): Promise<void> {
    const services = await this.serviceRepository.findByIds(ids);
    await this.serviceRepository.remove(services);
  }

  // 批量更新分类
  async batchUpdateCategory(ids: string[], categoryId: string): Promise<Service[]> {
    const services = await this.serviceRepository.findByIds(ids);
    for (const service of services) {
      service.categoryId = categoryId;
    }
    return this.serviceRepository.save(services);
  }

  // 获取所有服务编码（用于导入时检查重复）
  async getAllCodes(): Promise<string[]> {
    const services = await this.serviceRepository.find({ select: ['code'] });
    return services.filter(s => s.code).map(s => s.code);
  }
}
