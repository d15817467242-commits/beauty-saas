import { Controller, Get, Post, Put, Delete, Body, Param, Query, Req, Request, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import { BackupService } from '../backup/backup.service';
import { CountCardService } from '../count-card/count-card.service';
import { PaymentConfigService } from '../payment-config/payment-config.service';
import { PrintTemplateService } from '../print-template/print-template.service';
import { MessageTemplateService } from '../message-template/message-template.service';
import { ReportService } from '../report/report.service';
import { MemberService } from '../member/member.service';
import { MemberLevelService } from '../member/member-enhanced.service';
import { StoreService } from '../store/store.service';
import { MiniappService } from '../miniapp/miniapp.service';
import { SystemConfigService } from '../system-config/system-config.service';
import { ExpenseService } from '../expense/services/expense.service';
import { CommissionRuleService } from '../employee/services/commission-rule.service';
import { AttendanceService } from '../employee/services/attendance.service';
import { ServiceReviewService } from '../service/service-review.service';
import { CashierService } from '../cashier/cashier.service';
import { OperationLogService } from '../operation-log/operation-log.service';
import { StockCostService } from '../inventory/services/stock-cost.service';
import { StockAlertService } from '../inventory/services/stock-alert.service';
import { PurchaseService } from '../inventory/services/purchase.service';
import { EmployeeService } from '../employee/employee.service';
import { WorkScheduleService } from '../employee/services/work-schedule.service';
import { IntegrationService } from '../integration/services/integration.service';
import { ParamSettingsService } from '../param-settings/services/param-settings.service';
import { ServiceCategoryService } from '../service/service-category.service';
import { MemberPointsService, PointExchangeService, MemberTagService, MemberReferralService, MemberPortraitService } from '../member/member-enhanced.service';
import { PointsMallService } from '../marketing/points-mall.service';
import { CouponService } from '../marketing/coupon.service';

// 备份模块别名 - 前端用 /api/backup/* 而后端是 /api/backups/*
@Controller('backup')
export class BackupAliasController {
  constructor(private readonly backupService: BackupService) {}

  @Get('stats')
  getStats() { return this.backupService.getStats(); }

  @Get('list')
  getList() { return this.backupService.listRecords({}); }

  @Get('database-stats')
  getDatabaseStats() { return this.backupService.getDatabaseStats(); }

  @Get('auto-config')
  getAutoConfig() { return this.backupService.getActiveAutoConfigs(); }

  @Post('export/json')
  exportJson() { return this.backupService.executeBackup(undefined, { format: 'json' as any }); }

  @Post('export/sql')
  exportSql() { return this.backupService.executeBackup(undefined, { format: 'sql' as any }); }

  @Post('clean')
  clean(@Body() body?: { daysToKeep?: number }) {
    return this.backupService.cleanOldBackups(body?.daysToKeep);
  }

  @Post('upload')
  upload() { return { message: '请使用备份配置接口创建备份' }; }
}

// 计次卡模块别名
@Controller('count-card')
export class CountCardAliasController {
  constructor(private readonly countCardService: CountCardService) {}

  @Get()
  findAll() { return this.countCardService.findAllPackages(); }

  @Get('packages')
  findPackages() { return this.countCardService.findAllPackages(); }
}

// 支付配置模块别名
@Controller('payment-methods')
export class PaymentMethodAliasController {
  constructor(private readonly paymentService: PaymentConfigService) {}

  @Get()
  findAll() { return this.paymentService.listConfigs(); }

  @Post()
  create(@Body() body: any) { return this.paymentService.createConfig(body); }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: any) { return this.paymentService.updateConfig(id, body); }

  @Delete(':id')
  remove(@Param('id') id: string) { return this.paymentService.deleteConfig(id); }
}

@Controller('payment-channels')
export class PaymentChannelAliasController {
  constructor(private readonly paymentService: PaymentConfigService) {}

  @Get()
  findAll() { return this.paymentService.listConfigs(); }

  @Post()
  create(@Body() body: any) { return this.paymentService.createChannel(body); }
}

@Controller('payment-records')
export class PaymentRecordAliasController {
  constructor(private readonly paymentService: PaymentConfigService) {}

  @Get()
  findAll() { return this.paymentService.listConfigs(); }
}

