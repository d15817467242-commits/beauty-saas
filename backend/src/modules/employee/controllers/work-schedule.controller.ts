import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { WorkScheduleService } from '../services/work-schedule.service';
import { CreateWorkScheduleDto, UpdateWorkScheduleDto, BatchScheduleDto, CopyScheduleDto } from '../dto/work-schedule.dto';

@Controller('employees/schedules')
export class WorkScheduleController {
  constructor(private readonly service: WorkScheduleService) {}

  @Post()
  create(@Body() dto: CreateWorkScheduleDto) {
    return this.service.create(dto);
  }

  @Post('batch')
  batchSchedule(@Body() dto: BatchScheduleDto) {
    return this.service.batchSchedule(dto);
  }

  @Post('copy')
  copySchedule(@Body() dto: CopyScheduleDto) {
    return this.service.copySchedule(dto);
  }

  @Get()
  findAll(
    @Query('employeeId') employeeId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.service.findAll(employeeId, startDate, endDate);
  }

  @Get('calendar/:employeeId')
  getCalendar(@Param('employeeId') employeeId: string, @Query('month') month: string) {
    return this.service.getEmployeeCalendar(employeeId, month);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateWorkScheduleDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
