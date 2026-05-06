import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { 
  MessageTemplate, 
  SmsConfig, 
  WechatTemplateConfig,
  MessageTemplateType,
  MessageTemplateScene,
  MessageTemplateStatus,
  MessageVariable,
} from './message-template.entity';
import {
  CreateMessageTemplateDto,
  UpdateMessageTemplateDto,
  CreateSmsConfigDto,
  CreateWechatConfigDto,
} from './dto/message-template.dto';

@Injectable()
export class MessageTemplateService {
  constructor(
    @InjectRepository(MessageTemplate)
    private templateRepository: Repository<MessageTemplate>,
    @InjectRepository(SmsConfig)
    private smsConfigRepository: Repository<SmsConfig>,
    @InjectRepository(WechatTemplateConfig)
    private wechatConfigRepository: Repository<WechatTemplateConfig>,
  ) {}

  // ========== 消息模板管理 ==========

  // 创建模板
  async create(dto: CreateMessageTemplateDto): Promise<MessageTemplate> {
    const template = this.templateRepository.create(dto);
    return this.templateRepository.save(template);
  }

  // 更新模板
  async update(id: string, dto: UpdateMessageTemplateDto): Promise<MessageTemplate> {
    const template = await this.templateRepository.findOne({ where: { id } });
    if (!template) {
      throw new NotFoundException('模板不存在');
    }
    Object.assign(template, dto);
    return this.templateRepository.save(template);
  }

  // 删除模板
  async delete(id: string): Promise<void> {
    const template = await this.templateRepository.findOne({ where: { id } });
    if (!template) {
      throw new NotFoundException('模板不存在');
    }
    await this.templateRepository.remove(template);
  }

  // 获取模板详情
  async get(id: string): Promise<MessageTemplate> {
    const template = await this.templateRepository.findOne({ where: { id } });
    if (!template) {
      throw new NotFoundException('模板不存在');
    }
    return template;
  }

  // 获取模板列表
  async list(storeId?: string, type?: MessageTemplateType, scene?: MessageTemplateScene): Promise<MessageTemplate[]> {
    const queryBuilder = this.templateRepository.createQueryBuilder('template');
    
    if (storeId) {
      queryBuilder.where('template.storeId = :storeId OR template.storeId IS NULL', { storeId });
    }
    
    if (type) {
      queryBuilder.andWhere('template.type = :type', { type });
    }
    
    if (scene) {
      queryBuilder.andWhere('template.scene = :scene', { scene });
    }
    
    return queryBuilder
      .orderBy('template.sortOrder', 'ASC')
      .addOrderBy('template.createdAt', 'DESC')
      .getMany();
  }

  // 获取启用的模板
  async getActiveTemplates(
    storeId?: string, 
    type?: MessageTemplateType, 
    scene?: MessageTemplateScene
  ): Promise<MessageTemplate[]> {
    const queryBuilder = this.templateRepository.createQueryBuilder('template')
      .where('template.status = :status', { status: MessageTemplateStatus.ACTIVE });
    
    if (storeId) {
      queryBuilder.andWhere('(template.storeId = :storeId OR template.storeId IS NULL)', { storeId });
    }
    
    if (type) {
      queryBuilder.andWhere('template.type = :type', { type });
    }
    
    if (scene) {
      queryBuilder.andWhere('template.scene = :scene', { scene });
    }
    
    return queryBuilder
      .orderBy('template.sortOrder', 'ASC')
      .getMany();
  }

  // 根据场景获取默认模板
  async getDefaultByScene(scene: MessageTemplateScene, type: MessageTemplateType, storeId?: string): Promise<MessageTemplate | null> {
    const queryBuilder = this.templateRepository.createQueryBuilder('template')
      .where('template.scene = :scene', { scene })
      .andWhere('template.type = :type', { type })
      .andWhere('template.isDefault = :isDefault', { isDefault: true })
      .andWhere('template.status = :status', { status: MessageTemplateStatus.ACTIVE });
    
    if (storeId) {
      queryBuilder.andWhere('(template.storeId = :storeId OR template.storeId IS NULL)', { storeId });
    }
    
    return queryBuilder.orderBy('template.sortOrder', 'ASC').getOne();
  }

