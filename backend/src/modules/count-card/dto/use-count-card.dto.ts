import { IsString, IsNumber, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UseCountCardDto {
  @IsString()
  memberCountCardId: string;

  @IsString()
  serviceId: string;

  @IsOptional()
  @IsString()
  employeeId?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  count: number;

  @IsOptional()
  @IsString()
  consumptionId?: string;
}
