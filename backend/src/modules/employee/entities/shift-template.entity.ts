import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('shift_templates')
export class ShiftTemplate extends BaseEntity {
  @Column({ type: 'text', comment: '班次名称' })
  name: string;

  @Column({ nullable: true, comment: '班次编码' })
  code: string;

  @Column({ type: 'time', name: 'start_time', comment: '上班时间' })
  startTime: string;

  @Column({ type: 'time', name: 'end_time', comment: '下班时间' })
  endTime: string;

  @Column({ nullable: true, type: 'time', name: 'break_start', comment: '休息开始时间' })
  breakStart: string;

  @Column({ nullable: true, type: 'time', name: 'break_end', comment: '休息结束时间' })
  breakEnd: string;

  @Column({ nullable: true, type: 'int', name: 'work_hours', comment: '工作时长(小时)' })
  workHours: number;

  @Column({ nullable: true, type: 'int', name: 'grace_minutes', default: 15, comment: '迟到宽限分钟数' })
  graceMinutes: number;

  @Column({ nullable: true, type: 'text', comment: '备注' })
  remark: string;

  @Column({ type: 'text', default: true, comment: '是否启用' })
  isActive: boolean;
}
