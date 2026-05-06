import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { BackupService } from './backup.service';
import { BackupType, BackupFormat, BackupStatus } from './backup.entity';
import { CreateBackupConfigDto, QueryBackupRecordDto } from './dto/backup.dto';

@Controller('backups')
export class BackupController {
  constructor(private readonly backupService: BackupService) {}

  // ========== 备份配置接口 ==========

  @Post('configs')
  async createConfig(@Body() dto: CreateBackupConfigDto) {
    return this.backupService.createConfig(dto);
  }

  @Get('configs')
  async listConfigs(@Query('storeId') storeId?: string) {
    return this.backupService.listConfigs(storeId);
  }

  @Get('configs/active')
  async getActiveAutoConfigs() {
    return this.backupService.getActiveAutoConfigs();
  }

  @Get('configs/:id')
  async getConfig(@Param('id') id: string) {
    return this.backupService.getConfig(id);
  }

  @Put('configs/:id')
  async updateConfig(@Param('id') id: string, @Body() dto: Partial<CreateBackupConfigDto>) {
    return this.backupService.updateConfig(id, dto);
  }

  @Delete('configs/:id')
  async deleteConfig(@Param('id') id: string) {
    await this.backupService.deleteConfig(id);
    return { success: true };
  }

  @Put('configs/:id/toggle')
  async toggleConfig(@Param('id') id: string, @Body() body: { isActive: boolean }) {
    return this.backupService.toggleConfig(id, body.isActive);
  }

  // ========== 备份执行接口 ==========

  @Post('execute')
  async executeBackup(
    @Body() body: { 
      configId?: string; 
      type?: BackupType; 
      format?: BackupFormat; 
      tables?: string[];
      triggeredBy?: string;
    }
  ) {
    return this.backupService.executeBackup(body.configId, body);
  }

  @Post('execute/:configId')
  async executeBackupByConfig(@Param('configId') configId: string) {
    return this.backupService.executeBackup(configId);
  }

  // ========== 备份恢复接口 ==========

  @Post(':id/restore')
  async restoreBackup(@Param('id') id: string, @Body() body?: { restoredBy?: string }) {
    return this.backupService.restoreBackup(id, body?.restoredBy);
  }

  // ========== 备份记录接口 ==========

  @Get('records')
  async listRecords(@Query() query: QueryBackupRecordDto) {
    return this.backupService.listRecords(query);
  }

  @Get('records/:id')
  async getRecord(@Param('id') id: string) {
    return this.backupService.getRecord(id);
  }

  @Delete('records/:id')
  async deleteRecord(@Param('id') id: string) {
    await this.backupService.deleteRecord(id);
    return { success: true };
  }

  // ========== 清理与统计接口 ==========

  @Post('clean')
  async cleanOldBackups(@Body() body?: { daysToKeep?: number }) {
    const deleted = await this.backupService.cleanOldBackups(body?.daysToKeep);
    return { success: true, deleted };
  }

  @Get('stats')
  async getStats() {
    return this.backupService.getStats();
  }

  @Get('database-stats')
  async getDatabaseStats() {
    return this.backupService.getDatabaseStats();
  }
}