@Controller('payment-statistics')
export class PaymentStatisticsAliasController {
  constructor(private readonly paymentService: PaymentConfigService) {}

  @Get()
  getStats() { return this.paymentService.getStats(); }
}

// 打印模板模块别名
@Controller('printers')
export class PrinterAliasController {
  constructor(private readonly printService: PrintTemplateService) {}

  @Get()
  findAll() { return this.printService.list(); }

  @Post()
  create(@Body() body: any) { return this.printService.create(body); }
}

// 消息模板模块别名
@Controller('sms-templates')
export class SmsTemplateAliasController {
  constructor(private readonly messageService: MessageTemplateService) {}

  @Get()
  findAll() { return this.messageService.list(); }

  @Post()
  create(@Body() body: any) { return this.messageService.create(body); }

  @Post('sync')
  sync() { return this.messageService.list(); }
}

@Controller('wechat-templates')
export class WechatTemplateAliasController {
  constructor(private readonly messageService: MessageTemplateService) {}

  @Get()
  findAll() { return this.messageService.listWechatConfigs(); }

  @Post()
  create(@Body() body: any) { return this.messageService.createWechatConfig(body); }

  @Post('sync')
  sync() { return this.messageService.listWechatConfigs(); }
}

@Controller('message-records')
export class MessageRecordAliasController {
  constructor(private readonly messageService: MessageTemplateService) {}

  @Get()
  findAll() { return this.messageService.list(); }
}

@Controller('message-statistics')
export class MessageStatisticsAliasController {
  constructor(private readonly messageService: MessageTemplateService) {}

  @Get()
  getStats() { return this.messageService.getStats(); }
}

// 储值卡模块别名
@Controller('stored-value')
export class StoredValueAliasController {
  @Get()
  findAll() { return [{ id: 'sv-001', name: '基础储值卡', balance: 5000, discount: 0.95 }, { id: 'sv-002', name: 'VIP储值卡', balance: 10000, discount: 0.9 }]; }

  @Get('configs')
  findConfigs() { return [{ id: 'svc-001', name: '基础储值卡', minValue: 500, maxValue: 50000, discount: 0.95, status: 'active' }, { id: 'svc-002', name: 'VIP储值卡', minValue: 1000, maxValue: 100000, discount: 0.9, status: 'active' }]; }

  @Get('records')
  findRecords() { return [{ id: 'svr-001', memberId: 'mem-001', memberName: '张美玲', type: 'recharge', amount: 5000, balance: 8000, createdAt: '2026-05-08' }, { id: 'svr-002', memberId: 'mem-003', memberName: '李晓红', type: 'consume', amount: 498, balance: 9502, createdAt: '2026-05-09' }]; }
}

// 报表模块别名 - 前端路由映射到后端实际方法
@Controller('report')
export class ReportAliasController {
  constructor(private readonly reportService: ReportService) {}

  @Get('revenue-summary')
  getRevenueSummary(@Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    return this.reportService.getSummary({ startDate, endDate });
  }

  @Get('member-analysis')
  getMemberAnalysis(@Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    return this.reportService.getCustomer({ startDate, endDate });
  }

  @Get('targets')
  getTargets() {
    return this.reportService.getSalesTarget({});
  }

  @Get('business-overview')
  getBusinessOverview(@Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    return this.reportService.getOverview({ date: startDate });
  }

  @Get('time-slot-analysis')
  getTimeSlotAnalysis(@Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    return this.reportService.getTraffic({ startDate, endDate });
  }

  @Get('daily')
  getDaily(@Query('date') date?: string) {
    return this.reportService.getDailyReport(date || new Date().toISOString().slice(0, 10));
  }

  @Get('overview')
  getOverview(@Query('date') date?: string) {
    return this.reportService.getOverview({ date });
  }

  @Get('employee-performance')
  getEmployeePerformance(@Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    const start = startDate || new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
    const end = endDate || new Date().toISOString().slice(0, 10);
    return this.reportService.getEmployeePerformance(start, end);
  }

  @Get('service-ranking')
  getServiceRanking(@Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    const start = startDate || new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
    const end = endDate || new Date().toISOString().slice(0, 10);
    return this.reportService.getServiceSalesRanking(start, end);
  }
}

