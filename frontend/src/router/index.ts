import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { public: true },
  },
  {
    path: '/',
    component: () => import('../views/Layout.vue'),
    redirect: '/dashboard',
    children: [
      // ===== 服务商页面 =====
      {
        path: 'platform-dashboard',
        name: 'PlatformDashboard',
        component: () => import('../views/PlatformDashboard.vue'),
        meta: { title: '工作台', roles: ['superadmin'] },
      },
      {
        path: 'platform-report',
        name: 'PlatformReport',
        component: () => import('../views/PlatformReport.vue'),
        meta: { title: '数据总览', roles: ['superadmin'] },
      },
      {
        path: 'users',
        name: 'Users',
        component: () => import('../views/UserManage.vue'),
        meta: { title: '帐号管理', roles: ['superadmin'] },
      },
      {
        path: 'stores',
        name: 'Stores',
        component: () => import('../views/StoreManage.vue'),
        meta: { title: '门店管理', roles: ['superadmin'] },
      },
      {
        path: 'license',
        name: 'License',
        component: () => import('../views/LicenseManage.vue'),
        meta: { title: '密钥管理', roles: ['superadmin'] },
      },
      // ===== 门店业务页面 =====
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('../views/Dashboard.vue'),
        meta: { title: '工作台', roles: ['admin', 'manager', 'cashier', 'employee'] },
      },
      {
        path: 'cashier',
        name: 'Cashier',
        component: () => import('../views/Cashier.vue'),
        meta: { title: '收银开单', roles: ['admin', 'manager', 'cashier'] },
      },
      {
        path: 'member',
        name: 'Member',
        component: () => import('../views/Member.vue'),
        meta: { title: '会员管理', roles: ['admin', 'manager', 'cashier'] },
      },
      {
        path: 'employees',
        name: 'Employees',
        component: () => import('../views/Employee.vue'),
        meta: { title: '员工管理', roles: ['admin', 'manager'] },
      },
      {
        path: 'services',
        name: 'Services',
        component: () => import('../views/Service.vue'),
        meta: { title: '服务项目', roles: ['admin', 'manager', 'employee'] },
      },
      {
        path: 'appointments',
        name: 'Appointments',
        component: () => import('../views/Appointment.vue'),
        meta: { title: '预约管理', roles: ['admin', 'manager', 'cashier', 'employee'] },
      },
      {
        path: 'schedule',
        name: 'Schedule',
        component: () => import('../views/Schedule.vue'),
        meta: { title: '排班管理', roles: ['admin', 'manager', 'employee'] },
      },
      {
        path: 'report',
        name: 'Report',
        component: () => import('../views/Report.vue'),
        meta: { title: '报表统计', roles: ['admin', 'manager'] },
      },
      {
        path: 'inventory',
        name: 'Inventory',
        component: () => import('../views/Inventory.vue'),
        meta: { title: '库存管理', roles: ['admin', 'manager'] },
      },
      {
        path: 'sms-marketing',
        name: 'SmsMarketing',
        component: () => import('../views/SmsMarketing.vue'),
        meta: { title: '短信营销', roles: ['admin', 'manager'] },
      },
      {
        path: 'commission',
        name: 'Commission',
        component: () => import('../views/Commission.vue'),
        meta: { title: '提成管理', roles: ['admin', 'manager', 'employee'] },
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// 路由守卫
router.beforeEach((to, _from, next) => {
  const token = localStorage.getItem('token')

  if (to.meta.public) {
    next()
    return
  }

  if (!token) {
    next('/login')
    return
  }

  // 根据角色跳转首页
  if (to.path === '/' || to.path === '') {
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
    if (userInfo.role === 'superadmin') {
      next('/platform-dashboard')
    } else {
      next('/dashboard')
    }
    return
  }

  // 角色权限校验
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
  const requiredRoles = to.meta.roles as string[] | undefined
  if (requiredRoles && requiredRoles.length > 0) {
    const userRole = userInfo.role || 'admin'
    if (!requiredRoles.includes(userRole)) {
      // 无权限：跳转到对应角色的首页
      if (userInfo.role === 'superadmin') {
        next('/platform-dashboard')
      } else {
        next('/dashboard')
      }
      return
    }
  }

  next()
})

export default router