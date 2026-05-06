import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThan, LessThan } from 'typeorm';
import { Coupon, MemberCoupon, CouponStatus, CouponType } from './coupon.entity';
import { CreateCouponDto, UpdateCouponDto, ReceiveCouponDto, UseCouponDto } from './dto/coupon.dto';

@Injectable()
export class CouponService {
  constructor(
    @InjectRepository(Coupon)
    private couponRepository: Repository<Coupon>,
    @InjectRepository(MemberCoupon)
    private memberCouponRepository: Repository<MemberCoupon>,
  ) {}

  // 创建优惠券
  async create(dto: CreateCouponDto, userId: string): Promise<Coupon> {
    const coupon = this.couponRepository.create({
      ...dto,
      startTime: new Date(dto.startTime),
      endTime: new Date(dto.endTime),
      createdBy: userId,
    });
    return this.couponRepository.save(coupon);
  }

  // 获取优惠券列表
  async findAll(): Promise<Coupon[]> {
    return this.couponRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  // 获取进行中的优惠券
  async findActive(): Promise<Coupon[]> {
    const now = new Date();
    return this.couponRepository.find({
      where: {
        status: CouponStatus.ACTIVE,
        startTime: LessThan(now),
        endTime: MoreThan(now),
      },
      order: { createdAt: 'DESC' },
    });
  }

  // 获取单个优惠券
  async findOne(id: string): Promise<Coupon> {
    const coupon = await this.couponRepository.findOne({ where: { id } });
    if (!coupon) {
      throw new NotFoundException('优惠券不存在');
    }
    return coupon;
  }

  // 更新优惠券
  async update(id: string, dto: UpdateCouponDto): Promise<Coupon> {
    const coupon = await this.findOne(id);
    Object.assign(coupon, dto);
    return this.couponRepository.save(coupon);
  }

  // 删除优惠券
  async remove(id: string): Promise<void> {
    const coupon = await this.findOne(id);
    await this.couponRepository.remove(coupon);
  }

  // 会员领取优惠券
  async receive(dto: ReceiveCouponDto, memberId: string): Promise<MemberCoupon> {
    const coupon = await this.findOne(dto.couponId);
    
    // 检查优惠券状态
    if (coupon.status !== CouponStatus.ACTIVE) {
      throw new BadRequestException('优惠券不可领取');
    }
    
    const now = new Date();
    if (now < coupon.startTime || now > coupon.endTime) {
      throw new BadRequestException('优惠券不在领取时间范围内');
    }
    
    // 检查库存
    if (coupon.totalCount > 0 && coupon.usedCount >= coupon.totalCount) {
      throw new BadRequestException('优惠券已领完');
    }
    
    // 检查每人限领
    const receivedCount = await this.memberCouponRepository.count({
      where: { memberId, couponId: dto.couponId },
    });
    if (receivedCount >= coupon.perLimit) {
      throw new BadRequestException('已达到领取上限');
    }
    
    const memberCoupon = this.memberCouponRepository.create({
      memberId,
      couponId: dto.couponId,
      receiveTime: now,
      expireTime: coupon.endTime,
      used: false,
    });
    
    // 增加已领取数量
    coupon.usedCount += 1;
    await this.couponRepository.save(coupon);
    
    return this.memberCouponRepository.save(memberCoupon);
  }

  // 获取会员优惠券列表
  async findMemberCoupons(memberId: string, used?: boolean): Promise<MemberCoupon[]> {
    const where: any = { memberId };
    if (used !== undefined) {
      where.used = used;
    }
    return this.memberCouponRepository.find({
      where,
      relations: ['coupon'],
      order: { createdAt: 'DESC' },
    });
  }

  // 使用优惠券
  async use(dto: UseCouponDto, memberId: string): Promise<MemberCoupon> {
    const memberCoupon = await this.memberCouponRepository.findOne({
      where: { id: dto.memberCouponId, memberId },
      relations: ['coupon'],
    });
    
    if (!memberCoupon) {
      throw new NotFoundException('优惠券不存在');
    }
    
    if (memberCoupon.used) {
      throw new BadRequestException('优惠券已使用');
    }
    
    const now = new Date();
    if (now > memberCoupon.expireTime) {
      throw new BadRequestException('优惠券已过期');
    }
    
    memberCoupon.used = true;
    memberCoupon.useTime = now;
    memberCoupon.orderId = dto.orderId;
    
    return this.memberCouponRepository.save(memberCoupon);
  }

  // 计算优惠金额
  calculateDiscount(coupon: Coupon, amount: number): number {
    if (amount < coupon.minAmount) {
      return 0;
    }
    
    let discount = 0;
    switch (coupon.type) {
      case CouponType.CASH:
        discount = coupon.discount;
        break;
      case CouponType.DISCOUNT:
        discount = amount * (1 - coupon.discount / 10);
        break;
      case CouponType.GIFT:
      case CouponType.SERVICE:
        discount = amount;
        break;
    }
    
    if (coupon.maxDiscount && discount > coupon.maxDiscount) {
      discount = coupon.maxDiscount;
    }
    
    return Math.min(discount, amount);
  }
}
