<template>
  <div class="revenue-tab" v-loading="loading">
    <!-- 营收汇总卡片 -->
    <el-row :gutter="20" style="margin-bottom: 20px">
      <el-col :span="6">
        <el-card shadow="hover" class="summary-card">
          <el-statistic title="总营收" :value="summary.totalRevenue" :precision="2" prefix="¥" />
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="summary-card">
          <el-statistic title="充值金额" :value="summary.totalRecharge" :precision="2" prefix="¥" />
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="summary-card">
          <el-statistic title="消费金额" :value="summary.totalConsumption" :precision="2" prefix="¥" />
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="summary-card">
          <el-statistic title="订单数" :value="summary.totalCount" />
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="20">
      <el-col :span="12">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <span>营收趋势</span>
              <el-radio-group v-model="groupBy" size="small" @change="loadData">
                <el-radio-button label="day">按天</el-radio-button>
                <el-radio-button label="week">按周</el-radio-button>
                <el-radio-button label="month">按月</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div ref="revenueChartRef" style="height: 300px"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="never">
          <template #header>
            <span>营收构成</span>
          </template>
          <div ref="pieChartRef" style="height: 300px"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 营收利润分析 -->
    <el-card shadow="never" style="margin-top: 20px">
      <template #header>
        <span>营收利润分析</span>
      </template>
      <el-row :gutter="20">
        <el-col :span="6">
          <el-statistic title="总营收" :value="profitData.summary?.totalRevenue || 0" :precision="2" prefix="¥" />
        </el-col>
        <el-col :span="6">
          <el-statistic title="总成本" :value="profitData.summary?.totalCost || 0" :precision="2" prefix="¥" />
        </el-col>
        <el-col :span="6">
          <el-statistic title="总利润" :value="profitData.summary?.totalProfit || 0" :precision="2" prefix="¥" />
        </el-col>
        <el-col :span="6">
          <el-statistic title="利润率" :value="profitData.summary?.profitRate || 0" :precision="2" suffix="%" />
        </el-col>
      </el-row>
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
const summary = ref<any>({})
const trendData = ref<any[]>([])
const profitData = ref<any>({})
const groupBy = ref('day')

const revenueChartRef = ref<HTMLElement>()
const pieChartRef = ref<HTMLElement>()
let revenueChart: echarts.ECharts | null = null
let pieChart: echarts.ECharts | null = null

const loadData = async () => {
  loading.value = true
  try {
    const params = new URLSearchParams()
    if (props.dateRange) {
      params.append('startDate', props.dateRange[0].toISOString().split('T')[0])
      params.append('endDate', props.dateRange[1].toISOString().split('T')[0])
    }
    params.append('groupBy', groupBy.value)

    // 营收汇总
    const summaryRes = await fetch(`${API_BASE}/report/summary?${params}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const summaryResult = await summaryRes.json()
    summary.value = summaryResult.summary || {}
    trendData.value = summaryResult.trend || []

    // 营收利润
    const profitRes = await fetch(`${API_BASE}/report/profit?${params}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    profitData.value = await profitRes.json()

    renderCharts()
  } catch (e) {
    console.error('加载营收数据失败', e)
  } finally {
    loading.value = false
  }
}

const renderCharts = () => {
  renderRevenueChart()
  renderPieChart()
}

const renderRevenueChart = () => {
  if (!revenueChartRef.value) return

  if (!revenueChart) {
    revenueChart = echarts.init(revenueChartRef.value)
  }

  const option = {
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: trendData.value.map(t => t.date),
      axisLabel: { rotate: 45 }
    },
    yAxis: {
      type: 'value',
      axisLabel: { formatter: '¥{value}' }
    },
    series: [
      {
        name: '营收',
        type: 'line',
        smooth: true,
        data: trendData.value.map(t => t.revenue),
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(102, 126, 234, 0.5)' },
            { offset: 1, color: 'rgba(102, 126, 234, 0.1)' }
          ])
        },
        itemStyle: { color: '#667eea' }
      }
    ]
  }

  revenueChart.setOption(option)
}

const renderPieChart = () => {
  if (!pieChartRef.value) return

  if (!pieChart) {
    pieChart = echarts.init(pieChartRef.value)
  }

  const pieData = [
    { name: '充值', value: summary.value.totalRecharge || 0 },
    { name: '消费', value: summary.value.totalConsumption || 0 }
  ]

  const option = {
    tooltip: { trigger: 'item', formatter: '{b}: ¥{c} ({d}%)' },
    legend: { orient: 'vertical', left: 'left' },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: { show: false },
        emphasis: { label: { show: true, fontSize: 16, fontWeight: 'bold' } },
        labelLine: { show: false },
        data: pieData
      }
    ]
  }

  pieChart.setOption(option)
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
      revenueChart?.resize()
      pieChart?.resize()
    })
  })
})

defineExpose({ refresh })
</script>

<style scoped>
.summary-card {
  text-align: center;
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
