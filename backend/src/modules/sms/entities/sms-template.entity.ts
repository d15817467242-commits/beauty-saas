import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('sms_templates')
export class SmsTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 50, comment: '模板名称' })
  name: string;

  @Column({ length: 100, comment: '模板编码' })
  code: string;

  @Column({ type: 'text', comment: '模板内容' })
  content: string;

  @Column({ length: 100, nullable: true, comment: '第三方模板ID' })
  templateId?: string;

  @Column({ type: 'text', nullable: true, comment: '参数说明' })
  params?: { key: string; name: string; required: boolean }[];

  @Column({ type: 'text', default: 'notification', comment: '模板类型' })
  type: 'marketing' | 'notification' | 'verification';

  @Column({ type: 'text', default: 'pending', comment: '审核状态' })
  auditStatus: 'pending' | 'approved' | 'rejected';

  @Column({ type: 'text', nullable: true, comment: '审核说明' })
  auditMessage?: string;

  @Column({ type: 'text', default: true, comment: '是否启用' })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
