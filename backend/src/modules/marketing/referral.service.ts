import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Referral, ReferralConfig, ReferralStatus } from './referral.entity';
import { CreateReferralConfigDto, CreateReferralDto } from './dto/referral.dto';

@Injectable()
export class ReferralService {
  constructor(
    @InjectRepository(Referral)
    private referralRepository: Repository<Referral>,
    @InjectRepository(ReferralConfig)
    private referralConfigRepository: Repository<ReferralConfig>,
  ) {}

  // 创建转介绍配置
  async createConfig(dto: CreateReferralConfigDto, userId: string): Promise<ReferralConfig> {
    const config = this.referralConfigRepository.create({
      ...dto,
      createdBy: userId,
    });
    return this.referralConfigRepository.save(config);
  }

  // 获取转介绍配置
  async getConfig(): Promise<ReferralConfig | null> {
    return this.referralConfigRepository.findOne({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  // 更新转介绍配置
  async updateConfig(id: string, dto: Partial<CreateReferralConfigDto>): Promise<ReferralConfig> {
    const config = await this.referralConfigRepository.findOne({ where: { id } });
    if (!config) {
      throw new NotFoundException('转介绍配置不存在');
    }
    Object.assign(config, dto);
    return this.referralConfigRepository.save(config);
  }

  // 创建转介绍记录
  async create(dto: CreateReferralDto): Promise<Referral> {
    // 检查是否已存在转介绍关系
    const existing = await this.referralRepository.findOne({
      where: { referrerId: dto.referrerId, refereeId: dto.refereeId },
    });
    if (existing) {
      throw new BadRequestException('转介绍关系已存在');
    }
    
    const referral = this.referralRepository.create({
      ...dto,
      status: ReferralStatus.PENDING,
      referralTime: new Date(),
    });
    return this.referralRepository.save(referral);
  }

  // 获取转介绍记录列表
  async findAll(): Promise<Referral[]> {
    return this.referralRepository.find({
      relations: ['referrer', 'referee'],
      order: { createdAt: 'DESC' },
    });
  }

  // 获取推荐人的转介绍记录
  async findByReferrer(referrerId: string): Promise<Referral[]> {
    return this.referralRepository.find({
      where: { referrerId },
      relations: ['referee'],
      order: { createdAt: 'DESC' },
    });
  }

  // 完成转介绍（被推荐人首次消费后调用）
  async complete(refereeId: string, firstSpendAmount: number): Promise<Referral | null> {
    const referral = await this.referralRepository.findOne({
      where: { refereeId, status: ReferralStatus.PENDING },
    });
    
    if (!referral) {
      return null;
    }
    
    const config = await this.getConfig();
    if (!config) {
      return null;
    }
    
    // 检查是否达到最低消费要求
    if (firstSpendAmount < config.minSpend) {
      return null;
    }
    
    referral.status = ReferralStatus.COMPLETED;
    referral.refereeFirstSpend = firstSpendAmount;
    referral.referrerReward = config.referrerReward;
    referral.refereeReward = config.refereeReward;
    referral.completeTime = new Date();
    
    return this.referralRepository.save(referral);
  }

  // 发放奖励
  async grantReward(id: string): Promise<Referral> {
    const referral = await this.referralRepository.findOne({ where: { id } });
    if (!referral) {
      throw new NotFoundException('转介绍记录不存在');
    }
    
    if (referral.status !== ReferralStatus.COMPLETED) {
      throw new BadRequestException('转介绍尚未完成');
    }
    
    referral.status = ReferralStatus.REWARDED;
    referral.rewardTime = new Date();
    
    return this.referralRepository.save(referral);
  }

  // 获取转介绍统计
  async getStatistics(referrerId?: string): Promise<{
    total: number;
    pending: number;
    completed: number;
    rewarded: number;
    totalReward: number;
  }> {
    const query = this.referralRepository.createQueryBuilder('r');
    
    if (referrerId) {
      query.where('r.referrerId = :referrerId', { referrerId });
    }
    
    const [total, pending, completed, rewarded, totalReward] = await Promise.all([
      query.getCount(),
      query.clone().andWhere('r.status = :status', { status: ReferralStatus.PENDING }).getCount(),
      query.clone().andWhere('r.status = :status', { status: ReferralStatus.COMPLETED }).getCount(),
      query.clone().andWhere('r.status = :status', { status: ReferralStatus.REWARDED }).getCount(),
      query.clone()
        .andWhere('r.status = :status', { status: ReferralStatus.REWARDED })
        .select('SUM(r.referrerReward)', 'sum')
        .getRawOne(),
    ]);
    
    return {
      total,
      pending,
      completed,
      rewarded,
      totalReward: parseFloat(totalReward?.sum || '0'),
    };
  }
}
