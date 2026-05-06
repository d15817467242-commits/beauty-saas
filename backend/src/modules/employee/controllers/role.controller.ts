import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { RoleService } from '../services/role.service';
import { CreateRoleDto, UpdateRoleDto, AssignRoleDto, AssignPermissionDto } from '../dto/role.dto';

@Controller('employees/roles')
export class RoleController {
  constructor(private readonly service: RoleService) {}

  @Post()
  create(@Body() dto: CreateRoleDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll(@Query('isActive') isActive?: boolean) {
    return this.service.findAll(isActive);
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

  @Post('assign-permissions')
  assignPermissions(@Body() dto: AssignPermissionDto) {
    return this.service.assignPermissions(dto);
  }

  @Post('assign-to-employee')
  assignToEmployee(@Body() dto: AssignRoleDto) {
    // TODO: 从JWT获取当前用户ID
    return this.service.assignToEmployee(dto, 'system');
  }

  @Get('employee/:employeeId')
  getEmployeeRoles(@Param('employeeId') employeeId: string) {
    return this.service.getEmployeeRoles(employeeId);
  }

  @Get('employee/:employeeId/permissions')
  getEmployeePermissions(@Param('employeeId') employeeId: string) {
    return this.service.getEmployeePermissions(employeeId);
  }

  @Get('employee/:employeeId/check/:permissionCode')
  hasPermission(
    @Param('employeeId') employeeId: string,
    @Param('permissionCode') permissionCode: string,
  ) {
    return this.service.hasPermission(employeeId, permissionCode);
  }
}
