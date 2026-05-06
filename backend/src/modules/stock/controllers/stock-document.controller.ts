import { Controller, Get, Query } from '@nestjs/common';
import { StockDocumentService } from '../services/stock-document.service';

@Controller('stock/documents')
export class StockDocumentController {
  constructor(private readonly stockDocumentService: StockDocumentService) {}

  @Get()
  async getDocuments(@Query() query: {
    type?: string;
    orderNo?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    pageSize?: number;
  }) {
    return this.stockDocumentService.getDocuments(query);
  }
}
