<template>
  <el-container class="layout-container">
    <el-aside width="220px">
      <div class="logo">
        <h3>美业SaaS</h3>
      </div>
      <el-menu :default-active="activeMenu" router background-color="#304156" text-color="#bfcbd9" active-text-color="#409eff">
        
        <!-- 工作台 -->
        <el-menu-item index="/dashboard">
          <el-icon><HomeFilled /></el-icon>
          <span>工作台</span>
        </el-menu-item>
        
        <!-- 收银台 -->
        <el-sub-menu index="cashier">
          <template #title>
            <el-icon><ShoppingCart /></el-icon>
            <span>收银台</span>
          </template>
          <el-menu-item index="/cashier">开单</el-menu-item>
          <el-menu-item index="/document-query">单据查询</el-menu-item>
          <el-menu-item index="/coupon-verify">核销验券</el-menu-item>
        </el-sub-menu>
        
        <!-- 预约管理 -->
        <el-sub-menu index="appointment">
          <template #title>
            <el-icon><Calendar /></el-icon>
            <span>预约管理</span>
          </template>
          <el-menu-item index="/appointment">预约列表</el-menu-item>
          <el-menu-item index="/appointment-calendar">预约日历</el-menu-item>
          <el-menu-item index="/schedule">排班管理</el-menu-item>
        </el-sub-menu>
        
        <!-- 会员管理 -->
        <el-sub-menu index="member">
          <template #title>
            <el-icon><User /></el-icon>
            <span>会员管理</span>
          </template>
          <el-menu-item index="/member">会员资料</el-menu-item>
          <el-menu-item index="/member-tag">标签管理</el-menu-item>
          <el-menu-item index="/member-level">会员等级</el-menu-item>
          <el-menu-item index="/member-points">积分管理</el-menu-item>
          <el-menu-item index="/gift-manage">礼品管理</el-menu-item>
        </el-sub-menu>
        
        <!-- 员工管理 -->
        <el-sub-menu index="employee">
          <template #title>
            <el-icon><Avatar /></el-icon>
            <span>员工管理</span>
          </template>
          <el-menu-item index="/employee">员工资料</el-menu-item>
          <el-menu-item index="/commission">提成设置</el-menu-item>
          <el-menu-item index="/attendance">考勤打卡</el-menu-item>
          <el-menu-item index="/employee-permission">权限管理</el-menu-item>
        </el-sub-menu>
        
        <!-- 库存管理 -->
        <el-sub-menu index="inventory">
          <template #title>
            <el-icon><Box /></el-icon>
            <span>库存管理</span>
          </template>
          <el-menu-item index="/stock-in">入库开单</el-menu-item>
          <el-menu-item index="/stock-out">出库开单</el-menu-item>
          <el-menu-item index="/stock-take">库存盘点</el-menu-item>
          <el-menu-item index="/stock-transfer">商品调拨</el-menu-item>
          <el-menu-item index="/supplier">供应商管理</el-menu-item>
          <el-menu-item index="/stock-report">库存报表</el-menu-item>
        </el-sub-menu>
        
        <!-- 店内收支 -->
        <el-sub-menu index="expense">
          <template #title>
            <el-icon><Wallet /></el-icon>
            <span>店内收支</span>
          </template>
          <el-menu-item index="/store-expense">收支管理</el-menu-item>
        </el-sub-menu>
        
        <!-- 报表分析 -->
        <el-sub-menu index="report">
          <template #title>
            <el-icon><DataLine /></el-icon>
            <span>报表分析</span>
          </template>
          <el-menu-item index="/report-analysis">营收分析</el-menu-item>
          <el-menu-item index="/report">报表统计</el-menu-item>
          <el-menu-item index="/dashboard-screen">数据大屏</el-menu-item>
        </el-sub-menu>
        
        <!-- 短信营销 -->
        <el-sub-menu index="sms">
          <template #title>
            <el-icon><ChatDotRound /></el-icon>
            <span>短信营销</span>
          </template>
          <el-menu-item index="/sms-marketing">短信管理</el-menu-item>
        </el-sub-menu>
        
        <!-- 提醒中心 -->
        <el-sub-menu index="reminder">
          <template #title>
            <el-icon><Bell /></el-icon>
            <span>提醒中心</span>
          </template>
          <el-menu-item index="/reminder">提醒列表</el-menu-item>
        </el-sub-menu>
        
        <!-- 数据设置 -->
        <el-sub-menu index="data-settings">
          <template #title>
            <el-icon><Grid /></el-icon>
            <span>数据设置</span>
          </template>
          <el-menu-item index="/data-settings">本店信息</el-menu-item>
          <el-menu-item index="/service">服务设置</el-menu-item>
          <el-menu-item index="/count-card">卡类设置</el-menu-item>
          <el-menu-item index="/store">门店管理</el-menu-item>
          <el-menu-item index="/room-manage">房间管理</el-menu-item>
          <el-menu-item index="/integration">第三方对接</el-menu-item>
        </el-sub-menu>
        
        <!-- 参数设置 -->
        <el-sub-menu index="param">
          <template #title>
            <el-icon><Setting /></el-icon>
            <span>参数设置</span>
          </template>
          <el-menu-item index="/param-settings">系统参数</el-menu-item>
          <el-menu-item index="/operation-log">操作日志</el-menu-item>
          <el-menu-item index="/backup">数据备份</el-menu-item>
          <el-menu-item index="/system-config">系统设置</el-menu-item>
        </el-sub-menu>
        
      </el-menu>
    </el-aside>
    <el-container>
      <el-header>
        <div class="header-right">
          <el-dropdown>
            <span class="el-dropdown-link">
              {{ userStore.userInfo?.name || '管理员' }} 
              <el-tag size="small" style="margin-left: 5px">{{ roleLabel }}</el-tag>
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="router.push('/user-center')">个人中心</el-dropdown-item>
                <el-dropdown-item divided @click="handleLogout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      <el-main>
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { HomeFilled, User, Avatar, ShoppingCart, DataLine, Bell, Calendar, ArrowDown, Box, Wallet, Setting, Grid, ChatDotRound } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const activeMenu = computed(() => route.path)

const roleLabels: Record<string, string> = {
  admin: '管理员',
  manager: '店长',
  receptionist: '前台',
  stylist: '发型师',
  employee: '员工',
  cashier: '收银员'
}

const roleLabel = computed(() => roleLabels[userStore.role] || '员工')

const handleLogout = () => {
  userStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.layout-container {
  height: 100vh;
}

.el-aside {
  background-color: #304156;
  overflow-y: auto;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #263445;
}

.logo h3 {
  color: #fff;
  margin: 0;
}

.el-header {
  background-color: #fff;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 20px;
}

.header-right {
  display: flex;
  align-items: center;
}

.el-dropdown-link {
  cursor: pointer;
  display: flex;
  align-items: center;
}

.el-main {
  background-color: #f0f2f5;
}

.el-aside::-webkit-scrollbar {
  width: 6px;
}

.el-aside::-webkit-scrollbar-thumb {
  background-color: #4a5568;
  border-radius: 3px;
}

.el-aside::-webkit-scrollbar-track {
  background-color: #2d3748;
}
</style>
