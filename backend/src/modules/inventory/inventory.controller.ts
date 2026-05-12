import { Controller, Get, Post, Put, Delete, Body, Param, Query, Request } from '@nestjs/common';
import { ProductService } from './product.service';
import { ConsumableService } from './consumable.service';
import { 
  CreateProductDto, 
  UpdateProductDto, 
  CreateStockMovementDto, 
  UpdateStockWarningDto 
} from './dto/product.dto';
import { 
  CreateConsumableDto, 
  UpdateConsumableDto, 
  CreateConsumableMovementDto, 
  CreateServiceConsumableDto 
} from './dto/consumable.dto';

@Controller('inventory')
export class InventoryController {
  constructor(
    private productService: ProductService,
    private consumableService: ConsumableService,
  ) {}

  // ==================== 产品管理 ====================
  
  @Post('products')
  async createProduct(@Body() dto: CreateProductDto) {
    return this.productService.create(dto);
  }

  @Get('warehouses')
  async getWarehouses() {
    return [{ id: 1, name: '默认仓库', type: 'main', address: '' }];
  }

  @Get('service-consumables')
  async findAllServiceConsumables() {
    return this.consumableService.findAllServiceConsumables();
  }

  @Get('products')
  async findAllProducts(@Query('category') category?: string) {
    return this.productService.findAll(category);
  }

  @Get('products/:id')
  async findOneProduct(@Param('id') id: string) {
    return this.productService.findOne(id);
  }

  @Put('products/:id')
  async updateProduct(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productService.update(id, dto);
  }

  @Delete('products/:id')
  async removeProduct(@Param('id') id: string) {
    await this.productService.remove(id);
    return { success: true };
  }

  // ==================== 库存管理 ====================
  
  @Post('stock/movement')
  async createStockMovement(@Body() dto: CreateStockMovementDto, @Request() req: any) {
    return this.productService.createStockMovement(dto, req.user.userId);
  }

  @Get('stock/movements')
  async getStockMovements(@Query('productId') productId?: string) {
    return this.productService.getProductStockMovements(productId);
  }

  @Put('stock/warning/:productId')
  async updateStockWarning(
    @Param('productId') productId: string,
    @Body() dto: UpdateStockWarningDto,
  ) {
    return this.productService.updateStockWarning(productId, dto);
  }

  @Get('stock/warnings')
  async getStockWarnings(@Query('handled') handled?: string) {
    return this.productService.getStockWarnings(handled === 'true');
  }

  @Post('stock/warnings/:id/handle')
  async handleStockWarning(
    @Param('id') id: string,
    @Body('remark') remark: string,
    @Request() req: any,
  ) {
    return this.productService.handleStockWarning(id, remark, req.user.userId);
  }

  // ==================== 耗材管理 ====================

  @Post('consumables')
  async createConsumable(@Body() dto: CreateConsumableDto) {
    return this.consumableService.create(dto);
  }

  @Get('consumables')
  async findAllConsumables(@Query('category') category?: string) {
    return this.consumableService.findAll(category);
  }

  // 固定路径必须在动态参数路由之前
  @Get('consumables/low-stock')
  async getLowStockConsumables() {
    return this.consumableService.getLowStockConsumables();
  }

  @Get('consumables/movements')
  async getConsumableMovements(@Query('consumableId') consumableId?: string) {
    return this.consumableService.getMovements(consumableId);
  }

  @Get('consumables/:id')
  async findOneConsumable(@Param('id') id: string) {
    return this.consumableService.findOne(id);
  }

  @Put('consumables/:id')
  async updateConsumable(@Param('id') id: string, @Body() dto: UpdateConsumableDto) {
    return this.consumableService.update(id, dto);
  }

  @Delete('consumables/:id')
  async removeConsumable(@Param('id') id: string) {
    await this.consumableService.remove(id);
    return { success: true };
  }

  @Post('consumables/movement')
  async createConsumableMovement(@Body() dto: CreateConsumableMovementDto, @Request() req: any) {
    return this.consumableService.createMovement(dto, req.user.userId);
  }

  // ==================== 服务耗材关联 ====================
  
  @Post('service-consumables')
  async setServiceConsumable(@Body() dto: CreateServiceConsumableDto) {
    return this.consumableService.setServiceConsumable(dto);
  }

  @Get('service-consumables/:serviceId')
  async getServiceConsumables(@Param('serviceId') serviceId: string) {
    return this.consumableService.getServiceConsumables(serviceId);
  }

  @Delete('service-consumables/:serviceId/:consumableId')
  async removeServiceConsumable(
    @Param('serviceId') serviceId: string,
    @Param('consumableId') consumableId: string,
  ) {
    await this.consumableService.removeServiceConsumable(serviceId, consumableId);
    return { success: true };
  }
}
