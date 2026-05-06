import { Controller, Get, Post, Put, Delete, Body, Param, Query, Request } from '@nestjs/common';
import { StockTransferService } from '../services/stock-transfer.service';
import {
  CreateStockTransferDto,
  UpdateStockTransferDto,
  ApproveStockTransferDto,
  QueryStockTransferDto,
} from '../dto/stock-transfer.dto';

@Controller('inventory/transfers')
export class StockTransferController {
  constructor(private readonly stockTransferService: StockTransferService) {}

  // 创建调拨单
  @Post()
  async create(@Body() dto: CreateStockTransferDto, @Request() req: any) {
    return this.stockTransferService.create(dto, req.user.userId);
  }

  // 获取调拨单列表
  @Get()
  async findAll(@Query() query: QueryStockTransferDto) {
    return this.stockTransferService.findAll(query);
  }

  // 获取单个调拨单
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.stockTransferService.findOne(id);
  }

  // 更新调拨单
  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateStockTransferDto) {
    return this.stockTransferService.update(id, dto);
  }

  // 提交审批
  @Post(':id/submit')
  async submit(@Param('id') id: string) {
    return this.stockTransferService.submit(id);
  }

  // 审批调拨单
  @Post(':id/approve')
  async approve(@Param('id') id: string, @Body() dto: ApproveStockTransferDto, @Request() req: any) {
    return this.stockTransferService.approve(id, dto, req.user.userId);
  }

  // 完成调拨
  @Post(':id/complete')
  async complete(@Param('id') id: string) {
    return this.stockTransferService.complete(id);
  }

  // 取消调拨
  @Post(':id/cancel')
  async cancel(@Param('id') id: string) {
    return this.stockTransferService.cancel(id);
  }

  // 删除调拨单
  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.stockTransferService.remove(id);
    return { success: true };
  }
}
