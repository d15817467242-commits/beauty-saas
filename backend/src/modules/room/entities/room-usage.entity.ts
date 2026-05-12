import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('room_usages')
export class RoomUsage extends BaseEntity {
  @Column({ name: 'room_id', comment: '房间ID' })
  roomId: string;

  @Column({ nullable: true, name: 'member_id', comment: '会员ID' })
  memberId: string;

  @Column({ nullable: true, name: 'employee_id', comment: '员工ID' })
  employeeId: string;

  @Column({ type: 'datetime', name: 'start_time', comment: '开始时间' })
  startTime: Date;

  @Column({ type: 'datetime', nullable: true, name: 'end_time', comment: '结束时间' })
  endTime: Date;

  @Column({ type: 'text', default: 'using', comment: '状态' })
  status: 'using' | 'completed';

  @Column({ nullable: true, comment: '备注' })
  remark: string;
}
