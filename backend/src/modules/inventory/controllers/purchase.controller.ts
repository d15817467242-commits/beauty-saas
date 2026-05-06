import { Controller, Get, Post, Put, Delete, Body, Param, Query, Request } from '@nestjs/common';
import { PurchaseService } from '../services/purchase.service';
import {
  CreatePurchaseOrderDto,
  UpdatePurchaseOrderDto,
  ApprovePurchaseOrderDto,
  ReceivePurchaseOrderDto,
  QueryPurchaseOrderDto,
} from '../dto/purchase.dto';

@Controller('inventory/purchases')
export class PurchaseController {
  constructor(private readonly purchaseService: PurchaseService) {}

  // 创建采购单
  @Post()
  async create(@Body() dto: CreatePurchaseOrderDto, @Request() req: any) {
    return this.purchaseService.create(dto, req.user.userId);
  }

  // 获取采购单列表
  @Get()
  async findAll(@Query() query: QueryPurchaseOrderDto) {
    return this.purchaseService.findAll(query);
  }

  // 获取单个采购单
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.purchaseService.findOne(id);
  }

  // 更新采购单
  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdatePurchaseOrderDto) {
    return this.purchaseService.update(id, dto);
  }

  // 提交审批
  @Post(':id/submit')
  async submit(@Param('id') id: string) {
    return this.purchaseService.submit(id);
  }

  // 审批采购单
  @Post(':id/approve')
  async approve(@Param('id') id: string, @Body() dto: ApprovePurchaseOrderDto, @Request() req: any) {
    return this.purchaseService.approve(id, dto, req.user.userId);
  }

  // 下单
  @Post(':id/place')
  async placeOrder(@Param('id') id: string) {
    return this.purchaseService.placeOrder(id);
  }

  // 入库
  @Post(':id/receive')
  async receive(@Param('id') id: string, @Body() dto: ReceivePurchaseOrderDto, @Request() req: any) {
    return this.purchaseService.receive(id, dto, req.user.userId);
  }

  // 取消采购单
  @Post(':id/cancel')
  async cancel(@Param('id') id: string) {
    return this.purchaseService.cancel(id);
  }

  // 删除采购单
  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.purchaseService.remove(id);
    return { success: true };
  }
}
