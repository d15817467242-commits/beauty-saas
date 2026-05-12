import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryController } from './inventory.controller';
import { PurchaseController } from './controllers/purchase.controller';
import { StockAlertController } from './controllers/stock-alert.controller';
import { StockCostController, StockCostAnalysisController } from './controllers/stock-cost.controller';
import { StockTakeController } from './controllers/stock-take.controller';
import { StockTransferController } from './controllers/stock-transfer.controller';
import { SupplierController } from './controllers/supplier.controller';
import { ProductService } from './product.service';
import { ConsumableService } from './consumable.service';
import { PurchaseService } from './services/purchase.service';
import { StockAlertService } from './services/stock-alert.service';
import { StockCostService } from './services/stock-cost.service';
import { StockTakeService } from './services/stock-take.service';
import { StockTransferService } from './services/stock-transfer.service';
import { SupplierService } from './services/supplier.service';
import { Product, ProductStock, ProductStockMovement, StockWarning } from './product.entity';
import { Consumable, ServiceConsumable, ConsumableMovement } from './consumable.entity';
import { PurchaseOrder, PurchaseOrderItem } from './entities/purchase.entity';
import { StockAlertRule, StockAlert } from './entities/stock-alert.entity';
import { StockCost, ProductCostSummary } from './entities/stock-cost.entity';
import { StockTake, StockTakeItem } from './entities/stock-take.entity';
import { StockTransfer, StockTransferItem } from './entities/stock-transfer.entity';
import { Supplier } from './entities/supplier.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product,
      ProductStock,
      ProductStockMovement,
      StockWarning,
      Consumable,
      ServiceConsumable,
      ConsumableMovement,
      PurchaseOrder,
      PurchaseOrderItem,
      StockAlertRule,
      StockAlert,
      StockCost,
      ProductCostSummary,
      StockTake,
      StockTakeItem,
      StockTransfer,
      StockTransferItem,
      Supplier,
    ]),
  ],
  controllers: [
    InventoryController,
    PurchaseController,
    StockAlertController,
    StockCostController,
    StockCostAnalysisController,
    StockTakeController,
    StockTransferController,
    SupplierController,
  ],
  providers: [
    ProductService,
    ConsumableService,
    PurchaseService,
    StockAlertService,
    StockCostService,
    StockTakeService,
    StockTransferService,
    SupplierService,
  ],
  exports: [
    ProductService,
    ConsumableService,
    PurchaseService,
    StockAlertService,
    StockCostService,
    StockTakeService,
    StockTransferService,
    SupplierService,
  ],
})
export class InventoryModule {}