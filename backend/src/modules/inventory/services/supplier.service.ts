import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Supplier } from '../entities/supplier.entity';
import { CreateSupplierDto, UpdateSupplierDto, QuerySupplierDto } from '../dto/supplier.dto';

@Injectable()
export class SupplierService {
  constructor(
    @InjectRepository(Supplier)
    private readonly repo: Repository<Supplier>,
  ) {}

  async create(dto: CreateSupplierDto) {
    const entity = this.repo.create(dto);
    return this.repo.save(entity);
  }

  async findAll(query?: QuerySupplierDto) {
    const where: any = {};
    if (query?.name) where.name = query.name;
    if (query?.isActive !== undefined) where.isActive = query.isActive;
    return this.repo.find({ where, order: { name: 'ASC' } });
  }

  async findActive() {
    return this.repo.find({ where: { isActive: true }, order: { name: 'ASC' } });
  }

  async findOne(id: string) {
    return this.repo.findOne({ where: { id } });
  }

  async update(id: string, dto: UpdateSupplierDto) {
    await this.repo.update(id, dto);
    return this.repo.findOne({ where: { id } });
  }

  async updateRating(id: string, rating: number) {
    await this.repo.update(id, { rating });
    return this.repo.findOne({ where: { id } });
  }

  async remove(id: string) {
    const supplier = await this.findOne(id);
    if (supplier) {
      supplier.isActive = false;
      await this.repo.save(supplier);
    }
    return { success: true };
  }

  async hardRemove(id: string) {
    await this.repo.delete(id);
    return { success: true };
  }
}
