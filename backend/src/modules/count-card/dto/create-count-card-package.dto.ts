import { IsString, IsNumber, IsBoolean, IsOptional, IsArray, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCountCardPackageDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  code?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  count: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  giftCount?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  validDays?: number;

  @IsOptional()
  @IsArray()
  applicableServices?: string[];

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
