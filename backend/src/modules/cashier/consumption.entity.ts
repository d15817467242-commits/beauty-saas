import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Member } from '../member/member.entity';
import { Employee } from '../employee/entities/employee.entity';
import { Service } from '../service/service.entity';
import { MemberCard } from '../member/member-card.entity';

export enum PaymentMethod {
  CASH = 'cash',           // 现金
  WECHAT = 'wechat',       // 微信
  ALIPAY = 'alipay',       // 支付宝
  CARD = 'card',           // 会员卡
  COUNT_CARD = 'count_card', // 次卡
  MIXED = 'mixed',         // 混合支付
}

export enum ConsumptionType {
  SERVICE = 'service',     // 服务消费
  RECHARGE = 'recharge',   // 充值
  PRODUCT = 'product',     // 产品购买
}

export enum DiscountType {
  NONE = 'none',           // 无优惠
  MEMBER = 'member',       // 会员优惠
  COUPON = 'coupon',       // 优惠券
  ACTIVITY = 'activity',   // 活动
  CUSTOM = 'custom',       // 自定义
}

@Entity('consumptions')
export class Consumption extends BaseEntity {
  @Column({ name: 'order_no', unique: true, comment: '订单号' })
  orderNo: string;

  @Column({ name: 'manual_order_no', nullable: true, comment: '手工单号' })
  manualOrderNo: string;

  @Column({ name: 'warehouse_id', nullable: true, comment: '仓库ID' })
  warehouseId: string;

  @Column({ name: 'member_id', nullable: true, comment: '会员ID' })
  memberId: string;

  @ManyToOne(() => Member, { nullable: true })
  @JoinColumn({ name: 'member_id' })
  member: Member;

  @Column({ type: 'text',
    
    
    default: ConsumptionType.SERVICE,
    name: 'consumption_type',
    comment: '消费类型'})
  consumptionType: ConsumptionType;

  @Column({ type: 'decimal', precision: 10, scale: 2, comment: '消费金额' })
  amount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'total_amount', nullable: true, comment: '总金额' })
  totalAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'actual_amount', comment: '实收金额' })
  actualAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'discount_amount', comment: '优惠金额' })
  discountAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'cost_amount', nullable: true, comment: '成本金额' })
  costAmount: number;

  @Column({ type: 'text',
    
    
    default: DiscountType.NONE,
    name: 'discount_type',
    nullable: true,
    comment: '优惠类型'})
  discountType: DiscountType;

  @Column({ type: 'text',
    
    
    default: PaymentMethod.CASH,
    name: 'payment_method',
    comment: '支付方式'})
  paymentMethod: PaymentMethod;

  @Column({ nullable: true, type: 'text', name: 'payment_detail', comment: '支付明细' })
  paymentDetail: Record<string, any>;

  @Column({ nullable: true, type: 'text', comment: '消费项目明细' })
  items: ConsumptionItem[];

  @Column({ name: 'employee_id', nullable: true, comment: '服务员工ID' })
  employeeId: string;

  @ManyToOne(() => Employee, { nullable: true })
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @Column({ nullable: true, type: 'decimal', precision: 10, scale: 2, comment: '提成金额' })
  commission: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'service_commission', nullable: true, comment: '服务提成' })
  serviceCommission: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'product_commission', nullable: true, comment: '产品提成' })
  productCommission: number;

  @Column({ name: 'commission_type', nullable: true, comment: '提成类型' })
  commissionType: string;

  @Column({ name: 'card_id', nullable: true, comment: '会员卡ID' })
  cardId: string;

  @ManyToOne(() => MemberCard, { nullable: true })
  @JoinColumn({ name: 'card_id' })
  card: MemberCard;

  @Column({ name: 'old_card_id', nullable: true, comment: '旧会员卡ID' })
  oldCardId: string;

  @ManyToOne(() => MemberCard, { nullable: true })
  @JoinColumn({ name: 'old_card_id' })
  oldCard: MemberCard;

  @Column({ name: 'new_card_id', nullable: true, comment: '新会员卡ID' })
  newCardId: string;

  @ManyToOne(() => MemberCard, { nullable: true })
  @JoinColumn({ name: 'new_card_id' })
  newCard: MemberCard;

  @Column({ type: 'int', name: 'points_earned', nullable: true, default: 0, comment: '获得积分' })
  pointsEarned: number;

  @Column({ type: 'int', name: 'points_used', nullable: true, default: 0, comment: '使用积分' })
  pointsUsed: number;

  @Column({ nullable: true, comment: '备注' })
  remark: string;

  @Column({ name: 'merged_to', type: 'text', nullable: true, comment: '合并到订单号' })
  mergedTo: string | null;

  @Column({ name: 'cancelled_at', type: 'text', nullable: true, comment: '取消时间' })
  cancelledAt: string | null;

  @Column({ name: 'review_status', type: 'text', default: 'pending', comment: '审核状态: pending/reviewed' })
  reviewStatus: string;

  @Column({ name: 'reviewed_by', type: 'text', nullable: true, comment: '审核人ID' })
  reviewedBy: string | null;

  @Column({ name: 'reviewed_at', type: 'text', nullable: true, comment: '审核时间' })
  reviewedAt: string | null;

  @Column({ name: 'created_by', comment: '操作人ID' })
  createdBy: string;
}

export interface ConsumptionItem {
  serviceId: string;
  serviceName: string;
  price: number;
  quantity: number;
  amount: number;
  employeeId?: string;
  employeeName?: string;
}
