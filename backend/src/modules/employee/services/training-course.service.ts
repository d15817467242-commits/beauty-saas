import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TrainingCourse, CourseStatus, CourseType } from '../entities/training-course.entity';
import { CreateTrainingCourseDto, UpdateTrainingCourseDto } from '../dto/training-course.dto';

@Injectable()
export class TrainingCourseService {
  constructor(
    @InjectRepository(TrainingCourse)
    private courseRepository: Repository<TrainingCourse>,
  ) {}

  async create(dto: CreateTrainingCourseDto): Promise<TrainingCourse> {
    const course = this.courseRepository.create(dto);
    return this.courseRepository.save(course);
  }

  async findAll(status?: CourseStatus, courseType?: CourseType): Promise<TrainingCourse[]> {
    const query = this.courseRepository.createQueryBuilder('course');
    
    if (status) {
      query.where('course.status = :status', { status });
    }
    
    if (courseType) {
      query.andWhere('course.courseType = :courseType', { courseType });
    }
    
    return query.orderBy('course.sortOrder', 'ASC').addOrderBy('course.createdAt', 'DESC').getMany();
  }

  async findOne(id: string): Promise<TrainingCourse> {
    const course = await this.courseRepository.findOne({ where: { id } });
    if (!course) {
      throw new NotFoundException('培训课程不存在');
    }
    return course;
  }

  async update(id: string, dto: UpdateTrainingCourseDto): Promise<TrainingCourse> {
    const course = await this.findOne(id);
    Object.assign(course, dto);
    return this.courseRepository.save(course);
  }

  async remove(id: string): Promise<void> {
    const course = await this.findOne(id);
    await this.courseRepository.remove(course);
  }

  async publish(id: string): Promise<TrainingCourse> {
    const course = await this.findOne(id);
    course.status = CourseStatus.PUBLISHED;
    return this.courseRepository.save(course);
  }

  async archive(id: string): Promise<TrainingCourse> {
    const course = await this.findOne(id);
    course.status = CourseStatus.ARCHIVED;
    return this.courseRepository.save(course);
  }

  async incrementEnrollment(id: string): Promise<void> {
    await this.courseRepository.increment({ id }, 'enrollmentCount', 1);
  }

  async incrementCompletion(id: string): Promise<void> {
    await this.courseRepository.increment({ id }, 'completionCount', 1);
  }
}
