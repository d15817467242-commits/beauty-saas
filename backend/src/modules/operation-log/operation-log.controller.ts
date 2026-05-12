import { Controller, Get, Post, Delete, Body, Param, Query } from '@nestjs/common';
import { OperationLogService } from './operation-log.service';
import { OperationType } from './operation-log.entity';
import { CreateOperationLogDto, QueryOperationLogDto } from './dto/operation-log.dto';

@Controller('operation-logs')
export class OperationLogController {
  constructor(private readonly logService: OperationLogService) {}

  @Post()
  async create(@Body() dto: CreateOperationLogDto) {
    return this.logService.create(dto);
  }

  @Post('batch')
  async createMany(@Body() dtos: CreateOperationLogDto[]) {
    return this.logService.createMany(dtos);
  }

  @Get()
  async query(@Query() query: QueryOperationLogDto) {
    return this.logService.query(query);
  }

  @Get('recent')
  async getRecent(@Query('limit') limit?: number) {
    return this.logService.getRecent(limit);
  }

  @Get('stats')
  async getStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    return this.logService.getStats(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );
  }

  @Get('module/:module/stats')
  async getModuleStats(
    @Param('module') module: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    return this.logService.getModuleStats(
      module,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );
  }

  @Get('user/:userId')
  async getByUser(@Param('userId') userId: string, @Query('limit') limit?: number) {
    return this.logService.getByUser(userId, limit);
  }

  @Get('stats/user')
  async getUserStatsAll(@Query('userId') userId?: string) {
    if (userId) {
      return this.logService.getUserStats(userId);
    }
    return this.logService.getStats();
  }

  @Get('user/:userId/stats')
  async getUserStats(
    @Param('userId') userId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    return this.logService.getUserStats(
      userId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    return this.logService.get(id);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    await this.logService.delete(id);
    return { success: true };
  }

  @Post('batch-delete')
  async deleteMany(@Body() body: { ids: string[] }) {
    await this.logService.deleteMany(body.ids);
    return { success: true };
  }

  @Post('clean')
  async cleanOldLogs(@Body() body: { daysToKeep?: number }) {
    const deleted = await this.logService.cleanOldLogs(body.daysToKeep || 90);
    return { success: true, deleted };
  }

  // ========== 导出接口 ==========

  @Post('export/json')
  async exportToJson(@Body() query: QueryOperationLogDto) {
    const filepath = await this.logService.exportToJson(query);
    return { success: true, filepath };
  }

  @Post('export/csv')
  async exportToCsv(@Body() query: QueryOperationLogDto) {
    const filepath = await this.logService.exportToCsv(query);
    return { success: true, filepath };
  }

  @Post('export/excel')
  async exportToExcel(@Body() query: QueryOperationLogDto) {
    const filepath = await this.logService.exportToExcel(query);
    return { success: true, filepath };
  }

  @Get('export/files')
  async getExportFiles() {
    return this.logService.getExportFiles();
  }

  @Get('export/files/:filename')
  async getExportFileContent(@Param('filename') filename: string) {
    const content = await this.logService.getExportFileContent(filename);
    return { content };
  }

  @Delete('export/files/:filename')
  async deleteExportFile(@Param('filename') filename: string) {
    await this.logService.deleteExportFile(filename);
    return { success: true };
  }
}
