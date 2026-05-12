<template>
  <div class="platform-dashboard">
    <!-- 身份卡片 -->
    <el-card shadow="never" class="identity-card">
      <div class="identity-info">
        <el-avatar :size="48" :src="userStore.userInfo?.avatar">
          {{ userStore.userInfo?.name?.[0] || '?' }}
        </el-avatar>
        <div>
          <div class="identity-name">{{ userStore.userInfo?.name || '服务商' }}</div>
          <div class="identity-desc">
            <el-tag type="danger" effect="dark" size="small">服务商</el-tag>
            <span style="color: #909399; margin-left: 8px;">管理所有帐号、门店和密钥</span>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 核心数据卡片 -->
    <el-row :gutter="16" style="margin-top: 16px">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <el-statistic title="门店总数" :value="overview.stores?.total || 0" suffix="家">
            <template #prefix><el-icon color="#409eff"><OfficeBuilding /></el-icon></template>
          </el-statistic>
          <div class="stat-sub">活跃 {{ overview.stores?.active || 0 }} 家</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <el-statistic title="帐号总数" :value="overview.users?.total || 0" suffix="个">
            <template #prefix><el-icon color="#e6a23c"><User /></el-icon></template>
          </el-statistic>
          <div class="stat-sub">
            管理员 {{ overview.users?.byRole?.admin || 0 }} / 店长 {{ overview.users?.byRole?.manager || 0 }} / 员工 {{ overview.users?.byRole?.employee || 0 }}
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <el-statistic title="会员总数" :value="overview.members?.total || 0" suffix="人">
            <template #prefix><el-icon color="#67c23a"><UserFilled /></el-icon></template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <el-statistic title="今日营收" :value="overview.revenue?.today || 0" prefix="¥">
            <template #prefix><el-icon color="#f56c6c"><Money /></el-icon></template>
          </el-statistic>
          <div class="stat-sub">累计 ¥{{ overview.revenue?.total || 0 }}</div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 快捷操作 -->
    <el-card style="margin-top: 16px">
      <template #header><span>快捷操作</span></template>
      <el-row :gutter="12">
        <el-col :span="6">
          <el-button type="primary" size="large" style="width: 100%" @click="$router.push('/license')">
            <el-icon><Key /></el-icon> 生成密钥
          </el-button>
        </el-col>
        <el-col :span="6">
          <el-button type="success" size="large" style="width: 100%" @click="$router.push('/stores')">
            <el-icon><OfficeBuilding /></el-icon> 门店管理
          </el-button>
        </el-col>
        <el-col :span="6">
          <el-button type="warning" size="large" style="width: 100%" @click="$router.push('/users')">
            <el-icon><User /></el-icon> 帐号管理
          </el-button>
        </el-col>
        <el-col :span="6">
          <el-button size="large" style="width: 100%" @click="$router.push('/platform-report')">
            <el-icon><DataAnalysis /></el-icon> 数据总览
          </el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- 门店列表 -->
    <el-card style="margin-top: 16px">
      <template #header><span>门店概览</span></template>
      <el-table :data="overview.stores?.list || []" stripe border v-loading="loading">
        <el-table-column prop="name" label="门店名称" min-width="160" />
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'info'" size="small">
              {{ row.status === 'active' ? '活跃' : row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="管理员" min-width="140">
          <template #default="{ row }">
            <span v-if="row.admins?.length > 0">
              {{ row.admins.map(a => a.name).join('、') }}
            </span>
            <span v-else style="color: #c0c4cc;">未分配</span>
          </template>
        </el-table-column>
        <el-table-column prop="memberCount" label="会员数" width="100" align="center" />
        <el-table-column prop="employeeCount" label="员工数" width="100" align="center" />
        <el-table-column label="营收" width="120" align="right">
          <template #default="{ row }">
            <span style="color: #f56c6c; font-weight: 600;">¥{{ row.revenue }}</span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import request from '@/utils/request'
import { useUserStore } from '@/stores/user'
import {
  OfficeBuilding, User, UserFilled, Money, Key, DataAnalysis,
} from '@element-plus/icons-vue'

const userStore = useUserStore()
const loading = ref(false)
const overview = ref<any>({
  stores: { total: 0, active: 0, list: [] },
  users: { total: 0, byRole: {} },
  members: { total: 0 },
  employees: { total: 0 },
  revenue: { total: 0, today: 0 },
})

onMounted(async () => {
  loading.value = true
  try {
    const res = await request.get('/dashboard/platform-overview')
    if (res) overview.value = res
  } catch (e) {
    console.error('平台数据加载失败:', e)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.platform-dashboard { padding: 20px; }

.identity-card {
  background: linear-gradient(135deg, #2c3e50 0%, #3498db 100%);
  border: none;
}
.identity-card :deep(.el-card__body) { padding: 20px; }
.identity-info { display: flex; align-items: center; gap: 16px; }
.identity-name { font-size: 20px; font-weight: 600; color: #fff; }
.identity-desc { margin-top: 4px; }

.stat-card :deep(.el-card__body) { padding: 20px; }
.stat-sub { margin-top: 8px; font-size: 12px; color: #909399; }
</style>