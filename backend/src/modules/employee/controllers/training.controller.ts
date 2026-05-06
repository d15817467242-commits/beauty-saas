import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { TrainingService } from '../services/training.service';
import { 
  EnrollTrainingDto, 
  BatchEnrollDto, 
  UpdateTrainingProgressDto, 
  CompleteTrainingDto, 
  TrainingFeedbackDto,
  TrainingQueryDto,
} from '../dto/training.dto';

@Controller('employees/trainings')
export class TrainingController {
  constructor(private readonly service: TrainingService) {}

  @Post('enroll')
  enroll(@Body() dto: EnrollTrainingDto) {
    return this.service.enroll(dto);
  }

  @Post('enroll/batch')
  batchEnroll(@Body() dto: BatchEnrollDto) {
    return this.service.batchEnroll(dto);
  }

  @Get()
  findAll(@Query() query: TrainingQueryDto) {
    return this.service.findAll(query);
  }

  @Get('stats/:employeeId')
  getStats(@Param('employeeId') employeeId: string) {
    return this.service.getEmployeeStats(employeeId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id/start')
  startLearning(@Param('id') id: string) {
    return this.service.startLearning(id);
  }

  @Patch(':id/progress')
  updateProgress(@Param('id') id: string, @Body() dto: UpdateTrainingProgressDto) {
    return this.service.updateProgress(id, dto);
  }

  @Patch(':id/complete')
  complete(@Param('id') id: string, @Body() dto: CompleteTrainingDto) {
    return this.service.complete(id, dto);
  }

  @Patch(':id/feedback')
  submitFeedback(@Param('id') id: string, @Body() dto: TrainingFeedbackDto) {
    // TODO: 从JWT获取当前用户ID
    return this.service.submitFeedback(id, dto, 'system');
  }

  @Patch(':id/cancel')
  cancel(@Param('id') id: string) {
    return this.service.cancel(id);
  }
}
