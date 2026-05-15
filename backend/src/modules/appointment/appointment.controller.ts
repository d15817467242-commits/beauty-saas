import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request } from '@nestjs/common';
import { AppointmentService } from './appointment.service';
import { CreateAppointmentDto, UpdateAppointmentDto, CancelAppointmentDto, QueryAppointmentDto } from './dto/appointment.dto';
import { CreateScheduleDto, UpdateScheduleDto, BatchCreateScheduleDto, QueryScheduleDto } from './dto/schedule.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { StoreId } from '../../common/decorators/store-id.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('appointments')
@UseGuards(JwtAuthGuard)
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) {}

  // ========== 预约管理 ==========

  @Post()
  @Roles('admin', 'manager', 'cashier')
  create(@Body() dto: CreateAppointmentDto, @Request() req: any, @StoreId() storeId?: string) {
    return this.appointmentService.create(dto, req.user.userId, storeId);
  }

  @Get()
  @Roles('admin', 'manager', 'cashier', 'employee')
  findAll(@Query() query: QueryAppointmentDto, @StoreId() storeId?: string) {
    return this.appointmentService.findAll(query, storeId);
  }

  @Get(':id')
  @Roles('admin', 'manager', 'cashier', 'employee')
  findOne(@Param('id') id: string, @StoreId() storeId?: string) {
    return this.appointmentService.findOne(id, storeId);
  }

  @Patch(':id')
  @Roles('admin', 'manager')
  update(@Param('id') id: string, @Body() dto: UpdateAppointmentDto, @StoreId() storeId?: string) {
    return this.appointmentService.update(id, dto, storeId);
  }

  @Post(':id/confirm')
  @Roles('admin', 'manager')
  confirm(@Param('id') id: string, @StoreId() storeId?: string) {
    return this.appointmentService.confirm(id, storeId);
  }

  @Post(':id/complete')
  @Roles('admin', 'manager')
  complete(@Param('id') id: string, @StoreId() storeId?: string) {
    return this.appointmentService.complete(id, storeId);
  }

  @Post(':id/no-show')
  @Roles('admin', 'manager')
  noShow(@Param('id') id: string, @StoreId() storeId?: string) {
    return this.appointmentService.noShow(id, storeId);
  }

  @Post(':id/cancel')
  cancel(@Param('id') id: string, @Body() dto: CancelAppointmentDto, @StoreId() storeId?: string) {
    return this.appointmentService.cancel(id, dto, storeId);
  }

  @Delete(':id')
  @Roles('admin')
  remove(@Param('id') id: string, @StoreId() storeId?: string) {
    return this.appointmentService.remove(id, storeId);
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
  @Roles('admin', 'manager')
  createSchedule(@Body() dto: CreateScheduleDto, @Request() req: any) {
    return this.appointmentService.createSchedule(dto, req.user.userId);
  }

  @Post('schedules/batch')
  batchCreateSchedule(@Body() dto: BatchCreateScheduleDto, @Request() req: any) {
    return this.appointmentService.batchCreateSchedule(dto, req.user.userId);
  }

  @Get('schedules')
  @Roles('admin', 'manager', 'employee')
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
