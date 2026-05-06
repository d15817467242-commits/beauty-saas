import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, DataSource } from 'typeorm';
import { MarketingCampaign, CampaignStatus } from './marketing-campaign.entity';
import { Coupon, MemberCoupon, CouponStatus } from './coupon.entity';
import { CouponUsage, CouponStatistics } from './coupon-usage.entity';
import { PointsMallGoods, PointsExchange } from './points-mall.entity';
import { MemberTask, MemberTaskRecord, TaskRecordStatus } from './member-task.entity';

export interface EffectAnalysisResult {
  overview: {
    totalCampaigns: number;
    activeCampaigns: number;
    totalCouponsIssued: number;
    totalCouponsUsed: number;
    totalPointsExchanged: number;
    totalTasksCompleted: number;
    totalRevenue: number;
    totalDiscount: number;
    overallROI: number;
  };
  campaignAnalysis: any[];
  couponAnalysis: any[];
  pointsAnalysis: any[];
  taskAnalysis: any[];
  trendData: any[];
}

@Injectable()
export class MarketingAnalysisService {
  constructor(
    @InjectRepository(MarketingCampaign)
    private campaignRepository: Repository<MarketingCampaign>,
    @InjectRepository(Coupon)
    private couponRepository: Repository<Coupon>,
    @InjectRepository(MemberCoupon)
    private memberCouponRepository: Repository<MemberCoupon>,
    @InjectRepository(CouponUsage)
    private couponUsageRepository: Repository<CouponUsage>,
    @InjectRepository(PointsMallGoods)
    private pointsGoodsRepository: Repository<PointsMallGoods>,
    @InjectRepository(PointsExchange)
    private pointsExchangeRepository: Repository<PointsExchange>,
    @InjectRepository(MemberTask)
    private taskRepository: Repository<MemberTask>,
    @InjectRepository(MemberTaskRecord)
    private taskRecordRepository: Repository<MemberTaskRecord>,
    private dataSource: DataSource,
  ) {}

  // 获取营销效果总览
  async getEffectAnalysis(startDate?: string, endDate?: string): Promise<EffectAnalysisResult> {
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    // 获取概览数据
    const overview = await this.getOverviewStats(start, end);

    // 获取活动分析
    const campaignAnalysis = await this.getCampaignAnalysis(start, end);

    // 获取优惠券分析
    const couponAnalysis = await this.getCouponAnalysis(start, end);

    // 获取积分商城分析
    const pointsAnalysis = await this.getPointsAnalysis(start, end);

    // 获取任务分析
    const taskAnalysis = await this.getTaskAnalysis(start, end);

    // 获取趋势数据
    const trendData = await this.getTrendData(start, end);

    return {
      overview,
      campaignAnalysis,
      couponAnalysis,
      pointsAnalysis,
      taskAnalysis,
      trendData,
    };
  }

  // 概览统计
  private async getOverviewStats(start: Date, end: Date): Promise<any> {
    // 活动统计
    const totalCampaigns = await this.campaignRepository.count();
    const activeCampaigns = await this.campaignRepository.count({
      where: { status: CampaignStatus.ACTIVE },
    });

    // 优惠券统计
    const totalCouponsIssued = await this.memberCouponRepository.count({
      where: { receiveTime: Between(start, end) },
    });

    const couponUsages = await this.couponUsageRepository
      .createQueryBuilder('u')
      .select('SUM(u.discountAmount)', 'totalDiscount')
      .addSelect('SUM(u.orderAmount)', 'totalRevenue')
      .addSelect('COUNT(*)', 'useCount')
      .where('u.usageTime BETWEEN :start AND :end', { start, end })
      .getRawOne();

    // 积分兑换统计
    const pointsExchanges = await this.pointsExchangeRepository
      .createQueryBuilder('e')
      .select('SUM(e.pointsUsed)', 'totalPoints')
      .addSelect('COUNT(*)', 'exchangeCount')
      .where('e.exchangeTime BETWEEN :start AND :end', { start, end })
      .getRawOne();

    // 任务完成统计
    const taskRecords = await this.taskRecordRepository.count({
      where: {
        completeTime: Between(start, end),
        status: TaskRecordStatus.COMPLETED,
      },
    });

    // 计算ROI
    const totalRevenue = Number(couponUsages?.totalRevenue || 0);
    const totalDiscount = Number(couponUsages?.totalDiscount || 0);
    const overallROI = totalDiscount > 0 ? ((totalRevenue - totalDiscount) / totalDiscount * 100).toFixed(2) : 0;

    return {
      totalCampaigns,
      activeCampaigns,
      totalCouponsIssued,
      totalCouponsUsed: Number(couponUsages?.useCount || 0),
      totalPointsExchanged: Number(pointsExchanges?.totalPoints || 0),
      totalTasksCompleted: taskRecords,
      totalRevenue,
      totalDiscount,
      overallROI,
    };
  }

