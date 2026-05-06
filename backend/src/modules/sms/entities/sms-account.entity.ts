import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('sms_accounts')
export class SmsAccount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 50, comment: '账户名称' })
  name: string;

  @Column({ length: 50, comment: '服务商' })
  provider: string;

  @Column({ length: 100, comment: 'AccessKey' })
  accessKey: string;

  @Column({ length: 100, comment: 'SecretKey' })
  secretKey: string;

  @Column({ length: 50, comment: '短信签名' })
  signName: string;

  @Column({ length: 100, nullable: true, comment: '默认模板ID' })
  defaultTemplateId?: string;

  @Column({ type: 'decimal', precision: 10, scale: 4, default: 0, comment: '单价(元)' })
  unitPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, comment: '余额(元)' })
  balance: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, comment: '累计充值(元)' })
  totalRecharge: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, comment: '累计消费(元)' })
  totalConsumed: number;

  @Column({ type: 'text', default: true, comment: '是否启用' })
  isActive: boolean;

  @Column({ type: 'text', default: false, comment: '是否默认账户' })
  isDefault: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
