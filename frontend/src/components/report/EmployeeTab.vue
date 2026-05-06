<template>
  <div class="employee-tab" v-loading="loading">
    <!-- 员工业绩排行 -->
    <el-card shadow="never" style="margin-bottom: 20px">
      <template #header>
        <div class="card-header">
          <span>员工业绩排行</span>
          <el-button type="primary" size="small" @click="exportData">导出报表</el-button>
        </div>
      </template>
      <el-table :data="employeeData.employees || []" stripe>
        <el-table-column prop="employeeName" label="员工姓名" width="120" />
        <el-table-column prop="position" label="职位" width="100" />
        <el-table-column prop="serviceCount" label="服务次数" width="100" />
        <el-table-column prop="totalSales" label="业绩金额">
          <template #default="{ row }">
            <span style="color: #67c23a; font-weight: bold">¥{{ row.totalSales?.toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="totalCommission" label="提成金额">
          <template #default="{ row }">
            <span style="color: #e6a23c">¥{{ row.totalCommission?.toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="avgTicket" label="客单价">
          <template #default="{ row }">
            ¥{{ row.avgTicket?.toFixed(2) }}
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 图表区域 -->
    <el-row :gutter="20">
      <el-col :span="12">
        <el-card shadow="never">
          <template #header>
            <span>业绩排行图</span>
          </template>
          <div ref="rankChartRef" style="height: 350px"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="never">
          <template #header>
            <span>提成分布</span>
          </template>
          <div ref="commissionChartRef" style="height: 350px"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 员工业务分析 -->
    <el-card shadow="never" style="margin-top: 20px">
      <template #header>
        <span>员工业务分析</span>
      </template>
      <el-row :gutter="20">
        <el-col :span="6">
          <el-statistic title="员工总数" :value="businessData.summary?.totalEmployees || 0" />
        </el-col>
        <el-col :span="6">
          <el-statistic title="总业绩" :value="businessData.summary?.totalAmount || 0" :precision="2" prefix="¥" />
        </el-col>
        <el-col :span="6">
          <el-statistic title="总服务数" :value="businessData.summary?.totalCount || 0" />
        </el-col>
        <el-col :span="6">
          <el-statistic title="人均业绩" :value="avgPerEmployee" :precision="2" prefix="¥" />
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, inject, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'

const API_BASE = inject('API_BASE') as string
const token = localStorage.getItem('token') || ''

const props = defineProps<{
  dateRange: [Date, Date] | null
  storeId: string | number
}>()

const loading = ref(false)
const employeeData = ref<any>({})
const businessData = ref<any>({})

const rankChartRef = ref<HTMLElement>()
const commissionChartRef = ref<HTMLElement>()
let rankChart: echarts.ECharts | null = null
let commissionChart: echarts.ECharts | null = null

const avgPerEmployee = computed(() => {
  const total = businessData.value.summary?.totalAmount || 0
  const count = businessData.value.summary?.totalEmployees || 1
  return total / count
})

const loadData = async () => {
  loading.value = true
  try {
    const params = new URLSearchParams()
    if (props.dateRange) {
      params.append('startDate', props.dateRange[0].toISOString().split('T')[0])
      params.append('endDate', props.dateRange[1].toISOString().split('T')[0])
    }

    // 员工业绩
    const laborRes = await fetch(`${API_BASE}/report/labor?${params}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    employeeData.value = await laborRes.json()

    // 员工业务分析
    const businessRes = await fetch(`${API_BASE}/report/employee-business?${params}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    businessData.value = await businessRes.json()

    renderCharts()
  } catch (e) {
    console.error('加载员工数据失败', e)
  } finally {
    loading.value = false
  }
}

const renderCharts = () => {
  renderRankChart()
  renderCommissionChart()
}

const renderRankChart = () => {
  if (!rankChartRef.value) return

  if (!rankChart) {
    rankChart = echarts.init(rankChartRef.value)
  }

  const employees = (employeeData.value.employees || []).slice(0, 10)
  const names = employees.map((e: any) => e.employeeName)
  const sales = employees.map((e: any) => e.totalSales)

  const option = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'value', axisLabel: { formatter: '¥{value}' } },
    yAxis: { type: 'category', data: names.reverse() },
    series: [
      {
        type: 'bar',
        data: sales.reverse(),
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: '#667eea' },
            { offset: 1, color: '#764ba2' }
          ])
        }
      }
    ]
  }

  rankChart.setOption(option)
}

const renderCommissionChart = () => {
  if (!commissionChartRef.value) return

  if (!commissionChart) {
    commissionChart = echarts.init(commissionChartRef.value)
  }

  const employees = (employeeData.value.employees || []).slice(0, 10)
  const names = employees.map((e: any) => e.employeeName)
  const commissions = employees.map((e: any) => e.totalCommission)

  const option = {
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: names,
      axisLabel: { rotate: 45 }
    },
    yAxis: { type: 'value', axisLabel: { formatter: '¥{value}' } },
    series: [
      {
        type: 'bar',
        data: commissions,
        itemStyle: { color: '#e6a23c' }
      }
    ]
  }

  commissionChart.setOption(option)
}

const exportData = () => {
  ElMessage.success('导出功能开发中')
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
      rankChart?.resize()
      commissionChart?.resize()
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
