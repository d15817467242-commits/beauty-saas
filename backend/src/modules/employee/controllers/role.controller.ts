import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { RoleService } from '../services/role.service';
import { CreateRoleDto, UpdateRoleDto, AssignRoleDto } from '../dto/role.dto';

@Controller('employees/roles')
export class RoleController {
  constructor(private readonly service: RoleService) {}

  @Post()
  create(@Body() dto: CreateRoleDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Post('assign-to-employee')
  assignToEmployee(@Body() dto: AssignRoleDto) {
    return this.service.assignToEmployee(dto.employeeId, dto.roleIds, 'system');
  }

  @Get('employee/:employeeId')
  getEmployeeRoles(@Param('employeeId') employeeId: string) {
    return this.service.getEmployeeRoles(employeeId);
  }
}
