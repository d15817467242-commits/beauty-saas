<template>
  <el-card shadow="hover" class="time-slot-analysis-card">
    <template #header>
      <div class="card-header">
        <span>时段分析</span>
        <el-radio-group v-model="viewMode" size="small" @change="updateCharts">
          <el-radio-button label="chart">趋势图</el-radio-button>
          <el-radio-button label="heatmap">热力图</el-radio-button>
        </el-radio-group>
      </div>
    </template>

    <div v-if="viewMode === 'chart'">
      <div ref="trendChartRef" class="chart-container"></div>
      
      <el-row :gutter="20" style="margin-top: 20px">
        <el-col :span="8">
          <div class="peak-info peak-high">
            <div class="peak-title">
              <el-icon><CaretTop /></el-icon>
              高峰时段
            </div>
            <div class="peak-time">{{ peakData.highPeak.time }}</div>
            <div class="peak-value">{{ peakData.highPeak.count }} 人次</div>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="peak-info peak-low">
            <div class="peak-title">
              <el-icon><CaretBottom /></el-icon>
              低谷时段
            </div>
            <div class="peak-time">{{ peakData.lowPeak.time }}</div>
            <div class="peak-value">{{ peakData.lowPeak.count }} 人次</div>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="peak-info peak-avg">
            <div class="peak-title">
              <el-icon><TrendCharts /></el-icon>
              日均客流
            </div>
            <div class="peak-time">{{ peakData.avgPerDay }} 人/天</div>
            <div class="peak-value">高峰/低谷比 {{ peakData.ratio }}:1</div>
          </div>
        </el-col>
      </el-row>
    </div>

    <div v-else>
      <div ref="heatmapChartRef" class="heatmap-container"></div>
    </div>

    <el-divider />

    <el-row :gutter="10">
      <el-col :span="4" v-for="hour in hourlyStats" :key="hour.hour">
        <div class="hour-stat" :class="getHourClass(hour.count)">
          <div class="hour-label">{{ hour.hour }}:00</div>
          <div class="hour-count">{{ hour.count }}</div>
        </div>
      </el-col>
    </el-row>
  </el-card>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, nextTick, computed } from 'vue'
import * as echarts from 'echarts'
import { CaretTop, CaretBottom, TrendCharts } from '@element-plus/icons-vue'
import api from '@/api/index'

interface Props {
  dateRange: [Date, Date] | null
  storeId: string | number
}

const props = defineProps<Props>()

const viewMode = ref<'chart' | 'heatmap'>('chart')
const trendChartRef = ref<HTMLElement>()
const heatmapChartRef = ref<HTMLElement>()

let trendChart: echarts.ECharts | null = null
let heatmapChart: echarts.ECharts | null = null

const hourlyStats = ref<any[]>([])
const weeklyData = ref<any[]>([])

const peakData = ref({
  highPeak: { time: '14:00-16:00', count: 0 },
  lowPeak: { time: '09:00-10:00', count: 0 },
  avgPerDay: 0,
  ratio: 2.5
})

const maxCount = computed(() => {
  return Math.max(...hourlyStats.value.map(h => h.count), 1)
})

const getHourClass = (count: number) => {
  const ratio = count / maxCount.value
  if (ratio >= 0.8) return 'level-high'
  if (ratio >= 0.5) return 'level-medium'
  return 'level-low'
}

const initCharts = () => {
  if (trendChartRef.value) {
    trendChart = echarts.init(trendChartRef.value)
  }
  if (heatmapChartRef.value) {
    heatmapChart = echarts.init(heatmapChartRef.value)
  }
  window.addEventListener('resize', handleResize)
}

const handleResize = () => {
  trendChart?.resize()
  heatmapChart?.resize()
}

const updateCharts = () => {
  if (viewMode.value === 'chart') {
    updateTrendChart()
  } else {
    updateHeatmap()
  }
}

const updateTrendChart = () => {
  if (!trendChart || hourlyStats.value.length === 0) return

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
      data: hourlyStats.value.map(item => `${item.hour}:00`),
      axisLabel: { interval: 1 }
    },
    yAxis: {
      type: 'value',
      name: '客流量'
    },
    series: [{
      type: 'bar',
      data: hourlyStats.value.map(item => ({
        value: item.count,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: item.isPeak ? '#f56c6c' : '#409eff' },
            { offset: 1, color: item.isPeak ? '#fab6b6' : '#79bbff' }
          ])
        }
      })),
      markLine: {
        data: [{ type: 'average', name: '平均值' }],
        lineStyle: { color: '#e6a23c', type: 'dashed' }
      },
      barWidth: '60%'
    }]
  }

  trendChart.setOption(option)
}

