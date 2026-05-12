import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Store } from '../../store/store.entity';
import { Department } from '../entities/department.entity';
import { Position } from '../entities/position.entity';
import { ProductUnit } from '../entities/product-unit.entity';
import { ProductSpec } from '../entities/product-spec.entity';
import { PriceStrategy } from '../entities/price-strategy.entity';
import { Warehouse } from '../entities/warehouse.entity';

@Injectable()
export class DataSettingsService {
  constructor(
    @InjectRepository(Store)
    private storeRepository: Repository<Store>,
    @InjectRepository(Department)
    private departmentRepository: Repository<Department>,
    @InjectRepository(Position)
    private positionRepository: Repository<Position>,
    @InjectRepository(ProductUnit)
    private productUnitRepository: Repository<ProductUnit>,
    @InjectRepository(ProductSpec)
    private productSpecRepository: Repository<ProductSpec>,
    @InjectRepository(PriceStrategy)
    private priceStrategyRepository: Repository<PriceStrategy>,
    @InjectRepository(Warehouse)
    private warehouseRepository: Repository<Warehouse>,
  ) {}

  // ========== 门店管理 ==========
  
  async getStores(): Promise<Store[]> {
    return this.storeRepository.find({ order: { createdAt: 'DESC' } });
  }

  async getStore(id: string): Promise<Store> {
    const store = await this.storeRepository.findOne({ where: { id } });
    if (!store) throw new NotFoundException('门店不存在');
    return store;
  }

  async createStore(data: Partial<Store>): Promise<Store> {
    const store = this.storeRepository.create(data);
    return this.storeRepository.save(store);
  }

  async updateStore(id: string, data: Partial<Store>): Promise<Store> {
    const store = await this.getStore(id);
    Object.assign(store, data);
    return this.storeRepository.save(store);
  }

  async deleteStore(id: string): Promise<void> {
    const store = await this.getStore(id);
    await this.storeRepository.remove(store);
  }

  // ========== 部门管理 ==========
  
  async getDepartments(storeId?: string): Promise<Department[]> {
    const where: any = {};
    if (storeId) where.storeId = storeId;
    return this.departmentRepository.find({ 
      where, 
      order: { sort: 'ASC', createdAt: 'ASC' },
      relations: ['parent']
    });
  }

  async getDepartment(id: string): Promise<Department> {
    const dept = await this.departmentRepository.findOne({ 
      where: { id },
      relations: ['parent']
    });
    if (!dept) throw new NotFoundException('部门不存在');
    return dept;
  }

  async createDepartment(data: Partial<Department>): Promise<Department> {
    const dept = this.departmentRepository.create(data);
    return this.departmentRepository.save(dept);
  }

  async updateDepartment(id: string, data: Partial<Department>): Promise<Department> {
    const dept = await this.getDepartment(id);
    Object.assign(dept, data);
    return this.departmentRepository.save(dept);
  }

  async deleteDepartment(id: string): Promise<void> {
    const dept = await this.getDepartment(id);
    await this.departmentRepository.remove(dept);
  }

  // ========== 职位管理 ==========
  
  async getPositions(departmentId?: string, storeId?: string): Promise<Position[]> {
    const where: any = {};
    if (departmentId) where.departmentId = departmentId;
    if (storeId) where.storeId = storeId;
    return this.positionRepository.find({ 
      where, 
      order: { sort: 'ASC', createdAt: 'ASC' }
    });
  }

  async getPosition(id: string): Promise<Position> {
    const position = await this.positionRepository.findOne({ where: { id } });
    if (!position) throw new NotFoundException('职位不存在');
    return position;
  }

  async createPosition(data: Partial<Position>): Promise<Position> {
    const position = this.positionRepository.create(data);
    return this.positionRepository.save(position);
  }

  async updatePosition(id: string, data: Partial<Position>): Promise<Position> {
    const position = await this.getPosition(id);
    Object.assign(position, data);
    return this.positionRepository.save(position);
  }

  async deletePosition(id: string): Promise<void> {
    const position = await this.getPosition(id);
    await this.positionRepository.remove(position);
  }

  // ========== 商品单位管理 ==========
  
  async getProductUnits(): Promise<ProductUnit[]> {
    return this.productUnitRepository.find({ 
      where: { isActive: true },
      order: { sort: 'ASC', createdAt: 'ASC' }
    });
  }

  async getProductUnit(id: string): Promise<ProductUnit> {
    const unit = await this.productUnitRepository.findOne({ where: { id } });
    if (!unit) throw new NotFoundException('商品单位不存在');
    return unit;
  }

