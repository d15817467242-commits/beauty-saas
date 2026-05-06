import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MeituanConfig, DouyinConfig, WechatConfig, ThirdPartyCoupon } from '../entities/integration-config.entity';

@Injectable()
export class IntegrationService {
  constructor(
    @InjectRepository(MeituanConfig)
    private meituanConfigRepository: Repository<MeituanConfig>,
    @InjectRepository(DouyinConfig)
    private douyinConfigRepository: Repository<DouyinConfig>,
    @InjectRepository(WechatConfig)
    private wechatConfigRepository: Repository<WechatConfig>,
    @InjectRepository(ThirdPartyCoupon)
    private couponRepository: Repository<ThirdPartyCoupon>,
  ) {}

  // ========== 美团配置 ==========

  async getMeituanConfig(storeId?: string): Promise<MeituanConfig | null> {
    if (!storeId) return null;
    return this.meituanConfigRepository.findOne({ where: { storeId } });
  }

  async saveMeituanConfig(data: Partial<MeituanConfig>): Promise<MeituanConfig> {
    let config = data.storeId ? await this.getMeituanConfig(data.storeId) : null;
    if (config) {
      Object.assign(config, data);
    } else {
      config = this.meituanConfigRepository.create(data);
    }
    return this.meituanConfigRepository.save(config);
  }

  async deleteMeituanConfig(storeId: string): Promise<void> {
    const config = await this.getMeituanConfig(storeId);
    if (config) {
      await this.meituanConfigRepository.remove(config);
    }
  }

  // ========== 抖音配置 ==========

  async getDouyinConfig(storeId?: string): Promise<DouyinConfig | null> {
    if (!storeId) return null;
    return this.douyinConfigRepository.findOne({ where: { storeId } });
  }

  async saveDouyinConfig(data: Partial<DouyinConfig>): Promise<DouyinConfig> {
    let config = data.storeId ? await this.getDouyinConfig(data.storeId) : null;
    if (config) {
      Object.assign(config, data);
    } else {
      config = this.douyinConfigRepository.create(data);
    }
    return this.douyinConfigRepository.save(config);
  }

  async deleteDouyinConfig(storeId: string): Promise<void> {
    const config = await this.getDouyinConfig(storeId);
    if (config) {
      await this.douyinConfigRepository.remove(config);
    }
  }

  // ========== 微信配置 ==========

  async getWechatConfig(storeId?: string): Promise<WechatConfig | null> {
    if (!storeId) return null;
    return this.wechatConfigRepository.findOne({ where: { storeId } });
  }

  async saveWechatConfig(data: Partial<WechatConfig>): Promise<WechatConfig> {
    let config = await this.getWechatConfig(data.storeId);
    if (config) {
      Object.assign(config, data);
    } else {
      config = this.wechatConfigRepository.create(data);
    }
    return this.wechatConfigRepository.save(config);
  }

  async deleteWechatConfig(storeId: string): Promise<void> {
    const config = await this.getWechatConfig(storeId);
    if (config) {
      await this.wechatConfigRepository.remove(config);
    }
  }

  // ========== 券码核销 ==========

  // 查询券码
  async queryCoupon(code: string): Promise<ThirdPartyCoupon> {
    const coupon = await this.couponRepository.findOne({ 
      where: { couponCode: code } 
    });
    
    if (!coupon) {
      throw new NotFoundException('券码不存在');
    }
    
    return coupon;
  }

  // 核销券码
  async verifyCoupon(data: {
    code: string;
    memberId?: string;
    phone?: string;
    amount?: number;
    remark?: string;
  }, userId?: string): Promise<ThirdPartyCoupon> {
    const coupon = await this.queryCoupon(data.code);
    
    if (coupon.status !== 'pending') {
      throw new BadRequestException(`券码已${this.getStatusText(coupon.status)}`);
    }
    
    if (coupon.expireAt && new Date() > coupon.expireAt) {
      coupon.status = 'expired';
      await this.couponRepository.save(coupon);
      throw new BadRequestException('券码已过期');
    }
    
    // TODO: 调用第三方API进行核销
    
    coupon.status = 'verified';
    coupon.verifiedAt = new Date();
    coupon.verifiedBy = userId;
    coupon.verifiedAmount = data.amount || coupon.faceValue;
    coupon.memberId = data.memberId;
    coupon.phone = data.phone;
    if (data.remark) {
      coupon.remark = data.remark;
    }
    
    return this.couponRepository.save(coupon);
  }