  // 设置默认模板
  async setDefault(id: string): Promise<void> {
    const template = await this.get(id);
    
    // 取消同类型同场景其他模板的默认状态
    await this.templateRepository.update(
      { type: template.type, scene: template.scene, isDefault: true },
      { isDefault: false }
    );
    
    // 设置当前模板为默认
    template.isDefault = true;
    await this.templateRepository.save(template);
  }

  // 更新模板状态
  async updateStatus(id: string, status: MessageTemplateStatus): Promise<MessageTemplate> {
    const template = await this.get(id);
    template.status = status;
    return this.templateRepository.save(template);
  }

  // ========== 短信配置管理 ==========

  // 创建短信配置
  async createSmsConfig(dto: CreateSmsConfigDto): Promise<SmsConfig> {
    const config = this.smsConfigRepository.create(dto);
    return this.smsConfigRepository.save(config);
  }

  // 更新短信配置
  async updateSmsConfig(id: string, dto: Partial<CreateSmsConfigDto>): Promise<SmsConfig> {
    const config = await this.smsConfigRepository.findOne({ where: { id } });
    if (!config) {
      throw new NotFoundException('短信配置不存在');
    }
    Object.assign(config, dto);
    return this.smsConfigRepository.save(config);
  }

  // 删除短信配置
  async deleteSmsConfig(id: string): Promise<void> {
    const config = await this.smsConfigRepository.findOne({ where: { id } });
    if (!config) {
      throw new NotFoundException('短信配置不存在');
    }
    await this.smsConfigRepository.remove(config);
  }

  // 获取短信配置详情
  async getSmsConfig(id: string): Promise<SmsConfig> {
    const config = await this.smsConfigRepository.findOne({ where: { id } });
    if (!config) {
      throw new NotFoundException('短信配置不存在');
    }
    return config;
  }

  // 获取短信配置列表
  async listSmsConfigs(storeId?: string): Promise<SmsConfig[]> {
    const queryBuilder = this.smsConfigRepository.createQueryBuilder('config');
    
    if (storeId) {
      queryBuilder.where('config.storeId = :storeId OR config.storeId IS NULL', { storeId });
    }
    
    return queryBuilder.orderBy('config.createdAt', 'DESC').getMany();
  }

  // 获取默认短信配置
  async getDefaultSmsConfig(storeId?: string): Promise<SmsConfig | null> {
    const queryBuilder = this.smsConfigRepository.createQueryBuilder('config')
      .where('config.isDefault = :isDefault', { isDefault: true })
      .andWhere('config.isActive = :isActive', { isActive: true });
    
    if (storeId) {
      queryBuilder.andWhere('(config.storeId = :storeId OR config.storeId IS NULL)', { storeId });
    }
    
    return queryBuilder.getOne();
  }

  // 设置默认短信配置
  async setDefaultSmsConfig(id: string): Promise<void> {
    const config = await this.getSmsConfig(id);
    
    await this.smsConfigRepository.update(
      { isDefault: true },
      { isDefault: false }
    );
    
    config.isDefault = true;
    await this.smsConfigRepository.save(config);
  }

  // ========== 微信模板配置管理 ==========

  // 创建微信配置
  async createWechatConfig(dto: CreateWechatConfigDto): Promise<WechatTemplateConfig> {
    const config = this.wechatConfigRepository.create(dto);
    return this.wechatConfigRepository.save(config);
  }

  // 更新微信配置
  async updateWechatConfig(id: string, dto: Partial<CreateWechatConfigDto>): Promise<WechatTemplateConfig> {
    const config = await this.wechatConfigRepository.findOne({ where: { id } });
    if (!config) {
      throw new NotFoundException('微信配置不存在');
    }
    Object.assign(config, dto);
    return this.wechatConfigRepository.save(config);
  }

  // 删除微信配置
  async deleteWechatConfig(id: string): Promise<void> {
    const config = await this.wechatConfigRepository.findOne({ where: { id } });
    if (!config) {
      throw new NotFoundException('微信配置不存在');
    }
    await this.wechatConfigRepository.remove(config);
  }

  // 获取微信配置详情
  async getWechatConfig(id: string): Promise<WechatTemplateConfig> {
    const config = await this.wechatConfigRepository.findOne({ where: { id } });
    if (!config) {
      throw new NotFoundException('微信配置不存在');
    }
    return config;
  }

