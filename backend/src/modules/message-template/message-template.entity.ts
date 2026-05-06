import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

export enum MessageTemplateType {
  SMS = 'sms',           // 短信
  WECHAT = 'wechat',     // 微信模板消息
  WECHAT_SUBSCRIBE = 'wechat_subscribe', // 微信订阅消息
  EMAIL = 'email',       // 邮件
  APP_PUSH = 'app_push', // APP推送
}

export enum MessageTemplateScene {
  APPOINTMENT_CREATE = 'appointment_create',     // 预约创建
  APPOINTMENT_REMIND = 'appointment_remind',     // 预约提醒
  APPOINTMENT_CANCEL = 'appointment_cancel',     // 预约取消
  APPOINTMENT_COMPLETE = 'appointment_complete', // 服务完成
  MEMBER_REGISTER = 'member_register',           // 会员注册
  MEMBER_RECHARGE = 'member_recharge',           // 会员充值
  MEMBER_CONSUME = 'member_consume',             // 会员消费
  MEMBER_BIRTHDAY = 'member_birthday',           // 生日祝福
  MEMBER_EXPIRE = 'member_expire',               // 会员到期
  COUPON_SEND = 'coupon_send',                   // 优惠券发放
  COUPON_EXPIRE = 'coupon_expire',               // 优惠券到期
  VERIFICATION_CODE = 'verification_code',       // 验证码
  CUSTOM = 'custom',                             // 自定义
}

export enum MessageTemplateStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DRAFT = 'draft'}

@Entity('message_templates')
export class MessageTemplate extends BaseEntity {
  @Column({ name: 'store_id', nullable: true, comment: '门店ID，为空表示全局模板' })
  storeId: string;

  @Column({ type: 'text', comment: '模板名称' })
  name: string;

  @Column({ unique: true, comment: '模板编码' })
  code: string;

  @Column({ type: 'text',
    
    
    comment: '模板类型'})
  type: MessageTemplateType;

  @Column({ type: 'text',
    
    
    comment: '使用场景'})
  scene: MessageTemplateScene;

  @Column({ nullable: true, comment: '模板标题' })
  title: string;

  @Column({ type: 'text', comment: '模板内容' })
  content: string;

  @Column({ nullable: true, type: 'text', comment: '模板变量定义' })
  variables: MessageVariable[];

  @Column({ type: 'text',
    
    
    default: MessageTemplateStatus.DRAFT,
    comment: '模板状态'})
  status: MessageTemplateStatus;

  @Column({ nullable: true, name: 'third_party_id', comment: '第三方模板ID' })
  thirdPartyId: string;

  @Column({ nullable: true, name: 'third_party_code', comment: '第三方模板编码' })
  thirdPartyCode: string;

  @Column({ type: 'text', default: true, name: 'is_default', comment: '是否默认模板' })
  isDefault: boolean;

  @Column({ type: 'text', default: 0, name: 'sort_order', comment: '排序' })
  sortOrder: number;

  @Column({ nullable: true, comment: '模板描述' })
  description: string;

  @Column({ nullable: true, type: 'text', comment: '扩展配置' })
  extra: Record<string, any>;
}

export interface MessageVariable {
  name: string;           // 变量名
  label: string;          // 显示名称
  type: 'string' | 'number' | 'date' | 'boolean';
  defaultValue?: any;     // 默认值
  required?: boolean;     // 是否必填
  description?: string;   // 变量描述
}

@Entity('sms_configs')
export class SmsConfig extends BaseEntity {
  @Column({ name: 'store_id', nullable: true, comment: '门店ID' })
  storeId: string;

  @Column({ type: 'text', comment: '配置名称' })
  name: string;

  @Column({ type: 'text', comment: '服务商' })
  provider: string; // aliyun, tencent, huawei等

  @Column({ name: 'access_key_id', comment: 'AccessKey ID' })
  accessKeyId: string;

  @Column({ type: 'text', name: 'access_key_secret', comment: 'AccessKey Secret(加密存储)' })
  accessKeySecret: string;

  @Column({ nullable: true, name: 'sign_name', comment: '短信签名' })
  signName: string;

  @Column({ nullable: true, name: 'region_id', comment: '区域ID' })
  regionId: string;

  @Column({ nullable: true, type: 'text', comment: '扩展配置' })
  config: Record<string, any>;

  @Column({ type: 'text', default: true, name: 'is_active', comment: '是否启用' })
  isActive: boolean;

  @Column({ type: 'text', default: false, name: 'is_default', comment: '是否默认' })
  isDefault: boolean;
}

@Entity('wechat_template_configs')
export class WechatTemplateConfig extends BaseEntity {
  @Column({ name: 'store_id', nullable: true, comment: '门店ID' })
  storeId: string;

  @Column({ type: 'text', comment: '配置名称' })
  name: string;

  @Column({ name: 'app_id', comment: 'AppID' })
  appId: string;

  @Column({ type: 'text', name: 'app_secret', comment: 'AppSecret(加密存储)' })
  appSecret: string;

  @Column({ nullable: true, name: 'template_id', comment: '模板消息ID' })
  templateId: string;

  @Column({ nullable: true, name: 'subscribe_template_id', comment: '订阅消息模板ID' })
  subscribeTemplateId: string;

  @Column({ nullable: true, type: 'text', comment: '扩展配置' })
  config: Record<string, any>;

  @Column({ type: 'text', default: true, name: 'is_active', comment: '是否启用' })
  isActive: boolean;

  @Column({ type: 'text', default: false, name: 'is_default', comment: '是否默认' })
  isDefault: boolean;
}
