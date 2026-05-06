import { IsString, IsNumber, IsOptional, IsBoolean, IsArray, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateNewbieGiftDto {
  @IsString()
  name: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  pointsReward?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  balanceReward?: number;

  @IsArray()
  @IsOptional()
  couponIds?: string[];

  @IsArray()
  @IsOptional()
  serviceIds?: string[];

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  validDays?: number;

  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateNewbieGiftDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  pointsReward?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  balanceReward?: number;

  @IsArray()
  @IsOptional()
  couponIds?: string[];

  @IsArray()
  @IsOptional()
  serviceIds?: string[];
}
