import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Supplier } from './supplier.entity';

export enum StockInStatus {
  DRAFT = 'draft',           // 草稿
  PENDING = 'pending',       // 待审核
  APPROVED = 'approved',     // 已审核
  CANCELLED = 'cancelled',   // 已取消
}

@Entity('stock_in')
export class StockIn extends BaseEntity {
  @Column({ name: 'order_no', comment: '入库单号' })
  orderNo: string;

  @Column({ name: 'supplier_id', nullable: true, comment: '供应商ID' })
  supplierId: string;

  @ManyToOne(() => Supplier, { nullable: true })
  @JoinColumn({ name: 'supplier_id' })
  supplier: Supplier;

  @Column({ name: 'warehouse_id', nullable: true, comment: '仓库ID' })
  warehouseId: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'total_amount', default: 0, comment: '总金额' })
  totalAmount: number;

  @Column({ type: 'text',
    
    
    default: StockInStatus.DRAFT,
    comment: '状态'})
  status: StockInStatus;

  @Column({ name: 'created_by', comment: '创建人ID' })
  createdBy: string;

  @Column({ nullable: true, name: 'approved_by', comment: '审核人ID' })
  approvedBy: string;

  @Column({ type: 'datetime', nullable: true, name: 'approved_at', comment: '审核时间' })
  approvedAt: Date;

  @Column({ nullable: true, comment: '备注' })
  remark: string;

  @OneToMany(() => StockInItem, (item) => item.stockIn)
  items: StockInItem[];
}

@Entity('stock_in_items')
export class StockInItem extends BaseEntity {
  @Column({ name: 'stock_in_id', comment: '入库单ID' })
  stockInId: string;

  @ManyToOne(() => StockIn)
  @JoinColumn({ name: 'stock_in_id' })
  stockIn: StockIn;

  @Column({ name: 'product_id', comment: '产品ID' })
  productId: string;

  @Column({ type: 'int', comment: '入库数量' })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'unit_price', comment: '单价' })
  unitPrice: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'total_price', comment: '总价' })
  totalPrice: number;

  @Column({ nullable: true, comment: '备注' })
  remark: string;
}
