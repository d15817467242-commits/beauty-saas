import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

export enum MovementType {
  IN = 'in',           // 入库
  OUT = 'out',         // 出库
  CHECK = 'check',     // 盘点调整
  TRANSFER = 'transfer', // 调拨
}

@Entity('stock_movements')
export class StockMovement extends BaseEntity {
  @Column({ type: 'uuid', name: 'product_id', comment: '产品ID' })
  productId: string;

  @Column({ type: 'text',
    
    
    comment: '变动类型'})
  movementType: MovementType;

  @Column({ type: 'int', comment: '变动数量（正数为入库，负数为出库）' })
  quantity: number;

  @Column({ type: 'int', name: 'before_quantity', comment: '变动前库存' })
  beforeQuantity: number;

  @Column({ type: 'int', name: 'after_quantity', comment: '变动后库存' })
  afterQuantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'unit_cost', nullable: true, comment: '单位成本' })
  unitCost: number;

  @Column({ name: 'warehouse_id', nullable: true, comment: '仓库ID' })
  warehouseId: string;

  @Column({ name: 'reference_type', nullable: true, comment: '关联单据类型' })
  referenceType: string;

  @Column({ name: 'reference_id', nullable: true, comment: '关联单据ID' })
  referenceId: string;

  @Column({ name: 'reference_no', nullable: true, comment: '关联单据号' })
  referenceNo: string;

  @Column({ nullable: true, comment: '备注' })
  remark: string;

  @Column({ name: 'created_by', nullable: true, comment: '操作人ID' })
  createdBy: string;
}
