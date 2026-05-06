import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { SmsAccount } from '../entities/sms-account.entity';
import { SmsRecord } from '../entities/sms-record.entity';
import { SmsTemplate } from '../entities/sms-template.entity';

@Injectable()
export class SmsService {
  constructor(
    @InjectRepository(SmsAccount)
    private accountRepository: Repository<SmsAccount>,
    @InjectRepository(SmsRecord)
    private recordRepository: Repository<SmsRecord>,
    @InjectRepository(SmsTemplate)
    private templateRepository: Repository<SmsTemplate>,
  ) {}

  // ========== 短信账户管理 ==========

  async getAccounts(): Promise<SmsAccount[]> {
    return this.accountRepository.find({ order: { createdAt: 'DESC' } });
  }

  async getDefaultAccount(): Promise<SmsAccount> {
    const account = await this.accountRepository.findOne({ 
      where: { isDefault: true, isActive: true } 
    });
    if (!account) {
      throw new NotFoundException('未配置默认短信账户');
    }
    return account;
  }

  async createAccount(data: Partial<SmsAccount>): Promise<SmsAccount> {
    const account = this.accountRepository.create(data);
    
    // 如果设为默认，取消其他默认
    if (data.isDefault) {
      await this.accountRepository.update({ isDefault: true }, { isDefault: false });
    }
    
    return this.accountRepository.save(account);
  }

  async updateAccount(id: string, data: Partial<SmsAccount>): Promise<SmsAccount> {
    const account = await this.accountRepository.findOne({ where: { id } });
    if (!account) throw new NotFoundException('账户不存在');
    
    // 如果设为默认，取消其他默认
    if (data.isDefault) {
      await this.accountRepository.update({ isDefault: true }, { isDefault: false });
    }
    
    Object.assign(account, data);
    return this.accountRepository.save(account);
  }

  async deleteAccount(id: string): Promise<void> {
    const account = await this.accountRepository.findOne({ where: { id } });
    if (!account) throw new NotFoundException('账户不存在');
    await this.accountRepository.remove(account);
  }

  // 充值
  async recharge(id: string, amount: number): Promise<SmsAccount> {
    const account = await this.accountRepository.findOne({ where: { id } });
    if (!account) throw new NotFoundException('账户不存在');
    
    account.balance = Number(account.balance) + amount;
    account.totalRecharge = Number(account.totalRecharge) + amount;
    
    return this.accountRepository.save(account);
  }

  // ========== 短信模板管理 ==========

  async getTemplates(type?: 'marketing' | 'notification' | 'verification'): Promise<SmsTemplate[]> {
    const where: any = {};
    if (type) where.type = type;
    return this.templateRepository.find({ where, order: { createdAt: 'DESC' } });
  }

  async getTemplate(id: string): Promise<SmsTemplate> {
    const template = await this.templateRepository.findOne({ where: { id } });
    if (!template) throw new NotFoundException('模板不存在');
    return template;
  }

  async createTemplate(data: Partial<SmsTemplate>): Promise<SmsTemplate> {
    const template = this.templateRepository.create(data);
    return this.templateRepository.save(template);
  }

  async updateTemplate(id: string, data: Partial<SmsTemplate>): Promise<SmsTemplate> {
    const template = await this.getTemplate(id);
    Object.assign(template, data);
    return this.templateRepository.save(template);
  }

  async deleteTemplate(id: string): Promise<void> {
    const template = await this.getTemplate(id);
    await this.templateRepository.remove(template);
  }

  // ========== 发送短信 ==========

  // 单条发送
  async sendSingle(data: {
    phone: string;
    content?: string;
    templateId?: string;
    templateParams?: Record<string, any>;
    memberId?: string;
    remark?: string;
  }, userId?: string): Promise<SmsRecord> {
    const account = await this.getDefaultAccount();
    
    let content = data.content || '';
    let template: SmsTemplate | null = null;
    
    if (data.templateId) {
      template = await this.getTemplate(data.templateId);
      content = this.renderTemplate(template.content, data.templateParams || {});
    }
    
    // 检查余额
    const cost = account.unitPrice;
    if (Number(account.balance) < cost) {
      throw new BadRequestException('短信余额不足');
    }
    
    // 创建发送记录
    const record = this.recordRepository.create({
      accountId: account.id,
      phone: data.phone,
      content,
      templateId: template?.templateId,
      templateParams: data.templateParams,
      sendType: 'single',
      status: 'pending',
      cost,
      memberId: data.memberId,
      remark: data.remark,
      createdBy: userId,
    });
    
    await this.recordRepository.save(record);
    
    // 模拟发送（实际项目中需要调用短信服务商API）
    try {
      // TODO: 调用实际的短信发送API
      // const result = await this.callSmsApi(account, data.phone, content, template?.templateId);
      
      // 模拟成功
      record.status = 'sent';
      record.sentAt = new Date();
      record.bizId = `BIZ${Date.now()}`;
      record.resultCode = 'OK';
      
      // 扣除余额
      account.balance = Number(account.balance) - cost;
      account.totalConsumed = Number(account.totalConsumed) + cost;
      await this.accountRepository.save(account);
      
    } catch (error: any) {
      record.status = 'failed';
      record.resultCode = 'ERROR';
      record.resultMessage = error.message;
    }
    
    return this.recordRepository.save(record);
  }

