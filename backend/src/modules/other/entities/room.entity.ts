import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

export enum RoomType {
  SINGLE = 'single',     // 单人房
  DOUBLE = 'double',     // 双人房
  SUITE = 'suite',       // 套房
  VIP = 'vip',           // VIP房
  TREATMENT = 'treatment', // 治疗室
  WAITING = 'waiting',   // 等候区
}

export enum RoomStatus {
  AVAILABLE = 'available', // 空闲
  OCCUPIED = 'occupied',   // 使用中
  MAINTENANCE = 'maintenance', // 维护中
  CLEANING = 'cleaning',   // 清洁中
}

@Entity('rooms')
export class Room extends BaseEntity {
  @Column({ length: 50, comment: '房间名称' })
  name: string;

  @Column({ length: 50, nullable: true, comment: '房间编号' })
  code?: string;

  @Column({ type: 'text',
    
    
    default: RoomType.TREATMENT,
    comment: '房间类型'})
  type: RoomType;

  @Column({ type: 'int', default: 1, comment: '床位数' })
  bedCount: number;

  @Column({ type: 'int', default: 1, comment: '容纳人数' })
  capacity: number;

  @Column({ type: 'text',
    
    
    default: RoomStatus.AVAILABLE,
    comment: '房间状态'})
  status: RoomStatus;

  @Column({ length: 100, nullable: true, comment: '所属楼层' })
  floor?: string;

  @Column({ length: 100, nullable: true, comment: '所属部门ID' })
  departmentId?: string;

  @Column({ type: 'text', nullable: true, comment: '房间设施' })
  facilities?: string;

  @Column({ type: 'text', nullable: true, comment: '备注' })
  remark?: string;

  @Column({ type: 'text', default: 0, comment: '排序' })
  sort: number;

  @Column({ type: 'text', default: true, comment: '是否启用' })
  isActive: boolean;
}

@Entity('room_beds')
@Index(['roomId', 'bedNumber'], { unique: true })
export class RoomBed extends BaseEntity {
  @Column({ name: 'room_id', comment: '房间ID' })
  roomId: string;

  @ManyToOne(() => Room)
  @JoinColumn({ name: 'room_id' })
  room: Room;

  @Column({ type: 'int', name: 'bed_number', comment: '床位号' })
  bedNumber: number;

  @Column({ length: 50, comment: '床位名称' })
  name: string;

  @Column({ type: 'text',
    
    
    default: RoomStatus.AVAILABLE,
    comment: '床位状态'})
  status: RoomStatus;

  @Column({ nullable: true, name: 'current_member_id', comment: '当前使用会员ID' })
  currentMemberId?: string;

  @Column({ type: 'datetime', nullable: true, name: 'start_time', comment: '开始使用时间' })
  startTime?: Date;

  @Column({ type: 'text', nullable: true, comment: '备注' })
  remark?: string;
}

@Entity('room_usages')
export class RoomUsage extends BaseEntity {
  @Column({ name: 'room_id', comment: '房间ID' })
  roomId: string;

  @ManyToOne(() => Room)
  @JoinColumn({ name: 'room_id' })
  room: Room;

  @Column({ nullable: true, name: 'bed_id', comment: '床位ID' })
  bedId?: string;

  @ManyToOne(() => RoomBed, { nullable: true })
  @JoinColumn({ name: 'bed_id' })
  bed?: RoomBed;

  @Column({ name: 'member_id', comment: '会员ID' })
  memberId: string;

  @Column({ nullable: true, name: 'order_id', comment: '订单ID' })
  orderId?: string;

  @Column({ type: 'datetime', name: 'start_time', comment: '开始时间' })
  startTime: Date;

  @Column({ type: 'datetime', nullable: true, name: 'end_time', comment: '结束时间' })
  endTime?: Date;

  @Column({ type: 'int', nullable: true, comment: '使用时长(分钟)' })
  duration?: number;

  @Column({ length: 50, nullable: true, comment: '服务项目' })
  serviceName?: string;

  @Column({ nullable: true, name: 'employee_id', comment: '服务员工ID' })
  employeeId?: string;

  @Column({ type: 'text', nullable: true, comment: '备注' })
  remark?: string;
}
