# 营收分析 API 文档

## 概述

本文档描述了营收分析模块新增的API接口。

## API 端点

### 1. 目标管理

#### 创建销售目标
- **POST** `/api/report/target`
- **请求体**:
```json
{
  "name": "2024年1月销售目标",
  "periodType": "monthly",
  "targetAmount": 100000,
  "startDate": "2024-01-01",
  "endDate": "2024-01-31",
  "storeId": "可选-门店ID",
  "employeeId": "可选-员工ID（个人目标）",
  "metadata": {}
}
```

#### 获取销售目标列表
- **GET** `/api/report/target`
- **查询参数**:
  - `periodType`: 目标周期类型 (daily/weekly/monthly/yearly)
  - `startDate`: 开始日期
  - `endDate`: 结束日期
  - `storeId`: 门店ID
  - `employeeId`: 员工ID

#### 获取单个销售目标
- **GET** `/api/report/target/:id`

#### 删除销售目标
- **DELETE** `/api/report/target/:id`

---

### 2. 目标概览

- **GET** `/api/report/target-overview`
- **查询参数**: 同目标查询
- **返回**: 目标设置、完成度、进度、剩余天数、每日需完成金额

---

### 3. 营收汇总

- **GET** `/api/report/revenue-summary`
- **查询参数**:
  - `startDate`: 开始日期
  - `endDate`: 结束日期
  - `groupBy`: 分组方式 (day/week/month)
- **返回**: 日/周/月汇总数据，支持按时间范围查询

---

### 4. 经营总览

- **GET** `/api/report/business-overview`
- **查询参数**:
  - `date`: 查询日期（默认今天）
- **返回**:
  - 今日数据：营业额、客流量、客单价、会员消费占比
  - 本月数据：同上 + 环比增长率
  - 会员统计：总数、新增、活跃
  - 员工统计

---

### 5. 劳动业绩

- **GET** `/api/report/employee-performance-report`
- **查询参数**:
  - `startDate`: 开始日期
  - `endDate`: 结束日期
  - `employeeId`: 员工ID（可选，不传则返回所有员工）
- **返回**:
  - 服务次数
  - 业绩金额
  - 提成金额
  - 客单价
  - 按业绩排序

---

### 6. 服务项目分析

- **GET** `/api/report/service-analysis`
- **查询参数**:
  - `startDate`: 开始日期
  - `endDate`: 结束日期
  - `limit`: 返回数量（默认20）
  - `sortBy`: 排序方式 (sales/revenue)
- **返回**:
  - 销量排行
  - 收入排行
  - 分类统计

---

### 7. 会员分析

- **GET** `/api/report/member-analysis`
- **查询参数**:
  - `startDate`: 开始日期
  - `endDate`: 结束日期
  - `groupBy`: 分组方式 (day/week/month)
- **返回**:
  - 新增会员数
  - 活跃会员数
  - 消费分布
  - 等级分布

---

### 8. 时段分析

- **GET** `/api/report/time-analysis`
- **查询参数**:
  - `startDate`: 开始日期
  - `endDate`: 结束日期
  - `groupBy`: 分组方式 (hour/day/week)
- **返回**:
  - 高峰时段（Top 3）
  - 低谷时段（Bottom 3）
  - 各时段客流和营收数据

---

## 数据库变更

新增 `sales_targets` 表，用于存储销售目标：

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid | 主键 |
| name | varchar | 目标名称 |
| period_type | enum | 周期类型 |
| target_amount | decimal(12,2) | 目标金额 |
| start_date | date | 开始日期 |
| end_date | date | 结束日期 |
| store_id | uuid | 门店ID |
| employee_id | uuid | 员工ID |
| achieved_amount | decimal(12,2) | 已完成金额 |
| completion_rate | decimal(5,2) | 完成率 |
| metadata | json | 扩展数据 |
| created_by | uuid | 创建人 |
| created_at | timestamp | 创建时间 |
| updated_at | timestamp | 更新时间 |

---

## 文件结构

```
src/modules/report/
├── entities/
│   └── sales-target.entity.ts    # 销售目标实体
├── dto/
│   ├── report.dto.ts             # 原有DTO
│   └── sales-target.dto.ts       # 新增DTO
├── report.controller.ts          # 控制器（已更新）
├── report.service.ts             # 服务（已更新）
└── report.module.ts              # 模块（已更新）
```
