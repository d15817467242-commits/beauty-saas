import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { Discount, DiscountValueType, DiscountScope } from '../entities/discount.entity';
import { CreateDiscountDto, UpdateDiscountDto, ApplyDiscountDto } from '../dto/discount.dto';

@Injectable()
export class DiscountService {
  constructor(
    @InjectRepository(Discount)
    private discountRepository: Repository<Discount>,
  ) {}

  async create(dto: CreateDiscountDto): Promise<Discount> {
    const discount = this.discountRepository.create({
      ...dto,
      startTime: dto.startTime ? new Date(dto.startTime) : undefined,
      endTime: dto.endTime ? new Date(dto.endTime) : undefined,
    });
    return this.discountRepository.save(discount);
  }

  async findAll(): Promise<Discount[]> {
    return this.discountRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Discount> {
    const discount = await this.discountRepository.findOne({ where: { id } });
    if (!discount) {
      throw new NotFoundException('折扣不存在');
    }
    return discount;
  }

  async findByCode(code: string): Promise<Discount> {
    const discount = await this.discountRepository.findOne({ 
      where: { discountCode: code } 
    });
    if (!discount) {
      throw new NotFoundException('折扣码无效');
    }
    return discount;
  }

  async update(id: string, dto: UpdateDiscountDto): Promise<Discount> {
    const discount = await this.findOne(id);
    Object.assign(discount, {
      ...dto,
      startTime: dto.startTime ? new Date(dto.startTime) : discount.startTime,
      endTime: dto.endTime ? new Date(dto.endTime) : discount.endTime,
    });
    return this.discountRepository.save(discount);
  }

  async remove(id: string): Promise<void> {
    const discount = await this.findOne(id);
    await this.discountRepository.remove(discount);
  }

  async getActiveDiscounts(): Promise<Discount[]> {
    const now = new Date();
    return this.discountRepository.find({
      where: {
        isActive: true,
      },
      order: { createdAt: 'DESC' },
    });
  }

  async validateAndApply(dto: ApplyDiscountDto): Promise<{ discount: Discount; discountAmount: number }> {
    const discount = await this.findByCode(dto.discountCode);

    // 检查是否启用
    if (!discount.isActive) {
      throw new BadRequestException('折扣已禁用');
    }

    // 检查时间范围
    const now = new Date();
    if (discount.startTime && new Date(discount.startTime) > now) {
      throw new BadRequestException('折扣尚未生效');
    }
    if (discount.endTime && new Date(discount.endTime) < now) {
      throw new BadRequestException('折扣已过期');
    }

    // 检查使用次数
    if (discount.usageLimit > 0 && discount.usedCount >= discount.usageLimit) {
      throw new BadRequestException('折扣使用次数已达上限');
    }

    // 检查最低消费
    if (discount.minAmount && dto.amount < Number(discount.minAmount)) {
      throw new BadRequestException(`最低消费金额为 ${discount.minAmount} 元`);
    }

    // 检查适用范围
    if (discount.discountScope !== DiscountScope.ALL && dto.itemIds) {
      const validIds = discount.scopeIds || [];
      const hasInvalid = dto.itemIds.some(id => !validIds.includes(id));
      if (hasInvalid) {
        throw new BadRequestException('部分商品/服务不适用此折扣');
      }
    }

    // 计算折扣金额
    let discountAmount = 0;
    if (discount.discountType === DiscountValueType.PERCENTAGE) {
      discountAmount = dto.amount * Number(discount.discountValue) / 100;
    } else {
      discountAmount = Number(discount.discountValue);
    }

    // 检查最大优惠金额
    if (discount.maxDiscount && discountAmount > Number(discount.maxDiscount)) {
      discountAmount = Number(discount.maxDiscount);
    }

    return { discount, discountAmount };
  }

  async incrementUsage(id: string): Promise<void> {
    await this.discountRepository.increment({ id }, 'usedCount', 1);
  }
}
