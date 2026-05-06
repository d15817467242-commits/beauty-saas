import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Employee } from './employee.entity';
import { ShiftTemplate } from './shift-template.entity';

export enum ScheduleStatus {
  SCHEDULED = 'scheduled',   // 已排班
  COMPLETED = 'completed',   // 已完成
  ABSENT = 'absent',         // 缺勤
  LEAVE = 'leave',           // 请假
}

@Entity('work_schedules')
@Index(['employeeId', 'scheduleDate'], { unique: true })
export class WorkSchedule extends BaseEntity {
  @Column({ name: 'employee_id', comment: '员工ID' })
  employeeId: string;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @Column({ name: 'shift_id', nullable: true, comment: '班次模板ID' })
  shiftId: string;

  @ManyToOne(() => ShiftTemplate, { nullable: true })
  @JoinColumn({ name: 'shift_id' })
  shift: ShiftTemplate;

  @Column({ type: 'date', name: 'schedule_date', comment: '排班日期' })
  scheduleDate: Date;

  @Column({ type: 'time', name: 'actual_start', nullable: true, comment: '实际上班时间' })
  actualStart: string;

  @Column({ type: 'time', name: 'actual_end', nullable: true, comment: '实际下班时间' })
  actualEnd: string;

  @Column({ type: 'text',
    
    
    default: ScheduleStatus.SCHEDULED,
    comment: '状态'})
  status: ScheduleStatus;

  @Column({ nullable: true, type: 'text', comment: '备注' })
  remark: string;
}
