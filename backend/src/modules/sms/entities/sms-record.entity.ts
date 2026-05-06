import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('sms_records')
export class SmsRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', comment: '账户ID' })
  accountId: string;

  @Column({ length: 20, comment: '手机号' })
  phone: string;

  @Column({ type: 'text', comment: '短信内容' })
  content: string;

  @Column({ length: 100, nullable: true, comment: '模板ID' })
  templateId?: string;

  @Column({ type: 'text', nullable: true, comment: '模板参数' })
  templateParams?: Record<string, any>;

  @Column({ type: 'text', default: 'single', comment: '发送类型' })
  sendType: 'single' | 'batch';

  @Column({ nullable: true, comment: '批次ID' })
  batchId?: string;

  @Column({ type: 'text', default: 'pending', comment: '状态' })
  status: 'pending' | 'sent' | 'failed';

  @Column({ length: 100, nullable: true, comment: '第三方返回码' })
  resultCode?: string;

  @Column({ type: 'text', nullable: true, comment: '第三方返回消息' })
  resultMessage?: string;

  @Column({ length: 100, nullable: true, comment: '第三方消息ID' })
  bizId?: string;

  @Column({ type: 'datetime', nullable: true, comment: '发送时间' })
  sentAt?: Date;

  @Column({ type: 'decimal', precision: 10, scale: 4, default: 0, comment: '费用(元)' })
  cost: number;

  @Column({ nullable: true, comment: '会员ID' })
  memberId?: string;

  @Column({ type: 'text', nullable: true, comment: '备注' })
  remark?: string;

  @Column({ nullable: true, comment: '创建人ID' })
  createdBy?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
