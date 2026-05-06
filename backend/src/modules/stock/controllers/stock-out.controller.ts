import { Controller, Get, Post, Body, Param, Query, Request, Delete } from '@nestjs/common';
import { StockOutService } from '../services/stock-out.service';
import { CreateStockOutDto, QueryStockOutDto } from '../dto/stock-out.dto';

@Controller('stock/out')
export class StockOutController {
  constructor(private readonly stockOutService: StockOutService) {}

  @Post()
  async create(@Body() dto: CreateStockOutDto, @Request() req: any) {
    return this.stockOutService.create(dto, req.user?.userId || 'system');
  }

  @Get()
  async findAll(@Query() query: QueryStockOutDto) {
    return this.stockOutService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.stockOutService.findOne(id);
  }

  @Post(':id/approve')
  async approve(@Param('id') id: string, @Request() req: any) {
    return this.stockOutService.approve(id, req.user?.userId || 'system');
  }

  @Post(':id/cancel')
  async cancel(@Param('id') id: string) {
    return this.stockOutService.cancel(id);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.stockOutService.remove(id);
    return { success: true };
  }
}
