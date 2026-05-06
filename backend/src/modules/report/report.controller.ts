import { Controller, Get, Post, Put, Delete, Body, Query, Param, ParseUUIDPipe } from '@nestjs/common';
import { ReportService } from './report.service';
import {
  BaseReportQueryDto,
  PageQueryDto,
  CreateTargetDto,
  UpdateTargetDto,
  TargetQueryDto,
  RevenueSummaryQueryDto,
  BusinessOverviewQueryDto,
  LaborQueryDto,
  AssetQueryDto,
  DiscountQueryDto,
  CustomerQueryDto,
  TrendQueryDto,
  ProfitQueryDto,
  BankQueryDto,
  EmployeeBusinessQueryDto,
  ItemAnalysisQueryDto,
  CustomerConsumptionQueryDto,
  CustomerDetailQueryDto,
  RechargeDetailQueryDto,
  CardSalesQueryDto,
  CardConsumptionQueryDto,
  EmployeeCommissionQueryDto,
  CommissionDetailQueryDto,
  SalaryQueryDto,
  MemberCardChangeQueryDto,
  MemberBalanceQueryDto,
  MemberCardQueryDto,
  PointChangeQueryDto,
  CashReconciliationQueryDto,
  TrafficQueryDto,
  SmsFeeQueryDto
} from './dto/report.dto';

