import { Controller, Get, Query } from '@nestjs/common';
import { MarketingAnalysisService } from './marketing-analysis.service';

@Controller('marketing-analysis')
export class MarketingAnalysisController {
  constructor(private readonly analysisService: MarketingAnalysisService) {}

  @Get('metrics')
  async getMetrics(@Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    return this.analysisService.getEffectAnalysis(startDate, endDate);
  }

  @Get('funnel')
  async getFunnel(@Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    return this.analysisService.getConversionStats(startDate, endDate);
  }

  @Get('suggestions')
  async getSuggestions(@Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    const analysis = await this.analysisService.getEffectAnalysis(startDate, endDate);
    return { suggestions: [], analysis };
  }
}
