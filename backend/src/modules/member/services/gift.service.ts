import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In } from 'typeorm';
import { Gift, GiftExchange, GiftStatus, GiftType } from '../entities/gift.entity';
import { CreateGiftDto, UpdateGiftDto, GiftQueryDto, ExchangeGiftDto } from '../dto/gift.dto';
import * as dayjs from 'dayjs';

@Injectable()
export class GiftService {
  constructor(
    @InjectRepository(Gift)
    private giftRepository: Repository<Gift>,
    @InjectRepository(GiftExchange)
    private exchangeRepository: Repository<GiftExchange>,
  ) {}

  // ========== 礼品管理 ==========

  async findAll(query: GiftQueryDto): Promise<{ data: Gift[]; total: number }> {
    const { keyword, type, category, status, page = 1, pageSize = 10 } = query;
    
    const where: any = {};
    if (type) where.type = type;
    if (category) where.category = category;
    if (status) where.status = status;
    if (keyword) where.name = Like(`%${keyword}%`);

    const [data, total] = await this.giftRepository.findAndCount({
      where,
      order: { sort: 'ASC', createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return { data, total };
  }

  async findOne(id: string): Promise<Gift> {
    const gift = await this.giftRepository.findOne({ where: { id } });
    if (!gift) {
      throw new NotFoundException('礼品不存在');
    }
    return gift;
  }

  async create(dto: CreateGiftDto): Promise<Gift> {
    const gift = this.giftRepository.create(dto);
    return this.giftRepository.save(gift);
  }

  async update(id: string, dto: UpdateGiftDto): Promise<Gift> {
    const gift = await this.findOne(id);
    Object.assign(gift, dto);
    return this.giftRepository.save(gift);
  }

  async remove(id: string): Promise<void> {
    const gift = await this.findOne(id);
    await this.giftRepository.remove(gift);
  }

  async updateStock(id: string, quantity: number): Promise<Gift> {
    const gift = await this.findOne(id);
    gift.stock += quantity;
    if (gift.stock <= 0) {
      gift.stock = 0;
      gift.status = GiftStatus.OUT_OF_STOCK;
    }
    return this.giftRepository.save(gift);
  }

  // ========== 礼品兑换 ==========

  async exchange(memberId: string, dto: ExchangeGiftDto): Promise<GiftExchange> {
    const gift = await this.findOne(dto.giftId);

    // 检查礼品状态
    if (gift.status !== GiftStatus.ACTIVE) {
      throw new BadRequestException('礼品不可兑换');
    }

    // 检查时间范围
    const now = dayjs();
    if (gift.startTime && now.isBefore(gift.startTime)) {
      throw new BadRequestException('兑换未开始');
    }
    if (gift.endTime && now.isAfter(gift.endTime)) {
      throw new BadRequestException('兑换已结束');
    }

    // 检查库存
    if (gift.stock < dto.quantity) {
      throw new BadRequestException('库存不足');
    }

    // 检查限兑数量
    if (gift.limitPerMember > 0) {
      const exchanged = await this.exchangeRepository.count({
        where: { memberId, giftId: dto.giftId, status: 'completed' },
      });
      if (exchanged + dto.quantity > gift.limitPerMember) {
        throw new BadRequestException('超过兑换限制');
      }
    }

    // 计算积分消耗
    const pointsCost = gift.points * dto.quantity;

    // 创建兑换记录
    const exchange = this.exchangeRepository.create({
      memberId,
      giftId: dto.giftId,
      quantity: dto.quantity,
      pointsCost,
      address: dto.address,
      phone: dto.phone,
      receiver: dto.receiver,
      remark: dto.remark,
      status: 'pending',
    });

    // 更新礼品库存和兑换数量
    gift.stock -= dto.quantity;
    gift.exchangedCount += dto.quantity;
    await this.giftRepository.save(gift);

    return this.exchangeRepository.save(exchange);
  }

  async completeExchange(id: string, completedBy: string): Promise<GiftExchange> {
    const exchange = await this.exchangeRepository.findOne({ where: { id } });
    if (!exchange) {
      throw new NotFoundException('兑换记录不存在');
    }
    if (exchange.status !== 'pending') {
      throw new BadRequestException('兑换记录状态不正确');
    }

    exchange.status = 'completed';
    exchange.completedAt = new Date();
    exchange.completedBy = completedBy;

    return this.exchangeRepository.save(exchange);
  }

  async cancelExchange(id: string): Promise<GiftExchange> {
    const exchange = await this.exchangeRepository.findOne({
      where: { id },
      relations: ['gift'],
    });
    if (!exchange) {
      throw new NotFoundException('兑换记录不存在');
    }
    if (exchange.status !== 'pending') {
      throw new BadRequestException('兑换记录状态不正确');
    }

    exchange.status = 'cancelled';

    // 恢复库存
    const gift = exchange.gift;
    gift.stock += exchange.quantity;
    gift.exchangedCount -= exchange.quantity;
    await this.giftRepository.save(gift);

    return this.exchangeRepository.save(exchange);
  }

  // ========== 兑换记录 ==========

  async getExchangeRecords(query: {
    memberId?: string;
    giftId?: string;
    status?: 'pending' | 'completed' | 'cancelled';
    page?: number;
    pageSize?: number;
  }): Promise<{ data: GiftExchange[]; total: number }> {
    const { memberId, giftId, status, page = 1, pageSize = 10 } = query;

    const where: any = {};
    if (memberId) where.memberId = memberId;
    if (giftId) where.giftId = giftId;
    if (status) where.status = status;

    const [data, total] = await this.exchangeRepository.findAndCount({
      where,
      relations: ['gift'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return { data, total };
  }

  // ========== 统计 ==========

  async getStatistics(): Promise<any> {
    const total = await this.giftRepository.count();
    const active = await this.giftRepository.count({ where: { status: GiftStatus.ACTIVE } });
    const outOfStock = await this.giftRepository.count({ where: { status: GiftStatus.OUT_OF_STOCK } });

    const totalExchanged = await this.exchangeRepository.count({ where: { status: 'completed' } });
    const pendingExchanges = await this.exchangeRepository.count({ where: { status: 'pending' } });

    return {
      total,
      active,
      outOfStock,
      totalExchanged,
      pendingExchanges,
    };
  }
}