@Controller('report')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  // ========== 27项报表API ==========

  // 1. 目标概览
  @Get('target')
  getTargetOverview(@Query() query: TargetQueryDto) {
    return this.reportService.getTargetOverview(query);
  }

  // 2. 营收汇总
  @Get('summary')
  getSummary(@Query() query: RevenueSummaryQueryDto) {
    return this.reportService.getSummary(query);
  }

  // 3. 经营总览
  @Get('overview')
  getOverview(@Query() query: BusinessOverviewQueryDto) {
    return this.reportService.getOverview(query);
  }

  // 4. 劳动业绩
  @Get('labor')
  getLabor(@Query() query: LaborQueryDto) {
    return this.reportService.getLabor(query);
  }

  // 5. 资产报表
  @Get('asset')
  getAsset(@Query() query: AssetQueryDto) {
    return this.reportService.getAsset(query);
  }

  // 6. 优惠统计
  @Get('discount')
  getDiscount(@Query() query: DiscountQueryDto) {
    return this.reportService.getDiscount(query);
  }

  // 7. 客情分析
  @Get('customer')
  getCustomer(@Query() query: CustomerQueryDto) {
    return this.reportService.getCustomer(query);
  }

  // 8. 营收趋势
  @Get('trend')
  getTrend(@Query() query: TrendQueryDto) {
    return this.reportService.getTrend(query);
  }

  // 9. 营收利润
  @Get('profit')
  getProfit(@Query() query: ProfitQueryDto) {
    return this.reportService.getProfit(query);
  }

  // 10. 银行对账单
  @Get('bank')
  getBank(@Query() query: BankQueryDto) {
    return this.reportService.getBank(query);
  }

  // 11. 员工业务分析
  @Get('employee-business')
  getEmployeeBusiness(@Query() query: EmployeeBusinessQueryDto) {
    return this.reportService.getEmployeeBusiness(query);
  }

  // 12. 品项分析
  @Get('item-analysis')
  getItemAnalysis(@Query() query: ItemAnalysisQueryDto) {
    return this.reportService.getItemAnalysis(query);
  }

  // 13. 顾客消费汇总
  @Get('customer-consumption')
  getCustomerConsumption(@Query() query: CustomerConsumptionQueryDto) {
    return this.reportService.getCustomerConsumption(query);
  }

  // 14. 顾客消费明细
  @Get('customer-detail')
  getCustomerDetail(@Query() query: CustomerDetailQueryDto) {
    return this.reportService.getCustomerDetail(query);
  }

  // 15. 充值明细
  @Get('recharge-detail')
  getRechargeDetail(@Query() query: RechargeDetailQueryDto) {
    return this.reportService.getRechargeDetail(query);
  }

  // 16. 次卡销售明细
  @Get('card-sales')
  getCardSales(@Query() query: CardSalesQueryDto) {
    return this.reportService.getCardSales(query);
  }

  // 17. 次卡消费明细
  @Get('card-consumption')
  getCardConsumption(@Query() query: CardConsumptionQueryDto) {
    return this.reportService.getCardConsumption(query);
  }

  // 18. 员工提成汇总
  @Get('employee-commission')
  getEmployeeCommission(@Query() query: EmployeeCommissionQueryDto) {
    return this.reportService.getEmployeeCommission(query);
  }

  // 19. 提成明细
  @Get('employee-commission-detail')
  getCommissionDetail(@Query() query: CommissionDetailQueryDto) {
    return this.reportService.getCommissionDetail(query);
  }

  // 20. 工资统计
  @Get('salary')
  getSalary(@Query() query: SalaryQueryDto) {
    return this.reportService.getSalary(query);
  }

  // 21. 会员卡变更
  @Get('member-card-change')
  getMemberCardChange(@Query() query: MemberCardChangeQueryDto) {
    return this.reportService.getMemberCardChange(query);
  }

  // 22. 会员余额统计
  @Get('member-balance')
  getMemberBalance(@Query() query: MemberBalanceQueryDto) {
    return this.reportService.getMemberBalance(query);
  }

  // 23. 会员次卡统计
  @Get('member-card')
  getMemberCard(@Query() query: MemberCardQueryDto) {
    return this.reportService.getMemberCard(query);
  }

  // 24. 积分变更
  @Get('point-change')
  getPointChange(@Query() query: PointChangeQueryDto) {
    return this.reportService.getPointChange(query);
  }

  // 25. 现金对账
  @Get('cash-reconciliation')
  getCashReconciliation(@Query() query: CashReconciliationQueryDto) {
    return this.reportService.getCashReconciliation(query);
  }

  // 26. 客流统计
  @Get('traffic')
  getTraffic(@Query() query: TrafficQueryDto) {
    return this.reportService.getTraffic(query);
  }

  // 27. 短信费收取记录
  @Get('sms-fee')
  getSmsFee(@Query() query: SmsFeeQueryDto) {
    return this.reportService.getSmsFee(query);
  }

  // ========== 目标管理 ==========

  @Post('target')
  createTarget(@Body() dto: CreateTargetDto) {
    return this.reportService.createTarget(dto);
  }

  @Put('target/:id')
  updateTarget(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateTargetDto) {
    return this.reportService.updateTarget(id, dto);
  }

  @Delete('target/:id')
  deleteTarget(@Param('id', ParseUUIDPipe) id: string) {
    return this.reportService.deleteTarget(id);
  }

  // ========== 原有接口 ==========

  @Get('daily')
  getDailyReport(@Query('date') date: string) {
    const reportDate = date || new Date().toISOString().split('T')[0];
    return this.reportService.getDailyReport(reportDate);
  }

  @Get('monthly')
  getMonthlyReport(@Query('year') year: string, @Query('month') month: string) {
    const now = new Date();
    const reportYear = year ? parseInt(year) : now.getFullYear();
    const reportMonth = month ? parseInt(month) : now.getMonth() + 1;
    return this.reportService.getMonthlyReport(reportYear, reportMonth);
  }

  @Get('employee-performance')
  getEmployeePerformance(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const now = new Date();
    const start = startDate || new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const end = endDate || now.toISOString().split('T')[0];
    return this.reportService.getEmployeePerformance(start, end);
  }

  @Get('service-ranking')
  getServiceSalesRanking(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('limit') limit: string,
  ) {
    const now = new Date();
    const start = startDate || new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const end = endDate || now.toISOString().split('T')[0];
    return this.reportService.getServiceSalesRanking(start, end, limit ? parseInt(limit) : 10);
  }

  @Get('perm-dye-conversion')
  getPermDyeConversionRate(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const now = new Date();
    const start = startDate || new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const end = endDate || now.toISOString().split('T')[0];
    return this.reportService.getPermDyeConversionRate(start, end);
  }

  @Get('customer-flow')
  getCustomerFlowTrend(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('groupBy') groupBy: 'day' | 'week' | 'month',
  ) {
    const now = new Date();
    const start = startDate || new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const end = endDate || now.toISOString().split('T')[0];
    return this.reportService.getCustomerFlowTrend(start, end, groupBy || 'day');
  }

  @Get('customer-retention')
  getCustomerRetention(@Query('months') months: string) {
    return this.reportService.getCustomerRetention(months ? parseInt(months) : 6);
  }
}
