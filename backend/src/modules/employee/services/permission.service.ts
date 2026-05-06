import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission, PermissionType } from '../entities/permission.entity';
import { CreatePermissionDto, UpdatePermissionDto } from '../dto/permission.dto';

@Injectable()
export class PermissionService {
  constructor(
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,
  ) {}

  async create(dto: CreatePermissionDto): Promise<Permission> {
    // 检查编码是否已存在
    const existing = await this.permissionRepository.findOne({
      where: { code: dto.code },
    });
    if (existing) {
      throw new ConflictException('权限编码已存在');
    }

    const permission = this.permissionRepository.create(dto);
    return this.permissionRepository.save(permission);
  }

  async findAll(isActive?: boolean, permissionType?: PermissionType): Promise<Permission[]> {
    const query = this.permissionRepository.createQueryBuilder('permission');
    
    if (isActive !== undefined) {
      query.where('permission.isActive = :isActive', { isActive });
    }
    
    if (permissionType) {
      query.andWhere('permission.permissionType = :permissionType', { permissionType });
    }
    
    return query.orderBy('permission.sortOrder', 'ASC').addOrderBy('permission.createdAt', 'DESC').getMany();
  }

  async findOne(id: string): Promise<Permission> {
    const permission = await this.permissionRepository.findOne({ where: { id } });
    if (!permission) {
      throw new NotFoundException('权限不存在');
    }
    return permission;
  }

  async findByCode(code: string): Promise<Permission> {
    const permission = await this.permissionRepository.findOne({ where: { code } });
    if (!permission) {
      throw new NotFoundException('权限不存在');
    }
    return permission;
  }

  async update(id: string, dto: UpdatePermissionDto): Promise<Permission> {
    const permission = await this.findOne(id);
    
    if (dto.code && dto.code !== permission.code) {
      const existing = await this.permissionRepository.findOne({
        where: { code: dto.code },
      });
      if (existing) {
        throw new ConflictException('权限编码已存在');
      }
    }
    
    Object.assign(permission, dto);
    return this.permissionRepository.save(permission);
  }

  async remove(id: string): Promise<void> {
    const permission = await this.findOne(id);
    await this.permissionRepository.remove(permission);
  }

  // 获取权限树
  async getPermissionTree(): Promise<any[]> {
    const permissions = await this.permissionRepository.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC' },
    });

    return this.buildTree(permissions, null);
  }

  private buildTree(permissions: Permission[], parentId: string | null): any[] {
    return permissions
      .filter(p => p.parentId === parentId)
      .map(p => ({
        ...p,
        children: this.buildTree(permissions, p.id),
      }));
  }
}
