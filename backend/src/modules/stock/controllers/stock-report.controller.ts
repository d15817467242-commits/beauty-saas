import { Controller, Get, Query } from '@nestjs/common';
import { StockReportService } from '../services/stock-report.service';

@Controller('stock/report')
export class StockReportController {
  constructor(private readonly stockReportService: StockReportService) {}

  @Get('remaining')
  async getRemainingReport(@Query() query: { warehouseId?: string; productId?: string }) {
    return this.stockReportService.getRemainingReport(query);
  }

  @Get('in')
  async getInReport(@Query() query: { startDate?: string; endDate?: string; warehouseId?: string; supplierId?: string }) {
    return this.stockReportService.getInReport(query);
  }

  @Get('out')
  async getOutReport(@Query() query: { startDate?: string; endDate?: string; warehouseId?: string; type?: string }) {
    return this.stockReportService.getOutReport(query);
  }

  @Get('profit')
  async getProfitReport(@Query() query: { startDate?: string; endDate?: string; warehouseId?: string }) {
    return this.stockReportService.getProfitReport(query);
  }
}
