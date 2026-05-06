import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StockMovement } from '../entities/stock-movement.entity';
import { StockIn } from '../entities/stock-in.entity';
import { StockOut } from '../entities/stock-out.entity';

@Injectable()
export class StockReportService {
  constructor(
    @InjectRepository(StockMovement)
    private stockMovementRepository: Repository<StockMovement>,
    @InjectRepository(StockIn)
    private stockInRepository: Repository<StockIn>,
    @InjectRepository(StockOut)
    private stockOutRepository: Repository<StockOut>,
  ) {}

  // 库存剩余统计
  async getRemainingReport(query?: {
    warehouseId?: string;
    productId?: string;
  }): Promise<any[]> {
    const queryBuilder = this.stockMovementRepository.createQueryBuilder('movement')
      .select('movement.productId', 'productId')
      .addSelect('SUM(movement.quantity)', 'totalQuantity')
      .groupBy('movement.productId');

    if (query?.warehouseId) {
      queryBuilder.andWhere('movement.warehouseId = :warehouseId', { warehouseId: query.warehouseId });
    }
    if (query?.productId) {
      queryBuilder.andWhere('movement.productId = :productId', { productId: query.productId });
    }

    return queryBuilder.getRawMany();
  }

  // 入库统计
  async getInReport(query?: {
    startDate?: string;
    endDate?: string;
    warehouseId?: string;
    supplierId?: string;
  }): Promise<any> {
    const queryBuilder = this.stockInRepository.createQueryBuilder('stockIn')
      .leftJoinAndSelect('stockIn.items', 'items')
      .where('stockIn.status = :status', { status: 'approved' });

    if (query?.startDate) {
      queryBuilder.andWhere('stockIn.createdAt >= :startDate', { startDate: query.startDate });
    }
    if (query?.endDate) {
      queryBuilder.andWhere('stockIn.createdAt <= :endDate', { endDate: query.endDate });
    }
    if (query?.warehouseId) {
      queryBuilder.andWhere('stockIn.warehouseId = :warehouseId', { warehouseId: query.warehouseId });
    }
    if (query?.supplierId) {
      queryBuilder.andWhere('stockIn.supplierId = :supplierId', { supplierId: query.supplierId });
    }

    const stockIns = await queryBuilder.getMany();

    let totalAmount = 0;
    let totalQuantity = 0;
    const productMap = new Map<string, { productId: string; quantity: number; amount: number }>();

    for (const stockIn of stockIns) {
      for (const item of stockIn.items) {
        totalAmount += Number(item.totalPrice);
        totalQuantity += item.quantity;

        const existing = productMap.get(item.productId) || { productId: item.productId, quantity: 0, amount: 0 };
        existing.quantity += item.quantity;
        existing.amount += Number(item.totalPrice);
        productMap.set(item.productId, existing);
      }
    }

    return {
      totalAmount,
      totalQuantity,
      count: stockIns.length,
      byProduct: Array.from(productMap.values()),
    };
  }

  // 出库统计
  async getOutReport(query?: {
    startDate?: string;
    endDate?: string;
    warehouseId?: string;
    type?: string;
  }): Promise<any> {
    const queryBuilder = this.stockOutRepository.createQueryBuilder('stockOut')
      .leftJoinAndSelect('stockOut.items', 'items')
      .where('stockOut.status = :status', { status: 'approved' });

    if (query?.startDate) {
      queryBuilder.andWhere('stockOut.createdAt >= :startDate', { startDate: query.startDate });
    }
    if (query?.endDate) {
      queryBuilder.andWhere('stockOut.createdAt <= :endDate', { endDate: query.endDate });
    }
    if (query?.warehouseId) {
      queryBuilder.andWhere('stockOut.warehouseId = :warehouseId', { warehouseId: query.warehouseId });
    }
    if (query?.type) {
      queryBuilder.andWhere('stockOut.type = :type', { type: query.type });
    }

    const stockOuts = await queryBuilder.getMany();

    let totalAmount = 0;
    let costAmount = 0;
    let totalQuantity = 0;
    const productMap = new Map<string, { productId: string; quantity: number; amount: number; cost: number }>();

    for (const stockOut of stockOuts) {
      for (const item of stockOut.items) {
        totalAmount += Number(item.totalPrice);
        costAmount += item.quantity * Number(item.costPrice);
        totalQuantity += item.quantity;

        const existing = productMap.get(item.productId) || { productId: item.productId, quantity: 0, amount: 0, cost: 0 };
        existing.quantity += item.quantity;
        existing.amount += Number(item.totalPrice);
        existing.cost += item.quantity * Number(item.costPrice);
        productMap.set(item.productId, existing);
      }
    }

    return {
      totalAmount,
      costAmount,
      profit: totalAmount - costAmount,
      totalQuantity,
      count: stockOuts.length,
      byProduct: Array.from(productMap.values()),
    };
  }

  // 出库毛利
  async getProfitReport(query?: {
    startDate?: string;
    endDate?: string;
    warehouseId?: string;
  }): Promise<any> {
    const outReport = await this.getOutReport(query);

    return {
      totalRevenue: outReport.totalAmount,
      totalCost: outReport.costAmount,
      grossProfit: outReport.profit,
      profitMargin: outReport.totalAmount > 0 ? (outReport.profit / outReport.totalAmount * 100).toFixed(2) + '%' : '0%',
      byProduct: outReport.byProduct.map((p: any) => ({
        ...p,
        profit: p.amount - p.cost,
        profitMargin: p.amount > 0 ? ((p.amount - p.cost) / p.amount * 100).toFixed(2) + '%' : '0%',
      })),
    };
  }
}