  // 活动分析
  private async getCampaignAnalysis(start: Date, end: Date): Promise<any[]> {
    const campaigns = await this.campaignRepository
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.campaignRules', 'rules')
      .where('c.createdAt BETWEEN :start AND :end', { start, end })
      .getMany();

    return campaigns.map(campaign => ({
      id: campaign.id,
      name: campaign.name,
      type: campaign.type,
      status: campaign.status,
      totalParticipants: campaign.totalParticipants,
      totalOrders: campaign.totalOrders,
      totalAmount: Number(campaign.totalAmount),
      totalDiscount: Number(campaign.totalDiscount),
      budgetAmount: Number(campaign.budgetAmount),
      usedBudget: Number(campaign.usedBudget),
      roi: campaign.usedBudget > 0
        ? ((Number(campaign.totalAmount) - Number(campaign.usedBudget)) / Number(campaign.usedBudget) * 100).toFixed(2)
        : 0,
      conversionRate: campaign.totalParticipants > 0
        ? (campaign.totalOrders / campaign.totalParticipants * 100).toFixed(2)
        : 0,
    }));
  }

  // 优惠券分析
  private async getCouponAnalysis(start: Date, end: Date): Promise<any[]> {
    const coupons = await this.couponRepository.find();

    const result = await Promise.all(
      coupons.map(async (coupon) => {
        // 领取统计
        const issued = await this.memberCouponRepository.count({
          where: {
            couponId: coupon.id,
            receiveTime: Between(start, end),
          },
        });

        // 使用统计
        const usageStats = await this.couponUsageRepository
          .createQueryBuilder('u')
          .select('COUNT(*)', 'used')
          .addSelect('SUM(u.discountAmount)', 'totalDiscount')
          .addSelect('SUM(u.orderAmount)', 'totalRevenue')
          .where('u.couponId = :couponId', { couponId: coupon.id })
          .andWhere('u.usageTime BETWEEN :start AND :end', { start, end })
          .getRawOne();

        const used = Number(usageStats?.used || 0);
        const totalDiscount = Number(usageStats?.totalDiscount || 0);
        const totalRevenue = Number(usageStats?.totalRevenue || 0);

        return {
          id: coupon.id,
          name: coupon.name,
          type: coupon.type,
          status: coupon.status,
          issued,
          used,
          useRate: issued > 0 ? (used / issued * 100).toFixed(2) : 0,
          totalDiscount,
          totalRevenue,
          avgOrderAmount: used > 0 ? (totalRevenue / used).toFixed(2) : 0,
        };
      })
    );

    return result;
  }

  // 积分商城分析
  private async getPointsAnalysis(start: Date, end: Date): Promise<any[]> {
    const goods = await this.pointsGoodsRepository.find();

    const result = await Promise.all(
      goods.map(async (item) => {
        const exchangeStats = await this.pointsExchangeRepository
          .createQueryBuilder('e')
          .select('COUNT(*)', 'count')
          .addSelect('SUM(e.pointsUsed)', 'totalPoints')
          .addSelect('SUM(e.cashPaid)', 'totalCash')
          .addSelect('SUM(e.quantity)', 'totalQuantity')
          .where('e.goodsId = :goodsId', { goodsId: item.id })
          .andWhere('e.exchangeTime BETWEEN :start AND :end', { start, end })
          .getRawOne();

        return {
          id: item.id,
          name: item.name,
          type: item.type,
          pointsRequired: item.pointsRequired,
          stockCount: item.stockCount,
          soldCount: item.soldCount,
          exchangeCount: Number(exchangeStats?.count || 0),
          totalPoints: Number(exchangeStats?.totalPoints || 0),
          totalCash: Number(exchangeStats?.totalCash || 0),
          totalQuantity: Number(exchangeStats?.totalQuantity || 0),
        };
      })
    );

    return result;
  }

  // 任务分析
  private async getTaskAnalysis(start: Date, end: Date): Promise<any[]> {
    const tasks = await this.taskRepository.find();

    const result = await Promise.all(
      tasks.map(async (task) => {
        const recordStats = await this.taskRecordRepository
          .createQueryBuilder('r')
          .select('COUNT(*)', 'total')
          .addSelect('SUM(CASE WHEN r.status = :completed THEN 1 ELSE 0 END)', 'completed')
          .addSelect('SUM(CASE WHEN r.status = :claimed THEN 1 ELSE 0 END)', 'claimed')
          .where('r.taskId = :taskId', { taskId: task.id })
          .andWhere('r.startTime BETWEEN :start AND :end', { start, end })
          .setParameters({
            completed: TaskRecordStatus.COMPLETED,
            claimed: TaskRecordStatus.CLAIMED,
          })
          .getRawOne();

        const total = Number(recordStats?.total || 0);
        const completed = Number(recordStats?.completed || 0) + Number(recordStats?.claimed || 0);

        return {
          id: task.id,
          name: task.name,
          type: task.type,
          action: task.action,
          status: task.status,
          participateCount: total,
          completeCount: completed,
          completionRate: total > 0 ? (completed / total * 100).toFixed(2) : 0,
        };
      })
    );

    return result;
  }

