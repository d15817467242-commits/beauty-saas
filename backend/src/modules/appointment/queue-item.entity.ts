import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Queue } from './queue.entity';
import { Member } from '../member/member.entity';

export enum QueueItemStatus {
  WAITING = 'waiting',     // 等待中
  CALLED = 'called',       // 已叫号
  SERVING = 'serving',     // 服务中
  COMPLETED = 'completed', // 已完成
  CANCELLED = 'cancelled', // 已取消
  NO_SHOW = 'no_show',     // 过号
}

@Entity('queue_items')
@Index(['queueId', 'status'])
@Index(['queueId', 'number'])
@Index(['memberId', 'queueId'])
export class QueueItem extends BaseEntity {
  @Column({ name: 'queue_id', comment: '队列ID' })
  queueId: string;

  @ManyToOne(() => Queue, queue => queue.items)
  @JoinColumn({ name: 'queue_id' })
  queue: Queue;

  @Column({ type: 'text', comment: '排队号码' })
  number: number;

  @Column({ name: 'member_id', nullable: true, comment: '会员ID' })
  memberId: string;

  @ManyToOne(() => Member, { nullable: true })
  @JoinColumn({ name: 'member_id' })
  member: Member;

  @Column({ name: 'guest_name', nullable: true, comment: '散客姓名' })
  guestName: string;

  @Column({ name: 'guest_phone', nullable: true, comment: '散客电话' })
  guestPhone: string;

  @Column({ type: 'text',
    
    
    default: QueueItemStatus.WAITING,
    comment: '状态'})
  status: QueueItemStatus;

  @Column({ 
    type: 'int',
    name: 'wait_count',
    default: 0,
    comment: '前面等待人数' 
  })
  waitCount: number;

  @Column({ 
    type: 'int',
    name: 'estimated_wait_time',
    default: 0,
    comment: '预计等待时间（分钟）' 
  })
  estimatedWaitTime: number;

  @Column({ 
    type: 'datetime',
    name: 'called_at',
    nullable: true,
    comment: '叫号时间' 
  })
  calledAt: Date;

  @Column({ 
    type: 'datetime',
    name: 'serving_at',
    nullable: true,
    comment: '开始服务时间' 
  })
  servingAt: Date;

  @Column({ 
    type: 'datetime',
    name: 'completed_at',
    nullable: true,
    comment: '完成时间' 
  })
  completedAt: Date;

  @Column({ nullable: true, comment: '备注' })
  remark: string;

  @Column({ name: 'created_by', comment: '创建人ID' })
  createdBy: string;
}
