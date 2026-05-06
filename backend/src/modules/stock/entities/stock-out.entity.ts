import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

export enum StockOutStatus {
  DRAFT = 'draft',           // 草稿
  PENDING = 'pending',       // 待审核
  APPROVED = 'approved',     // 已审核
  CANCELLED = 'cancelled',   // 已取消
}

export enum StockOutType {
  SALE = 'sale',             // 销售
  LOSS = 'loss',             // 报损
  RETURN = 'return',         // 退货
  OTHER = 'other',           // 其他
}

@Entity('stock_out')
export class StockOut extends BaseEntity {
  @Column({ name: 'order_no', comment: '出库单号' })
  orderNo: string;

  @Column({ type: 'text',
    
    
    default: StockOutType.SALE,
    comment: '出库类型'})
  type: StockOutType;

  @Column({ name: 'warehouse_id', nullable: true, comment: '仓库ID' })
  warehouseId: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'total_amount', default: 0, comment: '总金额' })
  totalAmount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'cost_amount', default: 0, comment: '成本金额' })
  costAmount: number;

  @Column({ type: 'text',
    
    
    default: StockOutStatus.DRAFT,
    comment: '状态'})
  status: StockOutStatus;

  @Column({ name: 'created_by', comment: '创建人ID' })
  createdBy: string;

  @Column({ nullable: true, name: 'approved_by', comment: '审核人ID' })
  approvedBy: string;

  @Column({ type: 'datetime', nullable: true, name: 'approved_at', comment: '审核时间' })
  approvedAt: Date;

  @Column({ nullable: true, comment: '备注' })
  remark: string;

  @OneToMany(() => StockOutItem, (item) => item.stockOut)
  items: StockOutItem[];
}

@Entity('stock_out_items')
export class StockOutItem extends BaseEntity {
  @Column({ name: 'stock_out_id', comment: '出库单ID' })
  stockOutId: string;

  @ManyToOne(() => StockOut)
  @JoinColumn({ name: 'stock_out_id' })
  stockOut: StockOut;

  @Column({ name: 'product_id', comment: '产品ID' })
  productId: string;

  @Column({ type: 'int', comment: '出库数量' })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'unit_price', comment: '销售单价' })
  unitPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'cost_price', comment: '成本单价' })
  costPrice: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'total_price', comment: '销售总价' })
  totalPrice: number;

  @Column({ nullable: true, comment: '备注' })
  remark: string;
}
