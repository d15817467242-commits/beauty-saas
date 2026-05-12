import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThan, LessThan, DataSource } from 'typeorm';
import {
  MarketingCampaign,
  CampaignRule,
  CampaignParticipation,
  CampaignStatus,
  CampaignType,
  RuleType,
} from './marketing-campaign.entity';
import {
  CreateCampaignDto,
  UpdateCampaignDto,
  CreateCampaignRuleDto,
  UpdateCampaignRuleDto,
  CampaignEffectQueryDto,
} from './dto/marketing-campaign.dto';

@Injectable()
export class MarketingCampaignService {
  constructor(
    @InjectRepository(MarketingCampaign)
    private campaignRepository: Repository<MarketingCampaign>,
    @InjectRepository(CampaignRule)
    private ruleRepository: Repository<CampaignRule>,
    @InjectRepository(CampaignParticipation)
    private participationRepository: Repository<CampaignParticipation>,
    private dataSource: DataSource,
  ) {}

  // ==================== 营销活动管理 ====================

  async create(dto: CreateCampaignDto, userId: string): Promise<MarketingCampaign> {
    const campaign = this.campaignRepository.create({
      name: dto.name,
      subtitle: dto.subtitle,
      type: dto.type,
      startTime: new Date(dto.startTime),
      endTime: new Date(dto.endTime),
      rules: dto.rules,
      targetConditions: dto.targetConditions,
      applicableServices: dto.applicableServices,
      applicableProducts: dto.applicableProducts,
      applicableStores: dto.applicableStores,
      budgetAmount: dto.budgetAmount || 0,
      participateLimit: dto.participateLimit ?? -1,
      dailyLimit: dto.dailyLimit ?? -1,
      description: dto.description,
      bannerImage: dto.bannerImage,
      detailImages: Array.isArray(dto.detailImages) ? JSON.stringify(dto.detailImages) : dto.detailImages,
      createdBy: userId,
      status: CampaignStatus.DRAFT,
    });
    return this.campaignRepository.save(campaign);
  }

  async findAll(status?: CampaignStatus): Promise<MarketingCampaign[]> {
    const qb = this.campaignRepository.createQueryBuilder('c');
    if (status) {
      qb.andWhere('c.status = :status', { status });
    }
    return qb.orderBy('c.createdAt', 'DESC').getMany();
  }

