import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Employee } from './employee.entity';

@Entity('employee_services')
@Index(['employeeId', 'serviceId'], { unique: true })
export class EmployeeService extends BaseEntity {
  @Column({ name: 'employee_id', comment: '员工ID' })
  employeeId: string;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @Column({ name: 'service_id', comment: '服务项目ID' })
  serviceId: string;

  @Column({ length: 100, comment: '服务项目名称' })
  serviceName: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, comment: '服务价格' })
  price?: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true, comment: '提成比例(%)' })
  commissionRate?: number;

  @Column({ type: 'int', nullable: true, comment: '服务时长(分钟)' })
  duration?: number;

  @Column({ type: 'text', default: true, comment: '是否启用' })
  isActive: boolean;

  @Column({ type: 'text', default: 0, comment: '排序' })
  sort: number;

  @Column({ type: 'text', nullable: true, comment: '备注' })
  remark?: string;
}
