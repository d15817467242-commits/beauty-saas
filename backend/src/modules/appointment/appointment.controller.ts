import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request } from '@nestjs/common';
import { AppointmentService } from './appointment.service';
import { CreateAppointmentDto, UpdateAppointmentDto, CancelAppointmentDto, QueryAppointmentDto } from './dto/appointment.dto';
import { CreateScheduleDto, UpdateScheduleDto, BatchCreateScheduleDto, QueryScheduleDto } from './dto/schedule.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('appointments')
@UseGuards(JwtAuthGuard)
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) {}

  // ========== 预约管理 ==========

  @Post()
  create(@Body() dto: CreateAppointmentDto, @Request() req: any) {
    return this.appointmentService.create(dto, req.user.userId);
  }

  @Get()
  findAll(@Query() query: QueryAppointmentDto) {
    return this.appointmentService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.appointmentService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAppointmentDto) {
    return this.appointmentService.update(id, dto);
  }

  @Post(':id/confirm')
  confirm(@Param('id') id: string) {
    return this.appointmentService.confirm(id);
  }

  @Post(':id/complete')
  complete(@Param('id') id: string) {
    return this.appointmentService.complete(id);
  }

  @Post(':id/no-show')
  noShow(@Param('id') id: string) {
    return this.appointmentService.noShow(id);
  }

  @Post(':id/cancel')
  cancel(@Param('id') id: string, @Body() dto: CancelAppointmentDto) {
    return this.appointmentService.cancel(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.appointmentService.remove(id);
  }

  // ========== 可用时间段 ==========

  @Get('available-slots/:employeeId/:date')
  getAvailableSlots(
    @Param('employeeId') employeeId: string,
    @Param('date') date: string,
  ) {
    return this.appointmentService.getAvailableSlots(employeeId, date);
  }

  // ========== 排班管理 ==========

  @Post('schedules')
  createSchedule(@Body() dto: CreateScheduleDto, @Request() req: any) {
    return this.appointmentService.createSchedule(dto, req.user.userId);
  }

  @Post('schedules/batch')
  batchCreateSchedule(@Body() dto: BatchCreateScheduleDto, @Request() req: any) {
    return this.appointmentService.batchCreateSchedule(dto, req.user.userId);
  }

  @Get('schedules')
  findSchedules(@Query() query: QueryScheduleDto) {
    return this.appointmentService.findSchedules(query);
  }

  @Get('schedules/:id')
  findSchedule(@Param('id') id: string) {
    return this.appointmentService.findSchedule(id);
  }

  @Patch('schedules/:id')
  updateSchedule(@Param('id') id: string, @Body() dto: UpdateScheduleDto) {
    return this.appointmentService.updateSchedule(id, dto);
  }

  @Delete('schedules/:id')
  removeSchedule(@Param('id') id: string) {
    return this.appointmentService.removeSchedule(id);
  }
}