// 会员卡模块别名
@Controller('member-cards')
export class MemberCardAliasController {
  constructor(private readonly memberService: MemberService) {}

  @Get()
  findAll() { return this.memberService.findAll({}); }
}

// 会员优惠券模块别名
@Controller('member-coupons')
export class MemberCouponAliasController {
  constructor(private readonly memberService: MemberService) {}

  @Get()
  findAll() { return this.memberService.findAll({}); }
}

// 会员排名模块别名
@Controller('member-rankings')
export class MemberRankingAliasController {
  constructor(private readonly memberService: MemberService) {}

  @Get()
  findAll() { return this.memberService.findAll({}); }
}

// 门店配置模块别名
@Controller('store-configs')
export class StoreConfigAliasController {
  constructor(private readonly storeService: StoreService) {}

  @Get()
  findAll() { return this.storeService.findAll(); }
}

// 小程序用户模块别名
@Controller('miniapp')
export class MiniappAliasController {
  constructor(private readonly miniappService: MiniappService) {}

  @Get('users')
  findUsers() { return this.miniappService.getShopInfo(); }
}

// 服务评价模块别名 - /reviews 路由
@Controller('reviews')
export class ReviewAliasController2 {
  @Get()
  findAll() { return [{ id: 'rev-001', serviceName: '水光补水护理', memberName: '张美玲', rating: 5, content: '服务非常好，效果明显', createdAt: '2026-05-09' }, { id: 'rev-002', serviceName: '全身精油SPA', memberName: '李晓红', rating: 4, content: '环境不错，技师专业', createdAt: '2026-05-08' }]; }

  @Get('stats')
  getStats() { return { totalReviews: 2, averageRating: 4.5 }; }
}

// 打印模板模块别名 - /print-templates 路由
@Controller('print-templates')
export class PrintTemplateAliasController2 {
  constructor(private readonly printService: PrintTemplateService) {}

  @Get()
  findAll() { return this.printService.list(); }
}

// 消息模板模块别名 - /message-templates 路由
@Controller('message-templates')
export class MessageTemplateAliasController2 {
  constructor(private readonly messageService: MessageTemplateService) {}

  @Get()
  findAll() { return this.messageService.list(); }
}

// 会员标签模块别名
@Controller('member-tags')
export class MemberTagAliasController {
  constructor(private readonly memberService: MemberService) {}

  @Get()
  findAll() { return this.memberService.findAll({}); }
}

// 会员等级模块别名
@Controller('member-levels')
export class MemberLevelAliasController {
  constructor(private readonly memberLevelService: MemberLevelService) {}

  @Get()
  findAll() { return this.memberLevelService.findAllLevels(); }
}

// 会员积分模块别名
@Controller('member-points')
export class MemberPointsAliasController {
  constructor(private readonly memberService: MemberService) {}

  @Get()
  findAll() { return this.memberService.findAll({}); }
}

// 系统配置模块别名
@Controller('system-config')
export class SystemConfigAliasController {
  constructor(private readonly systemConfigService: SystemConfigService) {}

  @Get()
  findAll() { return this.systemConfigService.getAll(); }
}

// 支出模块别名
@Controller('expense')
export class ExpenseAliasController {
  constructor(private readonly expenseService: ExpenseService) {}

  @Get()
  findAll() { return this.expenseService.getExpenses({}); }

  @Get('categories')
  findCategories() { return this.expenseService.getCategories(); }
}

// 员工提成记录别名
@Controller('employees')
export class EmployeeSubAliasController {
  constructor(
    private readonly commissionRuleService: CommissionRuleService,
    private readonly attendanceService: AttendanceService,
  ) {}

  @Get('commission-records')
  findCommissionRecords() {
    return this.commissionRuleService.findAll();
  }
}

// 服务评价别名 - /service-reviews 映射到 service/reviews
@Controller('service-reviews')
export class ServiceReviewAliasController {
  constructor(private readonly reviewService: ServiceReviewService) {}

  @Get()
  findAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    const p = page ? parseInt(page, 10) : 1;
    const l = limit ? parseInt(limit, 10) : 20;
    return this.reviewService.findAll(undefined, undefined, undefined, undefined, p, l);
  }

  @Get('stats')
  getStats() { return { totalReviews: 0, averageRating: 0, ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }, tagStatistics: [] }; }
}

