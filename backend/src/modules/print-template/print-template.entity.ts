import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

export enum PrintTemplateType {
  RECEIPT = 'receipt',         // 小票
  INVOICE = 'invoice',         // 发票
  APPOINTMENT = 'appointment', // 预约单
  SERVICE = 'service',         // 服务单
  MEMBER_CARD = 'member_card', // 会员卡
  COUPON = 'coupon',           // 优惠券
  LABEL = 'label',             // 标签
  REPORT = 'report',           // 报表
}

export enum PrintPaperSize {
  A4 = 'a4',
  A5 = 'a5',
  THERMAL_58 = 'thermal_58',   // 58mm热敏纸
  THERMAL_80 = 'thermal_80',   // 80mm热敏纸
  CUSTOM = 'custom'}

@Entity('print_templates')
export class PrintTemplate extends BaseEntity {
  @Column({ name: 'store_id', nullable: true, comment: '门店ID，为空表示全局模板' })
  storeId: string;

  @Column({ type: 'text', comment: '模板名称' })
  name: string;

  @Column({ unique: true, comment: '模板编码' })
  code: string;

  @Column({ type: 'text',
    
    
    comment: '模板类型'})
  type: PrintTemplateType;

  @Column({ type: 'text',
    
    
    default: PrintPaperSize.A4,
    comment: '纸张大小'})
  paperSize: PrintPaperSize;

  @Column({ type: 'text', default: 0, name: 'page_width', comment: '页面宽度(mm)' })
  pageWidth: number;

  @Column({ type: 'text', default: 0, name: 'page_height', comment: '页面高度(mm)' })
  pageHeight: number;

  @Column({ type: 'text', default: 0, name: 'margin_top', comment: '上边距(mm)' })
  marginTop: number;

  @Column({ type: 'text', default: 0, name: 'margin_bottom', comment: '下边距(mm)' })
  marginBottom: number;

  @Column({ type: 'text', default: 0, name: 'margin_left', comment: '左边距(mm)' })
  marginLeft: number;

  @Column({ type: 'text', default: 0, name: 'margin_right', comment: '右边距(mm)' })
  marginRight: number;

  @Column({ type: 'text', comment: '模板内容(HTML/模板语法)' })
  content: string;

  @Column({ nullable: true, type: 'text', comment: '模板样式(CSS)' })
  style: string;

  @Column({ nullable: true, type: 'text', comment: '模板变量定义' })
  variables: TemplateVariable[];

  @Column({ type: 'text', default: true, name: 'is_default', comment: '是否默认模板' })
  isDefault: boolean;

  @Column({ type: 'text', default: true, name: 'is_active', comment: '是否启用' })
  isActive: boolean;

  @Column({ type: 'text', default: 0, name: 'sort_order', comment: '排序' })
  sortOrder: number;

  @Column({ nullable: true, comment: '模板描述' })
  description: string;

  @Column({ nullable: true, type: 'text', comment: '扩展配置' })
  extra: Record<string, any>;
}

export interface TemplateVariable {
  name: string;           // 变量名
  label: string;          // 显示名称
  type: 'string' | 'number' | 'date' | 'boolean' | 'array' | 'object';
  defaultValue?: any;     // 默认值
  required?: boolean;     // 是否必填
  description?: string;   // 变量描述
  format?: string;        // 格式化规则(如日期格式)
}

@Entity('print_template_variables')
export class PrintTemplateVariable extends BaseEntity {
  @Column({ name: 'template_id', comment: '模板ID' })
  templateId: string;

  @Column({ type: 'text', comment: '变量名' })
  name: string;

  @Column({ type: 'text', comment: '显示名称' })
  label: string;

  @Column({ type: 'text', default: 'string', comment: '变量类型' })
  type: string;

  @Column({ nullable: true, type: 'text', name: 'default_value', comment: '默认值' })
  defaultValue: string;

  @Column({ type: 'text', default: false, name: 'is_required', comment: '是否必填' })
  isRequired: boolean;

  @Column({ nullable: true, comment: '变量描述' })
  description: string;

  @Column({ nullable: true, comment: '格式化规则' })
  format: string;

  @Column({ type: 'text', default: 0, name: 'sort_order', comment: '排序' })
  sortOrder: number;
}
