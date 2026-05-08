import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { title: '登录' }
  },
  {
    path: '/',
    name: 'Layout',
    component: () => import('@/views/Layout.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { title: '工作台' }
      },
      {
        path: 'member',
        name: 'Member',
        component: () => import('@/views/Member.vue'),
        meta: { title: '会员管理' }
      },
      {
        path: 'employee',
        name: 'Employee',
        component: () => import('@/views/Employee.vue'),
        meta: { title: '员工管理' }
      },
      {
        path: 'service',
        name: 'Service',
        component: () => import('@/views/Service.vue'),
        meta: { title: '服务项目' }
      },
      {
        path: 'service-package',
        name: 'ServicePackage',
        component: () => import('@/views/ServicePackage.vue'),
        meta: { title: '服务套餐' }
      },
      {
        path: 'service-review',
        name: 'ServiceReview',
        component: () => import('@/views/ServiceReview.vue'),
        meta: { title: '服务评价' }
      },
      {
        path: 'count-card',
        name: 'CountCard',
        component: () => import('@/views/CountCard.vue'),
        meta: { title: '次卡管理' }
      },
      {
        path: 'cashier',
        name: 'Cashier',
        component: () => import('@/views/Cashier.vue'),
        meta: { title: '收银台' }
      },
      {
        path: 'report',
        name: 'Report',
        component: () => import('@/views/Report.vue'),
        meta: { title: '报表统计' }
      },
      {
        path: 'revenue-analysis',
        name: 'RevenueAnalysis',
        component: () => import('@/views/RevenueAnalysis.vue'),
        meta: { title: '营收分析' }
      },
      {
        path: 'report-analysis',
        name: 'ReportAnalysis',
        component: () => import('@/views/ReportAnalysis.vue'),
        meta: { title: '营收分析' }
      },
      {
        path: 'reminder',
        name: 'Reminder',
        component: () => import('@/views/Reminder.vue'),
        meta: { title: '提醒中心' }
      },
      {
        path: 'appointment',
        name: 'Appointment',
        component: () => import('@/views/Appointment.vue'),
        meta: { title: '预约管理' }
      },
      {
        path: 'appointment-calendar',
        name: 'AppointmentCalendar',
        component: () => import('@/views/AppointmentCalendar.vue'),
        meta: { title: '预约日历' }
      },
      {
        path: 'queue',
        name: 'Queue',
        component: () => import('@/views/Queue.vue'),
        meta: { title: '排队管理' }
      },
      {
        path: 'appointment-review',
        name: 'AppointmentReview',
        component: () => import('@/views/AppointmentReview.vue'),
        meta: { title: '预约评价' }
      },
      {
        path: 'appointment-reminder',
        name: 'AppointmentReminder',
        component: () => import('@/views/AppointmentReminder.vue'),
        meta: { title: '提醒配置' }
      },
      {
        path: 'schedule',
        name: 'Schedule',
        component: () => import('@/views/ScheduleEnhanced.vue'),
        meta: { title: '排班管理' }
      },
      {
        path: 'attendance',
        name: 'Attendance',
        component: () => import('@/views/Attendance.vue'),
        meta: { title: '考勤管理' }
      },
      {
        path: 'commission',
        name: 'Commission',
        component: () => import('@/views/Commission.vue'),
        meta: { title: '提成管理' }
      },
      {
        path: 'training',
        name: 'Training',
        component: () => import('@/views/Training.vue'),
        meta: { title: '培训管理' }
      },
      {
        path: 'employee-permission',
        name: 'EmployeePermission',
        component: () => import('@/views/EmployeePermission.vue'),
        meta: { title: '员工权限' }
      },
      {
        path: 'marketing',
        name: 'Marketing',
        component: () => import('@/views/Marketing.vue'),
        meta: { title: '营销管理' }
      },
      {
        path: 'inventory',
        name: 'Inventory',
        component: () => import('@/views/Inventory.vue'),
        meta: { title: '库存管理' }
      },
      {
        path: 'credit',
        name: 'Credit',
        component: () => import('@/views/Credit.vue'),
        meta: { title: '挂账管理' }
      },
      {
        path: 'member-enhanced',
        name: 'MemberEnhanced',
        component: () => import('@/views/MemberEnhanced.vue'),
        meta: { title: '会员增强' }
      },
      {
        path: 'member-tag',
        name: 'MemberTag',
        component: () => import('@/views/MemberTag.vue'),
        meta: { title: '会员标签' }
      },
      {
        path: 'member-level',
        name: 'MemberLevel',
        component: () => import('@/views/MemberLevel.vue'),
        meta: { title: '会员等级' }
      },
      {
        path: 'member-points',
        name: 'MemberPoints',
        component: () => import('@/views/MemberPoints.vue'),
        meta: { title: '积分管理' }
      },
      {
        path: 'operation-log',
        name: 'OperationLog',
        component: () => import('@/views/OperationLog.vue'),
        meta: { title: '操作日志' }
      },
      {
        path: 'backup',
        name: 'Backup',
        component: () => import('@/views/Backup.vue'),
        meta: { title: '数据备份' }
      },
      {
        path: 'system-config',
        name: 'SystemConfig',
        component: () => import('@/views/SystemConfig.vue'),
        meta: { title: '系统设置' }
      },
      {
        path: 'document-query',
        name: 'DocumentQuery',
        component: () => import('@/views/DocumentQuery.vue'),
        meta: { title: '单据查询' }
      },
      {
        path: 'coupon-verify',
        name: 'CouponVerify',
        component: () => import('@/views/CouponVerify.vue'),
        meta: { title: '核销验券' }
      },
      {
        path: 'points-mall',
        name: 'PointsMall',
        component: () => import('@/views/PointsMall.vue'),
        meta: { title: '积分商城' }
      },
      {
        path: 'member-task',
        name: 'MemberTask',
        component: () => import('@/views/MemberTask.vue'),
        meta: { title: '会员任务' }
      },
      {
        path: 'marketing-analysis',
        name: 'MarketingAnalysis',
        component: () => import('@/views/MarketingAnalysis.vue'),
        meta: { title: '营销分析' }
      },
      {
        path: 'stock-take',
        name: 'StockTake',
        component: () => import('@/views/StockTake.vue'),
        meta: { title: '库存盘点' }
      },
      {
        path: 'stock-alert',
        name: 'StockAlert',
        component: () => import('@/views/StockAlert.vue'),
        meta: { title: '库存预警' }
      },
      {
        path: 'stock-transfer',
        name: 'StockTransfer',
        component: () => import('@/views/StockTransfer.vue'),
        meta: { title: '库存调拨' }
      },
      {
        path: 'supplier',
        name: 'Supplier',
        component: () => import('@/views/Supplier.vue'),
        meta: { title: '供应商管理' }
      },
      {
        path: 'purchase',
        name: 'Purchase',
        component: () => import('@/views/Purchase.vue'),
        meta: { title: '采购管理' }
      },
      {
        path: 'cost-analysis',
        name: 'CostAnalysis',
        component: () => import('@/views/CostAnalysis.vue'),
        meta: { title: '成本分析' }
      },
      {
        path: 'dashboard-screen',
        name: 'DashboardScreen',
        component: () => import('@/views/DashboardScreen.vue'),
        meta: { title: '数据大屏' }
      },
      {
        path: 'data-settings',
        name: 'DataSettings',
        component: () => import('@/views/DataSettings.vue'),
        meta: { title: '数据设置' }
      },
      {
        path: 'store',
        name: 'Store',
        component: () => import('@/views/Store.vue'),
        meta: { title: '门店管理' }
      },
      {
        path: 'payment-config',
        name: 'PaymentConfig',
        component: () => import('@/views/PaymentConfig.vue'),
        meta: { title: '支付配置' }
      },
      {
        path: 'print-template',
        name: 'PrintTemplate',
        component: () => import('@/views/PrintTemplate.vue'),
        meta: { title: '打印模板' }
      },
      {
        path: 'message-template',
        name: 'MessageTemplate',
        component: () => import('@/views/MessageTemplate.vue'),
        meta: { title: '消息模板' }
      },
      // 库存管理
      {
        path: 'stock-in',
        name: 'StockIn',
        component: () => import('@/views/StockIn.vue'),
        meta: { title: '入库开单' }
      },
      {
        path: 'stock-out',
        name: 'StockOut',
        component: () => import('@/views/StockOut.vue'),
        meta: { title: '出库开单' }
      },
      {
        path: 'stock-report',
        name: 'StockReport',
        component: () => import('@/views/StockReport.vue'),
        meta: { title: '库存报表' }
      },
      // 店内收支
      {
        path: 'store-expense',
        name: 'StoreExpense',
        component: () => import('@/views/StoreExpense.vue'),
        meta: { title: '店内收支' }
      },
      // 新增功能页面
      {
        path: 'appointment-config',
        name: 'AppointmentConfig',
        component: () => import('@/views/AppointmentConfig.vue'),
        meta: { title: '预约设置' }
      },
      {
        path: 'sms-marketing',
        name: 'SmsMarketing',
        component: () => import('@/views/SmsMarketing.vue'),
        meta: { title: '短信营销' }
      },
      {
        path: 'integration',
        name: 'Integration',
        component: () => import('@/views/Integration.vue'),
        meta: { title: '第三方对接' }
      },
      {
        path: 'room-manage',
        name: 'RoomManage',
        component: () => import('@/views/RoomManage.vue'),
        meta: { title: '房间管理' }
      },
      {
        path: 'param-settings',
        name: 'ParamSettings',
        component: () => import('@/views/ParamSettings.vue'),
        meta: { title: '参数设置' }
      },
      {
        path: 'gift-manage',
        name: 'GiftManage',
        component: () => import('@/views/GiftManage.vue'),
        meta: { title: '礼品管理' }
      },
      {
        path: 'user-center',
        name: 'UserCenter',
        component: () => import('@/views/UserCenter.vue'),
        meta: { title: '个人中心' }
      },
      {
        path: 'employee-service',
        name: 'EmployeeService',
        component: () => import('@/views/EmployeeService.vue'),
        meta: { title: '员工服务项目' }
      },
      {
        path: 'user-manage',
        name: 'UserManage',
        component: () => import('@/views/UserManage.vue'),
        meta: { title: '用户管理' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, _from, next) => {
  document.title = `${to.meta.title || '美业SaaS'} - 美业管理系统`
  const token = localStorage.getItem('token')
  if (to.path !== '/login' && !token) {
    next('/login')
  } else {
    next()
  }
})

export default router
