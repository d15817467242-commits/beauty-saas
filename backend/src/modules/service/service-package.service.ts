import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ServicePackage, PackageStatus } from './service-package.entity';
import { PackageItem } from './package-item.entity';
import { Service } from './service.entity';
import { CreateServicePackageDto, CreatePackageItemDto } from './dto/create-service-package.dto';
import { UpdateServicePackageDto } from './dto/update-service-package.dto';

@Injectable()
export class ServicePackageService {
  constructor(
    @InjectRepository(ServicePackage)
    private packageRepository: Repository<ServicePackage>,
    @InjectRepository(PackageItem)
    private itemRepository: Repository<PackageItem>,
    @InjectRepository(Service)
    private serviceRepository: Repository<Service>,
    private dataSource: DataSource,
  ) {}

  async create(createPackageDto: CreateServicePackageDto): Promise<ServicePackage> {
    // 检查编码是否已存在
    if (createPackageDto.code) {
      const existing = await this.packageRepository.findOne({ 
        where: { code: createPackageDto.code } 
      });
      if (existing) {
        throw new BadRequestException('套餐编码已存在');
      }
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 创建套餐
      const pkg = queryRunner.manager.create(ServicePackage, {
        name: createPackageDto.name,
        code: createPackageDto.code,
        description: createPackageDto.description,
        images: createPackageDto.images,
        originalPrice: createPackageDto.originalPrice,
        packagePrice: createPackageDto.packagePrice,
        memberPrice: createPackageDto.memberPrice,
        validDays: createPackageDto.validDays,
        usageLimit: createPackageDto.usageLimit,
        status: createPackageDto.status || PackageStatus.DRAFT,
        sort: createPackageDto.sort,
        isActive: createPackageDto.isActive,
        startTime: createPackageDto.startTime,
        endTime: createPackageDto.endTime,
      });
      await queryRunner.manager.save(pkg);

      // 创建套餐项目
      if (createPackageDto.items && createPackageDto.items.length > 0) {
        for (const itemDto of createPackageDto.items) {
          const service = await queryRunner.manager.findOne(Service, { 
            where: { id: itemDto.serviceId } 
          });
          if (!service) {
            throw new NotFoundException(`服务项目 ${itemDto.serviceId} 不存在`);
          }

          const item = queryRunner.manager.create(PackageItem, {
            packageId: pkg.id,
            serviceId: itemDto.serviceId,
            quantity: itemDto.quantity || 1,
            overridePrice: itemDto.overridePrice,
            remark: itemDto.remark,
            sort: itemDto.sort || 0,
          });
          await queryRunner.manager.save(item);
        }
      }

      await queryRunner.commitTransaction();
      return this.findOne(pkg.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(status?: PackageStatus, includeInactive = false): Promise<ServicePackage[]> {
    const query = this.packageRepository.createQueryBuilder('pkg')
      .leftJoinAndSelect('pkg.items', 'item')
      .leftJoinAndSelect('item.service', 'service');

    if (status) {
      query.andWhere('pkg.status = :status', { status });
    }

    if (!includeInactive) {
      query.andWhere('pkg.isActive = :isActive', { isActive: true });
    }

    return query.orderBy('pkg.sort', 'ASC').addOrderBy('pkg.createdAt', 'DESC').getMany();
  }

  async findOne(id: string): Promise<ServicePackage> {
    const pkg = await this.packageRepository.findOne({
      where: { id },
      relations: ['items', 'items.service'],
    });
    
    if (!pkg) {
      throw new NotFoundException('服务套餐不存在');
    }
    
    return pkg;
  }

  async findByCode(code: string): Promise<ServicePackage> {
    const pkg = await this.packageRepository.findOne({
      where: { code },
      relations: ['items', 'items.service'],
    });
    
    if (!pkg) {
      throw new NotFoundException('服务套餐不存在');
    }
    
    return pkg;
  }

  async update(id: string, updatePackageDto: UpdateServicePackageDto): Promise<ServicePackage> {
    const pkg = await this.findOne(id);

    // 检查编码是否被其他套餐使用
    if (updatePackageDto.code && updatePackageDto.code !== pkg.code) {
      const existing = await this.packageRepository.findOne({ 
        where: { code: updatePackageDto.code } 
      });
      if (existing && existing.id !== id) {
        throw new BadRequestException('套餐编码已存在');
      }
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 更新套餐基本信息
      Object.assign(pkg, updatePackageDto);
      delete (pkg as any).items; // 先移除items，单独处理
      await queryRunner.manager.save(pkg);

      // 更新套餐项目
      if (updatePackageDto.items !== undefined) {
        // 删除原有项目
        await queryRunner.manager.delete(PackageItem, { packageId: id });

        // 创建新项目
        for (const itemDto of updatePackageDto.items) {
          const service = await queryRunner.manager.findOne(Service, { 
            where: { id: itemDto.serviceId } 
          });
          if (!service) {
            throw new NotFoundException(`服务项目 ${itemDto.serviceId} 不存在`);
          }

          const item = queryRunner.manager.create(PackageItem, {
            packageId: id,
            serviceId: itemDto.serviceId,
            quantity: itemDto.quantity || 1,
            overridePrice: itemDto.overridePrice,
            remark: itemDto.remark,
            sort: itemDto.sort || 0,
          });
          await queryRunner.manager.save(item);
        }
      }

      await queryRunner.commitTransaction();
      return this.findOne(id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async remove(id: string): Promise<void> {
    const pkg = await this.findOne(id);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 删除套餐项目
      await queryRunner.manager.delete(PackageItem, { packageId: id });
      // 删除套餐
      await queryRunner.manager.remove(pkg);
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async updateStatus(id: string, status: PackageStatus): Promise<ServicePackage> {
    const pkg = await this.findOne(id);
    pkg.status = status;
    return this.packageRepository.save(pkg);
  }

  async publish(id: string): Promise<ServicePackage> {
    return this.updateStatus(id, PackageStatus.PUBLISHED);
  }

  async offline(id: string): Promise<ServicePackage> {
    return this.updateStatus(id, PackageStatus.OFFLINE);
  }

  async toggleActive(id: string): Promise<ServicePackage> {
    const pkg = await this.findOne(id);
    pkg.isActive = !pkg.isActive;
    return this.packageRepository.save(pkg);
  }

  // 获取套餐项目
  async getItems(packageId: string): Promise<PackageItem[]> {
    return this.itemRepository.find({
      where: { packageId },
      relations: ['service'],
      order: { sort: 'ASC' },
    });
  }

  // 添加套餐项目
  async addItem(packageId: string, itemDto: CreatePackageItemDto): Promise<PackageItem> {
    await this.findOne(packageId); // 检查套餐是否存在

    const service = await this.serviceRepository.findOne({ 
      where: { id: itemDto.serviceId } 
    });
    if (!service) {
      throw new NotFoundException('服务项目不存在');
    }

    const item = this.itemRepository.create({
      packageId,
      serviceId: itemDto.serviceId,
      quantity: itemDto.quantity || 1,
      overridePrice: itemDto.overridePrice,
      remark: itemDto.remark,
      sort: itemDto.sort || 0,
    });

    return this.itemRepository.save(item);
  }

  // 更新套餐项目
  async updateItem(itemId: string, itemDto: Partial<CreatePackageItemDto>): Promise<PackageItem> {
    const item = await this.itemRepository.findOne({ 
      where: { id: itemId },
      relations: ['service'],
    });
    
    if (!item) {
      throw new NotFoundException('套餐项目不存在');
    }

    if (itemDto.serviceId) {
      const service = await this.serviceRepository.findOne({ 
        where: { id: itemDto.serviceId } 
      });
      if (!service) {
        throw new NotFoundException('服务项目不存在');
      }
    }

    Object.assign(item, itemDto);
    return this.itemRepository.save(item);
  }

  // 删除套餐项目
  async removeItem(itemId: string): Promise<void> {
    const item = await this.itemRepository.findOne({ where: { id: itemId } });
    if (!item) {
      throw new NotFoundException('套餐项目不存在');
    }
    await this.itemRepository.remove(item);
  }
}
