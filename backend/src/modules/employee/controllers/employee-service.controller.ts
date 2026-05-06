import { Controller, Get, Post, Put, Delete, Body, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { EmployeeServiceService } from '../services/employee-service.service';
import { EmployeeService } from '../entities/employee-service.entity';
import { CreateEmployeeServiceDto, UpdateEmployeeServiceDto, BatchAssignServiceDto, EmployeeServiceQueryDto } from '../dto/employee-service.dto';

@Controller('employee-service')
export class EmployeeServiceController {
  constructor(private readonly service: EmployeeServiceService) {}

  @Get()
  findAll(@Query() query: EmployeeServiceQueryDto): Promise<EmployeeService[]> {
    return this.service.findAll(query);
  }

  @Get('employee/:employeeId')
  getServicesByEmployee(@Param('employeeId', ParseUUIDPipe) employeeId: string): Promise<EmployeeService[]> {
    return this.service.getServicesByEmployee(employeeId);
  }

  @Get('service/:serviceId')
  getEmployeesByService(@Param('serviceId', ParseUUIDPipe) serviceId: string): Promise<EmployeeService[]> {
    return this.service.getEmployeesByService(serviceId);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<EmployeeService> {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateEmployeeServiceDto): Promise<EmployeeService> {
    return this.service.create(dto);
  }

  @Post('batch-assign')
  batchAssign(@Body() dto: BatchAssignServiceDto): Promise<EmployeeService[]> {
    return this.service.batchAssign(dto);
  }

  @Post('batch-remove')
  async batchRemove(@Body() dto: { employeeId: string; serviceIds: string[] }): Promise<{ success: boolean }> {
    await this.service.batchRemove(dto.employeeId, dto.serviceIds);
    return { success: true };
  }

  @Put(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEmployeeServiceDto
  ): Promise<EmployeeService> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<{ success: boolean }> {
    await this.service.remove(id);
    return { success: true };
  }
}
