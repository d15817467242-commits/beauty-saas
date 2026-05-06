import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

export enum PointsMallStatus {
  ACTIVE = 'active',       // 上架
  INACTIVE = 'inactive',   // 下架
  OUT_OF_STOCK = 'out_of_stock', // 售罄
}

export enum PointsGoodsType {
  PRODUCT = 'product',     // 实物商品
  SERVICE = 'service',     // 服务项目
  COUPON = 'coupon',       // 优惠券
  VIRTUAL = 'virtual',     // 虚拟商品
}

@Entity('points_mall_goods')
@Index('idx_points_mall_goods_status', ['status'])
@Index('idx_points_mall_goods_category', ['category'])
export class PointsMallGoods extends BaseEntity {
  @Column({ type: 'text', comment: '商品名称' })
  name: string;

  @Column({ nullable: true, comment: '商品副标题' })
  subtitle: string;

  @Column({ type: 'text',
    
    
    default: PointsGoodsType.PRODUCT,
    comment: '商品类型'})
  type: PointsGoodsType;

  @Column({ type: 'int', name: 'points_required', comment: '所需积分' })
  pointsRequired: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'cash_price', default: 0, comment: '现金价格(积分+现金模式)' })
  cashPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'original_price', nullable: true, comment: '原价(展示用)' })
  originalPrice: number;

  @Column({ type: 'int', name: 'stock_count', default: 0, comment: '库存数量' })
  stockCount: number;

  @Column({ type: 'int', name: 'sold_count', default: 0, comment: '已兑换数量' })
  soldCount: number;

  @Column({ type: 'int', name: 'exchange_limit', default: -1, comment: '每人限兑数量(-1为无限)' })
  exchangeLimit: number;

  @Column({ type: 'text',
    
    
    default: PointsMallStatus.ACTIVE,
    comment: '状态'})
  status: PointsMallStatus;

  @Column({ nullable: true, comment: '商品分类' })
  category: string;

  @Column({ nullable: true, type: 'text', name: 'main_image', comment: '主图' })
  mainImage: string;

  @Column({ nullable: true, type: 'text', name: 'detail_images', comment: '详情图片(JSON数组)' })
  detailImages: string;

  @Column({ nullable: true, type: 'text', comment: '商品详情' })
  description: string;

  @Column({ nullable: true, type: 'text', name: 'service_config', comment: '服务配置(服务类型商品)' })
  serviceConfig: {
    serviceId?: string;
    serviceName?: string;
    validDays?: number;
  };

  @Column({ nullable: true, type: 'text', name: 'coupon_config', comment: '优惠券配置(优惠券类型商品)' })
  couponConfig: {
    couponId?: string;
    couponName?: string;
  };

  @Column({ type: 'int', name: 'sort_order', default: 0, comment: '排序(数值越大越靠前)' })
  sortOrder: number;

  @Column({ type: 'datetime', name: 'start_time', nullable: true, comment: '上架开始时间' })
  startTime: Date;

  @Column({ type: 'datetime', name: 'end_time', nullable: true, comment: '上架结束时间' })
  endTime: Date;

  @Column({ name: 'created_by', comment: '创建人ID' })
  createdBy: string;
}

export enum ExchangeStatus {
  PENDING = 'pending',       // 待处理
  CONFIRMED = 'confirmed',   // 已确认
  SHIPPED = 'shipped',       // 已发货
  COMPLETED = 'completed',   // 已完成
  CANCELLED = 'cancelled',   // 已取消
  REFUNDED = 'refunded',     // 已退积分
}

@Entity('points_exchanges')
@Index('idx_points_exchanges_member_id', ['memberId'])
@Index('idx_points_exchanges_status', ['status'])
@Index('idx_points_exchanges_exchange_time', ['exchangeTime'])
export class PointsExchange extends BaseEntity {
  @Column({ name: 'member_id', comment: '会员ID' })
  memberId: string;

  @Column({ name: 'goods_id', comment: '商品ID' })
  goodsId: string;

  @ManyToOne(() => PointsMallGoods)
  @JoinColumn({ name: 'goods_id' })
  goods: PointsMallGoods;

  @Column({ type: 'int', name: 'points_used', comment: '使用积分' })
  pointsUsed: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'cash_paid', default: 0, comment: '支付现金' })
  cashPaid: number;

  @Column({ type: 'int', name: 'quantity', default: 1, comment: '兑换数量' })
  quantity: number;

  @Column({ type: 'text',
    
    
    default: ExchangeStatus.PENDING,
    comment: '兑换状态'})
  status: ExchangeStatus;

  @Column({ type: 'datetime', name: 'exchange_time', comment: '兑换时间' })
  exchangeTime: Date;

  @Column({ type: 'datetime', nullable: true, name: 'complete_time', comment: '完成时间' })
  completeTime: Date;

  @Column({ nullable: true, type: 'text', name: 'delivery_info', comment: '收货信息' })
  deliveryInfo: {
    name: string;
    phone: string;
    province: string;
    city: string;
    district: string;
    address: string;
  };

  @Column({ nullable: true, name: 'tracking_number', comment: '物流单号' })
  trackingNumber: string;

  @Column({ nullable: true, name: 'tracking_company', comment: '物流公司' })
  trackingCompany: string;

  @Column({ name: 'order_id', nullable: true, comment: '关联订单ID' })
  orderId: string;

  @Column({ nullable: true, comment: '备注' })
  remark: string;

  @Column({ name: 'processed_by', nullable: true, comment: '处理人ID' })
  processedBy: string;

  @Column({ type: 'datetime', nullable: true, name: 'processed_at', comment: '处理时间' })
  processedAt: Date;
}

@Entity('points_exchange_statistics')
export class PointsExchangeStatistics extends BaseEntity {
  @Column({ name: 'goods_id', comment: '商品ID' })
  goodsId: string;

  @ManyToOne(() => PointsMallGoods)
  @JoinColumn({ name: 'goods_id' })
  goods: PointsMallGoods;

  @Column({ type: 'date', name: 'stat_date', comment: '统计日期' })
  statDate: Date;

  @Column({ type: 'int', name: 'exchange_count', default: 0, comment: '兑换次数' })
  exchangeCount: number;

  @Column({ type: 'int', name: 'exchange_quantity', default: 0, comment: '兑换数量' })
  exchangeQuantity: number;

  @Column({ type: 'int', name: 'points_total', default: 0, comment: '消耗积分总数' })
  pointsTotal: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'cash_total', default: 0, comment: '现金总额' })
  cashTotal: number;

  @Column({ type: 'int', name: 'cancel_count', default: 0, comment: '取消次数' })
  cancelCount: number;

  @Column({ type: 'int', name: 'refund_points', default: 0, comment: '退还积分' })
  refundPoints: number;
}
