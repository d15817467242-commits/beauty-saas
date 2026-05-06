import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { TrainingCourseService } from '../services/training-course.service';
import { CreateTrainingCourseDto, UpdateTrainingCourseDto } from '../dto/training-course.dto';
import { CourseStatus, CourseType } from '../entities/training-course.entity';

@Controller('employees/training-courses')
export class TrainingCourseController {
  constructor(private readonly service: TrainingCourseService) {}

  @Post()
  create(@Body() dto: CreateTrainingCourseDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll(
    @Query('status') status?: CourseStatus,
    @Query('courseType') courseType?: CourseType,
  ) {
    return this.service.findAll(status, courseType);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTrainingCourseDto) {
    return this.service.update(id, dto);
  }

  @Patch(':id/publish')
  publish(@Param('id') id: string) {
    return this.service.publish(id);
  }

  @Patch(':id/archive')
  archive(@Param('id') id: string) {
    return this.service.archive(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
