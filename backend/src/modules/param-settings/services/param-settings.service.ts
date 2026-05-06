import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { UserGroup } from '../entities/user-group.entity';
import { SystemParam } from '../entities/system-param.entity';

// 参数分组定义
export const PARAM_GROUPS = {
  front: '前台参数',
  sms: '短信参数',
  print: '打印参数',
  commission: '提成参数',
  stock: '库存参数',
  reminder: '提醒参数',
};

@Injectable()
export class ParamSettingsService {
  constructor(
    @InjectRepository(UserGroup)
    private userGroupRepository: Repository<UserGroup>,
    @InjectRepository(SystemParam)
    private systemParamRepository: Repository<SystemParam>,
  ) {}

  // ========== 用户组管理 ==========

  async getUserGroups(): Promise<UserGroup[]> {
    return this.userGroupRepository.find({
      order: { sort: 'ASC', createdAt: 'ASC' }
    });
  }

  async getUserGroup(id: string): Promise<UserGroup> {
    const group = await this.userGroupRepository.findOne({ where: { id } });
    if (!group) throw new NotFoundException('用户组不存在');
    return group;
  }

  async createUserGroup(data: Partial<UserGroup>): Promise<UserGroup> {
    const group = this.userGroupRepository.create(data);
    return this.userGroupRepository.save(group);
  }

  async updateUserGroup(id: string, data: Partial<UserGroup>): Promise<UserGroup> {
    const group = await this.getUserGroup(id);
    Object.assign(group, data);
    return this.userGroupRepository.save(group);
  }

  async deleteUserGroup(id: string): Promise<void> {
    const group = await this.getUserGroup(id);
    await this.userGroupRepository.remove(group);
  }

  // ========== 系统参数管理 ==========

  async getParamsByGroup(group: string): Promise<SystemParam[]> {
    return this.systemParamRepository.find({
      where: { group },
      order: { createdAt: 'ASC' }
    });
  }

  async getAllParams(): Promise<Record<string, SystemParam[]>> {
    const params = await this.systemParamRepository.find();
    const result: Record<string, SystemParam[]> = {};
    
    for (const param of params) {
      if (!result[param.group]) {
        result[param.group] = [];
      }
      result[param.group].push(param);
    }
    
    return result;
  }

  async getParam(key: string): Promise<SystemParam> {
    const param = await this.systemParamRepository.findOne({ where: { key } });
    if (!param) throw new NotFoundException('参数不存在');
    return param;
  }

  async getParamValue<T = any>(key: string, defaultValue?: T): Promise<T> {
    try {
      const param = await this.getParam(key);
      return this.parseValue(param.value, param.valueType) as T;
    } catch {
      return defaultValue as T;
    }
  }

  async setParam(key: string, value: any): Promise<SystemParam> {
    let param = await this.systemParamRepository.findOne({ where: { key } });
    
    if (param) {
      param.value = this.stringifyValue(value, param.valueType);
      return this.systemParamRepository.save(param);
    }
    
    throw new NotFoundException('参数不存在');
  }

  async createParam(data: Partial<SystemParam>): Promise<SystemParam> {
    const param = this.systemParamRepository.create(data);
    return this.systemParamRepository.save(param);
  }

  async updateParam(id: string, data: Partial<SystemParam>): Promise<SystemParam> {
    const param = await this.systemParamRepository.findOne({ where: { id } });
    if (!param) throw new NotFoundException('参数不存在');
    Object.assign(param, data);
    return this.systemParamRepository.save(param);
  }

  async deleteParam(id: string): Promise<void> {
    const param = await this.systemParamRepository.findOne({ where: { id } });
    if (!param) throw new NotFoundException('参数不存在');
    if (param.isSystem) throw new Error('系统参数不能删除');
    await this.systemParamRepository.remove(param);
  }

