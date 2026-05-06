<template>
  <div class="marketing-analysis-page">
    <!-- 时间选择器 -->
    <el-card class="filter-card">
      <el-form :inline="true">
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            :shortcuts="dateShortcuts"
            style="width: 300px;"
            @change="loadAllData"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadAllData">查询</el-button>
          <el-button @click="exportReport">导出报告</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 核心指标卡片 -->
    <el-row :gutter="20" class="metrics-row">
      <el-col :span="6">
        <el-card class="metric-card">
          <div class="metric-icon" style="background: #409EFF;">
            <el-icon size="24"><TrendCharts /></el-icon>
          </div>
          <div class="metric-content">
            <div class="metric-value">{{ formatNumber(metrics.totalRevenue) }}</div>
            <div class="metric-label">营销总收入</div>
            <div class="metric-trend" :class="metrics.revenueTrend >= 0 ? 'up' : 'down'">
              {{ metrics.revenueTrend >= 0 ? '↑' : '↓' }} {{ Math.abs(metrics.revenueTrend || 0).toFixed(1) }}%
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="metric-card">
          <div class="metric-icon" style="background: #67C23A;">
            <el-icon size="24"><User /></el-icon>
          </div>
          <div class="metric-content">
            <div class="metric-value">{{ formatNumber(metrics.newMembers) }}</div>
            <div class="metric-label">新增会员</div>
            <div class="metric-trend" :class="metrics.memberTrend >= 0 ? 'up' : 'down'">
              {{ metrics.memberTrend >= 0 ? '↑' : '↓' }} {{ Math.abs(metrics.memberTrend || 0).toFixed(1) }}%
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="metric-card">
          <div class="metric-icon" style="background: #E6A23C;">
            <el-icon size="24"><Money /></el-icon>
          </div>
          <div class="metric-content">
            <div class="metric-value">{{ metrics.avgROI.toFixed(1) }}%</div>
            <div class="metric-label">平均ROI</div>
            <div class="metric-trend" :class="metrics.roiTrend >= 0 ? 'up' : 'down'">
              {{ metrics.roiTrend >= 0 ? '↑' : '↓' }} {{ Math.abs(metrics.roiTrend || 0).toFixed(1) }}%
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="metric-card">
          <div class="metric-icon" style="background: #F56C6C;">
            <el-icon size="24"><Promotion /></el-icon>
          </div>
          <div class="metric-content">
            <div class="metric-value">{{ metrics.conversionRate.toFixed(1) }}%</div>
            <div class="metric-label">转化率</div>
            <div class="metric-trend" :class="metrics.conversionTrend >= 0 ? 'up' : 'down'">
              {{ metrics.conversionTrend >= 0 ? '↑' : '↓' }} {{ Math.abs(metrics.conversionTrend || 0).toFixed(1) }}%
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="20">
      <!-- ROI趋势图 -->
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>ROI趋势</span>
              <el-radio-group v-model="roiChartType" size="small">
                <el-radio-button value="line">折线图</el-radio-button>
                <el-radio-button value="bar">柱状图</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div ref="roiChartRef" class="chart-container"></div>
        </el-card>
      </el-col>

      <!-- 转化漏斗 -->
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>转化漏斗</span>
          </template>
          <div ref="funnelChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <!-- 活动效果对比 -->
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>活动效果对比</span>
              <el-select v-model="activityCompareType" size="small" style="width: 120px;">
                <el-option label="按收入" value="revenue" />
                <el-option label="按参与人数" value="participants" />
                <el-option label="按ROI" value="roi" />
              </el-select>
            </div>
          </template>
          <div ref="activityChartRef" class="chart-container"></div>
        </el-card>
      </el-col>

      <!-- 优惠券使用分析 -->
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>优惠券使用分析</span>
          </template>
          <div ref="couponChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 活动明细表 -->
    <el-card style="margin-top: 20px;">
      <template #header>
        <div class="card-header">
          <span>活动效果明细</span>
          <el-button type="primary" size="small" @click="exportActivityDetail">导出明细</el-button>
        </div>
      </template>

      <el-table :data="activityDetails" v-loading="detailLoading" stripe>
        <el-table-column prop="name" label="活动名称" min-width="150" />
        <el-table-column prop="type" label="活动类型" width="100">
          <template #default="{ row }">
            <el-tag size="small">{{ activityTypeMap[row.type] || row.type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="startTime" label="开始时间" width="120">
          <template #default="{ row }">
            {{ formatDate(row.startTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="endTime" label="结束时间" width="120">
          <template #default="{ row }">
            {{ formatDate(row.endTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="cost" label="投入成本" width="100">
          <template #default="{ row }">
            ¥{{ formatNumber(row.cost) }}
          </template>
        </el-table-column>
        <el-table-column prop="revenue" label="产生收入" width="100">
          <template #default="{ row }">
            ¥{{ formatNumber(row.revenue) }}
          </template>
        </el-table-column>
        <el-table-column prop="roi" label="ROI" width="80">
          <template #default="{ row }">
            <span :style="{ color: row.roi >= 100 ? '#67C23A' : '#F56C6C' }">
              {{ row.roi.toFixed(1) }}%
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="participants" label="参与人数" width="100" />
        <el-table-column prop="conversions" label="转化人数" width="100" />
        <el-table-column prop="conversionRate" label="转化率" width="80">
          <template #default="{ row }">
            {{ row.conversionRate.toFixed(1) }}%
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ statusMap[row.status] || row.status }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="detailCurrentPage"
        v-model:page-size="detailPageSize"
        :total="detailTotal"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        @size-change="loadActivityDetails"
        @current-change="loadActivityDetails"
        style="margin-top: 16px; justify-content: flex-end;"
      />
    </el-card>

    <!-- 营销建议 -->
    <el-card style="margin-top: 20px;">
      <template #header>
        <span>营销建议</span>
      </template>
      <div class="suggestions">
        <div v-for="(suggestion, index) in suggestions" :key="index" class="suggestion-item">
          <el-icon :size="20" :color="suggestion.color">
            <component :is="suggestion.icon" />
          </el-icon>
          <div class="suggestion-content">
            <div class="suggestion-title">{{ suggestion.title }}</div>
            <div class="suggestion-desc">{{ suggestion.description }}</div>
          </div>
        </div>
        <el-empty v-if="!suggestions.length" description="暂无建议" :image-size="60" />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { TrendCharts, User, Money, Promotion, Warning, SuccessFilled, InfoFilled } from '@element-plus/icons-vue'
import * as echarts from 'echarts'

const API_BASE = 'http://localhost:3000/api'
const token = localStorage.getItem('token') || ''

const activityTypeMap: Record<string, string> = {
  coupon: '优惠券',
  groupBuy: '拼团',
  flashSale: '秒杀',
  newbieGift: '新人礼包',
  referral: '转介绍',
  points: '积分活动'
}

const statusMap: Record<string, string> = {
  active: '进行中',
  upcoming: '即将开始',
  ended: '已结束',
  draft: '草稿'
}

const getStatusType = (status: string) => {
  const map: Record<string, string> = {
    active: 'success',
    upcoming: 'warning',
    ended: 'info',
    draft: 'info'
  }
  return map[status] || 'info'
}

const dateShortcuts = [
  {
    text: '最近7天',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 7)
      return [start, end]
    }
  },
  {
    text: '最近30天',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 30)
      return [start, end]
    }
  },
  {
    text: '本月',
    value: () => {
      const end = new Date()
      const start = new Date(end.getFullYear(), end.getMonth(), 1)
      return [start, end]
    }
  },
  {
    text: '上月',
    value: () => {
      const end = new Date()
      const start = new Date(end.getFullYear(), end.getMonth() - 1, 1)
      end.setTime(new Date(end.getFullYear(), end.getMonth(), 0).getTime())
      return [start, end]
    }
  }
]

const dateRange = ref<[Date, Date] | null>(null)
const roiChartType = ref('line')
const activityCompareType = ref('revenue')
const detailLoading = ref(false)

const roiChartRef = ref<HTMLElement>()
const funnelChartRef = ref<HTMLElement>()
const activityChartRef = ref<HTMLElement>()
const couponChartRef = ref<HTMLElement>()

let roiChart: echarts.ECharts | null = null
let funnelChart: echarts.ECharts | null = null
let activityChart: echarts.ECharts | null = null
let couponChart: echarts.ECharts | null = null

const metrics = ref({
  totalRevenue: 0,
  revenueTrend: 0,
  newMembers: 0,
  memberTrend: 0,
  avgROI: 0,
  roiTrend: 0,
  conversionRate: 0,
  conversionTrend: 0
})

const activityDetails = ref<any[]>([])
const detailTotal = ref(0)
const detailCurrentPage = ref(1)
const detailPageSize = ref(10)

const suggestions = ref<any[]>([])

const formatNumber = (num: number) => {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万'
  }
  return num.toLocaleString()
}

const formatDate = (date: string) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString()
}

// 加载所有数据
const loadAllData = async () => {
  await Promise.all([
    loadMetrics(),
    loadROIData(),
    loadFunnelData(),
    loadActivityCompare(),
    loadCouponAnalysis(),
    loadActivityDetails(),
    loadSuggestions()
  ])
}

// 加载核心指标
const loadMetrics = async () => {
  try {
    const params = new URLSearchParams()
    if (dateRange.value) {
      params.append('startDate', dateRange.value[0].toISOString())
      params.append('endDate', dateRange.value[1].toISOString())
    }
    
    const res = await fetch(`${API_BASE}/marketing-analysis/metrics?${params}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    metrics.value = await res.json()
  } catch (e) {
    console.error('加载指标失败')
  }
}

// 加载ROI数据
const loadROIData = async () => {
  try {
    const params = new URLSearchParams()
    if (dateRange.value) {
      params.append('startDate', dateRange.value[0].toISOString())
      params.append('endDate', dateRange.value[1].toISOString())
    }
    
    const res = await fetch(`${API_BASE}/marketing-analysis/roi-trend?${params}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const data = await res.json()
    renderROIChart(data)
  } catch (e) {
    console.error('加载ROI数据失败')
  }
}

// 渲染ROI图表
const renderROIChart = (data: any) => {
  if (!roiChartRef.value) return
  
  if (!roiChart) {
    roiChart = echarts.init(roiChartRef.value)
  }
  
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    legend: {
      data: ['投入成本', '产生收入', 'ROI']
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: data.dates || []
    },
    yAxis: [
      {
        type: 'value',
        name: '金额(元)',
        position: 'left'
      },
      {
        type: 'value',
        name: 'ROI(%)',
        position: 'right'
      }
    ],
    series: [
      {
        name: '投入成本',
        type: roiChartType.value === 'bar' ? 'bar' : 'line',
        data: data.costs || [],
        itemStyle: { color: '#E6A23C' }
      },
      {
        name: '产生收入',
        type: roiChartType.value === 'bar' ? 'bar' : 'line',
        data: data.revenues || [],
        itemStyle: { color: '#67C23A' }
      },
      {
        name: 'ROI',
        type: 'line',
        yAxisIndex: 1,
        data: data.rois || [],
        itemStyle: { color: '#409EFF' },
        smooth: true
      }
    ]
  }
  
  roiChart.setOption(option)
}

// 加载转化漏斗数据
const loadFunnelData = async () => {
  try {
    const res = await fetch(`${API_BASE}/marketing-analysis/funnel`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const data = await res.json()
    renderFunnelChart(data)
  } catch (e) {
    console.error('加载漏斗数据失败')
  }
}

// 渲染漏斗图
const renderFunnelChart = (data: any) => {
  if (!funnelChartRef.value) return
  
  if (!funnelChart) {
    funnelChart = echarts.init(funnelChartRef.value)
  }
  
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    series: [
      {
        name: '转化漏斗',
        type: 'funnel',
        left: '10%',
        top: 60,
        bottom: 60,
        width: '80%',
        min: 0,
        max: 100,
        minSize: '0%',
        maxSize: '100%',
        sort: 'descending',
        gap: 2,
        label: {
          show: true,
          position: 'inside'
        },
        labelLine: {
          length: 10,
          lineStyle: { width: 1, type: 'solid' }
        },
        itemStyle: {
          borderColor: '#fff',
          borderWidth: 1
        },
        emphasis: {
          label: { fontSize: 14 }
        },
        data: data.map((item: any, index: number) => ({
          name: item.name,
          value: item.value,
          itemStyle: { color: ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#909399'][index] }
        }))
      }
    ]
  }
  
  funnelChart.setOption(option)
}

// 加载活动对比数据
const loadActivityCompare = async () => {
  try {
    const params = new URLSearchParams()
    params.append('type', activityCompareType.value)
    if (dateRange.value) {
      params.append('startDate', dateRange.value[0].toISOString())
      params.append('endDate', dateRange.value[1].toISOString())
    }
    
    const res = await fetch(`${API_BASE}/marketing-analysis/activity-compare?${params}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const data = await res.json()
    renderActivityChart(data)
  } catch (e) {
    console.error('加载活动对比失败')
  }
}

// 渲染活动对比图
const renderActivityChart = (data: any) => {
  if (!activityChartRef.value) return
  
  if (!activityChart) {
    activityChart = echarts.init(activityChartRef.value)
  }
  
  const valueLabel = activityCompareType.value === 'revenue' ? '收入(元)' 
    : activityCompareType.value === 'participants' ? '参与人数' : 'ROI(%)'
  
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
      data: data.names || [],
      axisLabel: {
        rotate: 30,
        interval: 0
      }
    },
    yAxis: {
      type: 'value',
      name: valueLabel
    },
    series: [
      {
        name: valueLabel,
        type: 'bar',
        data: data.values || [],
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#409EFF' },
            { offset: 1, color: '#79bbff' }
          ])
        },
        label: {
          show: true,
          position: 'top'
        }
      }
    ]
  }
  
  activityChart.setOption(option)
}

// 加载优惠券分析
const loadCouponAnalysis = async () => {
  try {
    const params = new URLSearchParams()
    if (dateRange.value) {
      params.append('startDate', dateRange.value[0].toISOString())
      params.append('endDate', dateRange.value[1].toISOString())
    }
    
    const res = await fetch(`${API_BASE}/marketing-analysis/coupon-analysis?${params}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const data = await res.json()
    renderCouponChart(data)
  } catch (e) {
    console.error('加载优惠券分析失败')
  }
}

// 渲染优惠券分析图
const renderCouponChart = (data: any) => {
  if (!couponChartRef.value) return
  
  if (!couponChart) {
    couponChart = echarts.init(couponChartRef.value)
  }
  
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left'
    },
    series: [
      {
        name: '优惠券使用',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: true,
          formatter: '{b}: {d}%'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold'
          }
        },
        data: data.map((item: any, index: number) => ({
          name: item.name,
          value: item.value,
          itemStyle: { color: ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#909399'][index % 5] }
        }))
      }
    ]
  }
  
  couponChart.setOption(option)
}

