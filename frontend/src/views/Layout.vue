<template>
  <div class="layout-container">
    <el-container style="height: 100vh">
      <!-- 侧边栏 -->
      <el-aside :width="isCollapse ? '64px' : '220px'" class="sidebar">
        <div class="logo-area">
          <img src="/logo.svg" alt="SHOWBA" class="logo-img" v-if="!isCollapse" />
          <img src="/logo.svg" alt="SHOWBA" class="logo-img-small" v-else />
          <span v-if="!isCollapse" class="logo-text">SHOWBA美业</span>
        </div>

        <!-- 动态菜单：根据角色显示不同菜单项 -->
        <el-menu
          :default-active="currentRoute"
          :collapse="isCollapse"
          router
          background-color="#1d1e2c"
          text-color="#a3a6b7"
          active-text-color="#409eff"
        >
          <el-menu-item
            v-for="item in menuItems"
            :key="item.path"
            :index="item.path"
          >
            <el-icon><component :is="item.icon" /></el-icon>
            <span>{{ item.title }}</span>
          </el-menu-item>
        </el-menu>
      </el-aside>

      <!-- 主内容区 -->
      <el-container>
        <!-- 顶部栏 -->
        <el-header class="header">
          <div class="header-left">
            <el-icon class="collapse-btn" @click="isCollapse = !isCollapse">
              <Fold v-if="!isCollapse" />
              <Expand v-else />
            </el-icon>
          </div>
          <div class="header-right">
            <!-- 门店切换 -->
            <div v-if="userStore.isSuperAdmin && userStore.storeList.length > 0" class="store-switcher">
              <el-select
                :model-value="userStore.storeId"
                @change="handleStoreChange"
                size="small"
                style="width: 200px;"
                placeholder="选择门店"
              >
                <el-option label="全部门店" value="" />
                <el-option
                  v-for="s in userStore.storeList"
                  :key="s.id"
                  :label="s.name"
                  :value="s.id"
                />
              </el-select>
            </div>
            <div v-else-if="userStore.storeList.length > 1" class="store-switcher">
              <el-select
                :model-value="userStore.storeId"
                @change="handleStoreChange"
                size="small"
                style="width: 200px;"
                placeholder="选择门店"
              >
                <el-option
                  v-for="s in userStore.storeList"
                  :key="s.id"
                  :label="s.name"
                  :value="s.id"
                />
              </el-select>
            </div>
            <div v-else-if="userStore.storeName" class="store-label">
              <el-tag size="small" effect="plain" type="warning">{{ userStore.storeName }}</el-tag>
            </div>

            <!-- 角色标签 -->
            <el-tag :type="userStore.roleTagColor" size="small" effect="dark">
              {{ userStore.roleLabel }}
            </el-tag>

            <!-- 用户信息 -->
            <el-dropdown trigger="click" @command="handleCommand">
              <span class="user-info">
                <el-avatar :size="28" :src="userStore.userInfo?.avatar">
                  {{ userStore.userInfo?.name?.[0] || '?' }}
                </el-avatar>
                <span class="user-name">{{ userStore.userInfo?.name }}</span>
                <el-icon><ArrowDown /></el-icon>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item disabled>
                    {{ userStore.roleHint }}
                  </el-dropdown-item>
                  <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </el-header>

        <!-- 页面内容 -->
        <el-main class="main-content">
          <router-view />
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '../stores/user'
import {
  Monitor, User, OfficeBuilding, Key, DataAnalysis,
  Money, UserFilled, Avatar, Scissor, Calendar,
  Fold, Expand, ArrowDown, TrendCharts, Goods, ChatDotRound, Timer, PieChart,
} from '@element-plus/icons-vue'

// 图标映射
const iconMap: Record<string, any> = {
  Monitor, User, OfficeBuilding, Key, DataAnalysis,
  Money, UserFilled, Avatar, Scissor, Calendar,
  TrendCharts, Goods, ChatDotRound, Timer, PieChart,
}

