import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Employee } from './entities/employee.entity';
import { EmployeeRole } from './entities/employee-role.entity';
import { Attendance } from './entities/attendance.entity';
import { AttendanceRule } from './entities/attendance-rule.entity';
import { CommissionRule } from './entities/commission-rule.entity';
import { CommissionRecord } from './entities/commission-record.entity';
import { EmployeeService as EmployeeServiceEntity } from './entities/employee-service.entity';
import { Permission } from './entities/permission.entity';
import { ShiftTemplate } from './entities/shift-template.entity';
import { TrainingCourse } from './entities/training-course.entity';
import { Training } from './entities/training.entity';
import { WorkSchedule } from './entities/work-schedule.entity';
import { Role } from '../auth/role.entity';

import { EmployeeController } from './employee.controller';
import { AttendanceController } from './controllers/attendance.controller';
import { AttendanceRuleController } from './controllers/attendance-rule.controller';
import { CommissionRecordController } from './controllers/commission-record.controller';
import { CommissionRuleController } from './controllers/commission-rule.controller';
import { EmployeeServiceController } from './controllers/employee-service.controller';
import { PermissionController } from './controllers/permission.controller';
import { RoleController } from './controllers/role.controller';
import { WorkScheduleController } from './controllers/work-schedule.controller';
import { ShiftTemplateController } from './controllers/shift-template.controller';
import { TrainingCourseController } from './controllers/training-course.controller';
import { TrainingController } from './controllers/training.controller';

import { EmployeeService } from './employee.service';
import { AttendanceService } from './services/attendance.service';
import { AttendanceRuleService } from './services/attendance-rule.service';
import { CommissionRecordService } from './services/commission-record.service';
import { CommissionRuleService } from './services/commission-rule.service';
import { EmployeeServiceService } from './services/employee-service.service';
import { PermissionService } from './services/permission.service';
import { RoleService } from './services/role.service';
import { WorkScheduleService } from './services/work-schedule.service';
import { ShiftTemplateService } from './services/shift-template.service';
import { TrainingCourseService } from './services/training-course.service';
import { TrainingService } from './services/training.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Employee,
      EmployeeRole,
      Attendance,
      AttendanceRule,
      CommissionRule,
      CommissionRecord,
      EmployeeServiceEntity,
      Permission,
      ShiftTemplate,
      TrainingCourse,
      Training,
      WorkSchedule,
      Role,
    ]),
  ],
  controllers: [
    EmployeeController,
    AttendanceController,
    AttendanceRuleController,
    CommissionRecordController,
    CommissionRuleController,
    EmployeeServiceController,
    PermissionController,
    RoleController,
    WorkScheduleController,
    ShiftTemplateController,
    TrainingCourseController,
    TrainingController,
  ],
  providers: [
    EmployeeService,
    AttendanceService,
    AttendanceRuleService,
    CommissionRecordService,
    CommissionRuleService,
    EmployeeServiceService,
    PermissionService,
    RoleService,
    WorkScheduleService,
    ShiftTemplateService,
    TrainingCourseService,
    TrainingService,
  ],
  exports: [
    EmployeeService,
    AttendanceService,
    AttendanceRuleService,
    CommissionRecordService,
    CommissionRuleService,
    EmployeeServiceService,
    PermissionService,
    RoleService,
    WorkScheduleService,
    ShiftTemplateService,
    TrainingCourseService,
    TrainingService,
    TypeOrmModule,
  ],
})
export class EmployeeModule {}
