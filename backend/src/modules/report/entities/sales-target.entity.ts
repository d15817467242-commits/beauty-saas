import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

export enum TargetPeriod {
  DAILY = 'daily',     // 日目标
  WEEKLY = 'weekly',   // 周目标
  MONTHLY = 'monthly', // 月目标
  YEARLY = 'yearly',   // 年目标
}

@Entity('sales_targets')
export class SalesTarget extends BaseEntity {
  @Column({ type: 'text', comment: '目标名称' })
  name: string;

  @Column({
    
    
    name: 'period_type',
    comment: '目标周期类型'})
  periodType: TargetPeriod;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'target_amount', comment: '目标金额' })
  targetAmount: number;

  @Column({ type: 'date', name: 'start_date', comment: '开始日期' })
  startDate: Date;

  @Column({ type: 'date', name: 'end_date', comment: '结束日期' })
  endDate: Date;

  @Column({ nullable: true, name: 'store_id', comment: '门店ID' })
  storeId: string;

  @Column({ nullable: true, name: 'employee_id', comment: '员工ID（个人目标）' })
  employeeId: string;

  @Column({ default: 0, type: 'decimal', precision: 12, scale: 2, name: 'achieved_amount', comment: '已完成金额' })
  achievedAmount: number;

  @Column({ default: 0, type: 'decimal', precision: 5, scale: 2, name: 'completion_rate', comment: '完成率(%)' })
  completionRate: number;

  @Column({ nullable: true, type: 'text', comment: '扩展数据' })
  metadata: Record<string, any>;

  @Column({ name: 'created_by', comment: '创建人ID' })
  createdBy: string;
}
