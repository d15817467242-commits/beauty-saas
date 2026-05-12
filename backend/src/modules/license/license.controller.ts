import { Controller, Get, Post, Patch, Param, Body, UseGuards, ForbiddenException } from '@nestjs/common';
import { LicenseService } from './license.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { IsNotEmpty, IsString, IsOptional, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

class GenerateKeyDto {
  @IsNotEmpty({ message: '请选择门店' }) @IsString() storeId: string;
  @IsOptional() @IsString() remark?: string;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(1) count?: number;
}

@Controller('license')
@UseGuards(JwtAuthGuard)
export class LicenseController {
  constructor(private readonly licenseService: LicenseService) {}

  // 只有服务商能生成密钥
  @Post('generate')
  async generate(@Body() dto: GenerateKeyDto, @CurrentUser('role') role: string) {
    if (role !== 'superadmin') throw new ForbiddenException('仅服务商可生成密钥');
    return this.licenseService.generateKeys(dto.count || 1, dto.storeId, dto.remark);
  }

  // 只有服务商能查看所有密钥
  @Get()
  async findAll(@CurrentUser('role') role: string) {
    if (role !== 'superadmin') throw new ForbiddenException('仅服务商可查看密钥');
    return this.licenseService.findAll();
  }

  // 只有服务商能作废密钥
  @Patch(':id/revoke')
  async revoke(@Param('id') id: string, @CurrentUser('role') role: string) {
    if (role !== 'superadmin') throw new ForbiddenException('仅服务商可作废密钥');
    return this.licenseService.revokeKey(id);
  }
}
