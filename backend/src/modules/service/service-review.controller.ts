import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ServiceReviewService } from './service-review.service';
import { CreateServiceReviewDto } from './dto/create-service-review.dto';
import { AdminReplyDto } from './dto/update-service-review.dto';

@Controller('reviews')
export class ReviewAliasController {
  constructor(private readonly reviewService: ServiceReviewService) {}

  @Get()
  findAll(
    @Query('serviceId') serviceId?: string,
    @Query('userId') userId?: string,
    @Query('orderId') orderId?: string,
    @Query('isVisible') isVisible?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.reviewService.findAll(
      serviceId,
      userId,
      orderId,
      isVisible === 'true' ? true : isVisible === 'false' ? false : undefined,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
    );
  }

  @Get('stats')
  getStats(@Query('serviceId') serviceId?: string) {
    if (!serviceId) {
      return { totalReviews: 0, averageRating: 0, ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }, tagStatistics: [] };
    }
    return this.reviewService.getStatistics(serviceId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.reviewService.findOne(id);
  }
}

@Controller('service-reviews')
export class ServiceReviewController {
  constructor(private readonly reviewService: ServiceReviewService) {}

  @Post()
  create(@Body() createReviewDto: CreateServiceReviewDto) {
    return this.reviewService.create(createReviewDto);
  }

  @Get()
  findAll(
    @Query('serviceId') serviceId?: string,
    @Query('userId') userId?: string,
    @Query('orderId') orderId?: string,
    @Query('isVisible') isVisible?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.reviewService.findAll(
      serviceId,
      userId,
      orderId,
      isVisible === 'true' ? true : isVisible === 'false' ? false : undefined,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
    );
  }

  @Get('stats')
  getStats(@Query('serviceId') serviceId?: string) {
    if (!serviceId) {
      return { totalReviews: 0, averageRating: 0, ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }, tagStatistics: [] };
    }
    return this.reviewService.getStatistics(serviceId);
  }

  @Get('user/:userId')
  getUserReviews(
    @Param('userId') userId: string,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.reviewService.getUserReviews(userId, page || 1, limit || 10);
  }

  @Get('service/:serviceId')
  getServiceReviews(
    @Param('serviceId') serviceId: string,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('rating', new ParseIntPipe({ optional: true })) rating?: number,
  ) {
    return this.reviewService.getServiceReviews(serviceId, page || 1, limit || 10, rating);
  }

  @Get('statistics/:serviceId')
  getStatistics(@Param('serviceId') serviceId: string) {
    return this.reviewService.getStatistics(serviceId);
  }

  @Post('statistics/batch')
  getBatchStatistics(@Body('serviceIds') serviceIds: string[]) {
    return this.reviewService.getBatchStatistics(serviceIds);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.reviewService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: { rating?: number; content?: string; images?: string[]; tags?: string[] }) {
    return this.reviewService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.reviewService.remove(id);
  }

  @Post(':id/admin-reply')
  adminReply(@Param('id') id: string, @Body() body: AdminReplyDto) {
    return this.reviewService.adminReply(id, body.content);
  }

  @Patch(':id/visibility')
  setVisible(
    @Param('id') id: string,
    @Body('isVisible') isVisible: boolean,
  ) {
    return this.reviewService.setVisible(id, isVisible);
  }

  @Post(':id/like')
  like(@Param('id') id: string) {
    return this.reviewService.like(id);
  }
}
