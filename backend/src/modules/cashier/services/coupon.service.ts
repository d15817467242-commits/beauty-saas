import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { CouponVerification, CouponStatus, CouponSource } from '../entities/coupon-verification.entity';
import { VerifyCouponDto, CreateCouponDto, CancelCouponDto } from '../dto/coupon.dto';

@Injectable()
export class CouponService {
  constructor(
    @InjectRepository(CouponVerification)
    private couponRepository: Repository<CouponVerification>,
  ) {}

  async create(dto: CreateCouponDto): Promise<CouponVerification> {
    // 检查券码是否已存在
    const existing = await this.couponRepository.findOne({ 
      where: { couponCode: dto.couponCode } 
    });
    if (existing) {
      throw new BadRequestException('券码已存在');
    }

    const coupon = this.couponRepository.create({
      ...dto,
      expireTime: dto.expireTime ? new Date(dto.expireTime) : undefined,
    });
    return this.couponRepository.save(coupon);
  }

  async findAll(): Promise<CouponVerification[]> {
    return this.couponRepository.find({
      relations: ['member'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<CouponVerification> {
    const coupon = await this.couponRepository.findOne({ 
      where: { id },
      relations: ['member'],
    });
    if (!coupon) {
      throw new NotFoundException('团购券不存在');
    }
    return coupon;
  }

  async findByCode(couponCode: string): Promise<CouponVerification> {
    const coupon = await this.couponRepository.findOne({ 
      where: { couponCode },
      relations: ['member'],
    });
    if (!coupon) {
      throw new NotFoundException('团购券不存在');
    }
    return coupon;
  }

  async verify(dto: VerifyCouponDto, userId: string): Promise<CouponVerification> {
    const coupon = await this.findByCode(dto.couponCode);

    // 检查状态
    if (coupon.status === CouponStatus.VERIFIED) {
      throw new BadRequestException('该券已核销');
    }
    if (coupon.status === CouponStatus.EXPIRED) {
      throw new BadRequestException('该券已过期');
    }
    if (coupon.status === CouponStatus.CANCELLED) {
      throw new BadRequestException('该券已取消');
    }

    // 检查过期时间
    if (coupon.expireTime && new Date(coupon.expireTime) < new Date()) {
      coupon.status = CouponStatus.EXPIRED;
      await this.couponRepository.save(coupon);
      throw new BadRequestException('该券已过期');
    }

    // 更新核销信息
    coupon.status = CouponStatus.VERIFIED;
    coupon.verifyTime = new Date();
    coupon.verifyBy = userId;
    if (dto.memberId) {
      coupon.memberId = dto.memberId;
    }
    if (dto.remark) {
      coupon.remark = dto.remark;
    }

    return this.couponRepository.save(coupon);
  }

  async cancel(dto: CancelCouponDto): Promise<CouponVerification> {
    const coupon = await this.findByCode(dto.couponCode);

    if (coupon.status === CouponStatus.VERIFIED) {
      throw new BadRequestException('已核销的券不能取消');
    }

    coupon.status = CouponStatus.CANCELLED;
    if (dto.remark) {
      coupon.remark = dto.remark;
    }

    return this.couponRepository.save(coupon);
  }

  async getStats(startDate?: Date, endDate?: Date): Promise<any> {
    const query = this.couponRepository.createQueryBuilder('coupon');
    
    if (startDate && endDate) {
      query.where('coupon.verifyTime BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    const coupons = await query.getMany();

    const totalValue = coupons
      .filter(c => c.status === CouponStatus.VERIFIED)
      .reduce((sum, c) => sum + Number(c.couponValue), 0);

    const totalPaid = coupons
      .filter(c => c.status === CouponStatus.VERIFIED)
      .reduce((sum, c) => sum + Number(c.paidAmount), 0);

    const bySource = {
      meituan: coupons.filter(c => c.couponSource === CouponSource.MEITUAN && c.status === CouponStatus.VERIFIED).length,
      douyin: coupons.filter(c => c.couponSource === CouponSource.DOUYIN && c.status === CouponStatus.VERIFIED).length,
      other: coupons.filter(c => c.couponSource === CouponSource.OTHER && c.status === CouponStatus.VERIFIED).length,
    };

    return {
      total: coupons.length,
      verified: coupons.filter(c => c.status === CouponStatus.VERIFIED).length,
      pending: coupons.filter(c => c.status === CouponStatus.PENDING).length,
      expired: coupons.filter(c => c.status === CouponStatus.EXPIRED).length,
      cancelled: coupons.filter(c => c.status === CouponStatus.CANCELLED).length,
      totalValue,
      totalPaid,
      bySource,
    };
  }

  async findByMember(memberId: string): Promise<CouponVerification[]> {
    return this.couponRepository.find({
      where: { memberId },
      order: { createdAt: 'DESC' },
    });
  }
}