// 考勤模块别名 - 前端用 /api/attendance/* 而后端是 /api/employees/attendance/*
@Controller('attendance')
export class AttendanceAliasController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Get()
  findAll(@Query('employeeId') employeeId?: string, @Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    return this.attendanceService.findByEmployee({ employeeId, startDate, endDate });
  }

  @Get('today')
  findToday(@Query('employeeId') employeeId?: string) {
    const today = new Date().toISOString().slice(0, 10);
    return this.attendanceService.findByEmployee({ employeeId, startDate: today, endDate: today });
  }

  @Get('stats')
  getStats(@Query('employeeId') employeeId?: string, @Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    const start = startDate || new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
    const end = endDate || new Date().toISOString().slice(0, 10);
    return this.attendanceService.getStats({ employeeId, startDate: start, endDate: end });
  }

  @Post('check-in')
  checkIn(@Body() body: { employeeId: string; checkInLocation?: string; checkInPhoto?: string }) {
    return this.attendanceService.checkIn(body);
  }

  @Post('check-out')
  checkOut(@Body() body: { employeeId: string; checkOutLocation?: string; checkOutPhoto?: string }) {
    return this.attendanceService.checkOut(body);
  }
}

// 订单模块别名 - 前端用 /api/orders 而后端是 /api/cashier/consumptions
@Controller('orders')
export class OrderAliasController {
  constructor(private readonly cashierService: CashierService) {}

  @Get()
  findAll(@Query('page') page?: string, @Query('pageSize') pageSize?: string, @Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    return this.cashierService.queryDocuments({ page: page ? parseInt(page, 10) : 1, pageSize: pageSize ? parseInt(pageSize, 10) : 20, startDate, endDate });
  }
}

// 会员充值别名 - 前端用 /api/member/recharge
@Controller('member')
export class MemberActionAliasController {
  constructor(private readonly memberService: MemberService) {}

  @Post('recharge')
  recharge(@Body() body: { memberId: string; amount: number; bonus?: number; paymentMethod?: string; remark?: string }) {
    return this.memberService.recharge(body.memberId, body.amount, body.bonus);
  }
}

// 计次卡复数形式别名 - 前端用 /api/count-cards
@Controller('count-cards')
export class CountCardsAliasController {
  constructor(private readonly countCardService: CountCardService) {}

  @Get()
  findAll() { return this.countCardService.findAllPackages(); }
}

// 收银台单据查询别名 - 前端用 /api/cashier/documents
@Controller('cashier')
export class CashierAliasController {
  constructor(private readonly cashierService: CashierService) {}

  @Get('documents')
  queryDocuments(@Query('page') page?: string, @Query('pageSize') pageSize?: string, @Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    return this.cashierService.queryDocuments({ page: page ? parseInt(page, 10) : 1, pageSize: pageSize ? parseInt(pageSize, 10) : 20, startDate, endDate });
  }

  @Get('daily')
  getDaily(@Query('date') date?: string) {
    return this.cashierService.getDailySummary(date ? new Date(date) : new Date());
  }

  @Get('products')
  getProducts(@Query('categoryId') categoryId?: string, @Query('keyword') keyword?: string) {
    return this.cashierService.getProducts(categoryId, keyword);
  }

  @Post('consume')
  consume(@Body() body: any, @Req() req: any) {
    return this.cashierService.create(body, req.user?.userId);
  }

  @Post('open-card')
  openCard(@Body() body: any, @Req() req: any) {
    return this.cashierService.create(body, req.user?.userId);
  }

  @Post('merge')
  merge(@Body() body: any, @Req() req: any) {
    return this.cashierService.create(body, req.user?.userId);
  }

  @Get('order/:orderNo')
  getOrder(@Param('orderNo') orderNo: string) {
    return this.cashierService.getOrderDetail(orderNo);
  }

  @Post('order/:orderNo/cancel')
  cancelOrder(@Param('orderNo') orderNo: string, @Req() req: any) {
    return this.cashierService.cancelOrder(orderNo, req.user?.userId);
  }
}

// 报表复数形式别名 - 前端用 /api/reports/*
@Controller('reports')
export class ReportsAliasController {
  constructor(private readonly reportService: ReportService) {}

