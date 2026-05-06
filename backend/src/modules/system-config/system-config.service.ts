import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemConfig } from './system-config.entity';

@Injectable()
export class SystemConfigService {
  private configCache: Map<string, any> = new Map();

  constructor(
    @InjectRepository(SystemConfig)
    private configRepository: Repository<SystemConfig>,
  ) {
    // 初始化时加载所有配置到缓存
    this.loadAllConfigs();
  }

  // 加载所有配置到缓存
  private async loadAllConfigs(): Promise<void> {
    const configs = await this.configRepository.find();
    for (const config of configs) {
      this.configCache.set(config.key, this.parseValue(config.value, config.type));
    }
  }

  // 解析配置值
  private parseValue(value: string, type?: string): any {
    if (!type || type === 'string') return value;
    if (type === 'number') return Number(value);
    if (type === 'boolean') return value === 'true';
    if (type === 'json') {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return value;
  }

  // 获取配置值
  async get(key: string, defaultValue?: any): Promise<any> {
    // 先从缓存获取
    if (this.configCache.has(key)) {
      return this.configCache.get(key);
    }
    
    const config = await this.configRepository.findOne({ where: { key } });
    if (!config) {
      return defaultValue;
    }
    
    const value = this.parseValue(config.value, config.type);
    this.configCache.set(key, value);
    return value;
  }

  // 设置配置值
  async set(key: string, value: any, options?: {
    description?: string;
    group?: string;
    type?: string;
    isPublic?: boolean;
  }): Promise<SystemConfig> {
    const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
    
    let config = await this.configRepository.findOne({ where: { key } });
    
    if (config) {
      config.value = stringValue;
      if (options?.description) config.description = options.description;
      if (options?.group) config.group = options.group;
      if (options?.type) config.type = options.type;
      if (options?.isPublic !== undefined) config.isPublic = options.isPublic;
    } else {
      config = this.configRepository.create({
        key,
        value: stringValue,
        description: options?.description,
        group: options?.group,
        type: options?.type || 'string',
        isPublic: options?.isPublic ?? false,
      });
    }
    
    const saved = await this.configRepository.save(config);
    this.configCache.set(key, this.parseValue(stringValue, config.type));
    
    return saved;
  }

  // 批量设置配置
  async setMany(configs: Array<{ key: string; value: any; description?: string; group?: string }>): Promise<void> {
    for (const config of configs) {
      await this.set(config.key, config.value, {
        description: config.description,
        group: config.group,
      });
    }
  }

  // 删除配置
  async delete(key: string): Promise<void> {
    await this.configRepository.delete({ key });
    this.configCache.delete(key);
  }

  // 获取所有配置
  async getAll(group?: string): Promise<SystemConfig[]> {
    const queryBuilder = this.configRepository.createQueryBuilder('config');
    if (group) {
      queryBuilder.where('config.group = :group', { group });
    }
    return queryBuilder.getMany();
  }

  // 获取公开配置（前端可访问）
  async getPublicConfigs(): Promise<Record<string, any>> {
    const configs = await this.configRepository.find({ where: { isPublic: true } });
    const result: Record<string, any> = {};
    for (const config of configs) {
      result[config.key] = this.parseValue(config.value, config.type);
    }
    return result;
  }

  // 刷新缓存
  async refreshCache(): Promise<void> {
    this.configCache.clear();
    await this.loadAllConfigs();
  }

  // 获取配置分组列表
  async getGroups(): Promise<string[]> {
    const result = await this.configRepository
      .createQueryBuilder('config')
      .select('DISTINCT config.group', 'group')
      .where('config.group IS NOT NULL')
      .getRawMany();
    
    return result.map(r => r.group);
  }

  // 初始化默认配置
  async initDefaultConfigs(): Promise<void> {
    const defaults = [
      { key: 'shop.name', value: '美业SaaS示范店', description: '店铺名称', group: 'basic', isPublic: true },
      { key: 'shop.phone', value: '400-123-4567', description: '联系电话', group: 'basic', isPublic: true },
      { key: 'shop.address', value: '示范路123号', description: '店铺地址', group: 'basic', isPublic: true },
      { key: 'shop.businessHours', value: '09:00-21:00', description: '营业时间', group: 'basic', isPublic: true },
      { key: 'shop.logo', value: '/images/logo.png', description: '店铺Logo', group: 'basic', isPublic: true },
      { key: 'shop.description', value: '专业美容美发服务', description: '店铺简介', group: 'basic', isPublic: true },
      
      { key: 'points.rate', value: '1', description: '积分兑换比例（消费1元得X积分）', group: 'points', type: 'number' },
      { key: 'points.expireMonths', value: '12', description: '积分过期月数', group: 'points', type: 'number' },
      
      { key: 'member.defaultLevel', value: 'normal', description: '新会员默认等级', group: 'member' },
      { key: 'member.birthdayBonus', value: '100', description: '生日积分奖励', group: 'member', type: 'number' },
      
      { key: 'appointment.advanceDays', value: '7', description: '可提前预约天数', group: 'appointment', type: 'number' },
      { key: 'appointment.cancelHours', value: '2', description: '取消预约提前小时数', group: 'appointment', type: 'number' },
      
      { key: 'backup.autoBackup', value: 'false', description: '是否自动备份', group: 'backup', type: 'boolean' },
      { key: 'backup.retentionDays', value: '30', description: '备份保留天数', group: 'backup', type: 'number' },
      
      { key: 'sms.enabled', value: 'false', description: '是否启用短信通知', group: 'notification', type: 'boolean' },
      { key: 'wechat.enabled', value: 'false', description: '是否启用微信通知', group: 'notification', type: 'boolean' },
    ];

    for (const config of defaults) {
      const existing = await this.configRepository.findOne({ where: { key: config.key } });
      if (!existing) {
        await this.set(config.key, config.value, {
          description: config.description,
          group: config.group,
          type: config.type as any,
          isPublic: config.isPublic,
        });
      }
    }
  }
}
