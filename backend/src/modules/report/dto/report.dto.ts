import { IsOptional, IsDateString, IsNumber, Min, IsEnum, IsString, IsUUID, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

// 基础查询DTO
export class BaseReportQueryDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsUUID()
  storeId?: string;

  @IsOptional()
  @IsUUID()
  employeeId?: string;

  @IsOptional()
  @IsUUID()
  memberId?: string;
}

// 分页查询DTO
export class PageQueryDto extends BaseReportQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  pageSize?: number;
}

// 目标设置DTO
export class CreateTargetDto {
  @IsString()
  name: string;

  @IsString()
  type: string;

  @IsString()
  month: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  targetAmount: number;

  @IsOptional()
  @IsUUID()
  storeId?: string;

  @IsOptional()
  @IsUUID()
  employeeId?: string;
}

export class UpdateTargetDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  targetAmount?: number;
}

// 目标查询DTO
export class TargetQueryDto extends BaseReportQueryDto {
  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  month?: string;
}

// 营收汇总查询DTO
export class RevenueSummaryQueryDto extends BaseReportQueryDto {
  @IsOptional()
  @IsEnum(['day', 'week', 'month'])
  groupBy?: 'day' | 'week' | 'month';
}

// 经营总览查询DTO
export class BusinessOverviewQueryDto {
  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsUUID()
  storeId?: string;
}

// 劳动业绩查询DTO
export class LaborQueryDto extends BaseReportQueryDto {
  @IsOptional()
  @IsEnum(['day', 'week', 'month'])
  groupBy?: 'day' | 'week' | 'month';
}

// 资产报表查询DTO
export class AssetQueryDto extends BaseReportQueryDto {
  @IsOptional()
  @IsEnum(['card', 'recharge', 'point'])
  assetType?: 'card' | 'recharge' | 'point';
}

// 优惠统计查询DTO
export class DiscountQueryDto extends BaseReportQueryDto {
  @IsOptional()
  @IsString()
  discountType?: string;
}

// 客情分析查询DTO
export class CustomerQueryDto extends BaseReportQueryDto {
  @IsOptional()
  @IsEnum(['new', 'old', 'vip'])
  customerType?: 'new' | 'old' | 'vip';

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number;
}

// 营收趋势查询DTO
export class TrendQueryDto extends BaseReportQueryDto {
  @IsOptional()
  @IsEnum(['day', 'week', 'month'])
  groupBy?: 'day' | 'week' | 'month';

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  days?: number;
}

// 营收利润查询DTO
export class ProfitQueryDto extends BaseReportQueryDto {
  @IsOptional()
  @IsBoolean()
  includeCost?: boolean;
}

// 银行对账单查询DTO
export class BankQueryDto extends BaseReportQueryDto {
  @IsOptional()
  @IsString()
  bankName?: string;
}

// 员工业务分析查询DTO
export class EmployeeBusinessQueryDto extends BaseReportQueryDto {
  @IsOptional()
  @IsString()
  businessType?: string;
}

// 品项分析查询DTO
export class ItemAnalysisQueryDto extends BaseReportQueryDto {
  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number;

  @IsOptional()
  @IsEnum(['sales', 'revenue', 'profit'])
  sortBy?: 'sales' | 'revenue' | 'profit';
}

// 顾客消费汇总查询DTO
export class CustomerConsumptionQueryDto extends PageQueryDto {
  @IsOptional()
  @IsEnum(['amount', 'count', 'avg'])
  sortBy?: 'amount' | 'count' | 'avg';

  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}

// 顾客消费明细查询DTO
export class CustomerDetailQueryDto extends PageQueryDto {
  @IsOptional()
  @IsString()
  consumptionType?: string;
}

// 充值明细查询DTO
export class RechargeDetailQueryDto extends PageQueryDto {
  @IsOptional()
  @IsString()
  paymentMethod?: string;
}

// 次卡销售明细查询DTO
export class CardSalesQueryDto extends PageQueryDto {
  @IsOptional()
  @IsString()
  cardType?: string;
}

// 次卡消费明细查询DTO
export class CardConsumptionQueryDto extends PageQueryDto {
  @IsOptional()
  @IsString()
  cardId?: string;
}

// 员工提成汇总查询DTO
export class EmployeeCommissionQueryDto extends BaseReportQueryDto {
  @IsOptional()
  @IsEnum(['service', 'product', 'total'])
  commissionType?: 'service' | 'product' | 'total';
}

// 提成明细查询DTO
export class CommissionDetailQueryDto extends PageQueryDto {
  @IsOptional()
  @IsString()
  commissionType?: string;
}

// 工资统计查询DTO
export class SalaryQueryDto extends BaseReportQueryDto {
  @IsOptional()
  @IsBoolean()
  includeBonus?: boolean;
}

// 会员卡变更查询DTO
export class MemberCardChangeQueryDto extends PageQueryDto {
  @IsOptional()
  @IsString()
  changeType?: string;
}

// 会员余额统计查询DTO
export class MemberBalanceQueryDto extends BaseReportQueryDto {
  @IsOptional()
  @IsEnum(['level', 'range'])
  groupBy?: 'level' | 'range';
}

// 会员次卡统计查询DTO
export class MemberCardQueryDto extends BaseReportQueryDto {
  @IsOptional()
  @IsString()
  cardType?: string;
}

// 积分变更查询DTO
export class PointChangeQueryDto extends PageQueryDto {
  @IsOptional()
  @IsString()
  changeType?: string;
}

// 现金对账查询DTO
export class CashReconciliationQueryDto extends BaseReportQueryDto {
  @IsOptional()
  @IsBoolean()
  verified?: boolean;
}

// 客流统计查询DTO
export class TrafficQueryDto extends BaseReportQueryDto {
  @IsOptional()
  @IsEnum(['hour', 'day', 'week'])
  groupBy?: 'hour' | 'day' | 'week';
}

// 短信费收取记录查询DTO
export class SmsFeeQueryDto extends PageQueryDto {
  @IsOptional()
  @IsString()
  status?: string;
}
