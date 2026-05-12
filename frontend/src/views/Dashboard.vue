<template>
  <div class="dashboard">
    <!-- 当前登录身份 -->
    <el-card class="identity-card" shadow="never">
      <div class="identity-info">
        <span class="identity-name">{{ userName }}</span>
        <el-tag :type="roleTagColor" effect="dark" size="large">{{ roleLabel }}</el-tag>
        <span class="identity-desc">{{ roleDesc }}</span>
      </div>
    </el-card>

    <!-- 管理员/店长：完整统计 -->
    <template v-if="isAdminOrManager">
      <el-row :gutter="20" style="margin-top: 16px">
        <el-col :span="6">
          <el-card shadow="hover">
            <el-statistic title="今日营业额" :value="todayRevenue" prefix="¥" />
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover">
            <el-statistic title="今日订单" :value="todayOrders" suffix="单" />
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover">
            <el-statistic title="会员总数" :value="totalMembers" suffix="人" />
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover">
            <el-statistic title="员工总数" :value="totalEmployees" suffix="人" />
          </el-card>
        </el-col>
      </el-row>
      <!-- 待审核帐号（管理员/店长可见） -->
      <el-row v-if="isAdminOrManager" :gutter="20" style="margin-top: 20px">
        <el-col :span="24">
          <el-card>
            <template #header>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span>待审核帐号</span>
                <el-badge v-if="pendingUsers.length > 0" :value="pendingUsers.length" type="danger" />
              </div>
            </template>
            <el-table v-if="pendingUsers.length > 0" :data="pendingUsers" size="small" stripe>
              <el-table-column prop="username" label="用户名" width="120" />
              <el-table-column prop="name" label="姓名" width="100" />
              <el-table-column prop="phone" label="手机号" width="130" />
              <el-table-column prop="createdAt" label="注册时间" width="170">
                <template #default="{ row }">
                  {{ new Date(row.createdAt).toLocaleString() }}
                </template>
              </el-table-column>
              <el-table-column label="分配角色" width="150">
                <template #default="{ row }">
                  <el-select v-model="row._assignRole" placeholder="选择角色" size="small" style="width: 120px">
                    <el-option label="员工" value="employee" />
                    <el-option label="收银员" value="cashier" />
                    <el-option label="店长" value="manager" />
                    <el-option label="管理员" value="admin" />
                  </el-select>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="180">
                <template #default="{ row }">
                  <el-button type="success" size="small" @click="handleApprove(row)" :disabled="!row._assignRole">通过</el-button>
                  <el-button type="danger" size="small" @click="handleReject(row)">拒绝</el-button>
                </template>
              </el-table-column>
            </el-table>
            <el-empty v-else description="暂无待审核帐号" :image-size="60" />
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="20" style="margin-top: 20px">
        <el-col :span="12">
          <el-card>
            <template #header><span>快捷操作</span></template>
            <el-row :gutter="10">
              <el-col :span="8">
                <el-button type="primary" size="large" style="width: 100%" @click="$router.push('/cashier')">
                  <el-icon><ShoppingCart /></el-icon> 收银开单
                </el-button>
              </el-col>
              <el-col :span="8">
                <el-button type="success" size="large" style="width: 100%" @click="$router.push('/member')">
                  <el-icon><User /></el-icon> 会员管理
                </el-button>
              </el-col>
              <el-col :span="8">
                <el-button type="warning" size="large" style="width: 100%" @click="$router.push('/report')">
                  <el-icon><DataLine /></el-icon> 查看报表
                </el-button>
              </el-col>
            </el-row>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card>
            <template #header><span>今日待办</span></template>
            <div v-if="todayAppointments.length > 0">
              <div v-for="apt in todayAppointments" :key="apt.id" style="padding: 8px 0; border-bottom: 1px solid #eee;">
                <span>{{ apt.memberName || '未知会员' }} - {{ apt.serviceName || '未知服务' }}</span>
                <span style="float: right; color: #999;">{{ apt.startTime || '' }}</span>
              </div>
            </div>
            <el-empty v-else description="暂无待办事项" :image-size="80" />
          </el-card>
        </el-col>
      </el-row>
    </template>

    <!-- 收银员：只看订单和待办 -->
    <template v-else-if="isCashier">
      <el-row :gutter="20" style="margin-top: 16px">
        <el-col :span="12">
          <el-card shadow="hover">
            <el-statistic title="今日订单" :value="todayOrders" suffix="单" />
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card shadow="hover">
            <el-statistic title="今日营业额" :value="todayRevenue" prefix="¥" />
          </el-card>
        </el-col>
      </el-row>
      <el-row :gutter="20" style="margin-top: 20px">
        <el-col :span="12">
          <el-card>
            <template #header><span>快捷操作</span></template>
            <el-button type="primary" size="large" style="width: 100%" @click="$router.push('/cashier')">
              <el-icon><ShoppingCart /></el-icon> 收银开单
            </el-button>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card>
            <template #header><span>今日待办</span></template>
            <div v-if="todayAppointments.length > 0">
              <div v-for="apt in todayAppointments" :key="apt.id" style="padding: 8px 0; border-bottom: 1px solid #eee;">
                <span>{{ apt.memberName || '未知会员' }} - {{ apt.serviceName || '未知服务' }}</span>
                <span style="float: right; color: #999;">{{ apt.startTime || '' }}</span>
              </div>
            </div>
            <el-empty v-else description="暂无待办事项" :image-size="80" />
          </el-card>
        </el-col>
      </el-row>
    </template>

    <!-- 员工：只看排班和待办 -->
    <template v-else>
      <el-row :gutter="20" style="margin-top: 16px">
        <el-col :span="24">
          <el-card>
            <template #header><span>今日待办</span></template>
            <div v-if="todayAppointments.length > 0">
              <div v-for="apt in todayAppointments" :key="apt.id" style="padding: 8px 0; border-bottom: 1px solid #eee;">
                <span>{{ apt.memberName || '未知会员' }} - {{ apt.serviceName || '未知服务' }}</span>
                <span style="float: right; color: #999;">{{ apt.startTime || '' }}</span>
              </div>
            </div>
            <el-empty v-else description="暂无待办事项" :image-size="80" />
          </el-card>
        </el-col>
      </el-row>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