  // 批量设置参数
  async setParams(params: { key: string; value: any }[]): Promise<void> {
    for (const { key, value } of params) {
      await this.setParam(key, value);
    }
  }

  // ========== 前台参数 ==========

  async getFrontParams(): Promise<Record<string, any>> {
    const params = await this.getParamsByGroup('front');
    const result: Record<string, any> = {};
    
    for (const param of params) {
      result[param.key] = this.parseValue(param.value, param.valueType);
    }
    
    return result;
  }

  async setFrontParams(data: Record<string, any>): Promise<void> {
    for (const [key, value] of Object.entries(data)) {
      await this.setParam(key, value);
    }
  }

  // ========== 短信参数 ==========

  async getSmsParams(): Promise<Record<string, any>> {
    const params = await this.getParamsByGroup('sms');
    const result: Record<string, any> = {};
    
    for (const param of params) {
      result[param.key] = this.parseValue(param.value, param.valueType);
    }
    
    return result;
  }

  async setSmsParams(data: Record<string, any>): Promise<void> {
    for (const [key, value] of Object.entries(data)) {
      await this.setParam(key, value);
    }
  }

  // ========== 打印参数 ==========

  async getPrintParams(): Promise<Record<string, any>> {
    const params = await this.getParamsByGroup('print');
    const result: Record<string, any> = {};
    
    for (const param of params) {
      result[param.key] = this.parseValue(param.value, param.valueType);
    }
    
    return result;
  }

  async setPrintParams(data: Record<string, any>): Promise<void> {
    for (const [key, value] of Object.entries(data)) {
      await this.setParam(key, value);
    }
  }

  // ========== 提成参数 ==========

  async getCommissionParams(): Promise<Record<string, any>> {
    const params = await this.getParamsByGroup('commission');
    const result: Record<string, any> = {};
    
    for (const param of params) {
      result[param.key] = this.parseValue(param.value, param.valueType);
    }
    
    return result;
  }

  async setCommissionParams(data: Record<string, any>): Promise<void> {
    for (const [key, value] of Object.entries(data)) {
      await this.setParam(key, value);
    }
  }

  // ========== 库存参数 ==========

  async getStockParams(): Promise<Record<string, any>> {
    const params = await this.getParamsByGroup('stock');
    const result: Record<string, any> = {};
    
    for (const param of params) {
      result[param.key] = this.parseValue(param.value, param.valueType);
    }
    
    return result;
  }

  async setStockParams(data: Record<string, any>): Promise<void> {
    for (const [key, value] of Object.entries(data)) {
      await this.setParam(key, value);
    }
  }

  // ========== 提醒参数 ==========

  async getReminderParams(): Promise<Record<string, any>> {
    const params = await this.getParamsByGroup('reminder');
    const result: Record<string, any> = {};
    
    for (const param of params) {
      result[param.key] = this.parseValue(param.value, param.valueType);
    }
    
    return result;
  }

  async setReminderParams(data: Record<string, any>): Promise<void> {
    for (const [key, value] of Object.entries(data)) {
      await this.setParam(key, value);
    }
  }

  // ========== 辅助方法 ==========

  private parseValue(value: string, type: string): any {
    switch (type) {
      case 'number':
        return Number(value);
      case 'boolean':
        return value === 'true' || value === '1';
      case 'json':
        try {
          return JSON.parse(value);
        } catch {
          return value;
        }
      default:
        return value;
    }
  }

  private stringifyValue(value: any, type: string): string {
    switch (type) {
      case 'json':
        return JSON.stringify(value);
      case 'boolean':
        return value ? 'true' : 'false';
      case 'number':
        return String(value);
      default:
        return String(value);
    }
  }

