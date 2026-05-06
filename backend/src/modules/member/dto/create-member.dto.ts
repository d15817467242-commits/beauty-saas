import { IsString, IsNotEmpty, IsOptional, IsPhoneNumber, IsEnum, IsDateString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { MemberLevel } from '../member.entity';

export class CreateMemberDto {
  @IsString()
  @IsNotEmpty({ message: '会员姓名不能为空' })
  name: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsDateString()
  birthday?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  balance?: number;

  @IsOptional()
  @IsString()
  remark?: string;

  @IsOptional()
  @IsEnum(MemberLevel)
  level?: MemberLevel;
}
