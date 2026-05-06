import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

export enum CourseStatus {
  DRAFT = 'draft',         // 草稿
  PUBLISHED = 'published', // 已发布
  ARCHIVED = 'archived',   // 已归档
}

export enum CourseType {
  ONLINE = 'online',       // 线上培训
  OFFLINE = 'offline',     // 线下培训
  VIDEO = 'video',         // 视频培训
  DOCUMENT = 'document',   // 文档培训
}

@Entity('training_courses')
export class TrainingCourse extends BaseEntity {
  @Column({ type: 'text', comment: '课程名称' })
  name: string;

  @Column({ nullable: true, comment: '课程编码' })
  code: string;

  @Column({   name: 'course_type', comment: '课程类型' })
  courseType: CourseType;

  @Column({ nullable: true, type: 'text', comment: '课程描述' })
  description: string;

  @Column({ nullable: true, type: 'int', name: 'duration_minutes', comment: '课程时长(分钟)' })
  durationMinutes: number;

  @Column({ nullable: true, name: 'instructor', comment: '讲师' })
  instructor: string;

  @Column({ nullable: true, type: 'text', name: 'cover_image', comment: '封面图片' })
  coverImage: string;

  @Column({ nullable: true, type: 'text', name: 'content_url', comment: '课程内容链接' })
  contentUrl: string;

  @Column({ nullable: true, type: 'text', name: 'materials', comment: '培训资料(JSON数组)' })
  materials: string;

  @Column({ type: 'text',
    
    
    default: CourseStatus.DRAFT,
    comment: '状态'})
  status: CourseStatus;

  @Column({ type: 'text', default: 0, name: 'enrollment_count', comment: '报名人数' })
  enrollmentCount: number;

  @Column({ type: 'text', default: 0, name: 'completion_count', comment: '完成人数' })
  completionCount: number;

  @Column({ type: 'int', default: 0, name: 'sort_order', comment: '排序' })
  sortOrder: number;

  @Column({ type: 'text', nullable: true, name: 'target_positions', comment: '目标职位(JSON数组)' })
  targetPositions: string[];

  @Column({ nullable: true, type: 'text', comment: '备注' })
  remark: string;
}
