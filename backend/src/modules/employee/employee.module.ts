import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Entities
import { Employee } from './entities/employee.entity';
import { ShiftTemplate } from './entities/shift-template.entity';
import { WorkSchedule } from './entities/work-schedule.entity';
import { AttendanceRule } from './entities/attendance-rule.entity';
import { Attendance } from './entities/attendance.entity';
import { CommissionRule } from './entities/commission-rule.entity';
import { CommissionRecord } from './entities/commission-record.entity';
import { TrainingCourse } from './entities/training-course.entity';
import { Training } from './entities/training.entity';
import { Permission } from './entities/permission.entity';
import { Role } from './entities/role.entity';
import { EmployeeRole } from './entities/employee-role.entity';
import { EmployeeService as EmployeeServiceEntity } from './entities/employee-service.entity';

// Services
import { EmployeeService } from './employee.service';
import { ShiftTemplateService } from './services/shift-template.service';
import { WorkScheduleService } from './services/work-schedule.service';
import { AttendanceRuleService } from './services/attendance-rule.service';
import { AttendanceService } from './services/attendance.service';
import { CommissionRuleService } from './services/commission-rule.service';
import { CommissionRecordService } from './services/commission-record.service';
import { TrainingCourseService } from './services/training-course.service';
import { TrainingService } from './services/training.service';
import { PermissionService } from './services/permission.service';
import { RoleService } from './services/role.service';
import { EmployeeServiceService } from './services/employee-service.service';

// Controllers
import { EmployeeController } from './employee.controller';
import { ShiftTemplateController } from './controllers/shift-template.controller';
import { WorkScheduleController } from './controllers/work-schedule.controller';
import { AttendanceRuleController } from './controllers/attendance-rule.controller';
import { AttendanceController } from './controllers/attendance.controller';
import { CommissionRuleController } from './controllers/commission-rule.controller';
import { CommissionRecordController } from './controllers/commission-record.controller';
import { TrainingCourseController } from './controllers/training-course.controller';
import { TrainingController } from './controllers/training.controller';
import { PermissionController } from './controllers/permission.controller';
import { RoleController } from './controllers/role.controller';
import { EmployeeServiceController } from './controllers/employee-service.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Employee,
      ShiftTemplate,
      WorkSchedule,
      AttendanceRule,
      Attendance,
      CommissionRule,
      CommissionRecord,
      TrainingCourse,
      Training,
      Permission,
      Role,
      EmployeeRole,
      EmployeeServiceEntity,
    ]),
  ],
  controllers: [
    EmployeeController,
    ShiftTemplateController,
    WorkScheduleController,
    AttendanceRuleController,
    AttendanceController,
    CommissionRuleController,
    CommissionRecordController,
    TrainingCourseController,
    TrainingController,
    PermissionController,
    RoleController,
    EmployeeServiceController,
  ],
  providers: [
    EmployeeService,
    ShiftTemplateService,
    WorkScheduleService,
    AttendanceRuleService,
    AttendanceService,
    CommissionRuleService,
    CommissionRecordService,
    TrainingCourseService,
    TrainingService,
    PermissionService,
    RoleService,
    EmployeeServiceService,
  ],
  exports: [
    EmployeeService,
    ShiftTemplateService,
    WorkScheduleService,
    AttendanceRuleService,
    AttendanceService,
    CommissionRuleService,
    CommissionRecordService,
    TrainingCourseService,
    TrainingService,
    PermissionService,
    RoleService,
    EmployeeServiceService,
  ],
})
export class EmployeeModule {}
