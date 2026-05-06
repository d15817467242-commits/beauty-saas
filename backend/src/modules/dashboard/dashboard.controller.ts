import { Controller, Get, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { 
  OverviewQueryDto, 
  RealtimeQueryDto, 
  TrendQueryDto, 
  RankingQueryDto, 
  MapQueryDto 
} from './dto/dashboard.dto';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  // ========== 大屏概览 ==========
  
  @Get('overview')
  getOverview(@Query() query: OverviewQueryDto) {
    return this.dashboardService.getOverview(query);
  }

  // ========== 实时数据 ==========
  
  @Get('realtime')
  getRealtime(@Query() query: RealtimeQueryDto) {
    return this.dashboardService.getRealtime(query);
  }

  // ========== 趋势数据 ==========
  
  @Get('trend')
  getTrend(@Query() query: TrendQueryDto) {
    return this.dashboardService.getTrend(query);
  }

  // ========== 排行榜 ==========
  
  @Get('ranking')
  getRanking(@Query() query: RankingQueryDto) {
    return this.dashboardService.getRanking(query);
  }

  // ========== 地图数据 ==========
  
  @Get('map')
  getMap(@Query() query: MapQueryDto) {
    return this.dashboardService.getMap(query);
  }
}
