import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { EmployeeService } from '../entities/employee-service.entity';
import { CreateEmployeeServiceDto, UpdateEmployeeServiceDto, BatchAssignServiceDto, EmployeeServiceQueryDto } from '../dto/employee-service.dto';

@Injectable()
export class EmployeeServiceService {
  constructor(
    @InjectRepository(EmployeeService)
    private employeeServiceRepository: Repository<EmployeeService>,
  ) {}

  // 获取员工服务列表
  async findAll(query?: EmployeeServiceQueryDto): Promise<EmployeeService[]> {
    const where: any = {};
    
    if (query?.employeeId) {
      where.employeeId = query.employeeId;
    }
    if (query?.serviceId) {
      where.serviceId = query.serviceId;
    }
    if (query?.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    return this.employeeServiceRepository.find({
      where,
      relations: ['employee'],
      order: { sort: 'ASC', createdAt: 'ASC' },
    });
  }

  // 获取单个员工服务
  async findOne(id: string): Promise<EmployeeService> {
    const employeeService = await this.employeeServiceRepository.findOne({
      where: { id },
      relations: ['employee'],
    });
    if (!employeeService) {
      throw new NotFoundException('员工服务关联不存在');
    }
    return employeeService;
  }

  // 创建员工服务关联
  async create(dto: CreateEmployeeServiceDto): Promise<EmployeeService> {
    // 检查是否已存在
    const existing = await this.employeeServiceRepository.findOne({
      where: {
        employeeId: dto.employeeId,
        serviceId: dto.serviceId,
      },
    });

    if (existing) {
      throw new ConflictException('该员工已关联此服务项目');
    }

    const employeeService = this.employeeServiceRepository.create(dto);
    return this.employeeServiceRepository.save(employeeService);
  }

  // 更新员工服务
  async update(id: string, dto: UpdateEmployeeServiceDto): Promise<EmployeeService> {
    const employeeService = await this.findOne(id);
    Object.assign(employeeService, dto);
    return this.employeeServiceRepository.save(employeeService);
  }

  // 删除员工服务
  async remove(id: string): Promise<void> {
    const employeeService = await this.findOne(id);
    await this.employeeServiceRepository.remove(employeeService);
  }

  // 批量分配服务给员工
  async batchAssign(dto: BatchAssignServiceDto): Promise<EmployeeService[]> {
    const results: EmployeeService[] = [];

    for (const serviceId of dto.serviceIds) {
      // 检查是否已存在
      const existing = await this.employeeServiceRepository.findOne({
        where: {
          employeeId: dto.employeeId,
          serviceId,
        },
      });

      if (!existing) {
        const employeeService = this.employeeServiceRepository.create({
          employeeId: dto.employeeId,
          serviceId,
          serviceName: '', // 需要从服务模块获取
          isActive: true,
        });
        results.push(await this.employeeServiceRepository.save(employeeService));
      }
    }

    return results;
  }

  // 批量移除员工服务
  async batchRemove(employeeId: string, serviceIds: string[]): Promise<void> {
    await this.employeeServiceRepository.delete({
      employeeId,
      serviceId: In(serviceIds),
    });
  }

  // 获取员工可提供的服务
  async getServicesByEmployee(employeeId: string): Promise<EmployeeService[]> {
    return this.employeeServiceRepository.find({
      where: { employeeId, isActive: true },
      order: { sort: 'ASC' },
    });
  }

  // 获取服务对应的员工列表
  async getEmployeesByService(serviceId: string): Promise<EmployeeService[]> {
    return this.employeeServiceRepository.find({
      where: { serviceId, isActive: true },
      relations: ['employee'],
      order: { sort: 'ASC' },
    });
  }
}
