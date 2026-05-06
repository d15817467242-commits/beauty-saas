import { IsString, IsNumber, IsOptional, Min, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCreditDto {
  @IsString()
  memberId: string;

  @IsString()
  orderId: string;

  @IsString()
  orderNo: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  totalAmount: number;

  @IsDateString()
  @IsOptional()
  dueTime?: string;

  @IsString()
  @IsOptional()
  remark?: string;
}

export class CreateCreditPaymentDto {
  @IsString()
  creditId: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsString()
  @IsOptional()
  paymentMethod?: string;

  @IsString()
  @IsOptional()
  remark?: string;
}

export class QueryCreditDto {
  @IsString()
  @IsOptional()
  memberId?: string;

  @IsString()
  @IsOptional()
  status?: string;
}
