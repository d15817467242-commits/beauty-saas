import { Entity, Column, ManyToOne, OneToMany, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

export enum TaskType {
  DAILY = 'daily',           // 每日任务
  WEEKLY = 'weekly',         // 每周任务
  MONTHLY = 'monthly',       // 每月任务
  NEWBIE = 'newbie',         // 新手任务
  ACHIEVEMENT = 'achievement', // 成就任务
  SPECIAL = 'special',       // 特殊任务
}

export enum TaskAction {
  SIGN_IN = 'sign_in',           // 签到
  CONSUME = 'consume',           // 消费
  RECHARGE = 'recharge',         // 充值
  SHARE = 'share',               // 分享
  INVITE = 'invite',             // 邀请
  COMMENT = 'comment',           // 评价
  BINDING = 'binding',           // 绑定
  FIRST_CONSUME = 'first_consume', // 首次消费
  CONTINUOUS_SIGN = 'continuous_sign', // 连续签到
  AMOUNT_CONSUME = 'amount_consume', // 累计消费
}

export enum TaskStatus {
  ACTIVE = 'active',       // 启用
  INACTIVE = 'inactive',   // 停用
}

@Entity('member_tasks')
@Index('idx_member_tasks_type', ['type'])
@Index('idx_member_tasks_status', ['status'])
@Index('idx_member_tasks_action', ['action'])
export class MemberTask extends BaseEntity {
  @Column({ type: 'text', comment: '任务名称' })
  name: string;

  @Column({ nullable: true, comment: '任务描述' })
  description: string;

  @Column({ type: 'text',
    
    
    default: TaskType.DAILY,
    comment: '任务类型'})
  type: TaskType;

  @Column({ type: 'text',
    
    
    default: TaskAction.SIGN_IN,
    comment: '任务行为'})
  action: TaskAction;

  @Column({ type: 'text',
    
    
    default: TaskStatus.ACTIVE,
    comment: '任务状态'})
  status: TaskStatus;

  @Column({ type: 'int', name: 'target_count', default: 1, comment: '目标次数' })
  targetCount: number;

  @Column({ type: 'int', name: 'max_progress', default: 1, comment: '最大进度值' })
  maxProgress: number;

  @Column({ type: 'int', name: 'sort_order', default: 0, comment: '排序' })
  sortOrder: number;

  @Column({ nullable: true, type: 'text', name: 'action_config', comment: '行为配置' })
  actionConfig: {
    minAmount?: number;        // 最低金额
    serviceIds?: string[];     // 指定服务
    productIds?: string[];     // 指定产品
    continuousDays?: number;   // 连续天数
    totalAmount?: number;      // 累计金额
    platform?: string;         // 分享平台
  };

  @Column({ nullable: true, type: 'text', name: 'target_conditions', comment: '目标人群条件' })
  targetConditions: {
    memberLevels?: string[];
    tags?: string[];
    newMember?: boolean;
  };

  @Column({ type: 'datetime', name: 'start_time', nullable: true, comment: '任务开始时间' })
  startTime: Date;

  @Column({ type: 'datetime', name: 'end_time', nullable: true, comment: '任务结束时间' })
  endTime: Date;

  @Column({ name: 'created_by', comment: '创建人ID' })
  createdBy: string;

  @OneToMany(() => TaskReward, reward => reward.task)
  rewards: TaskReward[];
}

export enum RewardType {
  POINTS = 'points',       // 积分
  COUPON = 'coupon',       // 优惠券
  CASH = 'cash',           // 现金
  SERVICE = 'service',     // 服务
  PRODUCT = 'product',     // 商品
}

@Entity('task_rewards')
export class TaskReward extends BaseEntity {
  @Column({ name: 'task_id', comment: '任务ID' })
  taskId: string;

  @ManyToOne(() => MemberTask, task => task.rewards)
  @JoinColumn({ name: 'task_id' })
  task: MemberTask;

  @Column({ type: 'text',
    
    
    default: RewardType.POINTS,
    comment: '奖励类型'})
  type: RewardType;

  @Column({ type: 'int', name: 'reward_value', comment: '奖励值' })
  rewardValue: number;

  @Column({ nullable: true, name: 'reward_id', comment: '奖励ID(优惠券/服务/商品ID)' })
  rewardId: string;

  @Column({ nullable: true, comment: '奖励名称' })
  rewardName: string;

  @Column({ type: 'int', name: 'reward_quantity', default: 1, comment: '奖励数量' })
  rewardQuantity: number;

  @Column({ type: 'int', name: 'probability', default: 100, comment: '获得概率(百分比)' })
  probability: number;

  @Column({ type: 'int', name: 'max_count', default: -1, comment: '最大发放数量(-1为无限)' })
  maxCount: number;

  @Column({ type: 'int', name: 'given_count', default: 0, comment: '已发放数量' })
  givenCount: number;

  @Column({ type: 'text', default: true, comment: '是否启用' })
  enabled: boolean;
}

export enum TaskRecordStatus {
  PENDING = 'pending',     // 进行中
  COMPLETED = 'completed', // 已完成
  CLAIMED = 'claimed',     // 已领取奖励
  EXPIRED = 'expired',     // 已过期
}

@Entity('member_task_records')
@Index('idx_member_task_records_member_task', ['memberId', 'taskId'])
@Index('idx_member_task_records_status', ['status'])
@Index('idx_member_task_records_complete_time', ['completeTime'])
export class MemberTaskRecord extends BaseEntity {
  @Column({ name: 'member_id', comment: '会员ID' })
  memberId: string;

  @Column({ name: 'task_id', comment: '任务ID' })
  taskId: string;

  @ManyToOne(() => MemberTask)
  @JoinColumn({ name: 'task_id' })
  task: MemberTask;

  @Column({ type: 'int', name: 'current_progress', default: 0, comment: '当前进度' })
  currentProgress: number;

  @Column({ type: 'int', name: 'target_progress', default: 1, comment: '目标进度' })
  targetProgress: number;

  @Column({ type: 'text',
    
    
    default: TaskRecordStatus.PENDING,
    comment: '状态'})
  status: TaskRecordStatus;

  @Column({ type: 'date', name: 'task_date', comment: '任务日期(用于每日任务)' })
  taskDate: Date;

  @Column({ type: 'datetime', name: 'start_time', comment: '开始时间' })
  startTime: Date;

  @Column({ type: 'datetime', nullable: true, name: 'complete_time', comment: '完成时间' })
  completeTime: Date;

  @Column({ type: 'datetime', nullable: true, name: 'claim_time', comment: '领取奖励时间' })
  claimTime: Date;

  @Column({ nullable: true, type: 'text', name: 'reward_details', comment: '奖励详情' })
  rewardDetails: {
    type: RewardType;
    value: number;
    name: string;
    id?: string;
  }[];

  @Column({ nullable: true, type: 'text', comment: '额外信息' })
  extraInfo: Record<string, any>;
}

@Entity('task_statistics')
export class TaskStatistics extends BaseEntity {
  @Column({ name: 'task_id', comment: '任务ID' })
  taskId: string;

  @ManyToOne(() => MemberTask)
  @JoinColumn({ name: 'task_id' })
  task: MemberTask;

  @Column({ type: 'date', name: 'stat_date', comment: '统计日期' })
  statDate: Date;

  @Column({ type: 'int', name: 'participate_count', default: 0, comment: '参与人数' })
  participateCount: number;

  @Column({ type: 'int', name: 'complete_count', default: 0, comment: '完成人数' })
  completeCount: number;

  @Column({ type: 'int', name: 'claim_count', default: 0, comment: '领取奖励人数' })
  claimCount: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, name: 'completion_rate', default: 0, comment: '完成率' })
  completionRate: number;

  @Column({ type: 'int', name: 'points_given', default: 0, comment: '发放积分' })
  pointsGiven: number;

  @Column({ type: 'int', name: 'coupons_given', default: 0, comment: '发放优惠券数' })
  couponsGiven: number;
}