  // 初始化默认参数
  async initDefaultParams(): Promise<void> {
    const defaultParams = [
      // 前台参数
      { key: 'front.business_name', value: '美业管理系统', group: 'front', name: '门店名称', valueType: 'string' },
      { key: 'front.business_phone', value: '', group: 'front', name: '联系电话', valueType: 'string' },
      { key: 'front.business_address', value: '', group: 'front', name: '门店地址', valueType: 'string' },
      { key: 'front.auto_print', value: 'false', group: 'front', name: '自动打印小票', valueType: 'boolean' },
      { key: 'front.show_member_price', value: 'true', group: 'front', name: '显示会员价', valueType: 'boolean' },
      { key: 'front.default_discount', value: '100', group: 'front', name: '默认折扣(%)', valueType: 'number' },
      
      // 短信参数
      { key: 'sms.provider', value: 'aliyun', group: 'sms', name: '短信服务商', valueType: 'string' },
      { key: 'sms.access_key', value: '', group: 'sms', name: 'AccessKey', valueType: 'string' },
      { key: 'sms.secret_key', value: '', group: 'sms', name: 'SecretKey', valueType: 'string' },
      { key: 'sms.sign_name', value: '', group: 'sms', name: '短信签名', valueType: 'string' },
      { key: 'sms.template_code', value: '', group: 'sms', name: '短信模板', valueType: 'string' },
      
      // 打印参数
      { key: 'print.printer_name', value: '', group: 'print', name: '打印机名称', valueType: 'string' },
      { key: 'print.paper_width', value: '58', group: 'print', name: '纸张宽度(mm)', valueType: 'number' },
      { key: 'print.print_header', value: '消费小票', group: 'print', name: '打印抬头', valueType: 'string' },
      { key: 'print.print_footer', value: '谢谢惠顾', group: 'print', name: '打印底部', valueType: 'string' },
      { key: 'print.auto_cut', value: 'true', group: 'print', name: '自动切纸', valueType: 'boolean' },
      
      // 提成参数
      { key: 'commission.calculate_type', value: 'service', group: 'commission', name: '提成计算方式', valueType: 'string' },
      { key: 'commission.default_rate', value: '10', group: 'commission', name: '默认提成比例(%)', valueType: 'number' },
      { key: 'commission.product_rate', value: '5', group: 'commission', name: '商品提成比例(%)', valueType: 'number' },
      { key: 'commission.card_rate', value: '3', group: 'commission', name: '开卡提成比例(%)', valueType: 'number' },
      
      // 库存参数
      { key: 'stock.warning_threshold', value: '10', group: 'stock', name: '库存预警阈值', valueType: 'number' },
      { key: 'stock.auto_warning', value: 'true', group: 'stock', name: '自动库存预警', valueType: 'boolean' },
      { key: 'stock.negative_stock', value: 'false', group: 'stock', name: '允许负库存', valueType: 'boolean' },
      { key: 'stock.default_warehouse', value: '', group: 'stock', name: '默认仓库', valueType: 'string' },
      
      // 提醒参数
      { key: 'reminder.member_birthday', value: 'true', group: 'reminder', name: '会员生日提醒', valueType: 'boolean' },
      { key: 'reminder.member_birthday_days', value: '7', group: 'reminder', name: '提前提醒天数', valueType: 'number' },
      { key: 'reminder.card_expire', value: 'true', group: 'reminder', name: '次卡到期提醒', valueType: 'boolean' },
      { key: 'reminder.card_expire_days', value: '30', group: 'reminder', name: '到期提前天数', valueType: 'number' },
      { key: 'reminder.balance_low', value: 'true', group: 'reminder', name: '余额不足提醒', valueType: 'boolean' },
      { key: 'reminder.balance_threshold', value: '100', group: 'reminder', name: '余额阈值', valueType: 'number' },
    ];

    for (const param of defaultParams) {
      const existing = await this.systemParamRepository.findOne({ where: { key: param.key } });
      if (!existing) {
        const entity = this.systemParamRepository.create({
          ...param,
          isSystem: true,
        });
        await this.systemParamRepository.save(entity);
      }
    }
  }
}
