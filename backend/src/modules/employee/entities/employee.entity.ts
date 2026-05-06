import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

export enum EmployeeStatus {
  ACTIVE = 'active',     // 在职
  INACTIVE = 'inactive', // 离职
}

export enum CommissionType {
  PERCENT = 'percent',   // 比例提成
  FIXED = 'fixed',       // 固定提成
  TIERED = 'tiered',     // 阶梯提成
}

@Entity('employees')
export class Employee extends BaseEntity {
  @Column({ type: 'text', comment: '员工姓名' })
  name: string;

  @Column({ unique: true, comment: '工号' })
  employeeNo: string;

  @Column({ nullable: true, comment: '手机号' })
  phone: string;

  @Column({ nullable: true, comment: '职位' })
  position: string;

  @Column({ nullable: true, type: 'date', name: 'hire_date', comment: '入职日期' })
  hireDate: Date;

  @Column({ type: 'text',
    
    
    default: EmployeeStatus.ACTIVE,
    comment: '状态'})
  status: EmployeeStatus;

  @Column({ nullable: true, comment: '头像' })
  avatar: string;

  // ========== 提成设置 ==========

  @Column({ type: 'text',
    
    
    default: CommissionType.PERCENT,
    name: 'commission_type',
    comment: '提成类型'})
  commissionType: CommissionType;

  @Column({ nullable: true, type: 'decimal', precision: 5, scale: 2, name: 'commission_value', comment: '提成值(比例%或固定金额)' })
  commissionValue: number;

  @Column({ nullable: true, type: 'decimal', precision: 5, scale: 2, name: 'base_commission_rate', comment: '基础提成比例(%)' })
  baseCommissionRate: number;

  @Column({ nullable: true, type: 'text', comment: '阶梯提成规则' })
  tieredCommissionRules: TieredCommissionRule[];

  @Column({ nullable: true, type: 'text', comment: '服务项目提成规则' })
  serviceCommissionRules: Record<string, number>;

  // ========== 业绩统计 ==========

  @Column({ default: 0, name: 'total_sales', type: 'decimal', precision: 10, scale: 2, comment: '累计业绩' })
  totalSales: number;

  @Column({ default: 0, name: 'total_commission', type: 'decimal', precision: 10, scale: 2, comment: '累计提成' })
  totalCommission: number;

  // ========== 薪资信息 ==========

  @Column({ nullable: true, type: 'decimal', precision: 10, scale: 2, name: 'base_salary', comment: '基本工资' })
  baseSalary: number;

  @Column({ nullable: true, type: 'decimal', precision: 10, scale: 2, comment: '奖金' })
  bonus: number;
}

export interface TieredCommissionRule {
  minAmount: number;  // 最低业绩
  maxAmount: number;  // 最高业绩
  rate: number;       // 提成比例
}
