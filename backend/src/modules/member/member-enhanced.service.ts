import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { 
  MemberTag, 
  MemberTagRelation, 
  PointExchangeRule, 
  PointExchangeRecord,
  MemberRanking,
  Store,
  CrossStoreConsumption,
  MemberLevelConfig,
  MemberLevelBenefit,
  MemberPoints,
  PointsRecord,
  MemberReferral,
} from './member-enhanced.entity';
import { Member } from './member.entity';
import { Consumption } from '../cashier/consumption.entity';
import {
  CreateMemberTagDto,
  UpdateMemberTagDto,
  TagMemberDto,
  BatchTagMembersDto,
  CreatePointExchangeRuleDto,
  ExchangePointsDto,
  CreateStoreDto,
  CreateMemberLevelDto,
  UpdateMemberLevelDto,
  CreateLevelBenefitDto,
  EarnPointsDto,
  ConsumePointsDto,
  QueryPointsRecordsDto,
  CreateReferralDto,
  QueryReferralsDto,
  ConsumptionAnalysisQueryDto,
} from './dto/member-enhanced.dto';

@Injectable()
export class MemberTagService {
  constructor(
    @InjectRepository(MemberTag)
    private tagRepository: Repository<MemberTag>,
    @InjectRepository(MemberTagRelation)
    private tagRelationRepository: Repository<MemberTagRelation>,
  ) {}

  async create(dto: CreateMemberTagDto, userId: string): Promise<MemberTag> {
    const tag = this.tagRepository.create({ ...dto, createdBy: userId });
    return this.tagRepository.save(tag);
  }

  async findAll(): Promise<MemberTag[]> {
    return this.tagRepository.find({ order: { name: 'ASC' } });
  }

  async findOne(id: string): Promise<MemberTag> {
    const tag = await this.tagRepository.findOne({ where: { id } });
    if (!tag) throw new NotFoundException('标签不存在');
    return tag;
  }

  async update(id: string, dto: UpdateMemberTagDto): Promise<MemberTag> {
    const tag = await this.findOne(id);
    Object.assign(tag, dto);
    return this.tagRepository.save(tag);
  }

  async remove(id: string): Promise<void> {
    const tag = await this.findOne(id);
    await this.tagRepository.remove(tag);
  }

  async tagMember(dto: TagMemberDto, userId: string): Promise<MemberTagRelation> {
    const existing = await this.tagRelationRepository.findOne({
      where: { memberId: dto.memberId, tagId: dto.tagId },
    });
    if (existing) return existing;

    const relation = this.tagRelationRepository.create({
      ...dto,
      taggedTime: new Date(),
      taggedBy: userId,
    });
    return this.tagRelationRepository.save(relation);
  }

  async untagMember(memberId: string, tagId: string): Promise<void> {
    const relation = await this.tagRelationRepository.findOne({
      where: { memberId, tagId },
    });
    if (relation) {
      await this.tagRelationRepository.remove(relation);
    }
  }

  async batchTagMembers(dto: BatchTagMembersDto, userId: string): Promise<number> {
    let count = 0;
    for (const memberId of dto.memberIds) {
      try {
        await this.tagMember({ memberId, tagId: dto.tagId }, userId);
        count++;
      } catch (e) {
        // ignore
      }
    }
    return count;
  }

  async getMemberTags(memberId: string): Promise<MemberTag[]> {
    const relations = await this.tagRelationRepository.find({
      where: { memberId },
      relations: ['tag'],
    });
    return relations.map(r => r.tag);
  }

  async getTagMembers(tagId: string): Promise<MemberTagRelation[]> {
    return this.tagRelationRepository.find({
      where: { tagId },
      relations: ['member'],
    });
  }
}

@Injectable()
export class PointExchangeService {
  constructor(
    @InjectRepository(PointExchangeRule)
    private ruleRepository: Repository<PointExchangeRule>,
    @InjectRepository(PointExchangeRecord)
    private recordRepository: Repository<PointExchangeRecord>,
    @InjectRepository(Member)
    private memberRepository: Repository<Member>,
  ) {}

  async createRule(dto: CreatePointExchangeRuleDto, userId: string): Promise<PointExchangeRule> {
    const rule = this.ruleRepository.create({ ...dto, createdBy: userId });
    return this.ruleRepository.save(rule);
  }

  async findRules(): Promise<PointExchangeRule[]> {
    return this.ruleRepository.find({ where: { isActive: true }, order: { pointsRequired: 'ASC' } });
  }

