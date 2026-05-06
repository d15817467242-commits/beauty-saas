<template>
  <div class="member-tab" v-loading="loading">
    <!-- 会员概览 -->
    <el-row :gutter="20" style="margin-bottom: 20px">
      <el-col :span="6">
        <el-card shadow="hover">
          <el-statistic title="会员总数" :value="balanceData.summary?.totalMembers || 0" />
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <el-statistic title="总余额" :value="balanceData.summary?.totalBalance || 0" :precision="2" prefix="¥" />
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <el-statistic title="人均余额" :value="balanceData.summary?.avgBalance || 0" :precision="2" prefix="¥" />
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <el-statistic title="总积分" :value="assetData.points?.total || 0" />
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="20">
      <el-col :span="12">
        <el-card shadow="never">
          <template #header>
            <span>会员余额分布</span>
          </template>
          <div ref="balanceChartRef" style="height: 300px"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="never">
          <template #header>
            <span>会员等级分布</span>
          </template>
          <div ref="levelChartRef" style="height: 300px"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 客情分析 -->
    <el-card shadow="never" style="margin-top: 20px">
      <template #header>
        <div class="card-header">
          <span>客情分析 - 消费排行TOP20</span>
        </div>
      </template>
      <el-table :data="customerData.customers || []" stripe max-height="400">
        <el-table-column prop="memberName" label="会员姓名" width="120" />
        <el-table-column prop="phone" label="手机号" width="130" />
        <el-table-column prop="level" label="等级" width="80">
          <template #default="{ row }">
            <el-tag :type="getLevelType(row.level)">{{ row.level }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="visitCount" label="到店次数" width="100" />
        <el-table-column prop="totalAmount" label="消费金额">
          <template #default="{ row }">
            <span style="color: #67c23a; font-weight: bold">¥{{ row.totalAmount?.toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="avgTicket" label="客单价">
          <template #default="{ row }">
            ¥{{ row.avgTicket?.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="lastVisit" label="最后到店" width="120" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, inject, nextTick } from 'vue'
import * as echarts from 'echarts'

const API_BASE = inject('API_BASE') as string
const token = localStorage.getItem('token') || ''

const props = defineProps<{
  dateRange: [Date, Date] | null
  storeId: string | number
}>()

const loading = ref(false)
const balanceData = ref<any>({})
const assetData = ref<any>({})
const customerData = ref<any>({})

const balanceChartRef = ref<HTMLElement>()
const levelChartRef = ref<HTMLElement>()
let balanceChart: echarts.ECharts | null = null
let levelChart: echarts.ECharts | null = null

const getLevelType = (level: string) => {
  const types: Record<string, string> = {
    vip: 'warning',
    gold: 'success',
    platinum: 'primary',
    diamond: 'danger'
  }
  return types[level] || 'info'
}

const loadData = async () => {
  loading.value = true
  try {
    const params = new URLSearchParams()
    if (props.dateRange) {
      params.append('startDate', props.dateRange[0].toISOString().split('T')[0])
      params.append('endDate', props.dateRange[1].toISOString().split('T')[0])
    }

    // 会员余额统计
    const balanceRes = await fetch(`${API_BASE}/report/member-balance?${params}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    balanceData.value = await balanceRes.json()

    // 资产报表
    const assetRes = await fetch(`${API_BASE}/report/asset?${params}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    assetData.value = await assetRes.json()

    // 客情分析
    const customerRes = await fetch(`${API_BASE}/report/customer?${params}&limit=20`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    customerData.value = await customerRes.json()

    renderCharts()
  } catch (e) {
    console.error('加载会员数据失败', e)
  } finally {
    loading.value = false
  }
}

const renderCharts = () => {
  renderBalanceChart()
  renderLevelChart()
}

const renderBalanceChart = () => {
  if (!balanceChartRef.value) return

  if (!balanceChart) {
    balanceChart = echarts.init(balanceChartRef.value)
  }

  const byRange = balanceData.value.byRange || {}
  const data = Object.entries(byRange).map(([range, stats]: [string, any]) => ({
    name: range,
    value: stats.count
  }))

  const option = {
    tooltip: { trigger: 'item', formatter: '{b}: {c}人 ({d}%)' },
    legend: { orient: 'vertical', left: 'left' },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        data,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        }
      }
    ]
  }

  balanceChart.setOption(option)
}

const renderLevelChart = () => {
  if (!levelChartRef.value) return

  if (!levelChart) {
    levelChart = echarts.init(levelChartRef.value)
  }

  const byLevel = balanceData.value.byLevel || {}
  const data = Object.entries(byLevel).map(([level, stats]: [string, any]) => ({
    name: level,
    value: stats.count
  }))

  const option = {
    tooltip: { trigger: 'item', formatter: '{b}: {c}人 ({d}%)' },
    legend: { orient: 'vertical', left: 'left' },
    series: [
      {
        type: 'pie',
        radius: '60%',
        data,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  }

  levelChart.setOption(option)
}

const refresh = () => {
  loadData()
}

watch(() => [props.dateRange, props.storeId], () => {
  loadData()
})

onMounted(() => {
  loadData()
  nextTick(() => {
    window.addEventListener('resize', () => {
      balanceChart?.resize()
      levelChart?.resize()
    })
  })
})

defineExpose({ refresh })
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
