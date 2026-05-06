import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { SupplierService } from '../services/supplier.service';
import { CreateSupplierDto, UpdateSupplierDto, QuerySupplierDto } from '../dto/supplier.dto';

@Controller('inventory/suppliers')
export class SupplierController {
  constructor(private readonly supplierService: SupplierService) {}

  // 创建供应商
  @Post()
  async create(@Body() dto: CreateSupplierDto) {
    return this.supplierService.create(dto);
  }

  // 获取供应商列表
  @Get()
  async findAll(@Query() query: QuerySupplierDto) {
    return this.supplierService.findAll(query);
  }

  // 获取活跃供应商
  @Get('active')
  async findActive() {
    return this.supplierService.findActive();
  }

  // 获取单个供应商
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.supplierService.findOne(id);
  }

  // 更新供应商
  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateSupplierDto) {
    return this.supplierService.update(id, dto);
  }

  // 更新供应商评分
  @Put(':id/rating')
  async updateRating(@Param('id') id: string, @Body('rating') rating: number) {
    return this.supplierService.updateRating(id, rating);
  }

  // 删除供应商（软删除）
  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.supplierService.remove(id);
    return { success: true };
  }

  // 硬删除供应商
  @Delete(':id/hard')
  async hardRemove(@Param('id') id: string) {
    await this.supplierService.hardRemove(id);
    return { success: true };
  }
}
