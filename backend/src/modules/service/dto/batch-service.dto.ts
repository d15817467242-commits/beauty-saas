import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateServiceDto } from './create-service.dto';

export class BatchImportServiceDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateServiceDto)
  services: CreateServiceDto[];
}

export class BatchExportQueryDto {
  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  format?: 'json' | 'csv';
}

import { IsString, IsOptional, IsBoolean } from 'class-validator';
