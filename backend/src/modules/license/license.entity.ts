import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

export enum LicenseStatus {
  UNUSED = 'unused',
  USED = 'used',
  REVOKED = 'revoked',
}

@Entity('license_keys')
export class LicenseKey extends BaseEntity {
  @Column({ unique: true, comment: '密钥' })
  key: string;

  @Column({ type: 'text', default: LicenseStatus.UNUSED, comment: '状态' })
  status: LicenseStatus;

  @Column({ nullable: true, name: 'store_id', comment: '绑定门店ID' })
  storeId: string;

  @Column({ nullable: true, name: 'used_by', comment: '使用者姓名' })
  usedBy: string;

  @Column({ nullable: true, type: 'text', name: 'used_at', comment: '使用时间' })
  usedAt: string;

  @Column({ nullable: true, comment: '备注' })
  remark: string;
}