const userName = computed(() => userStore.userInfo?.name || '用户')
const role = computed(() => userStore.role || 'employee')

const isAdminOrManager = computed(() => ['admin', 'manager', 'superadmin'].includes(role.value))
const isCashier = computed(() => role.value === 'cashier')

const roleMap: Record<string, { label: string; desc: string; color: string }> = {
  admin: { label: '管理员', desc: '拥有全部权限，可审核和修改所有订单', color: 'danger' },
  manager: { label: '店长', desc: '可审核和修改订单，管理会员和员工', color: 'warning' },
  cashier: { label: '收银员', desc: '仅可收银开单，不能审核和修改已审核订单', color: 'success' },
  employee: { label: '员工', desc: '仅可查看基础信息', color: 'info' }
}
const roleLabel = computed(() => roleMap[role.value]?.label || '员工')
const roleDesc = computed(() => roleMap[role.value]?.desc || '仅可查看基础信息')
const roleTagColor = computed(() => roleMap[role.value]?.color || 'info')

const todayRevenue = ref(0)
const todayOrders = ref(0)
const totalMembers = ref(0)
const totalEmployees = ref(0)
const todayAppointments = ref<any[]>([])
const pendingUsers = ref<any[]>([])

const loadPendingUsers = async () => {
  if (!isAdminOrManager.value) return
  try {
    const list = await request.get('/users/pending')
    pendingUsers.value = (list || []).map((u: any) => ({ ...u, _assignRole: 'employee' }))
  } catch (e) {
    console.error('加载待审核用户失败:', e)
  }
}

const handleApprove = async (row: any) => {
  if (!row._assignRole) {
    ElMessage.warning('请先选择角色')
    return
  }
  try {
    await request.post(`/users/${row.id}/approve`, { role: row._assignRole })
    ElMessage.success('已通过审核')
    loadPendingUsers()
  } catch (e) {
    ElMessage.error('审核失败')
  }
}

const handleReject = async (row: any) => {
  try {
    await ElMessageBox.confirm(`确定要拒绝 ${row.name || row.username} 的注册申请吗？`, '拒绝确认', { type: 'warning' })
    await request.delete(`/users/${row.id}/reject`)
    ElMessage.success('已拒绝')
    loadPendingUsers()
  } catch (e) {
    if (e !== 'cancel') ElMessage.error('操作失败')
  }
}

onMounted(async () => {
  try {
    const overview = await request.get('/dashboard/overview')
    if (overview) {
      todayRevenue.value = overview.today?.revenue || 0
      todayOrders.value = overview.today?.customerCount || 0
      totalMembers.value = overview.member?.total || 0
      totalEmployees.value = overview.employee?.total || 0
    }

    const today = new Date().toISOString().slice(0, 10)
    const apts = await request.get(`/appointments?date=${today}`)
    if (Array.isArray(apts)) {
      todayAppointments.value = apts
    } else if (apts?.data) {
      todayAppointments.value = apts.data
    }
  } catch (e) {
    console.error('Dashboard数据加载失败:', e)
  }

  loadPendingUsers()
})
</script>

<style scoped>
.dashboard {
  padding: 20px;
}

.identity-card {
  background: linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%);
  border: none;
}

.identity-card :deep(.el-card__body) {
  padding: 16px 20px;
}

.identity-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.identity-name {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.identity-desc {
  font-size: 13px;
  color: #909399;
}
</style>