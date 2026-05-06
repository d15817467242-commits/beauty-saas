import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { StockOut, StockOutItem, StockOutStatus } from '../entities/stock-out.entity';
import { StockMovement, MovementType } from '../entities/stock-movement.entity';
import { CreateStockOutDto, QueryStockOutDto } from '../dto/stock-out.dto';

@Injectable()
export class StockOutService {
  constructor(
    @InjectRepository(StockOut)
    private stockOutRepository: Repository<StockOut>,
    @InjectRepository(StockOutItem)
    private stockOutItemRepository: Repository<StockOutItem>,
    @InjectRepository(StockMovement)
    private stockMovementRepository: Repository<StockMovement>,
    private dataSource: DataSource,
  ) {}

  private generateOrderNo(): string {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `CK${dateStr}${random}`;
  }

  async create(dto: CreateStockOutDto, userId: string): Promise<StockOut> {
    let totalAmount = 0;
    let costAmount = 0;
    const items = dto.items.map((item) => {
      const totalPrice = item.quantity * item.unitPrice;
      const costPrice = item.costPrice || item.unitPrice * 0.6; // 默认成本为售价60%
      totalAmount += totalPrice;
      costAmount += item.quantity * costPrice;
      return this.stockOutItemRepository.create({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        costPrice,
        totalPrice,
        remark: item.remark,
      });
    });

    const stockOut = this.stockOutRepository.create({
      orderNo: this.generateOrderNo(),
      type: dto.type,
      warehouseId: dto.warehouseId,
      totalAmount,
      costAmount,
      createdBy: userId,
      remark: dto.remark,
    });

    const saved = await this.stockOutRepository.save(stockOut);

    for (const item of items) {
      item.stockOutId = saved.id;
    }
    await this.stockOutItemRepository.save(items);

    return this.findOne(saved.id);
  }

  async findAll(query?: QueryStockOutDto): Promise<{ data: StockOut[]; total: number }> {
    const page = query?.page || 1;
    const pageSize = query?.pageSize || 20;
    const skip = (page - 1) * pageSize;

    const queryBuilder = this.stockOutRepository.createQueryBuilder('stockOut')
      .leftJoinAndSelect('stockOut.items', 'items');

    if (query?.orderNo) {
      queryBuilder.andWhere('stockOut.orderNo LIKE :orderNo', { orderNo: `%${query.orderNo}%` });
    }
    if (query?.type) {
      queryBuilder.andWhere('stockOut.type = :type', { type: query.type });
    }
    if (query?.status) {
      queryBuilder.andWhere('stockOut.status = :status', { status: query.status });
    }
    if (query?.startDate) {
      queryBuilder.andWhere('stockOut.createdAt >= :startDate', { startDate: query.startDate });
    }
    if (query?.endDate) {
      queryBuilder.andWhere('stockOut.createdAt <= :endDate', { endDate: query.endDate });
    }

    queryBuilder
      .orderBy('stockOut.createdAt', 'DESC')
      .skip(skip)
      .take(pageSize);

    const [data, total] = await queryBuilder.getManyAndCount();
    return { data, total };
  }

  async findOne(id: string): Promise<StockOut> {
    const stockOut = await this.stockOutRepository.findOne({
      where: { id },
      relations: ['items'],
    });
    if (!stockOut) {
      throw new NotFoundException('出库单不存在');
    }
    return stockOut;
  }

  async approve(id: string, userId: string): Promise<StockOut> {
    const stockOut = await this.findOne(id);
    if (stockOut.status !== StockOutStatus.DRAFT && stockOut.status !== StockOutStatus.PENDING) {
      throw new BadRequestException('当前状态不能审核');
    }

    await this.dataSource.transaction(async (manager) => {
      for (const item of stockOut.items) {
        const beforeQuantity = 0;
        const afterQuantity = beforeQuantity - item.quantity;

        const movement = manager.create(StockMovement, {
          productId: item.productId,
          movementType: MovementType.OUT,
          quantity: -item.quantity,
          beforeQuantity,
          afterQuantity,
          unitCost: item.costPrice,
          warehouseId: stockOut.warehouseId,
          referenceType: 'stock_out',
          referenceId: stockOut.id,
          referenceNo: stockOut.orderNo,
          createdBy: userId,
        });
        await manager.save(movement);
      }

      stockOut.status = StockOutStatus.APPROVED;
      stockOut.approvedBy = userId;
      stockOut.approvedAt = new Date();
      await manager.save(stockOut);
    });

    return this.findOne(id);
  }

  async cancel(id: string): Promise<StockOut> {
    const stockOut = await this.findOne(id);
    if (stockOut.status === StockOutStatus.APPROVED) {
      throw new BadRequestException('已审核的出库单不能取消');
    }

    stockOut.status = StockOutStatus.CANCELLED;
    return this.stockOutRepository.save(stockOut);
  }

  async remove(id: string): Promise<void> {
    const stockOut = await this.findOne(id);
    if (stockOut.status !== StockOutStatus.DRAFT) {
      throw new BadRequestException('只有草稿状态的出库单可以删除');
    }

    await this.stockOutItemRepository.delete({ stockOutId: id });
    await this.stockOutRepository.delete(id);
  }
}
