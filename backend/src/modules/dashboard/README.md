# 数据统计大屏 API 文档

## 概述

数据统计大屏模块提供实时数据展示、趋势分析、排行榜等功能，支持 WebSocket 实时推送。

## API 接口

### 1. 大屏概览 API

**GET /api/dashboard/overview**

获取大屏概览数据，包括今日/本月/本年营业额、客流量、会员数等。

**请求参数：**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| storeId | string | 否 | 门店ID |
| date | string | 否 | 日期 (YYYY-MM-DD)，默认今天 |

**响应示例：**
```json
{
  "date": "2024-01-15",
  "today": {
    "revenue": 5680.00,
    "customerCount": 23,
    "avgTicket": 247.00,
    "memberRevenue": 4200.00,
    "memberRate": 73.94,
    "newMembers": 3,
    "pendingAppointments": 5
  },
  "month": {
    "revenue": 156800.00,
    "customerCount": 623,
    "avgTicket": 251.69,
    "memberRevenue": 125000.00,
    "memberRate": 79.72,
    "growthRate": 12.5,
    "newMembers": 45
  },
  "year": {
    "revenue": 1850000.00,
    "customerCount": 7500,
    "growthRate": 18.5
  },
  "member": {
    "total": 1250,
    "active": 856,
    "activeRate": 68.48
  },
  "employee": {
    "total": 15
  }
}
```

---

### 2. 实时数据 API

**GET /api/dashboard/realtime**

获取实时数据，包括当前在店人数、排队情况、最近订单等。

**请求参数：**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| storeId | string | 否 | 门店ID |

**响应示例：**
```json
{
  "timestamp": "2024-01-15T14:30:00.000Z",
  "currentInStore": 8,
  "queueLength": 3,
  "queueList": [
    {
      "id": "uuid",
      "memberName": "张三",
      "serviceName": "剪发",
      "employeeName": "李师傅",
      "time": "14:00"
    }
  ],
  "revenue": {
    "today": 5680.00,
    "currentHour": 1200.00
  },
  "customerCount": 23,
  "recentOrders": [
    {
      "id": "uuid",
      "orderNo": "ORD20240115001",
      "amount": 280.00,
      "memberName": "李女士",
      "employeeName": "王师傅",
      "paymentMethod": "wechat",
      "createdAt": "2024-01-15T14:25:00.000Z"
    }
  ],
  "employeeStatus": [
    {
      "id": "uuid",
      "name": "王师傅",
      "avatar": "url",
      "position": "发型师",
      "inService": 1,
      "completed": 5,
      "pending": 0,
      "status": "busy"
    }
  ],
  "peakHours": [
    { "hour": 14, "count": 8 },
    { "hour": 15, "count": 6 },
    { "hour": 10, "count": 5 }
  ],
  "appointments": {
    "total": 25,
    "pending": 3,
    "confirmed": 8,
    "completed": 12,
    "cancelled": 2
  }
}
```

---

### 3. 趋势数据 API

**GET /api/dashboard/trend**

获取趋势数据，包括营业额趋势、客流趋势。

**请求参数：**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| startDate | string | 否 | 开始日期 (YYYY-MM-DD) |
| endDate | string | 否 | 结束日期 (YYYY-MM-DD) |
| groupBy | string | 否 | 分组方式: hour/day/week/month，默认 day |
| storeId | string | 否 | 门店ID |
| employeeId | string | 否 | 员工ID |

**响应示例：**
```json
{
  "summary": {
    "totalRevenue": 156800.00,
    "totalCustomers": 623,
    "totalMembers": 450,
    "totalNewMembers": 45,
    "avgRevenue": 5226.67,
    "avgCustomers": 20.8
  },
  "trend": [
    {
      "date": "2024-01-01",
      "revenue": 4800.00,
      "customerCount": 18,
      "memberCount": 12,
      "newMemberCount": 2,
      "avgTicket": 266.67
    }
  ],
  "groupBy": "day",
  "period": {
    "startDate": "2024-01-01",
    "endDate": "2024-01-31"
  },
  "growth": {
    "revenue": 12.5
  }
}
```

---

### 4. 排行榜 API

**GET /api/dashboard/ranking**

获取排行榜数据，包括服务排行、员工排行。

**请求参数：**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| startDate | string | 否 | 开始日期 |
| endDate | string | 否 | 结束日期 |
| type | string | 否 | 排行类型: service/employee/product，默认 service |
| limit | number | 否 | 返回数量，默认 10 |
| storeId | string | 否 | 门店ID |

