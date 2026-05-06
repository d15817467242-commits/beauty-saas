import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('user_settings')
export class UserSetting extends BaseEntity {
  @Column({ name: 'user_id', comment: '用户ID' })
  userId: string;

  @Column({ type: 'text', default: 'light', comment: '主题: light/dark/auto' })
  theme: string;

  @Column({ type: 'text', default: '#1890ff', comment: '主色调' })
  primaryColor: string;

  @Column({ type: 'text', default: 'medium', comment: '字体大小: small/medium/large' })
  fontSize: string;

  @Column({ type: 'text', default: 'side', comment: '布局: side/top' })
  layout: string;

  @Column({ type: 'text', default: 'zh-CN', comment: '语言' })
  language: string;

  @Column({ type: 'text', default: '{"email":true,"sms":true,"push":true}', comment: '通知设置' })
  notifications: string | {
    email: boolean;
    sms: boolean;
    push: boolean;
  };

  @Column({ type: 'text', nullable: true, comment: '其他设置' })
  extra?: Record<string, any>;
}
