import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { CommissionRecordService } from '../services/commission-record.service';
import { 
  CreateCommissionRecordDto, 
  UpdateCommissionRecordDto, 
  CommissionQueryDto, 
  CommissionStatsQueryDto,
  ApproveCommissionDto,
  PayCommissionDto,
  CalculateCommissionDto,
} from '../dto/commission-record.dto';

@Controller('employees/commissions')
export class CommissionRecordController {
  constructor(private readonly service: CommissionRecordService) {}

  @Post()
  create(@Body() dto: CreateCommissionRecordDto) {
    return this.service.create(dto);
  }

  @Post('calculate')
  calculate(@Body() dto: CalculateCommissionDto) {
    return this.service.calculate(dto);
  }

  @Post('approve')
  approve(@Body() dto: ApproveCommissionDto) {
    // TODO: 从JWT获取当前用户ID
    return this.service.approve(dto, 'system');
  }

  @Post('pay')
  pay(@Body() dto: PayCommissionDto) {
    return this.service.pay(dto);
  }

  @Get()
  findAll(@Query() query: CommissionQueryDto) {
    return this.service.findAll(query);
  }

  @Get('stats')
  getStats(@Query() query: CommissionStatsQueryDto) {
    return this.service.getStats(query);
  }

  @Get('summary/:employeeId/:period')
  getSummary(@Param('employeeId') employeeId: string, @Param('period') period: string) {
    return this.service.getEmployeeSummary(employeeId, period);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCommissionRecordDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
