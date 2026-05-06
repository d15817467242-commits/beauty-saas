import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { PrintTemplate, PrintTemplateVariable, PrintTemplateType, PrintPaperSize, TemplateVariable } from './print-template.entity';
import { CreatePrintTemplateDto, UpdatePrintTemplateDto } from './dto/print-template.dto';

@Injectable()
export class PrintTemplateService {
  constructor(
    @InjectRepository(PrintTemplate)
    private templateRepository: Repository<PrintTemplate>,
    @InjectRepository(PrintTemplateVariable)
    private variableRepository: Repository<PrintTemplateVariable>,
  ) {}

  // ========== 模板管理 ==========

  // 创建模板
  async create(dto: CreatePrintTemplateDto): Promise<PrintTemplate> {
    const template = this.templateRepository.create({
      ...dto,
      paperSize: dto.paperSize as PrintPaperSize,
    });
    const saved = await this.templateRepository.save(template);
    
    // 创建变量
    if (dto.variables && dto.variables.length > 0) {
      await this.createVariables(saved.id, dto.variables);
    }
    
    return saved;
  }

  // 更新模板
  async update(id: string, dto: UpdatePrintTemplateDto): Promise<PrintTemplate> {
    const template = await this.templateRepository.findOne({ where: { id } });
    if (!template) {
      throw new NotFoundException('模板不存在');
    }
    Object.assign(template, dto);
    const saved = await this.templateRepository.save(template);
    
    // 更新变量
    if (dto.variables) {
      await this.variableRepository.delete({ templateId: id });
      if (dto.variables.length > 0) {
        await this.createVariables(id, dto.variables);
      }
    }
    
    return saved;
  }

  // 删除模板
  async delete(id: string): Promise<void> {
    const template = await this.templateRepository.findOne({ where: { id } });
    if (!template) {
      throw new NotFoundException('模板不存在');
    }
    await this.variableRepository.delete({ templateId: id });
    await this.templateRepository.remove(template);
  }

  // 获取模板详情
  async get(id: string): Promise<PrintTemplate> {
    const template = await this.templateRepository.findOne({ where: { id } });
    if (!template) {
      throw new NotFoundException('模板不存在');
    }
    return template;
  }

  // 获取模板详情（含变量）
  async getWithVariables(id: string): Promise<{ template: PrintTemplate; variables: PrintTemplateVariable[] }> {
    const template = await this.get(id);
    const variables = await this.variableRepository.find({ 
      where: { templateId: id },
      order: { sortOrder: 'ASC' }
    });
    return { template, variables };
  }

  // 获取模板列表
  async list(storeId?: string, type?: PrintTemplateType): Promise<PrintTemplate[]> {
    const queryBuilder = this.templateRepository.createQueryBuilder('template');
    
    if (storeId) {
      queryBuilder.where('template.storeId = :storeId OR template.storeId IS NULL', { storeId });
    }
    
    if (type) {
      queryBuilder.andWhere('template.type = :type', { type });
    }
    
    return queryBuilder
      .orderBy('template.sortOrder', 'ASC')
      .addOrderBy('template.createdAt', 'DESC')
      .getMany();
  }

  // 获取启用的模板
  async getActiveTemplates(storeId?: string, type?: PrintTemplateType): Promise<PrintTemplate[]> {
    const queryBuilder = this.templateRepository.createQueryBuilder('template')
      .where('template.isActive = :isActive', { isActive: true });
    
    if (storeId) {
      queryBuilder.andWhere('(template.storeId = :storeId OR template.storeId IS NULL)', { storeId });
    }
    
    if (type) {
      queryBuilder.andWhere('template.type = :type', { type });
    }
    
    return queryBuilder
      .orderBy('template.sortOrder', 'ASC')
      .getMany();
  }

  // 获取默认模板
  async getDefaultTemplate(type: PrintTemplateType, storeId?: string): Promise<PrintTemplate | null> {
    const queryBuilder = this.templateRepository.createQueryBuilder('template')
      .where('template.type = :type', { type })
      .andWhere('template.isDefault = :isDefault', { isDefault: true })
      .andWhere('template.isActive = :isActive', { isActive: true });
    
    if (storeId) {
      queryBuilder.andWhere('(template.storeId = :storeId OR template.storeId IS NULL)', { storeId });
    }
    
    return queryBuilder.orderBy('template.sortOrder', 'ASC').getOne();
  }

