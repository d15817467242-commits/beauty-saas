import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Warehouse } from '../../data-settings/entities/warehouse.entity';
import { CreateWarehouseDto, UpdateWarehouseDto } from '../dto/warehouse.dto';

@Injectable()
export class WarehouseService {
  constructor(
    @InjectRepository(Warehouse)
    private warehouseRepository: Repository<Warehouse>,
  ) {}

  async create(dto: CreateWarehouseDto): Promise<Warehouse> {
    // 如果设置为默认仓库，先取消其他默认仓库
    if (dto.isDefault) {
      await this.warehouseRepository.update(
        { isDefault: true },
        { isDefault: false }
      );
    }
    const warehouse = this.warehouseRepository.create(dto);
    return this.warehouseRepository.save(warehouse);
  }

  async findAll(): Promise<Warehouse[]> {
    return this.warehouseRepository.find({
      order: { isDefault: 'DESC', createdAt: 'DESC' },
    });
  }

  async findActive(): Promise<Warehouse[]> {
    return this.warehouseRepository.find({
      where: { isActive: true },
      order: { isDefault: 'DESC', name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Warehouse> {
    const warehouse = await this.warehouseRepository.findOne({ where: { id } });
    if (!warehouse) {
      throw new NotFoundException('仓库不存在');
    }
    return warehouse;
  }

  async findByCode(code: string): Promise<Warehouse> {
    const warehouse = await this.warehouseRepository.findOne({
      where: { code }
    });
    if (!warehouse) {
      throw new NotFoundException('仓库不存在');
    }
    return warehouse;
  }

  async update(id: string, dto: UpdateWarehouseDto): Promise<Warehouse> {
    const warehouse = await this.findOne(id);
    
    // 如果设置为默认仓库，先取消其他默认仓库
    if (dto.isDefault) {
      await this.warehouseRepository.update(
        { isDefault: true, id: { $ne: id } as any },
        { isDefault: false }
      );
    }
    
    Object.assign(warehouse, dto);
    return this.warehouseRepository.save(warehouse);
  }

  async remove(id: string): Promise<void> {
    const warehouse = await this.findOne(id);
    
    if (warehouse.isDefault) {
      throw new BadRequestException('不能删除默认仓库');
    }
    
    await this.warehouseRepository.remove(warehouse);
  }

  async getDefault(): Promise<Warehouse | null> {
    return this.warehouseRepository.findOne({
      where: { isDefault: true, isActive: true },
    });
  }

  async setDefault(id: string): Promise<Warehouse> {
    const warehouse = await this.findOne(id);
    
    // 取消其他默认仓库
    await this.warehouseRepository.update(
      { isDefault: true },
      { isDefault: false }
    );
    
    warehouse.isDefault = true;
    return this.warehouseRepository.save(warehouse);
  }
}
