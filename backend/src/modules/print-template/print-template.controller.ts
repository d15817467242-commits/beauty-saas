import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { PrintTemplateService } from './print-template.service';
import { PrintTemplateType, TemplateVariable } from './print-template.entity';
import { CreatePrintTemplateDto, UpdatePrintTemplateDto } from './dto/print-template.dto';

@Controller('print-templates')
export class PrintTemplateController {
  constructor(private readonly templateService: PrintTemplateService) {}

  // ========== 模板管理接口 ==========

  @Post()
  async create(@Body() dto: CreatePrintTemplateDto) {
    return this.templateService.create(dto);
  }

  @Get()
  async list(@Query('storeId') storeId?: string, @Query('type') type?: PrintTemplateType) {
    return this.templateService.list(storeId, type);
  }

  @Get('active')
  async getActiveTemplates(@Query('storeId') storeId?: string, @Query('type') type?: PrintTemplateType) {
    return this.templateService.getActiveTemplates(storeId, type);
  }

  @Get('stats')
  async getStats() {
    return this.templateService.getStats();
  }

  @Get('default')
  async getDefaultTemplate(@Query('type') type: PrintTemplateType, @Query('storeId') storeId?: string) {
    return this.templateService.getDefaultTemplate(type, storeId);
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    return this.templateService.get(id);
  }

  @Get(':id/detail')
  async getWithVariables(@Param('id') id: string) {
    return this.templateService.getWithVariables(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdatePrintTemplateDto) {
    return this.templateService.update(id, dto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    await this.templateService.delete(id);
    return { success: true };
  }

  @Post(':id/set-default')
  async setDefault(@Param('id') id: string) {
    await this.templateService.setDefault(id);
    return { success: true };
  }

  @Post(':id/copy')
  async copy(@Param('id') id: string, @Body() body: { name: string; code: string }) {
    return this.templateService.copy(id, body.name, body.code);
  }

  // ========== 变量管理接口 ==========

  @Get(':id/variables')
  async getVariables(@Param('id') id: string) {
    return this.templateService.getVariables(id);
  }

  @Post(':id/variables')
  async addVariable(@Param('id') id: string, @Body() variable: TemplateVariable) {
    return this.templateService.addVariable(id, variable);
  }

  @Put('variables/:variableId')
  async updateVariable(
    @Param('variableId') variableId: string,
    @Body() variable: Partial<TemplateVariable>
  ) {
    return this.templateService.updateVariable(variableId, variable);
  }

  @Delete('variables/:variableId')
  async deleteVariable(@Param('variableId') variableId: string) {
    await this.templateService.deleteVariable(variableId);
    return { success: true };
  }

  // ========== 模板渲染接口 ==========

  @Post(':id/render')
  async render(@Param('id') id: string, @Body() data: Record<string, any>) {
    return this.templateService.render(id, data);
  }
}
