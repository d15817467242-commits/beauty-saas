import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
// Entities
import {
  StockIn,
  StockInItem,
  StockOut,
  StockOutItem,
  StockCheck,
  StockCheckItem,
  StockTransfer,
  StockTransferItem,
  Supplier,
  StockMovement,
} from './entities';
// Services
import {
  StockInService,
  StockOutService,
  StockCheckService,
  StockTransferService,
  SupplierService,
  StockReportService,
  StockDocumentService,
} from './services';
// Controllers
import {
  StockInController,
  StockOutController,
  StockCheckController,
  StockTransferController,
  SupplierController,
  StockReportController,
  StockDocumentController,
} from './controllers';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      StockIn,
      StockInItem,
      StockOut,
      StockOutItem,
      StockCheck,
      StockCheckItem,
      StockTransfer,
      StockTransferItem,
      Supplier,
      StockMovement,
    ]),
  ],
  controllers: [
    StockInController,
    StockOutController,
    StockCheckController,
    StockTransferController,
    SupplierController,
    StockReportController,
    StockDocumentController,
  ],
  providers: [
    StockInService,
    StockOutService,
    StockCheckService,
    StockTransferService,
    SupplierService,
    StockReportService,
    StockDocumentService,
  ],
  exports: [
    StockInService,
    StockOutService,
    StockCheckService,
    StockTransferService,
    SupplierService,
    StockReportService,
    StockDocumentService,
  ],
})
export class StockModule {}
