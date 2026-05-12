import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Employee } from './employee.entity';
import { Role } from '../../auth/role.entity';

@Entity('employee_roles')
@Index(['employeeId', 'roleId'], { unique: true })
export class EmployeeRole extends BaseEntity {
  @Column({ name: 'employee_id', comment: '员工ID' })
  employeeId: string;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @Column({ name: 'role_id', comment: '角色ID' })
  roleId: string;

  @ManyToOne(() => Role)
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @Column({ name: 'assigned_by', nullable: true, comment: '分配人ID' })
  assignedBy: string;

  @Column({ name: 'assigned_at', type: 'datetime', nullable: true, comment: '分配时间' })
  assignedAt: Date;
}
