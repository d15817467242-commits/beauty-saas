import { Controller, Get, Post, Put, Delete, Body, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { GiftService } from '../services/gift.service';
import { Gift, GiftExchange } from '../entities/gift.entity';
import { CreateGiftDto, UpdateGiftDto, GiftQueryDto, ExchangeGiftDto } from '../dto/gift.dto';

@Controller('gift')
export class GiftController {
  constructor(private readonly service: GiftService) {}

  // ========== 礼品管理 ==========

  @Get()
  findAll(@Query() query: GiftQueryDto): Promise<{ data: Gift[]; total: number }> {
    return this.service.findAll(query);
  }

  @Get('statistics')
  getStatistics(): Promise<any> {
    return this.service.getStatistics();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Gift> {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateGiftDto): Promise<Gift> {
    return this.service.create(dto);
  }

  @Put(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateGiftDto
  ): Promise<Gift> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<{ success: boolean }> {
    await this.service.remove(id);
    return { success: true };
  }

  @Put(':id/stock')
  async updateStock(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('quantity') quantity: number
  ): Promise<Gift> {
    return this.service.updateStock(id, quantity);
  }

  // ========== 礼品兑换 ==========

  @Post('exchange')
  exchange(
    @Body('memberId') memberId: string,
    @Body() dto: ExchangeGiftDto
  ): Promise<GiftExchange> {
    return this.service.exchange(memberId, dto);
  }

  @Post('exchange/:id/complete')
  completeExchange(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('completedBy') completedBy: string
  ): Promise<GiftExchange> {
    return this.service.completeExchange(id, completedBy);
  }

  @Post('exchange/:id/cancel')
  cancelExchange(@Param('id', ParseUUIDPipe) id: string): Promise<GiftExchange> {
    return this.service.cancelExchange(id);
  }

  // ========== 兑换记录 ==========

  @Get('exchange/records')
  getExchangeRecords(@Query() query: {
    memberId?: string;
    giftId?: string;
    status?: 'pending' | 'completed' | 'cancelled';
    page?: number;
    pageSize?: number;
  }): Promise<{ data: GiftExchange[]; total: number }> {
    return this.service.getExchangeRecords(query);
  }
}
