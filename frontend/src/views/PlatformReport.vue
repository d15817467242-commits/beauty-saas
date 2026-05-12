<template>
  <div class="platform-report">
    <el-page-header @back="$router.push('/platform-dashboard')" title="返回工作台">
      <template #content><span style="font-size: 18px;">数据总览</span></template>
    </el-page-header>

    <!-- 门店筛选 -->
    <el-card style="margin-top: 16px">
      <el-row :gutter="16" align="middle">
        <el-col :span="8">
          <el-select v-model="selectedStore" placeholder="选择门店" clearable style="width: 100%" @change="loadData">
            <el-option label="全部门店" value="" />
            <el-option v-for="s in storeList" :key="s.id" :label="s.name" :value="s.id" />
          </el-select>
        </el-col>
        <el-col :span="8">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 100%"
            @change="loadData"
          />
        </el-col>
      </el-row>
    </el-card>

    <!-- 汇总数据 -->
    <el-row :gutter="16" style="margin-top: 16px">
      <el-col :span="6">
        <el-card shadow="hover">
          <el-statistic title="总营收" :value="summary.totalRevenue" prefix="¥" />
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <el-statistic title="消费笔数" :value="summary.orderCount" suffix="笔" />
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <el-statistic title="新增会员" :value="summary.newMembers" suffix="人" />
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <el-statistic title="预约数" :value="summary.appointmentCount" suffix="个" />
        </el-card>
      </el-col>
    </el-row>

    <!-- 门店对比 -->
    <el-card style="margin-top: 16px">
      <template #header><span>门店数据对比</span></template>
      <el-table :data="storeData" stripe border v-loading="loading">
        <el-table-column prop="name" label="门店" min-width="160" />
        <el-table-column label="营收" width="120" align="right">
          <template #default="{ row }">
            <span style="color: #f56c6c; font-weight: 600;">¥{{ row.revenue }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="orderCount" label="消费笔数" width="100" align="center" />
        <el-table-column prop="memberCount" label="会员数" width="100" align="center" />
        <el-table-column prop="employeeCount" label="员工数" width="100" align="center" />
        <el-table-column prop="appointmentCount" label="预约数" width="100" align="center" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import request from '@/utils/request'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const loading = ref(false)
const selectedStore = ref('')
const dateRange = ref<[Date, Date] | null>(null)
const storeList = ref<{ id: string; name: string }[]>(userStore.storeList || [])

const summary = ref({
  totalRevenue: 0,
  orderCount: 0,
  newMembers: 0,
  appointmentCount: 0,
})

const storeData = ref<any[]>([])

onMounted(() => {
  loadData()
})

async function loadData() {
  loading.value = true
  try {
    const params: any = {}
    if (selectedStore.value) params.storeId = selectedStore.value
    if (dateRange.value) {
      params.startDate = dateRange.value[0].toISOString()
      params.endDate = dateRange.value[1].toISOString()
    }
    const res = await request.get('/dashboard/platform-overview', { params })
    if (res) {
      summary.value.totalRevenue = res.revenue?.total || 0
      summary.value.orderCount = 0 // 后续可从消费记录统计
      summary.value.newMembers = res.members?.total || 0
      summary.value.appointmentCount = 0

      storeData.value = (res.stores?.list || []).map((s: any) => ({
        name: s.name,
        revenue: s.revenue,
        orderCount: 0,
        memberCount: s.memberCount,
        employeeCount: s.employeeCount,
        appointmentCount: 0,
      }))
    }
  } catch (e) {
    console.error('数据加载失败:', e)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.platform-report { padding: 20px; }
</style>