  async findActive(): Promise<MarketingCampaign[]> {
    const now = new Date();
    return this.campaignRepository.find({
      where: {
        status: CampaignStatus.ACTIVE,
        startTime: LessThan(now),
        endTime: MoreThan(now),
      },
      relations: ['campaignRules'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<MarketingCampaign> {
    const campaign = await this.campaignRepository.findOne({
      where: { id },
      relations: ['campaignRules'],
    });
    if (!campaign) {
      throw new NotFoundException('营销活动不存在');
    }
    return campaign;
  }

  async update(id: string, dto: UpdateCampaignDto): Promise<MarketingCampaign> {
    const campaign = await this.findOne(id);
    
    // 检查是否可以修改
    if (campaign.status === CampaignStatus.ACTIVE || campaign.status === CampaignStatus.ENDED) {
      throw new BadRequestException('活动进行中或已结束，无法修改');
    }

    if (dto.startTime) {
      campaign.startTime = new Date(dto.startTime);
    }
    if (dto.endTime) {
      campaign.endTime = new Date(dto.endTime);
    }

    Object.assign(campaign, dto);
    return this.campaignRepository.save(campaign);
  }

  async remove(id: string): Promise<void> {
    const campaign = await this.findOne(id);
    if (campaign.status === CampaignStatus.ACTIVE) {
      throw new BadRequestException('活动进行中，无法删除');
    }
    await this.campaignRepository.remove(campaign);
  }

  async publish(id: string): Promise<MarketingCampaign> {
    const campaign = await this.findOne(id);
    if (campaign.status !== CampaignStatus.DRAFT && campaign.status !== CampaignStatus.PENDING) {
      throw new BadRequestException('只有草稿或待开始状态的活动可以发布');
    }
    
    const now = new Date();
    if (now < campaign.startTime) {
      campaign.status = CampaignStatus.PENDING;
    } else if (now >= campaign.startTime && now <= campaign.endTime) {
      campaign.status = CampaignStatus.ACTIVE;
    } else {
      throw new BadRequestException('活动时间已过，无法发布');
    }
    
    return this.campaignRepository.save(campaign);
  }

  async pause(id: string): Promise<MarketingCampaign> {
    const campaign = await this.findOne(id);
    if (campaign.status !== CampaignStatus.ACTIVE) {
      throw new BadRequestException('只有进行中的活动可以暂停');
    }
    campaign.status = CampaignStatus.PAUSED;
    return this.campaignRepository.save(campaign);
  }

  async resume(id: string): Promise<MarketingCampaign> {
    const campaign = await this.findOne(id);
    if (campaign.status !== CampaignStatus.PAUSED) {
      throw new BadRequestException('只有已暂停的活动可以恢复');
    }
    campaign.status = CampaignStatus.ACTIVE;
    return this.campaignRepository.save(campaign);
  }

  async cancel(id: string): Promise<MarketingCampaign> {
    const campaign = await this.findOne(id);
    if (campaign.status === CampaignStatus.ENDED || campaign.status === CampaignStatus.CANCELLED) {
      throw new BadRequestException('活动已结束或已取消');
    }
    campaign.status = CampaignStatus.CANCELLED;
    return this.campaignRepository.save(campaign);
  }

  // ==================== 活动规则管理 ====================

  async createRule(dto: CreateCampaignRuleDto): Promise<CampaignRule> {
    const campaign = await this.findOne(dto.campaignId);
    if (campaign.status === CampaignStatus.ACTIVE || campaign.status === CampaignStatus.ENDED) {
      throw new BadRequestException('活动进行中或已结束，无法添加规则');
    }

    const rule = this.ruleRepository.create(dto);
    return this.ruleRepository.save(rule);
  }

  async findRules(campaignId: string): Promise<CampaignRule[]> {
    return this.ruleRepository.find({
      where: { campaignId },
      order: { priority: 'DESC', createdAt: 'ASC' },
    });
  }

  async updateRule(id: string, dto: UpdateCampaignRuleDto): Promise<CampaignRule> {
    const rule = await this.ruleRepository.findOne({ where: { id } });
    if (!rule) {
      throw new NotFoundException('活动规则不存在');
    }
    Object.assign(rule, dto);
    return this.ruleRepository.save(rule);
  }

  async removeRule(id: string): Promise<void> {
    const rule = await this.ruleRepository.findOne({
      where: { id },
      relations: ['campaign'],
    });
    if (!rule) {
      throw new NotFoundException('活动规则不存在');
    }
    if (rule.campaign.status === CampaignStatus.ACTIVE) {
      throw new BadRequestException('活动进行中，无法删除规则');
    }
    await this.ruleRepository.remove(rule);
  }

  // ==================== 活动参与 ====================

  async participate(
    campaignId: string,
    memberId: string,
    orderId: string,
    orderAmount: number,
    ruleId?: string,
  ): Promise<CampaignParticipation> {
    const campaign = await this.findOne(campaignId);
    
    // 检查活动状态
    if (campaign.status !== CampaignStatus.ACTIVE) {
      throw new BadRequestException('活动未进行中');
    }

    const now = new Date();
    if (now < campaign.startTime || now > campaign.endTime) {
      throw new BadRequestException('不在活动时间范围内');
    }

    // 检查参与次数限制
    if (campaign.participateLimit > 0) {
      const count = await this.participationRepository.count({
        where: { campaignId, memberId },
      });
      if (count >= campaign.participateLimit) {
        throw new BadRequestException('已达到活动参与次数上限');
      }
    }

    // 检查每日限制
    if (campaign.dailyLimit > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const count = await this.participationRepository.count({
        where: {
          campaignId,
          memberId,
          participateTime: Between(today, tomorrow),
        },
      });
      if (count >= campaign.dailyLimit) {
        throw new BadRequestException('今日参与次数已达上限');
      }
    }

    // 计算优惠
    let discountAmount = 0;
    let appliedRule: CampaignRule | null = null;

    if (ruleId) {
      appliedRule = await this.ruleRepository.findOne({ where: { id: ruleId } });
    } else {
      // 自动匹配最优规则
      const rules = await this.findRules(campaignId);
      const enabledRules = rules.filter(r => r.enabled);
      
      for (const rule of enabledRules) {
        if (orderAmount >= rule.minAmount) {
          if (!appliedRule || rule.priority > appliedRule.priority) {
            appliedRule = rule;
          }
        }
      }
    }

    if (appliedRule) {
      discountAmount = this.calculateDiscount(appliedRule, orderAmount);
    }

    const participationData: Partial<CampaignParticipation> = {
      campaignId,
      memberId,
      orderId,
      orderAmount,
      discountAmount,
      actualAmount: orderAmount - discountAmount,
      participateTime: now,
    };
    
    if (appliedRule) {
      participationData.ruleId = appliedRule.id;
    }

    const participation = this.participationRepository.create(participationData);

    // 更新活动统计
    await this.campaignRepository.increment({ id: campaignId }, 'totalParticipants', 1);
    await this.campaignRepository.increment({ id: campaignId }, 'totalOrders', 1);
    await this.campaignRepository.increment({ id: campaignId }, 'totalAmount', orderAmount);
    await this.campaignRepository.increment({ id: campaignId }, 'totalDiscount', discountAmount);

    if (appliedRule) {
      await this.ruleRepository.increment({ id: appliedRule.id }, 'usedCount', 1);
    }

    return this.participationRepository.save(participation);
  }

  private calculateDiscount(rule: CampaignRule, amount: number): number {
    let discount = 0;

    switch (rule.type) {
      case RuleType.FULL_REDUCE:
        discount = rule.discountValue;
        break;
      case RuleType.DISCOUNT:
        discount = amount * (1 - rule.discountValue / 10);
        break;
      case RuleType.FIXED_PRICE:
        discount = amount - rule.discountValue;
        break;
      default:
        discount = 0;
    }

    if (rule.maxDiscount && discount > rule.maxDiscount) {
      discount = rule.maxDiscount;
    }

    return Math.max(0, Math.min(discount, amount));
  }

  // ==================== 活动效果统计 ====================

  async getEffectAnalysis(dto: CampaignEffectQueryDto): Promise<any> {
    const campaign = await this.findOne(dto.campaignId);

    const queryBuilder = this.participationRepository
      .createQueryBuilder('p')
      .where('p.campaignId = :campaignId', { campaignId: dto.campaignId });

    if (dto.startDate) {
      queryBuilder.andWhere('p.participateTime >= :startDate', {
        startDate: new Date(dto.startDate),
      });
    }
    if (dto.endDate) {
      queryBuilder.andWhere('p.participateTime <= :endDate', {
        endDate: new Date(dto.endDate),
      });
    }

    const participations = await queryBuilder.getMany();

    // 基础统计
    const totalParticipants = participations.length;
    const totalOrders = participations.length;
    const totalAmount = participations.reduce((sum, p) => sum + Number(p.orderAmount), 0);
    const totalDiscount = participations.reduce((sum, p) => sum + Number(p.discountAmount), 0);
    const totalActual = participations.reduce((sum, p) => sum + Number(p.actualAmount), 0);

    // ROI计算
    const roi = campaign.budgetAmount > 0
      ? ((totalActual - campaign.usedBudget) / campaign.usedBudget * 100).toFixed(2)
      : 0;

    // 转化率计算
    const avgOrderAmount = totalOrders > 0 ? totalAmount / totalOrders : 0;
    const avgDiscount = totalOrders > 0 ? totalDiscount / totalOrders : 0;
    const discountRate = totalAmount > 0 ? (totalDiscount / totalAmount * 100).toFixed(2) : 0;

    // 按日期统计
    const dailyStats = await this.getDailyStats(dto.campaignId, dto.startDate, dto.endDate);

    // 按规则统计
    const ruleStats = await this.getRuleStats(dto.campaignId);

    return {
      campaign: {
        id: campaign.id,
        name: campaign.name,
        type: campaign.type,
        status: campaign.status,
        startTime: campaign.startTime,
        endTime: campaign.endTime,
        budgetAmount: campaign.budgetAmount,
        usedBudget: campaign.usedBudget,
      },
      summary: {
        totalParticipants,
        totalOrders,
        totalAmount,
        totalDiscount,
        totalActual,
        avgOrderAmount,
        avgDiscount,
        discountRate,
        roi,
      },
      dailyStats,
      ruleStats,
    };
  }

  private async getDailyStats(campaignId: string, startDate?: string, endDate?: string): Promise<any[]> {
    const queryBuilder = this.participationRepository
      .createQueryBuilder('p')
      .select('DATE(p.participateTime)', 'date')
      .addSelect('COUNT(DISTINCT p.memberId)', 'participants')
      .addSelect('COUNT(*)', 'orders')
      .addSelect('SUM(p.orderAmount)', 'amount')
      .addSelect('SUM(p.discountAmount)', 'discount')
      .where('p.campaignId = :campaignId', { campaignId })
      .groupBy('DATE(p.participateTime)')
      .orderBy('date', 'ASC');

    if (startDate) {
      queryBuilder.andWhere('p.participateTime >= :startDate', {
        startDate: new Date(startDate),
      });
    }
    if (endDate) {
      queryBuilder.andWhere('p.participateTime <= :endDate', {
        endDate: new Date(endDate),
      });
    }

    return queryBuilder.getRawMany();
  }

  private async getRuleStats(campaignId: string): Promise<any[]> {
    const rules = await this.ruleRepository.find({ where: { campaignId } });
    
    const stats = await Promise.all(
      rules.map(async (rule) => {
        const count = await this.participationRepository.count({
          where: { ruleId: rule.id },
        });
        const sum = await this.participationRepository
          .createQueryBuilder('p')
          .select('SUM(p.discountAmount)', 'total')
          .where('p.ruleId = :ruleId', { ruleId: rule.id })
          .getRawOne();

        return {
          ruleId: rule.id,
          ruleName: rule.name,
          ruleType: rule.type,
          usedCount: count,
          totalDiscount: sum?.total || 0,
        };
      })
    );

    return stats;
  }

  // 获取会员参与记录
  async getMemberParticipations(memberId: string): Promise<CampaignParticipation[]> {
    return this.participationRepository.find({
      where: { memberId },
      relations: ['campaign', 'rule'],
      order: { participateTime: 'DESC' },
    });
  }
}
