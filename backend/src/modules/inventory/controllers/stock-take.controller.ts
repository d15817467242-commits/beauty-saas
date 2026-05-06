import { Controller, Get, Post, Put, Delete, Body, Param, Query, Request } from '@nestjs/common';
import { StockTakeService } from '../services/stock-take.service';
import {
  CreateStockTakeDto,
  RecordStockTakeItemDto,
  QueryStockTakeDto,
} from '../dto/stock-take.dto';

@Controller('inventory/stock-takes')
export class StockTakeController {
  constructor(private readonly stockTakeService: StockTakeService) {}

  // 创建盘点单
  @Post()
  async create(@Body() dto: CreateStockTakeDto, @Request() req: any) {
    return this.stockTakeService.create(dto, req.user.userId);
  }

  // 获取盘点单列表
  @Get()
  async findAll(@Query() query: QueryStockTakeDto) {
    return this.stockTakeService.findAll(query);
  }

  // 获取单个盘点单
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.stockTakeService.findOne(id);
  }

  // 开始盘点
  @Post(':id/start')
  async startStockTake(@Param('id') id: string) {
    return this.stockTakeService.startStockTake(id);
  }

  // 记录盘点数量
  @Post(':id/record')
  async recordItem(@Param('id') id: string, @Body() dto: RecordStockTakeItemDto) {
    return this.stockTakeService.recordItem(id, dto);
  }

  // 完成盘点
  @Post(':id/complete')
  async completeStockTake(@Param('id') id: string, @Request() req: any) {
    return this.stockTakeService.completeStockTake(id, req.user.userId);
  }

  // 处理盘点差异
  @Post(':id/process-difference')
  async processDifference(
    @Param('id') id: string,
    @Body('productId') productId: string,
    @Body('actualQuantity') actualQuantity: number,
    @Request() req: any,
  ) {
    await this.stockTakeService.processDifference(id, productId, actualQuantity, req.user.userId);
    return { success: true };
  }

  // 取消盘点
  @Post(':id/cancel')
  async cancelStockTake(@Param('id') id: string) {
    return this.stockTakeService.cancelStockTake(id);
  }

  // 删除盘点单
  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.stockTakeService.remove(id);
    return { success: true };
  }
}