  // 退款券码
  async refundCoupon(code: string, reason?: string): Promise<ThirdPartyCoupon> {
    const coupon = await this.queryCoupon(code);
    
    if (coupon.status !== 'verified') {
      throw new BadRequestException('只能退款已核销的券码');
    }
    
    // TODO: 调用第三方API进行退款
    
    coupon.status = 'refunded';
    coupon.remark = `${coupon.remark || ''} [退款原因: ${reason || '用户申请退款'}]`;
    
    return this.couponRepository.save(coupon);
  }

  // 券码列表
  async getCoupons(query: {
    platform?: 'meituan' | 'douyin';
    status?: 'pending' | 'verified' | 'refunded' | 'expired';
    keyword?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{ data: ThirdPartyCoupon[]; total: number }> {
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;
    const skip = (page - 1) * pageSize;

    const queryBuilder = this.couponRepository.createQueryBuilder('coupon');

    if (query.platform) {
      queryBuilder.andWhere('coupon.platform = :platform', { platform: query.platform });
    }
    if (query.status) {
      queryBuilder.andWhere('coupon.status = :status', { status: query.status });
    }
    if (query.keyword) {
      queryBuilder.andWhere(
        '(coupon.couponCode LIKE :keyword OR coupon.couponName LIKE :keyword OR coupon.phone LIKE :keyword)',
        { keyword: `%${query.keyword}%` }
      );
    }
    if (query.startDate) {
      queryBuilder.andWhere('coupon.createdAt >= :startDate', { startDate: query.startDate });
    }
    if (query.endDate) {
      queryBuilder.andWhere('coupon.createdAt <= :endDate', { endDate: query.endDate });
    }

    queryBuilder
      .orderBy('coupon.createdAt', 'DESC')
      .skip(skip)
      .take(pageSize);

    const [data, total] = await queryBuilder.getManyAndCount();
    return { data, total };
  }

  // 同步券码（从第三方平台）
  async syncCoupons(platform: 'meituan' | 'douyin', storeId: string): Promise<{ count: number }> {
    // TODO: 调用第三方API同步券码
    // 这里模拟同步一些券码
    
    const mockCoupons = [
      {
        platform,
        couponCode: `${platform.toUpperCase()}${Date.now()}1`,
        couponName: '洗剪吹套餐',
        faceValue: 68,
        sellPrice: 39.9,
        expireAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      {
        platform,
        couponCode: `${platform.toUpperCase()}${Date.now()}2`,
        couponName: '烫染套餐',
        faceValue: 298,
        sellPrice: 168,
        expireAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    ];

    for (const couponData of mockCoupons) {
      const coupon = this.couponRepository.create(couponData);
      await this.couponRepository.save(coupon);
    }

    return { count: mockCoupons.length };
  }

  // ========== 统计 ==========

  async getCouponStatistics(query: {
    platform?: 'meituan' | 'douyin';
    startDate?: string;
    endDate?: string;
  }): Promise<{
    total: number;
    pending: number;
    verified: number;
    refunded: number;
    expired: number;
    totalAmount: number;
    verifiedAmount: number;
  }> {
    const queryBuilder = this.couponRepository.createQueryBuilder('coupon');

    if (query.platform) {
      queryBuilder.andWhere('coupon.platform = :platform', { platform: query.platform });
    }
    if (query.startDate) {
      queryBuilder.andWhere('coupon.createdAt >= :startDate', { startDate: query.startDate });
    }
    if (query.endDate) {
      queryBuilder.andWhere('coupon.createdAt <= :endDate', { endDate: query.endDate });
    }

    const coupons = await queryBuilder.getMany();

    let total = 0;
    let pending = 0;
    let verified = 0;
    let refunded = 0;
    let expired = 0;
    let totalAmount = 0;
    let verifiedAmount = 0;

    for (const coupon of coupons) {
      total++;
      totalAmount += Number(coupon.faceValue);

      switch (coupon.status) {
        case 'pending':
          pending++;
          break;
        case 'verified':
          verified++;
          verifiedAmount += Number(coupon.verifiedAmount || coupon.faceValue);
          break;
        case 'refunded':
          refunded++;
          break;
        case 'expired':
          expired++;
          break;
      }
    }

    return {
      total,
      pending,
      verified,
      refunded,
      expired,
      totalAmount,
      verifiedAmount,
    };
  }

  private getStatusText(status: string): string {
    const map: Record<string, string> = {
      pending: '待核销',
      verified: '已核销',
      refunded: '已退款',
      expired: '已过期',
    };
    return map[status] || status;
  }
}