  async exchange(dto: ExchangePointsDto, memberId: string, userId: string): Promise<PointExchangeRecord> {
    const rule = await this.ruleRepository.findOne({ where: { id: dto.ruleId } });
    if (!rule || !rule.isActive) throw new NotFoundException('兑换规则不存在或已停用');

    const member = await this.memberRepository.findOne({ where: { id: memberId } });
    if (!member) throw new NotFoundException('会员不存在');

    if (member.points < rule.pointsRequired) {
      throw new BadRequestException('积分不足');
    }

    // 扣减积分
    member.points -= rule.pointsRequired;

    // 增加余额（如果有）
    if (rule.rewardAmount) {
      member.balance = Number(member.balance) + rule.rewardAmount;
    }

    await this.memberRepository.save(member);

    const record = this.recordRepository.create({
      memberId,
      ruleId: rule.id,
      pointsUsed: rule.pointsRequired,
      rewardAmount: rule.rewardAmount || 0,
      exchangeTime: new Date(),
      createdBy: userId,
    });

    return this.recordRepository.save(record);
  }

  async getMemberRecords(memberId: string): Promise<PointExchangeRecord[]> {
    return this.recordRepository.find({
      where: { memberId },
      relations: ['rule'],
      order: { exchangeTime: 'DESC' },
    });
  }
}

@Injectable()
export class MemberRankingService {
  constructor(
    @InjectRepository(MemberRanking)
    private rankingRepository: Repository<MemberRanking>,
    @InjectRepository(Member)
    private memberRepository: Repository<Member>,
  ) {}

  async calculateRanking(yearMonth?: number): Promise<void> {
    const now = new Date();
    const month = yearMonth || (now.getFullYear() * 100 + now.getMonth() + 1);

    const members = await this.memberRepository.find();

    // 按消费总额排序
    const sortedBySpend = [...members].sort((a, b) => Number(b.totalSpent) - Number(a.totalSpent));
    // 按到店次数排序
    const sortedByVisit = [...members].sort((a, b) => b.visitCount - a.visitCount);

    for (const member of members) {
      const spendRank = sortedBySpend.findIndex(m => m.id === member.id) + 1;
      const visitRank = sortedByVisit.findIndex(m => m.id === member.id) + 1;

      let ranking = await this.rankingRepository.findOne({
        where: { memberId: member.id, rankingMonth: month },
      });

      if (!ranking) {
        ranking = this.rankingRepository.create({
          memberId: member.id,
          rankingMonth: month,
        });
      }

      ranking.totalSpent = member.totalSpent;
      ranking.visitCount = member.visitCount;
      ranking.spendRank = spendRank;
      ranking.visitRank = visitRank;

      await this.rankingRepository.save(ranking);
    }
  }

  async getRanking(yearMonth?: number, limit: number = 10): Promise<{
    spendRanking: MemberRanking[];
    visitRanking: MemberRanking[];
  }> {
    const now = new Date();
    const month = yearMonth || (now.getFullYear() * 100 + now.getMonth() + 1);

    const [spendRanking, visitRanking] = await Promise.all([
      this.rankingRepository.find({
        where: { rankingMonth: month },
        relations: ['member'],
        order: { spendRank: 'ASC' },
        take: limit,
      }),
      this.rankingRepository.find({
        where: { rankingMonth: month },
        relations: ['member'],
        order: { visitRank: 'ASC' },
        take: limit,
      }),
    ]);

    return { spendRanking, visitRanking };
  }
}

@Injectable()
export class StoreService {
  constructor(
    @InjectRepository(Store)
    private storeRepository: Repository<Store>,
    @InjectRepository(CrossStoreConsumption)
    private crossStoreRepository: Repository<CrossStoreConsumption>,
  ) {}

  async create(dto: CreateStoreDto): Promise<Store> {
    const store = this.storeRepository.create(dto);
    return this.storeRepository.save(store);
  }

  async findAll(): Promise<Store[]> {
    return this.storeRepository.find({ where: { isActive: true }, order: { name: 'ASC' } });
  }

  async findOne(id: string): Promise<Store> {
    const store = await this.storeRepository.findOne({ where: { id } });
    if (!store) throw new NotFoundException('门店不存在');
    return store;
  }

