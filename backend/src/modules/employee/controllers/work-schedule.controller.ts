import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { WorkScheduleService } from '../services/work-schedule.service';

@Controller('employees/schedules')
export class WorkScheduleController {
  constructor(private readonly service: WorkScheduleService) {}

  @Get()
  findAll(
    @Query('employeeId') employeeId?: string,
    @Query('date') date?: string,
    @Query('type') type?: string,
  ) {
    return this.service.findAll({ employeeId, date, type });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() body: any) {
    return this.service.create(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.service.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}