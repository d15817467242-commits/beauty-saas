import { Controller, Get, Post, Put, Delete, Body, Param, Query, Request } from '@nestjs/common';
import { StockAlertService } from '../services/stock-alert.service';
import {
  CreateStockAlertRuleDto,
  UpdateStockAlertRuleDto,
  HandleStockAlertDto,
  QueryStockAlertDto,
} from '../dto/stock-alert.dto';

@Controller('inventory')
export class StockAlertController {
  constructor(private readonly stockAlertService: StockAlertService) {}

  // ==================== 预警规则管理 ====================

  // 创建预警规则
  @Post('alert-rules')
  async createRule(@Body() dto: CreateStockAlertRuleDto) {
    return this.stockAlertService.createRule(dto);
  }

  // 获取预警规则列表
  @Get('alert-rules')
  async findAllRules() {
    return this.stockAlertService.findAllRules();
  }

  // 获取单个预警规则
  @Get('alert-rules/:id')
  async findOneRule(@Param('id') id: string) {
    return this.stockAlertService.findOneRule(id);
  }

  // 更新预警规则
  @Put('alert-rules/:id')
  async updateRule(@Param('id') id: string, @Body() dto: UpdateStockAlertRuleDto) {
    return this.stockAlertService.updateRule(id, dto);
  }

  // 删除预警规则
  @Delete('alert-rules/:id')
  async removeRule(@Param('id') id: string) {
    await this.stockAlertService.removeRule(id);
    return { success: true };
  }

  // ==================== 预警记录管理 ====================

  // 获取预警列表
  @Get('alerts')
  async findAllAlerts(@Query() query: QueryStockAlertDto) {
    return this.stockAlertService.findAll(query);
  }

  // 处理预警
  @Post('alerts/:id/handle')
  async handleAlert(@Param('id') id: string, @Body() dto: HandleStockAlertDto, @Request() req: any) {
    return this.stockAlertService.handle(id, dto, req.user.userId);
  }

  // 忽略预警
  @Post('alerts/:id/ignore')
  async ignoreAlert(@Param('id') id: string, @Request() req: any) {
    return this.stockAlertService.ignore(id, req.user.userId);
  }

  // ==================== 预警触发 ====================

  // 手动触发预警检查
  @Post('alerts/trigger')
  async triggerCheck(@Body('productId') productId?: string) {
    return this.stockAlertService.triggerCheck(productId);
  }
}
