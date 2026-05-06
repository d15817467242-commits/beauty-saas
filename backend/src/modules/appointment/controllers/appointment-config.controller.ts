import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { AppointmentConfigService } from '../services/appointment-config.service';
import { BusinessHour } from '../entities/business-hour.entity';
import { AppointmentConfig } from '../entities/appointment-config.entity';

@Controller('appointment')
export class AppointmentConfigController {
  constructor(private readonly configService: AppointmentConfigService) {}

  // ========== 营业时段接口 ==========

  @Get('business-hours')
  async getBusinessHours(@Query('storeId') storeId?: string): Promise<BusinessHour[]> {
    return this.configService.getBusinessHours(storeId);
  }

  @Post('business-hours')
  async setBusinessHours(
    @Body() hours: Partial<BusinessHour>[],
    @Query('storeId') storeId?: string
  ): Promise<BusinessHour[]> {
    return this.configService.setBusinessHours(hours, storeId);
  }

  @Put('business-hours/:id')
  async updateBusinessHour(
    @Param('id') id: string,
    @Body() data: Partial<BusinessHour>
  ): Promise<BusinessHour> {
    return this.configService.updateBusinessHour(id, data);
  }

  @Get('business-hours/check')
  async checkBusinessHours(
    @Query('date') dateStr: string,
    @Query('storeId') storeId?: string
  ): Promise<{ isWithin: boolean; businessHour: BusinessHour | null }> {
    const date = new Date(dateStr);
    const isWithin = await this.configService.isWithinBusinessHours(date, storeId);
    const businessHour = await this.configService.getBusinessHourForDate(date, storeId);
    return { isWithin, businessHour };
  }

  // ========== 预约配置接口 ==========

  @Get('config')
  async getConfig(@Query('storeId') storeId?: string): Promise<AppointmentConfig> {
    return this.configService.getConfig(storeId);
  }

  @Post('config')
  async setConfig(
    @Body() data: Partial<AppointmentConfig>,
    @Query('storeId') storeId?: string
  ): Promise<AppointmentConfig> {
    return this.configService.setConfig(data, storeId);
  }

  @Put('config/:id')
  async updateConfig(
    @Param('id') id: string,
    @Body() data: Partial<AppointmentConfig>
  ): Promise<AppointmentConfig> {
    return this.configService.updateConfig(id, data);
  }

  // ========== 特殊日期接口 ==========

  @Post('config/:id/special-day')
  async addSpecialDay(
    @Param('id') configId: string,
    @Body() specialDay: {
      date: string;
      isOpen: boolean;
      openTime?: string;
      closeTime?: string;
      remark?: string;
    }
  ): Promise<AppointmentConfig> {
    return this.configService.addSpecialDay(configId, specialDay);
  }

  @Delete('config/:id/special-day/:date')
  async removeSpecialDay(
    @Param('id') configId: string,
    @Param('date') date: string
  ): Promise<AppointmentConfig> {
    return this.configService.removeSpecialDay(configId, date);
  }

  @Get('special-day/:date')
  async getSpecialDaySetting(
    @Param('date') date: string,
    @Query('storeId') storeId?: string
  ): Promise<{ setting: any }> {
    const setting = await this.configService.getSpecialDaySetting(date, storeId);
    return { setting };
  }
}
