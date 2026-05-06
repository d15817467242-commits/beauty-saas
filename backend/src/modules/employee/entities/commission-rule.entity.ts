import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

export enum CommissionRuleType {
  SERVICE = 'service',     // 服务项目提成
  PRODUCT = 'product',     // 产品销售提成
  CARD = 'card',           // 办卡提成
  RECHARGE = 'recharge',   // 充值提成
  TIERED = 'tiered',       // 阶梯提成
}

@Entity('commission_rules')
export class CommissionRule extends BaseEntity {
  @Column({ type: 'text', comment: '规则名称' })
  name: string;

  @Column({   name: 'rule_type', comment: '规则类型' })
  ruleType: CommissionRuleType;

  @Column({ nullable: true, name: 'target_id', comment: '目标ID(服务/产品/卡项ID)' })
  targetId: string;

  @Column({ nullable: true, name: 'target_name', comment: '目标名称' })
  targetName: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, name: 'commission_rate', nullable: true, comment: '提成比例(%)' })
  commissionRate: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'fixed_amount', nullable: true, comment: '固定提成金额' })
  fixedAmount: number;

  @Column({ type: 'text', nullable: true, name: 'tiered_rules', comment: '阶梯提成规则' })
  tieredRules: TieredRule[];

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'min_amount', nullable: true, comment: '最低业绩要求' })
  minAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'max_commission', nullable: true, comment: '最高提成上限' })
  maxCommission: number;

  @Column({ type: 'text', default: true, comment: '是否启用' })
  isActive: boolean;

  @Column({ type: 'int', default: 1, name: 'priority', comment: '优先级(数字越大优先级越高)' })
  priority: number;

  @Column({ nullable: true, type: 'text', comment: '备注' })
  remark: string;
}

export interface TieredRule {
  minAmount: number;  // 最低业绩
  maxAmount: number;  // 最高业绩
  rate: number;       // 提成比例
  fixedAmount?: number; // 固定金额
}