  // 获取微信配置列表
  async listWechatConfigs(storeId?: string): Promise<WechatTemplateConfig[]> {
    const queryBuilder = this.wechatConfigRepository.createQueryBuilder('config');
    
    if (storeId) {
      queryBuilder.where('config.storeId = :storeId OR config.storeId IS NULL', { storeId });
    }
    
    return queryBuilder.orderBy('config.createdAt', 'DESC').getMany();
  }

  // 获取默认微信配置
  async getDefaultWechatConfig(storeId?: string): Promise<WechatTemplateConfig | null> {
    const queryBuilder = this.wechatConfigRepository.createQueryBuilder('config')
      .where('config.isDefault = :isDefault', { isDefault: true })
      .andWhere('config.isActive = :isActive', { isActive: true });
    
    if (storeId) {
      queryBuilder.andWhere('(config.storeId = :storeId OR config.storeId IS NULL)', { storeId });
    }
    
    return queryBuilder.getOne();
  }

  // 设置默认微信配置
  async setDefaultWechatConfig(id: string): Promise<void> {
    const config = await this.getWechatConfig(id);
    
    await this.wechatConfigRepository.update(
      { isDefault: true },
      { isDefault: false }
    );
    
    config.isDefault = true;
    await this.wechatConfigRepository.save(config);
  }

  // ========== 消息发送 ==========

  // 渲染模板内容
  async renderTemplate(id: string, data: Record<string, any>): Promise<string> {
    const template = await this.get(id);
    
    let content = template.content;
    for (const [key, value] of Object.entries(data)) {
      const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
      content = content.replace(regex, String(value ?? ''));
    }
    
    return content;
  }

  // 发送短信
  async sendSms(phone: string, templateId: string, data: Record<string, any>): Promise<{ success: boolean; message: string }> {
    const template = await this.get(templateId);
    const config = await this.getDefaultSmsConfig();
    
    if (!config) {
      return { success: false, message: '未配置短信服务' };
    }
    
    const content = await this.renderTemplate(templateId, data);
    
    // TODO: 实现实际的短信发送逻辑
    // 这里应该调用短信服务商的API
    
    return { success: true, message: '短信发送成功' };
  }

  // 发送微信模板消息
  async sendWechatMessage(
    openId: string, 
    templateId: string, 
    data: Record<string, any>
  ): Promise<{ success: boolean; message: string }> {
    const template = await this.get(templateId);
    const config = await this.getDefaultWechatConfig();
    
    if (!config) {
      return { success: false, message: '未配置微信服务' };
    }
    
    // TODO: 实现实际的微信消息发送逻辑
    
    return { success: true, message: '微信消息发送成功' };
  }

  // ========== 统计 ==========

  // 获取模板统计
  async getStats(): Promise<any> {
    const total = await this.templateRepository.count();
    const active = await this.templateRepository.count({ 
      where: { status: MessageTemplateStatus.ACTIVE } 
    });
    const inactive = await this.templateRepository.count({ 
      where: { status: MessageTemplateStatus.INACTIVE } 
    });
    const draft = await this.templateRepository.count({ 
      where: { status: MessageTemplateStatus.DRAFT } 
    });
    
    // 按类型统计
    const byType = await this.templateRepository
      .createQueryBuilder('template')
      .select('template.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .groupBy('template.type')
      .getRawMany();
    
    // 按场景统计
    const byScene = await this.templateRepository
      .createQueryBuilder('template')
      .select('template.scene', 'scene')
      .addSelect('COUNT(*)', 'count')
      .groupBy('template.scene')
      .getRawMany();
    
    return { total, active, inactive, draft, byType, byScene };
  }

  // 复制模板
  async copy(id: string, newName: string, newCode: string): Promise<MessageTemplate> {
    const template = await this.get(id);
    
    const newTemplate = this.templateRepository.create({
      ...template,
      id: undefined,
      name: newName,
      code: newCode,
      isDefault: false,
      status: MessageTemplateStatus.DRAFT,
      createdAt: undefined,
      updatedAt: undefined,
    });
    
    return this.templateRepository.save(newTemplate);
  }
}
