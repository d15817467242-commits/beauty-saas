import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ExpenseCategory } from './expense-category.entity';

@Entity('store_expenses')
export class StoreExpense {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 50, unique: true, comment: '单据编号' })
  documentNo: string;

  @Column({ type: 'text', default: 'expense', comment: '类型: income=收入, expense=支出' })
  type: 'income' | 'expense';

  @Column({ type: 'text', comment: '分类ID' })
  categoryId: string;

  @ManyToOne(() => ExpenseCategory)
  @JoinColumn({ name: 'categoryId' })
  category: ExpenseCategory;

  @Column({ type: 'decimal', precision: 12, scale: 2, comment: '金额' })
  amount: number;

  @Column({ type: 'date', comment: '发生日期' })
  expenseDate: Date;

  @Column({ length: 20, nullable: true, comment: '支付方式' })
  paymentMethod?: string;

  @Column({ length: 100, nullable: true, comment: '支付账户' })
  paymentAccount?: string;

  @Column({ length: 100, nullable: true, comment: '经手人' })
  handler?: string;

  @Column({ nullable: true, comment: '门店ID' })
  storeId?: string;

  @Column({ type: 'text', nullable: true, comment: '备注' })
  remark?: string;

  @Column({ nullable: true, comment: '附件' })
  attachments?: string;

  @Column({ nullable: true, comment: '创建人ID' })
  createdBy?: string;

  @Column({ nullable: true, comment: '审核人ID' })
  approvedBy?: string;

  @Column({ type: 'datetime', nullable: true, comment: '审核时间' })
  approvedAt?: Date;

  @Column({ type: 'text', default: 'pending', comment: '状态' })
  status: 'pending' | 'approved' | 'rejected';

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