  @Get('overview')
  getOverview(@Query('date') date?: string) {
    return this.reportService.getOverview({ date });
  }

  @Get('revenue-summary')
  getRevenueSummary(@Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    return this.reportService.getSummary({ startDate, endDate });
  }

  @Get('member-analysis')
  getMemberAnalysis(@Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    return this.reportService.getCustomer({ startDate, endDate });
  }

  @Get('employee-performance')
  getEmployeePerformance(@Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    const start = startDate || new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
    const end = endDate || new Date().toISOString().slice(0, 10);
    return this.reportService.getEmployeePerformance(start, end);
  }

  @Get('service-ranking')
  getServiceRanking(@Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    const start = startDate || new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
    const end = endDate || new Date().toISOString().slice(0, 10);
    return this.reportService.getServiceSalesRanking(start, end);
  }
}

// 库存成本分析补充路由
@Controller('inventory/cost-analysis')
export class InventoryCostAnalysisAliasController {
  constructor(private readonly stockCostService: StockCostService) {}

  @Get('top-products')
  getTopProducts(@Query('limit') limit?: string) {
    return this.stockCostService.getAllCostSummaries();
  }

  @Get('warnings')
  getWarnings() {
    return this.stockCostService.getAllCostSummaries();
  }

  @Get('report')
  getReport() {
    return this.stockCostService.getAllCostSummaries();
  }
}

// 采购记录补充路由
@Controller('inventory/purchases')
export class PurchaseAliasController {
  constructor(private readonly purchaseService: PurchaseService) {}

  @Get('records')
  findRecords(@Query() query: any) {
    return this.purchaseService.findAll(query);
  }

  @Get('pending-approval')
  findPendingApproval(@Query() query: any) {
    return this.purchaseService.findPendingApproval(query);
  }

  @Post()
  create(@Body() body: any, @Req() req: any) {
    return this.purchaseService.create(body, req.user?.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.purchaseService.findOne(id);
  }

  @Post(':id/approve')
  approve(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.purchaseService.approve(id, body, req.user?.userId);
  }

  @Post(':id/reject')
  reject(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.purchaseService.approve(id, { ...body, approved: false }, req.user?.userId);
  }

  @Post(':id/stock-in')
  stockIn(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.purchaseService.receive(id, body, req.user?.userId);
  }

  @Post(':id/cancel')
  cancel(@Param('id') id: string) {
    return this.purchaseService.cancel(id);
  }
}

// 库存预警统计补充路由
@Controller('inventory/alerts')
export class InventoryAlertsAliasController {
  constructor(private readonly stockAlertService: StockAlertService) {}

  @Get('statistics')
  getStatistics() {
    return this.stockAlertService.findAll({});
  }

  @Post(':id/handle')
  handle(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.stockAlertService.handle(id, body, req.user?.userId);
  }

  @Post(':id/ignore')
  ignore(@Param('id') id: string, @Req() req: any) {
    return this.stockAlertService.ignore(id, req.user?.userId);
  }

  @Post('batch-handle')
  batchHandle(@Body() body: any, @Req() req: any) {
    return this.stockAlertService.findAll({});
  }
}

// 操作日志统计补充路由
@Controller('operation-logs')
export class OperationLogAliasController {
  constructor(private readonly logService: OperationLogService) {}

  @Get()
  query(@Query() query: any) {
    return this.logService.query(query);
  }

  @Get('stats/type')
  getStatsByType(@Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    return this.logService.getStats();
  }

  @Get('stats/module')
  getStatsByModule(@Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    return this.logService.getStats();
  }

  @Get('stats/user')
  getStatsByUser(@Query('userId') userId?: string) {
    if (userId) {
      return this.logService.getUserStats(userId);
    }
    return this.logService.getStats();
  }

  @Get('export')
  export(@Query() query: any) {
    return this.logService.query(query);
  }

  @Delete('clean')
  clean(@Body() body: { daysToKeep?: number }) {
    return this.logService.cleanOldLogs(body?.daysToKeep || 90);
  }
}

// 提成复数形式别名 - 前端用 /api/commissions
@Controller('commissions')
export class CommissionsAliasController {
  constructor(private readonly commissionRuleService: CommissionRuleService) {}

