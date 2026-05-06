import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('service_reviews')
@Index('idx_service_reviews_service_id', ['serviceId'])
@Index('idx_service_reviews_user_id', ['userId'])
@Index('idx_service_reviews_order_id', ['orderId'])
export class ServiceReview extends BaseEntity {
  @Column({ name: 'service_id', comment: '服务项目ID' })
  serviceId: string;

  @Column({ name: 'order_id', nullable: true, comment: '订单ID' })
  orderId: string;

  @Column({ name: 'user_id', comment: '用户ID' })
  userId: string;

  @Column({ nullable: true, name: 'staff_id', comment: '服务人员ID' })
  staffId: string;

  @Column({ type: 'smallint', comment: '评分(1-5星)' })
  rating: number;

  @Column({ nullable: true, type: 'text', comment: '评价内容' })
  content: string;

  @Column({ nullable: true, type: 'simple-array', comment: '评价图片URL列表' })
  images: string[];

  @Column({ type: 'text', default: true, name: 'is_anonymous', comment: '是否匿名评价' })
  isAnonymous: boolean;

  @Column({ type: 'text', default: true, name: 'is_visible', comment: '是否显示' })
  isVisible: boolean;

  @Column({ nullable: true, type: 'text', name: 'admin_reply', comment: '商家回复' })
  adminReply: string;

  @Column({ nullable: true, type: 'datetime', name: 'admin_reply_time', comment: '商家回复时间' })
  adminReplyTime: Date;

  @Column({ default: 0, type: 'int', name: 'like_count', comment: '点赞数' })
  likeCount: number;

  // 标签(服务好、环境好、技师专业等)
  @Column({ nullable: true, type: 'simple-array', comment: '评价标签' })
  tags: string[];

  // 关联服务项目
  @ManyToOne(() => require('./service.entity').Service)
  @JoinColumn({ name: 'service_id' })
  service: any;
}
