import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Member } from '../member/member.entity';
import { Employee } from '../employee/entities/employee.entity';
import { Service } from '../service/service.entity';

export enum AppointmentStatus {
  PENDING = 'pending',     // 待确认
  CONFIRMED = 'confirmed', // 已确认
  COMPLETED = 'completed', // 已完成
  CANCELLED = 'cancelled', // 已取消
  NO_SHOW = 'no_show',     // 未到店
}

@Entity('appointments')
@Index(['employeeId', 'appointmentDate', 'startTime'])
@Index(['memberId', 'appointmentDate'])
export class Appointment extends BaseEntity {
  @Column({ name: 'member_id', nullable: true, comment: '会员ID（散客可为空）' })
  memberId: string;

  @ManyToOne(() => Member, { nullable: true })
  @JoinColumn({ name: 'member_id' })
  member: Member;

  @Column({ name: 'guest_name', nullable: true, comment: '散客姓名' })
  guestName: string;

  @Column({ name: 'guest_phone', nullable: true, comment: '散客电话' })
  guestPhone: string;

  @Column({ name: 'service_id', comment: '服务项目ID' })
  serviceId: string;

  @ManyToOne(() => Service)
  @JoinColumn({ name: 'service_id' })
  service: Service;

  @Column({ name: 'employee_id', comment: '服务员工ID' })
  employeeId: string;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @Column({ type: 'date', name: 'appointment_date', comment: '预约日期' })
  appointmentDate: Date;

  @Column({ type: 'time', name: 'start_time', comment: '开始时间' })
  startTime: string;

  @Column({ type: 'time', name: 'end_time', comment: '结束时间' })
  endTime: string;

  @Column({ type: 'text',
    
    
    default: AppointmentStatus.PENDING,
    comment: '状态'})
  status: AppointmentStatus;

  @Column({ nullable: true, comment: '备注' })
  remark: string;

  @Column({ nullable: true, name: 'cancel_reason', comment: '取消原因' })
  cancelReason: string;

  @Column({ name: 'created_by', comment: '创建人ID' })
  createdBy: string;
}
