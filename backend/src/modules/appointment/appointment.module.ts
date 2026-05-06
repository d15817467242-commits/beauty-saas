import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppointmentController } from './appointment.controller';
import { AppointmentService } from './appointment.service';
import { AppointmentEnhancedController } from './appointment-enhanced.controller';
import { AppointmentEnhancedService } from './appointment-enhanced.service';
import { AppointmentConfigController } from './controllers/appointment-config.controller';
import { AppointmentConfigService } from './services/appointment-config.service';
import { Appointment } from './appointment.entity';
import { Schedule } from './schedule.entity';
import { AppointmentReminder } from './appointment-reminder.entity';
import { Queue } from './queue.entity';
import { QueueItem } from './queue-item.entity';
import { AppointmentReview } from './appointment-review.entity';
import { BusinessHour } from './entities/business-hour.entity';
import { AppointmentConfig } from './entities/appointment-config.entity';
import { MemberModule } from '../member/member.module';
import { EmployeeModule } from '../employee/employee.module';
import { ServiceModule } from '../service/service.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Appointment,
      Schedule,
      AppointmentReminder,
      Queue,
      QueueItem,
      AppointmentReview,
      BusinessHour,
      AppointmentConfig,
    ]),
    MemberModule,
    EmployeeModule,
    ServiceModule,
  ],
  controllers: [AppointmentController, AppointmentEnhancedController, AppointmentConfigController],
  providers: [AppointmentService, AppointmentEnhancedService, AppointmentConfigService],
  exports: [AppointmentService, AppointmentEnhancedService, AppointmentConfigService],
})
export class AppointmentModule {}
