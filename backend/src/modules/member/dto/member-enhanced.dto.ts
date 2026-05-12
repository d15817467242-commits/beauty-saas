import { IsString, IsNumber, IsOptional, Min, IsBoolean, IsArray, IsEnum, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

// ==================== 会员标签 DTO ====================

export class CreateMemberTagDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  color?: string;

  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateMemberTagDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  color?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class TagMemberDto {
  @IsString()
  memberId: string;

  @IsString()
  tagId: string;
}

export class BatchTagMembersDto {
  @IsArray()
  memberIds: string[];

  @IsString()
  tagId: string;
}

// ==================== 积分兑换 DTO ====================

export class CreatePointExchangeRuleDto {
  @IsString()
  name: string;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  pointsRequired: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  rewardAmount?: number;

  @IsString()
  @IsOptional()
  couponId?: string;

  @IsString()
  @IsOptional()
  serviceId?: string;
}

export class ExchangePointsDto {
  @IsString()
  ruleId: string;
}

// ==================== 门店 DTO ====================

export class CreateStoreDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  code?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  remark?: string;
}

// ==================== 会员等级 DTO ====================

export class CreateMemberLevelDto {
  @IsString()
  name: string;

  @IsString()
  code: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  minPoints?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  minSpent?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  minVisits?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  levelOrder?: number;

  @IsString()
  @IsOptional()
  icon?: string;

  @IsString()
  @IsOptional()
  color?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  discountRate?: number;
}

export class UpdateMemberLevelDto {
  @IsString()
  @IsOptional()
  name?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  minPoints?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  minSpent?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  minVisits?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  levelOrder?: number;

  @IsString()
  @IsOptional()
  icon?: string;

  @IsString()
  @IsOptional()
  color?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  discountRate?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class CreateLevelBenefitDto {
  @IsString()
  levelId: string;

  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  benefitValue?: number;

  @IsString()
  @IsOptional()
  benefitType?: string;

  @IsString()
  @IsOptional()
  relatedId?: string;
}

// ==================== 积分系统 DTO ====================

export class EarnPointsDto {
  @IsString()
  memberId: string;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  points: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  relatedId?: string;

  @IsString()
  @IsOptional()
  relatedType?: string;

  @IsDateString()
  @IsOptional()
  expireTime?: string;
}

export class ConsumePointsDto {
  @IsString()
  memberId: string;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  points: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  relatedId?: string;

  @IsString()
  @IsOptional()
  relatedType?: string;
}

export class QueryPointsRecordsDto {
  @IsString()
  @IsOptional()
  memberId?: string;

  @IsString()
  @IsOptional()
  type?: string;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  page?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  pageSize?: number;
}

// ==================== 推荐关系 DTO ====================

export class CreateReferralDto {
  @IsString()
  referrerId: string;

  @IsString()
  refereeId: string;
}

export class QueryReferralsDto {
  @IsString()
  memberId: string;

  @IsString()
  @IsOptional()
  type?: 'referrer' | 'referee';

  @IsString()
  @IsOptional()
  status?: string;
}

// ==================== 消费分析 DTO ====================

export class ConsumptionAnalysisQueryDto {
  @IsString()
  memberId: string;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;
}
