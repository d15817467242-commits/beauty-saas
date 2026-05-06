import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { DashboardGateway } from './dashboard.gateway';
import { Consumption } from '../cashier/consumption.entity';
import { Employee } from '../employee/entities/employee.entity';
import { Service } from '../service/service.entity';
import { Appointment } from '../appointment/appointment.entity';
import { Member } from '../member/member.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Consumption, Employee, Service, Appointment, Member])],
  controllers: [DashboardController],
  providers: [DashboardService, DashboardGateway],
  exports: [DashboardService, DashboardGateway],
})
export class DashboardModule {}
