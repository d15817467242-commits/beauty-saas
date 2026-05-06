# 收银增强后端API文档

## 新增实体

### 1. ServiceCategory (服务分类表)
- `id`: UUID主键
- `name`: 分类名称
- `categoryCode`: 分类编码
- `description`: 分类描述
- `parentId`: 父分类ID (支持多级分类)
- `sort`: 排序序号
- `isActive`: 是否启用
- `icon`: 图标
- `remark`: 备注

### 2. ProductCategory (商品分类表)
- `id`: UUID主键
- `name`: 分类名称
- `categoryCode`: 分类编码
- `description`: 分类描述
- `parentId`: 父分类ID (支持多级分类)
- `sort`: 排序序号
- `isActive`: 是否启用
- `icon`: 图标
- `remark`: 备注

### 3. Discount (折扣设置表)
- `id`: UUID主键
- `name`: 折扣名称
- `discountCode`: 折扣码
- `discountType`: 折扣类型 (percentage/fixed)
- `discountValue`: 折扣值
- `discountScope`: 适用范围 (all/service/product/category)
- `scopeIds`: 适用范围ID列表
- `minAmount`: 最低消费金额
- `maxDiscount`: 最大优惠金额
- `startTime`: 生效开始时间
- `endTime`: 生效结束时间
- `usageLimit`: 使用次数限制
- `usedCount`: 已使用次数
- `perUserLimit`: 每用户限用次数
- `isActive`: 是否启用

### 4. Warehouse (仓库表)
- `id`: UUID主键
- `name`: 仓库名称
- `warehouseCode`: 仓库编码
- `address`: 仓库地址
- `contact`: 联系人
- `phone`: 联系电话
- `areaSize`: 面积
- `location`: 仓库位置
- `isDefault`: 是否默认仓库
- `isActive`: 是否启用

### 5. CouponVerification (团购券核销表)
- `id`: UUID主键
- `couponCode`: 团购券码
- `couponSource`: 券来源平台 (meituan/douyin/other)
- `couponName`: 团购项目名称
- `couponValue`: 券面值
- `paidAmount`: 用户实付金额
- `status`: 核销状态 (pending/verified/expired/cancelled)
- `memberId`: 关联会员ID
- `verifyTime`: 核销时间
- `verifyBy`: 核销人ID
- `consumptionId`: 关联消费记录ID
- `expireTime`: 券过期时间

### 6. Consumption 增强
新增字段:
- `manualOrderNo`: 手工单号
- `warehouseId`: 仓库ID

---

## API接口列表

### 服务分类 API
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/cashier/service-categories | 创建服务分类 |
| GET | /api/cashier/service-categories | 获取所有服务分类 |
| GET | /api/cashier/service-categories/tree | 获取分类树形结构 |
| GET | /api/cashier/service-categories/:id | 获取单个分类 |
| PUT | /api/cashier/service-categories/:id | 更新分类 |
| DELETE | /api/cashier/service-categories/:id | 删除分类 |

### 商品分类 API
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/cashier/product-categories | 创建商品分类 |
| GET | /api/cashier/product-categories | 获取所有商品分类 |
| GET | /api/cashier/product-categories/tree | 获取分类树形结构 |
| GET | /api/cashier/product-categories/:id | 获取单个分类 |
| PUT | /api/cashier/product-categories/:id | 更新分类 |
| DELETE | /api/cashier/product-categories/:id | 删除分类 |

### 折扣 API
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/cashier/discounts | 创建折扣 |
| GET | /api/cashier/discounts | 获取所有折扣 |
| GET | /api/cashier/discounts/active | 获取有效折扣 |
| GET | /api/cashier/discounts/:id | 获取单个折扣 |
| GET | /api/cashier/discounts/code/:code | 按折扣码查询 |
| PUT | /api/cashier/discounts/:id | 更新折扣 |
| DELETE | /api/cashier/discounts/:id | 删除折扣 |
| POST | /api/cashier/discounts/apply | 验证并应用折扣 |

### 仓库 API
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/cashier/warehouses | 创建仓库 |
| GET | /api/cashier/warehouses | 获取所有仓库 |
| GET | /api/cashier/warehouses/active | 获取启用的仓库 |
| GET | /api/cashier/warehouses/default | 获取默认仓库 |
| GET | /api/cashier/warehouses/:id | 获取单个仓库 |
| PUT | /api/cashier/warehouses/:id | 更新仓库 |
| PUT | /api/cashier/warehouses/:id/default | 设置为默认仓库 |
| DELETE | /api/cashier/warehouses/:id | 删除仓库 |

### 团购券核销 API
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/cashier/coupons | 创建团购券 |
| GET | /api/cashier/coupons | 获取所有团购券 |
| GET | /api/cashier/coupons/stats | 获取核销统计 |
| GET | /api/cashier/coupons/:id | 获取单个券 |
| GET | /api/cashier/coupons/code/:code | 按券码查询 |
| POST | /api/cashier/coupons/verify | 核销验券 |
| POST | /api/cashier/coupons/cancel | 取消券 |
| GET | /api/cashier/coupons/member/:memberId | 查询会员的券 |

### 收银增强 API
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/cashier/merge | 合并多个订单 |
| GET | /api/cashier/documents | 单据查询(支持分页、筛选) |
| POST | /api/cashier/open-card | 开卡入口(创建会员+充值) |
| GET | /api/cashier/order/:orderNo | 获取订单详情 |
| POST | /api/cashier/order/:orderNo/cancel | 取消订单 |

---

## 请求示例

### 合单请求
```json
POST /api/cashier/merge
{
  "orderIds": ["uuid1", "uuid2", "uuid3"],
  "memberId": "member-uuid",
  "paymentMethod": "wechat",
  "remark": "合并订单备注"
}
```

### 单据查询
```
GET /api/cashier/documents?type=service&startDate=2024-01-01&endDate=2024-01-31&memberId=xxx&page=1&pageSize=20
```

### 开卡请求
```json
POST /api/cashier/open-card
{
  "name": "张三",
  "phone": "13800138000",
  "initialBalance": 1000,
  "rechargeAmount": 500,
  "paymentMethod": "wechat",
  "employeeId": "employee-uuid",
  "remark": "新会员开卡"
}
```

### 核销验券
```json
POST /api/cashier/coupons/verify
{
  "couponCode": "MT123456789",
  "couponSource": "meituan",
  "memberId": "member-uuid",
  "remark": "核销备注"
}
```

### 应用折扣
```json
POST /api/cashier/discounts/apply
{
  "discountCode": "DISCOUNT20",
  "memberId": "member-uuid",
  "amount": 100,
  "itemIds": ["service-id-1", "service-id-2"]
}
```

---

## 文件结构

```
src/modules/cashier/
├── entities/
│   ├── service-category.entity.ts
│   ├── product-category.entity.ts
│   ├── discount.entity.ts
│   ├── warehouse.entity.ts
│   └── coupon-verification.entity.ts
├── services/
│   ├── service-category.service.ts
│   ├── product-category.service.ts
│   ├── discount.service.ts
│   ├── warehouse.service.ts
│   └── coupon.service.ts
├── dto/
│   ├── service-category.dto.ts
│   ├── product-category.dto.ts
│   ├── discount.dto.ts
│   ├── warehouse.dto.ts
│   ├── coupon.dto.ts
│   └── cashier.dto.ts
├── cashier.module.ts
├── cashier.service.ts
├── cashier.controller.ts
├── category.controller.ts
├── consumption.entity.ts
├── credit.entity.ts
├── credit.service.ts
├── credit.controller.ts
└── index.ts
```