  async createProductUnit(data: Partial<ProductUnit>): Promise<ProductUnit> {
    const unit = this.productUnitRepository.create(data);
    return this.productUnitRepository.save(unit);
  }

  async updateProductUnit(id: string, data: Partial<ProductUnit>): Promise<ProductUnit> {
    const unit = await this.getProductUnit(id);
    Object.assign(unit, data);
    return this.productUnitRepository.save(unit);
  }

  async deleteProductUnit(id: string): Promise<void> {
    const unit = await this.getProductUnit(id);
    await this.productUnitRepository.remove(unit);
  }

  // ========== 商品规格管理 ==========
  
  async getProductSpecs(): Promise<ProductSpec[]> {
    return this.productSpecRepository.find({ 
      where: { isActive: true },
      order: { sort: 'ASC', createdAt: 'ASC' }
    });
  }

  async getProductSpec(id: string): Promise<ProductSpec> {
    const spec = await this.productSpecRepository.findOne({ where: { id } });
    if (!spec) throw new NotFoundException('商品规格不存在');
    return spec;
  }

  async createProductSpec(data: Partial<ProductSpec>): Promise<ProductSpec> {
    const spec = this.productSpecRepository.create(data);
    return this.productSpecRepository.save(spec);
  }

  async updateProductSpec(id: string, data: Partial<ProductSpec>): Promise<ProductSpec> {
    const spec = await this.getProductSpec(id);
    Object.assign(spec, data);
    return this.productSpecRepository.save(spec);
  }

  async deleteProductSpec(id: string): Promise<void> {
    const spec = await this.getProductSpec(id);
    await this.productSpecRepository.remove(spec);
  }

  // ========== 价格策略管理 ==========
  
  async getPriceStrategies(): Promise<PriceStrategy[]> {
    return this.priceStrategyRepository.find({ 
      where: { isActive: true },
      order: { sort: 'ASC', createdAt: 'ASC' }
    });
  }

  async getPriceStrategy(id: string): Promise<PriceStrategy> {
    const strategy = await this.priceStrategyRepository.findOne({ where: { id } });
    if (!strategy) throw new NotFoundException('价格策略不存在');
    return strategy;
  }

  async createPriceStrategy(data: Partial<PriceStrategy>): Promise<PriceStrategy> {
    const strategy = this.priceStrategyRepository.create(data);
    return this.priceStrategyRepository.save(strategy);
  }

  async updatePriceStrategy(id: string, data: Partial<PriceStrategy>): Promise<PriceStrategy> {
    const strategy = await this.getPriceStrategy(id);
    Object.assign(strategy, data);
    return this.priceStrategyRepository.save(strategy);
  }

  async deletePriceStrategy(id: string): Promise<void> {
    const strategy = await this.getPriceStrategy(id);
    await this.priceStrategyRepository.remove(strategy);
  }

  // ========== 仓库管理 ==========
  
  async getWarehouses(storeId?: string): Promise<Warehouse[]> {
    const where: any = { isActive: true };
    if (storeId) where.storeId = storeId;
    return this.warehouseRepository.find({ 
      where, 
      order: { isDefault: 'DESC', sort: 'ASC', createdAt: 'ASC' }
    });
  }

  async getWarehouse(id: string): Promise<Warehouse> {
    const warehouse = await this.warehouseRepository.findOne({ where: { id } });
    if (!warehouse) throw new NotFoundException('仓库不存在');
    return warehouse;
  }

  async createWarehouse(data: Partial<Warehouse>): Promise<Warehouse> {
    // 如果设置为默认仓库，先取消其他默认仓库
    if (data.isDefault) {
      await this.warehouseRepository.update(
        { isDefault: true },
        { isDefault: false }
      );
    }
    const warehouse = this.warehouseRepository.create(data);
    return this.warehouseRepository.save(warehouse);
  }

  async updateWarehouse(id: string, data: Partial<Warehouse>): Promise<Warehouse> {
    const warehouse = await this.getWarehouse(id);
    // 如果设置为默认仓库，先取消其他默认仓库
    if (data.isDefault) {
      await this.warehouseRepository.update(
        { isDefault: true },
        { isDefault: false }
      );
    }
    Object.assign(warehouse, data);
    return this.warehouseRepository.save(warehouse);
  }

  async deleteWarehouse(id: string): Promise<void> {
    const warehouse = await this.getWarehouse(id);
    await this.warehouseRepository.remove(warehouse);
  }

  async getDefaultWarehouse(): Promise<Warehouse | null> {
    return this.warehouseRepository.findOne({ 
      where: { isDefault: true, isActive: true } 
    });
  }
}
