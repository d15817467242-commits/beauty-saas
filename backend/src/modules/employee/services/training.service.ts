import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Training, TrainingStatus } from '../entities/training.entity';
import { TrainingCourse, CourseStatus } from '../entities/training-course.entity';
import { Employee } from '../entities/employee.entity';
import { 
  EnrollTrainingDto, 
  BatchEnrollDto, 
  UpdateTrainingProgressDto, 
  CompleteTrainingDto, 
  TrainingFeedbackDto,
  TrainingQueryDto,
} from '../dto/training.dto';
import * as dayjs from 'dayjs';

@Injectable()
export class TrainingService {
  constructor(
    @InjectRepository(Training)
    private trainingRepository: Repository<Training>,
    @InjectRepository(TrainingCourse)
    private courseRepository: Repository<TrainingCourse>,
    @InjectRepository(Employee)
    private employeeRepository: Repository<Employee>,
  ) {}

  // 报名培训
  async enroll(dto: EnrollTrainingDto): Promise<Training> {
    // 检查课程是否存在且已发布
    const course = await this.courseRepository.findOne({
      where: { id: dto.courseId, status: CourseStatus.PUBLISHED },
    });
    if (!course) {
      throw new NotFoundException('培训课程不存在或未发布');
    }

    // 检查是否已报名
    const existing = await this.trainingRepository.findOne({
      where: {
        employeeId: dto.employeeId,
        courseId: dto.courseId,
      },
    });

    if (existing) {
      throw new NotFoundException('已报名该课程');
    }

    const training = this.trainingRepository.create({
      employeeId: dto.employeeId,
      courseId: dto.courseId,
      status: TrainingStatus.ENROLLED,
      enrolledAt: new Date(),
      passScore: 60, // 默认及格分数
    });

    // 增加报名人数
    await this.courseRepository.increment({ id: dto.courseId }, 'enrollmentCount', 1);

    return this.trainingRepository.save(training);
  }

  // 批量报名
  async batchEnroll(dto: BatchEnrollDto): Promise<Training[]> {
    const trainings: Training[] = [];

    for (const employeeId of dto.employeeIds) {
      try {
        const training = await this.enroll({
          employeeId,
          courseId: dto.courseId,
        });
        trainings.push(training);
      } catch (error) {
        // 忽略已报名的错误
      }
    }

    return trainings;
  }

  // 开始学习
  async startLearning(id: string): Promise<Training> {
    const training = await this.findOne(id);
    
    if (training.status !== TrainingStatus.ENROLLED) {
      throw new NotFoundException('培训状态不正确');
    }

    training.status = TrainingStatus.IN_PROGRESS;
    training.startedAt = new Date();

    return this.trainingRepository.save(training);
  }

  // 更新学习进度
  async updateProgress(id: string, dto: UpdateTrainingProgressDto): Promise<Training> {
    const training = await this.findOne(id);
    
    if (dto.progress !== undefined) {
      training.progress = dto.progress;
    }
    
    if (dto.timeSpent !== undefined) {
      training.timeSpent += dto.timeSpent;
    }
    
    if (dto.status !== undefined) {
      training.status = dto.status;
    }

    return this.trainingRepository.save(training);
  }

  // 完成培训
  async complete(id: string, dto: CompleteTrainingDto): Promise<Training> {
    const training = await this.findOne(id);
    
    training.status = TrainingStatus.COMPLETED;
    training.completedAt = new Date();
    training.progress = 100;

    if (dto.score !== undefined) {
      training.score = dto.score;
    }

    if (dto.passScore !== undefined) {
      training.passScore = dto.passScore;
    }

    // 检查是否通过
    if (training.score !== undefined && training.score < training.passScore) {
      training.status = TrainingStatus.FAILED;
    }

    if (dto.certificateNo) {
      training.certificateNo = dto.certificateNo;
    }

    if (dto.certificateUrl) {
      training.certificateUrl = dto.certificateUrl;
    }

    if (dto.remark) {
      training.remark = dto.remark;
    }

    // 增加完成人数
    if (training.status === TrainingStatus.COMPLETED) {
      await this.courseRepository.increment({ id: training.courseId }, 'completionCount', 1);
    }

    return this.trainingRepository.save(training);
  }

  // 提交反馈
  async submitFeedback(id: string, dto: TrainingFeedbackDto, ratedBy: string): Promise<Training> {
    const training = await this.findOne(id);
    
    training.rating = dto.rating;
    training.feedback = dto.feedback || '';
    training.ratedBy = ratedBy;

    return this.trainingRepository.save(training);
  }

  // 取消培训
  async cancel(id: string): Promise<Training> {
    const training = await this.findOne(id);
    
    if (training.status === TrainingStatus.COMPLETED) {
      throw new NotFoundException('已完成的培训不能取消');
    }

    training.status = TrainingStatus.CANCELLED;

    // 减少报名人数
    await this.courseRepository.decrement({ id: training.courseId }, 'enrollmentCount', 1);

    return this.trainingRepository.save(training);
  }

  async findOne(id: string): Promise<Training> {
    const training = await this.trainingRepository.findOne({
      where: { id },
      relations: ['employee', 'course'],
    });
    if (!training) {
      throw new NotFoundException('培训记录不存在');
    }
    return training;
  }

  async findAll(dto: TrainingQueryDto): Promise<Training[]> {
    const query = this.trainingRepository.createQueryBuilder('training')
      .leftJoinAndSelect('training.employee', 'employee')
      .leftJoinAndSelect('training.course', 'course');

    if (dto.employeeId) {
      query.where('training.employeeId = :employeeId', { employeeId: dto.employeeId });
    }

    if (dto.courseId) {
      query.andWhere('training.courseId = :courseId', { courseId: dto.courseId });
    }

    if (dto.status) {
      query.andWhere('training.status = :status', { status: dto.status });
    }

    return query.orderBy('training.createdAt', 'DESC').getMany();
  }

  // 获取员工培训统计
  async getEmployeeStats(employeeId: string): Promise<any> {
    const trainings = await this.trainingRepository.find({
      where: { employeeId },
    });

    return {
      total: trainings.length,
      enrolled: trainings.filter(t => t.status === TrainingStatus.ENROLLED).length,
      inProgress: trainings.filter(t => t.status === TrainingStatus.IN_PROGRESS).length,
      completed: trainings.filter(t => t.status === TrainingStatus.COMPLETED).length,
      failed: trainings.filter(t => t.status === TrainingStatus.FAILED).length,
      totalHours: trainings.reduce((sum, t) => sum + t.timeSpent, 0),
    };
  }
}
