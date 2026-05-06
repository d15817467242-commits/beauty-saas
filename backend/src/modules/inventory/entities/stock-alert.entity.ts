import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

export enum AlertType {
  LOW_STOCK = 'low_stock',       // 库存不足
  OVER_STOCK = 'over_stock',     // 库存过剩
  EXPIRATION = 'expiration',     // 即将过期
  SLOW_MOVING = 'slow_moving',   // 滞销预警
}

export enum AlertStatus {
  PENDING = 'pending',     // 待处理
  HANDLED = 'handled',     // 已处理
  IGNORED = 'ignored',     // 已忽略
}

@Entity('stock_alert_rules')
export class StockAlertRule extends BaseEntity {
  @Column({ type: 'text', comment: '规则名称' })
  name: string;

  @Column({ type: 'text',
    
    
    comment: '预警类型'})
  alertType: AlertType;

  @Column({ nullable: true, comment: '产品分类' })
  category: string;

  @Column({ type: 'int', nullable: true, name: 'threshold_value', comment: '阈值' })
  thresholdValue: number;

  @Column({ type: 'int', nullable: true, name: 'days_threshold', comment: '天数阈值(用于过期/滞销)' })
  daysThreshold: number;

  @Column({ type: 'text', default: true, name: 'is_active', comment: '是否启用' })
  isActive: boolean;

  @Column({ nullable: true, comment: '通知接收人(逗号分隔)' })
  notifyUsers: string;

  @Column({ nullable: true, comment: '备注' })
  remark: string;
}

@Entity('stock_alerts')
export class StockAlert extends BaseEntity {
  @Column({ name: 'rule_id', nullable: true, comment: '规则ID' })
  ruleId: string;

  @ManyToOne(() => StockAlertRule)
  @JoinColumn({ name: 'rule_id' })
  rule: StockAlertRule;

  @Column({ type: 'text',
    
    
    comment: '预警类型'})
  alertType: AlertType;

  @Column({ name: 'product_id', comment: '产品ID' })
  productId: string;

  @Column({ type: 'int', name: 'current_quantity', comment: '当前库存' })
  currentQuantity: number;

  @Column({ type: 'int', name: 'threshold_value', comment: '阈值' })
  thresholdValue: number;

  @Column({ type: 'text',
    
    
    default: AlertStatus.PENDING,
    comment: '预警状态'})
  status: AlertStatus;

  @Column({ nullable: true, comment: '预警消息' })
  message: string;

  @Column({ type: 'datetime', nullable: true, name: 'handled_at', comment: '处理时间' })
  handledAt: Date;

  @Column({ nullable: true, name: 'handled_by', comment: '处理人ID' })
  handledBy: string;

  @Column({ nullable: true, name: 'handle_remark', comment: '处理备注' })
  handleRemark: string;
}
