import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, DataSource, LessThan, MoreThan } from 'typeorm';
import {
  PointsMallGoods,
  PointsExchange,
  PointsExchangeStatistics,
  PointsMallStatus,
  PointsGoodsType,
  ExchangeStatus,
} from './points-mall.entity';
import {
  CreatePointsGoodsDto,
  UpdatePointsGoodsDto,
  ExchangeGoodsDto,
  UpdateExchangeStatusDto,
  PointsMallQueryDto,
  ExchangeQueryDto,
} from './dto/points-mall.dto';

@Injectable()
export class PointsMallService {
  constructor(
    @InjectRepository(PointsMallGoods)
    private goodsRepository: Repository<PointsMallGoods>,
    @InjectRepository(PointsExchange)
    private exchangeRepository: Repository<PointsExchange>,
    @InjectRepository(PointsExchangeStatistics)
    private statisticsRepository: Repository<PointsExchangeStatistics>,
    private dataSource: DataSource,
  ) {}

  // ==================== 商品管理 ====================

  async createGoods(dto: CreatePointsGoodsDto, userId: string): Promise<PointsMallGoods> {
    const goods = this.goodsRepository.create({
      name: dto.name,
      subtitle: dto.subtitle,
      type: dto.type,
      pointsRequired: dto.pointsRequired,
      cashPrice: dto.cashPrice ?? 0,
      originalPrice: dto.originalPrice,
      stockCount: dto.stockCount ?? 0,
      exchangeLimit: dto.exchangeLimit ?? -1,
      status: dto.status ?? PointsMallStatus.ACTIVE,
      category: dto.category,
      mainImage: dto.mainImage,
      detailImages: Array.isArray(dto.detailImages) ? JSON.stringify(dto.detailImages) : undefined,
      description: dto.description,
      serviceConfig: dto.serviceConfig,
      couponConfig: dto.couponConfig,
      sortOrder: dto.sortOrder ?? 0,
      startTime: dto.startTime ? new Date(dto.startTime) : undefined,
      endTime: dto.endTime ? new Date(dto.endTime) : undefined,
      createdBy: userId,
    });
    return this.goodsRepository.save(goods);
  }

