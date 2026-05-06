import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ServiceService } from './service.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ServiceCategory } from './service.entity';

@Controller('services')
export class ServiceController {
  constructor(private readonly serviceService: ServiceService) {}

  @Post()
  create(@Body() createServiceDto: CreateServiceDto) {
    return this.serviceService.create(createServiceDto);
  }

  @Get()
  findAll(
    @Query('category') category?: ServiceCategory,
    @Query('isActive') isActive?: string,
    @Query('categoryId') categoryId?: string,
    @Query('keyword') keyword?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.serviceService.findAll(
      category,
      isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      categoryId,
      keyword,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.serviceService.findOne(id);
  }

  @Get('code/:code')
  findByCode(@Param('code') code: string) {
    return this.serviceService.findByCode(code);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateServiceDto: UpdateServiceDto) {
    return this.serviceService.update(id, updateServiceDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.serviceService.remove(id);
  }

  @Patch(':id/sort')
  updateSort(
    @Param('id') id: string,
    @Body('sort', ParseIntPipe) sort: number,
  ) {
    return this.serviceService.updateSort(id, sort);
  }

  @Patch(':id/toggle-active')
  toggleActive(@Param('id') id: string) {
    return this.serviceService.toggleActive(id);
  }

  // 批量导入
  @Post('batch/import')
  batchImport(@Body('services') services: CreateServiceDto[]) {
    return this.serviceService.batchImport(services);
  }

  // 批量导出
  @Post('batch/export')
  batchExport(
    @Body('ids') ids?: string[],
    @Query('category') category?: ServiceCategory,
    @Query('isActive') isActive?: string,
    @Query('categoryId') categoryId?: string,
  ) {
    return this.serviceService.batchExport(
      category,
      isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      categoryId,
      ids,
    );
  }

  // 批量更新状态
  @Patch('batch/active')
  batchUpdateActive(
    @Body('ids') ids: string[],
    @Body('isActive') isActive: boolean,
  ) {
    return this.serviceService.batchUpdateActive(ids, isActive);
  }

  // 批量删除
  @Delete('batch')
  batchRemove(@Body('ids') ids: string[]) {
    return this.serviceService.batchRemove(ids);
  }

  // 批量更新分类
  @Patch('batch/category')
  batchUpdateCategory(
    @Body('ids') ids: string[],
    @Body('categoryId') categoryId: string,
  ) {
    return this.serviceService.batchUpdateCategory(ids, categoryId);
  }

  // 获取所有编码
  @Get('codes/all')
  getAllCodes() {
    return this.serviceService.getAllCodes();
  }
}
