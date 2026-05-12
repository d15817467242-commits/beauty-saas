import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Service } from '../service/service.entity';

@Entity('consumables')
export class Consumable extends BaseEntity {
  @Column({ type: 'text', comment: '耗材名称' })
  name: string;

  @Column({ nullable: true, name: 'consumable_code', unique: true, comment: '耗材编码' })
  consumableCode: string;

  @Column({ nullable: true, comment: '规格' })
  specification: string;

  @Column({ nullable: true, comment: '单位' })
  unit: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'cost_price', default: 0, comment: '成本价' })
  costPrice: number;

  @Column({ nullable: true, comment: '品牌' })
  brand: string;

  @Column({ nullable: true, comment: '分类' })
  category: string;

  @Column({ nullable: true, comment: '供应商' })
  supplier: string;

  @Column({ type: 'int', default: 0, comment: '库存数量' })
  stock: number;

  @Column({ type: 'int', name: 'warning_stock', default: 10, comment: '库存预警' })
  warningStock: number;

  @Column({ type: 'boolean', default: true, name: 'is_active', comment: '是否启用' })
  isActive: boolean;

  @Column({ nullable: true, comment: '备注' })
  remark: string;
}

@Entity('service_consumables')
export class ServiceConsumable extends BaseEntity {
  @Column({ name: 'service_id', comment: '服务ID' })
  serviceId: string;

  @ManyToOne(() => Service)
  @JoinColumn({ name: 'service_id' })
  service: Service;

  @Column({ name: 'consumable_id', comment: '耗材ID' })
  consumableId: string;

  @ManyToOne(() => Consumable)
  @JoinColumn({ name: 'consumable_id' })
  consumable: Consumable;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 1, comment: '用量' })
  quantity: number;

  @Column({ nullable: true, comment: '备注' })
  remark: string;
}

export enum ConsumableMovementType {
  IN = 'in',           // 入库
  OUT = 'out',         // 出库(服务消耗)
  ADJUST = 'adjust',   // 盘点调整
  WASTE = 'waste',     // 报损
}

@Entity('consumable_movements')
export class ConsumableMovement extends BaseEntity {
  @Column({ name: 'consumable_id', comment: '耗材ID' })
  consumableId: string;

  @ManyToOne(() => Consumable)
  @JoinColumn({ name: 'consumable_id' })
  consumable: Consumable;

  @Column({
    
    
    name: 'movement_type',
    comment: '变动类型'})
  movementType: ConsumableMovementType;

  @Column({ type: 'decimal', precision: 10, scale: 2, comment: '变动数量(正数)' })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'before_stock', comment: '变动前库存' })
  beforeStock: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'after_stock', comment: '变动后库存' })
  afterStock: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'unit_price', nullable: true, comment: '单价' })
  unitPrice: number;

  @Column({ nullable: true, name: 'service_id', comment: '关联服务ID(服务消耗时)' })
  serviceId: string;

  @Column({ nullable: true, name: 'consumption_id', comment: '关联消费记录ID' })
  consumptionId: string;

  @Column({ nullable: true, comment: '备注' })
  remark: string;

  @Column({ name: 'created_by', comment: '操作人ID' })
  createdBy: string;
}
