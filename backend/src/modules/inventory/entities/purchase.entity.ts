import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Supplier } from './supplier.entity';

export enum PurchaseStatus {
  DRAFT = 'draft',           // 草稿
  PENDING = 'pending',       // 待审批
  APPROVED = 'approved',     // 已审批
  REJECTED = 'rejected',     // 已拒绝
  ORDERED = 'ordered',       // 已下单
  PARTIAL = 'partial',       // 部分入库
  COMPLETED = 'completed',   // 已完成
  CANCELLED = 'cancelled',   // 已取消
}

@Entity('purchase_orders')
export class PurchaseOrder extends BaseEntity {
  @Column({ type: 'text', comment: '采购单号' })
  orderNo: string;

  @Column({ name: 'supplier_id', comment: '供应商ID' })
  supplierId: string;

  @ManyToOne(() => Supplier)
  @JoinColumn({ name: 'supplier_id' })
  supplier: Supplier;

  @Column({ type: 'text',
    
    
    default: PurchaseStatus.DRAFT,
    comment: '采购状态'})
  status: PurchaseStatus;

  @Column({ type: 'datetime', nullable: true, name: 'expected_date', comment: '预计到货日期' })
  expectedDate: Date;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'total_amount', default: 0, comment: '总金额' })
  totalAmount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'received_amount', default: 0, comment: '已入库金额' })
  receivedAmount: number;

  @Column({ name: 'created_by', comment: '创建人ID' })
  createdBy: string;

  @Column({ nullable: true, name: 'approved_by', comment: '审批人ID' })
  approvedBy: string;

  @Column({ type: 'datetime', nullable: true, name: 'approved_at', comment: '审批时间' })
  approvedAt: Date;

  @Column({ nullable: true, name: 'reject_reason', comment: '拒绝原因' })
  rejectReason: string;

  @Column({ nullable: true, comment: '备注' })
  remark: string;

  @OneToMany(() => PurchaseOrderItem, (item) => item.purchaseOrder)
  items: PurchaseOrderItem[];
}

@Entity('purchase_order_items')
export class PurchaseOrderItem extends BaseEntity {
  @Column({ name: 'purchase_order_id', comment: '采购单ID' })
  purchaseOrderId: string;

  @ManyToOne(() => PurchaseOrder)
  @JoinColumn({ name: 'purchase_order_id' })
  purchaseOrder: PurchaseOrder;

  @Column({ name: 'product_id', comment: '产品ID' })
  productId: string;

  @Column({ type: 'int', comment: '采购数量' })
  quantity: number;

  @Column({ type: 'int', name: 'received_quantity', default: 0, comment: '已入库数量' })
  receivedQuantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'unit_price', comment: '单价' })
  unitPrice: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'total_price', comment: '总价' })
  totalPrice: number;

  @Column({ nullable: true, comment: '备注' })
  remark: string;
}
