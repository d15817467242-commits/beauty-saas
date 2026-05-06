import { Controller, Get, Post, Put, Delete, Body, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { DataSettingsService } from '../services/data-settings.service';
import { Store } from '../entities/store.entity';
import { Department } from '../entities/department.entity';
import { Position } from '../entities/position.entity';
import { ProductUnit } from '../entities/product-unit.entity';
import { ProductSpec } from '../entities/product-spec.entity';
import { PriceStrategy } from '../entities/price-strategy.entity';
import { Warehouse } from '../entities/warehouse.entity';

@Controller()
export class DataSettingsController {
  constructor(private readonly service: DataSettingsService) {}

  // ========== 门店接口 (符合API规范: GET/PUT /api/store) ==========
  
  @Get('store')
  getStores(): Promise<Store[]> {
    return this.service.getStores();
  }

  @Get('store/:id')
  getStore(@Param('id', ParseUUIDPipe) id: string): Promise<Store> {
    return this.service.getStore(id);
  }

  @Put('store/:id')
  updateStore(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() data: Partial<Store>
  ): Promise<Store> {
    return this.service.updateStore(id, data);
  }

  @Post('store')
  createStore(@Body() data: Partial<Store>): Promise<Store> {
    return this.service.createStore(data);
  }

  // ========== 部门接口 (符合API规范: GET/POST /api/department) ==========
  
  @Get('department')
  getDepartments(@Query('storeId') storeId?: string): Promise<Department[]> {
    return this.service.getDepartments(storeId);
  }

  @Get('department/:id')
  getDepartment(@Param('id', ParseUUIDPipe) id: string): Promise<Department> {
    return this.service.getDepartment(id);
  }

  @Post('department')
  createDepartment(@Body() data: Partial<Department>): Promise<Department> {
    return this.service.createDepartment(data);
  }

  @Put('department/:id')
  updateDepartment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() data: Partial<Department>
  ): Promise<Department> {
    return this.service.updateDepartment(id, data);
  }

  @Delete('department/:id')
  deleteDepartment(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.service.deleteDepartment(id);
  }

  // ========== 职位接口 (符合API规范: GET/POST /api/position) ==========
  
  @Get('position')
  getPositions(
    @Query('departmentId') departmentId?: string,
    @Query('storeId') storeId?: string
  ): Promise<Position[]> {
    return this.service.getPositions(departmentId, storeId);
  }

  @Get('position/:id')
  getPosition(@Param('id', ParseUUIDPipe) id: string): Promise<Position> {
    return this.service.getPosition(id);
  }

  @Post('position')
  createPosition(@Body() data: Partial<Position>): Promise<Position> {
    return this.service.createPosition(data);
  }

  @Put('position/:id')
  updatePosition(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() data: Partial<Position>
  ): Promise<Position> {
    return this.service.updatePosition(id, data);
  }

  @Delete('position/:id')
  deletePosition(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.service.deletePosition(id);
  }

  // ========== 商品单位接口 (符合API规范: GET/POST /api/product/unit) ==========
  
  @Get('product/unit')
  getProductUnits(): Promise<ProductUnit[]> {
    return this.service.getProductUnits();
  }

  @Get('product/unit/:id')
  getProductUnit(@Param('id', ParseUUIDPipe) id: string): Promise<ProductUnit> {
    return this.service.getProductUnit(id);
  }

  @Post('product/unit')
  createProductUnit(@Body() data: Partial<ProductUnit>): Promise<ProductUnit> {
    return this.service.createProductUnit(data);
  }

  @Put('product/unit/:id')
  updateProductUnit(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() data: Partial<ProductUnit>
  ): Promise<ProductUnit> {
    return this.service.updateProductUnit(id, data);
  }

  @Delete('product/unit/:id')
  deleteProductUnit(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.service.deleteProductUnit(id);
  }

  // ========== 商品规格接口 (符合API规范: GET/POST /api/product/spec) ==========
  
  @Get('product/spec')
  getProductSpecs(): Promise<ProductSpec[]> {
    return this.service.getProductSpecs();
  }

  @Get('product/spec/:id')
  getProductSpec(@Param('id', ParseUUIDPipe) id: string): Promise<ProductSpec> {
    return this.service.getProductSpec(id);
  }

  @Post('product/spec')
  createProductSpec(@Body() data: Partial<ProductSpec>): Promise<ProductSpec> {
    return this.service.createProductSpec(data);
  }

  @Put('product/spec/:id')
  updateProductSpec(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() data: Partial<ProductSpec>
  ): Promise<ProductSpec> {
    return this.service.updateProductSpec(id, data);
  }

  @Delete('product/spec/:id')
  deleteProductSpec(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.service.deleteProductSpec(id);
  }

  // ========== 仓库接口 (符合API规范: GET/POST /api/warehouse) ==========
  
  @Get('warehouse')
  getWarehouses(@Query('storeId') storeId?: string): Promise<Warehouse[]> {
    return this.service.getWarehouses(storeId);
  }

  @Get('warehouse/default')
  getDefaultWarehouse(): Promise<Warehouse | null> {
    return this.service.getDefaultWarehouse();
  }

  @Get('warehouse/:id')
  getWarehouse(@Param('id', ParseUUIDPipe) id: string): Promise<Warehouse> {
    return this.service.getWarehouse(id);
  }

  @Post('warehouse')
  createWarehouse(@Body() data: Partial<Warehouse>): Promise<Warehouse> {
    return this.service.createWarehouse(data);
  }

  @Put('warehouse/:id')
  updateWarehouse(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() data: Partial<Warehouse>
  ): Promise<Warehouse> {
    return this.service.updateWarehouse(id, data);
  }

  @Delete('warehouse/:id')
  deleteWarehouse(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.service.deleteWarehouse(id);
  }

  // ========== 价格策略接口 (符合API规范: GET/PUT /api/price-strategy) ==========
  
  @Get('price-strategy')
  getPriceStrategies(): Promise<PriceStrategy[]> {
    return this.service.getPriceStrategies();
  }

  @Get('price-strategy/:id')
  getPriceStrategy(@Param('id', ParseUUIDPipe) id: string): Promise<PriceStrategy> {
    return this.service.getPriceStrategy(id);
  }

  @Post('price-strategy')
  createPriceStrategy(@Body() data: Partial<PriceStrategy>): Promise<PriceStrategy> {
    return this.service.createPriceStrategy(data);
  }

  @Put('price-strategy/:id')
  updatePriceStrategy(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() data: Partial<PriceStrategy>
  ): Promise<PriceStrategy> {
    return this.service.updatePriceStrategy(id, data);
  }

  @Delete('price-strategy/:id')
  deletePriceStrategy(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.service.deletePriceStrategy(id);
  }
}
