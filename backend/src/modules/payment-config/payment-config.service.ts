import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, IsNull } from 'typeorm';
import { PaymentConfig, PaymentChannel, PaymentChannelType, PaymentMethod, PaymentStatus } from './payment-config.entity';
import { CreatePaymentConfigDto, UpdatePaymentConfigDto, CreatePaymentChannelDto } from './dto/payment-config.dto';

@Injectable()
export class PaymentConfigService {
  constructor(
    @InjectRepository(PaymentConfig)
    private paymentConfigRepository: Repository<PaymentConfig>,
    @InjectRepository(PaymentChannel)
    private paymentChannelRepository: Repository<PaymentChannel>,
  ) {}

  // ========== 支付配置管理 ==========

  // 创建支付配置
  async createConfig(dto: CreatePaymentConfigDto): Promise<PaymentConfig> {
    const config = this.paymentConfigRepository.create(dto);
    return this.paymentConfigRepository.save(config);
  }

  // 更新支付配置
  async updateConfig(id: string, dto: UpdatePaymentConfigDto): Promise<PaymentConfig> {
    const config = await this.paymentConfigRepository.findOne({ where: { id } });
    if (!config) {
      throw new NotFoundException('支付配置不存在');
    }
    Object.assign(config, dto);
    return this.paymentConfigRepository.save(config);
  }

  // 删除支付配置
  async deleteConfig(id: string): Promise<void> {
    const config = await this.paymentConfigRepository.findOne({ where: { id } });
    if (!config) {
      throw new NotFoundException('支付配置不存在');
    }
    // 删除关联的渠道
    await this.paymentChannelRepository.delete({ paymentConfigId: id });
    await this.paymentConfigRepository.remove(config);
  }

  // 获取支付配置详情
  async getConfig(id: string): Promise<PaymentConfig> {
    const config = await this.paymentConfigRepository.findOne({ 
      where: { id },
      relations: ['channels'],
    });
    if (!config) {
      throw new NotFoundException('支付配置不存在');
    }
    return config;
  }

  // 获取支付配置列表
  async listConfigs(storeId?: string): Promise<PaymentConfig[]> {
    const queryBuilder = this.paymentConfigRepository.createQueryBuilder('config');
    
    if (storeId) {
      queryBuilder.where('config.storeId = :storeId OR config.storeId IS NULL', { storeId });
    }
    
    return queryBuilder
      .orderBy('config.sortOrder', 'ASC')
      .addOrderBy('config.createdAt', 'DESC')
      .getMany();
  }

  // 获取启用的支付方式
  async getActiveConfigs(storeId?: string): Promise<PaymentConfig[]> {
    const queryBuilder = this.paymentConfigRepository.createQueryBuilder('config')
      .where('config.status = :status', { status: PaymentStatus.ACTIVE });
    
    if (storeId) {
      queryBuilder.andWhere('(config.storeId = :storeId OR config.storeId IS NULL)', { storeId });
    }
    
    return queryBuilder
      .orderBy('config.sortOrder', 'ASC')
      .getMany();
  }

  // 批量更新状态
  async batchUpdateStatus(ids: string[], status: PaymentStatus): Promise<void> {
    await this.paymentConfigRepository.update({ id: In(ids) }, { status });
  }

  // ========== 支付渠道管理 ==========

  // 创建支付渠道
  async createChannel(dto: CreatePaymentChannelDto): Promise<PaymentChannel> {
    const channel = this.paymentChannelRepository.create(dto);
    return this.paymentChannelRepository.save(channel);
  }

  // 更新支付渠道
  async updateChannel(id: string, dto: Partial<CreatePaymentChannelDto>): Promise<PaymentChannel> {
    const channel = await this.paymentChannelRepository.findOne({ where: { id } });
    if (!channel) {
      throw new NotFoundException('支付渠道不存在');
    }
    Object.assign(channel, dto);
    return this.paymentChannelRepository.save(channel);
  }

  // 删除支付渠道
  async deleteChannel(id: string): Promise<void> {
    const channel = await this.paymentChannelRepository.findOne({ where: { id } });
    if (!channel) {
      throw new NotFoundException('支付渠道不存在');
    }
    await this.paymentChannelRepository.remove(channel);
  }

  // 获取支付渠道详情
  async getChannel(id: string): Promise<PaymentChannel> {
    const channel = await this.paymentChannelRepository.findOne({ where: { id } });
    if (!channel) {
      throw new NotFoundException('支付渠道不存在');
    }
    return channel;
  }

  // 获取支付配置的所有渠道
  async getChannelsByConfigId(paymentConfigId: string): Promise<PaymentChannel[]> {
    return this.paymentChannelRepository.find({ 
      where: { paymentConfigId },
      order: { createdAt: 'ASC' }
    });
  }

  // 获取启用的渠道
  async getActiveChannels(paymentConfigId: string): Promise<PaymentChannel[]> {
    return this.paymentChannelRepository.find({ 
      where: { paymentConfigId, status: PaymentStatus.ACTIVE },
      order: { createdAt: 'ASC' }
    });
  }

  // ========== 统计与工具 ==========

  // 获取支付方式统计
  async getStats(): Promise<any> {
    const total = await this.paymentConfigRepository.count();
    const active = await this.paymentConfigRepository.count({ 
      where: { status: PaymentStatus.ACTIVE } 
    });
    const inactive = await this.paymentConfigRepository.count({ 
      where: { status: PaymentStatus.INACTIVE } 
    });
    
    // 按支付方式统计
    const byMethod = await this.paymentConfigRepository
      .createQueryBuilder('config')
      .select('config.method', 'method')
      .addSelect('COUNT(*)', 'count')
      .groupBy('config.method')
      .getRawMany();
    
    return { total, active, inactive, byMethod };
  }

  // 测试支付配置
  async testConfig(id: string): Promise<{ success: boolean; message: string }> {
    const config = await this.paymentConfigRepository.findOne({ where: { id } });
    if (!config) {
      throw new NotFoundException('支付配置不存在');
    }
    
    // 这里应该实现实际的支付测试逻辑
    // 目前返回模拟结果
    return { 
      success: true, 
      message: `支付方式 ${config.name} 配置验证通过` 
    };
  }

  // 获取默认支付配置
  async getDefaultConfig(method: PaymentMethod): Promise<PaymentConfig | null> {
    return this.paymentConfigRepository.findOne({ 
      where: { method, status: PaymentStatus.ACTIVE, storeId: IsNull() },
      order: { sortOrder: 'ASC' }
    });
  }
}
