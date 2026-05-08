import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { EmployeeService } from './employee.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { EmployeeStatus } from './entities/employee.entity';

@Controller('employees')
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}

  @Post()
  create(@Body() createEmployeeDto: CreateEmployeeDto) {
    return this.employeeService.create(createEmployeeDto);
  }

  @Get()
  findAll(@Query('status') status?: EmployeeStatus) {
    return this.employeeService.findAll(status);
  }

  @Get('detail/:id')
  findOne(@Param('id') id: string) {
    return this.employeeService.findOne(id);
  }

  @Patch('detail/:id')
  update(@Param('id') id: string, @Body() updateEmployeeDto: UpdateEmployeeDto) {
    return this.employeeService.update(id, updateEmployeeDto);
  }

  @Delete('detail/:id')
  remove(@Param('id') id: string) {
    return this.employeeService.remove(id);
  }

  // 提成相关API
  @Patch('detail/:id/commission')
  updateCommission(
    @Param('id') id: string,
    @Body() body: { baseCommissionRate?: number; commissionRules?: any },
  ) {
    return this.employeeService.updateCommission(id, body.baseCommissionRate, body.commissionRules);
  }

  @Get('detail/:id/commission-stats')
  getCommissionStats(@Param('id') id: string) {
    return this.employeeService.getCommissionStats(id);
  }
}
