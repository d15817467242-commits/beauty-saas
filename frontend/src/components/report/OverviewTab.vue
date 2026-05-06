<template>
  <div class="overview-tab" v-loading="loading">
    <!-- 概览卡片 -->
    <el-row :gutter="20" style="margin-bottom: 20px">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)">
            <el-icon size="32"><Money /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-label">今日营业额</div>
            <div class="stat-value">¥{{ formatMoney(data.today?.revenue || 0) }}</div>
            <div class="stat-extra">{{ data.today?.count || 0 }} 笔</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%)">
            <el-icon size="32"><TrendCharts /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-label">本月营业额</div>
            <div class="stat-value">¥{{ formatMoney(data.month?.revenue || 0) }}</div>
            <div class="stat-extra">{{ data.month?.count || 0 }} 笔</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)">
            <el-icon size="32"><User /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-label">会员总数</div>
            <div class="stat-value">{{ data.member?.total || 0 }}</div>
            <div class="stat-extra">本月新增 {{ data.member?.newThisMonth || 0 }}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)">
            <el-icon size="32"><Avatar /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-label">员工总数</div>
            <div class="stat-value">{{ data.employee?.total || 0 }}</div>
            <div class="stat-extra">在职员工</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 目标概览 -->
    <el-card shadow="never" style="margin-bottom: 20px">
      <template #header>
        <div class="card-header">
          <span>目标概览</span>
          <el-button type="primary" size="small" @click="showTargetDialog = true">设置目标</el-button>
        </div>
      </template>
      <el-row :gutter="20">
        <el-col :span="8" v-for="target in targetData.targets" :key="target.id">
          <div class="target-item">
            <div class="target-name">{{ target.name }}</div>
            <el-progress 
              :percentage="target.completionRate" 
              :status="target.status === 'completed' ? 'success' : undefined"
              :stroke-width="20"
            />
            <div class="target-detail">
              <span>目标: ¥{{ formatMoney(target.targetAmount) }}</span>
              <span>完成: ¥{{ formatMoney(target.actualAmount) }}</span>
            </div>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <!-- 营收趋势图 -->
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>营收趋势</span>
          <el-radio-group v-model="trendGroupBy" size="small" @change="loadTrendData">
            <el-radio-button label="day">按天</el-radio-button>
            <el-radio-button label="week">按周</el-radio-button>
            <el-radio-button label="month">按月</el-radio-button>
          </el-radio-group>
        </div>
      </template>
      <div ref="trendChartRef" style="height: 350px"></div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, inject, nextTick } from 'vue'
import { Money, TrendCharts, User, Avatar } from '@element-plus/icons-vue'
import * as echarts from 'echarts'

const API_BASE = inject('API_BASE') as string
const token = localStorage.getItem('token') || ''

const props = defineProps<{
  dateRange: [Date, Date] | null
  storeId: string | number
}>()

const loading = ref(false)
const data = ref<any>({})
const targetData = ref<any>({ targets: [] })
const trendGroupBy = ref('day')
const trendChartRef = ref<HTMLElement>()
let trendChart: echarts.ECharts | null = null

const formatMoney = (value: number) => {
  return value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const loadData = async () => {
  loading.value = true
  try {
    const res = await fetch(`${API_BASE}/report/overview`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    data.value = await res.json()
  } catch (e) {
    console.error('加载概览数据失败', e)
  } finally {
    loading.value = false
  }
}

const loadTargetData = async () => {
  try {
    const res = await fetch(`${API_BASE}/report/target`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    targetData.value = await res.json()
  } catch (e) {
    console.error('加载目标数据失败', e)
  }
}

const loadTrendData = async () => {
  try {
    const params = new URLSearchParams()
    if (props.dateRange) {
      params.append('startDate', props.dateRange[0].toISOString().split('T')[0])
      params.append('endDate', props.dateRange[1].toISOString().split('T')[0])
    }
    params.append('groupBy', trendGroupBy.value)

    const res = await fetch(`${API_BASE}/report/trend?${params}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const result = await res.json()
    renderTrendChart(result.trend || [])
  } catch (e) {
    console.error('加载趋势数据失败', e)
  }
}

const renderTrendChart = (trendData: any[]) => {
  if (!trendChartRef.value) return

  if (!trendChart) {
    trendChart = echarts.init(trendChartRef.value)
  }

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: trendData.map(t => t.date),
      axisLabel: { rotate: 45 }
    },
    yAxis: [
      {
        type: 'value',
        name: '金额',
        axisLabel: { formatter: '¥{value}' }
      },
      {
        type: 'value',
        name: '笔数',
        position: 'right'
      }
    ],
    series: [
      {
        name: '营收金额',
        type: 'bar',
        data: trendData.map(t => t.amount),
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#667eea' },
            { offset: 1, color: '#764ba2' }
          ])
        }
      },
      {
        name: '订单笔数',
        type: 'line',
        yAxisIndex: 1,
        data: trendData.map(t => t.count),
        smooth: true,
        itemStyle: { color: '#f5576c' }
      }
    ]
  }

  trendChart.setOption(option)
}

const refresh = () => {
  loadData()
  loadTargetData()
  loadTrendData()
}

watch(() => [props.dateRange, props.storeId], () => {
  refresh()
})

onMounted(() => {
  refresh()
  nextTick(() => {
    window.addEventListener('resize', () => trendChart?.resize())
  })
})

defineExpose({ refresh })
</script>

<style scoped>
.stat-card {
  display: flex;
  align-items: center;
  padding: 20px;
}

.stat-card :deep(.el-card__body) {
  display: flex;
  align-items: center;
  width: 100%;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  margin-right: 15px;
}

.stat-info {
  flex: 1;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}

.stat-extra {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.target-item {
  padding: 15px;
  background: #f5f7fa;
  border-radius: 8px;
  margin-bottom: 15px;
}

.target-name {
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 10px;
}

.target-detail {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #909399;
  margin-top: 10px;
}
</style>
