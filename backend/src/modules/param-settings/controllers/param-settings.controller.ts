import { Controller, Get, Post, Put, Delete, Body, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { ParamSettingsService } from '../services/param-settings.service';
import { UserGroup } from '../entities/user-group.entity';
import { SystemParam } from '../entities/system-param.entity';

@Controller('param')
export class ParamSettingsController {
  constructor(private readonly service: ParamSettingsService) {}

  // ========== 用户组接口 ==========

  @Get('user-groups')
  getUserGroups(): Promise<UserGroup[]> {
    return this.service.getUserGroups();
  }

  @Get('user-groups/:id')
  getUserGroup(@Param('id', ParseUUIDPipe) id: string): Promise<UserGroup> {
    return this.service.getUserGroup(id);
  }

  @Post('user-groups')
  createUserGroup(@Body() data: Partial<UserGroup>): Promise<UserGroup> {
    return this.service.createUserGroup(data);
  }

  @Put('user-groups/:id')
  updateUserGroup(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() data: Partial<UserGroup>
  ): Promise<UserGroup> {
    return this.service.updateUserGroup(id, data);
  }

  @Delete('user-groups/:id')
  deleteUserGroup(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.service.deleteUserGroup(id);
  }

  // ========== 系统参数接口 ==========

  @Get('all')
  getAllParams(): Promise<Record<string, SystemParam[]>> {
    return this.service.getAllParams();
  }

  @Get('group/:group')
  getParamsByGroup(@Param('group') group: string): Promise<SystemParam[]> {
    return this.service.getParamsByGroup(group);
  }

  @Get('key/:key')
  getParamByKey(@Param('key') key: string): Promise<SystemParam> {
    return this.service.getParam(key);
  }

  @Post('set')
  setParam(@Body() data: { key: string; value: any }): Promise<SystemParam> {
    return this.service.setParam(data.key, data.value);
  }

  @Post('batch')
  setParams(@Body() params: { key: string; value: any }[]): Promise<void> {
    return this.service.setParams(params);
  }

  // ========== 前台参数 ==========

  @Get('front')
  getFrontParams(): Promise<Record<string, any>> {
    return this.service.getFrontParams();
  }

  @Post('front')
  setFrontParams(@Body() data: Record<string, any>): Promise<void> {
    return this.service.setFrontParams(data);
  }

  // ========== 短信参数 ==========

  @Get('sms')
  getSmsParams(): Promise<Record<string, any>> {
    return this.service.getSmsParams();
  }

  @Post('sms')
  setSmsParams(@Body() data: Record<string, any>): Promise<void> {
    return this.service.setSmsParams(data);
  }

  // ========== 打印参数 ==========

  @Get('print')
  getPrintParams(): Promise<Record<string, any>> {
    return this.service.getPrintParams();
  }

  @Post('print')
  setPrintParams(@Body() data: Record<string, any>): Promise<void> {
    return this.service.setPrintParams(data);
  }

  // ========== 提成参数 ==========

  @Get('commission')
  getCommissionParams(): Promise<Record<string, any>> {
    return this.service.getCommissionParams();
  }

  @Post('commission')
  setCommissionParams(@Body() data: Record<string, any>): Promise<void> {
    return this.service.setCommissionParams(data);
  }

  // ========== 库存参数 ==========

  @Get('stock')
  getStockParams(): Promise<Record<string, any>> {
    return this.service.getStockParams();
  }

  @Post('stock')
  setStockParams(@Body() data: Record<string, any>): Promise<void> {
    return this.service.setStockParams(data);
  }

  // ========== 提醒参数 ==========

  @Get('reminder')
  getReminderParams(): Promise<Record<string, any>> {
    return this.service.getReminderParams();
  }

  @Post('reminder')
  setReminderParams(@Body() data: Record<string, any>): Promise<void> {
    return this.service.setReminderParams(data);
  }

  // ========== 初始化 ==========

  @Post('init')
  initDefaultParams(): Promise<void> {
    return this.service.initDefaultParams();
  }
}
