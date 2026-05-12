import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Room } from '../../room/entities/room.entity';

export enum RoomType {
  ROOM = 'room',
  BED = 'bed',
  CHAIR = 'chair',
}

export enum RoomStatus {
  AVAILABLE = 'available',
  OCCUPIED = 'occupied',
  MAINTENANCE = 'maintenance',
  RESERVED = 'reserved',
}

@Entity('room_beds')
export class RoomBed extends BaseEntity {
  @Column({ name: 'room_id', comment: '房间ID' })
  roomId: string;

  @ManyToOne(() => Room)
  @JoinColumn({ name: 'room_id' })
  room: Room;

  @Column({ type: 'text', comment: '床位名称' })
  name: string;

  @Column({ nullable: true, comment: '床位编码' })
  code: string;

  @Column({ type: 'text', default: RoomStatus.AVAILABLE, comment: '床位状态' })
  status: RoomStatus;

  @Column({ nullable: true, comment: '备注' })
  remark: string;
}

@Entity('room_usages')
export class RoomUsage extends BaseEntity {
  @Column({ name: 'room_id', comment: '房间ID' })
  roomId: string;

  @ManyToOne(() => Room)
  @JoinColumn({ name: 'room_id' })
  room: Room;

  @Column({ name: 'bed_id', nullable: true, comment: '床位ID' })
  bedId: string;

  @ManyToOne(() => RoomBed)
  @JoinColumn({ name: 'bed_id' })
  bed: RoomBed;

  @Column({ name: 'appointment_id', nullable: true, comment: '预约ID' })
  appointmentId: string;

  @Column({ name: 'member_id', nullable: true, comment: '会员ID' })
  memberId: string;

  @Column({ name: 'employee_id', nullable: true, comment: '员工ID' })
  employeeId: string;

  @Column({ type: 'datetime', name: 'start_time', comment: '开始使用时间' })
  startTime: Date;

  @Column({ type: 'datetime', name: 'end_time', nullable: true, comment: '结束使用时间' })
  endTime: Date;

  @Column({ type: 'text', default: 'using', comment: '使用状态: using=使用中, completed=已完成' })
  status: string;

  @Column({ nullable: true, comment: '备注' })
  remark: string;
}
