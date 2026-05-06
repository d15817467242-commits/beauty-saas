import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Employee } from './employee.entity';

export enum AttendanceStatus {
  NORMAL = 'normal',       // 正常
  LATE = 'late',           // 迟到
  EARLY_LEAVE = 'early',   // 早退
  ABSENT = 'absent',       // 旷工
  LEAVE = 'leave',         // 请假
  OVERTIME = 'overtime',   // 加班
}

@Entity('attendances')
@Index(['employeeId', 'date'], { unique: true })
export class Attendance extends BaseEntity {
  @Column({ name: 'employee_id', comment: '员工ID' })
  employeeId: string;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @Column({ type: 'date', comment: '考勤日期' })
  date: Date;

  @Column({ type: 'datetime', name: 'check_in_time', nullable: true, comment: '签到时间' })
  checkInTime: Date;

  @Column({ type: 'datetime', name: 'check_out_time', nullable: true, comment: '签退时间' })
  checkOutTime: Date;

  @Column({ type: 'time', name: 'scheduled_start', nullable: true, comment: '排班上班时间' })
  scheduledStart: string;

  @Column({ type: 'time', name: 'scheduled_end', nullable: true, comment: '排班下班时间' })
  scheduledEnd: string;

  @Column({
    
    
    name: 'check_in_status',
    nullable: true,
    comment: '签到状态'})
  checkInStatus: AttendanceStatus;

  @Column({
    
    
    name: 'check_out_status',
    nullable: true,
    comment: '签退状态'})
  checkOutStatus: AttendanceStatus;

  @Column({ type: 'int', name: 'work_hours', nullable: true, comment: '工作时长(分钟)' })
  workHours: number;

  @Column({ type: 'int', name: 'overtime_hours', default: 0, comment: '加班时长(分钟)' })
  overtimeHours: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'penalty_amount', default: 0, comment: '扣款金额' })
  penaltyAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'overtime_pay', default: 0, comment: '加班费' })
  overtimePay: number;

  @Column({ name: 'rule_id', nullable: true, comment: '考勤规则ID' })
  ruleId: string;

  @Column({ nullable: true, type: 'text', comment: '备注' })
  remark: string;

  @Column({ nullable: true, name: 'check_in_location', comment: '签到位置' })
  checkInLocation: string;

  @Column({ nullable: true, name: 'check_out_location', comment: '签退位置' })
  checkOutLocation: string;

  @Column({ nullable: true, name: 'check_in_photo', comment: '签到照片' })
  checkInPhoto: string;

  @Column({ nullable: true, name: 'check_out_photo', comment: '签退照片' })
  checkOutPhoto: string;
}
