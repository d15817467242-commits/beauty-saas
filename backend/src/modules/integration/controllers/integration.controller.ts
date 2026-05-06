import { Controller, Get, Post, Delete, Body, Param, Query } from '@nestjs/common';
import { IntegrationService } from '../services/integration.service';
import { MeituanConfig, DouyinConfig, WechatConfig, ThirdPartyCoupon } from '../entities/integration-config.entity';

@Controller('integration')
export class IntegrationController {
  constructor(private readonly service: IntegrationService) {}

  // ========== 美团配置接口 ==========

  @Get('meituan')
  getMeituanConfig(@Query('storeId') storeId: string): Promise<MeituanConfig | null> {
    return this.service.getMeituanConfig(storeId);
  }

  @Post('meituan')
  saveMeituanConfig(@Body() data: Partial<MeituanConfig>): Promise<MeituanConfig> {
    return this.service.saveMeituanConfig(data);
  }

  @Delete('meituan')
  deleteMeituanConfig(@Query('storeId') storeId: string): Promise<void> {
    return this.service.deleteMeituanConfig(storeId);
  }

  // ========== 抖音配置接口 ==========

  @Get('douyin')
  getDouyinConfig(@Query('storeId') storeId: string): Promise<DouyinConfig | null> {
    return this.service.getDouyinConfig(storeId);
  }

  @Post('douyin')
  saveDouyinConfig(@Body() data: Partial<DouyinConfig>): Promise<DouyinConfig> {
    return this.service.saveDouyinConfig(data);
  }

  @Delete('douyin')
  deleteDouyinConfig(@Query('storeId') storeId: string): Promise<void> {
    return this.service.deleteDouyinConfig(storeId);
  }

  // ========== 微信配置接口 ==========

  @Get('wechat')
  getWechatConfig(@Query('storeId') storeId: string): Promise<WechatConfig | null> {
    return this.service.getWechatConfig(storeId);
  }

  @Post('wechat')
  saveWechatConfig(@Body() data: Partial<WechatConfig>): Promise<WechatConfig> {
    return this.service.saveWechatConfig(data);
  }

  @Delete('wechat')
  deleteWechatConfig(@Query('storeId') storeId: string): Promise<void> {
    return this.service.deleteWechatConfig(storeId);
  }

  // ========== 券码核销接口 ==========

  @Get('coupon/query')
  queryCoupon(@Query('code') code: string): Promise<ThirdPartyCoupon> {
    return this.service.queryCoupon(code);
  }

  @Post('coupon/verify')
  verifyCoupon(
    @Body() data: {
      code: string;
      memberId?: string;
      phone?: string;
      amount?: number;
      remark?: string;
    }
  ): Promise<ThirdPartyCoupon> {
    return this.service.verifyCoupon(data);
  }

  @Post('coupon/refund')
  refundCoupon(
    @Body('code') code: string,
    @Body('reason') reason?: string
  ): Promise<ThirdPartyCoupon> {
    return this.service.refundCoupon(code, reason);
  }

  @Get('coupons')
  getCoupons(@Query() query: {
    platform?: 'meituan' | 'douyin';
    status?: 'pending' | 'verified' | 'refunded' | 'expired';
    keyword?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{ data: ThirdPartyCoupon[]; total: number }> {
    return this.service.getCoupons(query);
  }

  @Post('coupons/sync')
  syncCoupons(
    @Body('platform') platform: 'meituan' | 'douyin',
    @Body('storeId') storeId: string
  ): Promise<{ count: number }> {
    return this.service.syncCoupons(platform, storeId);
  }

  // ========== 统计接口 ==========

  @Get('coupon/statistics')
  getCouponStatistics(@Query() query: {
    platform?: 'meituan' | 'douyin';
    startDate?: string;
    endDate?: string;
  }): Promise<any> {
    return this.service.getCouponStatistics(query);
  }
}
