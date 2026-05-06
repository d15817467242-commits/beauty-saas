import { Controller, Get, Post, Body, Param, Query, Request, Delete } from '@nestjs/common';
import { StockInService } from '../services/stock-in.service';
import { CreateStockInDto, QueryStockInDto } from '../dto/stock-in.dto';

@Controller('stock/in')
export class StockInController {
  constructor(private readonly stockInService: StockInService) {}

  @Post()
  async create(@Body() dto: CreateStockInDto, @Request() req: any) {
    return this.stockInService.create(dto, req.user?.userId || 'system');
  }

  @Get()
  async findAll(@Query() query: QueryStockInDto) {
    return this.stockInService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.stockInService.findOne(id);
  }

  @Post(':id/approve')
  async approve(@Param('id') id: string, @Request() req: any) {
    return this.stockInService.approve(id, req.user?.userId || 'system');
  }

  @Post(':id/cancel')
  async cancel(@Param('id') id: string) {
    return this.stockInService.cancel(id);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.stockInService.remove(id);
    return { success: true };
  }
}