  // 趋势数据
  private async getTrendData(start: Date, end: Date): Promise<any[]> {
    const days: Date[] = [];
    const current = new Date(start);
    while (current <= end) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    const trendData = await Promise.all(
      days.map(async (day) => {
        const dayStart = new Date(day);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(day);
        dayEnd.setHours(23, 59, 59, 999);

        // 优惠券使用
        const couponUsage = await this.couponUsageRepository
          .createQueryBuilder('u')
          .select('COUNT(*)', 'count')
          .addSelect('SUM(u.discountAmount)', 'discount')
          .addSelect('SUM(u.orderAmount)', 'revenue')
          .where('u.usageTime BETWEEN :start AND :end', { start: dayStart, end: dayEnd })
          .getRawOne();

        // 积分兑换
        const pointsExchange = await this.pointsExchangeRepository
          .createQueryBuilder('e')
          .select('COUNT(*)', 'count')
          .addSelect('SUM(e.pointsUsed)', 'points')
          .where('e.exchangeTime BETWEEN :start AND :end', { start: dayStart, end: dayEnd })
          .getRawOne();

        // 任务完成
        const taskComplete = await this.taskRecordRepository.count({
          where: {
            completeTime: Between(dayStart, dayEnd),
            status: TaskRecordStatus.COMPLETED,
          },
        });

        return {
          date: day.toISOString().split('T')[0],
          couponUsed: Number(couponUsage?.count || 0),
          couponDiscount: Number(couponUsage?.discount || 0),
          revenue: Number(couponUsage?.revenue || 0),
          pointsExchanged: Number(pointsExchange?.count || 0),
          pointsUsed: Number(pointsExchange?.points || 0),
          tasksCompleted: taskComplete,
        };
      })
    );

    return trendData;
  }

  // 活动ROI计算
  async calculateCampaignROI(campaignId: string): Promise<any> {
    const campaign = await this.campaignRepository.findOne({
      where: { id: campaignId },
    });

    if (!campaign) {
      return null;
    }

    const totalRevenue = Number(campaign.totalAmount);
    const totalCost = Number(campaign.usedBudget) + Number(campaign.totalDiscount);
    const netProfit = totalRevenue - totalCost;

    return {
      campaignId: campaign.id,
      campaignName: campaign.name,
      totalRevenue,
      totalCost,
      netProfit,
      roi: totalCost > 0 ? (netProfit / totalCost * 100).toFixed(2) : 0,
      roas: totalCost > 0 ? (totalRevenue / totalCost).toFixed(2) : 0,
    };
  }

  // 转化率统计
  async getConversionStats(startDate?: string, endDate?: string): Promise<any> {
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    // 优惠券转化率
    const couponStats = await this.memberCouponRepository
      .createQueryBuilder('mc')
      .select('COUNT(*)', 'total')
      .addSelect('SUM(CASE WHEN mc.used = true THEN 1 ELSE 0 END)', 'used')
      .where('mc.receiveTime BETWEEN :start AND :end', { start, end })
      .getRawOne();

    // 活动转化率
    const campaignStats = await this.campaignRepository
      .createQueryBuilder('c')
      .select('SUM(c.totalParticipants)', 'participants')
      .addSelect('SUM(c.totalOrders)', 'orders')
      .where('c.startTime BETWEEN :start AND :end', { start, end })
      .getRawOne();

    // 任务转化率
    const taskStats = await this.taskRecordRepository
      .createQueryBuilder('r')
      .select('COUNT(*)', 'total')
      .addSelect('SUM(CASE WHEN r.status IN (:...statuses) THEN 1 ELSE 0 END)', 'completed')
      .where('r.startTime BETWEEN :start AND :end', { start, end })
      .setParameters({
        statuses: [TaskRecordStatus.COMPLETED, TaskRecordStatus.CLAIMED],
      })
      .getRawOne();

    return {
      coupon: {
        issued: Number(couponStats?.total || 0),
        used: Number(couponStats?.used || 0),
        conversionRate: Number(couponStats?.total) > 0
          ? (Number(couponStats?.used) / Number(couponStats?.total) * 100).toFixed(2)
          : 0,
      },
      campaign: {
        participants: Number(campaignStats?.participants || 0),
        orders: Number(campaignStats?.orders || 0),
        conversionRate: Number(campaignStats?.participants) > 0
          ? (Number(campaignStats?.orders) / Number(campaignStats?.participants) * 100).toFixed(2)
          : 0,
      },
      task: {
        started: Number(taskStats?.total || 0),
        completed: Number(taskStats?.completed || 0),
        conversionRate: Number(taskStats?.total) > 0
          ? (Number(taskStats?.completed) / Number(taskStats?.total) * 100).toFixed(2)
          : 0,
      },
    };
  }
}
