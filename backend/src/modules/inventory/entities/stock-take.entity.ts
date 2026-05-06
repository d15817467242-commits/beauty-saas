import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

export enum StockTakeStatus {
  DRAFT = 'draft',           // 草稿
  IN_PROGRESS = 'in_progress', // 盘点中
  COMPLETED = 'completed',    // 已完成
  CANCELLED = 'cancelled',    // 已取消
}

@Entity('stock_takes')
export class StockTake extends BaseEntity {
  @Column({ type: 'text', comment: '盘点单号' })
  stockTakeNo: string;

  @Column({ nullable: true, comment: '盘点名称' })
  name: string;

  @Column({ type: 'text',
    
    
    default: StockTakeStatus.DRAFT,
    comment: '盘点状态'})
  status: StockTakeStatus;

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

  @OneToMany(() => StockTakeItem, (item) => item.stockTake)
  items: StockTakeItem[];
}

@Entity('stock_take_items')
export class StockTakeItem extends BaseEntity {
  @Column({ name: 'stock_take_id', comment: '盘点单ID' })
  stockTakeId: string;

  @ManyToOne(() => StockTake)
  @JoinColumn({ name: 'stock_take_id' })
  stockTake: StockTake;

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
