import { Controller, Get, Post, Put, Body, Param, Query, Delete } from '@nestjs/common';
import { CashierService } from './cashier.service';
import { CreateConsumptionDto } from './dto/create-consumption.dto';
import { MergeOrdersDto, DocumentQueryDto, OpenCardDto } from './dto/cashier.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { StoreId } from '../../common/decorators/store-id.decorator';

@Controller()
export class CashierController {
  constructor(private readonly cashierService: CashierService) {}

  // 收银台消费
  @Post('cashier/consume')
  create(@Body() dto: CreateConsumptionDto, @CurrentUser('id') userId: string, @StoreId() storeId?: string) {
    return this.cashierService.create(dto, userId, storeId || undefined);
  }

  // 收银台开卡
  @Post('cashier/open-card')
  openCard(@Body() dto: OpenCardDto, @CurrentUser('id') userId: string) {
    return this.cashierService.openCard(dto, userId);
  }

  // 日结汇总
  @Get('cashier/daily')
  getDailySummary(@Query('date') dateStr: string) {
    const date = dateStr ? new Date(dateStr) : new Date();
    return this.cashierService.getDailySummary(date);
  }

  // 日期范围查询
  @Get('cashier/range')
  findByDate(@Query('start') start: string, @Query('end') end: string) {
    return this.cashierService.findByDate(new Date(start), new Date(end));
  }

  // 单据查询
  @Get('documents')
  queryDocuments(@Query() dto: DocumentQueryDto, @StoreId() storeId?: string) {
    return this.cashierService.queryDocuments(dto, storeId || undefined);
  }

  // 获取订单详情
  @Get('documents/:orderNo')
  getOrderDetail(@Param('orderNo') orderNo: string) {
    return this.cashierService.getOrderDetail(orderNo);
  }

  // 合单功能
  @Post('documents/merge')
  mergeOrders(@Body() dto: MergeOrdersDto, @CurrentUser('id') userId: string) {
    return this.cashierService.mergeOrders(dto, userId);
  }

  // 取消订单
  @Post('documents/:orderNo/cancel')
  cancelOrder(@Param('orderNo') orderNo: string, @CurrentUser('id') userId: string) {
    return this.cashierService.cancelOrder(orderNo, userId);
  }

  // 审核订单
  @Post('documents/:orderNo/review')
  reviewOrder(@Param('orderNo') orderNo: string, @CurrentUser('id') userId: string, @CurrentUser('role') userRole: string) {
    return this.cashierService.reviewOrder(orderNo, userId, userRole);
  }

  // 修改订单
  @Put('documents/:orderNo')
  updateOrder(
    @Param('orderNo') orderNo: string,
    @Body() dto: any,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: string,
  ) {
    return this.cashierService.updateOrder(orderNo, dto, userId, userRole);
  }

  // 商品列表
  @Get('products')
  getProducts(@Query('categoryId') categoryId?: string, @Query('keyword') keyword?: string) {
    return this.cashierService.getProducts(categoryId, keyword);
  }
}