  async findAllGoods(dto: PointsMallQueryDto): Promise<{ list: PointsMallGoods[]; total: number }> {
    const queryBuilder = this.goodsRepository.createQueryBuilder('g');

    if (dto.status) {
      queryBuilder.andWhere('g.status = :status', { status: dto.status });
    }
    if (dto.category) {
      queryBuilder.andWhere('g.category = :category', { category: dto.category });
    }
    if (dto.type) {
      queryBuilder.andWhere('g.type = :type', { type: dto.type });
    }

    const page = dto.page || 1;
    const pageSize = dto.pageSize || 20;

    queryBuilder
      .orderBy('g.sortOrder', 'DESC')
      .addOrderBy('g.createdAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const [list, total] = await queryBuilder.getManyAndCount();
    return { list, total };
  }

  async findActiveGoods(): Promise<PointsMallGoods[]> {
    const now = new Date();
    return this.goodsRepository.find({
      where: {
        status: PointsMallStatus.ACTIVE,
      },
      order: { sortOrder: 'DESC', createdAt: 'DESC' },
    });
  }

  async findOneGoods(id: string): Promise<PointsMallGoods> {
    const goods = await this.goodsRepository.findOne({ where: { id } });
    if (!goods) {
      throw new NotFoundException('商品不存在');
    }
    return goods;
  }

  async updateGoods(id: string, dto: UpdatePointsGoodsDto): Promise<PointsMallGoods> {
    const goods = await this.findOneGoods(id);
    Object.assign(goods, dto);
    return this.goodsRepository.save(goods);
  }

  async removeGoods(id: string): Promise<void> {
    const goods = await this.findOneGoods(id);
    await this.goodsRepository.remove(goods);
  }

  async updateStock(id: string, quantity: number): Promise<PointsMallGoods> {
    const goods = await this.findOneGoods(id);
    goods.stockCount += quantity;
    if (goods.stockCount <= 0) {
      goods.status = PointsMallStatus.OUT_OF_STOCK;
    }
    return this.goodsRepository.save(goods);
  }

  // ==================== 兑换管理 ====================

  async exchange(dto: ExchangeGoodsDto, memberId: string, memberPoints: number): Promise<PointsExchange> {
    const goods = await this.findOneGoods(dto.goodsId);

    // 检查商品状态
    if (goods.status !== PointsMallStatus.ACTIVE) {
      throw new BadRequestException('商品暂不可兑换');
    }

    // 检查时间范围
    const now = new Date();
    if (goods.startTime && now < goods.startTime) {
      throw new BadRequestException('兑换尚未开始');
    }
    if (goods.endTime && now > goods.endTime) {
      throw new BadRequestException('兑换已结束');
    }

    const quantity = dto.quantity || 1;

    // 检查库存
    if (goods.stockCount < quantity) {
      throw new BadRequestException('库存不足');
    }

    // 检查积分
    const pointsRequired = goods.pointsRequired * quantity;
    if (memberPoints < pointsRequired) {
      throw new BadRequestException('积分不足');
    }

    // 检查兑换限制
    if (goods.exchangeLimit > 0) {
      const exchangedCount = await this.exchangeRepository.count({
        where: { memberId, goodsId: dto.goodsId },
      });
      if (exchangedCount + quantity > goods.exchangeLimit) {
        throw new BadRequestException('已达到兑换上限');
      }
    }

    // 开启事务
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 扣减库存
      goods.stockCount -= quantity;
      goods.soldCount += quantity;
      if (goods.stockCount <= 0) {
        goods.status = PointsMallStatus.OUT_OF_STOCK;
      }
      await queryRunner.manager.save(goods);

      // 创建兑换记录
      const exchange = queryRunner.manager.create(PointsExchange, {
        memberId,
        goodsId: dto.goodsId,
        pointsUsed: pointsRequired,
        cashPaid: Number(goods.cashPrice) * quantity,
        quantity,
        status: ExchangeStatus.PENDING,
        exchangeTime: now,
        deliveryInfo: dto.deliveryInfo,
      });
      await queryRunner.manager.save(exchange);

      // 更新统计
      await this.updateDailyStatistics(
        dto.goodsId,
        now,
        {
          exchangeCount: 1,
          exchangeQuantity: quantity,
          pointsTotal: pointsRequired,
          cashTotal: Number(goods.cashPrice) * quantity,
        },
        queryRunner.manager,
      );

      await queryRunner.commitTransaction();
      return exchange;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async updateExchangeStatus(dto: UpdateExchangeStatusDto, processedBy: string): Promise<PointsExchange> {
    const exchange = await this.exchangeRepository.findOne({
      where: { id: dto.exchangeId },
      relations: ['goods'],
    });

    if (!exchange) {
      throw new NotFoundException('兑换记录不存在');
    }

    const now = new Date();

    // 状态流转验证
    const validTransitions: Record<ExchangeStatus, ExchangeStatus[]> = {
      [ExchangeStatus.PENDING]: [ExchangeStatus.CONFIRMED, ExchangeStatus.CANCELLED],
      [ExchangeStatus.CONFIRMED]: [ExchangeStatus.SHIPPED, ExchangeStatus.CANCELLED],
      [ExchangeStatus.SHIPPED]: [ExchangeStatus.COMPLETED, ExchangeStatus.CANCELLED],
      [ExchangeStatus.COMPLETED]: [],
      [ExchangeStatus.CANCELLED]: [ExchangeStatus.REFUNDED],
      [ExchangeStatus.REFUNDED]: [],
    };

    if (!validTransitions[exchange.status].includes(dto.status)) {
      throw new BadRequestException(`不能从 ${exchange.status} 状态变更为 ${dto.status}`);
    }

    exchange.status = dto.status;
    exchange.processedBy = processedBy;
    exchange.processedAt = now;

    if (dto.trackingNumber) {
      exchange.trackingNumber = dto.trackingNumber;
    }
    if (dto.trackingCompany) {
      exchange.trackingCompany = dto.trackingCompany;
    }
    if (dto.remark) {
      exchange.remark = dto.remark;
    }

    if (dto.status === ExchangeStatus.COMPLETED) {
      exchange.completeTime = now;
    }

    // 如果取消，需要退还积分和库存
    if (dto.status === ExchangeStatus.CANCELLED) {
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        // 恢复库存
        await queryRunner.manager.increment(
          PointsMallGoods,
          { id: exchange.goodsId },
          'stockCount',
          exchange.quantity,
        );
        await queryRunner.manager.decrement(
          PointsMallGoods,
          { id: exchange.goodsId },
          'soldCount',
          exchange.quantity,
        );

        // 更新统计
        await this.updateDailyStatistics(
          exchange.goodsId,
          now,
          {
            cancelCount: 1,
            refundPoints: exchange.pointsUsed,
          },
          queryRunner.manager,
        );

        await queryRunner.commitTransaction();
      } catch (error) {
        await queryRunner.rollbackTransaction();
        throw error;
      } finally {
        await queryRunner.release();
      }
    }

    return this.exchangeRepository.save(exchange);
  }

  // ==================== 兑换记录查询 ====================

  async getExchangeList(dto: ExchangeQueryDto): Promise<{ list: PointsExchange[]; total: number }> {
    const queryBuilder = this.exchangeRepository
      .createQueryBuilder('e')
      .leftJoinAndSelect('e.goods', 'goods');

    if (dto.memberId) {
      queryBuilder.andWhere('e.memberId = :memberId', { memberId: dto.memberId });
    }
    if (dto.status) {
      queryBuilder.andWhere('e.status = :status', { status: dto.status });
    }
    if (dto.startDate) {
      queryBuilder.andWhere('e.exchangeTime >= :startDate', {
        startDate: new Date(dto.startDate),
      });
    }
    if (dto.endDate) {
      queryBuilder.andWhere('e.exchangeTime <= :endDate', {
        endDate: new Date(dto.endDate),
      });
    }

    const page = dto.page || 1;
    const pageSize = dto.pageSize || 20;

    queryBuilder
      .orderBy('e.exchangeTime', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const [list, total] = await queryBuilder.getManyAndCount();
    return { list, total };
  }

  async getMemberExchanges(memberId: string): Promise<PointsExchange[]> {
    return this.exchangeRepository.find({
      where: { memberId },
      relations: ['goods'],
      order: { exchangeTime: 'DESC' },
    });
  }

  // ==================== 统计分析 ====================

  async getGoodsStatistics(goodsId: string, startDate?: string, endDate?: string): Promise<any> {
    const goods = await this.findOneGoods(goodsId);

    const queryBuilder = this.statisticsRepository
      .createQueryBuilder('s')
      .where('s.goodsId = :goodsId', { goodsId });

    if (startDate) {
      queryBuilder.andWhere('s.statDate >= :startDate', { startDate });
    }
    if (endDate) {
      queryBuilder.andWhere('s.statDate <= :endDate', { endDate });
    }

    const stats = await queryBuilder.orderBy('s.statDate', 'ASC').getMany();

    const summary = {
      totalExchanges: stats.reduce((sum, s) => sum + s.exchangeCount, 0),
      totalQuantity: stats.reduce((sum, s) => sum + s.exchangeQuantity, 0),
      totalPoints: stats.reduce((sum, s) => sum + s.pointsTotal, 0),
      totalCash: stats.reduce((sum, s) => sum + Number(s.cashTotal), 0),
      totalCancels: stats.reduce((sum, s) => sum + s.cancelCount, 0),
      refundPoints: stats.reduce((sum, s) => sum + s.refundPoints, 0),
    };

    return {
      goods: {
        id: goods.id,
        name: goods.name,
        type: goods.type,
        pointsRequired: goods.pointsRequired,
        stockCount: goods.stockCount,
        soldCount: goods.soldCount,
      },
      summary,
      dailyStats: stats,
    };
  }

  // 更新每日统计
  private async updateDailyStatistics(
    goodsId: string,
    date: Date,
    data: {
      exchangeCount?: number;
      exchangeQuantity?: number;
      pointsTotal?: number;
      cashTotal?: number;
      cancelCount?: number;
      refundPoints?: number;
    },
    manager?: any,
  ): Promise<void> {
    const statDate = new Date(date);
    statDate.setHours(0, 0, 0, 0);

    const repo = manager ? manager.getRepository(PointsExchangeStatistics) : this.statisticsRepository;

    let stat = await repo.findOne({
      where: { goodsId, statDate },
    });

    if (!stat) {
      stat = repo.create({
        goodsId,
        statDate,
        exchangeCount: 0,
        exchangeQuantity: 0,
        pointsTotal: 0,
        cashTotal: 0,
        cancelCount: 0,
        refundPoints: 0,
      });
    }

    if (data.exchangeCount) stat.exchangeCount += data.exchangeCount;
    if (data.exchangeQuantity) stat.exchangeQuantity += data.exchangeQuantity;
    if (data.pointsTotal) stat.pointsTotal += data.pointsTotal;
    if (data.cashTotal) stat.cashTotal = Number(stat.cashTotal) + data.cashTotal;
    if (data.cancelCount) stat.cancelCount += data.cancelCount;
    if (data.refundPoints) stat.refundPoints += data.refundPoints;

    await repo.save(stat);
  }
}
