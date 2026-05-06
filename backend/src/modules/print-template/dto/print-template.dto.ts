import { IsString, IsOptional, IsBoolean, IsNumber, IsObject, IsEnum, IsArray, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { PrintTemplateType, PrintPaperSize, TemplateVariable } from '../print-template.entity';

export { PrintTemplateType, PrintPaperSize, TemplateVariable };

export class CreatePrintTemplateDto {
  @IsOptional()
  @IsString()
  storeId?: string;

  @IsString()
  @MaxLength(100)
  name: string;

  @IsString()
  @MaxLength(50)
  code: string;

  @IsEnum(PrintTemplateType)
  type: PrintTemplateType;

  @IsOptional()
  @IsEnum(PrintPaperSize)
  paperSize?: PrintPaperSize;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  pageWidth?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  pageHeight?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  marginTop?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  marginBottom?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  marginLeft?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  marginRight?: number;

  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  style?: string;

  @IsOptional()
  @IsArray()
  variables?: TemplateVariable[];

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsObject()
  extra?: Record<string, any>;
}

export class UpdatePrintTemplateDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsEnum(PrintPaperSize)
  paperSize?: PrintPaperSize;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  pageWidth?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  pageHeight?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  marginTop?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  marginBottom?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  marginLeft?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  marginRight?: number;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  style?: string;

  @IsOptional()
  @IsArray()
  variables?: TemplateVariable[];

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsObject()
  extra?: Record<string, any>;
}

export class CreateTemplateVariableDto {
  @IsString()
  @MaxLength(50)
  name: string;

  @IsString()
  @MaxLength(100)
  label: string;

  @IsEnum(['string', 'number', 'date', 'boolean', 'array', 'object'])
  type: string;

  @IsOptional()
  defaultValue?: any;

  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  format?: string;
}

export class UpdateTemplateVariableDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  label?: string;

  @IsOptional()
  @IsEnum(['string', 'number', 'date', 'boolean', 'array', 'object'])
  type?: string;

  @IsOptional()
  defaultValue?: any;

  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  format?: string;
}

export class RenderTemplateDto {
  @IsObject()
  data: Record<string, any>;
}

export class CopyTemplateDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsString()
  @MaxLength(50)
  code: string;
}
