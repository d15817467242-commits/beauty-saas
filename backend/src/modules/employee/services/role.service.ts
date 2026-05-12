import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../../auth/role.entity';
import { EmployeeRole } from '../entities/employee-role.entity';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(EmployeeRole)
    private employeeRoleRepository: Repository<EmployeeRole>,
  ) {}

  async create(data: Partial<Role>): Promise<Role> {
    const existing = await this.roleRepository.findOne({ where: { code: data.code } });
    if (existing) throw new ConflictException('角色编码已存在');
    const role = this.roleRepository.create(data);
    return this.roleRepository.save(role);
  }

  async findAll(): Promise<Role[]> {
    return this.roleRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<Role> {
    const role = await this.roleRepository.findOne({ where: { id } });
    if (!role) throw new NotFoundException('角色不存在');
    return role;
  }

  async update(id: string, data: Partial<Role>): Promise<Role> {
    const role = await this.findOne(id);
    Object.assign(role, data);
    return this.roleRepository.save(role);
  }

  async remove(id: string): Promise<void> {
    const role = await this.findOne(id);
    await this.roleRepository.remove(role);
  }

  async assignToEmployee(employeeId: string, roleIds: string[], assignedBy: string): Promise<EmployeeRole[]> {
    await this.employeeRoleRepository.delete({ employeeId });
    const employeeRoles: EmployeeRole[] = [];
    for (const roleId of roleIds) {
      const employeeRole = this.employeeRoleRepository.create({
        employeeId,
        roleId,
        assignedBy,
        assignedAt: new Date(),
      });
      employeeRoles.push(employeeRole);
    }
    return this.employeeRoleRepository.save(employeeRoles);
  }

  async getEmployeeRoles(employeeId: string): Promise<Role[]> {
    const employeeRoles = await this.employeeRoleRepository.find({
      where: { employeeId },
      relations: ['role'],
    });
    return employeeRoles.map(er => er.role);
  }
}