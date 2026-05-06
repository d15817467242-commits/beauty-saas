import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { StockTake, StockTakeItem, StockTakeStatus } from '../entities/stock-take.entity';
import { ProductStock } from '../product.entity';
import { CreateStockTakeDto, RecordStockTakeItemDto, QueryStockTakeDto } from '../dto/stock-take.dto';

@Injectable()
export class StockTakeService {
  constructor(
    @InjectRepository(StockTake)
    private stockTakeRepository: Repository<StockTake>,
    @InjectRepository(StockTakeItem)
    private stockTakeItemRepository: Repository<StockTakeItem>,
    @InjectRepository(ProductStock)
    private productStockRepository: Repository<ProductStock>,
    private dataSource: DataSource,
  ) {}

  // 生成盘点单号
  private generateStockTakeNo(): string {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `ST${dateStr}${random}`;
  }

  // 创建盘点单
  async create(dto: CreateStockTakeDto, userId: string): Promise<StockTake> {
    const stockTake = this.stockTakeRepository.create({
      stockTakeNo: this.generateStockTakeNo(),
      name: dto.name,
      status: StockTakeStatus.DRAFT,
      createdBy: userId,
      remark: dto.remark,
    });

    const savedStockTake = await this.stockTakeRepository.save(stockTake);

    // 创建盘点明细
    const items = dto.items.map((item) =>
      this.stockTakeItemRepository.create({
        stockTakeId: savedStockTake.id,
        productId: item.productId,
        systemQuantity: item.systemQuantity,
        unitCost: item.unitCost,
        remark: item.remark,
      }),
    );

    await this.stockTakeItemRepository.save(items);

    return this.findOne(savedStockTake.id);
  }

  // 获取盘点单列表
  async findAll(query?: QueryStockTakeDto): Promise<StockTake[]> {
    const where: any = {};
    if (query?.status) {
      where.status = query.status;
    }
    if (query?.stockTakeNo) {
      where.stockTakeNo = query.stockTakeNo;
    }
    if (query?.name) {
      where.name = query.name;
    }

    return this.stockTakeRepository.find({
      where,
      relations: ['items'],
      order: { createdAt: 'DESC' },
    });
  }

  // 获取单个盘点单
  async findOne(id: string): Promise<StockTake> {
    const stockTake = await this.stockTakeRepository.findOne({
      where: { id },
      relations: ['items'],
    });
    if (!stockTake) {
      throw new NotFoundException('盘点单不存在');
    }
    return stockTake;
  }

  // 开始盘点
  async startStockTake(id: string): Promise<StockTake> {
    const stockTake = await this.findOne(id);
    if (stockTake.status !== StockTakeStatus.DRAFT) {
      throw new BadRequestException('只有草稿状态的盘点单可以开始');
    }

    stockTake.status = StockTakeStatus.IN_PROGRESS;
    stockTake.startTime = new Date();

    return this.stockTakeRepository.save(stockTake);
  }

  // 记录盘点数量
  async recordItem(id: string, dto: RecordStockTakeItemDto): Promise<StockTakeItem> {
    const stockTake = await this.findOne(id);
    if (stockTake.status !== StockTakeStatus.IN_PROGRESS) {
      throw new BadRequestException('盘点单不在进行中状态');
    }

    const item = await this.stockTakeItemRepository.findOne({
      where: { stockTakeId: id, productId: dto.productId },
    });

    if (!item) {
      throw new NotFoundException('盘点明细不存在');
    }

    item.actualQuantity = dto.actualQuantity;
    item.differenceQuantity = item.actualQuantity - item.systemQuantity;
    if (item.unitCost) {
      item.differenceAmount = item.differenceQuantity * item.unitCost;
    }
    if (dto.remark !== undefined) {
      item.remark = dto.remark;
    }

    return this.stockTakeItemRepository.save(item);
  }

  // 完成盘点
  async completeStockTake(id: string, userId: string): Promise<StockTake> {
    const stockTake = await this.findOne(id);
    if (stockTake.status !== StockTakeStatus.IN_PROGRESS) {
      throw new BadRequestException('盘点单不在进行中状态');
    }

    // 检查是否所有明细都已盘点
    const unrecordedItems = stockTake.items.filter((item) => item.actualQuantity === null);
    if (unrecordedItems.length > 0) {
      throw new BadRequestException('还有未盘点的明细');
    }

    stockTake.status = StockTakeStatus.COMPLETED;
    stockTake.endTime = new Date();
    stockTake.completedBy = userId;

    return this.stockTakeRepository.save(stockTake);
  }

  // 处理盘点差异
  async processDifference(
    id: string,
    productId: string,
    actualQuantity: number,
    userId: string,
  ): Promise<void> {
    const stockTake = await this.findOne(id);
    if (stockTake.status !== StockTakeStatus.COMPLETED) {
      throw new BadRequestException('只有已完成的盘点单可以处理差异');
    }

    const item = await this.stockTakeItemRepository.findOne({
      where: { stockTakeId: id, productId },
    });

    if (!item) {
      throw new NotFoundException('盘点明细不存在');
    }

    // 使用事务处理库存调整
    await this.dataSource.transaction(async (manager) => {
      // 更新库存
      const stock = await manager.findOne(ProductStock, {
        where: { productId },
      });

      if (stock) {
        stock.quantity = actualQuantity;
        await manager.save(stock);
      }
    });
  }

  // 取消盘点
  async cancelStockTake(id: string): Promise<StockTake> {
    const stockTake = await this.findOne(id);
    if (stockTake.status === StockTakeStatus.COMPLETED) {
      throw new BadRequestException('已完成的盘点单不能取消');
    }

    stockTake.status = StockTakeStatus.CANCELLED;
    return this.stockTakeRepository.save(stockTake);
  }

  // 删除盘点单
  async remove(id: string): Promise<void> {
    const stockTake = await this.findOne(id);
    if (stockTake.status !== StockTakeStatus.DRAFT) {
      throw new BadRequestException('只有草稿状态的盘点单可以删除');
    }

    // 先删除明细
    await this.stockTakeItemRepository.delete({ stockTakeId: id });
    // 再删除主表
    await this.stockTakeRepository.delete(id);
  }
}
