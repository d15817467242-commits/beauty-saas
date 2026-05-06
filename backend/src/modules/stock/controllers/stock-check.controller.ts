import { Controller, Get, Post, Body, Param, Query, Request, Delete } from '@nestjs/common';
import { StockCheckService } from '../services/stock-check.service';
import { CreateStockCheckDto, QueryStockCheckDto, RecordStockCheckItemDto } from '../dto/stock-check.dto';

@Controller('stock/check')
export class StockCheckController {
  constructor(private readonly stockCheckService: StockCheckService) {}

  @Post()
  async create(@Body() dto: CreateStockCheckDto, @Request() req: any) {
    return this.stockCheckService.create(dto, req.user?.userId || 'system');
  }

  @Get()
  async findAll(@Query() query: QueryStockCheckDto) {
    return this.stockCheckService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.stockCheckService.findOne(id);
  }

  @Post(':id/start')
  async start(@Param('id') id: string) {
    return this.stockCheckService.start(id);
  }

  @Post(':id/record')
  async recordItem(@Param('id') id: string, @Body() dto: RecordStockCheckItemDto) {
    return this.stockCheckService.recordItem(id, dto);
  }

  @Post(':id/complete')
  async complete(@Param('id') id: string, @Request() req: any) {
    return this.stockCheckService.complete(id, req.user?.userId || 'system');
  }

  @Post(':id/cancel')
  async cancel(@Param('id') id: string) {
    return this.stockCheckService.cancel(id);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.stockCheckService.remove(id);
    return { success: true };
  }
}
