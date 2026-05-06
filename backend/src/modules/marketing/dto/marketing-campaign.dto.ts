import { IsString, IsEnum, IsNumber, IsOptional, IsBoolean, IsArray, IsDateString, Min, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { CampaignType, CampaignStatus, RuleType } from '../marketing-campaign.entity';

export class CreateCampaignDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  subtitle?: string;

  @IsEnum(CampaignType)
  type: CampaignType;

  @IsDateString()
  startTime: string;

  @IsDateString()
  endTime: string;

  @IsObject()
  @IsOptional()
  rules?: Record<string, any>;

  @IsObject()
  @IsOptional()
  targetConditions?: {
    memberLevels?: string[];
    registerDays?: number;
    minConsumeAmount?: number;
    tags?: string[];
    newMember?: boolean;
  };

  @IsArray()
  @IsOptional()
  applicableServices?: string[];

  @IsArray()
  @IsOptional()
  applicableProducts?: string[];

  @IsArray()
  @IsOptional()
  applicableStores?: string[];

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  budgetAmount?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  participateLimit?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  dailyLimit?: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  bannerImage?: string;

  @IsArray()
  @IsOptional()
  detailImages?: string[];
}

export class UpdateCampaignDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  subtitle?: string;

  @IsEnum(CampaignStatus)
  @IsOptional()
  status?: CampaignStatus;

  @IsDateString()
  @IsOptional()
  startTime?: string;

  @IsDateString()
  @IsOptional()
  endTime?: string;

  @IsObject()
  @IsOptional()
  rules?: Record<string, any>;

  @IsObject()
  @IsOptional()
  targetConditions?: any;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  budgetAmount?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  participateLimit?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  dailyLimit?: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  bannerImage?: string;
}

export class CreateCampaignRuleDto {
  @IsString()
  campaignId: string;

  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(RuleType)
  type: RuleType;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  priority?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  minAmount?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  maxAmount?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  discountValue?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  maxDiscount?: number;

  @IsArray()
  @IsOptional()
  giftItems?: {
    productId?: string;
    serviceName?: string;
    quantity: number;
  }[];

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  useLimit?: number;

  @IsBoolean()
  @IsOptional()
  enabled?: boolean;
}

export class UpdateCampaignRuleDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(RuleType)
  @IsOptional()
  type?: RuleType;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  priority?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  minAmount?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  maxAmount?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  discountValue?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  maxDiscount?: number;

  @IsArray()
  @IsOptional()
  giftItems?: any[];

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  useLimit?: number;

  @IsBoolean()
  @IsOptional()
  enabled?: boolean;
}

export class CampaignEffectQueryDto {
  @IsString()
  campaignId: string;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;
}
