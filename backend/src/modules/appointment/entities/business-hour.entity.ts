import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('business_hours')
export class BusinessHour {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', comment: '星期几 0=周日 1=周一 ... 6=周六' })
  dayOfWeek: number;

  @Column({ type: 'time', comment: '开始时间' })
  openTime: string;

  @Column({ type: 'time', comment: '结束时间' })
  closeTime: string;

  @Column({ type: 'text', default: true, comment: '是否营业' })
  isOpen: boolean;

  @Column({ nullable: true, comment: '休息时段开始' })
  breakStart?: string;

  @Column({ nullable: true, comment: '休息时段结束' })
  breakEnd?: string;

  @Column({ nullable: true, comment: '门店ID' })
  storeId?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
