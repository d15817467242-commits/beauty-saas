import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ServiceReview } from './service-review.entity';
import { CreateServiceReviewDto } from './dto/create-service-review.dto';
import { UpdateServiceReviewDto } from './dto/update-service-review.dto';
import { Service } from './service.entity';

export interface ReviewStatistics {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  tagStatistics: { tag: string; count: number }[];
}

@Injectable()
export class ServiceReviewService {
  constructor(
    @InjectRepository(ServiceReview)
    private reviewRepository: Repository<ServiceReview>,
    @InjectRepository(Service)
    private serviceRepository: Repository<Service>,
  ) {}

  async create(createReviewDto: CreateServiceReviewDto): Promise<ServiceReview> {
    // 检查服务是否存在
    const service = await this.serviceRepository.findOne({ 
      where: { id: createReviewDto.serviceId } 
    });
    if (!service) {
      throw new NotFoundException('服务项目不存在');
    }

    // 检查用户是否已评价过该服务
    const existingReview = await this.reviewRepository.findOne({
      where: {
        serviceId: createReviewDto.serviceId,
        userId: createReviewDto.userId,
      },
    });
    if (existingReview) {
      throw new BadRequestException('您已评价过该服务');
    }

    const review = this.reviewRepository.create(createReviewDto);
    return this.reviewRepository.save(review);
  }

  async findAll(
    serviceId?: string,
    userId?: string,
    orderId?: string,
    isVisible?: boolean,
    page = 1,
    limit = 10,
  ): Promise<{ data: ServiceReview[]; total: number }> {
    const query = this.reviewRepository.createQueryBuilder('review')
      .leftJoinAndSelect('review.service', 'service');

    if (serviceId) {
      query.andWhere('review.serviceId = :serviceId', { serviceId });
    }

    if (userId) {
      query.andWhere('review.userId = :userId', { userId });
    }

    if (orderId) {
      query.andWhere('review.orderId = :orderId', { orderId });
    }

    if (isVisible !== undefined) {
      query.andWhere('review.isVisible = :isVisible', { isVisible });
    }

    query.orderBy('review.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await query.getManyAndCount();
    return { data, total };
  }

  async findOne(id: string): Promise<ServiceReview> {
    const review = await this.reviewRepository.findOne({
      where: { id },
      relations: ['service'],
    });
    
    if (!review) {
      throw new NotFoundException('评价不存在');
    }
    
    return review;
  }

  async update(id: string, updateReviewDto: UpdateServiceReviewDto): Promise<ServiceReview> {
    const review = await this.findOne(id);
    Object.assign(review, updateReviewDto);
    return this.reviewRepository.save(review);
  }

  async remove(id: string): Promise<void> {
    const review = await this.findOne(id);
    await this.reviewRepository.remove(review);
  }

  // 商家回复评价
  async adminReply(id: string, content: string): Promise<ServiceReview> {
    const review = await this.findOne(id);
    review.adminReply = content;
    review.adminReplyTime = new Date();
    return this.reviewRepository.save(review);
  }

  // 设置评价是否显示
  async setVisible(id: string, isVisible: boolean): Promise<ServiceReview> {
    const review = await this.findOne(id);
    review.isVisible = isVisible;
    return this.reviewRepository.save(review);
  }

  // 点赞评价
  async like(id: string): Promise<ServiceReview> {
    const review = await this.findOne(id);
    review.likeCount += 1;
    return this.reviewRepository.save(review);
  }

  // 获取服务评价统计
  async getStatistics(serviceId: string): Promise<ReviewStatistics> {
    const reviews = await this.reviewRepository.find({
      where: { serviceId, isVisible: true },
      select: ['rating', 'tags'],
    });

    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0;

    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const tagCounts: Record<string, number> = {};

    for (const review of reviews) {
      ratingDistribution[review.rating as keyof typeof ratingDistribution]++;
      
      if (review.tags) {
        for (const tag of review.tags) {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        }
      }
    }

    const tagStatistics = Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalReviews,
      averageRating: Math.round(averageRating * 10) / 10,
      ratingDistribution,
      tagStatistics,
    };
  }

  // 获取用户评价列表
  async getUserReviews(userId: string, page = 1, limit = 10): Promise<{ data: ServiceReview[]; total: number }> {
    return this.findAll(undefined, userId, undefined, undefined, page, limit);
  }

  // 获取服务评价列表
  async getServiceReviews(
    serviceId: string,
    page = 1,
    limit = 10,
    rating?: number,
  ): Promise<{ data: ServiceReview[]; total: number }> {
    const query = this.reviewRepository.createQueryBuilder('review')
      .leftJoinAndSelect('review.service', 'service')
      .where('review.serviceId = :serviceId', { serviceId })
      .andWhere('review.isVisible = :isVisible', { isVisible: true });

    if (rating) {
      query.andWhere('review.rating = :rating', { rating });
    }

    query.orderBy('review.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await query.getManyAndCount();
    return { data, total };
  }

  // 批量获取多个服务的评价统计
  async getBatchStatistics(serviceIds: string[]): Promise<Record<string, ReviewStatistics>> {
    const result: Record<string, ReviewStatistics> = {};

    for (const serviceId of serviceIds) {
      result[serviceId] = await this.getStatistics(serviceId);
    }

    return result;
  }
}
