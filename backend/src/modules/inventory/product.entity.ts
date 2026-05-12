import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('products')
export class Product extends BaseEntity {
  @Column({ type: 'text', comment: '产品名称' })
  name: string;

  @Column({ nullable: true, name: 'product_code', unique: true, comment: '产品编码' })
  productCode: string;

  @Column({ nullable: true, comment: '规格' })
  specification: string;

  @Column({ nullable: true, comment: '单位' })
  unit: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'cost_price', default: 0, comment: '成本价' })
  costPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'sale_price', default: 0, comment: '销售价' })
  salePrice: number;

  @Column({ nullable: true, comment: '品牌' })
  brand: string;

  @Column({ nullable: true, comment: '分类' })
  category: string;

  @Column({ nullable: true, comment: '供应商' })
  supplier: string;

  @Column({ type: 'boolean', default: true, name: 'is_active', comment: '是否启用' })
  isActive: boolean;

  @Column({ nullable: true, comment: '备注' })
  remark: string;

  @OneToMany(() => ProductStock, stock => stock.product)
  stock: ProductStock[];
}

@Entity('product_stocks')
export class ProductStock extends BaseEntity {
  @Column({ type: 'uuid', name: 'product_id', comment: '产品ID' })
  productId: string;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ type: 'int', default: 0, comment: '库存数量' })
  quantity: number;

  @Column({ type: 'int', name: 'warning_quantity', default: 10, comment: '库存预警数量' })
  warningQuantity: number;

  @Column({ type: 'int', name: 'max_quantity', default: 1000, comment: '最大库存' })
  maxQuantity: number;

  @Column({ nullable: true, comment: '仓库位置' })
  location: string;
}

export enum StockMovementType {
  IN = 'in',           // 入库
  OUT = 'out',         // 出库
  ADJUST = 'adjust',   // 盘点调整
  RETURN = 'return',   // 退货
}

@Entity('product_stock_movements')
export class ProductStockMovement extends BaseEntity {
  @Column({ type: 'uuid', name: 'product_id', comment: '产品ID' })
  productId: string;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({
    
    
    name: 'movement_type',
    comment: '变动类型'})
  movementType: StockMovementType;

  @Column({ type: 'int', comment: '变动数量(正数)' })
  quantity: number;

  @Column({ type: 'int', name: 'before_quantity', comment: '变动前库存' })
  beforeQuantity: number;

  @Column({ type: 'int', name: 'after_quantity', comment: '变动后库存' })
  afterQuantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'unit_price', nullable: true, comment: '单价' })
  unitPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'total_amount', nullable: true, comment: '总金额' })
  totalAmount: number;

  @Column({ nullable: true, name: 'related_order_id', comment: '关联订单ID' })
  relatedOrderId: string;

  @Column({ nullable: true, comment: '备注' })
  remark: string;

  @Column({ name: 'created_by', comment: '操作人ID' })
  createdBy: string;
}

@Entity('stock_warnings')
export class StockWarning extends BaseEntity {
  @Column({ type: 'uuid', name: 'product_id', comment: '产品ID' })
  productId: string;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ type: 'int', name: 'current_quantity', comment: '当前库存' })
  currentQuantity: number;

  @Column({ type: 'int', name: 'warning_quantity', comment: '预警数量' })
  warningQuantity: number;

  @Column({ type: 'text', default: false, name: 'is_handled', comment: '是否已处理' })
  isHandled: boolean;

  @Column({ type: 'datetime', nullable: true, name: 'handle_time', comment: '处理时间' })
  handleTime: Date;

  @Column({ nullable: true, name: 'handle_by', comment: '处理人ID' })
  handleBy: string;

  @Column({ nullable: true, name: 'handle_remark', comment: '处理备注' })
  handleRemark: string;
}
