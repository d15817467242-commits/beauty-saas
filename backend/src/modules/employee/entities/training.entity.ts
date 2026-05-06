import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Employee } from './employee.entity';
import { TrainingCourse } from './training-course.entity';

export enum TrainingStatus {
  ENROLLED = 'enrolled',     // 已报名
  IN_PROGRESS = 'progress',  // 进行中
  COMPLETED = 'completed',   // 已完成
  FAILED = 'failed',         // 未通过
  CANCELLED = 'cancelled',   // 已取消
}

@Entity('trainings')
@Index(['employeeId', 'courseId'])
export class Training extends BaseEntity {
  @Column({ name: 'employee_id', comment: '员工ID' })
  employeeId: string;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @Column({ name: 'course_id', comment: '课程ID' })
  courseId: string;

  @ManyToOne(() => TrainingCourse)
  @JoinColumn({ name: 'course_id' })
  course: TrainingCourse;

  @Column({ type: 'text',
    
    
    default: TrainingStatus.ENROLLED,
    comment: '状态'})
  status: TrainingStatus;

  @Column({ type: 'datetime', name: 'enrolled_at', nullable: true, comment: '报名时间' })
  enrolledAt: Date;

  @Column({ type: 'datetime', name: 'started_at', nullable: true, comment: '开始时间' })
  startedAt: Date;

  @Column({ type: 'datetime', name: 'completed_at', nullable: true, comment: '完成时间' })
  completedAt: Date;

  @Column({ type: 'int', name: 'progress', default: 0, comment: '进度(%)' })
  progress: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, name: 'score', nullable: true, comment: '考试成绩' })
  score: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, name: 'pass_score', nullable: true, comment: '及格分数' })
  passScore: number;

  @Column({ type: 'int', name: 'time_spent', default: 0, comment: '学习时长(分钟)' })
  timeSpent: number;

  @Column({ name: 'certificate_no', nullable: true, comment: '证书编号' })
  certificateNo: string;

  @Column({ name: 'certificate_url', nullable: true, comment: '证书链接' })
  certificateUrl: string;

  @Column({ nullable: true, type: 'text', comment: '备注' })
  remark: string;

  @Column({ name: 'rated_by', nullable: true, comment: '评价人' })
  ratedBy: string;

  @Column({ type: 'int', name: 'rating', nullable: true, comment: '评分(1-5)' })
  rating: number;

  @Column({ nullable: true, type: 'text', name: 'feedback', comment: '反馈意见' })
  feedback: string;
}
