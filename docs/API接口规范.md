# 美业SaaS API接口规范

## 一、数据模型定义

### 1. 收银模块
```typescript
// 服务分类
ServiceCategory { id, name, parentId, sort }

// 商品分类
ProductCategory { id, name, parentId, sort }

// 商品
Product { id, name, categoryId, unit, spec, price, costPrice, stock, warehouseId }

// 单据
Document { id, type, orderNo, memberId, totalAmount, payAmount, discount, payMethod, status, createdAt }

// 团购券
Voucher { id, code, platform, amount, status, usedAt, orderId }
```

### 2. 营收分析模块
```typescript
// 目标设置
Target { id, type, month, targetAmount, actualAmount }

// 日报
DailyReport { date, cashIncome, cardIncome, recharge, consumption, customerCount, newMember }

// 员工业绩
EmployeePerformance { employeeId, date, serviceAmount, productAmount, commission }
```

### 3. 库存模块
```typescript
// 入库单
StockIn { id, orderNo, supplierId, warehouseId, items[], totalAmount, status }

// 出库单
StockOut { id, orderNo, warehouseId, items[], totalAmount, status }

// 盘点单
StockCheck { id, orderNo, warehouseId, items[], status }

// 调拨单
StockTransfer { id, orderNo, fromWarehouseId, toWarehouseId, items[], status }

// 供应商
Supplier { id, name, contact, phone, address }
```

### 4. 参数设置模块
```typescript
// 用户组
UserGroup { id, name, permissions[] }

// 系统参数
SystemParam { id, category, key, value, description }
```

### 5. 店内收支模块
```typescript
// 收支记录
StoreExpense { id, type, category, amount, description, createdAt }

// 收支分类
ExpenseCategory { id, type, name }
```

## 二、API接口定义

### 收银模块 API
```
POST   /api/cashier/open-card        # 收银台开卡
GET    /api/documents                 # 单据查询
POST   /api/documents/merge           # 合单
POST   /api/voucher/verify            # 核销验券
GET    /api/service-category          # 服务分类列表
GET    /api/product-category          # 商品分类列表
GET    /api/products                  # 商品列表
```

### 营收分析 API
```
GET    /api/report/target             # 目标概览
GET    /api/report/summary            # 营收汇总
GET    /api/report/overview           # 经营总览
GET    /api/report/labor              # 劳动业绩
GET    /api/report/asset              # 资产报表
GET    /api/report/discount           # 优惠统计
GET    /api/report/customer           # 客情分析
GET    /api/report/trend              # 营收趋势
GET    /api/report/profit             # 营收利润
GET    /api/report/bank               # 银行对账单
GET    /api/report/employee-business  # 员工业务分析
GET    /api/report/item-analysis      # 品项分析
GET    /api/report/customer-consumption  # 顾客消费汇总
GET    /api/report/customer-detail    # 顾客消费明细
GET    /api/report/recharge-detail    # 充值明细
GET    /api/report/card-sales         # 次卡销售明细
GET    /api/report/card-consumption   # 次卡消费明细
GET    /api/report/employee-commission # 员工提成汇总
GET    /api/report/salary             # 工资统计
GET    /api/report/member-card-change # 会员卡变更
GET    /api/report/member-balance     # 会员余额统计
GET    /api/report/member-card        # 会员次卡统计
GET    /api/report/point-change       # 积分变更
GET    /api/report/cash-reconciliation # 现金对账
GET    /api/report/traffic            # 客流统计
```

### 库存模块 API
```
POST   /api/stock/in                  # 入库开单
GET    /api/stock/in                  # 入库单列表
POST   /api/stock/out                 # 出库开单
GET    /api/stock/out                 # 出库单列表
POST   /api/stock/check               # 库存盘点
GET    /api/stock/check               # 盘点单列表
POST   /api/stock/transfer            # 商品调拨
GET    /api/stock/transfer            # 调拨单列表
GET    /api/stock/documents           # 库存单据查询
GET    /api/stock/report/remaining    # 库存剩余统计
GET    /api/stock/report/in           # 入库统计
GET    /api/stock/report/out          # 出库统计
GET    /api/stock/report/profit       # 出库毛利
GET    /api/suppliers                 # 供应商列表
POST   /api/suppliers                 # 新增供应商
```

### 参数设置 API
```
GET    /api/user-group                # 用户组列表
POST   /api/user-group                # 新增用户组
PUT    /api/user-group/:id            # 更新用户组
DELETE /api/user-group/:id            # 删除用户组
GET    /api/param/:category           # 获取参数
PUT    /api/param/:category           # 更新参数
```

### 店内收支 API
```
POST   /api/expense                   # 收支开单
GET    /api/expense                   # 收支记录
GET    /api/expense/documents         # 收支单据
GET    /api/expense/category          # 收支分类
POST   /api/expense/category          # 新增分类
```

### 数据设置 API
```
GET    /api/store                     # 门店信息
PUT    /api/store                     # 更新门店
GET    /api/department                # 部门列表
POST   /api/department                # 新增部门
GET    /api/position                  # 职位列表
POST   /api/position                  # 新增职位
GET    /api/warehouse                 # 仓库列表
POST   /api/warehouse                 # 新增仓库
GET    /api/price-strategy            # 价格策略
PUT    /api/price-strategy            # 更新策略
```

## 三、前端页面路由

```
/cashier/documents        # 单据查询
/report/analysis          # 营收分析（多标签）
/stock/in                 # 入库开单
/stock/out                # 出库开单
/stock/check              # 库存盘点
/stock/transfer           # 商品调拨
/stock/report             # 库存报表
/expense                  # 店内收支
/settings/data            # 数据设置
/settings/param           # 参数设置
```

---

*接口规范版本: v1.0*
*更新时间: 2026-04-13 19:04*
