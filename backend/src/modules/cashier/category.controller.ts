import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ServiceCategoryService } from './services/service-category.service';
import { ProductCategoryService } from './services/product-category.service';
import { DiscountService } from './services/discount.service';
import { WarehouseService } from './services/warehouse.service';
import { CouponService } from './services/coupon.service';
import { CreateServiceCategoryDto, UpdateServiceCategoryDto } from './dto/service-category.dto';
import { CreateProductCategoryDto, UpdateProductCategoryDto } from './dto/product-category.dto';
import { CreateDiscountDto, UpdateDiscountDto, ApplyDiscountDto } from './dto/discount.dto';
import { CreateWarehouseDto, UpdateWarehouseDto } from './dto/warehouse.dto';
import { VerifyCouponDto, CreateCouponDto, CancelCouponDto } from './dto/coupon.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

// 服务分类控制器 (符合API规范: GET /api/service-category)
@Controller('service-category')
export class ServiceCategoryController {
  constructor(private readonly service: ServiceCategoryService) {}

  @Post()
  create(@Body() dto: CreateServiceCategoryDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get('tree')
  getTree() {
    return this.service.getTree();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateServiceCategoryDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}

// 商品分类控制器 (符合API规范: GET /api/product-category)
@Controller('product-category')
export class ProductCategoryController {
  constructor(private readonly service: ProductCategoryService) {}

  @Post()
  create(@Body() dto: CreateProductCategoryDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get('tree')
  getTree() {
    return this.service.getTree();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProductCategoryDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}

// 折扣控制器
@Controller('discount')
export class DiscountController {
  constructor(private readonly service: DiscountService) {}

  @Post()
  create(@Body() dto: CreateDiscountDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get('active')
  getActiveDiscounts() {
    return this.service.getActiveDiscounts();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Get('code/:code')
  findByCode(@Param('code') code: string) {
    return this.service.findByCode(code);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateDiscountDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Post('apply')
  applyDiscount(@Body() dto: ApplyDiscountDto) {
    return this.service.validateAndApply(dto);
  }
}

// 仓库控制器 (符合API规范: GET/POST /api/warehouse)
@Controller('warehouse')
export class WarehouseController {
  constructor(private readonly service: WarehouseService) {}

  @Post()
  create(@Body() dto: CreateWarehouseDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get('active')
  findActive() {
    return this.service.findActive();
  }

  @Get('default')
  getDefault() {
    return this.service.getDefault();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateWarehouseDto) {
    return this.service.update(id, dto);
  }

  @Put(':id/default')
  setDefault(@Param('id') id: string) {
    return this.service.setDefault(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}

// 团购券核销控制器 (符合API规范: POST /api/voucher/verify)
@Controller('voucher')
export class CouponController {
  constructor(private readonly service: CouponService) {}

  @Post()
  create(@Body() dto: CreateCouponDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get('stats')
  getStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.service.getStats(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Get('code/:code')
  findByCode(@Param('code') code: string) {
    return this.service.findByCode(code);
  }

  // 核销验券 (符合API规范: POST /api/voucher/verify)
  @Post('verify')
  verify(@Body() dto: VerifyCouponDto, @CurrentUser('id') userId: string) {
    return this.service.verify(dto, userId);
  }

  // 取消券
  @Post('cancel')
  cancel(@Body() dto: CancelCouponDto) {
    return this.service.cancel(dto);
  }

  // 查询会员的券
  @Get('member/:memberId')
  findByMember(@Param('memberId') memberId: string) {
    return this.service.findByMember(memberId);
  }
}
