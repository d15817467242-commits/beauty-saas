import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { PurchaseOrder, PurchaseOrderItem, PurchaseStatus } from '../entities/purchase.entity';
import { ProductStock } from '../product.entity';
import {
  CreatePurchaseOrderDto,
  UpdatePurchaseOrderDto,
  ApprovePurchaseOrderDto,
  ReceivePurchaseOrderDto,
  QueryPurchaseOrderDto,
} from '../dto/purchase.dto';

@Injectable()
export class PurchaseService {
  constructor(
    @InjectRepository(PurchaseOrder)
    private purchaseOrderRepository: Repository<PurchaseOrder>,
    @InjectRepository(PurchaseOrderItem)
    private purchaseOrderItemRepository: Repository<PurchaseOrderItem>,
    @InjectRepository(ProductStock)
    private productStockRepository: Repository<ProductStock>,
    private dataSource: DataSource,
  ) {}

  // 生成采购单号
  private generateOrderNo(): string {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `PO${dateStr}${random}`;
  }

  // 创建采购单
  async create(dto: CreatePurchaseOrderDto, userId: string): Promise<PurchaseOrder> {
    // 计算总金额
    let totalAmount = 0;
    const items = dto.items.map((item) => {
      const totalPrice = item.quantity * item.unitPrice;
      totalAmount += totalPrice;
      return this.purchaseOrderItemRepository.create({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice,
        remark: item.remark,
      });
    });

    const purchaseOrder = this.purchaseOrderRepository.create({
      orderNo: this.generateOrderNo(),
      supplierId: dto.supplierId,
      expectedDate: dto.expectedDate ? new Date(dto.expectedDate) : undefined,
      totalAmount,
      createdBy: userId,
      remark: dto.remark,
    });

    const savedOrder = await this.purchaseOrderRepository.save(purchaseOrder);

    // 设置明细的采购单ID
    for (const item of items) {
      item.purchaseOrderId = savedOrder.id;
    }
    await this.purchaseOrderItemRepository.save(items);

    return this.findOne(savedOrder.id);
  }

  // 获取采购单列表
  async findAll(query?: QueryPurchaseOrderDto): Promise<PurchaseOrder[]> {
    const where: any = {};
    if (query?.status) {
      where.status = query.status;
    }
    if (query?.orderNo) {
      where.orderNo = query.orderNo;
    }
    if (query?.supplierId) {
      where.supplierId = query.supplierId;
    }

    return this.purchaseOrderRepository.find({
      where,
      relations: ['items', 'supplier'],
      order: { createdAt: 'DESC' },
    });
  }

  // 获取单个采购单
  async findOne(id: string): Promise<PurchaseOrder> {
    const order = await this.purchaseOrderRepository.findOne({
      where: { id },
      relations: ['items', 'supplier'],
    });
    if (!order) {
      throw new NotFoundException('采购单不存在');
    }
    return order;
  }

  // 更新采购单
  async update(id: string, dto: UpdatePurchaseOrderDto): Promise<PurchaseOrder> {
    const order = await this.findOne(id);
    if (order.status !== PurchaseStatus.DRAFT) {
      throw new BadRequestException('只有草稿状态的采购单可以修改');
    }

    if (dto.expectedDate) {
      order.expectedDate = new Date(dto.expectedDate);
    }
    if (dto.remark !== undefined) {
      order.remark = dto.remark;
    }

    if (dto.items) {
      // 删除原有明细
      await this.purchaseOrderItemRepository.delete({ purchaseOrderId: id });

      // 创建新明细
      let totalAmount = 0;
      const items = dto.items.map((item) => {
        const totalPrice = item.quantity * item.unitPrice;
        totalAmount += totalPrice;
        return this.purchaseOrderItemRepository.create({
          purchaseOrderId: id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice,
          remark: item.remark,
        });
      });

      await this.purchaseOrderItemRepository.save(items);
      order.totalAmount = totalAmount;
    }

    return this.purchaseOrderRepository.save(order);
  }

