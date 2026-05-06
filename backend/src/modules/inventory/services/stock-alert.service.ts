import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, LessThan } from 'typeorm';
import { StockAlert, StockAlertRule, AlertType, AlertStatus } from '../entities/stock-alert.entity';
import { ProductStock } from '../product.entity';
import {
  CreateStockAlertRuleDto,
  UpdateStockAlertRuleDto,
  HandleStockAlertDto,
  QueryStockAlertDto,
} from '../dto/stock-alert.dto';

@Injectable()
export class StockAlertService {
  constructor(
    @InjectRepository(StockAlert)
    private stockAlertRepository: Repository<StockAlert>,
    @InjectRepository(StockAlertRule)
    private stockAlertRuleRepository: Repository<StockAlertRule>,
    @InjectRepository(ProductStock)
    private productStockRepository: Repository<ProductStock>,
  ) {}

  // ==================== 预警规则管理 ====================

  // 创建预警规则
  async createRule(dto: CreateStockAlertRuleDto): Promise<StockAlertRule> {
    const rule = this.stockAlertRuleRepository.create(dto);
    return this.stockAlertRuleRepository.save(rule);
  }

  // 获取预警规则列表
  async findAllRules(): Promise<StockAlertRule[]> {
    return this.stockAlertRuleRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  // 获取单个预警规则
  async findOneRule(id: string): Promise<StockAlertRule> {
    const rule = await this.stockAlertRuleRepository.findOne({
      where: { id },
    });
    if (!rule) {
      throw new NotFoundException('预警规则不存在');
    }
    return rule;
  }

  // 更新预警规则
  async updateRule(id: string, dto: UpdateStockAlertRuleDto): Promise<StockAlertRule> {
    const rule = await this.findOneRule(id);
    Object.assign(rule, dto);
    return this.stockAlertRuleRepository.save(rule);
  }

  // 删除预警规则
  async removeRule(id: string): Promise<void> {
    const rule = await this.findOneRule(id);
    await this.stockAlertRuleRepository.delete(rule.id);
  }

  // ==================== 预警记录管理 ====================

  // 获取预警列表
  async findAll(query?: QueryStockAlertDto): Promise<StockAlert[]> {
    const where: any = {};
    if (query?.alertType) {
      where.alertType = query.alertType;
    }
    if (query?.status) {
      where.status = query.status;
    }
    if (query?.productId) {
      where.productId = query.productId;
    }

    return this.stockAlertRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  // 处理预警
  async handle(id: string, dto: HandleStockAlertDto, userId: string): Promise<StockAlert> {
    const alert = await this.stockAlertRepository.findOne({
      where: { id },
    });
    if (!alert) {
      throw new NotFoundException('预警记录不存在');
    }

    alert.status = AlertStatus.HANDLED;
    alert.handledAt = new Date();
    alert.handledBy = userId;
    if (dto.handleRemark !== undefined) {
      alert.handleRemark = dto.handleRemark;
    }

    return this.stockAlertRepository.save(alert);
  }

  // 忽略预警
  async ignore(id: string, userId: string): Promise<StockAlert> {
    const alert = await this.stockAlertRepository.findOne({
      where: { id },
    });
    if (!alert) {
      throw new NotFoundException('预警记录不存在');
    }

    alert.status = AlertStatus.IGNORED;
    alert.handledAt = new Date();
    alert.handledBy = userId;

    return this.stockAlertRepository.save(alert);
  }

  // ==================== 预警触发 ====================

  // 触发预警检查
  async triggerCheck(productId?: string): Promise<StockAlert[]> {
    const alerts: StockAlert[] = [];

    // 获取所有启用的规则
    const rules = await this.stockAlertRuleRepository.find({
      where: { isActive: true },
    });

    // 获取库存数据
    const stockWhere: any = {};
    if (productId) {
      stockWhere.productId = productId;
    }

    const stocks = await this.productStockRepository.find({
      where: stockWhere,
      relations: ['product'],
    });

    for (const stock of stocks) {
      for (const rule of rules) {
        // 检查分类过滤
        if (rule.category && stock.product?.category !== rule.category) {
          continue;
        }

        let shouldAlert = false;
        let message = '';

        switch (rule.alertType) {
          case AlertType.LOW_STOCK:
            if (stock.quantity <= (rule.thresholdValue || stock.warningQuantity)) {
              shouldAlert = true;
              message = `库存不足: 当前库存${stock.quantity}, 预警阈值${rule.thresholdValue || stock.warningQuantity}`;
            }
            break;

          case AlertType.OVER_STOCK:
            if (stock.quantity >= (rule.thresholdValue || stock.maxQuantity)) {
              shouldAlert = true;
              message = `库存过剩: 当前库存${stock.quantity}, 上限阈值${rule.thresholdValue || stock.maxQuantity}`;
            }
            break;
        }

        if (shouldAlert) {
          // 检查是否已有待处理的预警
          const existingAlert = await this.stockAlertRepository.findOne({
            where: {
              productId: stock.productId,
              alertType: rule.alertType,
              status: AlertStatus.PENDING,
            },
          });

          if (!existingAlert) {
            const alert = this.stockAlertRepository.create({
              ruleId: rule.id,
              alertType: rule.alertType,
              productId: stock.productId,
              currentQuantity: stock.quantity,
              thresholdValue: rule.thresholdValue || stock.warningQuantity,
              message,
            });
            const savedAlert = await this.stockAlertRepository.save(alert);
            alerts.push(savedAlert);
          }
        }
      }
    }

    return alerts;
  }

  // 手动创建预警
  async createAlert(
    productId: string,
    alertType: AlertType,
    currentQuantity: number,
    thresholdValue: number,
    message?: string,
  ): Promise<StockAlert> {
    const alert = this.stockAlertRepository.create({
      alertType,
      productId,
      currentQuantity,
      thresholdValue,
      message,
    });
    return this.stockAlertRepository.save(alert);
  }
}
