# 秀吧美业SaaS管理系统

## 项目简介

秀吧美业SaaS管理系统是一套功能完善的美业门店管理软件，包含收银管理、会员管理、预约管理、员工管理、库存管理、营销管理、数据统计等核心功能，助力美业门店实现数字化、智能化运营。

## 技术架构

### 前端技术栈
- Vue 3
- TypeScript
- Element Plus
- Vite
- Pinia (状态管理)
- Vue Router (路由管理)
- Axios (HTTP请求)
- ECharts (数据可视化)

### 后端技术栈
- NestJS
- TypeScript
- TypeORM (ORM框架)
- SQLite/PostgreSQL (数据库)
- Passport (认证)
- JWT (Token认证)

## 项目结构

```
04_美业SaaS系统/
├── backend/              # 后端服务
│   ├── src/
│   │   ├── common/      # 公共模块
│   │   └── modules/    # 业务模块
│   ├── data/           # 数据库文件
│   ├── dist/           # 编译输出
│   └── package.json
├── frontend/           # 前端应用
│   ├── src/
│   │   ├── views/     # 页面组件
│   │   ├── components/ # 业务组件
│   │   ├── api/       # API请求
│   │   └── utils/     # 工具函数
│   ├── dist/          # 构建输出
│   └── package.json
├── docs/              # 项目文档
├── README.md          # 项目说明
├── 软件说明书.md      # 软著说明书
└── 源代码-软著申请用.md # 源代码说明
```

## 功能列表

系统共实现了128项功能，包括：

### 1. 收银管理 (15项)
- 收银台开单
- 商品/服务销售
- 会员卡充值
- 优惠券核销
- 订单查询
- 合单功能
- 收银统计

### 2. 会员管理 (12项)
- 会员信息管理
- 会员卡管理
- 会员积分管理
- 会员等级管理
- 会员标签管理
- 礼品管理
- 会员推荐

### 3. 预约管理 (10项)
- 在线预约
- 预约排班
- 预约提醒
- 预约评价
- 预约统计
- 预约配置
- 营业时段设置

### 4. 员工管理 (12项)
- 员工信息管理
- 员工排班
- 考勤管理
- 提成管理
- 角色权限管理
- 培训管理
- 员工服务关联

### 5. 库存管理 (15项)
- 商品管理
- 库存盘点
- 库存调拨
- 采购管理
- 库存预警
- 成本核算
- 供应商管理

### 6. 营销管理 (12项)
- 优惠券管理
- 秒杀活动
- 拼团活动
- 新手礼包
- 积分商城
- 会员任务
- 推荐奖励
- 短信营销

### 7. 数据统计 (10项)
- 营收分析
- 销售统计
- 会员分析
- 员工绩效
- 预约统计
- 库存分析

### 8. 系统设置 (20项)
- 门店信息设置
- 数据设置
- 参数设置
- 系统配置
- 支付配置
- 打印模板
- 消息模板
- 操作日志
- 数据备份

### 9. 其他功能 (22项)
- 房间管理
- 个人中心
- 数据备份
- 操作日志
- 数据统计
- ... 等等

## 快速开始

### 环境要求
- Node.js >= 16.0.0
- npm >= 7.0.0

### 后端启动

```bash
cd backend
npm install
npm run db:init   # 初始化数据库
npm run start:dev # 开发模式
```

后端服务将在 http://localhost:3000 启动

### 前端启动

```bash
cd frontend
npm install
npm run dev
```

前端服务将在 http://localhost:5173 启动

## 默认账号

- 用户名: admin
- 密码: admin123

## 开发说明

### 后端开发

后端使用 NestJS 框架，TypeORM 进行数据库操作，SQLite 作为数据库（支持 Postgres）。

```bash
cd backend
npm run start:dev  # 启动开发服务器
npm run build      # 构建生产版本
npm run lint       # 代码检查
```

### 前端开发

前端使用 Vue 3 + Element Plus，Vite 构建工具。

```bash
cd frontend
npm run dev        # 启动开发服务器
npm run build      # 构建生产版本
npm run type-check # 类型检查
```

## 数据库说明

### SQLite 模式 (默认)
- 数据库文件位置: backend/data/meiye_saas.db
- 无需额外配置

### PostgreSQL 模式
- 修改 backend/.env 配置文件
- 设置 DB_TYPE=postgres
- 配置数据库连接信息

## 软件著作权申请

为便于软件著作权申请，项目已准备以下文件：

1. **软件说明书.md** - 完整的软件功能、技术、操作说明文档
2. **源代码-软著申请用.md** - 核心代码说明和文件列表
3. **完整的源代码** - frontend 和 backend

### 核心文件
- backend/src/main.ts - 后端入口
- backend/src/app.module.ts - 后端主模块
- frontend/src/main.ts - 前端入口
- frontend/src/App.vue - 主应用组件

## 系统特色

1. **功能完善** - 128项功能，全面覆盖美业门店需求
2. **界面美观** - 使用 Element Plus 组件库，简洁美观
3. **响应迅速** - 基于现代化技术栈，页面响应快
4. **数据安全** - SQLite 数据库，支持数据备份
5. **易于部署** - 部署简单，支持多平台运行

## 技术支持

如有问题，请参考：
- 开发进度文档: DEVELOPMENT_PROGRESS.md
- 诊断报告: DIAGNOSTIC_REPORT.md
- API文档: docs/API接口规范.md

---

## 版本历史

- V1.0.0 (2026-04-22) - 初始版本，实现128项功能

---

**著作权人**: 丁志伟
**开发时间**: 2026-04
