import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Member } from '../member/member.entity';
import { CountCardPackage } from './count-card-package.entity';

export enum MemberCountCardStatus {
  ACTIVE = 'active',     // 有效
  EXPIRED = 'expired',   // 已过期
  USED_UP = 'used_up',   // 已用完
}

@Entity('member_count_cards')
@Index(['memberId', 'status'])
export class MemberCountCard extends BaseEntity {
  @Column({ name: 'member_id', comment: '会员ID' })
  memberId: string;

  @ManyToOne(() => Member)
  @JoinColumn({ name: 'member_id' })
  member: Member;

  @Column({ name: 'package_id', comment: '次卡套餐ID' })
  packageId: string;

  @ManyToOne(() => CountCardPackage)
  @JoinColumn({ name: 'package_id' })
  package: CountCardPackage;

  @Column({ name: 'order_no', comment: '购买订单号' })
  orderNo: string;

  @Column({ type: 'int', name: 'total_count', comment: '总次数(含赠送)' })
  totalCount: number;

  @Column({ type: 'int', name: 'remaining_count', comment: '剩余次数' })
  remainingCount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'purchase_price', comment: '购买价格' })
  purchasePrice: number;

  @Column({ type: 'date', name: 'expire_date', nullable: true, comment: '过期日期(空表示永久有效)' })
  expireDate: Date;

  @Column({ type: 'text',
    
    
    default: MemberCountCardStatus.ACTIVE,
    comment: '状态'})
  status: MemberCountCardStatus;

  @Column({ nullable: true, type: 'text', name: 'usage_records', comment: '使用记录' })
  usageRecords: CountCardUsageRecord[];

  @Column({ name: 'created_by', comment: '操作人ID' })
  createdBy: string;
}

export interface CountCardUsageRecord {
  date: string;
  consumptionId: string;
  serviceId: string;
  serviceName: string;
  employeeId?: string;
  employeeName?: string;
  count: number;
}
