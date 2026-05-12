import { Module } from '@nestjs/common';
import {
  BackupAliasController,
  CountCardAliasController,
  PaymentMethodAliasController,
  PaymentChannelAliasController,
  PaymentRecordAliasController,
  PaymentStatisticsAliasController,
  PrinterAliasController,
  SmsTemplateAliasController,
  WechatTemplateAliasController,
  MessageRecordAliasController,
  MessageStatisticsAliasController,
  StoredValueAliasController,
  ReportAliasController,
  MemberCardAliasController,
  MemberCouponAliasController,
  MemberRankingAliasController,
  StoreConfigAliasController,
  MiniappAliasController,
  ReviewAliasController2,
  PrintTemplateAliasController2,
  MessageTemplateAliasController2,
  MemberTagAliasController,
  MemberLevelAliasController,
  MemberPointsAliasController,
  SystemConfigAliasController,
  ExpenseAliasController,
  EmployeeSubAliasController,
  ServiceReviewAliasController,
  AttendanceAliasController,
  OrderAliasController,
  MemberActionAliasController,
  CountCardsAliasController,
  CashierAliasController,
  ReportsAliasController,
  InventoryCostAnalysisAliasController,
  PurchaseAliasController,
  InventoryAlertsAliasController,
  OperationLogAliasController,
  CommissionsAliasController,
  SchedulesAliasController,
  MiniappConfigAliasController,
  IntegrationsAliasController,
  ParamSettingsAliasController,
  UploadAliasController,
  ServiceCategoryAliasController,
} from './route-alias.controller';
import { BackupModule } from '../backup/backup.module';
import { CountCardModule } from '../count-card/count-card.module';
import { PaymentConfigModule } from '../payment-config/payment-config.module';
import { PrintTemplateModule } from '../print-template/print-template.module';
import { MessageTemplateModule } from '../message-template/message-template.module';
import { ReportModule } from '../report/report.module';
import { MemberModule } from '../member/member.module';
import { StoreModule } from '../store/store.module';
import { MiniappModule } from '../miniapp/miniapp.module';
import { SystemConfigModule } from '../system-config/system-config.module';
import { ExpenseModule } from '../expense/expense.module';
import { EmployeeModule } from '../employee/employee.module';
import { ServiceModule } from '../service/service.module';
import { CashierModule } from '../cashier/cashier.module';
import { InventoryModule } from '../inventory/inventory.module';
import { OperationLogModule } from '../operation-log/operation-log.module';
import { IntegrationModule } from '../integration/integration.module';
import { ParamSettingsModule } from '../param-settings/param-settings.module';

@Module({
  imports: [
    BackupModule,
    CountCardModule,
    PaymentConfigModule,
    PrintTemplateModule,
    MessageTemplateModule,
    ReportModule,
    MemberModule,
    StoreModule,
    MiniappModule,
    SystemConfigModule,
    ExpenseModule,
    EmployeeModule,
    ServiceModule,
    CashierModule,
    InventoryModule,
    OperationLogModule,
    IntegrationModule,
    ParamSettingsModule,
  ],
  controllers: [
    BackupAliasController,
    CountCardAliasController,
    PaymentMethodAliasController,
    PaymentChannelAliasController,
    PaymentRecordAliasController,
    PaymentStatisticsAliasController,
    PrinterAliasController,
    SmsTemplateAliasController,
    WechatTemplateAliasController,
    MessageRecordAliasController,
    MessageStatisticsAliasController,
    StoredValueAliasController,
    ReportAliasController,
    MemberCardAliasController,
    MemberCouponAliasController,
    MemberRankingAliasController,
    StoreConfigAliasController,
    MiniappAliasController,
    ReviewAliasController2,
    PrintTemplateAliasController2,
    MessageTemplateAliasController2,
    MemberTagAliasController,
    MemberLevelAliasController,
    MemberPointsAliasController,
    SystemConfigAliasController,
    ExpenseAliasController,
    EmployeeSubAliasController,
    ServiceReviewAliasController,
    AttendanceAliasController,
    OrderAliasController,
    MemberActionAliasController,
    CountCardsAliasController,
    CashierAliasController,
    ReportsAliasController,
    InventoryCostAnalysisAliasController,
    PurchaseAliasController,
    InventoryAlertsAliasController,
    OperationLogAliasController,
    CommissionsAliasController,
    SchedulesAliasController,
    MiniappConfigAliasController,
    IntegrationsAliasController,
    ParamSettingsAliasController,
    UploadAliasController,
    ServiceCategoryAliasController,
  ],
})
export class RouteAliasModule {}
