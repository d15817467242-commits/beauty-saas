import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('package_items')
export class PackageItem extends BaseEntity {
  @Column({ name: 'package_id', comment: '套餐ID' })
  packageId: string;

  @Column({ name: 'service_id', comment: '服务项目ID' })
  serviceId: string;

  @Column({ default: 1, type: 'int', comment: '服务次数' })
  quantity: number;

  @Column({ nullable: true, type: 'decimal', precision: 10, scale: 2, comment: '单项价格(覆盖服务原价)' })
  overridePrice: number;

  @Column({ nullable: true, type: 'text', comment: '备注说明' })
  remark: string;

  @Column({ default: 0, type: 'int', comment: '排序权重' })
  sort: number;

  // 关联套餐
  @ManyToOne(() => require('./service-package.entity').ServicePackage, (pkg: any) => pkg.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'package_id' })
  package: any;

  // 关联服务项目
  @ManyToOne(() => require('./service.entity').Service, (service: any) => service.packageItems)
  @JoinColumn({ name: 'service_id' })
  service: any;
}