const updateHeatmap = () => {
  if (!heatmapChart || weeklyData.value.length === 0) return

  const hours = Array.from({ length: 12 }, (_, i) => `${i + 9}:00`)
  const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

  const option = {
    tooltip: {
      position: 'top',
      formatter: (params: any) => {
        return `${days[params.data[0]]} ${hours[params.data[1]]}<br/>客流: ${params.data[2]}人`
      }
    },
    grid: {
      left: '10%',
      right: '10%',
      top: '10%',
      bottom: '15%'
    },
    xAxis: {
      type: 'category',
      data: days,
      splitArea: { show: true }
    },
    yAxis: {
      type: 'category',
      data: hours,
      splitArea: { show: true }
    },
    visualMap: {
      min: 0,
      max: 30,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: '0%',
      inRange: {
        color: ['#f0f9ff', '#79bbff', '#409eff', '#337ecc']
      }
    },
    series: [{
      type: 'heatmap',
      data: weeklyData.value,
      label: { show: false },
      emphasis: {
        itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0, 0, 0, 0.5)' }
      }
    }]
  }

  heatmapChart.setOption(option)
}

const loadData = async () => {
  try {
    const params = new URLSearchParams()
    if (props.dateRange) {
      params.append('startDate', props.dateRange[0].toISOString().split('T')[0])
      params.append('endDate', props.dateRange[1].toISOString().split('T')[0])
    }
    if (props.storeId) {
      params.append('storeId', String(props.storeId))
    }
    
    const res = await api.get(`/report/time-slot-analysis?${params.toString()}`) as any
    
    if (res) {
      hourlyStats.value = res.hourlyStats || []
      weeklyData.value = res.weeklyData || []
      peakData.value = res.peakData || peakData.value
    }
  } catch (e) {
    console.error('加载时段数据失败', e)
    // 使用模拟数据
    hourlyStats.value = generateMockHourlyData()
    weeklyData.value = generateMockWeeklyData()
    peakData.value = {
      highPeak: { time: '14:00-16:00', count: 45 },
      lowPeak: { time: '09:00-10:00', count: 12 },
      avgPerDay: 156,
      ratio: 3.75
    }
  }
  
  await nextTick()
  updateCharts()
}

const generateMockHourlyData = () => {
  const data = []
  for (let i = 9; i <= 20; i++) {
    let count = Math.floor(Math.random() * 20) + 10
    // 模拟高峰时段
    if (i >= 14 && i <= 16) {
      count = Math.floor(Math.random() * 20) + 35
    }
    data.push({
      hour: i,
      count,
      isPeak: i >= 14 && i <= 16
    })
  }
  return data
}

const generateMockWeeklyData = () => {
  const data = []
  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 12; hour++) {
      let count = Math.floor(Math.random() * 20) + 5
      // 周末客流更多
      if (day >= 5) {
        count = Math.floor(Math.random() * 15) + 15
      }
      // 下午高峰
      if (hour >= 5 && hour <= 7) {
        count += 10
      }
      data.push([day, hour, count])
    }
  }
  return data
}

const refresh = () => {
  loadData()
}

watch(() => [props.dateRange, props.storeId], () => {
  loadData()
}, { deep: true })

onMounted(() => {
  initCharts()
  loadData()
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  trendChart?.dispose()
  heatmapChart?.dispose()
})

defineExpose({ refresh })
</script>

<style scoped>
.time-slot-analysis-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-container {
  height: 250px;
}

.heatmap-container {
  height: 300px;
}

.peak-info {
  padding: 15px;
  border-radius: 8px;
  text-align: center;
}

.peak-high {
  background: linear-gradient(135deg, #fef0f0 0%, #fde2e2 100%);
  border: 1px solid #fbc4c4;
}

.peak-low {
  background: linear-gradient(135deg, #f0f9ff 0%, #e1f3ff 100%);
  border: 1px solid #a0cfff;
}

.peak-avg {
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e7ed 100%);
  border: 1px solid #dcdfe6;
}

.peak-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  font-size: 14px;
  color: #606266;
  margin-bottom: 8px;
}

.peak-time {
  font-size: 18px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 5px;
}

.peak-value {
  font-size: 13px;
  color: #909399;
}

.hour-stat {
  padding: 8px 4px;
  text-align: center;
  border-radius: 4px;
  margin-bottom: 8px;
}

.hour-stat.level-high {
  background: linear-gradient(135deg, #fef0f0 0%, #fde2e2 100%);
}

.hour-stat.level-medium {
  background: linear-gradient(135deg, #fdf6ec 0%, #faecd8 100%);
}

.hour-stat.level-low {
  background: linear-gradient(135deg, #f0f9ff 0%, #e1f3ff 100%);
}

.hour-label {
  font-size: 11px;
  color: #909399;
}

.hour-count {
  font-size: 14px;
  font-weight: bold;
  color: #303133;
}
</style>
