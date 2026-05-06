import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

export enum StockTransferStatus {
  DRAFT = 'draft',           // 草稿
  PENDING = 'pending',       // 待审批
  APPROVED = 'approved',     // 已审批
  REJECTED = 'rejected',     // 已拒绝
  COMPLETED = 'completed',   // 已完成
  CANCELLED = 'cancelled',   // 已取消
}

@Entity('stock_transfer')
export class StockTransfer extends BaseEntity {
  @Column({ name: 'order_no', comment: '调拨单号' })
  orderNo: string;

  @Column({ nullable: true, comment: '调拨名称' })
  name: string;

  @Column({ name: 'from_warehouse_id', comment: '调出仓库ID' })
  fromWarehouseId: string;

  @Column({ name: 'to_warehouse_id', comment: '调入仓库ID' })
  toWarehouseId: string;

  @Column({ type: 'text',
    
    
    default: StockTransferStatus.DRAFT,
    comment: '调拨状态'})
  status: StockTransferStatus;

  @Column({ name: 'created_by', comment: '申请人ID' })
  createdBy: string;

  @Column({ nullable: true, name: 'approved_by', comment: '审批人ID' })
  approvedBy: string;

  @Column({ type: 'datetime', nullable: true, name: 'approved_at', comment: '审批时间' })
  approvedAt: Date;

  @Column({ nullable: true, name: 'reject_reason', comment: '拒绝原因' })
  rejectReason: string;

  @Column({ nullable: true, comment: '备注' })
  remark: string;

  @OneToMany(() => StockTransferItem, (item) => item.stockTransfer)
  items: StockTransferItem[];
}

@Entity('stock_transfer_items')
export class StockTransferItem extends BaseEntity {
  @Column({ name: 'stock_transfer_id', comment: '调拨单ID' })
  stockTransferId: string;

  @ManyToOne(() => StockTransfer)
  @JoinColumn({ name: 'stock_transfer_id' })
  stockTransfer: StockTransfer;

  @Column({ name: 'product_id', comment: '产品ID' })
  productId: string;

  @Column({ type: 'int', comment: '调拨数量' })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'unit_cost', nullable: true, comment: '单位成本' })
  unitCost: number;

  @Column({ nullable: true, comment: '备注' })
  remark: string;
}
