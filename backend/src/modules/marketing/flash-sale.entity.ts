import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Service } from '../service/service.entity';

export enum FlashSaleStatus {
  DRAFT = 'draft',         // 草稿
  UPCOMING = 'upcoming',   // 即将开始
  ACTIVE = 'active',       // 进行中
  ENDED = 'ended',         // 已结束
}

@Entity('flash_sales')
export class FlashSale extends BaseEntity {
  @Column({ type: 'text', comment: '活动名称' })
  name: string;

  @Column({ name: 'service_id', comment: '服务ID' })
  serviceId: string;

  @ManyToOne(() => Service)
  @JoinColumn({ name: 'service_id' })
  service: Service;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'original_price', comment: '原价' })
  originalPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'flash_price', comment: '秒杀价' })
  flashPrice: number;

  @Column({ type: 'int', name: 'total_stock', comment: '库存总量' })
  totalStock: number;

  @Column({ type: 'int', name: 'sold_count', default: 0, comment: '已售数量' })
  soldCount: number;

  @Column({ type: 'int', name: 'per_limit', default: 1, comment: '每人限购数量' })
  perLimit: number;

  @Column({ type: 'datetime', name: 'start_time', comment: '开始时间' })
  startTime: Date;

  @Column({ type: 'datetime', name: 'end_time', comment: '结束时间' })
  endTime: Date;

  @Column({ type: 'text',
    
    
    default: FlashSaleStatus.DRAFT,
    comment: '状态'})
  status: FlashSaleStatus;

  @Column({ nullable: true, comment: '活动说明' })
  description: string;

  @Column({ name: 'created_by', comment: '创建人ID' })
  createdBy: string;
}

@Entity('flash_sale_orders')
export class FlashSaleOrder extends BaseEntity {
  @Column({ name: 'flash_sale_id', comment: '秒杀活动ID' })
  flashSaleId: string;

  @ManyToOne(() => FlashSale)
  @JoinColumn({ name: 'flash_sale_id' })
  flashSale: FlashSale;

  @Column({ name: 'member_id', comment: '会员ID' })
  memberId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'paid_amount', comment: '支付金额' })
  paidAmount: number;

  @Column({ type: 'int', comment: '购买数量' })
  quantity: number;

  @Column({ type: 'datetime', name: 'order_time', comment: '下单时间' })
  orderTime: Date;

  @Column({ name: 'order_id', nullable: true, comment: '关联订单ID' })
  orderId: string;
}