  async recordCrossStoreConsumption(
    memberId: string,
    homeStoreId: string,
    consumeStoreId: string,
    consumptionId: string,
    amount: number,
  ): Promise<CrossStoreConsumption> {
    const record = this.crossStoreRepository.create({
      memberId,
      homeStoreId,
      consumeStoreId,
      consumptionId,
      amount,
      consumeTime: new Date(),
    });
    return this.crossStoreRepository.save(record);
  }

  async getCrossStoreConsumptions(memberId: string): Promise<CrossStoreConsumption[]> {
    return this.crossStoreRepository.find({
      where: { memberId },
      relations: ['homeStore', 'consumeStore'],
      order: { consumeTime: 'DESC' },
    });
  }
}

// ==================== 会员等级服务 ====================

@Injectable()
export class MemberLevelService {
  constructor(
    @InjectRepository(MemberLevelConfig)
    private levelRepository: Repository<MemberLevelConfig>,
    @InjectRepository(MemberLevelBenefit)
    private benefitRepository: Repository<MemberLevelBenefit>,
    @InjectRepository(Member)
    private memberRepository: Repository<Member>,
  ) {}

  async createLevel(dto: CreateMemberLevelDto): Promise<MemberLevelConfig> {
    const level = this.levelRepository.create(dto);
    return this.levelRepository.save(level);
  }

  async findAllLevels(): Promise<MemberLevelConfig[]> {
    return this.levelRepository.find({
      where: { isActive: true },
      relations: ['benefits'],
      order: { levelOrder: 'ASC' },
    });
  }

  async findOneLevel(id: string): Promise<MemberLevelConfig> {
    const level = await this.levelRepository.findOne({
      where: { id },
      relations: ['benefits'],
    });
    if (!level) throw new NotFoundException('等级不存在');
    return level;
  }

  async updateLevel(id: string, dto: UpdateMemberLevelDto): Promise<MemberLevelConfig> {
    const level = await this.findOneLevel(id);
    Object.assign(level, dto);
    return this.levelRepository.save(level);
  }

  async removeLevel(id: string): Promise<void> {
    const level = await this.findOneLevel(id);
    await this.levelRepository.remove(level);
  }

  async createBenefit(dto: CreateLevelBenefitDto): Promise<MemberLevelBenefit> {
    const benefit = this.benefitRepository.create(dto);
    return this.benefitRepository.save(benefit);
  }

  async getLevelBenefits(levelId: string): Promise<MemberLevelBenefit[]> {
    return this.benefitRepository.find({
      where: { levelId, isActive: true },
    });
  }

  async removeBenefit(id: string): Promise<void> {
    const benefit = await this.benefitRepository.findOne({ where: { id } });
    if (benefit) {
      await this.benefitRepository.remove(benefit);
    }
  }

  // 自动升级检查
  async checkAndUpgrade(memberId: string): Promise<MemberLevelConfig | null> {
    const member = await this.memberRepository.findOne({ where: { id: memberId } });
    if (!member) throw new NotFoundException('会员不存在');

    const levels = await this.levelRepository.find({
      where: { isActive: true },
      order: { levelOrder: 'DESC' },
    });

    // 找到符合条件的最高等级
    for (const level of levels) {
      const meetsPoints = member.points >= level.minPoints;
      const meetsSpent = Number(member.totalSpent) >= level.minSpent;
      const meetsVisits = member.visitCount >= level.minVisits;

      if (meetsPoints && meetsSpent && meetsVisits) {
        // 更新会员等级
        member.level = level.code as any;
        await this.memberRepository.save(member);
        return level;
      }
    }

    return null;
  }

  // 获取会员当前等级和下一等级信息
  async getMemberLevelInfo(memberId: string): Promise<{
    currentLevel: MemberLevelConfig | null;
    nextLevel: MemberLevelConfig | null;
    progress: {
      points: { current: number; required: number; percent: number };
      spent: { current: number; required: number; percent: number };
      visits: { current: number; required: number; percent: number };
    };
  }> {
    const member = await this.memberRepository.findOne({ where: { id: memberId } });
    if (!member) throw new NotFoundException('会员不存在');

    const levels = await this.levelRepository.find({
      where: { isActive: true },
      order: { levelOrder: 'ASC' },
    });

    // 找到当前等级
    const currentLevel = levels.find(l => l.code === member.level) || levels[0];

    // 找到下一等级
    const currentIndex = levels.findIndex(l => l.id === currentLevel?.id);
    const nextLevel = currentIndex < levels.length - 1 ? levels[currentIndex + 1] : null;

    // 计算升级进度
    const progress = {
      points: {
        current: member.points,
        required: nextLevel?.minPoints || 0,
        percent: nextLevel ? Math.min(100, (member.points / nextLevel.minPoints) * 100) : 100,
      },
      spent: {
        current: Number(member.totalSpent),
        required: nextLevel?.minSpent || 0,
        percent: nextLevel ? Math.min(100, (Number(member.totalSpent) / nextLevel.minSpent) * 100) : 100,
      },
      visits: {
        current: member.visitCount,
        required: nextLevel?.minVisits || 0,
        percent: nextLevel ? Math.min(100, (member.visitCount / nextLevel.minVisits) * 100) : 100,
      },
    };

    return { currentLevel, nextLevel, progress };
  }
}

