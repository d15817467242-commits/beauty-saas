import { Controller, Get, Query } from '@nestjs/common';
import { CommissionRuleService } from '../employee/services/commission-rule.service';
import { CommissionRecordService } from '../employee/services/commission-record.service';

@Controller('commission')
export class CommissionController {
  constructor(
    private readonly ruleService: CommissionRuleService,
    private readonly recordService: CommissionRecordService,
  ) {}

  @Get('rules')
  async getRules(@Query() query: any) {
    return this.ruleService.findAll(query);
  }

  @Get('overview')
  async getOverview(@Query() query: any) {
    return this.recordService.getOverview(query);
  }

  @Get('records')
  async getRecords(@Query() query: any) {
    return this.recordService.findAll(query);
  }

  @Get('stats')
  async getStats(@Query() query: any) {
    return this.recordService.getStats(query);
  }
}