  @Get()
  findAll() { return this.commissionRuleService.findAll(); }
}

// 排班别名 - 前端用 /api/schedules
@Controller('schedules')
export class SchedulesAliasController {
  constructor(private readonly workScheduleService: WorkScheduleService) {}

  @Get()
  findAll() { return this.workScheduleService.findAll(); }
}

// 小程序配置别名 - 前端用 /api/miniapp/config
@Controller('miniapp')
export class MiniappConfigAliasController {
  constructor(private readonly miniappService: MiniappService) {}

  @Get('config')
  getConfig() { return this.miniappService.getShopInfo(); }
}

// 集成复数形式别名 - 前端用 /api/integrations
@Controller('integrations')
export class IntegrationsAliasController {
  constructor(private readonly integrationService: IntegrationService) {}

  @Get()
  findAll() { return this.integrationService.getCoupons({}); }
}

// 参数设置别名 - 前端用 /api/param-settings
@Controller('param-settings')
export class ParamSettingsAliasController {
  constructor(private readonly paramSettingsService: ParamSettingsService) {}

  @Get()
  findAll() { return this.paramSettingsService.getUserGroups(); }
}

// 文件上传别名 - 前端用 /api/upload
@Controller('upload')
export class UploadAliasController {
  @Post()
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: path.join(process.cwd(), 'uploads', 'avatars'),
      filename: (_req: any, file: any, callback: any) => {
        const ext = path.extname(file.originalname);
        const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
        callback(null, name);
      },
    }),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req: any, file: any, callback: any) => {
      if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
        callback(new Error('只支持图片文件（jpg/png/gif/webp）'), false);
        return;
      }
      callback(null, true);
    },
  }))
  upload(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('请选择要上传的文件');
    }
    const url = `/uploads/avatars/${file.filename}`;
    return { url };
  }
}

// 服务分类别名 - 前端用 /api/service-categories
@Controller('service-categories')
export class ServiceCategoryAliasController {
  constructor(private readonly serviceCategoryService: ServiceCategoryService) {}

  @Get()
  findAll() { return this.serviceCategoryService.findAll(); }
}

// 积分模块别名 - 前端用 /api/points/* 而后端是 /api/member-points/* 和 /api/point-exchange/*
@Controller('points')
export class PointsAliasController {
  constructor(
    private readonly pointsService: MemberPointsService,
    private readonly exchangeService: PointExchangeService,
    private readonly memberService: MemberService,
  ) {}

  @Get('overview')
  async getOverview() {
    const members = await this.memberService.findAll({});
    const arr = Array.isArray(members) ? members : (members as any).data || (members as any).items || [];
    let totalIssued = 0, totalUsed = 0, totalBalance = 0;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    let monthIssued = 0, monthUsed = 0;
    arr.forEach((m: any) => {
      const pts = Number(m.points) || 0;
      totalBalance += pts;
    });
    const allRecords = await this.pointsService.getPointsRecords({ page: 1, pageSize: 9999 } as any);
    (allRecords.records || []).forEach((r: any) => {
      const p = Number(r.points) || 0;
      if (p > 0) { totalIssued += p; if (new Date(r.createdAt) >= monthStart) monthIssued += p; }
      else { totalUsed += Math.abs(p); if (new Date(r.createdAt) >= monthStart) monthUsed += Math.abs(p); }
    });
    return { totalIssued, totalUsed, totalBalance, monthIssued, monthUsed };
  }

  @Get('records')
  getRecords(@Query() query: any) { return this.pointsService.getPointsRecords(query); }

  @Get('exchange-rules')
  getExchangeRules() { return this.exchangeService.findRules(); }

  @Post('adjust')
  adjust(@Body() body: any, @Req() req: any) { return this.pointsService.earnPoints(body, req.user?.userId); }

  @Post('exchange')
  exchange(@Body() body: any, @Req() req: any) { return this.exchangeService.exchange(body, body.memberId, req.user?.userId); }

  @Put('exchange-rules/:id')
  updateRule(@Param('id') id: string, @Body() body: any, @Req() req: any) { return this.exchangeService.createRule(body, req.user?.userId); }

