import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('report_daily_reports')
export class DailyReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  cashIncome: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  cardIncome: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  recharge: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  consumption: number;

  @Column({ type: 'text', default: 0 })
  customerCount: number;

  @Column({ type: 'text', default: 0 })
  newMember: number;

  @Column({ nullable: true })
  storeId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