// 各角色菜单配置
const roleMenuMap: Record<string, { path: string; title: string; icon: string }[]> = {
  superadmin: [
    { path: '/platform-dashboard', title: '工作台', icon: 'Monitor' },
    { path: '/users', title: '帐号管理', icon: 'User' },
    { path: '/stores', title: '门店管理', icon: 'OfficeBuilding' },
    { path: '/license', title: '密钥管理', icon: 'Key' },
    { path: '/platform-report', title: '数据总览', icon: 'DataAnalysis' },
  ],
  admin: [
    { path: '/dashboard', title: '工作台', icon: 'Monitor' },
    { path: '/cashier', title: '收银台', icon: 'Money' },
    { path: '/member', title: '会员管理', icon: 'UserFilled' },
    { path: '/employees', title: '员工管理', icon: 'Avatar' },
    { path: '/services', title: '服务项目', icon: 'Scissor' },
    { path: '/appointments', title: '预约管理', icon: 'Calendar' },
    { path: '/schedule', title: '排班管理', icon: 'Timer' },
    { path: '/report', title: '报表统计', icon: 'PieChart' },
    { path: '/inventory', title: '库存管理', icon: 'Goods' },
    { path: '/sms-marketing', title: '短信营销', icon: 'ChatDotRound' },
  ],
  manager: [
    { path: '/dashboard', title: '工作台', icon: 'Monitor' },
    { path: '/cashier', title: '收银台', icon: 'Money' },
    { path: '/member', title: '会员管理', icon: 'UserFilled' },
    { path: '/employees', title: '员工管理', icon: 'Avatar' },
    { path: '/services', title: '服务项目', icon: 'Scissor' },
    { path: '/appointments', title: '预约管理', icon: 'Calendar' },
    { path: '/schedule', title: '排班管理', icon: 'Timer' },
    { path: '/report', title: '报表统计', icon: 'PieChart' },
  ],
  cashier: [
    { path: '/cashier', title: '收银台', icon: 'Money' },
    { path: '/member', title: '会员管理', icon: 'UserFilled' },
    { path: '/appointments', title: '预约管理', icon: 'Calendar' },
  ],
  employee: [
    { path: '/dashboard', title: '工作台', icon: 'Monitor' },
    { path: '/appointments', title: '预约管理', icon: 'Calendar' },
    { path: '/services', title: '服务项目', icon: 'Scissor' },
  ],
}

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const isCollapse = ref(false)

const currentRoute = computed(() => route.path)

// 根据当前角色动态生成菜单
const menuItems = computed(() => {
  const role = userStore.role || 'employee'
  const items = roleMenuMap[role] || roleMenuMap.employee
  return items.map(item => ({
    ...item,
    icon: iconMap[item.icon] || Monitor,
  }))
})

const handleStoreChange = (storeId: string) => {
  if (!storeId) {
    userStore.switchStore('', '全部门店')
    router.go(0)
    return
  }
  const store = userStore.storeList.find(s => s.id === storeId)
  if (store) {
    userStore.switchStore(store.id, store.name)
    router.go(0)
  }
}

const handleCommand = (command: string) => {
  if (command === 'logout') {
    userStore.logout()
    router.push('/login')
  }
}
</script>

<style scoped>
.layout-container {
  height: 100vh;
  overflow: hidden;
}

.sidebar {
  background-color: #1d1e2c;
  transition: width 0.3s;
  overflow-y: auto;
  overflow-x: hidden;
}

.logo-area {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.logo-img {
  height: 32px;
  margin-right: 8px;
}

.logo-img-small {
  height: 28px;
}

.logo-text {
  color: #fff;
  font-size: 18px;
  font-weight: bold;
  white-space: nowrap;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border-bottom: 1px solid #e8e8e8;
  padding: 0 20px;
  height: 56px;
}

.header-left {
  display: flex;
  align-items: center;
}

.collapse-btn {
  font-size: 20px;
  cursor: pointer;
  color: #666;
}

.collapse-btn:hover {
  color: #409eff;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.store-switcher {
  margin-right: 8px;
}

.store-label {
  margin-right: 8px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  color: #333;
}

.user-name {
  font-size: 14px;
}

.main-content {
  background: #f5f7fa;
  overflow-y: auto;
}

:deep(.el-menu) {
  border-right: none;
}

:deep(.el-menu-item.is-active) {
  background-color: #409eff !important;
  color: #fff !important;
}

:deep(.el-sub-menu .el-menu-item.is-active) {
  background-color: rgba(64, 158, 255, 0.2) !important;
  color: #409eff !important;
}
</style>