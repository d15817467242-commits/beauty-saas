import { Controller, Get, Post, Put, Body, Param, Query, Request } from '@nestjs/common';
import { StockCostService } from '../services/stock-cost.service';
import { CalculateCostDto, QueryStockCostDto, UpdateProductCostDto } from '../dto/stock-cost.dto';

@Controller('inventory/cost-analysis')
export class StockCostAnalysisController {
  constructor(private readonly stockCostService: StockCostService) {}

  @Get('summary')
  async getSummary(@Query() query: any) {
    return this.stockCostService.getAllCostSummaries();
  }
}

@Controller('inventory/costs')
export class StockCostController {
  constructor(private readonly stockCostService: StockCostService) {}

  // 获取成本历史
  @Get()
  async findAll(@Query() query: any) {
    return this.stockCostService.getAllCostSummaries();
  }

  @Get('history')
  async getCostHistory(@Query() query: QueryStockCostDto) {
    return this.stockCostService.getCostHistory(query);
  }

  // 获取产品成本汇总
  @Get('summary/:productId')
  async getCostSummary(@Param('productId') productId: string) {
    return this.stockCostService.getCostSummary(productId);
  }

  // 获取所有产品成本汇总
  @Get('summaries')
  async getAllCostSummaries() {
    return this.stockCostService.getAllCostSummaries();
  }

  // 计算成本
  @Post('calculate')
  async calculateCost(@Body() dto: CalculateCostDto) {
    return this.stockCostService.calculateCost(dto);
  }

  // 手动更新产品成本
  @Put('update/:productId')
  async updateProductCost(
    @Param('productId') productId: string,
    @Body() dto: UpdateProductCostDto,
    @Request() req: any,
  ) {
    return this.stockCostService.updateProductCost(productId, dto, req.user.userId);
  }

  // 获取库存总价值
  @Get('total-value')
  async calculateTotalInventoryValue() {
    return this.stockCostService.calculateTotalInventoryValue();
  }
}
