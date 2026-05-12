import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Member } from '../member/member.entity';

@Entity('member_tags')
export class MemberTag extends BaseEntity {
  @Column({ type: 'text', comment: '标签名称' })
  name: string;

  @Column({ nullable: true, comment: '标签颜色' })
  color: string;

  @Column({ nullable: true, comment: '标签描述' })
  description: string;

  @Column({ type: 'text', default: true, name: 'is_active', comment: '是否启用' })
  isActive: boolean;

  @Column({ name: 'created_by', comment: '创建人ID' })
  createdBy: string;
}

@Entity('member_tag_relations')
export class MemberTagRelation extends BaseEntity {
  @Column({ name: 'member_id', comment: '会员ID' })
  memberId: string;

  @ManyToOne(() => Member)
  @JoinColumn({ name: 'member_id' })
  member: Member;

  @Column({ name: 'tag_id', comment: '标签ID' })
  tagId: string;

  @ManyToOne(() => MemberTag)
  @JoinColumn({ name: 'tag_id' })
  tag: MemberTag;

  @Column({ type: 'datetime', name: 'tagged_time', comment: '打标签时间' })
  taggedTime: Date;

  @Column({ name: 'tagged_by', comment: '打标签人ID' })
  taggedBy: string;
}

@Entity('point_exchange_rules')
export class PointExchangeRule extends BaseEntity {
  @Column({ type: 'text', comment: '规则名称' })
  name: string;

  @Column({ type: 'int', name: 'points_required', comment: '所需积分' })
  pointsRequired: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'reward_amount', nullable: true, comment: '奖励金额' })
  rewardAmount: number;

  @Column({ nullable: true, name: 'coupon_id', comment: '奖励优惠券ID' })
  couponId: string;

  @Column({ nullable: true, name: 'service_id', comment: '奖励服务ID' })
  serviceId: string;

  @Column({ type: 'text', default: true, name: 'is_active', comment: '是否启用' })
  isActive: boolean;

  @Column({ name: 'created_by', comment: '创建人ID' })
  createdBy: string;
}

@Entity('point_exchange_records')
export class PointExchangeRecord extends BaseEntity {
  @Column({ name: 'member_id', comment: '会员ID' })
  memberId: string;

  @ManyToOne(() => Member)
  @JoinColumn({ name: 'member_id' })
  member: Member;

  @Column({ name: 'rule_id', comment: '兑换规则ID' })
  ruleId: string;

  @ManyToOne(() => PointExchangeRule)
  @JoinColumn({ name: 'rule_id' })
  rule: PointExchangeRule;

  @Column({ type: 'int', name: 'points_used', comment: '使用积分' })
  pointsUsed: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'reward_amount', default: 0, comment: '奖励金额' })
  rewardAmount: number;

  @Column({ type: 'datetime', name: 'exchange_time', comment: '兑换时间' })
  exchangeTime: Date;

  @Column({ name: 'created_by', comment: '操作人ID' })
  createdBy: string;
}

@Entity('member_rankings')
export class MemberRanking extends BaseEntity {
  @Column({ name: 'member_id', comment: '会员ID' })
  memberId: string;

  @ManyToOne(() => Member)
  @JoinColumn({ name: 'member_id' })
  member: Member;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'total_spent', comment: '消费总额' })
  totalSpent: number;

  @Column({ type: 'int', name: 'visit_count', comment: '到店次数' })
  visitCount: number;

  @Column({ type: 'int', name: 'ranking_month', comment: '排名月份(YYYYMM)' })
  rankingMonth: number;

  @Column({ type: 'int', name: 'spend_rank', nullable: true, comment: '消费排名' })
  spendRank: number;

  @Column({ type: 'int', name: 'visit_rank', nullable: true, comment: '到店排名' })
  visitRank: number;
}

@Entity('member_stores')
export class MemberStore extends BaseEntity {
  @Column({ type: 'text', comment: '门店名称' })
  name: string;

  @Column({ nullable: true, comment: '门店编码' })
  code: string;

  @Column({ nullable: true, comment: '地址' })
  address: string;

  @Column({ nullable: true, comment: '联系电话' })
  phone: string;

  @Column({ type: 'text', default: true, name: 'is_active', comment: '是否启用' })
  isActive: boolean;

  @Column({ nullable: true, comment: '备注' })
  remark: string;
}

@Entity('cross_store_consumptions')
export class CrossStoreConsumption extends BaseEntity {
  @Column({ name: 'member_id', comment: '会员ID' })
  memberId: string;

  @Column({ name: 'home_store_id', comment: '归属门店ID' })
  homeStoreId: string;

  @Column({ name: 'consume_store_id', comment: '消费门店ID' })
  consumeStoreId: string;

  @Column({ name: 'consumption_id', comment: '消费记录ID' })
  consumptionId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, comment: '消费金额' })
  amount: number;

  @Column({ type: 'datetime', name: 'consume_time', comment: '消费时间' })
  consumeTime: Date;
}

// ==================== 会员等级系统 ====================

@Entity('member_levels')
export class MemberLevelConfig extends BaseEntity {
  @Column({ type: 'text', comment: '等级名称' })
  name: string;

  @Column({ type: 'text', comment: '等级编码' })
  code: string;

  @Column({ default: 0, type: 'int', name: 'min_points', comment: '升级所需积分' })
  minPoints: number;

  @Column({ default: 0, type: 'decimal', precision: 10, scale: 2, name: 'min_spent', comment: '升级所需消费额' })
  minSpent: number;

