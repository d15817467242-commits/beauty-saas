import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Between } from 'typeorm';
import { StockIn, StockInItem, StockInStatus } from '../entities/stock-in.entity';
import { StockMovement, MovementType } from '../entities/stock-movement.entity';
import { CreateStockInDto, QueryStockInDto } from '../dto/stock-in.dto';

@Injectable()
export class StockInService {
  constructor(
    @InjectRepository(StockIn)
    private stockInRepository: Repository<StockIn>,
    @InjectRepository(StockInItem)
    private stockInItemRepository: Repository<StockInItem>,
    @InjectRepository(StockMovement)
    private stockMovementRepository: Repository<StockMovement>,
    private dataSource: DataSource,
  ) {}

  private generateOrderNo(): string {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `RK${dateStr}${random}`;
  }

  async create(dto: CreateStockInDto, userId: string): Promise<StockIn> {
    let totalAmount = 0;
    const items = dto.items.map((item) => {
      const totalPrice = item.quantity * item.unitPrice;
      totalAmount += totalPrice;
      return this.stockInItemRepository.create({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice,
        remark: item.remark,
      });
    });

    const stockIn = this.stockInRepository.create({
      orderNo: this.generateOrderNo(),
      supplierId: dto.supplierId,
      warehouseId: dto.warehouseId,
      totalAmount,
      createdBy: userId,
      remark: dto.remark,
    });

    const saved = await this.stockInRepository.save(stockIn);

    for (const item of items) {
      item.stockInId = saved.id;
    }
    await this.stockInItemRepository.save(items);

    return this.findOne(saved.id);
  }

  async findAll(query?: QueryStockInDto): Promise<{ data: StockIn[]; total: number }> {
    const page = query?.page || 1;
    const pageSize = query?.pageSize || 20;
    const skip = (page - 1) * pageSize;

    const queryBuilder = this.stockInRepository.createQueryBuilder('stockIn')
      .leftJoinAndSelect('stockIn.items', 'items')
      .leftJoinAndSelect('stockIn.supplier', 'supplier');

    if (query?.orderNo) {
      queryBuilder.andWhere('stockIn.orderNo LIKE :orderNo', { orderNo: `%${query.orderNo}%` });
    }
    if (query?.supplierId) {
      queryBuilder.andWhere('stockIn.supplierId = :supplierId', { supplierId: query.supplierId });
    }
    if (query?.status) {
      queryBuilder.andWhere('stockIn.status = :status', { status: query.status });
    }
    if (query?.startDate) {
      queryBuilder.andWhere('stockIn.createdAt >= :startDate', { startDate: query.startDate });
    }
    if (query?.endDate) {
      queryBuilder.andWhere('stockIn.createdAt <= :endDate', { endDate: query.endDate });
    }

    queryBuilder
      .orderBy('stockIn.createdAt', 'DESC')
      .skip(skip)
      .take(pageSize);

    const [data, total] = await queryBuilder.getManyAndCount();
    return { data, total };
  }

  async findOne(id: string): Promise<StockIn> {
    const stockIn = await this.stockInRepository.findOne({
      where: { id },
      relations: ['items', 'supplier'],
    });
    if (!stockIn) {
      throw new NotFoundException('入库单不存在');
    }
    return stockIn;
  }

  async approve(id: string, userId: string): Promise<StockIn> {
    const stockIn = await this.findOne(id);
    if (stockIn.status !== StockInStatus.DRAFT && stockIn.status !== StockInStatus.PENDING) {
      throw new BadRequestException('当前状态不能审核');
    }

    await this.dataSource.transaction(async (manager) => {
      // 更新库存变动
      for (const item of stockIn.items) {
        // 获取当前库存（这里简化处理，实际需要从产品库存表获取）
        const beforeQuantity = 0;
        const afterQuantity = beforeQuantity + item.quantity;

        const movement = manager.create(StockMovement, {
          productId: item.productId,
          movementType: MovementType.IN,
          quantity: item.quantity,
          beforeQuantity,
          afterQuantity,
          unitCost: item.unitPrice,
          warehouseId: stockIn.warehouseId,
          referenceType: 'stock_in',
          referenceId: stockIn.id,
          referenceNo: stockIn.orderNo,
          createdBy: userId,
        });
        await manager.save(movement);
      }

      stockIn.status = StockInStatus.APPROVED;
      stockIn.approvedBy = userId;
      stockIn.approvedAt = new Date();
      await manager.save(stockIn);
    });

    return this.findOne(id);
  }

  async cancel(id: string): Promise<StockIn> {
    const stockIn = await this.findOne(id);
    if (stockIn.status === StockInStatus.APPROVED) {
      throw new BadRequestException('已审核的入库单不能取消');
    }

    stockIn.status = StockInStatus.CANCELLED;
    return this.stockInRepository.save(stockIn);
  }

  async remove(id: string): Promise<void> {
    const stockIn = await this.findOne(id);
    if (stockIn.status !== StockInStatus.DRAFT) {
      throw new BadRequestException('只有草稿状态的入库单可以删除');
    }

    await this.stockInItemRepository.delete({ stockInId: id });
    await this.stockInRepository.delete(id);
  }
}