  // 批量发送
  async sendBatch(data: {
    phones: string[];
    content?: string;
    templateId?: string;
    templateParams?: Record<string, any>;
    memberIds?: string[];
    remark?: string;
  }, userId?: string): Promise<{ batchId: string; count: number }> {
    const account = await this.getDefaultAccount();
    
    let content = data.content || '';
    let template: SmsTemplate | null = null;
    
    if (data.templateId) {
      template = await this.getTemplate(data.templateId);
      content = this.renderTemplate(template.content, data.templateParams || {});
    }
    
    // 检查余额
    const totalCost = account.unitPrice * data.phones.length;
    if (Number(account.balance) < totalCost) {
      throw new BadRequestException('短信余额不足');
    }
    
    const batchId = `BATCH${Date.now()}`;
    
    // 创建发送记录
    const records = data.phones.map((phone, index) => {
      return this.recordRepository.create({
        accountId: account.id,
        phone,
        content,
        templateId: template?.templateId,
        templateParams: data.templateParams,
        sendType: 'batch',
        batchId,
        status: 'pending',
        cost: account.unitPrice,
        memberId: data.memberIds?.[index],
        remark: data.remark,
        createdBy: userId,
      });
    });
    
    await this.recordRepository.save(records);
    
    // 模拟批量发送
    for (const record of records) {
      try {
        // TODO: 调用实际的短信发送API
        record.status = 'sent';
        record.sentAt = new Date();
        record.bizId = `BIZ${Date.now()}_${record.phone}`;
        record.resultCode = 'OK';
      } catch (error: any) {
        record.status = 'failed';
        record.resultCode = 'ERROR';
        record.resultMessage = error.message;
      }
    }
    
    await this.recordRepository.save(records);
    
    // 扣除余额
    const successCount = records.filter(r => r.status === 'sent').length;
    const actualCost = account.unitPrice * successCount;
    account.balance = Number(account.balance) - actualCost;
    account.totalConsumed = Number(account.totalConsumed) + actualCost;
    await this.accountRepository.save(account);
    
    return { batchId, count: records.length };
  }

  // 渲染模板
  private renderTemplate(template: string, params: Record<string, any>): string {
    let content = template;
    for (const [key, value] of Object.entries(params)) {
      content = content.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
    }
    return content;
  }

  // ========== 发送记录 ==========

  async getRecords(query: {
    phone?: string;
    status?: 'pending' | 'sent' | 'failed';
    batchId?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{ data: SmsRecord[]; total: number }> {
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;
    const skip = (page - 1) * pageSize;

    const queryBuilder = this.recordRepository.createQueryBuilder('record');

    if (query.phone) {
      queryBuilder.andWhere('record.phone LIKE :phone', { phone: `%${query.phone}%` });
    }
    if (query.status) {
      queryBuilder.andWhere('record.status = :status', { status: query.status });
    }
    if (query.batchId) {
      queryBuilder.andWhere('record.batchId = :batchId', { batchId: query.batchId });
    }
    if (query.startDate) {
      queryBuilder.andWhere('record.createdAt >= :startDate', { startDate: query.startDate });
    }
    if (query.endDate) {
      queryBuilder.andWhere('record.createdAt <= :endDate', { endDate: query.endDate });
    }

    queryBuilder
      .orderBy('record.createdAt', 'DESC')
      .skip(skip)
      .take(pageSize);

    const [data, total] = await queryBuilder.getManyAndCount();
    return { data, total };
  }

  // ========== 统计 ==========

  async getStatistics(query: {
    startDate?: string;
    endDate?: string;
  }): Promise<{
    totalSent: number;
    totalFailed: number;
    totalCost: number;
    byDate: { date: string; sent: number; failed: number; cost: number }[];
  }> {
    const queryBuilder = this.recordRepository.createQueryBuilder('record');

    if (query.startDate) {
      queryBuilder.andWhere('record.createdAt >= :startDate', { startDate: query.startDate });
    }
    if (query.endDate) {
      queryBuilder.andWhere('record.createdAt <= :endDate', { endDate: query.endDate });
    }

    const records = await queryBuilder.getMany();

    let totalSent = 0;
    let totalFailed = 0;
    let totalCost = 0;
    const dateMap = new Map<string, { sent: number; failed: number; cost: number }>();

    for (const record of records) {
      if (record.status === 'sent') {
        totalSent++;
        totalCost += Number(record.cost);
      } else if (record.status === 'failed') {
        totalFailed++;
      }

      const dateKey = record.createdAt.toISOString().split('T')[0];
      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, { sent: 0, failed: 0, cost: 0 });
      }
      const dateData = dateMap.get(dateKey)!;
      if (record.status === 'sent') {
        dateData.sent++;
        dateData.cost += Number(record.cost);
      } else {
        dateData.failed++;
      }
    }

    return {
      totalSent,
      totalFailed,
      totalCost,
      byDate: Array.from(dateMap.entries()).map(([date, data]) => ({
        date,
        ...data
      })).sort((a, b) => a.date.localeCompare(b.date))
    };
  }
}
