import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('report_monthly_reports')
export class MonthlyReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  year: number;

  @Column()
  month: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalRevenue: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalRecharge: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalConsumption: number;

  @Column({ type: 'text', default: 0 })
  totalCustomerCount: number;

  @Column({ type: 'text', default: 0 })
  totalNewMember: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalCommission: number;

  @Column({ nullable: true })
  storeId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