// ==================== 会员积分服务 ====================

@Injectable()
export class MemberPointsService {
  constructor(
    @InjectRepository(MemberPoints)
    private memberPointsRepository: Repository<MemberPoints>,
    @InjectRepository(PointsRecord)
    private pointsRecordRepository: Repository<PointsRecord>,
    @InjectRepository(Member)
    private memberRepository: Repository<Member>,
  ) {}

  // 获取或创建会员积分账户
  private async getOrCreateMemberPoints(memberId: string): Promise<MemberPoints> {
    let memberPoints = await this.memberPointsRepository.findOne({ where: { memberId } });
    if (!memberPoints) {
      memberPoints = this.memberPointsRepository.create({ memberId });
      await this.memberPointsRepository.save(memberPoints);
    }
    return memberPoints;
  }

  // 获取会员积分信息
  async getMemberPoints(memberId: string): Promise<MemberPoints> {
    return this.getOrCreateMemberPoints(memberId);
  }

  // 获取积分
  async earnPoints(dto: EarnPointsDto, userId?: string): Promise<PointsRecord> {
    const memberPoints = await this.getOrCreateMemberPoints(dto.memberId);

    // 更新积分
    memberPoints.totalPoints += dto.points;
    memberPoints.availablePoints += dto.points;
    memberPoints.lastEarnTime = new Date();
    await this.memberPointsRepository.save(memberPoints);

    // 同步更新Member表的points字段
    const member = await this.memberRepository.findOne({ where: { id: dto.memberId } });
    if (member) {
      member.points = memberPoints.availablePoints;
      await this.memberRepository.save(member);
    }

    // 创建积分记录
    const record = this.pointsRecordRepository.create({
      memberId: dto.memberId,
      points: dto.points,
      balanceAfter: memberPoints.availablePoints,
      type: 'earn',
      description: dto.description || '获取积分',
      relatedId: dto.relatedId,
      relatedType: dto.relatedType,
      expireTime: dto.expireTime ? new Date(dto.expireTime) : undefined,
      createdBy: userId,
    });

    return this.pointsRecordRepository.save(record);
  }

  // 消费积分
  async consumePoints(dto: ConsumePointsDto, userId?: string): Promise<PointsRecord> {
    const memberPoints = await this.getOrCreateMemberPoints(dto.memberId);

    if (memberPoints.availablePoints < dto.points) {
      throw new BadRequestException('可用积分不足');
    }

    // 更新积分
    memberPoints.availablePoints -= dto.points;
    memberPoints.usedPoints += dto.points;
    memberPoints.lastUseTime = new Date();
    await this.memberPointsRepository.save(memberPoints);

    // 同步更新Member表的points字段
    const member = await this.memberRepository.findOne({ where: { id: dto.memberId } });
    if (member) {
      member.points = memberPoints.availablePoints;
      await this.memberRepository.save(member);
    }

    // 创建积分记录
    const record = this.pointsRecordRepository.create({
      memberId: dto.memberId,
      points: -dto.points,
      balanceAfter: memberPoints.availablePoints,
      type: 'consume',
      description: dto.description || '消费积分',
      relatedId: dto.relatedId,
      relatedType: dto.relatedType,
      createdBy: userId,
    });

    return this.pointsRecordRepository.save(record);
  }

  // 查询积分流水
  async getPointsRecords(dto: QueryPointsRecordsDto): Promise<{ records: PointsRecord[]; total: number }> {
    const where: any = { memberId: dto.memberId };
    
    if (dto.type) {
      where.type = dto.type;
    }

    if (dto.startDate && dto.endDate) {
      where.createdAt = Between(new Date(dto.startDate), new Date(dto.endDate));
    }

    const page = dto.page || 1;
    const pageSize = dto.pageSize || 20;

    const [records, total] = await this.pointsRecordRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return { records, total };
  }

