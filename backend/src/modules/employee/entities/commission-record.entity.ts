import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Employee } from './employee.entity';

export enum CommissionStatus {
  PENDING = 'pending',     // 待发放
  APPROVED = 'approved',   // 已审核
  PAID = 'paid',           // 已发放
  CANCELLED = 'cancelled', // 已取消
}

export enum CommissionSource {
  SERVICE = 'service',     // 服务项目
  PRODUCT = 'product',     // 产品销售
  CARD = 'card',           // 办卡
  RECHARGE = 'recharge',   // 充值
  BONUS = 'bonus',         // 奖金
  ADJUSTMENT = 'adjustment', // 调整
}

@Entity('commission_records')
@Index(['employeeId', 'status'])
@Index(['employeeId', 'period'])
export class CommissionRecord extends BaseEntity {
  @Column({ name: 'employee_id', comment: '员工ID' })
  employeeId: string;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @Column({   name: 'source_type', comment: '来源类型' })
  sourceType: CommissionSource;

  @Column({ name: 'source_id', nullable: true, comment: '来源ID(订单ID/记录ID)' })
  sourceId: string;

  @Column({ name: 'source_no', nullable: true, comment: '来源单号' })
  sourceNo: string;

  @Column({ nullable: true, name: 'source_name', comment: '来源名称(服务名/产品名)' })
  sourceName: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'base_amount', comment: '基础金额' })
  baseAmount: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, name: 'commission_rate', nullable: true, comment: '提成比例(%)' })
  commissionRate: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, comment: '提成金额' })
  amount: number;

  @Column({ type: 'text',
    
    
    default: CommissionStatus.PENDING,
    comment: '状态'})
  status: CommissionStatus;

  @Column({ type: 'varchar', length: 7, comment: '所属周期(YYYY-MM)' })
  period: string;

  @Column({ name: 'rule_id', nullable: true, comment: '提成规则ID' })
  ruleId: string;

  @Column({ nullable: true, type: 'text', comment: '备注' })
  remark: string;

  @Column({ name: 'approved_by', nullable: true, comment: '审核人ID' })
  approvedBy: string;

  @Column({ name: 'approved_at', type: 'datetime', nullable: true, comment: '审核时间' })
  approvedAt: Date;

  @Column({ name: 'paid_at', type: 'datetime', nullable: true, comment: '发放时间' })
  paidAt: Date;
}
