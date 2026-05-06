import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSettingsController } from './controllers/data-settings.controller';
import { DataSettingsService } from './services/data-settings.service';
import { Store } from './entities/store.entity';
import { Department } from './entities/department.entity';
import { Position } from './entities/position.entity';
import { ProductUnit } from './entities/product-unit.entity';
import { ProductSpec } from './entities/product-spec.entity';
import { PriceStrategy } from './entities/price-strategy.entity';
import { Warehouse } from './entities/warehouse.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Store,
      Department,
      Position,
      ProductUnit,
      ProductSpec,
      PriceStrategy,
      Warehouse,
    ]),
  ],
  controllers: [DataSettingsController],
  providers: [DataSettingsService],
  exports: [DataSettingsService],
})
export class DataSettingsModule {}
