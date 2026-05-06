import { IsString, IsOptional, IsBoolean, IsNumber, IsObject, IsEnum, IsArray, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod, PaymentChannelType, PaymentStatus } from '../payment-config.entity';

// Re-export for backward compatibility
export { PaymentMethod, PaymentChannelType, PaymentStatus };

export class CreatePaymentConfigDto {
  @IsOptional()
  @IsString()
  storeId?: string;

  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @IsString()
  @MaxLength(50)
  name: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsArray()
  @IsEnum(PaymentChannelType, { each: true })
  channels?: PaymentChannelType[];

  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  handlingFee?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minAmount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxAmount?: number;

  @IsOptional()
  @IsObject()
  config?: Record<string, any>;

  @IsOptional()
  @IsObject()
  extra?: Record<string, any>;
}

export class UpdatePaymentConfigDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  name?: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsArray()
  @IsEnum(PaymentChannelType, { each: true })
  channels?: PaymentChannelType[];

  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  handlingFee?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minAmount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxAmount?: number;

  @IsOptional()
  @IsObject()
  config?: Record<string, any>;

  @IsOptional()
  @IsObject()
  extra?: Record<string, any>;
}

export class CreatePaymentChannelDto {
  @IsString()
  paymentConfigId: string;

  @IsEnum(PaymentChannelType)
  channel: PaymentChannelType;

  @IsString()
  @MaxLength(50)
  name: string;

  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;

  @IsOptional()
  @IsString()
  appId?: string;

  @IsOptional()
  @IsString()
  mchId?: string;

  @IsOptional()
  @IsString()
  apiKey?: string;

  @IsOptional()
  @IsString()
  apiSecret?: string;

  @IsOptional()
  @IsString()
  certPath?: string;

  @IsOptional()
  @IsString()
  notifyUrl?: string;

  @IsOptional()
  @IsObject()
  config?: Record<string, any>;
}

export class UpdatePaymentChannelDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  name?: string;

  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;

  @IsOptional()
  @IsString()
  appId?: string;

  @IsOptional()
  @IsString()
  mchId?: string;

  @IsOptional()
  @IsString()
  apiKey?: string;

  @IsOptional()
  @IsString()
  apiSecret?: string;

  @IsOptional()
  @IsString()
  certPath?: string;

  @IsOptional()
  @IsString()
  notifyUrl?: string;

  @IsOptional()
  @IsObject()
  config?: Record<string, any>;
}

export class BatchUpdatePaymentStatusDto {
  @IsString({ each: true })
  ids: string[];

  @IsEnum(PaymentStatus)
  status: PaymentStatus;
}
