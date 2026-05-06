import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

export enum CampaignType {
  DISCOUNT = 'discount',       // 折扣活动
  FULL_REDUCE = 'full_reduce', // 满减活动
  GIFT = 'gift',               // 买赠活动
  NEW_USER = 'new_user',       // 新人活动
  MEMBER_DAY = 'member_day',   // 会员日
  FESTIVAL = 'festival',       // 节日活动
  CUSTOM = 'custom',           // 自定义活动
}

export enum CampaignStatus {
  DRAFT = 'draft',           // 草稿
  PENDING = 'pending',       // 待开始
  ACTIVE = 'active',         // 进行中
  PAUSED = 'paused',         // 已暂停
  ENDED = 'ended',           // 已结束
  CANCELLED = 'cancelled',   // 已取消
}

export enum RuleType {
  FULL_REDUCE = 'full_reduce',   // 满减
  DISCOUNT = 'discount',         // 折扣
  GIFT = 'gift',                 // 买赠
  FIXED_PRICE = 'fixed_price',   // 固定价
  COUPON = 'coupon',             // 送券
  POINTS = 'points',             // 送积分
}

@Entity('marketing_campaigns')
export class MarketingCampaign extends BaseEntity {
  @Column({ type: 'text', comment: '活动名称' })
  name: string;

  @Column({ nullable: true, comment: '活动副标题' })
  subtitle: string;

  @Column({ type: 'text',
    
    
    default: CampaignType.DISCOUNT,
    comment: '活动类型'})
  type: CampaignType;

  @Column({ type: 'text',
    
    
    default: CampaignStatus.DRAFT,
    comment: '活动状态'})
  status: CampaignStatus;

  @Column({ type: 'datetime', name: 'start_time', comment: '活动开始时间' })
  startTime: Date;

  @Column({ type: 'datetime', name: 'end_time', comment: '活动结束时间' })
  endTime: Date;

  @Column({ nullable: true, type: 'text', comment: '活动规则配置' })
  rules: Record<string, any>;

  @Column({ nullable: true, type: 'text', name: 'target_conditions', comment: '目标人群条件' })
  targetConditions: {
    memberLevels?: string[];      // 会员等级
    registerDays?: number;        // 注册天数
    minConsumeAmount?: number;    // 最低消费金额
    tags?: string[];              // 会员标签
    newMember?: boolean;          // 新会员
  };

  @Column({ nullable: true, type: 'text', name: 'applicable_services', comment: '适用服务ID列表' })
  applicableServices: string[];

  @Column({ nullable: true, type: 'text', name: 'applicable_products', comment: '适用产品ID列表' })
  applicableProducts: string[];

  @Column({ nullable: true, type: 'text', name: 'applicable_stores', comment: '适用门店ID列表' })
  applicableStores: string[];

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'budget_amount', default: 0, comment: '活动预算金额' })
  budgetAmount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'used_budget', default: 0, comment: '已使用预算' })
  usedBudget: number;

  @Column({ type: 'int', name: 'participate_limit', default: -1, comment: '参与次数限制(-1为无限)' })
  participateLimit: number;

  @Column({ type: 'int', name: 'daily_limit', default: -1, comment: '每日参与限制(-1为无限)' })
  dailyLimit: number;

  @Column({ type: 'int', name: 'total_participants', default: 0, comment: '总参与人数' })
  totalParticipants: number;

  @Column({ type: 'int', name: 'total_orders', default: 0, comment: '总订单数' })
  totalOrders: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'total_amount', default: 0, comment: '总交易金额' })
  totalAmount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'total_discount', default: 0, comment: '总优惠金额' })
  totalDiscount: number;

  @Column({ nullable: true, type: 'text', comment: '活动说明' })
  description: string;

  @Column({ nullable: true, type: 'text', name: 'banner_image', comment: '活动横幅图片' })
  bannerImage: string;

  @Column({ nullable: true, type: 'text', name: 'detail_images', comment: '活动详情图片(JSON数组)' })
  detailImages: string;

  @Column({ name: 'created_by', comment: '创建人ID' })
  createdBy: string;

  @OneToMany(() => CampaignRule, rule => rule.campaign)
  campaignRules: CampaignRule[];
}

@Entity('campaign_rules')
export class CampaignRule extends BaseEntity {
  @Column({ name: 'campaign_id', comment: '活动ID' })
  campaignId: string;

  @ManyToOne(() => MarketingCampaign, campaign => campaign.campaignRules)
  @JoinColumn({ name: 'campaign_id' })
  campaign: MarketingCampaign;

  @Column({ type: 'text', comment: '规则名称' })
  name: string;

  @Column({ nullable: true, comment: '规则描述' })
  description: string;

  @Column({ type: 'text',
    
    
    default: RuleType.FULL_REDUCE,
    comment: '规则类型'})
  type: RuleType;

  @Column({ type: 'int', name: 'priority', default: 0, comment: '优先级(数值越大优先级越高)' })
  priority: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'min_amount', default: 0, comment: '最低金额门槛' })
  minAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'max_amount', nullable: true, comment: '最高金额限制' })
  maxAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'discount_value', default: 0, comment: '优惠值(金额/折扣率)' })
  discountValue: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'max_discount', nullable: true, comment: '最大优惠金额' })
  maxDiscount: number;

  @Column({ nullable: true, type: 'text', name: 'gift_items', comment: '赠品项目' })
  giftItems: {
    productId?: string;
    serviceName?: string;
    quantity: number;
  }[];

  @Column({ type: 'int', name: 'use_limit', default: -1, comment: '使用次数限制(-1为无限)' })
  useLimit: number;

  @Column({ type: 'int', name: 'used_count', default: 0, comment: '已使用次数' })
  usedCount: number;

  @Column({ type: 'text', default: true, comment: '是否启用' })
  enabled: boolean;
}

@Entity('campaign_participations')
export class CampaignParticipation extends BaseEntity {
  @Column({ name: 'campaign_id', comment: '活动ID' })
  campaignId: string;

  @ManyToOne(() => MarketingCampaign)
  @JoinColumn({ name: 'campaign_id' })
  campaign: MarketingCampaign;

  @Column({ name: 'rule_id', nullable: true, comment: '使用的规则ID' })
  ruleId: string;

  @ManyToOne(() => CampaignRule)
  @JoinColumn({ name: 'rule_id' })
  rule: CampaignRule;

  @Column({ name: 'member_id', comment: '会员ID' })
  memberId: string;

  @Column({ name: 'order_id', nullable: true, comment: '关联订单ID' })
  orderId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'order_amount', default: 0, comment: '订单金额' })
  orderAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'discount_amount', default: 0, comment: '优惠金额' })
  discountAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'actual_amount', default: 0, comment: '实付金额' })
  actualAmount: number;

  @Column({ type: 'datetime', name: 'participate_time', comment: '参与时间' })
  participateTime: Date;

  @Column({ nullable: true, type: 'text', comment: '额外信息' })
  extraInfo: Record<string, any>;
}
