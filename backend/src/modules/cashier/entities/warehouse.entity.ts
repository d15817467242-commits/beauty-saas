import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('warehouses')
export class Warehouse extends BaseEntity {
  @Column({ type: 'text', comment: '仓库名称' })
  name: string;

  @Column({ nullable: true, name: 'warehouse_code', unique: true, comment: '仓库编码' })
  warehouseCode: string;

  @Column({ nullable: true, comment: '仓库地址' })
  address: string;

  @Column({ nullable: true, comment: '联系人' })
  contact: string;

  @Column({ nullable: true, comment: '联系电话' })
  phone: string;

  @Column({ nullable: true, type: 'decimal', precision: 10, scale: 2, name: 'area_size', comment: '面积(平方米)' })
  areaSize: number;

  @Column({ nullable: true, comment: '仓库位置' })
  location: string;

  @Column({ type: 'text', default: true, name: 'is_default', comment: '是否默认仓库' })
  isDefault: boolean;

  @Column({ type: 'text', default: true, name: 'is_active', comment: '是否启用' })
  isActive: boolean;

  @Column({ type: 'text', default: 0, comment: '排序' })
  sort: number;

  @Column({ nullable: true, comment: '备注' })
  remark: string;
}
