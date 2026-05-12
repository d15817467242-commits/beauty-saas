import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { AttendanceService } from '../services/attendance.service';
import { CheckInDto, CheckOutDto, AttendanceQueryDto, AttendanceStatsQueryDto, UpdateAttendanceDto } from '../dto/attendance.dto';

@Controller('employees/attendance')
export class AttendanceController {
  constructor(private readonly service: AttendanceService) {}

  @Post('check-in')
  checkIn(@Body() dto: CheckInDto) {
    return this.service.checkIn(dto);
  }

  @Post('check-out')
  checkOut(@Body() dto: CheckOutDto) {
    return this.service.checkOut(dto);
  }

  @Get()
  findAll(@Query() query: AttendanceQueryDto) {
    return this.service.findByEmployee(query);
  }

  @Get('records')
  findByEmployee(@Query() query: AttendanceQueryDto) {
    return this.service.findByEmployee(query);
  }

  @Get('stats')
  getStats(@Query() query: AttendanceStatsQueryDto) {
    return this.service.getStats(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAttendanceDto) {
    return this.service.update(id, dto);
  }
}
