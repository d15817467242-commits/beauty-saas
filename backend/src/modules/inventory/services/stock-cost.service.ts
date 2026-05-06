import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Between } from 'typeorm';
import { StockCost, ProductCostSummary } from '../entities/stock-cost.entity';
import { ProductStock } from '../product.entity';
import { CalculateCostDto, QueryStockCostDto, UpdateProductCostDto } from '../dto/stock-cost.dto';

@Injectable()
export class StockCostService {
  constructor(
    @InjectRepository(StockCost)
    private stockCostRepository: Repository<StockCost>,
    @InjectRepository(ProductCostSummary)
    private productCostSummaryRepository: Repository<ProductCostSummary>,
    @InjectRepository(ProductStock)
    private productStockRepository: Repository<ProductStock>,
    private dataSource: DataSource,
  ) {}

  // 记录成本变动（移动加权平均）
  async recordCostChange(
    productId: string,
    quantityChange: number,
    unitPrice: number,
    relatedOrderId?: string,
    relatedOrderType?: string,
    userId?: string,
    remark?: string,
  ): Promise<StockCost> {
    return this.dataSource.transaction(async (manager) => {
      // 获取当前成本汇总
      let summary = await manager.findOne(ProductCostSummary, {
        where: { productId },
      });

      if (!summary) {
        summary = manager.create(ProductCostSummary, {
          productId,
          currentUnitCost: 0,
          currentQuantity: 0,
          currentTotalCost: 0,
          lastCostUpdate: new Date(),
        });
        await manager.save(summary);
      }

      const quantityBefore = summary.currentQuantity;
      const costBefore = summary.currentTotalCost;
      const costChange = quantityChange * unitPrice;
      const quantityAfter = quantityBefore + quantityChange;
      const costAfter = costBefore + costChange;

      // 计算新的单位成本（移动加权平均）
      let newUnitCost = summary.currentUnitCost;
      if (quantityAfter > 0) {
        newUnitCost = costAfter / quantityAfter;
      }

      // 创建成本记录
      const costRecord = manager.create(StockCost, {
        productId,
        unitCost: newUnitCost,
        quantityBefore,
        costBefore,
        quantityChange,
        unitPrice,
        costChange,
        quantityAfter,
        costAfter,
        relatedOrderId,
        relatedOrderType,
        remark,
        createdBy: userId,
      });

      await manager.save(costRecord);

      // 更新成本汇总
      summary.currentUnitCost = newUnitCost;
      summary.currentQuantity = quantityAfter;
      summary.currentTotalCost = costAfter;
      summary.lastCostUpdate = new Date();

      await manager.save(summary);

      return costRecord;
    });
  }

  // 获取成本历史
  async getCostHistory(query: QueryStockCostDto): Promise<StockCost[]> {
    const where: any = { productId: query.productId };

    if (query.startDate && query.endDate) {
      where.createdAt = Between(new Date(query.startDate), new Date(query.endDate));
    }

    return this.stockCostRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  // 获取产品成本汇总
  async getCostSummary(productId: string): Promise<ProductCostSummary> {
    const summary = await this.productCostSummaryRepository.findOne({
      where: { productId },
    });

    if (!summary) {
      // 如果没有成本记录，返回默认值
      const stock = await this.productStockRepository.findOne({
        where: { productId },
      });

      return this.productCostSummaryRepository.create({
        productId,
        currentUnitCost: 0,
        currentQuantity: stock?.quantity || 0,
        currentTotalCost: 0,
        lastCostUpdate: new Date(),
      });
    }

    return summary;
  }

  // 批量计算成本
  async calculateCost(dto: CalculateCostDto): Promise<ProductCostSummary[]> {
    const where: any = {};
    if (dto.productId) {
      where.productId = dto.productId;
    }

    const summaries = await this.productCostSummaryRepository.find({ where });

    // 如果指定了产品但没有记录，创建默认记录
    if (dto.productId && summaries.length === 0) {
      const stock = await this.productStockRepository.findOne({
        where: { productId: dto.productId },
      });

      const summary = this.productCostSummaryRepository.create({
        productId: dto.productId,
        currentUnitCost: 0,
        currentQuantity: stock?.quantity || 0,
        currentTotalCost: 0,
        lastCostUpdate: new Date(),
      });

      return [summary];
    }

    return summaries;
  }

  // 手动更新产品成本
  async updateProductCost(productId: string, dto: UpdateProductCostDto, userId: string): Promise<ProductCostSummary> {
    const stock = await this.productStockRepository.findOne({
      where: { productId },
    });

    if (!stock) {
      throw new NotFoundException('产品库存不存在');
    }

    const quantity = stock.quantity;
    const newTotalCost = quantity * dto.unitCost;

    // 创建成本调整记录
    const costRecord = this.stockCostRepository.create({
      productId,
      unitCost: dto.unitCost,
      quantityBefore: quantity,
      costBefore: quantity * (await this.getCostSummary(productId)).currentUnitCost,
      quantityChange: 0,
      unitPrice: dto.unitCost,
      costChange: newTotalCost - (await this.getCostSummary(productId)).currentTotalCost,
      quantityAfter: quantity,
      costAfter: newTotalCost,
      remark: dto.remark || '手动成本调整',
      createdBy: userId,
    });

    await this.stockCostRepository.save(costRecord);

    // 更新成本汇总
    let summary = await this.productCostSummaryRepository.findOne({
      where: { productId },
    });

    if (!summary) {
      summary = this.productCostSummaryRepository.create({
        productId,
      });
    }

    summary.currentUnitCost = dto.unitCost;
    summary.currentQuantity = quantity;
    summary.currentTotalCost = newTotalCost;
    summary.lastCostUpdate = new Date();

    return this.productCostSummaryRepository.save(summary);
  }

  // 获取所有产品的成本汇总
  async getAllCostSummaries(): Promise<ProductCostSummary[]> {
    return this.productCostSummaryRepository.find({
      order: { lastCostUpdate: 'DESC' },
    });
  }

  // 计算库存总价值
  async calculateTotalInventoryValue(): Promise<{ totalQuantity: number; totalCost: number }> {
    const summaries = await this.productCostSummaryRepository.find();

    let totalQuantity = 0;
    let totalCost = 0;

    for (const summary of summaries) {
      totalQuantity += summary.currentQuantity;
      totalCost += summary.currentTotalCost;
    }

    return { totalQuantity, totalCost };
  }
}
