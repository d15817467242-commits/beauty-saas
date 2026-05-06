import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum DocumentType {
  CONSUME = 'consume',       // 消费订单
  RECHARGE = 'recharge',     // 充值订单
  OPEN_CARD = 'open_card',   // 开卡订单
  REFUND = 'refund',         // 退款订单
  MERGE = 'merge',           // 合并订单
}

export enum DocumentStatus {
  PENDING = 'pending',       // 待支付
  PAID = 'paid',             // 已支付
  REFUNDED = 'refunded',     // 已退款
  CANCELLED = 'cancelled',   // 已取消
}

@Entity('documents')
export class Document {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'order_no', unique: true, comment: '订单号' })
  orderNo: string;

  @Column({ type: 'text',   default: DocumentType.CONSUME, comment: '单据类型' })
  type: DocumentType;

  @Column({ nullable: true, name: 'member_id', comment: '会员ID' })
  memberId: string;

  @Column({ nullable: true, name: 'member_name', comment: '会员姓名' })
  memberName: string;

  @Column({ nullable: true, name: 'member_phone', comment: '会员手机号' })
  memberPhone: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'original_amount', comment: '原价金额' })
  originalAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'total_amount', comment: '总金额' })
  totalAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'pay_amount', comment: '实付金额' })
  payAmount: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 100, comment: '折扣百分比' })
  discount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, name: 'discount_amount', comment: '折扣金额' })
  discountAmount: number;

  @Column({ nullable: true, name: 'payment_method', comment: '支付方式' })
  paymentMethod: string;

  @Column({ type: 'text',   default: DocumentStatus.PAID, comment: '状态' })
  status: DocumentStatus;

  @Column({ nullable: true, name: 'manual_order_no', comment: '手工单号' })
  manualOrderNo: string;

  @Column({ nullable: true, name: 'warehouse_id', comment: '仓库ID' })
  warehouseId: string;

  @Column({ nullable: true, name: 'employee_id', comment: '员工ID' })
  employeeId: string;

  @Column({ nullable: true, name: 'operator_id', comment: '操作员ID' })
  operatorId: string;

  @Column({ nullable: true, name: 'operator_name', comment: '操作员姓名' })
  operatorName: string;

  @Column({ type: 'text', nullable: true, comment: '订单明细' })
  items: {
    serviceId: string;
    serviceName: string;
    price: number;
    quantity: number;
    amount: number;
    employeeId?: string;
    employeeName?: string;
  }[];

  @Column({ type: 'text', nullable: true, comment: '备注' })
  remark: string;
}
