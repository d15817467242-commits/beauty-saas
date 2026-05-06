# 库存管理增强后端API文档

## 概述

本次开发完成了库存管理增强模块，包含以下六大子系统：

1. **库存盘点系统** - StockTake
2. **库存预警系统** - StockAlert
3. **库存调拨系统** - StockTransfer
4. **供应商管理** - Supplier
5. **采购管理** - PurchaseOrder
6. **库存成本核算** - StockCost

---

## 1. 库存盘点系统 API

### 基础路径: `/inventory/stock-takes`

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | `/` | 创建盘点单 |
| GET | `/` | 获取盘点单列表 |
| GET | `/:id` | 获取单个盘点单 |
| POST | `/:id/start` | 开始盘点 |
| POST | `/:id/record` | 记录盘点数量 |
| POST | `/:id/complete` | 完成盘点 |
| POST | `/:id/process-difference` | 处理盘点差异 |
| POST | `/:id/cancel` | 取消盘点 |
| DELETE | `/:id` | 删除盘点单 |

### 主要Entity
- `StockTake` - 盘点单主表
- `StockTakeItem` - 盘点明细表

### 状态流转
```
DRAFT → IN_PROGRESS → COMPLETED
   ↓         ↓
CANCELLED  CANCELLED
```

---

## 2. 库存预警系统 API

### 基础路径: `/inventory`

#### 预警规则管理
| 方法 | 路径 | 描述 |
|------|------|------|
| POST | `/alert-rules` | 创建预警规则 |
| GET | `/alert-rules` | 获取预警规则列表 |
| GET | `/alert-rules/:id` | 获取单个预警规则 |
| PUT | `/alert-rules/:id` | 更新预警规则 |
| DELETE | `/alert-rules/:id` | 删除预警规则 |

#### 预警记录管理
| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/alerts` | 获取预警列表 |
| POST | `/alerts/:id/handle` | 处理预警 |
| POST | `/alerts/:id/ignore` | 忽略预警 |
| POST | `/alerts/trigger` | 手动触发预警检查 |

### 主要Entity
- `StockAlertRule` - 预警规则表
- `StockAlert` - 预警记录表

### 预警类型
- `LOW_STOCK` - 库存不足
- `OVER_STOCK` - 库存过剩
- `EXPIRATION` - 即将过期
- `SLOW_MOVING` - 滞销预警

---

## 3. 库存调拨系统 API

### 基础路径: `/inventory/transfers`

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | `/` | 创建调拨单 |
| GET | `/` | 获取调拨单列表 |
| GET | `/:id` | 获取单个调拨单 |
| PUT | `/:id` | 更新调拨单 |
| POST | `/:id/submit` | 提交审批 |
| POST | `/:id/approve` | 审批调拨单 |
| POST | `/:id/complete` | 完成调拨 |
| POST | `/:id/cancel` | 取消调拨 |
| DELETE | `/:id` | 删除调拨单 |

### 主要Entity
- `StockTransfer` - 调拨单主表
- `StockTransferItem` - 调拨明细表

### 状态流转
```
DRAFT → PENDING → APPROVED → COMPLETED
   ↓      ↓        ↓
CANCELLED CANCELLED CANCELLED
```

---

## 4. 供应商管理 API

### 基础路径: `/inventory/suppliers`

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | `/` | 创建供应商 |
| GET | `/` | 获取供应商列表 |
| GET | `/active` | 获取活跃供应商 |
| GET | `/:id` | 获取单个供应商 |
| PUT | `/:id` | 更新供应商 |
| PUT | `/:id/rating` | 更新供应商评分 |
| DELETE | `/:id` | 删除供应商(软删除) |
| DELETE | `/:id/hard` | 硬删除供应商 |

### 主要Entity
- `Supplier` - 供应商表

---

## 5. 采购管理 API

### 基础路径: `/inventory/purchases`

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | `/` | 创建采购单 |
| GET | `/` | 获取采购单列表 |
| GET | `/:id` | 获取单个采购单 |
| PUT | `/:id` | 更新采购单 |
| POST | `/:id/submit` | 提交审批 |
| POST | `/:id/approve` | 审批采购单 |
| POST | `/:id/place` | 下单 |
| POST | `/:id/receive` | 入库 |
| POST | `/:id/cancel` | 取消采购单 |
| DELETE | `/:id` | 删除采购单 |

### 主要Entity
- `PurchaseOrder` - 采购单主表
- `PurchaseOrderItem` - 采购明细表

### 状态流转
```
DRAFT → PENDING → APPROVED → ORDERED → COMPLETED
   ↓      ↓        ↓          ↓
CANCELLED CANCELLED CANCELLED CANCELLED
                                    ↓
                                 PARTIAL → COMPLETED
```

---

## 6. 库存成本核算 API

### 基础路径: `/inventory/costs`

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/history` | 获取成本历史 |
| GET | `/summary/:productId` | 获取产品成本汇总 |
| GET | `/summaries` | 获取所有产品成本汇总 |
| POST | `/calculate` | 计算成本 |
| PUT | `/update/:productId` | 手动更新产品成本 |
| GET | `/total-value` | 获取库存总价值 |

### 主要Entity
- `StockCost` - 成本变动记录表
- `ProductCostSummary` - 产品成本汇总表

### 成本计算方法
采用**移动加权平均法**计算库存成本：
```
新单位成本 = (原库存总成本 + 本次入库成本) / (原库存数量 + 本次入库数量)
```

---

## 文件结构

```
src/modules/inventory/
├── entities/
│   ├── stock-take.entity.ts      # 盘点单实体
│   ├── stock-alert.entity.ts     # 预警实体
│   ├── stock-transfer.entity.ts  # 调拨单实体
│   ├── supplier.entity.ts        # 供应商实体
│   ├── purchase.entity.ts        # 采购单实体
│   ├── stock-cost.entity.ts      # 成本核算实体
│   └── index.ts
├── dto/
│   ├── stock-take.dto.ts
│   ├── stock-alert.dto.ts
│   ├── stock-transfer.dto.ts
│   ├── supplier.dto.ts
│   ├── purchase.dto.ts
│   └── stock-cost.dto.ts
├── services/
│   ├── stock-take.service.ts
│   ├── stock-alert.service.ts
│   ├── stock-transfer.service.ts
│   ├── supplier.service.ts
│   ├── purchase.service.ts
│   ├── stock-cost.service.ts
│   └── index.ts
├── controllers/
│   ├── stock-take.controller.ts
│   ├── stock-alert.controller.ts
│   ├── stock-transfer.controller.ts
│   ├── supplier.controller.ts
│   ├── purchase.controller.ts
│   ├── stock-cost.controller.ts
│   └── index.ts
└── inventory.module.ts           # 模块注册
```

---

## 数据库表

| 表名 | 描述 |
|------|------|
| `stock_takes` | 盘点单主表 |
| `stock_take_items` | 盘点明细表 |
| `stock_alert_rules` | 预警规则表 |
| `stock_alerts` | 预警记录表 |
| `stock_transfers` | 调拨单主表 |
| `stock_transfer_items` | 调拨明细表 |
| `suppliers` | 供应商表 |
| `purchase_orders` | 采购单主表 |
| `purchase_order_items` | 采购明细表 |
| `stock_costs` | 成本变动记录表 |
| `product_cost_summaries` | 产品成本汇总表 |

---

## 技术栈

- **框架**: NestJS
- **ORM**: TypeORM
- **数据库**: MySQL/PostgreSQL
- **验证**: class-validator
- **事务**: DataSource transaction

---

## 开发完成时间

2026-04-13