// 加载活动明细
const loadActivityDetails = async () => {
  detailLoading.value = true
  try {
    const params = new URLSearchParams({
      page: detailCurrentPage.value.toString(),
      pageSize: detailPageSize.value.toString()
    })
    if (dateRange.value) {
      params.append('startDate', dateRange.value[0].toISOString())
      params.append('endDate', dateRange.value[1].toISOString())
    }
    
    const res = await fetch(`${API_BASE}/marketing-analysis/activity-details?${params}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const data = await res.json()
    activityDetails.value = data.list || data
    detailTotal.value = data.total || activityDetails.value.length
  } catch (e) {
    ElMessage.error('加载明细失败')
  } finally {
    detailLoading.value = false
  }
}

// 加载营销建议
const loadSuggestions = async () => {
  try {
    const res = await fetch(`${API_BASE}/marketing-analysis/suggestions`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    suggestions.value = await res.json()
  } catch (e) {
    // 使用默认建议
    suggestions.value = [
      {
        icon: 'SuccessFilled',
        color: '#67C23A',
        title: '优惠券效果良好',
        description: '当前优惠券活动ROI较高，建议增加投放量'
      },
      {
        icon: 'Warning',
        color: '#E6A23C',
        title: '秒杀活动参与度下降',
        description: '建议调整秒杀时间或增加优惠力度'
      },
      {
        icon: 'InfoFilled',
        color: '#409EFF',
        title: '会员活跃度待提升',
        description: '建议增加日常任务奖励，提高会员粘性'
      }
    ]
  }
}

// 导出报告
const exportReport = async () => {
  try {
    const params = new URLSearchParams()
    if (dateRange.value) {
      params.append('startDate', dateRange.value[0].toISOString())
      params.append('endDate', dateRange.value[1].toISOString())
    }
    
    const res = await fetch(`${API_BASE}/marketing-analysis/export?${params}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const blob = await res.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `营销分析报告_${new Date().toISOString().split('T')[0]}.xlsx`
    a.click()
    window.URL.revokeObjectURL(url)
  } catch (e) {
    ElMessage.error('导出失败')
  }
}

// 导出活动明细
const exportActivityDetail = async () => {
  try {
    const params = new URLSearchParams()
    if (dateRange.value) {
      params.append('startDate', dateRange.value[0].toISOString())
      params.append('endDate', dateRange.value[1].toISOString())
    }
    
    const res = await fetch(`${API_BASE}/marketing-analysis/activity-details/export?${params}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const blob = await res.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `活动效果明细_${new Date().toISOString().split('T')[0]}.xlsx`
    a.click()
    window.URL.revokeObjectURL(url)
  } catch (e) {
    ElMessage.error('导出失败')
  }
}

// 监听图表类型变化
watch(roiChartType, () => {
  loadROIData()
})

watch(activityCompareType, () => {
  loadActivityCompare()
})

// 窗口大小变化时重绘图表
const handleResize = () => {
  roiChart?.resize()
  funnelChart?.resize()
  activityChart?.resize()
  couponChart?.resize()
}

onMounted(() => {
  // 默认最近30天
  const end = new Date()
  const start = new Date()
  start.setTime(start.getTime() - 3600 * 1000 * 24 * 30)
  dateRange.value = [start, end]
  
  loadAllData()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  roiChart?.dispose()
  funnelChart?.dispose()
  activityChart?.dispose()
  couponChart?.dispose()
})
</script>

<style scoped>
.marketing-analysis-page {
  padding: 20px;
}

.filter-card {
  margin-bottom: 20px;
}

.metrics-row {
  margin-bottom: 20px;
}

.metric-card {
  display: flex;
  align-items: center;
  padding: 20px;
}

.metric-card :deep(.el-card__body) {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 20px;
}

.metric-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  margin-right: 16px;
}

.metric-content {
  flex: 1;
}

.metric-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
}

.metric-label {
  font-size: 14px;
  color: #909399;
  margin-top: 4px;
}

.metric-trend {
  font-size: 12px;
  margin-top: 4px;
}

.metric-trend.up {
  color: #67C23A;
}

.metric-trend.down {
  color: #F56C6C;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-container {
  height: 300px;
}

.suggestions {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.suggestion-item {
  display: flex;
  align-items: flex-start;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
}

.suggestion-item .el-icon {
  margin-right: 12px;
  flex-shrink: 0;
}

.suggestion-title {
  font-weight: bold;
  margin-bottom: 4px;
}

.suggestion-desc {
  font-size: 13px;
  color: #606266;
}

@media (max-width: 1200px) {
  .suggestions {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .suggestions {
    grid-template-columns: 1fr;
  }
}
</style>
