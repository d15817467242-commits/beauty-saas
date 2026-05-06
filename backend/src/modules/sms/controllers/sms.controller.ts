import { Controller, Get, Post, Put, Delete, Body, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { SmsService } from '../services/sms.service';
import { SmsAccount } from '../entities/sms-account.entity';
import { SmsTemplate } from '../entities/sms-template.entity';
import { SmsRecord } from '../entities/sms-record.entity';

@Controller('sms')
export class SmsController {
  constructor(private readonly service: SmsService) {}

  // ========== 短信账户接口 ==========

  @Get('accounts')
  getAccounts(): Promise<SmsAccount[]> {
    return this.service.getAccounts();
  }

  @Post('accounts')
  createAccount(@Body() data: Partial<SmsAccount>): Promise<SmsAccount> {
    return this.service.createAccount(data);
  }

  @Put('accounts/:id')
  updateAccount(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() data: Partial<SmsAccount>
  ): Promise<SmsAccount> {
    return this.service.updateAccount(id, data);
  }

  @Delete('accounts/:id')
  deleteAccount(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.service.deleteAccount(id);
  }

  @Post('accounts/:id/recharge')
  rechargeAccount(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('amount') amount: number
  ): Promise<SmsAccount> {
    return this.service.recharge(id, amount);
  }

  // ========== 短信模板接口 ==========

  @Get('templates')
  getTemplates(@Query('type') type?: 'marketing' | 'notification' | 'verification'): Promise<SmsTemplate[]> {
    return this.service.getTemplates(type);
  }

  @Get('templates/:id')
  getTemplate(@Param('id', ParseUUIDPipe) id: string): Promise<SmsTemplate> {
    return this.service.getTemplate(id);
  }

  @Post('templates')
  createTemplate(@Body() data: Partial<SmsTemplate>): Promise<SmsTemplate> {
    return this.service.createTemplate(data);
  }

  @Put('templates/:id')
  updateTemplate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() data: Partial<SmsTemplate>
  ): Promise<SmsTemplate> {
    return this.service.updateTemplate(id, data);
  }

  @Delete('templates/:id')
  deleteTemplate(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.service.deleteTemplate(id);
  }

  // ========== 发送短信接口 ==========

  @Post('send/single')
  sendSingle(
    @Body() data: {
      phone: string;
      content?: string;
      templateId?: string;
      templateParams?: Record<string, any>;
      memberId?: string;
      remark?: string;
    }
  ): Promise<SmsRecord> {
    return this.service.sendSingle(data);
  }

  @Post('send/batch')
  sendBatch(
    @Body() data: {
      phones: string[];
      content?: string;
      templateId?: string;
      templateParams?: Record<string, any>;
      memberIds?: string[];
      remark?: string;
    }
  ): Promise<{ batchId: string; count: number }> {
    return this.service.sendBatch(data);
  }

  // ========== 发送记录接口 ==========

  @Get('records')
  getRecords(@Query() query: {
    phone?: string;
    status?: 'pending' | 'sent' | 'failed';
    batchId?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{ data: SmsRecord[]; total: number }> {
    return this.service.getRecords(query);
  }

  // ========== 统计接口 ==========

  @Get('statistics')
  getStatistics(@Query() query: {
    startDate?: string;
    endDate?: string;
  }): Promise<any> {
    return this.service.getStatistics(query);
  }
}