  @Column({ default: 0, type: 'int', name: 'min_visits', comment: '升级所需到店次数' })
  minVisits: number;

  @Column({ default: 0, type: 'int', name: 'level_order', comment: '等级排序(越大越高)' })
  levelOrder: number;

  @Column({ nullable: true, comment: '等级图标' })
  icon: string;

  @Column({ nullable: true, comment: '等级颜色' })
  color: string;

  @Column({ nullable: true, type: 'decimal', precision: 5, scale: 2, name: 'discount_rate', comment: '折扣率(如0.95表示95折)' })
  discountRate: number;

  @Column({ type: 'text', default: true, name: 'is_active', comment: '是否启用' })
  isActive: boolean;

  @OneToMany(() => MemberLevelBenefit, benefit => benefit.level)
  benefits: MemberLevelBenefit[];
}

@Entity('member_level_benefits')
export class MemberLevelBenefit extends BaseEntity {
  @Column({ name: 'level_id', comment: '等级ID' })
  levelId: string;

  @ManyToOne(() => MemberLevelConfig)
  @JoinColumn({ name: 'level_id' })
  level: MemberLevelConfig;

  @Column({ type: 'text', comment: '权益名称' })
  name: string;

  @Column({ nullable: true, comment: '权益描述' })
  description: string;

  @Column({ nullable: true, type: 'decimal', precision: 10, scale: 2, name: 'benefit_value', comment: '权益值(如折扣金额)' })
  benefitValue: number;

  @Column({ nullable: true, name: 'benefit_type', comment: '权益类型(discount/gift/service)' })
  benefitType: string;

  @Column({ nullable: true, name: 'related_id', comment: '关联ID(如服务ID、优惠券ID)' })
  relatedId: string;

  @Column({ type: 'text', default: true, name: 'is_active', comment: '是否启用' })
  isActive: boolean;
}

// ==================== 会员积分系统 ====================

@Entity('member_points')
export class MemberPoints extends BaseEntity {
  @Column({ name: 'member_id', comment: '会员ID' })
  memberId: string;

  @ManyToOne(() => Member)
  @JoinColumn({ name: 'member_id' })
  member: Member;

  @Column({ default: 0, type: 'int', name: 'total_points', comment: '累计积分' })
  totalPoints: number;

  @Column({ default: 0, type: 'int', name: 'available_points', comment: '可用积分' })
  availablePoints: number;

  @Column({ default: 0, type: 'int', name: 'used_points', comment: '已用积分' })
  usedPoints: number;

  @Column({ default: 0, type: 'int', name: 'expired_points', comment: '过期积分' })
  expiredPoints: number;

  @Column({ type: 'datetime', name: 'last_earn_time', nullable: true, comment: '最后获取积分时间' })
  lastEarnTime: Date;

  @Column({ type: 'datetime', name: 'last_use_time', nullable: true, comment: '最后使用积分时间' })
  lastUseTime: Date;
}

@Entity('points_records')
export class PointsRecord extends BaseEntity {
  @Column({ name: 'member_id', comment: '会员ID' })
  memberId: string;

  @ManyToOne(() => Member)
  @JoinColumn({ name: 'member_id' })
  member: Member;

  @Column({ type: 'int', comment: '积分变动(正数为获取,负数为消费)' })
  points: number;

  @Column({ type: 'int', name: 'balance_after', comment: '变动后余额' })
  balanceAfter: number;

  @Column({ type: 'text', comment: '变动类型(earn/consume/exchange/expire/reward/refund)' })
  type: string;

  @Column({ nullable: true, comment: '变动描述' })
  description: string;

  @Column({ nullable: true, name: 'related_id', comment: '关联ID(消费ID/兑换ID等)' })
  relatedId: string;

  @Column({ nullable: true, name: 'related_type', comment: '关联类型(consumption/exchange/referral等)' })
  relatedType: string;

  @Column({ type: 'datetime', name: 'expire_time', nullable: true, comment: '过期时间' })
  expireTime: Date;

  @Column({ name: 'created_by', nullable: true, comment: '操作人ID' })
  createdBy: string;
}

// ==================== 会员推荐关系 ====================

@Entity('member_referrals')
export class MemberReferral extends BaseEntity {
  @Column({ name: 'referrer_id', comment: '推荐人ID' })
  referrerId: string;

  @ManyToOne(() => Member)
  @JoinColumn({ name: 'referrer_id' })
  referrer: Member;

  @Column({ name: 'referee_id', comment: '被推荐人ID' })
  refereeId: string;

  @ManyToOne(() => Member)
  @JoinColumn({ name: 'referee_id' })
  referee: Member;

  @Column({ type: 'datetime', name: 'referral_time', comment: '推荐时间' })
  referralTime: Date;

  @Column({ type: 'text', default: 'pending', comment: '状态(pending/confirmed/rewarded)' })
  status: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'reward_amount', default: 0, comment: '奖励金额' })
  rewardAmount: number;

  @Column({ type: 'int', name: 'reward_points', default: 0, comment: '奖励积分' })
  rewardPoints: number;

  @Column({ type: 'datetime', name: 'reward_time', nullable: true, comment: '奖励发放时间' })
  rewardTime: Date;

  @Column({ nullable: true, name: 'first_consumption_id', comment: '首次消费ID' })
  firstConsumptionId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'first_consumption_amount', nullable: true, comment: '首次消费金额' })
  firstConsumptionAmount: number;
}
