import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('attendance_rules')
export class AttendanceRule extends BaseEntity {
  @Column({ type: 'text', comment: '规则名称' })
  name: string;

  @Column({ type: 'time', name: 'standard_start', comment: '标准上班时间' })
  standardStart: string;

  @Column({ type: 'time', name: 'standard_end', comment: '标准下班时间' })
  standardEnd: string;

  @Column({ type: 'int', name: 'late_threshold', default: 15, comment: '迟到阈值(分钟)' })
  lateThreshold: number;

  @Column({ type: 'int', name: 'early_leave_threshold', default: 15, comment: '早退阈值(分钟)' })
  earlyLeaveThreshold: number;

  @Column({ type: 'int', name: 'absent_threshold', default: 60, comment: '旷工阈值(分钟)' })
  absentThreshold: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'late_penalty', default: 0, comment: '迟到扣款' })
  latePenalty: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'early_leave_penalty', default: 0, comment: '早退扣款' })
  earlyLeavePenalty: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'absent_penalty', default: 0, comment: '旷工扣款' })
  absentPenalty: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'overtime_rate', default: 1.5, comment: '加班工资倍率' })
  overtimeRate: number;

  @Column({ type: 'int', name: 'work_days', nullable: true, comment: '工作日(1-7代表周一到周日,逗号分隔)' })
  workDays: string;

  @Column({ type: 'text', default: true, comment: '是否启用' })
  isActive: boolean;

  @Column({ nullable: true, type: 'text', comment: '备注' })
  remark: string;
}
