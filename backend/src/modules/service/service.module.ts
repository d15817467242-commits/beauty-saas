import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServiceService } from './service.service';
import { ServiceController } from './service.controller';
import { Service } from './service.entity';
import { ServiceCategoryEntity } from './service-category.entity';
import { ServicePackage } from './service-package.entity';
import { PackageItem } from './package-item.entity';
import { ServiceReview } from './service-review.entity';
import { ServiceCategoryService } from './service-category.service';
import { ServiceCategoryController } from './service-category.controller';
import { ServicePackageService } from './service-package.service';
import { ServicePackageController, PackageAliasController } from './service-package.controller';
import { ServiceReviewService } from './service-review.service';
import { ServiceReviewController, ReviewAliasController } from './service-review.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Service,
      ServiceCategoryEntity,
      ServicePackage,
      PackageItem,
      ServiceReview,
    ]),
  ],
  controllers: [
    ServiceController,
    ServiceCategoryController,
    ServicePackageController,
    PackageAliasController,
    ServiceReviewController,
    ReviewAliasController,
  ],
  providers: [
    ServiceService,
    ServiceCategoryService,
    ServicePackageService,
    ServiceReviewService,
  ],
  exports: [
    ServiceService,
    ServiceCategoryService,
    ServicePackageService,
    ServiceReviewService,
  ],
})
export class ServiceModule {}
