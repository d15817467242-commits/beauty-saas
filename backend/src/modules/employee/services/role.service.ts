import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Role } from '../entities/role.entity';
import { Permission } from '../entities/permission.entity';
import { EmployeeRole } from '../entities/employee-role.entity';
import { Employee } from '../entities/employee.entity';
import { CreateRoleDto, UpdateRoleDto, AssignRoleDto, AssignPermissionDto } from '../dto/role.dto';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,
    @InjectRepository(EmployeeRole)
    private employeeRoleRepository: Repository<EmployeeRole>,
    @InjectRepository(Employee)
    private employeeRepository: Repository<Employee>,
  ) {}

  async create(dto: CreateRoleDto): Promise<Role> {
    // 检查编码是否已存在
    const existing = await this.roleRepository.findOne({
      where: { code: dto.code },
    });
    if (existing) {
      throw new ConflictException('角色编码已存在');
    }

    const role = this.roleRepository.create({
      name: dto.name,
      code: dto.code,
      description: dto.description,
      isActive: dto.isActive,
      sortOrder: dto.sortOrder,
    });

    if (dto.permissionIds && dto.permissionIds.length > 0) {
      role.permissions = await this.permissionRepository.find({
        where: { id: In(dto.permissionIds) },
      });
    }

    return this.roleRepository.save(role);
  }

  async findAll(isActive?: boolean): Promise<Role[]> {
    const query = this.roleRepository.createQueryBuilder('role')
      .leftJoinAndSelect('role.permissions', 'permission');
    
    if (isActive !== undefined) {
      query.where('role.isActive = :isActive', { isActive });
    }
    
    return query.orderBy('role.sortOrder', 'ASC').addOrderBy('role.createdAt', 'DESC').getMany();
  }

  async findOne(id: string): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: { id },
      relations: ['permissions'],
    });
    if (!role) {
      throw new NotFoundException('角色不存在');
    }
    return role;
  }

  async update(id: string, dto: UpdateRoleDto): Promise<Role> {
    const role = await this.findOne(id);
    
    if (role.isSystem) {
      throw new NotFoundException('系统内置角色不能修改');
    }

    if (dto.code && dto.code !== role.code) {
      const existing = await this.roleRepository.findOne({
        where: { code: dto.code },
      });
      if (existing) {
        throw new ConflictException('角色编码已存在');
      }
    }

    Object.assign(role, dto);

    if (dto.permissionIds !== undefined) {
      role.permissions = await this.permissionRepository.find({
        where: { id: In(dto.permissionIds) },
      });
    }

    return this.roleRepository.save(role);
  }

  async remove(id: string): Promise<void> {
    const role = await this.findOne(id);
    
    if (role.isSystem) {
      throw new NotFoundException('系统内置角色不能删除');
    }

    await this.roleRepository.remove(role);
  }

  // 分配权限给角色
  async assignPermissions(dto: AssignPermissionDto): Promise<Role> {
    const role = await this.findOne(dto.roleId);
    
    role.permissions = await this.permissionRepository.find({
      where: { id: In(dto.permissionIds) },
    });

    return this.roleRepository.save(role);
  }

  // 给员工分配角色
  async assignToEmployee(dto: AssignRoleDto, assignedBy: string): Promise<EmployeeRole[]> {
    // 删除员工现有角色
    await this.employeeRoleRepository.delete({ employeeId: dto.employeeId });

    // 创建新的角色关联
    const employeeRoles: EmployeeRole[] = [];
    const now = new Date();

    for (const roleId of dto.roleIds) {
      const employeeRole = this.employeeRoleRepository.create({
        employeeId: dto.employeeId,
        roleId,
        assignedBy,
        assignedAt: now,
      });
      employeeRoles.push(employeeRole);
    }

    return this.employeeRoleRepository.save(employeeRoles);
  }

  // 获取员工的角色
  async getEmployeeRoles(employeeId: string): Promise<Role[]> {
    const employeeRoles = await this.employeeRoleRepository.find({
      where: { employeeId },
      relations: ['role', 'role.permissions'],
    });

    return employeeRoles.map(er => er.role);
  }

  // 获取员工的所有权限
  async getEmployeePermissions(employeeId: string): Promise<Permission[]> {
    const roles = await this.getEmployeeRoles(employeeId);
    const permissions = new Map<string, Permission>();

    for (const role of roles) {
      for (const permission of role.permissions || []) {
        permissions.set(permission.id, permission);
      }
    }

    return Array.from(permissions.values());
  }

  // 检查员工是否有某个权限
  async hasPermission(employeeId: string, permissionCode: string): Promise<boolean> {
    const permissions = await this.getEmployeePermissions(employeeId);
    return permissions.some(p => p.code === permissionCode);
  }
}
