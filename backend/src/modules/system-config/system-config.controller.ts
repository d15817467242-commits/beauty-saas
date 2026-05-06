import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { SystemConfigService } from './system-config.service';

@Controller('system-config')
export class SystemConfigController {
  constructor(private readonly configService: SystemConfigService) {}

  @Get('public')
  async getPublicConfigs() {
    return this.configService.getPublicConfigs();
  }

  @Get('groups')
  async getGroups() {
    return this.configService.getGroups();
  }

  @Get()
  async getAll(@Query('group') group?: string) {
    return this.configService.getAll(group);
  }

  @Get(':key')
  async get(@Param('key') key: string, @Query('default') defaultValue?: any) {
    return { key, value: await this.configService.get(key, defaultValue) };
  }

  @Post()
  async set(@Body() body: { key: string; value: any; description?: string; group?: string; type?: string; isPublic?: boolean }) {
    return this.configService.set(body.key, body.value, {
      description: body.description,
      group: body.group,
      type: body.type,
      isPublic: body.isPublic,
    });
  }

  @Post('batch')
  async setMany(@Body() configs: Array<{ key: string; value: any; description?: string; group?: string }>) {
    await this.configService.setMany(configs);
    return { success: true };
  }

  @Delete(':key')
  async delete(@Param('key') key: string) {
    await this.configService.delete(key);
    return { success: true };
  }

  @Post('refresh-cache')
  async refreshCache() {
    await this.configService.refreshCache();
    return { success: true, message: '缓存已刷新' };
  }

  @Post('init-defaults')
  async initDefaults() {
    await this.configService.initDefaultConfigs();
    return { success: true, message: '默认配置已初始化' };
  }
}
