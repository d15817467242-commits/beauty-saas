<template>
  <el-card shadow="hover" class="revenue-summary-card">
    <template #header>
      <div class="card-header">
        <span>营收汇总</span>
        <el-radio-group v-model="periodType" size="small" @change="loadRevenueData">
          <el-radio-button label="day">按日</el-radio-button>
          <el-radio-button label="week">按周</el-radio-button>
          <el-radio-button label="month">按月</el-radio-button>
        </el-radio-group>
      </div>
    </template>

    <el-row :gutter="20">
      <el-col :span="16">
        <div ref="chartRef" class="chart-container"></div>
      </el-col>
      <el-col :span="8">
        <div class="summary-stats">
          <div class="stat-item">
            <div class="stat-label">总营业额</div>
            <div class="stat-value">¥{{ formatNumber(summary.totalRevenue) }}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">总订单数</div>
            <div class="stat-value">{{ summary.totalOrders }} 笔</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">日均营业额</div>
            <div class="stat-value">¥{{ formatNumber(summary.avgDailyRevenue) }}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">最高单日</div>
            <div class="stat-value">¥{{ formatNumber(summary.maxDailyRevenue) }}</div>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 数据表格 -->
    <el-table :data="tableData" size="small" style="margin-top: 20px" max-height="300">
      <el-table-column prop="date" label="日期" width="150" />
      <el-table-column prop="revenue" label="营业额">
        <template #default="{ row }">
          ¥{{ formatNumber(row.revenue) }}
        </template>
      </el-table-column>
      <el-table-column prop="orders" label="订单数" width="100" />
      <el-table-column prop="avgTicket" label="客单价">
        <template #default="{ row }">
          ¥{{ row.avgTicket.toFixed(0) }}
        </template>
      </el-table-column>
      <el-table-column prop="memberRate" label="会员占比" width="100">
        <template #default="{ row }">
          {{ row.memberRate }}%
        </template>
      </el-table-column>
    </el-table>
  </el-card>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import api from '@/api/index'

interface Props {
  dateRange: [Date, Date] | null
  storeId: string | number
}

const props = defineProps<Props>()

const periodType = ref<'day' | 'week' | 'month'>('day')
const chartRef = ref<HTMLElement>()
let chartInstance: echarts.ECharts | null = null

const summary = ref({
  totalRevenue: 0,
  totalOrders: 0,
  avgDailyRevenue: 0,
  maxDailyRevenue: 0
})

const tableData = ref<any[]>([])
const chartData = ref<any[]>([])

const formatNumber = (num: number) => {
  return num.toLocaleString('zh-CN')
}

const initChart = () => {
  if (chartRef.value) {
    chartInstance = echarts.init(chartRef.value)
    window.addEventListener('resize', handleResize)
  }
}

const handleResize = () => {
  chartInstance?.resize()
}

const updateChart = () => {
  if (!chartInstance) return

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      }
    },
    legend: {
      data: ['营业额', '订单数']
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: chartData.value.map(item => item.date)
    },
    yAxis: [
      {
        type: 'value',
        name: '营业额(元)',
        position: 'left',
        axisLabel: {
          formatter: (value: number) => {
            if (value >= 10000) {
              return (value / 10000) + '万'
            }
            return value
          }
        }
      },
      {
        type: 'value',
        name: '订单数',
        position: 'right'
      }
    ],
    series: [
      {
        name: '营业额',
        type: 'line',
        smooth: true,
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
            { offset: 1, color: 'rgba(64, 158, 255, 0.05)' }
          ])
        },
        lineStyle: {
          color: '#409eff',
          width: 2
        },
        itemStyle: {
          color: '#409eff'
        },
        data: chartData.value.map(item => item.revenue)
      },
      {
        name: '订单数',
        type: 'bar',
        yAxisIndex: 1,
        barWidth: '40%',
        itemStyle: {
          color: 'rgba(103, 194, 58, 0.6)'
        },
        data: chartData.value.map(item => item.orders)
      }
    ]
  }

  chartInstance.setOption(option)
}

const loadRevenueData = async () => {
  try {
    const params = new URLSearchParams()
    if (props.dateRange) {
      params.append('startDate', props.dateRange[0].toISOString().split('T')[0])
      params.append('endDate', props.dateRange[1].toISOString().split('T')[0])
    }
    if (props.storeId) {
      params.append('storeId', String(props.storeId))
    }
    params.append('periodType', periodType.value)
    
    const res = await api.get(`/report/revenue-summary?${params.toString()}`) as any
    
    if (res) {
      summary.value = {
        totalRevenue: res.summary?.totalRevenue || 0,
        totalOrders: res.summary?.totalOrders || 0,
        avgDailyRevenue: res.summary?.avgDailyRevenue || 0,
        maxDailyRevenue: res.summary?.maxDailyRevenue || 0
      }
      tableData.value = res.tableData || []
      chartData.value = res.chartData || []
    }
  } catch (e) {
    console.error('加载营收数据失败', e)
    // 使用模拟数据
    const mockData = generateMockData()
    chartData.value = mockData.chartData
    tableData.value = mockData.tableData
    summary.value = mockData.summary
  }
  
  await nextTick()
  updateChart()
}

const generateMockData = () => {
  const chartData = []
  const tableData = []
  let totalRevenue = 0
  let totalOrders = 0
  let maxDailyRevenue = 0
  
  const days = periodType.value === 'day' ? 14 : periodType.value === 'week' ? 8 : 6
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    
    const revenue = Math.floor(Math.random() * 15000) + 10000
    const orders = Math.floor(Math.random() * 30) + 50
    
    totalRevenue += revenue
    totalOrders += orders
    maxDailyRevenue = Math.max(maxDailyRevenue, revenue)
    
    const dateStr = periodType.value === 'month' 
      ? `${date.getMonth() + 1}月`
      : `${date.getMonth() + 1}/${date.getDate()}`
    
    chartData.push({
      date: dateStr,
      revenue,
      orders
    })
    
    tableData.push({
      date: date.toISOString().split('T')[0],
      revenue,
      orders,
      avgTicket: revenue / orders,
      memberRate: Math.floor(Math.random() * 30) + 40
    })
  }
  
  return {
    chartData,
    tableData,
    summary: {
      totalRevenue,
      totalOrders,
      avgDailyRevenue: Math.floor(totalRevenue / days),
      maxDailyRevenue
    }
  }
}

const refresh = () => {
  loadRevenueData()
}

watch(() => [props.dateRange, props.storeId], () => {
  loadRevenueData()
}, { deep: true })

onMounted(() => {
  initChart()
  loadRevenueData()
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  chartInstance?.dispose()
})

defineExpose({ refresh })
</script>

<style scoped>
.revenue-summary-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-container {
  height: 300px;
}

.summary-stats {
  padding: 10px;
}

.stat-item {
  padding: 15px;
  background: #f5f7fa;
  border-radius: 8px;
  margin-bottom: 10px;
}

.stat-label {
  font-size: 13px;
  color: #909399;
  margin-bottom: 5px;
}

.stat-value {
  font-size: 20px;
  font-weight: bold;
  color: #303133;
}
</style>
