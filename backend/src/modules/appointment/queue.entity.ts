import { Entity, Column, ManyToOne, OneToMany, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Employee } from '../employee/entities/employee.entity';
import { QueueItem } from './queue-item.entity';

export enum QueueStatus {
  ACTIVE = 'active',       // 活跃中
  PAUSED = 'paused',       // 已暂停
  CLOSED = 'closed',       // 已关闭
}

@Entity('queues')
@Index(['employeeId', 'status'])
@Index(['status', 'createdAt'])
export class Queue extends BaseEntity {
  @Column({ name: 'employee_id', comment: '员工ID（服务队列）' })
  employeeId: string;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @Column({ type: 'text', comment: '队列名称' })
  name: string;

  @Column({ 
    type: 'text',
    nullable: true,
    comment: '队列描述' 
  })
  description: string;

  @Column({ type: 'text',
    
    
    default: QueueStatus.ACTIVE,
    comment: '队列状态'})
  status: QueueStatus;

  @Column({ 
    name: 'current_number',
    default: 0,
    comment: '当前叫号' 
  })
  currentNumber: number;

  @Column({ 
    name: 'next_number',
    default: 1,
    comment: '下一个号码' 
  })
  nextNumber: number;

  @Column({ 
    name: 'max_capacity',
    nullable: true,
    comment: '最大容量' 
  })
  maxCapacity: number;

  @Column({ 
    type: 'date',
    name: 'queue_date',
    comment: '排队日期' 
  })
  queueDate: Date;

  @Column({ 
    name: 'avg_wait_time',
    default: 0,
    comment: '平均等待时间（分钟）' 
  })
  avgWaitTime: number;

  @Column({ name: 'created_by', comment: '创建人ID' })
  createdBy: string;

  @OneToMany(() => QueueItem, item => item.queue)
  items: QueueItem[];
}