  // 设置默认模板
  async setDefault(id: string): Promise<void> {
    const template = await this.get(id);
    
    // 取消同类型其他模板的默认状态
    await this.templateRepository.update(
      { type: template.type, isDefault: true },
      { isDefault: false }
    );
    
    // 设置当前模板为默认
    template.isDefault = true;
    await this.templateRepository.save(template);
  }

  // ========== 变量管理 ==========

  // 创建变量
  private async createVariables(templateId: string, variables: TemplateVariable[]): Promise<void> {
    for (let i = 0; i < variables.length; i++) {
      const v = variables[i];
      const variable = this.variableRepository.create({
        templateId,
        name: v.name,
        label: v.label,
        type: v.type,
        defaultValue: v.defaultValue !== undefined ? String(v.defaultValue) : '',
        isRequired: v.required || false,
        description: v.description,
        format: v.format,
        sortOrder: i,
      });
      await this.variableRepository.save(variable);
    }
  }

  // 获取模板变量
  async getVariables(templateId: string): Promise<PrintTemplateVariable[]> {
    return this.variableRepository.find({ 
      where: { templateId },
      order: { sortOrder: 'ASC' }
    });
  }

  // 添加变量
  async addVariable(templateId: string, variable: TemplateVariable): Promise<PrintTemplateVariable> {
    const count = await this.variableRepository.count({ where: { templateId } });
    const entity = this.variableRepository.create({
      templateId,
      name: variable.name,
      label: variable.label,
      type: variable.type,
      defaultValue: variable.defaultValue !== undefined ? String(variable.defaultValue) : '',
      isRequired: variable.required || false,
      description: variable.description,
      format: variable.format,
      sortOrder: count,
    });
    return this.variableRepository.save(entity);
  }

  // 更新变量
  async updateVariable(id: string, variable: Partial<TemplateVariable>): Promise<PrintTemplateVariable> {
    const entity = await this.variableRepository.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException('变量不存在');
    }
    if (variable.name) entity.name = variable.name;
    if (variable.label) entity.label = variable.label;
    if (variable.type) entity.type = variable.type;
    if (variable.defaultValue !== undefined) entity.defaultValue = String(variable.defaultValue);
    if (variable.required !== undefined) entity.isRequired = variable.required;
    if (variable.description !== undefined) entity.description = variable.description;
    if (variable.format !== undefined) entity.format = variable.format;
    return this.variableRepository.save(entity);
  }

  // 删除变量
  async deleteVariable(id: string): Promise<void> {
    const entity = await this.variableRepository.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException('变量不存在');
    }
    await this.variableRepository.remove(entity);
  }

  // ========== 模板渲染 ==========

  // 渲染模板
  async render(id: string, data: Record<string, any>): Promise<{ content: string; style: string }> {
    const template = await this.get(id);
    
    // 简单的变量替换
    let content = template.content;
    for (const [key, value] of Object.entries(data)) {
      const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
      content = content.replace(regex, String(value ?? ''));
    }
    
    return {
      content,
      style: template.style || '',
    };
  }

  // ========== 统计 ==========

  // 获取模板统计
  async getStats(): Promise<any> {
    const total = await this.templateRepository.count();
    const active = await this.templateRepository.count({ where: { isActive: true } });
    const inactive = await this.templateRepository.count({ where: { isActive: false } });
    
    // 按类型统计
    const byType = await this.templateRepository
      .createQueryBuilder('template')
      .select('template.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .groupBy('template.type')
      .getRawMany();
    
    return { total, active, inactive, byType };
  }

  // 复制模板
  async copy(id: string, newName: string, newCode: string): Promise<PrintTemplate> {
    const { template, variables } = await this.getWithVariables(id);
    
    const newTemplate = this.templateRepository.create({
      ...template,
      id: undefined,
      name: newName,
      code: newCode,
      isDefault: false,
      createdAt: undefined,
      updatedAt: undefined,
    });
    const saved = await this.templateRepository.save(newTemplate);
    
    // 复制变量
    for (const v of variables) {
      await this.variableRepository.save({
        ...v,
        id: undefined,
        templateId: saved.id,
        createdAt: undefined,
        updatedAt: undefined,
      });
    }
    
    return saved;
  }
}
