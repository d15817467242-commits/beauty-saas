import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

export enum StockCheckStatus {
  DRAFT = 'draft',           // 草稿
  IN_PROGRESS = 'in_progress', // 盘点中
  COMPLETED = 'completed',    // 已完成
  CANCELLED = 'cancelled',    // 已取消
}

@Entity('stock_check')
export class StockCheck extends BaseEntity {
  @Column({ name: 'order_no', comment: '盘点单号' })
  orderNo: string;

  @Column({ nullable: true, comment: '盘点名称' })
  name: string;

  @Column({ name: 'warehouse_id', nullable: true, comment: '仓库ID' })
  warehouseId: string;

  @Column({ type: 'text',
    
    
    default: StockCheckStatus.DRAFT,
    comment: '盘点状态'})
  status: StockCheckStatus;

  @Column({ type: 'datetime', nullable: true, name: 'start_time', comment: '开始时间' })
  startTime: Date;

  @Column({ type: 'datetime', nullable: true, name: 'end_time', comment: '结束时间' })
  endTime: Date;

  @Column({ name: 'created_by', comment: '创建人ID' })
  createdBy: string;

  @Column({ nullable: true, name: 'completed_by', comment: '完成人ID' })
  completedBy: string;

  @Column({ nullable: true, comment: '备注' })
  remark: string;

  @OneToMany(() => StockCheckItem, (item) => item.stockCheck)
  items: StockCheckItem[];
}

@Entity('stock_check_items')
export class StockCheckItem extends BaseEntity {
  @Column({ name: 'stock_check_id', comment: '盘点单ID' })
  stockCheckId: string;

  @ManyToOne(() => StockCheck)
  @JoinColumn({ name: 'stock_check_id' })
  stockCheck: StockCheck;

  @Column({ name: 'product_id', comment: '产品ID' })
  productId: string;

  @Column({ type: 'int', name: 'system_quantity', comment: '系统库存' })
  systemQuantity: number;

  @Column({ type: 'int', name: 'actual_quantity', nullable: true, comment: '实际库存' })
  actualQuantity: number;

  @Column({ type: 'int', name: 'difference_quantity', nullable: true, comment: '差异数量' })
  differenceQuantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'unit_cost', nullable: true, comment: '单位成本' })
  unitCost: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'difference_amount', nullable: true, comment: '差异金额' })
  differenceAmount: number;

  @Column({ nullable: true, comment: '备注' })
  remark: string;
}
