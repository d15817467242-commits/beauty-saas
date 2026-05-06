import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('report_customer_analyses')
export class CustomerAnalysis {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  memberId: string;

  @Column()
  memberName: string;

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  consumptionAmount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  rechargeAmount: number;

  @Column({ type: 'text', default: 0 })
  visitCount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  avgTicket: number;

  @Column({ nullable: true })
  lastVisitDate: string;

  @Column({ nullable: true })
  storeId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