**服务排行响应示例：**
```json
{
  "type": "service",
  "ranking": [
    {
      "rank": 1,
      "serviceId": "uuid",
      "serviceName": "精剪",
      "salesCount": 156,
      "revenue": 23400.00,
      "avgPrice": 150.00
    }
  ],
  "summary": {
    "total": 10,
    "totalRevenue": 156800.00,
    "totalSales": 1250
  }
}
```

**员工排行响应示例：**
```json
{
  "type": "employee",
  "ranking": [
    {
      "rank": 1,
      "employeeId": "uuid",
      "employeeName": "王师傅",
      "avatar": "url",
      "position": "发型师",
      "serviceCount": 85,
      "revenue": 25500.00,
      "commission": 3825.00,
      "avgTicket": 300.00
    }
  ],
  "summary": {
    "total": 10,
    "totalRevenue": 156800.00,
    "totalServices": 623,
    "totalCommission": 23520.00
  }
}
```

---

### 5. 地图数据 API

**GET /api/dashboard/map**

获取会员分布地图数据。

**请求参数：**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| startDate | string | 否 | 开始日期 |
| endDate | string | 否 | 结束日期 |
| storeId | string | 否 | 门店ID |
| level | number | 否 | 地图层级: 1-省份 2-城市 3-区县，默认 1 |

**响应示例：**
```json
{
  "level": 1,
  "mapData": [
    {
      "regionCode": "130",
      "regionName": "北京",
      "memberCount": 256,
      "totalSpent": 125000.00,
      "level": 1
    }
  ],
  "heatmapData": [
    {
      "regionCode": "130",
      "regionName": "北京",
      "value": 256,
      "intensity": 1.00
    }
  ],
  "summary": {
    "totalMembers": 1250,
    "totalRegions": 5,
    "topRegion": {
      "regionCode": "130",
      "regionName": "北京",
      "memberCount": 256,
      "totalSpent": 125000.00
    },
    "avgMembersPerRegion": 250.0
  },
  "period": {
    "startDate": "2024-01-01",
    "endDate": "2024-12-31"
  }
}
```

---

## WebSocket 实时推送

### 连接地址

```
ws://localhost:3000/dashboard
```

### 连接参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| storeId | string | 否 | 门店ID，默认 'default' |

### 订阅频道

```javascript
// 连接后订阅频道
socket.emit('subscribe', {
  storeId: 'store_001',
  channels: ['orders', 'appointments', 'realtime']
});
```

### 可用频道

| 频道 | 说明 |
|------|------|
| orders | 订单相关推送 |
| appointments | 预约相关推送 |
| realtime | 实时数据推送 |

### 推送事件

| 事件名 | 说明 | 数据结构 |
|--------|------|----------|
| connected | 连接成功 | `{ message, storeId, timestamp }` |
| new-order | 新订单 | `{ type, data, timestamp }` |
| order-update | 订单更新 | `{ type, data, timestamp }` |
| new-appointment | 新预约 | `{ type, data, timestamp }` |
| appointment-update | 预约更新 | `{ type, data, timestamp }` |
| realtime-update | 实时数据更新 | `{ type, data, timestamp }` |
| queue-update | 排队更新 | `{ type, data, timestamp }` |
| notification | 系统通知 | `{ type, message, timestamp }` |

### 使用示例

```javascript
import { io } from 'socket.io-client';

// 连接
const socket = io('http://localhost:3000/dashboard', {
  query: { storeId: 'store_001' }
});

// 监听连接成功
socket.on('connected', (data) => {
  console.log('Connected:', data);
  
  // 订阅频道
  socket.emit('subscribe', {
    storeId: 'store_001',
    channels: ['orders', 'appointments', 'realtime']
  });
});

// 监听新订单
socket.on('new-order', (data) => {
  console.log('New order:', data);
  // 更新大屏显示
});

// 监听实时数据
socket.on('realtime-update', (data) => {
  console.log('Realtime update:', data);
  // 更新实时数据展示
});

// 取消订阅
socket.emit('unsubscribe', {
  storeId: 'store_001',
  channels: ['orders']
});
```

---

## 安装依赖

```bash
cd d:/SHOWBA19850714/workspace-lobster/projects/meiye-saas/backend
npm install
```

## 启动服务

```bash
npm run start:dev
```

## API 前缀

所有接口默认前缀为 `/api`，完整路径如：
- `GET /api/dashboard/overview`
- `GET /api/dashboard/realtime`
- `GET /api/dashboard/trend`
- `GET /api/dashboard/ranking`
- `GET /api/dashboard/map`
