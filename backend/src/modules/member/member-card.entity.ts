import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Member } from './member.entity';

export enum MemberCardStatus {
  ACTIVE = 'active',     // 正常
  FROZEN = 'frozen',     // 冻结
  EXPIRED = 'expired',   // 已过期
  CANCELLED = 'cancelled', // 已注销
}

export enum MemberCardType {
  BALANCE = 'balance',   // 储值卡
  COUNT = 'count',       // 次卡
  DISCOUNT = 'discount', // 折扣卡
}

@Entity('member_cards')
export class MemberCard extends BaseEntity {
  @Column({ name: 'member_id', comment: '会员ID' })
  memberId: string;

  @ManyToOne(() => Member)
  @JoinColumn({ name: 'member_id' })
  member: Member;

  @Column({ type: 'text', comment: '卡号' })
  cardNo: string;

  @Column({ type: 'text', comment: '卡名称' })
  name: string;

  @Column({ type: 'text',
    
    
    default: MemberCardType.BALANCE,
    name: 'card_type',
    comment: '卡类型'})
  cardType: MemberCardType;

  @Column({ type: 'text',
    
    
    default: MemberCardStatus.ACTIVE,
    comment: '状态'})
  status: MemberCardStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, comment: '余额/次数' })
  balance: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, name: 'initial_balance', comment: '初始余额' })
  initialBalance: number;

  @Column({ type: 'date', nullable: true, name: 'expire_date', comment: '过期日期' })
  expireDate: Date;

  @Column({ nullable: true, comment: '备注' })
  remark: string;
}
