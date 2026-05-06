import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Employee, EmployeeStatus, CommissionType } from './entities/employee.entity';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

@Injectable()
export class EmployeeService {
  constructor(
    @InjectRepository(Employee)
    private employeeRepository: Repository<Employee>,
  ) {}

  async create(createEmployeeDto: CreateEmployeeDto): Promise<Employee> {
    const existingEmployee = await this.employeeRepository.findOne({
      where: { employeeNo: createEmployeeDto.employeeNo },
    });
    
    if (existingEmployee) {
      throw new ConflictException('工号已存在');
    }
    
    const employee = this.employeeRepository.create({
      ...createEmployeeDto,
      commissionType: createEmployeeDto.commissionType as CommissionType || CommissionType.PERCENT,
    });
    return this.employeeRepository.save(employee);
  }

  async findAll(status?: EmployeeStatus): Promise<Employee[]> {
    const query = this.employeeRepository.createQueryBuilder('employee');
    
    if (status) {
      query.where('employee.status = :status', { status });
    }
    
    return query.orderBy('employee.createdAt', 'DESC').getMany();
  }

  async findOne(id: string): Promise<Employee> {
    const employee = await this.employeeRepository.findOne({ where: { id } });
    
    if (!employee) {
      throw new NotFoundException('员工不存在');
    }
    
    return employee;
  }

  async update(id: string, updateEmployeeDto: UpdateEmployeeDto): Promise<Employee> {
    const employee = await this.findOne(id);
    Object.assign(employee, updateEmployeeDto);
    return this.employeeRepository.save(employee);
  }

  async updateStats(id: string, sales: number, commission: number): Promise<Employee> {
    const employee = await this.findOne(id);
    employee.totalSales = Number(employee.totalSales) + sales;
    employee.totalCommission = Number(employee.totalCommission) + commission;
    return this.employeeRepository.save(employee);
  }

  async remove(id: string): Promise<void> {
    const employee = await this.findOne(id);
    await this.employeeRepository.remove(employee);
  }

  // ========== 提成相关 ==========

  async updateCommission(
    id: string,
    baseCommissionRate?: number,
    commissionRules?: any,
  ): Promise<Employee> {
    const employee = await this.findOne(id);
    if (baseCommissionRate !== undefined) {
      employee.baseCommissionRate = baseCommissionRate;
    }
    if (commissionRules !== undefined) {
      employee.serviceCommissionRules = commissionRules;
    }
    return this.employeeRepository.save(employee);
  }

  async getCommissionStats(id: string): Promise<any> {
    const employee = await this.findOne(id);
    return {
      employeeId: employee.id,
      employeeName: employee.name,
      baseCommissionRate: employee.baseCommissionRate || 0,
      commissionRules: employee.serviceCommissionRules || {},
      totalSales: employee.totalSales,
      totalCommission: employee.totalCommission,
    };
  }

  // 计算员工对某服务的提成
  calculateCommission(
    employee: Employee,
    serviceId: string,
    amount: number,
    serviceCommissionRate?: number,
    serviceFixedCommission?: number,
  ): number {
    // 优先使用服务项目的固定提成
    if (serviceFixedCommission) {
      return serviceFixedCommission;
    }

    // 其次使用服务项目的提成比例
    if (serviceCommissionRate) {
      return amount * serviceCommissionRate / 100;
    }

    // 再检查员工的个性化提成规则
    if (employee.serviceCommissionRules && employee.serviceCommissionRules[serviceId]) {
      const rule = employee.serviceCommissionRules[serviceId] as any;
      if (rule && rule.fixedCommission) {
        return rule.fixedCommission;
      }
      if (rule && rule.commissionRate) {
        return amount * rule.commissionRate / 100;
      }
    }

    // 最后使用员工基础提成比例
    if (employee.baseCommissionRate) {
      return amount * employee.baseCommissionRate / 100;
    }

    return 0;
  }
}
