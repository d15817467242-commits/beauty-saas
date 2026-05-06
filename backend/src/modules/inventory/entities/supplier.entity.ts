import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { PurchaseOrder } from './purchase.entity';

@Entity('suppliers')
export class Supplier extends BaseEntity {
  @Column({ type: 'text', comment: '供应商名称' })
  name: string;

  @Column({ nullable: true, name: 'supplier_code', unique: true, comment: '供应商编码' })
  supplierCode: string;

  @Column({ nullable: true, comment: '联系人' })
  contact: string;

  @Column({ nullable: true, comment: '联系电话' })
  phone: string;

  @Column({ nullable: true, comment: '邮箱' })
  email: string;

  @Column({ nullable: true, comment: '地址' })
  address: string;

  @Column({ nullable: true, name: 'bank_name', comment: '开户银行' })
  bankName: string;

  @Column({ nullable: true, name: 'bank_account', comment: '银行账号' })
  bankAccount: string;

  @Column({ type: 'int', name: 'payment_days', default: 30, comment: '账期(天)' })
  paymentDays: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'credit_limit', default: 0, comment: '信用额度' })
  creditLimit: number;

  @Column({ type: 'text', default: true, name: 'is_active', comment: '是否启用' })
  isActive: boolean;

  @Column({ type: 'int', default: 0, comment: '评分(1-5)' })
  rating: number;

  @Column({ nullable: true, comment: '备注' })
  remark: string;

  @OneToMany(() => PurchaseOrder, (order) => order.supplier)
  purchaseOrders: PurchaseOrder[];
}
