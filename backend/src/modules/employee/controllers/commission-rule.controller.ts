import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { CommissionRuleService } from '../services/commission-rule.service';
import { CreateCommissionRuleDto, UpdateCommissionRuleDto } from '../dto/commission-rule.dto';
import { CommissionRuleType } from '../entities/commission-rule.entity';

@Controller('employees/commission-rules')
export class CommissionRuleController {
  constructor(private readonly service: CommissionRuleService) {}

  @Post()
  create(@Body() dto: CreateCommissionRuleDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll(
    @Query('isActive') isActive?: boolean,
    @Query('ruleType') ruleType?: CommissionRuleType,
  ) {
    return this.service.findAll(isActive, ruleType);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCommissionRuleDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
