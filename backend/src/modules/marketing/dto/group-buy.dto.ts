import { IsString, IsNumber, IsOptional, IsDateString, Min, IsBoolean, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { GroupBuyStatus } from '../group-buy.entity';

export class CreateGroupBuyDto {
  @IsString()
  name: string;

  @IsString()
  serviceId: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  originalPrice: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  groupPrice: number;

  @Type(() => Number)
  @IsNumber()
  @Min(2)
  minPeople: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  maxPeople?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  timeLimit?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  totalStock?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  perLimit?: number;

  @IsDateString()
  startTime: string;

  @IsDateString()
  endTime: string;

  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateGroupBuyDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEnum(GroupBuyStatus)
  @IsOptional()
  status?: GroupBuyStatus;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  groupPrice?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(2)
  @IsOptional()
  minPeople?: number;
}

export class JoinGroupBuyDto {
  @IsString()
  groupBuyId: string;

  @IsString()
  @IsOptional()
  groupId?: string; // 加入已有团，不传则开新团

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  quantity: number;
}
