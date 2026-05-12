import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CashierService } from './cashier.service';
import { CashierController } from './cashier.controller';
import { CreditController } from './credit.controller';
import { CreditService } from './credit.service';
import { Consumption } from './consumption.entity';
import { Credit, CreditPayment } from './credit.entity';
import { MemberModule } from '../member/member.module';
import { EmployeeModule } from '../employee/employee.module';
import { ServiceModule } from '../service/service.module';

// 实体 - 使用其他模块的实体避免重复
import { ServiceCategoryEntity } from '../service/service-category.entity';
import { ProductCategory } from './entities/product-category.entity';
import { Discount } from './entities/discount.entity';
import { Warehouse } from '../data-settings/entities/warehouse.entity';
import { CouponVerification } from './entities/coupon-verification.entity';
import { Product } from '../inventory/product.entity';
import { Document } from './entities/document.entity';

// 服务
import { ServiceCategoryService } from './services/service-category.service';
import { ProductCategoryService } from './services/product-category.service';
import { DiscountService } from './services/discount.service';
import { WarehouseService } from './services/warehouse.service';
import { CouponService } from './services/coupon.service';

// 控制器
import {
  ServiceCategoryController,
  ProductCategoryController,
  DiscountController,
  WarehouseController,
  CouponController,
} from './category.controller';

@Module({
  imports: [
    MemberModule,
    EmployeeModule,
    ServiceModule,
    TypeOrmModule.forFeature([
      Consumption,
      Credit,
      CreditPayment,
      ServiceCategoryEntity,
      ProductCategory,
      Discount,
      Warehouse,
      CouponVerification,
      Product,
      Document,
    ]),
  ],
  controllers: [
    CashierController,
    CreditController,
    ServiceCategoryController,
    ProductCategoryController,
    DiscountController,
    WarehouseController,
    CouponController,
  ],
  providers: [
    CashierService,
    CreditService,
    ServiceCategoryService,
    ProductCategoryService,
    DiscountService,
    WarehouseService,
    CouponService,
  ],
  exports: [
    CashierService,
    CreditService,
    TypeOrmModule,
  ],
})
export class CashierModule {}
