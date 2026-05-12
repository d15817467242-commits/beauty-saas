import { IsNotEmpty, IsOptional, IsEnum, IsNumber, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod, ConsumptionType } from '../consumption.entity';

export class ConsumptionItemDto {
  @IsNotEmpty()
  serviceId: string;

  @Type(() => Number)
  @IsNumber()
  quantity: number;

  @IsOptional()
  employeeId?: string;

  @IsOptional()
  employeeName?: string;

  @IsOptional()
  serviceName?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  price?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  amount?: number;
}

export class CreateConsumptionDto {
  @IsOptional()
  memberId?: string;

  @IsOptional()
  @IsEnum(ConsumptionType)
  consumptionType?: ConsumptionType;

  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @IsOptional()
  paymentDetail?: Record<string, any>;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConsumptionItemDto)
  items: ConsumptionItemDto[];

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  actualAmount?: number;

  @IsOptional()
  employeeId?: string;

  @IsOptional()
  remark?: string;
}
