import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('room_beds')
export class RoomBed extends BaseEntity {
  @Column({ length: 50, comment: '床位名称' })
  name: string;

  @Column({ nullable: true, length: 50, comment: '床位编码' })
  code: string;

  @Column({ name: 'room_id', comment: '所属房间ID' })
  roomId: string;

  @Column({ type: 'text', default: 'available', comment: '状态' })
  status: 'available' | 'occupied' | 'maintenance';

  @Column({ type: 'int', default: 1, comment: '容纳人数' })
  capacity: number;
}
