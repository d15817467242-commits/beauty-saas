import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { SupplierService } from '../services/supplier.service';
import { CreateSupplierDto, QuerySupplierDto } from '../dto/supplier.dto';

@Controller('suppliers')
export class SupplierController {
  constructor(private readonly supplierService: SupplierService) {}

  @Post()
  async create(@Body() dto: CreateSupplierDto) {
    return this.supplierService.create(dto);
  }

  @Get()
  async findAll(@Query() query: QuerySupplierDto) {
    return this.supplierService.findAll(query);
  }

  @Get('active')
  async findActive() {
    return this.supplierService.findActive();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.supplierService.findOne(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: Partial<CreateSupplierDto>) {
    return this.supplierService.update(id, dto);
  }

  @Put(':id/rating')
  async updateRating(@Param('id') id: string, @Body('rating') rating: number) {
    return this.supplierService.updateRating(id, rating);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.supplierService.remove(id);
    return { success: true };
  }

  @Delete(':id/hard')
  async hardRemove(@Param('id') id: string) {
    await this.supplierService.hardRemove(id);
    return { success: true };
  }
}