  // 积分过期处理
  async expirePoints(memberId: string): Promise<number> {
    const now = new Date();
    const expiredRecords = await this.pointsRecordRepository.find({
      where: {
        memberId,
        points: MoreThanOrEqual(0),
        expireTime: LessThanOrEqual(now),
      },
    });

    let totalExpired = 0;
    for (const record of expiredRecords) {
      if (record.points > 0) {
        totalExpired += record.points;
        
        // 创建过期记录
        await this.pointsRecordRepository.save({
          memberId,
          points: -record.points,
          balanceAfter: 0,
          type: 'expire',
          description: `积分过期: ${record.description}`,
          relatedId: record.id,
          relatedType: 'points_record',
        });
      }
    }

    if (totalExpired > 0) {
      const memberPoints = await this.getOrCreateMemberPoints(memberId);
      memberPoints.availablePoints -= totalExpired;
      memberPoints.expiredPoints += totalExpired;
      await this.memberPointsRepository.save(memberPoints);
    }

    return totalExpired;
  }
}

// ==================== 会员推荐服务 ====================

@Injectable()
export class MemberReferralService {
  constructor(
    @InjectRepository(MemberReferral)
    private referralRepository: Repository<MemberReferral>,
    @InjectRepository(Member)
    private memberRepository: Repository<Member>,
    @InjectRepository(Consumption)
    private consumptionRepository: Repository<Consumption>,
    private pointsService: MemberPointsService,
  ) {}

  async createReferral(dto: CreateReferralDto): Promise<MemberReferral> {
    // 检查是否已存在推荐关系
    const existing = await this.referralRepository.findOne({
      where: { refereeId: dto.refereeId },
    });
    if (existing) {
      throw new BadRequestException('该会员已有推荐人');
    }

    // 不能自己推荐自己
    if (dto.referrerId === dto.refereeId) {
      throw new BadRequestException('不能自己推荐自己');
    }

    const referral = this.referralRepository.create({
      ...dto,
      referralTime: new Date(),
      status: 'pending',
    });

    return this.referralRepository.save(referral);
  }

  // 确认推荐关系（首次消费时触发）
  async confirmReferral(refereeId: string, consumptionId: string, amount: number): Promise<MemberReferral | null> {
    const referral = await this.referralRepository.findOne({
      where: { refereeId, status: 'pending' },
    });

    if (!referral) return null;

    referral.status = 'confirmed';
    referral.firstConsumptionId = consumptionId;
    referral.firstConsumptionAmount = amount;

    return this.referralRepository.save(referral);
  }

  // 发放推荐奖励
  async grantReward(referralId: string, rewardAmount: number, rewardPoints: number): Promise<MemberReferral> {
    const referral = await this.referralRepository.findOne({
      where: { id: referralId },
    });

    if (!referral) throw new NotFoundException('推荐关系不存在');
    if (referral.status === 'rewarded') {
      throw new BadRequestException('奖励已发放');
    }

    // 发放积分奖励
    if (rewardPoints > 0) {
      await this.pointsService.earnPoints({
        memberId: referral.referrerId,
        points: rewardPoints,
        description: '推荐奖励积分',
        relatedId: referral.id,
        relatedType: 'referral',
      });
    }

    referral.status = 'rewarded';
    referral.rewardAmount = rewardAmount;
    referral.rewardPoints = rewardPoints;
    referral.rewardTime = new Date();

    return this.referralRepository.save(referral);
  }

  // 获取推荐关系统计
  async getReferralStats(memberId: string): Promise<{
    totalReferrals: number;
    confirmedReferrals: number;
    rewardedReferrals: number;
    totalRewardAmount: number;
    totalRewardPoints: number;
  }> {
    const referrals = await this.referralRepository.find({
      where: { referrerId: memberId },
    });

    return {
      totalReferrals: referrals.length,
      confirmedReferrals: referrals.filter(r => r.status === 'confirmed').length,
      rewardedReferrals: referrals.filter(r => r.status === 'rewarded').length,
      totalRewardAmount: referrals.reduce((sum, r) => sum + Number(r.rewardAmount), 0),
      totalRewardPoints: referrals.reduce((sum, r) => sum + r.rewardPoints, 0),
    };
  }

