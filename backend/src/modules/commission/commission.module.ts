import { Module } from '@nestjs/common';
import { CommissionController } from './commission.controller';
import { CommissionRuleService } from '../employee/services/commission-rule.service';
import { CommissionRecordService } from '../employee/services/commission-record.service';
import { CommissionRule } from '../employee/entities/commission-rule.entity';
import { CommissionRecord } from '../employee/entities/commission-record.entity';
import { Employee } from '../employee/entities/employee.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([CommissionRule, CommissionRecord, Employee])],
  controllers: [CommissionController],
  providers: [CommissionRuleService, CommissionRecordService],
  exports: [CommissionRuleService, CommissionRecordService],
})
export class CommissionModule {}
