import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Service } from '../service/service.entity';

export enum GroupBuyStatus {
  DRAFT = 'draft',         // 草稿
  ACTIVE = 'active',       // 进行中
  ENDED = 'ended',         // 已结束
}

@Entity('group_buys')
export class GroupBuy extends BaseEntity {
  @Column({ type: 'text', comment: '活动名称' })
  name: string;

  @Column({ name: 'service_id', comment: '服务ID' })
  serviceId: string;

  @ManyToOne(() => Service)
  @JoinColumn({ name: 'service_id' })
  service: Service;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'original_price', comment: '原价' })
  originalPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'group_price', comment: '拼团价' })
  groupPrice: number;

  @Column({ type: 'int', name: 'min_people', comment: '最少成团人数' })
  minPeople: number;

  @Column({ type: 'int', name: 'max_people', default: 0, comment: '最大参团人数(0为不限)' })
  maxPeople: number;

  @Column({ type: 'int', name: 'time_limit', default: 24, comment: '成团时限(小时)' })
  timeLimit: number;

  @Column({ type: 'int', name: 'total_stock', default: -1, comment: '库存总量(-1为无限)' })
  totalStock: number;

  @Column({ type: 'int', name: 'sold_count', default: 0, comment: '已售数量' })
  soldCount: number;

  @Column({ type: 'int', name: 'per_limit', default: 1, comment: '每人限购数量' })
  perLimit: number;

  @Column({ type: 'datetime', name: 'start_time', comment: '开始时间' })
  startTime: Date;

  @Column({ type: 'datetime', name: 'end_time', comment: '结束时间' })
  endTime: Date;

  @Column({ type: 'text',
    
    
    default: GroupBuyStatus.DRAFT,
    comment: '状态'})
  status: GroupBuyStatus;

  @Column({ nullable: true, comment: '活动说明' })
  description: string;

  @Column({ name: 'created_by', comment: '创建人ID' })
  createdBy: string;
}

export enum GroupStatus {
  PENDING = 'pending',     // 待成团
  SUCCESS = 'success',     // 成团成功
  FAILED = 'failed',       // 成团失败
}

@Entity('groups')
export class Group extends BaseEntity {
  @Column({ name: 'group_buy_id', comment: '拼团活动ID' })
  groupBuyId: string;

  @ManyToOne(() => GroupBuy)
  @JoinColumn({ name: 'group_buy_id' })
  groupBuy: GroupBuy;

  @Column({ name: 'leader_id', comment: '团长会员ID' })
  leaderId: string;

  @Column({ type: 'int', name: 'current_people', default: 1, comment: '当前人数' })
  currentPeople: number;

  @Column({ type: 'text',
    
    
    default: GroupStatus.PENDING,
    comment: '成团状态'})
  status: GroupStatus;

  @Column({ type: 'datetime', name: 'expire_time', comment: '过期时间' })
  expireTime: Date;

  @Column({ type: 'datetime', nullable: true, name: 'complete_time', comment: '成团时间' })
  completeTime: Date;
}

@Entity('group_participants')
export class GroupParticipant extends BaseEntity {
  @Column({ name: 'group_id', comment: '团ID' })
  groupId: string;

  @ManyToOne(() => Group)
  @JoinColumn({ name: 'group_id' })
  group: Group;

  @Column({ name: 'member_id', comment: '会员ID' })
  memberId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'paid_amount', comment: '支付金额' })
  paidAmount: number;

  @Column({ type: 'datetime', name: 'join_time', comment: '参团时间' })
  joinTime: Date;

  @Column({ type: 'text', default: false, name: 'is_leader', comment: '是否团长' })
  isLeader: boolean;

  @Column({ name: 'order_id', nullable: true, comment: '订单ID' })
  orderId: string;
}
