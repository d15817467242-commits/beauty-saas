import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, DataSource } from 'typeorm';
import { Coupon, MemberCoupon, CouponStatus } from './coupon.entity';
import { CouponUsage, CouponStatistics, UsageType } from './coupon-usage.entity';
import {
  VerifyCouponDto,
  RefundCouponDto,
  CouponStatisticsQueryDto,
  CouponUsageQueryDto,
} from './dto/coupon-usage.dto';

@Injectable()
export class CouponUsageService {
  constructor(
    @InjectRepository(Coupon)
    private couponRepository: Repository<Coupon>,
    @InjectRepository(MemberCoupon)
    private memberCouponRepository: Repository<MemberCoupon>,
    @InjectRepository(CouponUsage)
    private usageRepository: Repository<CouponUsage>,
    @InjectRepository(CouponStatistics)
    private statisticsRepository: Repository<CouponStatistics>,
    private dataSource: DataSource,
  ) {}

  // ==================== 优惠券核销 ====================

  async verify(dto: VerifyCouponDto, staffId?: string): Promise<CouponUsage> {
    const memberCoupon = await this.memberCouponRepository.findOne({
      where: { id: dto.memberCouponId },
      relations: ['coupon'],
    });

    if (!memberCoupon) {
      throw new NotFoundException('会员优惠券不存在');
    }

    if (memberCoupon.used) {
      throw new BadRequestException('优惠券已使用');
    }

    const now = new Date();
    if (now > memberCoupon.expireTime) {
      throw new BadRequestException('优惠券已过期');
    }

    // 计算优惠金额
    const discountAmount = this.calculateDiscount(memberCoupon.coupon, dto.orderAmount);

    // 开启事务
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 更新会员优惠券状态
      memberCoupon.used = true;
      memberCoupon.useTime = now;
      memberCoupon.orderId = dto.orderId;
      await queryRunner.manager.save(memberCoupon);

      // 创建使用记录
      const usage = queryRunner.manager.create(CouponUsage, {
        couponId: memberCoupon.couponId,
        memberCouponId: memberCoupon.id,
        memberId: memberCoupon.memberId,
        orderId: dto.orderId,
        type: UsageType.USE,
        discountAmount,
        orderAmount: dto.orderAmount,
        usageTime: now,
        storeId: dto.storeId,
        staffId: staffId || dto.staffId,
        remark: dto.remark,
      });
      await queryRunner.manager.save(usage);

      // 更新优惠券统计
      await this.updateDailyStatistics(
        memberCoupon.couponId,
        now,
        {
          useCount: 1,
          totalDiscount: discountAmount,
          totalOrderAmount: dto.orderAmount,
        },
        queryRunner.manager,
      );

      await queryRunner.commitTransaction();
      return usage;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // 优惠券退款返还
  async refund(dto: RefundCouponDto): Promise<CouponUsage> {
    const memberCoupon = await this.memberCouponRepository.findOne({
      where: { id: dto.memberCouponId },
      relations: ['coupon'],
    });

    if (!memberCoupon) {
      throw new NotFoundException('会员优惠券不存在');
    }

    if (!memberCoupon.used) {
      throw new BadRequestException('优惠券未使用，无需返还');
    }

    // 查找原使用记录
    const originalUsage = await this.usageRepository.findOne({
      where: { memberCouponId: memberCoupon.id, type: UsageType.USE },
      order: { usageTime: 'DESC' },
    });

    const now = new Date();

    // 开启事务
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 恢复会员优惠券状态
      memberCoupon.used = false;
      // @ts-ignore - useTime can be null when refunding
      memberCoupon.useTime = null;
      // @ts-ignore - orderId can be null when refunding
      memberCoupon.orderId = null;
      await queryRunner.manager.save(memberCoupon);

      // 创建返还记录
      const usage = queryRunner.manager.create(CouponUsage, {
        couponId: memberCoupon.couponId,
        memberCouponId: memberCoupon.id,
        memberId: memberCoupon.memberId,
        orderId: dto.orderId,
        type: UsageType.REFUND,
        discountAmount: originalUsage?.discountAmount || 0,
        orderAmount: originalUsage?.orderAmount || 0,
        usageTime: now,
        remark: dto.remark || '订单退款返还',
      });
      await queryRunner.manager.save(usage);

      // 更新优惠券统计
      await this.updateDailyStatistics(
        memberCoupon.couponId,
        now,
        {
          refundCount: 1,
        },
        queryRunner.manager,
      );

      await queryRunner.commitTransaction();
      return usage;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // 计算优惠金额
  private calculateDiscount(coupon: Coupon, amount: number): number {
    if (amount < coupon.minAmount) {
      return 0;
    }

    let discount = 0;
    switch (coupon.type) {
      case 'cash':
        discount = Number(coupon.discount);
        break;
      case 'discount':
        discount = amount * (1 - Number(coupon.discount) / 10);
        break;
      case 'gift':
      case 'service':
        discount = amount;
        break;
    }

    if (coupon.maxDiscount && discount > Number(coupon.maxDiscount)) {
      discount = Number(coupon.maxDiscount);
    }

    return Math.min(discount, amount);
  }

  // ==================== 使用记录查询 ====================

  async getUsageList(dto: CouponUsageQueryDto): Promise<{ list: CouponUsage[]; total: number }> {
    const queryBuilder = this.usageRepository
      .createQueryBuilder('u')
      .leftJoinAndSelect('u.coupon', 'coupon')
      .leftJoinAndSelect('u.memberCoupon', 'memberCoupon');

    if (dto.couponId) {
      queryBuilder.andWhere('u.couponId = :couponId', { couponId: dto.couponId });
    }
    if (dto.memberId) {
      queryBuilder.andWhere('u.memberId = :memberId', { memberId: dto.memberId });
    }
    if (dto.type) {
      queryBuilder.andWhere('u.type = :type', { type: dto.type });
    }
    if (dto.startDate) {
      queryBuilder.andWhere('u.usageTime >= :startDate', {
        startDate: new Date(dto.startDate),
      });
    }
    if (dto.endDate) {
      queryBuilder.andWhere('u.usageTime <= :endDate', {
        endDate: new Date(dto.endDate),
      });
    }

    const page = dto.page || 1;
    const pageSize = dto.pageSize || 20;
    const skip = (page - 1) * pageSize;

    queryBuilder
      .orderBy('u.usageTime', 'DESC')
      .skip(skip)
      .take(pageSize);

    const [list, total] = await queryBuilder.getManyAndCount();
    return { list, total };
  }

  // ==================== 优惠券统计 ====================

  async getStatistics(dto: CouponStatisticsQueryDto): Promise<any> {
    const coupon = await this.couponRepository.findOne({
      where: { id: dto.couponId },
    });
    if (!coupon) {
      throw new NotFoundException('优惠券不存在');
    }

    // 获取日期范围内的统计数据
    const queryBuilder = this.statisticsRepository
      .createQueryBuilder('s')
      .where('s.couponId = :couponId', { couponId: dto.couponId });

    if (dto.startDate) {
      queryBuilder.andWhere('s.statDate >= :startDate', {
        startDate: dto.startDate,
      });
    }
    if (dto.endDate) {
      queryBuilder.andWhere('s.statDate <= :endDate', {
        endDate: dto.endDate,
      });
    }

    const stats = await queryBuilder.orderBy('s.statDate', 'ASC').getMany();

    // 汇总统计
    const summary = {
      totalReceive: stats.reduce((sum, s) => sum + s.receiveCount, 0),
      totalUse: stats.reduce((sum, s) => sum + s.useCount, 0),
      totalExpire: stats.reduce((sum, s) => sum + s.expireCount, 0),
      totalRefund: stats.reduce((sum, s) => sum + s.refundCount, 0),
      totalDiscount: stats.reduce((sum, s) => sum + Number(s.totalDiscount), 0),
      totalOrderAmount: stats.reduce((sum, s) => sum + Number(s.totalOrderAmount), 0),
      newMemberUse: stats.reduce((sum, s) => sum + s.newMemberCount, 0),
      oldMemberUse: stats.reduce((sum, s) => sum + s.oldMemberCount, 0),
    };

    // 计算转化率
    const useRate = summary.totalReceive > 0
      ? (summary.totalUse / summary.totalReceive * 100).toFixed(2)
      : 0;

    // 计算客单价提升
    const avgOrderWithCoupon = summary.totalUse > 0
      ? summary.totalOrderAmount / summary.totalUse
      : 0;

    return {
      coupon: {
        id: coupon.id,
        name: coupon.name,
        type: coupon.type,
        status: coupon.status,
        totalCount: coupon.totalCount,
        usedCount: coupon.usedCount,
      },
      summary: {
        ...summary,
        useRate,
        avgOrderWithCoupon,
      },
      dailyStats: stats,
    };
  }

  // 更新每日统计
  private async updateDailyStatistics(
    couponId: string,
    date: Date,
    data: {
      receiveCount?: number;
      useCount?: number;
      expireCount?: number;
      refundCount?: number;
      totalDiscount?: number;
      totalOrderAmount?: number;
    },
    manager?: any,
  ): Promise<void> {
    const statDate = new Date(date);
    statDate.setHours(0, 0, 0, 0);

    const repo = manager ? manager.getRepository(CouponStatistics) : this.statisticsRepository;

    let stat = await repo.findOne({
      where: { couponId, statDate },
    });

    if (!stat) {
      stat = repo.create({
        couponId,
        statDate,
        receiveCount: 0,
        useCount: 0,
        expireCount: 0,
        refundCount: 0,
        totalDiscount: 0,
        totalOrderAmount: 0,
        newMemberCount: 0,
        oldMemberCount: 0,
      });
    }

    if (data.receiveCount) stat.receiveCount += data.receiveCount;
    if (data.useCount) stat.useCount += data.useCount;
    if (data.expireCount) stat.expireCount += data.expireCount;
    if (data.refundCount) stat.refundCount += data.refundCount;
    if (data.totalDiscount) stat.totalDiscount = Number(stat.totalDiscount) + data.totalDiscount;
    if (data.totalOrderAmount) stat.totalOrderAmount = Number(stat.totalOrderAmount) + data.totalOrderAmount;

    await repo.save(stat);
  }

  // 批量过期处理
  async processExpiredCoupons(): Promise<number> {
    const now = new Date();
    const expiredCoupons = await this.memberCouponRepository
      .createQueryBuilder('mc')
      .leftJoinAndSelect('mc.coupon', 'coupon')
      .where('mc.used = :used', { used: false })
      .andWhere('mc.expireTime < :now', { now })
      .getMany();

    let count = 0;
    for (const memberCoupon of expiredCoupons) {
      const usage = this.usageRepository.create({
        couponId: memberCoupon.couponId,
        memberCouponId: memberCoupon.id,
        memberId: memberCoupon.memberId,
        type: UsageType.EXPIRE,
        usageTime: now,
        remark: '系统自动过期',
      });

      await this.usageRepository.save(usage);
      await this.updateDailyStatistics(memberCoupon.couponId, now, { expireCount: 1 });
      count++;
    }

    return count;
  }
}
