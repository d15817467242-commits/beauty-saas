import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('service_categories')
export class ServiceCategoryEntity extends BaseEntity {
  @Column({ type: 'text', comment: '分类名称' })
  name: string;

  @Column({ nullable: true, comment: '分类编码' })
  code: string;

  @Column({ nullable: true, type: 'text', comment: '分类描述' })
  description: string;

  @Column({ nullable: true, comment: '分类图标' })
  icon: string;

  @Column({ nullable: true, comment: '分类图片' })
  image: string;

  @Column({ default: 0, type: 'int', comment: '排序权重' })
  sort: number;

  @Column({ type: 'text', default: true, name: 'is_active', comment: '是否启用' })
  isActive: boolean;

  @Column({ nullable: true, name: 'parent_id', comment: '父分类ID' })
  parentId: string;

  // 关联服务项目
  @OneToMany(() => require('./service.entity').Service, (service: any) => service.categoryEntity)
  services: any[];
}
