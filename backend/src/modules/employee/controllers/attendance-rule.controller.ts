import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { AttendanceRuleService } from '../services/attendance-rule.service';
import { CreateAttendanceRuleDto, UpdateAttendanceRuleDto } from '../dto/attendance-rule.dto';

@Controller('employees/attendance-rules')
export class AttendanceRuleController {
  constructor(private readonly service: AttendanceRuleService) {}

  @Post()
  create(@Body() dto: CreateAttendanceRuleDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll(@Query('isActive') isActive?: boolean) {
    return this.service.findAll(isActive);
  }

  @Get('active')
  getActiveRule() {
    return this.service.getActiveRule();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAttendanceRuleDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
