import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { StockCheck, StockCheckItem, StockCheckStatus } from '../entities/stock-check.entity';
import { StockMovement, MovementType } from '../entities/stock-movement.entity';
import { CreateStockCheckDto, QueryStockCheckDto, RecordStockCheckItemDto } from '../dto/stock-check.dto';

@Injectable()
export class StockCheckService {
  constructor(
    @InjectRepository(StockCheck)
    private stockCheckRepository: Repository<StockCheck>,
    @InjectRepository(StockCheckItem)
    private stockCheckItemRepository: Repository<StockCheckItem>,
    @InjectRepository(StockMovement)
    private stockMovementRepository: Repository<StockMovement>,
    private dataSource: DataSource,
  ) {}

  private generateOrderNo(): string {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `PD${dateStr}${random}`;
  }

  async create(dto: CreateStockCheckDto, userId: string): Promise<StockCheck> {
    const stockCheck = this.stockCheckRepository.create({
      orderNo: this.generateOrderNo(),
      name: dto.name,
      warehouseId: dto.warehouseId,
      createdBy: userId,
      remark: dto.remark,
    });

    const saved = await this.stockCheckRepository.save(stockCheck);

    if (dto.items && dto.items.length > 0) {
      const items = dto.items.map((item) =>
        this.stockCheckItemRepository.create({
          stockCheckId: saved.id,
          productId: item.productId,
          systemQuantity: item.systemQuantity,
          actualQuantity: item.actualQuantity,
          unitCost: item.unitCost,
          remark: item.remark,
        }),
      );
      await this.stockCheckItemRepository.save(items);
    }

    return this.findOne(saved.id);
  }

  async findAll(query?: QueryStockCheckDto): Promise<{ data: StockCheck[]; total: number }> {
    const page = query?.page || 1;
    const pageSize = query?.pageSize || 20;
    const skip = (page - 1) * pageSize;

    const queryBuilder = this.stockCheckRepository.createQueryBuilder('stockCheck')
      .leftJoinAndSelect('stockCheck.items', 'items');

    if (query?.orderNo) {
      queryBuilder.andWhere('stockCheck.orderNo LIKE :orderNo', { orderNo: `%${query.orderNo}%` });
    }
    if (query?.status) {
      queryBuilder.andWhere('stockCheck.status = :status', { status: query.status });
    }
    if (query?.startDate) {
      queryBuilder.andWhere('stockCheck.createdAt >= :startDate', { startDate: query.startDate });
    }
    if (query?.endDate) {
      queryBuilder.andWhere('stockCheck.createdAt <= :endDate', { endDate: query.endDate });
    }

    queryBuilder
      .orderBy('stockCheck.createdAt', 'DESC')
      .skip(skip)
      .take(pageSize);

    const [data, total] = await queryBuilder.getManyAndCount();
    return { data, total };
  }

  async findOne(id: string): Promise<StockCheck> {
    const stockCheck = await this.stockCheckRepository.findOne({
      where: { id },
      relations: ['items'],
    });
    if (!stockCheck) {
      throw new NotFoundException('盘点单不存在');
    }
    return stockCheck;
  }

  async start(id: string): Promise<StockCheck> {
    const stockCheck = await this.findOne(id);
    if (stockCheck.status !== StockCheckStatus.DRAFT) {
      throw new BadRequestException('只有草稿状态可以开始盘点');
    }

    stockCheck.status = StockCheckStatus.IN_PROGRESS;
    stockCheck.startTime = new Date();
    return this.stockCheckRepository.save(stockCheck);
  }

  async recordItem(id: string, dto: RecordStockCheckItemDto): Promise<StockCheckItem> {
    const stockCheck = await this.findOne(id);
    if (stockCheck.status !== StockCheckStatus.IN_PROGRESS) {
      throw new BadRequestException('盘点未开始或已结束');
    }

    let item = await this.stockCheckItemRepository.findOne({
      where: { stockCheckId: id, productId: dto.productId },
    });

    if (!item) {
      item = this.stockCheckItemRepository.create({
        stockCheckId: id,
        productId: dto.productId,
        systemQuantity: 0,
      });
    }

    item.actualQuantity = dto.actualQuantity;
    item.differenceQuantity = item.actualQuantity - item.systemQuantity;
    if (item.unitCost) {
      item.differenceAmount = item.differenceQuantity * item.unitCost;
    }
    if (dto.remark !== undefined) {
      item.remark = dto.remark;
    }

    return this.stockCheckItemRepository.save(item);
  }

  async complete(id: string, userId: string): Promise<StockCheck> {
    const stockCheck = await this.findOne(id);
    if (stockCheck.status !== StockCheckStatus.IN_PROGRESS) {
      throw new BadRequestException('盘点未开始或已结束');
    }

    await this.dataSource.transaction(async (manager) => {
      for (const item of stockCheck.items) {
        if (item.actualQuantity !== null && item.differenceQuantity !== 0) {
          const movement = manager.create(StockMovement, {
            productId: item.productId,
            movementType: MovementType.CHECK,
            quantity: item.differenceQuantity,
            beforeQuantity: item.systemQuantity,
            afterQuantity: item.actualQuantity,
            unitCost: item.unitCost,
            warehouseId: stockCheck.warehouseId,
            referenceType: 'stock_check',
            referenceId: stockCheck.id,
            referenceNo: stockCheck.orderNo,
            createdBy: userId,
          });
          await manager.save(movement);
        }
      }

      stockCheck.status = StockCheckStatus.COMPLETED;
      stockCheck.endTime = new Date();
      stockCheck.completedBy = userId;
      await manager.save(stockCheck);
    });

    return this.findOne(id);
  }

  async cancel(id: string): Promise<StockCheck> {
    const stockCheck = await this.findOne(id);
    if (stockCheck.status === StockCheckStatus.COMPLETED) {
      throw new BadRequestException('已完成的盘点单不能取消');
    }

    stockCheck.status = StockCheckStatus.CANCELLED;
    return this.stockCheckRepository.save(stockCheck);
  }

  async remove(id: string): Promise<void> {
    const stockCheck = await this.findOne(id);
    if (stockCheck.status !== StockCheckStatus.DRAFT) {
      throw new BadRequestException('只有草稿状态的盘点单可以删除');
    }

    await this.stockCheckItemRepository.delete({ stockCheckId: id });
    await this.stockCheckRepository.delete(id);
  }
}
