import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
// 原有entities
import { Product, ProductStock, StockMovement, StockWarning } from './product.entity';
import { Consumable, ServiceConsumable, ConsumableMovement } from './consumable.entity';
// 新增entities
import { StockTake, StockTakeItem } from './entities/stock-take.entity';
import { StockAlert, StockAlertRule } from './entities/stock-alert.entity';
import { StockTransfer, StockTransferItem } from './entities/stock-transfer.entity';
import { Supplier } from './entities/supplier.entity';
import { PurchaseOrder, PurchaseOrderItem } from './entities/purchase.entity';
import { StockCost, ProductCostSummary } from './entities/stock-cost.entity';
// 原有services
import { ProductService } from './product.service';
import { ConsumableService } from './consumable.service';
// 新增services
import { StockTakeService } from './services/stock-take.service';
import { StockAlertService } from './services/stock-alert.service';
import { StockTransferService } from './services/stock-transfer.service';
import { SupplierService } from './services/supplier.service';
import { PurchaseService } from './services/purchase.service';
import { StockCostService } from './services/stock-cost.service';
// 原有controller
import { InventoryController } from './inventory.controller';
// 新增controllers
import { StockTakeController } from './controllers/stock-take.controller';
import { StockAlertController } from './controllers/stock-alert.controller';
import { StockTransferController } from './controllers/stock-transfer.controller';
import { SupplierController } from './controllers/supplier.controller';
import { PurchaseController } from './controllers/purchase.controller';
import { StockCostController } from './controllers/stock-cost.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      // 原有entities
      Product,
      ProductStock,
      StockMovement,
      StockWarning,
      Consumable,
      ServiceConsumable,
      ConsumableMovement,
      // 新增entities - 库存盘点
      StockTake,
      StockTakeItem,
      // 新增entities - 库存预警
      StockAlert,
      StockAlertRule,
      // 新增entities - 库存调拨
      StockTransfer,
      StockTransferItem,
      // 新增entities - 供应商
      Supplier,
      // 新增entities - 采购
      PurchaseOrder,
      PurchaseOrderItem,
      // 新增entities - 成本核算
      StockCost,
      ProductCostSummary,
    ]),
  ],
  controllers: [
    // 原有controller
    InventoryController,
    // 新增controllers
    StockTakeController,
    StockAlertController,
    StockTransferController,
    SupplierController,
    PurchaseController,
    StockCostController,
  ],
  providers: [
    // 原有services
    ProductService,
    ConsumableService,
    // 新增services
    StockTakeService,
    StockAlertService,
    StockTransferService,
    SupplierService,
    PurchaseService,
    StockCostService,
  ],
  exports: [
    // 原有services
    ProductService,
    ConsumableService,
    // 新增services
    StockTakeService,
    StockAlertService,
    StockTransferService,
    SupplierService,
    PurchaseService,
    StockCostService,
  ],
})
export class InventoryModule {}
