import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

// 美团配置
@Entity('meituan_configs')
export class MeituanConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 50, comment: '门店ID' })
  storeId: string;

  @Column({ length: 100, comment: 'AppKey' })
  appKey: string;

  @Column({ length: 100, comment: 'AppSecret' })
  appSecret: string;

  @Column({ length: 100, nullable: true, comment: '门店编码' })
  shopId?: string;

  @Column({ type: 'text', default: true, comment: '是否启用' })
  isActive: boolean;

  @Column({ type: 'text', nullable: true, comment: '同步设置' })
  syncSettings?: {
    syncServices: boolean;
    syncMembers: boolean;
    syncOrders: boolean;
    verifyCoupons: boolean;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

// 抖音配置
@Entity('douyin_configs')
export class DouyinConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 50, comment: '门店ID' })
  storeId: string;

  @Column({ length: 100, comment: 'AppID' })
  appId: string;

  @Column({ length: 100, comment: 'AppSecret' })
  appSecret: string;

  @Column({ length: 100, nullable: true, comment: '店铺ID' })
  shopId?: string;

  @Column({ type: 'text', default: true, comment: '是否启用' })
  isActive: boolean;

  @Column({ type: 'text', nullable: true, comment: '核销设置' })
  verifySettings?: {
    autoVerify: boolean;
    verifyRemark: string;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

// 微信配置
@Entity('wechat_configs')
export class WechatConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 50, comment: '门店ID' })
  storeId: string;

  @Column({ length: 100, comment: 'AppID' })
  appId: string;

  @Column({ length: 100, comment: 'AppSecret' })
  appSecret: string;

  @Column({ length: 100, nullable: true, comment: '商户号' })
  mchId?: string;

  @Column({ length: 100, nullable: true, comment: 'API密钥' })
  apiKey?: string;

  @Column({ type: 'text', nullable: true, comment: '证书内容' })
  certContent?: string;

  @Column({ type: 'text', default: true, comment: '是否启用' })
  isActive: boolean;

  @Column({ type: 'text', nullable: true, comment: '功能设置' })
  features?: {
    oauth: boolean;
    pay: boolean;
    subscribe: boolean;
    templateMessage: boolean;
  };

  @Column({ type: 'datetime', nullable: true, comment: '授权时间' })
  authorizedAt?: Date;

  @Column({ type: 'datetime', nullable: true, comment: 'Token过期时间' })
  tokenExpiresAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

// 第三方券码
@Entity('third_party_coupons')
export class ThirdPartyCoupon {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', default: 'meituan', comment: '平台' })
  platform: 'meituan' | 'douyin';

  @Column({ length: 50, comment: '券码' })
  couponCode: string;

  @Column({ length: 100, nullable: true, comment: '第三方订单ID' })
  thirdPartyOrderId?: string;

  @Column({ length: 100, comment: '券名称' })
  couponName: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, comment: '券面值' })
  faceValue: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, comment: '售价' })
  sellPrice?: number;

  @Column({ nullable: true, comment: '会员ID' })
  memberId?: string;

  @Column({ length: 20, nullable: true, comment: '手机号' })
  phone?: string;

  @Column({ type: 'text', default: 'pending', comment: '状态' })
  status: 'pending' | 'verified' | 'refunded' | 'expired';

  @Column({ type: 'datetime', nullable: true, comment: '核销时间' })
  verifiedAt?: Date;

  @Column({ nullable: true, comment: '核销人ID' })
  verifiedBy?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, comment: '核销金额' })
  verifiedAmount?: number;

  @Column({ type: 'datetime', nullable: true, comment: '过期时间' })
  expireAt?: Date;

  @Column({ type: 'text', nullable: true, comment: '备注' })
  remark?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