  // 查询推荐列表
  async queryReferrals(dto: QueryReferralsDto): Promise<MemberReferral[]> {
    const where: any = {};

    if (dto.type === 'referrer') {
      where.referrerId = dto.memberId;
    } else if (dto.type === 'referee') {
      where.refereeId = dto.memberId;
    }

    if (dto.status) {
      where.status = dto.status;
    }

    return this.referralRepository.find({
      where,
      relations: ['referrer', 'referee'],
      order: { referralTime: 'DESC' },
    });
  }
}

// ==================== 会员画像和消费分析服务 ====================

@Injectable()
export class MemberPortraitService {
  constructor(
    @InjectRepository(Member)
    private memberRepository: Repository<Member>,
    @InjectRepository(Consumption)
    private consumptionRepository: Repository<Consumption>,
    @InjectRepository(MemberTagRelation)
    private tagRelationRepository: Repository<MemberTagRelation>,
    @InjectRepository(MemberReferral)
    private referralRepository: Repository<MemberReferral>,
    @InjectRepository(MemberPoints)
    private memberPointsRepository: Repository<MemberPoints>,
  ) {}

  // 获取会员画像
  async getPortrait(memberId: string): Promise<any> {
    const member = await this.memberRepository.findOne({ where: { id: memberId } });
    if (!member) throw new NotFoundException('会员不存在');

    // 获取消费记录
    const consumptions = await this.consumptionRepository.find({
      where: { memberId },
      order: { createdAt: 'DESC' },
      take: 100,
    });

    // 获取标签
    const tagRelations = await this.tagRelationRepository.find({
      where: { memberId },
      relations: ['tag'],
    });

    // 获取积分信息
    let memberPoints = await this.memberPointsRepository.findOne({ where: { memberId } });

    // 获取推荐统计
    const referralStats = await this.getReferralStats(memberId);

    // 计算画像数据
    const portrait = {
      // 基本信息
      basic: {
        name: member.name,
        phone: member.phone,
        gender: member.gender,
        birthday: member.birthday,
        level: member.level,
        points: memberPoints?.availablePoints || member.points,
        balance: member.balance,
        totalSpent: member.totalSpent,
        visitCount: member.visitCount,
        lastVisitAt: member.lastVisitAt,
        memberSince: member.createdAt,
      },

      // 消费习惯
      consumptionHabits: this.calculateConsumptionHabits(consumptions),

      // 偏好服务
      preferredServices: this.calculatePreferredServices(consumptions),

      // 消费周期
      consumptionCycle: this.calculateConsumptionCycle(consumptions),

      // 消费时段偏好
      timePreference: this.calculateTimePreference(consumptions),

      // 标签
      tags: tagRelations.map(r => r.tag),

      // 推荐统计
      referral: referralStats,

      // 价值评估
      valueAssessment: this.calculateValueAssessment(member, consumptions),
    };

    return portrait;
  }

  // 消费分析
  async getConsumptionAnalysis(dto: ConsumptionAnalysisQueryDto): Promise<any> {
    const member = await this.memberRepository.findOne({ where: { id: dto.memberId } });
    if (!member) throw new NotFoundException('会员不存在');

    const where: any = { memberId: dto.memberId };
    
    if (dto.startDate && dto.endDate) {
      where.createdAt = Between(new Date(dto.startDate), new Date(dto.endDate));
    }

    const consumptions = await this.consumptionRepository.find({
      where,
      order: { createdAt: 'ASC' },
    });

    // 消费趋势（按月）
    const monthlyTrend = this.calculateMonthlyTrend(consumptions);

    // 服务偏好分析
    const servicePreference = this.calculateServicePreference(consumptions);

    // 支付方式分析
    const paymentMethodAnalysis = this.calculatePaymentMethodAnalysis(consumptions);

    // 消费金额分布
    const amountDistribution = this.calculateAmountDistribution(consumptions);

    // 员工偏好
    const employeePreference = this.calculateEmployeePreference(consumptions);

    return {
      summary: {
        totalConsumptions: consumptions.length,
        totalAmount: consumptions.reduce((sum, c) => sum + Number(c.amount), 0),
        totalActualAmount: consumptions.reduce((sum, c) => sum + Number(c.actualAmount), 0),
        avgAmount: consumptions.length > 0 
          ? consumptions.reduce((sum, c) => sum + Number(c.actualAmount), 0) / consumptions.length 
          : 0,
      },
      monthlyTrend,
      servicePreference,
      paymentMethodAnalysis,
      amountDistribution,
      employeePreference,
    };
  }

