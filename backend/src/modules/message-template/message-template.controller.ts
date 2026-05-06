import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { MessageTemplateService } from './message-template.service';
import { MessageTemplateType, MessageTemplateScene, MessageTemplateStatus } from './message-template.entity';
import {
  CreateMessageTemplateDto, 
  UpdateMessageTemplateDto,
  CreateSmsConfigDto,
  CreateWechatConfigDto,
} from './dto/message-template.dto';

@Controller('message-templates')
export class MessageTemplateController {
  constructor(private readonly templateService: MessageTemplateService) {}

  // ========== 消息模板接口 ==========

  @Post()
  async create(@Body() dto: CreateMessageTemplateDto) {
    return this.templateService.create(dto);
  }

  @Get()
  async list(
    @Query('storeId') storeId?: string,
    @Query('type') type?: MessageTemplateType,
    @Query('scene') scene?: MessageTemplateScene
  ) {
    return this.templateService.list(storeId, type, scene);
  }

  @Get('active')
  async getActiveTemplates(
    @Query('storeId') storeId?: string,
    @Query('type') type?: MessageTemplateType,
    @Query('scene') scene?: MessageTemplateScene
  ) {
    return this.templateService.getActiveTemplates(storeId, type, scene);
  }

  @Get('stats')
  async getStats() {
    return this.templateService.getStats();
  }

  @Get('default')
  async getDefaultByScene(
    @Query('scene') scene: MessageTemplateScene,
    @Query('type') type: MessageTemplateType,
    @Query('storeId') storeId?: string
  ) {
    return this.templateService.getDefaultByScene(scene, type, storeId);
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    return this.templateService.get(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateMessageTemplateDto) {
    return this.templateService.update(id, dto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    await this.templateService.delete(id);
    return { success: true };
  }

  @Post(':id/set-default')
  async setDefault(@Param('id') id: string) {
    await this.templateService.setDefault(id);
    return { success: true };
  }

  @Put(':id/status')
  async updateStatus(@Param('id') id: string, @Body() body: { status: MessageTemplateStatus }) {
    return this.templateService.updateStatus(id, body.status);
  }

  @Post(':id/copy')
  async copy(@Param('id') id: string, @Body() body: { name: string; code: string }) {
    return this.templateService.copy(id, body.name, body.code);
  }

  @Post(':id/render')
  async render(@Param('id') id: string, @Body() data: Record<string, any>) {
    const content = await this.templateService.renderTemplate(id, data);
    return { content };
  }

  // ========== 短信配置接口 ==========

  @Post('sms-configs')
  async createSmsConfig(@Body() dto: CreateSmsConfigDto) {
    return this.templateService.createSmsConfig(dto);
  }

  @Get('sms-configs')
  async listSmsConfigs(@Query('storeId') storeId?: string) {
    return this.templateService.listSmsConfigs(storeId);
  }

  @Get('sms-configs/default')
  async getDefaultSmsConfig(@Query('storeId') storeId?: string) {
    return this.templateService.getDefaultSmsConfig(storeId);
  }

  @Get('sms-configs/:id')
  async getSmsConfig(@Param('id') id: string) {
    return this.templateService.getSmsConfig(id);
  }

  @Put('sms-configs/:id')
  async updateSmsConfig(@Param('id') id: string, @Body() dto: Partial<CreateSmsConfigDto>) {
    return this.templateService.updateSmsConfig(id, dto);
  }

  @Delete('sms-configs/:id')
  async deleteSmsConfig(@Param('id') id: string) {
    await this.templateService.deleteSmsConfig(id);
    return { success: true };
  }

  @Post('sms-configs/:id/set-default')
  async setDefaultSmsConfig(@Param('id') id: string) {
    await this.templateService.setDefaultSmsConfig(id);
    return { success: true };
  }

  // ========== 微信配置接口 ==========

  @Post('wechat-configs')
  async createWechatConfig(@Body() dto: CreateWechatConfigDto) {
    return this.templateService.createWechatConfig(dto);
  }

  @Get('wechat-configs')
  async listWechatConfigs(@Query('storeId') storeId?: string) {
    return this.templateService.listWechatConfigs(storeId);
  }

  @Get('wechat-configs/default')
  async getDefaultWechatConfig(@Query('storeId') storeId?: string) {
    return this.templateService.getDefaultWechatConfig(storeId);
  }

  @Get('wechat-configs/:id')
  async getWechatConfig(@Param('id') id: string) {
    return this.templateService.getWechatConfig(id);
  }

  @Put('wechat-configs/:id')
  async updateWechatConfig(@Param('id') id: string, @Body() dto: Partial<CreateWechatConfigDto>) {
    return this.templateService.updateWechatConfig(id, dto);
  }

  @Delete('wechat-configs/:id')
  async deleteWechatConfig(@Param('id') id: string) {
    await this.templateService.deleteWechatConfig(id);
    return { success: true };
  }

  @Post('wechat-configs/:id/set-default')
  async setDefaultWechatConfig(@Param('id') id: string) {
    await this.templateService.setDefaultWechatConfig(id);
    return { success: true };
  }

  // ========== 消息发送接口 ==========

  @Post('send/sms')
  async sendSms(@Body() body: { phone: string; templateId: string; data: Record<string, any> }) {
    return this.templateService.sendSms(body.phone, body.templateId, body.data);
  }

  @Post('send/wechat')
  async sendWechat(@Body() body: { openId: string; templateId: string; data: Record<string, any> }) {
    return this.templateService.sendWechatMessage(body.openId, body.templateId, body.data);
  }
}
