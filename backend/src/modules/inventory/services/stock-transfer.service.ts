import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { StockTransfer, StockTransferItem, TransferStatus } from '../entities/stock-transfer.entity';
import { ProductStock } from '../product.entity';
import {
  CreateStockTransferDto,
  UpdateStockTransferDto,
  ApproveStockTransferDto,
  QueryStockTransferDto,
} from '../dto/stock-transfer.dto';

@Injectable()
export class StockTransferService {
  constructor(
    @InjectRepository(StockTransfer)
    private stockTransferRepository: Repository<StockTransfer>,
    @InjectRepository(StockTransferItem)
    private stockTransferItemRepository: Repository<StockTransferItem>,
    @InjectRepository(ProductStock)
    private productStockRepository: Repository<ProductStock>,
    private dataSource: DataSource,
  ) {}

  // 生成调拨单号
  private generateTransferNo(): string {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `TR${dateStr}${random}`;
  }

  // 创建调拨单
  async create(dto: CreateStockTransferDto, userId: string): Promise<StockTransfer> {
    // 检查调出仓库库存是否充足
    for (const item of dto.items) {
      const stock = await this.productStockRepository.findOne({
        where: { productId: item.productId },
      });
      if (!stock || stock.quantity < item.quantity) {
        throw new BadRequestException(`产品 ${item.productId} 库存不足`);
      }
    }

    const transfer = this.stockTransferRepository.create({
      transferNo: this.generateTransferNo(),
      name: dto.name,
      fromLocation: dto.fromLocation,
      toLocation: dto.toLocation,
      status: TransferStatus.DRAFT,
      createdBy: userId,
      remark: dto.remark,
    });

    const savedTransfer = await this.stockTransferRepository.save(transfer);

    // 创建调拨明细
    const items = dto.items.map((item) =>
      this.stockTransferItemRepository.create({
        transferId: savedTransfer.id,
        productId: item.productId,
        quantity: item.quantity,
        unitCost: item.unitCost,
        remark: item.remark,
      }),
    );

    await this.stockTransferItemRepository.save(items);

    return this.findOne(savedTransfer.id);
  }

  // 获取调拨单列表
  async findAll(query?: QueryStockTransferDto): Promise<StockTransfer[]> {
    const where: any = {};
    if (query?.status) {
      where.status = query.status;
    }
    if (query?.transferNo) {
      where.transferNo = query.transferNo;
    }
    if (query?.fromLocation) {
      where.fromLocation = query.fromLocation;
    }
    if (query?.toLocation) {
      where.toLocation = query.toLocation;
    }

    return this.stockTransferRepository.find({
      where,
      relations: ['items'],
      order: { createdAt: 'DESC' },
    });
  }

  // 获取单个调拨单
  async findOne(id: string): Promise<StockTransfer> {
    const transfer = await this.stockTransferRepository.findOne({
      where: { id },
      relations: ['items'],
    });
    if (!transfer) {
      throw new NotFoundException('调拨单不存在');
    }
    return transfer;
  }

  // 更新调拨单
  async update(id: string, dto: UpdateStockTransferDto): Promise<StockTransfer> {
    const transfer = await this.findOne(id);
    if (transfer.status !== TransferStatus.DRAFT) {
      throw new BadRequestException('只有草稿状态的调拨单可以修改');
    }

    Object.assign(transfer, dto);

    if (dto.items) {
      // 删除原有明细
      await this.stockTransferItemRepository.delete({ transferId: id });

      // 创建新明细
      const items = dto.items.map((item) =>
        this.stockTransferItemRepository.create({
          transferId: id,
          productId: item.productId,
          quantity: item.quantity,
          unitCost: item.unitCost,
          remark: item.remark,
        }),
      );
      await this.stockTransferItemRepository.save(items);
    }

    return this.stockTransferRepository.save(transfer);
  }

  // 提交审批
  async submit(id: string): Promise<StockTransfer> {
    const transfer = await this.findOne(id);
    if (transfer.status !== TransferStatus.DRAFT) {
      throw new BadRequestException('只有草稿状态的调拨单可以提交审批');
    }

    transfer.status = TransferStatus.PENDING;
    return this.stockTransferRepository.save(transfer);
  }

  // 审批调拨单
  async approve(id: string, dto: ApproveStockTransferDto, userId: string): Promise<StockTransfer> {
    const transfer = await this.findOne(id);
    if (transfer.status !== TransferStatus.PENDING) {
      throw new BadRequestException('只有待审批状态的调拨单可以审批');
    }

    if (dto.approved) {
      transfer.status = TransferStatus.APPROVED;
      transfer.approvedBy = userId;
      transfer.approvedAt = new Date();

      // 执行库存调拨
      await this.executeTransfer(transfer);
    } else {
      transfer.status = TransferStatus.REJECTED;
      if (dto.rejectReason !== undefined) {
        transfer.rejectReason = dto.rejectReason;
      }
    }

    return this.stockTransferRepository.save(transfer);
  }

  // 执行库存调拨
  private async executeTransfer(transfer: StockTransfer): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      for (const item of transfer.items) {
        // 扣减调出仓库库存
        const fromStock = await manager.findOne(ProductStock, {
          where: { productId: item.productId },
        });

        if (!fromStock || fromStock.quantity < item.quantity) {
          throw new BadRequestException(`产品 ${item.productId} 库存不足`);
        }

        fromStock.quantity -= item.quantity;
        await manager.save(fromStock);

        // 增加调入仓库库存（这里简化处理，实际可能需要按仓库区分）
        // 如果有多个仓库，需要根据 location 字段查找对应的库存记录
      }
    });
  }

  // 完成调拨
  async complete(id: string): Promise<StockTransfer> {
    const transfer = await this.findOne(id);
    if (transfer.status !== TransferStatus.APPROVED) {
      throw new BadRequestException('只有已审批状态的调拨单可以完成');
    }

    transfer.status = TransferStatus.COMPLETED;
    return this.stockTransferRepository.save(transfer);
  }

  // 取消调拨
  async cancel(id: string): Promise<StockTransfer> {
    const transfer = await this.findOne(id);
    if (transfer.status === TransferStatus.COMPLETED) {
      throw new BadRequestException('已完成的调拨单不能取消');
    }

    // 如果已审批，需要回滚库存
    if (transfer.status === TransferStatus.APPROVED) {
      await this.rollbackTransfer(transfer);
    }

    transfer.status = TransferStatus.CANCELLED;
    return this.stockTransferRepository.save(transfer);
  }

  // 回滚库存
  private async rollbackTransfer(transfer: StockTransfer): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      for (const item of transfer.items) {
        const stock = await manager.findOne(ProductStock, {
          where: { productId: item.productId },
        });

        if (stock) {
          stock.quantity += item.quantity;
          await manager.save(stock);
        }
      }
    });
  }

  // 删除调拨单
  async remove(id: string): Promise<void> {
    const transfer = await this.findOne(id);
    if (transfer.status !== TransferStatus.DRAFT) {
      throw new BadRequestException('只有草稿状态的调拨单可以删除');
    }

    await this.stockTransferItemRepository.delete({ transferId: id });
    await this.stockTransferRepository.delete(id);
  }
}
