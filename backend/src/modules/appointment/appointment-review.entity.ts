import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Appointment } from './appointment.entity';
import { Member } from '../member/member.entity';
import { Employee } from '../employee/entities/employee.entity';

@Entity('appointment_reviews')
@Index(['appointmentId'])
@Index(['employeeId', 'createdAt'])
@Index(['memberId', 'createdAt'])
export class AppointmentReview extends BaseEntity {
  @Column({ name: 'appointment_id', comment: '预约ID' })
  appointmentId: string;

  @ManyToOne(() => Appointment)
  @JoinColumn({ name: 'appointment_id' })
  appointment: Appointment;

  @Column({ name: 'member_id', nullable: true, comment: '会员ID' })
  memberId: string;

  @ManyToOne(() => Member, { nullable: true })
  @JoinColumn({ name: 'member_id' })
  member: Member;

  @Column({ name: 'employee_id', comment: '员工ID' })
  employeeId: string;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @Column({ 
    type: 'int',
    comment: '评分�?-5分）' 
  })
  rating: number;

  @Column({ 
    type: 'int',
    name: 'service_rating',
    nullable: true,
    comment: '服务评分' 
  })
  serviceRating: number;

  @Column({ 
    type: 'int',
    name: 'environment_rating',
    nullable: true,
    comment: '环境评分' 
  })
  environmentRating: number;

  @Column({ 
    type: 'int',
    name: 'attitude_rating',
    nullable: true,
    comment: '态度评分' 
  })
  attitudeRating: number;

  @Column({ 
    type: 'text',
    nullable: true,
    comment: '评价内容' 
  })
  content: string;

  @Column({ 
    type: 'text',
    nullable: true,
    comment: '评价标签' 
  })
  tags: string[];

  @Column({ 
    type: 'text',
    name: 'image_urls',
    nullable: true,
    comment: '评价图片' 
  })
  imageUrls: string[];

  @Column({ 
    name: 'is_anonymous',
    default: false,
    comment: '是否匿名' 
  })
  isAnonymous: boolean;

  @Column({ 
    type: 'text',
    name: 'reply_content',
    nullable: true,
    comment: '商家回复内容' 
  })
  replyContent: string;

  @Column({ 
    type: 'datetime',
    name: 'replied_at',
    nullable: true,
    comment: '商家回复时间' 
  })
  repliedAt: Date;

  @Column({ name: 'created_by', comment: '创建人ID' })
  createdBy: string;
}
