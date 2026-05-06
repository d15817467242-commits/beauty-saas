import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

export enum PackageStatus {
  DRAFT = 'draft',           // 草稿
  PUBLISHED = 'published',   // 已发布
  OFFLINE = 'offline',       // 已下架
}

@Entity('service_packages')
export class ServicePackage extends BaseEntity {
  @Column({ type: 'text', comment: '套餐名称' })
  name: string;

  @Column({ nullable: true, comment: '套餐编码' })
  code: string;

  @Column({ nullable: true, type: 'text', comment: '套餐描述' })
  description: string;

  @Column({ nullable: true, type: 'simple-array', comment: '套餐图片URL列表' })
  images: string[];

  @Column({ type: 'decimal', precision: 10, scale: 2, comment: '原价(套餐内服务总价)' })
  originalPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, comment: '套餐价' })
  packagePrice: number;

  @Column({ nullable: true, type: 'decimal', precision: 10, scale: 2, comment: '会员价' })
  memberPrice: number;

  @Column({ nullable: true, type: 'int', comment: '有效天数(0表示永久有效)' })
  validDays: number;

  @Column({ nullable: true, type: 'int', comment: '可使用次数(0表示不限次数)' })
  usageLimit: number;

  @Column({ type: 'text',
    
    
    default: PackageStatus.DRAFT,
    comment: '套餐状态'})
  status: PackageStatus;

  @Column({ default: 0, type: 'int', comment: '排序权重' })
  sort: number;

  @Column({ type: 'text', default: true, name: 'is_active', comment: '是否启用' })
  isActive: boolean;

  @Column({ nullable: true, type: 'datetime', name: 'start_time', comment: '开始时间' })
  startTime: Date;

  @Column({ nullable: true, type: 'datetime', name: 'end_time', comment: '结束时间' })
  endTime: Date;

  // 关联套餐项目
  @OneToMany(() => require('./package-item.entity').PackageItem, (item: any) => item.package)
  items: any[];
}
