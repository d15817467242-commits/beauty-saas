import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { StoreService } from './store.service';
import { CreateStoreDto, UpdateStoreDto, QueryStoreDto, StoreStatus } from './dto/store.dto';

@Controller('stores')
export class StoreController {
  constructor(private readonly storeService: StoreService) {}

  @Post()
  async create(@Body() dto: CreateStoreDto) {
    return this.storeService.create(dto);
  }

  @Get()
  async list(@Query() query: QueryStoreDto) {
    return this.storeService.list(query);
  }

  @Get('active')
  async getActiveStores() {
    return this.storeService.getActiveStores();
  }

  @Get('tree')
  async getTree() {
    return this.storeService.getTree();
  }

  @Get('stats')
  async getStats() {
    return this.storeService.getStats();
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    return this.storeService.get(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateStoreDto) {
    return this.storeService.update(id, dto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    await this.storeService.delete(id);
    return { success: true };
  }

  @Post('batch/status')
  async batchUpdateStatus(@Body() body: { ids: string[]; status: StoreStatus }) {
    await this.storeService.batchUpdateStatus(body.ids, body.status);
    return { success: true };
  }

  // 门店配置相关接口
  @Get(':id/configs')
  async getConfigs(@Param('id') id: string) {
    return this.storeService.getAllConfigs(id);
  }

  @Get(':id/configs/:key')
  async getConfig(@Param('id') id: string, @Param('key') key: string, @Query('default') defaultValue?: any) {
    return { key, value: await this.storeService.getConfig(id, key, defaultValue) };
  }

  @Post(':id/configs')
  async setConfig(
    @Param('id') id: string,
    @Body() body: { key: string; value: any; description?: string; type?: string }
  ) {
    return this.storeService.setConfig(id, body.key, body.value, body.description, body.type);
  }

  @Post(':id/configs/batch')
  async setConfigs(
    @Param('id') id: string,
    @Body() configs: Array<{ key: string; value: any; description?: string; type?: string }>
  ) {
    await this.storeService.setConfigs(id, configs);
    return { success: true };
  }

  @Delete(':id/configs/:key')
  async deleteConfig(@Param('id') id: string, @Param('key') key: string) {
    await this.storeService.deleteConfig(id, key);
    return { success: true };
  }
}
