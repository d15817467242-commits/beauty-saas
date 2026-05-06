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

// 新增实体
import { ServiceCategory } from './entities/service-category.entity';
import { ProductCategory } from './entities/product-category.entity';
import { Discount } from './entities/discount.entity';
import { Warehouse } from './entities/warehouse.entity';
import { CouponVerification } from './entities/coupon-verification.entity';
import { Product } from './entities/product.entity';
import { Document } from './entities/document.entity';

// 新增服务
import { ServiceCategoryService } from './services/service-category.service';
import { ProductCategoryService } from './services/product-category.service';
import { DiscountService } from './services/discount.service';
import { WarehouseService } from './services/warehouse.service';
import { CouponService } from './services/coupon.service';

// 新增控制器
import { 
  ServiceCategoryController, 
  ProductCategoryController,
  DiscountController,
  WarehouseController,
  CouponController,
} from './category.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Consumption, 
      Credit, 
      CreditPayment,
      // 新增实体
      ServiceCategory,
      ProductCategory,
      Discount,
      Warehouse,
      CouponVerification,
      Product,
      Document,
    ]),
    MemberModule,
    EmployeeModule,
    ServiceModule,
  ],
  controllers: [
    CashierController, 
    CreditController,
    // 新增控制器
    ServiceCategoryController,
    ProductCategoryController,
    DiscountController,
    WarehouseController,
    CouponController,
  ],
  providers: [
    CashierService, 
    CreditService,
    // 新增服务
    ServiceCategoryService,
    ProductCategoryService,
    DiscountService,
    WarehouseService,
    CouponService,
    DiscountService, // 为 CashierService 提供
  ],
  exports: [
    CashierService, 
    CreditService,
    // 新增服务导出
    ServiceCategoryService,
    ProductCategoryService,
    DiscountService,
    WarehouseService,
    CouponService,
  ],
})
export class CashierModule {}