  // 提交审批
  async submit(id: string): Promise<PurchaseOrder> {
    const order = await this.findOne(id);
    if (order.status !== PurchaseStatus.DRAFT) {
      throw new BadRequestException('只有草稿状态的采购单可以提交审批');
    }

    order.status = PurchaseStatus.PENDING;
    return this.purchaseOrderRepository.save(order);
  }

  // 审批采购单
  async approve(id: string, dto: ApprovePurchaseOrderDto, userId: string): Promise<PurchaseOrder> {
    const order = await this.findOne(id);
    if (order.status !== PurchaseStatus.PENDING) {
      throw new BadRequestException('只有待审批状态的采购单可以审批');
    }

    if (dto.approved) {
      order.status = PurchaseStatus.APPROVED;
      order.approvedBy = userId;
      order.approvedAt = new Date();
    } else {
      order.status = PurchaseStatus.REJECTED;
      if (dto.rejectReason !== undefined) {
        order.rejectReason = dto.rejectReason;
      }
    }

    return this.purchaseOrderRepository.save(order);
  }

  // 下单
  async placeOrder(id: string): Promise<PurchaseOrder> {
    const order = await this.findOne(id);
    if (order.status !== PurchaseStatus.APPROVED) {
      throw new BadRequestException('只有已审批状态的采购单可以下单');
    }

    order.status = PurchaseStatus.ORDERED;
    return this.purchaseOrderRepository.save(order);
  }

  // 入库
  async receive(id: string, dto: ReceivePurchaseOrderDto, userId: string): Promise<PurchaseOrder> {
    const order = await this.findOne(id);
    if (order.status !== PurchaseStatus.ORDERED && order.status !== PurchaseStatus.PARTIAL) {
      throw new BadRequestException('只有已下单或部分入库状态的采购单可以入库');
    }

    await this.dataSource.transaction(async (manager) => {
      let receivedAmount = 0;

      for (const item of dto.items) {
        const orderItem = await manager.findOne(PurchaseOrderItem, {
          where: { purchaseOrderId: id, productId: item.productId },
        });

        if (!orderItem) {
          throw new NotFoundException(`采购明细不存在: ${item.productId}`);
        }

        const newReceivedQty = orderItem.receivedQuantity + item.quantity;
        if (newReceivedQty > orderItem.quantity) {
          throw new BadRequestException(`入库数量超过采购数量: ${item.productId}`);
        }

        orderItem.receivedQuantity = newReceivedQty;
        await manager.save(orderItem);

        // 更新库存
        let stock = await manager.findOne(ProductStock, {
          where: { productId: item.productId },
        });

        if (!stock) {
          stock = manager.create(ProductStock, {
            productId: item.productId,
            quantity: 0,
            warningQuantity: 10,
            maxQuantity: 1000,
          });
        }

        stock.quantity += item.quantity;
        await manager.save(stock);

        receivedAmount += item.quantity * (item.unitPrice || orderItem.unitPrice);
      }

      order.receivedAmount += receivedAmount;

      // 检查是否全部入库
      const allItems = await manager.find(PurchaseOrderItem, {
        where: { purchaseOrderId: id },
      });

      const allReceived = allItems.every((item) => item.receivedQuantity >= item.quantity);
      order.status = allReceived ? PurchaseStatus.COMPLETED : PurchaseStatus.PARTIAL;
    });

    return this.findOne(id);
  }

  // 取消采购单
  async cancel(id: string): Promise<PurchaseOrder> {
    const order = await this.findOne(id);
    if (order.status === PurchaseStatus.COMPLETED || order.status === PurchaseStatus.PARTIAL) {
      throw new BadRequestException('已入库的采购单不能取消');
    }

    order.status = PurchaseStatus.CANCELLED;
    return this.purchaseOrderRepository.save(order);
  }

  // 删除采购单
  async remove(id: string): Promise<void> {
    const order = await this.findOne(id);
    if (order.status !== PurchaseStatus.DRAFT) {
      throw new BadRequestException('只有草稿状态的采购单可以删除');
    }

    await this.purchaseOrderItemRepository.delete({ purchaseOrderId: id });
    await this.purchaseOrderRepository.delete(id);
  }
}
