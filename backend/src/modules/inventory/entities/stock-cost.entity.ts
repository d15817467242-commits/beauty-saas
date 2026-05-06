import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('stock_costs')
export class StockCost extends BaseEntity {
  @Column({ name: 'product_id', comment: '产品ID' })
  productId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'unit_cost', comment: '单位成本' })
  unitCost: number;

  @Column({ type: 'int', name: 'quantity_before', comment: '变动前库存' })
  quantityBefore: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'cost_before', comment: '变动前总成本' })
  costBefore: number;

  @Column({ type: 'int', name: 'quantity_change', comment: '变动数量' })
  quantityChange: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'unit_price', comment: '变动单价' })
  unitPrice: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'cost_change', comment: '变动成本' })
  costChange: number;

  @Column({ type: 'int', name: 'quantity_after', comment: '变动后库存' })
  quantityAfter: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'cost_after', comment: '变动后总成本' })
  costAfter: number;

  @Column({ nullable: true, name: 'related_order_id', comment: '关联订单ID' })
  relatedOrderId: string;

  @Column({ nullable: true, name: 'related_order_type', comment: '关联订单类型' })
  relatedOrderType: string;

  @Column({ nullable: true, comment: '备注' })
  remark: string;

  @Column({ name: 'created_by', nullable: true, comment: '操作人ID' })
  createdBy: string;
}

@Entity('product_cost_summaries')
export class ProductCostSummary extends BaseEntity {
  @Column({ name: 'product_id', comment: '产品ID' })
  productId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'current_unit_cost', comment: '当前单位成本' })
  currentUnitCost: number;

  @Column({ type: 'int', name: 'current_quantity', comment: '当前库存数量' })
  currentQuantity: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'current_total_cost', comment: '当前总成本' })
  currentTotalCost: number;

  @Column({ type: 'datetime', name: 'last_cost_update', comment: '最后成本更新时间' })
  lastCostUpdate: Date;
}
