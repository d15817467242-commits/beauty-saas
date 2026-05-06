import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { StockTransfer, StockTransferItem, StockTransferStatus } from '../entities/stock-transfer.entity';
import { StockMovement, MovementType } from '../entities/stock-movement.entity';
import { CreateStockTransferDto, QueryStockTransferDto, ApproveStockTransferDto } from '../dto/stock-transfer.dto';

@Injectable()
export class StockTransferService {
  constructor(
    @InjectRepository(StockTransfer)
    private stockTransferRepository: Repository<StockTransfer>,
    @InjectRepository(StockTransferItem)
    private stockTransferItemRepository: Repository<StockTransferItem>,
    @InjectRepository(StockMovement)
    private stockMovementRepository: Repository<StockMovement>,
    private dataSource: DataSource,
  ) {}

  private generateOrderNo(): string {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `DB${dateStr}${random}`;
  }

  async create(dto: CreateStockTransferDto, userId: string): Promise<StockTransfer> {
    const items = dto.items.map((item) =>
      this.stockTransferItemRepository.create({
        productId: item.productId,
        quantity: item.quantity,
        unitCost: item.unitCost,
        remark: item.remark,
      }),
    );

    const stockTransfer = this.stockTransferRepository.create({
      orderNo: this.generateOrderNo(),
      name: dto.name,
      fromWarehouseId: dto.fromWarehouseId,
      toWarehouseId: dto.toWarehouseId,
      createdBy: userId,
      remark: dto.remark,
    });

    const saved = await this.stockTransferRepository.save(stockTransfer);

    for (const item of items) {
      item.stockTransferId = saved.id;
    }
    await this.stockTransferItemRepository.save(items);

    return this.findOne(saved.id);
  }

  async findAll(query?: QueryStockTransferDto): Promise<{ data: StockTransfer[]; total: number }> {
    const page = query?.page || 1;
    const pageSize = query?.pageSize || 20;
    const skip = (page - 1) * pageSize;

    const queryBuilder = this.stockTransferRepository.createQueryBuilder('stockTransfer')
      .leftJoinAndSelect('stockTransfer.items', 'items');

    if (query?.orderNo) {
      queryBuilder.andWhere('stockTransfer.orderNo LIKE :orderNo', { orderNo: `%${query.orderNo}%` });
    }
    if (query?.status) {
      queryBuilder.andWhere('stockTransfer.status = :status', { status: query.status });
    }
    if (query?.startDate) {
      queryBuilder.andWhere('stockTransfer.createdAt >= :startDate', { startDate: query.startDate });
    }
    if (query?.endDate) {
      queryBuilder.andWhere('stockTransfer.createdAt <= :endDate', { endDate: query.endDate });
    }

    queryBuilder
      .orderBy('stockTransfer.createdAt', 'DESC')
      .skip(skip)
      .take(pageSize);

    const [data, total] = await queryBuilder.getManyAndCount();
    return { data, total };
  }

  async findOne(id: string): Promise<StockTransfer> {
    const stockTransfer = await this.stockTransferRepository.findOne({
      where: { id },
      relations: ['items'],
    });
    if (!stockTransfer) {
      throw new NotFoundException('调拨单不存在');
    }
    return stockTransfer;
  }

  async submit(id: string): Promise<StockTransfer> {
    const stockTransfer = await this.findOne(id);
    if (stockTransfer.status !== StockTransferStatus.DRAFT) {
      throw new BadRequestException('只有草稿状态可以提交');
    }

    stockTransfer.status = StockTransferStatus.PENDING;
    return this.stockTransferRepository.save(stockTransfer);
  }

  async approve(id: string, dto: ApproveStockTransferDto, userId: string): Promise<StockTransfer> {
    const stockTransfer = await this.findOne(id);
    if (stockTransfer.status !== StockTransferStatus.PENDING) {
      throw new BadRequestException('只有待审批状态可以审批');
    }

    if (dto.approved) {
      stockTransfer.status = StockTransferStatus.APPROVED;
      stockTransfer.approvedBy = userId;
      stockTransfer.approvedAt = new Date();
    } else {
      stockTransfer.status = StockTransferStatus.REJECTED;
      if (dto.rejectReason !== undefined) {
        stockTransfer.rejectReason = dto.rejectReason;
      }
    }

    return this.stockTransferRepository.save(stockTransfer);
  }

  async complete(id: string, userId: string): Promise<StockTransfer> {
    const stockTransfer = await this.findOne(id);
    if (stockTransfer.status !== StockTransferStatus.APPROVED) {
      throw new BadRequestException('只有已审批状态可以完成');
    }

    await this.dataSource.transaction(async (manager) => {
      for (const item of stockTransfer.items) {
        // 调出仓库记录
        const outMovement = manager.create(StockMovement, {
          productId: item.productId,
          movementType: MovementType.TRANSFER,
          quantity: -item.quantity,
          beforeQuantity: 0,
          afterQuantity: -item.quantity,
          unitCost: item.unitCost,
          warehouseId: stockTransfer.fromWarehouseId,
          referenceType: 'stock_transfer',
          referenceId: stockTransfer.id,
          referenceNo: stockTransfer.orderNo,
          createdBy: userId,
        });
        await manager.save(outMovement);

        // 调入仓库记录
        const inMovement = manager.create(StockMovement, {
          productId: item.productId,
          movementType: MovementType.TRANSFER,
          quantity: item.quantity,
          beforeQuantity: 0,
          afterQuantity: item.quantity,
          unitCost: item.unitCost,
          warehouseId: stockTransfer.toWarehouseId,
          referenceType: 'stock_transfer',
          referenceId: stockTransfer.id,
          referenceNo: stockTransfer.orderNo,
          createdBy: userId,
        });
        await manager.save(inMovement);
      }

      stockTransfer.status = StockTransferStatus.COMPLETED;
      await manager.save(stockTransfer);
    });

    return this.findOne(id);
  }

  async cancel(id: string): Promise<StockTransfer> {
    const stockTransfer = await this.findOne(id);
    if (stockTransfer.status === StockTransferStatus.COMPLETED) {
      throw new BadRequestException('已完成的调拨单不能取消');
    }

    stockTransfer.status = StockTransferStatus.CANCELLED;
    return this.stockTransferRepository.save(stockTransfer);
  }

  async remove(id: string): Promise<void> {
    const stockTransfer = await this.findOne(id);
    if (stockTransfer.status !== StockTransferStatus.DRAFT) {
      throw new BadRequestException('只有草稿状态的调拨单可以删除');
    }

    await this.stockTransferItemRepository.delete({ stockTransferId: id });
    await this.stockTransferRepository.delete(id);
  }
}
