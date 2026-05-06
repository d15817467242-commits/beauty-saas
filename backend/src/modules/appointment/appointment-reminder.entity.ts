import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Appointment } from './appointment.entity';

export enum ReminderType {
  SMS = 'sms',           // 短信提醒
  WECHAT = 'wechat',     // 微信提醒
  BOTH = 'both',         // 短信+微信
}

export enum ReminderStatus {
  PENDING = 'pending',     // 待发送
  SENT = 'sent',           // 已发送
  FAILED = 'failed',       // 发送失败
}

export enum ReminderTiming {
  ONE_DAY_BEFORE = 1440,    // 提前1天（分钟）
  TWO_HOURS_BEFORE = 120,   // 提前2小时
  ONE_HOUR_BEFORE = 60,     // 提前1小时
  THIRTY_MINUTES_BEFORE = 30, // 提前30分钟
  CUSTOM = 0,               // 自定义
}

@Entity('appointment_reminders')
@Index(['appointmentId', 'reminderTime'])
@Index(['status', 'reminderTime'])
export class AppointmentReminder extends BaseEntity {
  @Column({ name: 'appointment_id', comment: '预约ID' })
  appointmentId: string;

  @ManyToOne(() => Appointment)
  @JoinColumn({ name: 'appointment_id' })
  appointment: Appointment;

  @Column({ type: 'text',
    
    
    default: ReminderType.SMS,
    name: 'reminder_type',
    comment: '提醒方式'})
  reminderType: ReminderType;

  @Column({ type: 'text',
    
    
    default: ReminderStatus.PENDING,
    comment: '发送状态'})
  status: ReminderStatus;

  @Column({
    
    
    name: 'timing_type',
    comment: '提醒时机类型'})
  timingType: ReminderTiming;

  @Column({ 
    type: 'int', 
    name: 'timing_minutes',
    comment: '提前多少分钟提醒（自定义时使用）' 
  })
  timingMinutes: number;

  @Column({ 
    type: 'datetime', 
    name: 'reminder_time',
    comment: '计划提醒时间' 
  })
  reminderTime: Date;

  @Column({ 
    type: 'datetime', 
    name: 'sent_at',
    nullable: true,
    comment: '实际发送时间' 
  })
  sentAt: Date;

  @Column({ 
    name: 'sent_to',
    nullable: true,
    comment: '发送目标（手机号/微信openid）' 
  })
  sentTo: string;

  @Column({ 
    type: 'text',
    nullable: true,
    comment: '提醒内容' 
  })
  content: string;

  @Column({ 
    type: 'text',
    name: 'error_message',
    nullable: true,
    comment: '错误信息' 
  })
  errorMessage: string;

  @Column({ 
    name: 'retry_count',
    default: 0,
    comment: '重试次数' 
  })
  retryCount: number;

  @Column({ name: 'created_by', comment: '创建人ID' })
  createdBy: string;
}
