import { Controller, Get, Post, Body, Param, Query, Request, Delete } from '@nestjs/common';
import { StockTransferService } from '../services/stock-transfer.service';
import { CreateStockTransferDto, QueryStockTransferDto, ApproveStockTransferDto } from '../dto/stock-transfer.dto';

@Controller('stock/transfer')
export class StockTransferController {
  constructor(private readonly stockTransferService: StockTransferService) {}

  @Post()
  async create(@Body() dto: CreateStockTransferDto, @Request() req: any) {
    return this.stockTransferService.create(dto, req.user?.userId || 'system');
  }

  @Get()
  async findAll(@Query() query: QueryStockTransferDto) {
    return this.stockTransferService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.stockTransferService.findOne(id);
  }

  @Post(':id/submit')
  async submit(@Param('id') id: string) {
    return this.stockTransferService.submit(id);
  }

  @Post(':id/approve')
  async approve(@Param('id') id: string, @Body() dto: ApproveStockTransferDto, @Request() req: any) {
    return this.stockTransferService.approve(id, dto, req.user?.userId || 'system');
  }

  @Post(':id/complete')
  async complete(@Param('id') id: string, @Request() req: any) {
    return this.stockTransferService.complete(id, req.user?.userId || 'system');
  }

  @Post(':id/cancel')
  async cancel(@Param('id') id: string) {
    return this.stockTransferService.cancel(id);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.stockTransferService.remove(id);
    return { success: true };
  }
}
