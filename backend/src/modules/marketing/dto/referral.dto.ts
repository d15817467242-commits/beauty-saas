import { IsString, IsNumber, IsOptional, IsBoolean, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateReferralConfigDto {
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  referrerReward?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  refereeReward?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  minSpend?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  validDays?: number;

  @IsString()
  @IsOptional()
  description?: string;
}

export class CreateReferralDto {
  @IsString()
  referrerId: string;

  @IsString()
  refereeId: string;
}
