import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In } from 'typeorm';
import { Store, StoreConfig, StoreStatus } from './store.entity';
import { CreateStoreDto, UpdateStoreDto, QueryStoreDto } from './dto/store.dto';

@Injectable()
export class StoreService {
  constructor(
    @InjectRepository(Store)
    private storeRepository: Repository<Store>,
    @InjectRepository(StoreConfig)
    private storeConfigRepository: Repository<StoreConfig>,
  ) {}

  // 创建门店
  async create(dto: CreateStoreDto): Promise<Store> {
    const store = this.storeRepository.create(dto);
    return this.storeRepository.save(store);
  }

  // 更新门店
  async update(id: string, dto: UpdateStoreDto): Promise<Store> {
    const store = await this.storeRepository.findOne({ where: { id } });
    if (!store) {
      throw new NotFoundException('门店不存在');
    }
    Object.assign(store, dto);
    return this.storeRepository.save(store);
  }

  // 删除门店
  async delete(id: string): Promise<void> {
    const store = await this.storeRepository.findOne({ where: { id } });
    if (!store) {
      throw new NotFoundException('门店不存在');
    }
    await this.storeRepository.remove(store);
  }

  // 获取门店详情
  async get(id: string): Promise<Store> {
    const store = await this.storeRepository.findOne({ where: { id } });
    if (!store) {
      throw new NotFoundException('门店不存在');
    }
    return store;
  }

  // 获取门店列表
  async list(query: QueryStoreDto): Promise<{ data: Store[]; total: number }> {
    const { keyword, status, city, province, page = 1, pageSize = 10 } = query;
    
    const queryBuilder = this.storeRepository.createQueryBuilder('store');
    
    if (keyword) {
      queryBuilder.andWhere(
        '(store.name LIKE :keyword OR store.code LIKE :keyword OR store.address LIKE :keyword)',
        { keyword: `%${keyword}%` }
      );
    }
    
    if (status) {
      queryBuilder.andWhere('store.status = :status', { status });
    }
    
    if (city) {
      queryBuilder.andWhere('store.city = :city', { city });
    }
    
    if (province) {
      queryBuilder.andWhere('store.province = :province', { province });
    }
    
    queryBuilder
      .orderBy('store.createdAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);
    
    const [data, total] = await queryBuilder.getManyAndCount();
    return { data, total };
  }

  // 获取所有活跃门店
  async getActiveStores(): Promise<Store[]> {
    return this.storeRepository.find({ 
      where: { status: StoreStatus.ACTIVE },
      order: { createdAt: 'DESC' }
    });
  }

  // 获取门店树形结构
  async getTree(): Promise<any[]> {
    const stores = await this.storeRepository.find({ order: { createdAt: 'DESC' } });
    
    const buildTree = (items: Store[], parentId: string | null = null): any[] => {
      return items
        .filter(item => (parentId ? item.parentId === parentId : !item.parentId))
        .map(item => ({
          ...item,
          children: buildTree(items, item.id),
        }));
    };
    
    return buildTree(stores);
  }

  // 设置门店配置
  async setConfig(storeId: string, key: string, value: any, description?: string, type?: string): Promise<StoreConfig> {
    let config = await this.storeConfigRepository.findOne({ 
      where: { storeId, key } 
    });
    
    const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
    
    if (config) {
      config.value = stringValue;
      if (description) config.description = description;
      if (type) config.type = type;
    } else {
      config = this.storeConfigRepository.create({
        storeId,
        key,
        value: stringValue,
        description,
        type: type || 'string',
      });
    }
    
    return this.storeConfigRepository.save(config);
  }

  // 获取门店配置
  async getConfig(storeId: string, key: string, defaultValue?: any): Promise<any> {
    const config = await this.storeConfigRepository.findOne({ 
      where: { storeId, key } 
    });
    
    if (!config) return defaultValue;
    
    if (config.type === 'number') return Number(config.value);
    if (config.type === 'boolean') return config.value === 'true';
    if (config.type === 'json') {
      try {
        return JSON.parse(config.value);
      } catch {
        return config.value;
      }
    }
    return config.value;
  }

  // 获取门店所有配置
  async getAllConfigs(storeId: string): Promise<StoreConfig[]> {
    return this.storeConfigRepository.find({ where: { storeId } });
  }

  // 删除门店配置
  async deleteConfig(storeId: string, key: string): Promise<void> {
    await this.storeConfigRepository.delete({ storeId, key });
  }

  // 批量设置门店配置
  async setConfigs(storeId: string, configs: Array<{ key: string; value: any; description?: string; type?: string }>): Promise<void> {
    for (const config of configs) {
      await this.setConfig(storeId, config.key, config.value, config.description, config.type);
    }
  }

  // 获取门店统计
  async getStats(): Promise<any> {
    const total = await this.storeRepository.count();
    const active = await this.storeRepository.count({ where: { status: StoreStatus.ACTIVE } });
    const inactive = await this.storeRepository.count({ where: { status: StoreStatus.INACTIVE } });
    const maintenance = await this.storeRepository.count({ where: { status: StoreStatus.MAINTENANCE } });
    
    return { total, active, inactive, maintenance };
  }

  // 批量更新门店状态
  async batchUpdateStatus(ids: string[], status: StoreStatus): Promise<void> {
    await this.storeRepository.update({ id: In(ids) }, { status });
  }

  // 根据编码获取门店
  async getByCode(code: string): Promise<Store | null> {
    return this.storeRepository.findOne({ where: { code } });
  }
}
