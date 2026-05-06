import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportService } from './report.service';
import { ReportController } from './report.controller';
import { Consumption } from '../cashier/consumption.entity';
import { Employee } from '../employee/entities/employee.entity';
import { Service } from '../service/service.entity';
import { Appointment } from '../appointment/appointment.entity';
import { Member } from '../member/member.entity';
import { SalesTarget } from './entities/sales-target.entity';
import { Target } from './entities/target.entity';
import { DailyReport } from './entities/daily-report.entity';
import { MonthlyReport } from './entities/monthly-report.entity';
import { EmployeePerformance } from './entities/employee-performance.entity';
import { CustomerAnalysis } from './entities/customer-analysis.entity';

@Module({
  imports: [TypeOrmModule.forFeature([
    Consumption, 
    Employee, 
    Service, 
    Appointment, 
    Member, 
    SalesTarget,
    Target,
    DailyReport,
    MonthlyReport,
    EmployeePerformance,
    CustomerAnalysis
  ])],
  controllers: [ReportController],
  providers: [ReportService],
  exports: [ReportService],
})
export class ReportModule {}
