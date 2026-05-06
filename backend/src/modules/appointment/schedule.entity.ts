import { Entity, Column, ManyToOne, JoinColumn, Index, Unique } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Employee } from '../employee/entities/employee.entity';

export enum ScheduleType {
  WORK = 'work',       // 上班
  REST = 'rest',       // 休息
  LEAVE = 'leave',     // 请假
}

@Entity('schedules')
@Unique(['employeeId', 'date'])
@Index(['employeeId', 'date'])
export class Schedule extends BaseEntity {
  @Column({ name: 'employee_id', comment: '员工ID' })
  employeeId: string;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @Column({ type: 'date', comment: '日期' })
  date: Date;

  @Column({ type: 'text',
    
    
    default: ScheduleType.WORK,
    comment: '类型'})
  type: ScheduleType;

  @Column({ type: 'time', name: 'start_time', nullable: true, comment: '上班时间' })
  startTime: string;

  @Column({ type: 'time', name: 'end_time', nullable: true, comment: '下班时间' })
  endTime: string;

  @Column({ nullable: true, comment: '备注' })
  remark: string;

  @Column({ name: 'created_by', comment: '创建人ID' })
  createdBy: string;
}