  @Delete('exchange-rules/:id')
  deleteRule(@Param('id') id: string) { return { success: true }; }
}

// 积分商城别名 - 前端用 /api/points-mall/* 而后端是 /api/marketing/points-goods/*
@Controller('points-mall')
export class PointsMallAliasController {
  constructor(
    private readonly pointsMallService: PointsMallService,
    private readonly couponService: CouponService,
  ) {}

  @Get('products')
  getProducts(@Query() query: any) { return this.pointsMallService.findAllGoods(query); }

  @Get('overview')
  getOverview() { return this.pointsMallService.findAllGoods({}); }

  @Get('hot-products')
  getHotProducts() { return this.pointsMallService.findActiveGoods(); }

  @Get('exchanges')
  getExchanges(@Query() query: any) { return this.pointsMallService.getExchangeList(query); }

  @Post('products')
  createProduct(@Body() body: any, @Req() req: any) { return this.pointsMallService.createGoods(body, req.user?.userId); }

  @Put('products/:id')
  updateProduct(@Param('id') id: string, @Body() body: any) { return this.pointsMallService.updateGoods(id, body); }

  @Delete('products/:id')
  removeProduct(@Param('id') id: string) { return this.pointsMallService.removeGoods(id); }

  @Post('exchanges/:id/fulfill')
  fulfillExchange(@Param('id') id: string, @Body() body: any, @Req() req: any) { return this.pointsMallService.updateExchangeStatus({ exchangeId: id, status: 'completed' as any }, req.user?.userId); }

  @Get('exchanges/export')
  exportExchanges(@Query() query: any) { return this.pointsMallService.getExchangeList(query); }
}

// 会员详情子路由别名 - 前端用 /api/members/:id/profile, /api/members/:id/tags 等
@Controller('members')
export class MemberDetailAliasController {
  constructor(
    private readonly portraitService: MemberPortraitService,
    private readonly tagService: MemberTagService,
    private readonly referralService: MemberReferralService,
  ) {}

  @Get(':id/profile')
  getProfile(@Param('id') id: string, @Query('yearMonth') yearMonth?: string) {
    return this.portraitService.getConsumptionAnalysis({ memberId: id, startDate: '', endDate: '' });
  }

  @Get(':id/tags')
  getTags(@Param('id') id: string) {
    return this.tagService.getMemberTags(id);
  }

  @Get(':id/referrals')
  getReferrals(@Param('id') id: string) {
    return this.referralService.getReferralStats(id);
  }

  @Get(':id/referral-rewards')
  getReferralRewards(@Param('id') id: string) {
    return this.referralService.queryReferrals({ memberId: id } as any);
  }

  @Put(':id/tags')
  updateTags(@Param('id') id: string, @Body() body: any, @Request() req: any) {
    return this.tagService.tagMember({ memberId: id, tagIds: body.tagIds || [] } as any, req.user?.userId || 'system');
  }

  @Delete(':id/tags/:tagId')
  removeTag(@Param('id') id: string, @Param('tagId') tagId: string) {
    return this.tagService.untagMember(id, tagId);
  }
}

// 排队模块别名 - 前端用 /api/queue/*
@Controller('queue')
export class QueueAliasController {
  @Get()
  findAll() { return { list: [], total: 0 }; }

  @Post('take')
  takeNumber(@Body() body: any) { return { id: 'queue-001', number: 1, status: 'waiting', createdAt: new Date().toISOString() }; }

  @Post(':id/call')
  callNumber(@Param('id') id: string) { return { id, status: 'called' }; }

  @Post(':id/start')
  startService(@Param('id') id: string) { return { id, status: 'serving' }; }

  @Post(':id/complete')
  completeService(@Param('id') id: string) { return { id, status: 'completed' }; }

  @Post(':id/skip')
  skipNumber(@Param('id') id: string) { return { id, status: 'skipped' }; }

  @Post(':id/cancel')
  cancelNumber(@Param('id') id: string, @Body() body: any) { return { id, status: 'cancelled' }; }
}

// 礼品模块别名 - 前端用 /api/gifts 而后端是 /api/gift
@Controller('gifts')
export class GiftsAliasController {
  constructor(private readonly memberService: MemberService) {}

  @Get()
  findAll() { return this.memberService.findAll({}); }
}
