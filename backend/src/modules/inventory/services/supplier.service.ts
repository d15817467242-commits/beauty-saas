import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Supplier } from '../entities/supplier.entity';
import { CreateSupplierDto, UpdateSupplierDto, QuerySupplierDto } from '../dto/supplier.dto';

@Injectable()
export class SupplierService {
  constructor(
    @InjectRepository(Supplier)
    private supplierRepository: Repository<Supplier>,
  ) {}

  // 创建供应商
  async create(dto: CreateSupplierDto): Promise<Supplier> {
    const supplier = this.supplierRepository.create(dto);
    return this.supplierRepository.save(supplier);
  }

  // 获取供应商列表
  async findAll(query?: QuerySupplierDto): Promise<Supplier[]> {
    const where: any = {};
    if (query?.name) {
      where.name = query.name;
    }
    if (query?.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    return this.supplierRepository.find({
      where,
      order: { name: 'ASC' },
    });
  }

  // 获取单个供应商
  async findOne(id: string): Promise<Supplier> {
    const supplier = await this.supplierRepository.findOne({
      where: { id },
    });
    if (!supplier) {
      throw new NotFoundException('供应商不存在');
    }
    return supplier;
  }

  // 更新供应商
  async update(id: string, dto: UpdateSupplierDto): Promise<Supplier> {
    const supplier = await this.findOne(id);
    Object.assign(supplier, dto);
    return this.supplierRepository.save(supplier);
  }

  // 删除供应商（软删除）
  async remove(id: string): Promise<void> {
    const supplier = await this.findOne(id);
    supplier.isActive = false;
    await this.supplierRepository.save(supplier);
  }

  // 硬删除供应商
  async hardRemove(id: string): Promise<void> {
    const supplier = await this.findOne(id);
    await this.supplierRepository.delete(supplier.id);
  }

  // 获取活跃供应商
  async findActive(): Promise<Supplier[]> {
    return this.supplierRepository.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  }

  // 更新供应商评分
  async updateRating(id: string, rating: number): Promise<Supplier> {
    const supplier = await this.findOne(id);
    if (rating < 1 || rating > 5) {
      throw new Error('评分必须在1-5之间');
    }
    supplier.rating = rating;
    return this.supplierRepository.save(supplier);
  }
}
