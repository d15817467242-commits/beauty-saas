import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BusinessHour } from '../entities/business-hour.entity';
import { AppointmentConfig } from '../entities/appointment-config.entity';

@Injectable()
export class AppointmentConfigService {
  constructor(
    @InjectRepository(BusinessHour)
    private businessHourRepository: Repository<BusinessHour>,
    @InjectRepository(AppointmentConfig)
    private appointmentConfigRepository: Repository<AppointmentConfig>,
  ) {}

  // ========== 营业时段管理 ==========

  async getBusinessHours(storeId?: string): Promise<BusinessHour[]> {
    const where: any = {};
    if (storeId) where.storeId = storeId;
    return this.businessHourRepository.find({ 
      where,
      order: { dayOfWeek: 'ASC' } 
    });
  }

  async setBusinessHours(hours: Partial<BusinessHour>[], storeId?: string): Promise<BusinessHour[]> {
    // 删除旧的营业时段
    const where: any = {};
    if (storeId) where.storeId = storeId;
    await this.businessHourRepository.delete(where);

    // 创建新的营业时段
    const entities = hours.map(h => {
      const entity = this.businessHourRepository.create(h);
      if (storeId) entity.storeId = storeId;
      return entity;
    });

    return this.businessHourRepository.save(entities);
  }

  async updateBusinessHour(id: string, data: Partial<BusinessHour>): Promise<BusinessHour> {
    const hour = await this.businessHourRepository.findOne({ where: { id } });
    if (!hour) {
      throw new Error('营业时段不存在');
    }
    Object.assign(hour, data);
    return this.businessHourRepository.save(hour);
  }

  // 获取某天的营业时间
  async getBusinessHourForDate(date: Date, storeId?: string): Promise<BusinessHour | null> {
    const dayOfWeek = date.getDay();
    const where: any = { dayOfWeek };
    if (storeId) where.storeId = storeId;
    return this.businessHourRepository.findOne({ where });
  }

  // 检查是否在营业时间内
  async isWithinBusinessHours(date: Date, storeId?: string): Promise<boolean> {
    const businessHour = await this.getBusinessHourForDate(date, storeId);
    if (!businessHour || !businessHour.isOpen) {
      return false;
    }

    const timeStr = date.toTimeString().slice(0, 5); // HH:MM
    const openTime = businessHour.openTime;
    const closeTime = businessHour.closeTime;

    if (timeStr < openTime || timeStr > closeTime) {
      return false;
    }

    // 检查是否在休息时段
    if (businessHour.breakStart && businessHour.breakEnd) {
      if (timeStr >= businessHour.breakStart && timeStr <= businessHour.breakEnd) {
        return false;
      }
    }

    return true;
  }

  // ========== 预约配置管理 ==========

  async getConfig(storeId?: string): Promise<AppointmentConfig> {
    const where: any = {};
    if (storeId) where.storeId = storeId;
    
    let config = await this.appointmentConfigRepository.findOne({ where });
    
    if (!config) {
      // 创建默认配置
      config = this.appointmentConfigRepository.create({ storeId });
      await this.appointmentConfigRepository.save(config);
    }
    
    return config;
  }

  async updateConfig(id: string, data: Partial<AppointmentConfig>): Promise<AppointmentConfig> {
    const config = await this.appointmentConfigRepository.findOne({ where: { id } });
    if (!config) {
      throw new Error('预约配置不存在');
    }
    Object.assign(config, data);
    return this.appointmentConfigRepository.save(config);
  }

  async setConfig(data: Partial<AppointmentConfig>, storeId?: string): Promise<AppointmentConfig> {
    const where: any = {};
    if (storeId) where.storeId = storeId;
    
    let config = await this.appointmentConfigRepository.findOne({ where });
    
    if (config) {
      Object.assign(config, data);
    } else {
      config = this.appointmentConfigRepository.create({ ...data, storeId });
    }
    
    return this.appointmentConfigRepository.save(config);
  }

  // ========== 特殊日期管理 ==========

  async addSpecialDay(configId: string, specialDay: {
    date: string;
    isOpen: boolean;
    openTime?: string;
    closeTime?: string;
    remark?: string;
  }): Promise<AppointmentConfig> {
    const config = await this.appointmentConfigRepository.findOne({ where: { id: configId } });
    if (!config) {
      throw new Error('预约配置不存在');
    }

    if (!config.specialDays) {
      config.specialDays = [];
    }

    // 检查是否已存在该日期
    const existingIndex = config.specialDays.findIndex(d => d.date === specialDay.date);
    if (existingIndex >= 0) {
      config.specialDays[existingIndex] = specialDay;
    } else {
      config.specialDays.push(specialDay);
    }

    return this.appointmentConfigRepository.save(config);
  }

  async removeSpecialDay(configId: string, date: string): Promise<AppointmentConfig> {
    const config = await this.appointmentConfigRepository.findOne({ where: { id: configId } });
    if (!config) {
      throw new Error('预约配置不存在');
    }

    if (config.specialDays) {
      config.specialDays = config.specialDays.filter(d => d.date !== date);
    }

    return this.appointmentConfigRepository.save(config);
  }

  // 获取某天的特殊设置
  async getSpecialDaySetting(dateStr: string, storeId?: string): Promise<{
    date: string;
    isOpen: boolean;
    openTime?: string;
    closeTime?: string;
    remark?: string;
  } | null> {
    const config = await this.getConfig(storeId);
    
    if (!config.specialDays) {
      return null;
    }

    return config.specialDays.find(d => d.date === dateStr) || null;
  }
}
