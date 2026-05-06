import { Entity, Column, ManyToOne, JoinColumn, OneToMany, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

export enum GiftStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  OUT_OF_STOCK = 'out',
}

export enum GiftType {
  PHYSICAL = 'physical',
  VIRTUAL = 'virtual',
  SERVICE = 'service',
  COUPON = 'coupon',
}

@Entity('gifts')
export class Gift extends BaseEntity {
  @Column({ length: 100, comment: '礼品名称' })
  name: string;

  @Column({ length: 100, nullable: true, comment: '礼品编码' })
  code?: string;

  @Column({
    type: 'text',
    default: GiftType.PHYSICAL,
    comment: '礼品类型'
  })
  type: GiftType;

  @Column({ length: 100, nullable: true, comment: '分类' })
  category?: string;

  @Column({ type: 'text', nullable: true, comment: '礼品描述' })
  description?: string;

  @Column({ type: 'text', nullable: true, comment: '礼品图片' })
  image?: string;

  @Column({ type: 'int', default: 0, comment: '所需积分' })
  points: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, comment: '礼品价值' })
  value: number;

  @Column({ type: 'int', default: 0, comment: '库存数量' })
  stock: number;

  @Column({ type: 'int', default: 0, comment: '已兑换数量' })
  exchangedCount: number;

  @Column({ type: 'int', default: 0, comment: '每人限兑数量(0不限)' })
  limitPerMember: number;

  @Column({
    type: 'text',
    default: GiftStatus.ACTIVE,
    comment: '状态'
  })
  status: GiftStatus;

  @Column({ type: 'datetime', nullable: true, name: 'start_time', comment: '开始时间' })
  startTime?: Date;

  @Column({ type: 'datetime', nullable: true, name: 'end_time', comment: '结束时间' })
  endTime?: Date;

  @Column({ type: 'int', default: 0, comment: '排序' })
  sort: number;

  @Column({ type: 'text', nullable: true, comment: '扩展属性' })
  extra?: Record<string, any>;
}

@Entity('gift_exchanges')
@Index(['memberId', 'giftId'])
export class GiftExchange extends BaseEntity {
  @Column({ name: 'member_id', comment: '会员ID' })
  memberId: string;

  @Column({ name: 'gift_id', comment: '礼品ID' })
  giftId: string;

  @ManyToOne(() => Gift)
  @JoinColumn({ name: 'gift_id' })
  gift: Gift;

  @Column({ type: 'int', comment: '兑换数量' })
  quantity: number;

  @Column({ type: 'int', comment: '消耗积分' })
  pointsCost: number;

  @Column({
    type: 'text',
    default: 'pending',
    comment: '状态'
  })
  status: 'pending' | 'completed' | 'cancelled';

  @Column({ type: 'text', nullable: true, comment: '收货地址' })
  address?: string;

  @Column({ length: 20, nullable: true, comment: '联系电话' })
  phone?: string;

  @Column({ length: 50, nullable: true, comment: '收货人' })
  receiver?: string;

  @Column({ type: 'text', nullable: true, comment: '备注' })
  remark?: string;

  @Column({ type: 'datetime', nullable: true, comment: '完成时间' })
  completedAt?: Date;

  @Column({ nullable: true, name: 'completed_by', comment: '完成人ID' })
  completedBy?: string;
}
