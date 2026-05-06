import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Member } from '../member/member.entity';

export enum CreditStatus {
  PENDING = 'pending',     // 待还款
  PARTIAL = 'partial',     // 部分还款
  SETTLED = 'settled',     // 已结清
  OVERDUE = 'overdue',     // 已逾期
}

@Entity('credits')
export class Credit extends BaseEntity {
  @Column({ name: 'member_id', comment: '会员ID' })
  memberId: string;

  @ManyToOne(() => Member)
  @JoinColumn({ name: 'member_id' })
  member: Member;

  @Column({ name: 'order_id', comment: '关联订单ID' })
  orderId: string;

  @Column({ name: 'order_no', comment: '订单号' })
  orderNo: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'total_amount', comment: '挂账总金额' })
  totalAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'paid_amount', default: 0, comment: '已还金额' })
  paidAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'remaining_amount', comment: '剩余金额' })
  remainingAmount: number;

  @Column({ type: 'text',
    
    
    default: CreditStatus.PENDING,
    comment: '状态'})
  status: CreditStatus;

  @Column({ type: 'datetime', name: 'credit_time', comment: '挂账时间' })
  creditTime: Date;

  @Column({ type: 'datetime', nullable: true, name: 'due_time', comment: '应还时间' })
  dueTime: Date;

  @Column({ type: 'datetime', nullable: true, name: 'settle_time', comment: '结清时间' })
  settleTime: Date;

  @Column({ nullable: true, comment: '备注' })
  remark: string;

  @Column({ name: 'created_by', comment: '操作人ID' })
  createdBy: string;
}

@Entity('credit_payments')
export class CreditPayment extends BaseEntity {
  @Column({ name: 'credit_id', comment: '挂账记录ID' })
  creditId: string;

  @ManyToOne(() => Credit)
  @JoinColumn({ name: 'credit_id' })
  credit: Credit;

  @Column({ type: 'decimal', precision: 10, scale: 2, comment: '还款金额' })
  amount: number;

  @Column({ type: 'datetime', name: 'payment_time', comment: '还款时间' })
  paymentTime: Date;

  @Column({ nullable: true, comment: '支付方式' })
  paymentMethod: string;

  @Column({ nullable: true, comment: '备注' })
  remark: string;

  @Column({ name: 'created_by', comment: '操作人ID' })
  createdBy: string;
}
