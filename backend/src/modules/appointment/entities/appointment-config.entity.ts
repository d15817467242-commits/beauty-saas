import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('appointment_configs')
export class AppointmentConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', default: 30, comment: '预约时间间隔(分钟)' })
  timeSlotInterval: number;

  @Column({ type: 'text', default: 60, comment: '预约提前时间(分钟)' })
  advanceBookingMinutes: number;

  @Column({ type: 'text', default: 30, comment: '取消提前时间(分钟)' })
  cancelAdvanceMinutes: number;

  @Column({ type: 'text', default: true, comment: '是否允许会员自助预约' })
  allowMemberSelfBooking: boolean;

  @Column({ type: 'text', default: true, comment: '是否需要支付定金' })
  requireDeposit: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, comment: '定金金额' })
  depositAmount: number;

  @Column({ type: 'text', default: true, comment: '是否发送预约提醒' })
  sendReminder: boolean;

  @Column({ type: 'text', default: 120, comment: '提前提醒时间(分钟)' })
  reminderMinutes: number;

  @Column({ type: 'text', default: true, comment: '是否自动确认' })
  autoConfirm: boolean;

  @Column({ type: 'text', default: 15, comment: '最大提前预约天数' })
  maxAdvanceDays: number;

  @Column({ type: 'text', default: 1, comment: '每人每日最大预约次数' })
  maxDailyAppointments: number;

  @Column({ type: 'text', nullable: true, comment: '特殊日期设置' })
  specialDays?: {
    date: string;
    isOpen: boolean;
    openTime?: string;
    closeTime?: string;
    remark?: string;
  }[];

  @Column({ nullable: true, comment: '门店ID' })
  storeId?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
