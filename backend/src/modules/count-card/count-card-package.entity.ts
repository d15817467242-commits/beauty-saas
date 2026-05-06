import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('count_card_packages')
export class CountCardPackage extends BaseEntity {
  @Column({ type: 'text', comment: '次卡名称' })
  name: string;

  @Column({ nullable: true, comment: '次卡编码' })
  code: string;

  @Column({ type: 'int', comment: '次数' })
  count: number;

  @Column({ type: 'int', nullable: true, name: 'gift_count', comment: '赠送次数' })
  giftCount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, comment: '价格' })
  price: number;

  @Column({ type: 'int', nullable: true, name: 'valid_days', comment: '有效天数(0表示永久有效)' })
  validDays: number;

  @Column({ type: 'int', nullable: true, name: 'validity_months', comment: '有效月数' })
  validityMonths: number;

  @Column({ nullable: true, comment: '图片' })
  image: string;

  @Column({ nullable: true, type: 'text', name: 'applicable_services', comment: '适用服务ID列表(空表示全部适用)' })
  applicableServices: string[];

  @Column({ nullable: true, comment: '描述' })
  description: string;

  @Column({ type: 'text', default: true, name: 'is_active', comment: '是否启用' })
  isActive: boolean;
}
