import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

export enum PaymentMethod {
  WECHAT = 'wechat',       // 微信支付
  ALIPAY = 'alipay',       // 支付宝
  CASH = 'cash',           // 现金
  CARD = 'card',           // 银行卡
  MEMBER_CARD = 'member_card', // 会员卡余额
  CREDIT = 'credit',       // 挂账
}

export enum PaymentChannelType {
  NATIVE = 'native',       // 扫码支付
  JSAPI = 'jsapi',         // 公众号/小程序支付
  H5 = 'h5',               // H5支付
  APP = 'app',             // APP支付
  FACE = 'face',           // 刷脸支付
  MINI = 'mini',           // 小程序支付
}

export enum PaymentStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive'}

@Entity('payment_configs')
export class PaymentConfig extends BaseEntity {
  @Column({ name: 'store_id', nullable: true, comment: '门店ID，为空表示全局配置' })
  storeId: string;

  @Column({ type: 'text',
    
    
    comment: '支付方式'})
  method: PaymentMethod;

  @Column({ type: 'text', comment: '支付方式名称' })
  name: string;

  @Column({ nullable: true, comment: '支付图标' })
  icon: string;

  @Column({
    type: 'text',
    default: '[]',
    comment: '支持的支付渠道'})
  channels: string | PaymentChannelType[];

  @Column({ type: 'text',
    
    
    default: PaymentStatus.ACTIVE,
    comment: '状态'})
  status: PaymentStatus;

  @Column({ type: 'text', default: 0, name: 'sort_order', comment: '排序' })
  sortOrder: number;

  @Column({ default: 0, type: 'decimal', precision: 5, scale: 2, name: 'handling_fee', comment: '手续费率(%)' })
  handlingFee: number;

  @Column({ type: 'text', default: 0, name: 'min_amount', comment: '最低支付金额(分)' })
  minAmount: number;

  @Column({ type: 'text', default: 0, name: 'max_amount', comment: '最高支付金额(分)' })
  maxAmount: number;

  @Column({ nullable: true, type: 'text', comment: '支付配置参数(加密存储)' })
  config: Record<string, any>;

  @Column({ nullable: true, type: 'text', comment: '扩展配置' })
  extra: Record<string, any>;
}

@Entity('payment_channels')
export class PaymentChannel extends BaseEntity {
  @Column({ name: 'payment_config_id', comment: '支付配置ID' })
  paymentConfigId: string;

  @Column({ type: 'text',
    
    
    comment: '渠道类型'})
  channel: PaymentChannelType;

  @Column({ type: 'text', comment: '渠道名称' })
  name: string;

  @Column({ type: 'text',
    
    
    default: PaymentStatus.ACTIVE,
    comment: '状态'})
  status: PaymentStatus;

  @Column({ nullable: true, name: 'app_id', comment: '应用ID' })
  appId: string;

  @Column({ nullable: true, name: 'mch_id', comment: '商户号' })
  mchId: string;

  @Column({ nullable: true, type: 'text', name: 'api_key', comment: 'API密钥(加密存储)' })
  apiKey: string;

  @Column({ nullable: true, type: 'text', name: 'api_secret', comment: 'API密钥(加密存储)' })
  apiSecret: string;

  @Column({ nullable: true, type: 'text', name: 'cert_path', comment: '证书路径' })
  certPath: string;

  @Column({ nullable: true, name: 'notify_url', comment: '回调地址' })
  notifyUrl: string;

  @Column({ nullable: true, type: 'text', comment: '渠道配置' })
  config: Record<string, any>;
}
