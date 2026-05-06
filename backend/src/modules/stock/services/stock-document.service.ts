import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StockMovement } from '../entities/stock-movement.entity';
import { StockIn } from '../entities/stock-in.entity';
import { StockOut } from '../entities/stock-out.entity';
import { StockCheck } from '../entities/stock-check.entity';
import { StockTransfer } from '../entities/stock-transfer.entity';

@Injectable()
export class StockDocumentService {
  constructor(
    @InjectRepository(StockMovement)
    private stockMovementRepository: Repository<StockMovement>,
    @InjectRepository(StockIn)
    private stockInRepository: Repository<StockIn>,
    @InjectRepository(StockOut)
    private stockOutRepository: Repository<StockOut>,
    @InjectRepository(StockCheck)
    private stockCheckRepository: Repository<StockCheck>,
    @InjectRepository(StockTransfer)
    private stockTransferRepository: Repository<StockTransfer>,
  ) {}

  async getDocuments(query?: {
    type?: string;
    orderNo?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{ data: any[]; total: number }> {
    const page = query?.page || 1;
    const pageSize = query?.pageSize || 20;
    const documents: any[] = [];

    // 根据类型获取不同单据
    if (!query?.type || query.type === 'in') {
      const stockIns = await this.stockInRepository.find({
        where: query?.orderNo ? { orderNo: query.orderNo } : {},
        relations: ['items'],
        order: { createdAt: 'DESC' },
        take: pageSize,
      });
      documents.push(...stockIns.map((d) => ({ ...d, documentType: 'stock_in', typeName: '入库单' })));
    }

    if (!query?.type || query.type === 'out') {
      const stockOuts = await this.stockOutRepository.find({
        where: query?.orderNo ? { orderNo: query.orderNo } : {},
        relations: ['items'],
        order: { createdAt: 'DESC' },
        take: pageSize,
      });
      documents.push(...stockOuts.map((d) => ({ ...d, documentType: 'stock_out', typeName: '出库单' })));
    }

    if (!query?.type || query.type === 'check') {
      const stockChecks = await this.stockCheckRepository.find({
        where: query?.orderNo ? { orderNo: query.orderNo } : {},
        relations: ['items'],
        order: { createdAt: 'DESC' },
        take: pageSize,
      });
      documents.push(...stockChecks.map((d) => ({ ...d, documentType: 'stock_check', typeName: '盘点单' })));
    }

    if (!query?.type || query.type === 'transfer') {
      const stockTransfers = await this.stockTransferRepository.find({
        where: query?.orderNo ? { orderNo: query.orderNo } : {},
        relations: ['items'],
        order: { createdAt: 'DESC' },
        take: pageSize,
      });
      documents.push(...stockTransfers.map((d) => ({ ...d, documentType: 'stock_transfer', typeName: '调拨单' })));
    }

    // 按时间排序
    documents.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = documents.length;
    const data = documents.slice((page - 1) * pageSize, page * pageSize);

    return { data, total };
  }
}
