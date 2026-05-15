import { Controller, Get, Post, Put, Body, Param, Query, Delete } from '@nestjs/common';
import { CashierService } from './cashier.service';
import { CreateConsumptionDto } from './dto/create-consumption.dto';
import { MergeOrdersDto, DocumentQueryDto, OpenCardDto } from './dto/cashier.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { StoreId } from '../../common/decorators/store-id.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller()
export class CashierController {
  constructor(private readonly cashierService: CashierService) {}

  // 收银台消费
  @Post('cashier/consume')
  @Roles('admin', 'manager', 'cashier')
  create(@Body() dto: CreateConsumptionDto, @CurrentUser('id') userId: string, @StoreId() storeId?: string) {
    return this.cashierService.create(dto, userId, storeId || undefined);
  }

  // 收银台开卡
  @Post('cashier/open-card')
  @Roles('admin', 'manager', 'cashier')
  openCard(@Body() dto: OpenCardDto, @CurrentUser('id') userId: string, @StoreId() storeId?: string) {
    return this.cashierService.openCard(dto, userId, storeId);
  }

  // 日结汇总
  @Get('cashier/daily')
  @Roles('admin', 'manager', 'cashier')
  getDailySummary(@Query('date') dateStr: string, @StoreId() storeId?: string) {
    const date = dateStr ? new Date(dateStr) : new Date();
    return this.cashierService.getDailySummary(date, storeId);
  }

  // 日期范围查询
  @Get('cashier/range')
  @Roles('admin', 'manager', 'cashier')
  findByDate(@Query('start') start: string, @Query('end') end: string, @StoreId() storeId?: string) {
    return this.cashierService.findByDate(new Date(start), new Date(end), storeId);
  }

  // 单据查询
  @Get('documents')
  @Roles('admin', 'manager', 'cashier')
  queryDocuments(@Query() dto: DocumentQueryDto, @StoreId() storeId?: string) {
    return this.cashierService.queryDocuments(dto, storeId || undefined);
  }

  // 获取订单详情
  @Get('documents/:orderNo')
  @Roles('admin', 'manager', 'cashier')
  getOrderDetail(@Param('orderNo') orderNo: string, @StoreId() storeId?: string) {
    return this.cashierService.getOrderDetail(orderNo, storeId);
  }

  // 合单功能
  @Post('documents/merge')
  @Roles('admin', 'manager')
  mergeOrders(@Body() dto: MergeOrdersDto, @CurrentUser('id') userId: string, @StoreId() storeId?: string) {
    return this.cashierService.mergeOrders(dto, userId, storeId);
  }

  // 取消订单
  @Post('documents/:orderNo/cancel')
  @Roles('admin', 'manager')
  cancelOrder(@Param('orderNo') orderNo: string, @CurrentUser('id') userId: string, @StoreId() storeId?: string) {
    return this.cashierService.cancelOrder(orderNo, userId, storeId);
  }

  // 审核订单
  @Post('documents/:orderNo/review')
  @Roles('admin', 'manager')
  reviewOrder(@Param('orderNo') orderNo: string, @CurrentUser('id') userId: string, @CurrentUser('role') userRole: string, @StoreId() storeId?: string) {
    return this.cashierService.reviewOrder(orderNo, userId, userRole, storeId);
  }

  // 修改订单
  @Put('documents/:orderNo')
  @Roles('admin', 'manager')
  updateOrder(
    @Param('orderNo') orderNo: string,
    @Body() dto: any,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: string,
    @StoreId() storeId?: string,
  ) {
    return this.cashierService.updateOrder(orderNo, dto, userId, userRole, storeId);
  }

  // 商品列表
  @Get('products')
  @Roles('admin', 'manager', 'cashier')
  getProducts(@Query('categoryId') categoryId?: string, @Query('keyword') keyword?: string, @StoreId() storeId?: string) {
    return this.cashierService.getProducts(categoryId, keyword, storeId);
  }
}