  // 计算消费习惯
  private calculateConsumptionHabits(consumptions: Consumption[]): any {
    if (consumptions.length === 0) {
      return { avgAmount: 0, frequency: 'unknown', preferredPayment: null };
    }

    const totalAmount = consumptions.reduce((sum, c) => sum + Number(c.actualAmount), 0);
    const avgAmount = totalAmount / consumptions.length;

    // 计算消费频率
    const firstDate = new Date(consumptions[consumptions.length - 1].createdAt);
    const lastDate = new Date(consumptions[0].createdAt);
    const daysDiff = Math.max(1, (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24));
    const frequencyPerMonth = (consumptions.length / daysDiff) * 30;

    let frequency = 'low';
    if (frequencyPerMonth >= 4) frequency = 'high';
    else if (frequencyPerMonth >= 2) frequency = 'medium';

    // 统计支付方式
    const paymentCounts: Record<string, number> = {};
    consumptions.forEach(c => {
      paymentCounts[c.paymentMethod] = (paymentCounts[c.paymentMethod] || 0) + 1;
    });
    const preferredPayment = Object.entries(paymentCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0];

    return { avgAmount, frequency, frequencyPerMonth, preferredPayment };
  }

  // 计算偏好服务
  private calculatePreferredServices(consumptions: Consumption[]): any[] {
    const serviceStats: Record<string, { count: number; amount: number; name: string }> = {};

    consumptions.forEach(c => {
      if (c.items) {
        c.items.forEach(item => {
          if (!serviceStats[item.serviceId]) {
            serviceStats[item.serviceId] = { count: 0, amount: 0, name: item.serviceName };
          }
          serviceStats[item.serviceId].count += item.quantity;
          serviceStats[item.serviceId].amount += item.amount;
        });
      }
    });

    return Object.entries(serviceStats)
      .map(([id, stats]) => ({ id, ...stats }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  // 计算消费周期
  private calculateConsumptionCycle(consumptions: Consumption[]): any {
    if (consumptions.length < 2) {
      return { avgDays: null, pattern: 'insufficient_data' };
    }

    const dates = consumptions.map(c => new Date(c.createdAt).getTime()).sort((a, b) => a - b);
    const intervals: number[] = [];

    for (let i = 1; i < dates.length; i++) {
      intervals.push((dates[i] - dates[i - 1]) / (1000 * 60 * 60 * 24));
    }

    const avgDays = intervals.reduce((sum, d) => sum + d, 0) / intervals.length;

    let pattern = 'irregular';
    if (avgDays <= 7) pattern = 'weekly';
    else if (avgDays <= 14) pattern = 'biweekly';
    else if (avgDays <= 30) pattern = 'monthly';
    else if (avgDays <= 90) pattern = 'quarterly';

    return { avgDays: Math.round(avgDays), pattern };
  }

  // 计算时段偏好
  private calculateTimePreference(consumptions: Consumption[]): any {
    const hourCounts: Record<number, number> = {};
    const dayOfWeekCounts: Record<number, number> = {};

    consumptions.forEach(c => {
      const date = new Date(c.createdAt);
      const hour = date.getHours();
      const dayOfWeek = date.getDay();

      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      dayOfWeekCounts[dayOfWeek] = (dayOfWeekCounts[dayOfWeek] || 0) + 1;
    });

    const preferredHour = Object.entries(hourCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0];
    const preferredDay = Object.entries(dayOfWeekCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0];

    return {
      preferredHour: preferredHour ? parseInt(preferredHour) : null,
      preferredDayOfWeek: preferredDay ? parseInt(preferredDay) : null,
      hourDistribution: hourCounts,
      dayOfWeekDistribution: dayOfWeekCounts,
    };
  }

  // 计算价值评估
  private calculateValueAssessment(member: Member, consumptions: Consumption[]): any {
    const totalSpent = Number(member.totalSpent);
    const visitCount = member.visitCount;
    const avgSpentPerVisit = visitCount > 0 ? totalSpent / visitCount : 0;

    // RFM模型评估
    const lastVisit = member.lastVisitAt ? new Date(member.lastVisitAt) : null;
    const daysSinceLastVisit = lastVisit 
      ? (Date.now() - lastVisit.getTime()) / (1000 * 60 * 60 * 24) 
      : 999;

    // 简单的价值等级
    let valueLevel = 'low';
    if (totalSpent >= 10000 && visitCount >= 20) valueLevel = 'high';
    else if (totalSpent >= 5000 && visitCount >= 10) valueLevel = 'medium';

    // 流失风险
    let churnRisk = 'low';
    if (daysSinceLastVisit > 90) churnRisk = 'high';
    else if (daysSinceLastVisit > 60) churnRisk = 'medium';

    return {
      totalSpent,
      visitCount,
      avgSpentPerVisit,
      valueLevel,
      churnRisk,
      daysSinceLastVisit: Math.round(daysSinceLastVisit),
    };
  }

  // 计算月度趋势
  private calculateMonthlyTrend(consumptions: Consumption[]): any[] {
    const monthlyData: Record<string, { count: number; amount: number }> = {};

    consumptions.forEach(c => {
      const date = new Date(c.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { count: 0, amount: 0 };
      }
      monthlyData[monthKey].count++;
      monthlyData[monthKey].amount += Number(c.actualAmount);
    });

    return Object.entries(monthlyData)
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }

  // 计算服务偏好
  private calculateServicePreference(consumptions: Consumption[]): any[] {
    const serviceStats: Record<string, { count: number; amount: number; name: string }> = {};

    consumptions.forEach(c => {
      if (c.items) {
        c.items.forEach(item => {
          if (!serviceStats[item.serviceId]) {
            serviceStats[item.serviceId] = { count: 0, amount: 0, name: item.serviceName };
          }
          serviceStats[item.serviceId].count += item.quantity;
          serviceStats[item.serviceId].amount += item.amount;
        });
      }
    });

    const total = Object.values(serviceStats).reduce((sum, s) => sum + s.count, 0);

    return Object.entries(serviceStats)
      .map(([id, stats]) => ({
        id,
        ...stats,
        percentage: total > 0 ? (stats.count / total) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }

  // 计算支付方式分析
  private calculatePaymentMethodAnalysis(consumptions: Consumption[]): any[] {
    const paymentStats: Record<string, { count: number; amount: number }> = {};

    consumptions.forEach(c => {
      if (!paymentStats[c.paymentMethod]) {
        paymentStats[c.paymentMethod] = { count: 0, amount: 0 };
      }
      paymentStats[c.paymentMethod].count++;
      paymentStats[c.paymentMethod].amount += Number(c.actualAmount);
    });

    const total = consumptions.length;

    return Object.entries(paymentStats)
      .map(([method, stats]) => ({
        method,
        ...stats,
        percentage: total > 0 ? (stats.count / total) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }

  // 计算金额分布
  private calculateAmountDistribution(consumptions: Consumption[]): any {
    const ranges = [
      { min: 0, max: 100, label: '0-100' },
      { min: 100, max: 300, label: '100-300' },
      { min: 300, max: 500, label: '300-500' },
      { min: 500, max: 1000, label: '500-1000' },
      { min: 1000, max: Infinity, label: '1000+' },
    ];

    const distribution = ranges.map(range => ({
      ...range,
      count: consumptions.filter(c => {
        const amount = Number(c.actualAmount);
        return amount >= range.min && amount < range.max;
      }).length,
    }));

    return distribution;
  }

  // 计算员工偏好
  private calculateEmployeePreference(consumptions: Consumption[]): any[] {
    const employeeStats: Record<string, { count: number; amount: number; name: string }> = {};

    consumptions.forEach(c => {
      if (c.employeeId && c.employee) {
        if (!employeeStats[c.employeeId]) {
          employeeStats[c.employeeId] = { count: 0, amount: 0, name: '' };
        }
        employeeStats[c.employeeId].count++;
        employeeStats[c.employeeId].amount += Number(c.actualAmount);
        if (c.employee && (c.employee as any).name) {
          employeeStats[c.employeeId].name = (c.employee as any).name;
        }
      }
    });

    return Object.entries(employeeStats)
      .map(([id, stats]) => ({ id, ...stats }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  // 获取推荐统计
  private async getReferralStats(memberId: string): Promise<any> {
    const referrals = await this.referralRepository.find({
      where: { referrerId: memberId },
    });

    return {
      total: referrals.length,
      confirmed: referrals.filter(r => r.status === 'confirmed' || r.status === 'rewarded').length,
      totalReward: referrals.reduce((sum, r) => sum + Number(r.rewardAmount) + r.rewardPoints, 0),
    };
  }
}
