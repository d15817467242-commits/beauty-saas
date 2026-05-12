import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('warehouses')
export class Warehouse extends BaseEntity {
  @Column({ type: 'text', comment: '仓库名称' })
  name: string;

  @Column({ nullable: true, unique: true, comment: '仓库编码' })
  code: string;

  @Column({ nullable: true, name: 'store_id', comment: '所属门店ID' })
  storeId: string;

  @Column({ nullable: true, comment: '地址' })
  address: string;

  @Column({ nullable: true, comment: '负责人' })
  manager: string;

  @Column({ nullable: true, comment: '联系电话' })
  phone: string;

  @Column({ type: 'text', default: true, name: 'is_active', comment: '是否启用' })
  isActive: boolean;

  @Column({ type: 'text', default: false, name: 'is_default', comment: '是否默认仓库' })
  isDefault: boolean;

  @Column({ type: 'int', default: 0, comment: '排序' })
  sort: number;

  @Column({ nullable: true, comment: '备注' })
  remark: string;
}
