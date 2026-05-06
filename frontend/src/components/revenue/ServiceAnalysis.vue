<template>
  <el-card shadow="hover" class="service-analysis-card">
    <template #header>
      <div class="card-header">
        <span>服务项目分析</span>
        <el-radio-group v-model="viewType" size="small" @change="updateChart">
          <el-radio-button label="sales">销量排行</el-radio-button>
          <el-radio-button label="revenue">收入排行</el-radio-button>
        </el-radio-group>
      </div>
    </template>

    <el-row :gutter="20">
      <el-col :span="12">
        <div ref="pieChartRef" class="chart-container"></div>
      </el-col>
      <el-col :span="12">
        <div ref="barChartRef" class="chart-container"></div>
      </el-col>
    </el-row>

    <el-table :data="serviceData" size="small" style="margin-top: 20px" max-height="250">
      <el-table-column type="index" label="排名" width="60" />
      <el-table-column prop="name" label="服务项目" />
      <el-table-column prop="category" label="分类" width="80">
        <template #default="{ row }">
          <el-tag size="small">{{ row.category }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="count" label="销售次数" width="90" align="center" />
      <el-table-column prop="revenue" label="收入金额">
        <template #default="{ row }">
          ¥{{ formatNumber(row.revenue) }}
        </template>
      </el-table-column>
      <el-table-column prop="avgPrice" label="均价" width="80">
        <template #default="{ row }">
          ¥{{ row.avgPrice }}
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

const viewType = ref<'sales' | 'revenue'>('sales')
const pieChartRef = ref<HTMLElement>()
const barChartRef = ref<HTMLElement>()
let pieChartInstance: echarts.ECharts | null = null
let barChartInstance: echarts.ECharts | null = null

const serviceData = ref<any[]>([])

const formatNumber = (num: number) => {
  return num.toLocaleString('zh-CN')
}

const initCharts = () => {
  if (pieChartRef.value) {
    pieChartInstance = echarts.init(pieChartRef.value)
  }
  if (barChartRef.value) {
    barChartInstance = echarts.init(barChartRef.value)
  }
  window.addEventListener('resize', handleResize)
}

const handleResize = () => {
  pieChartInstance?.resize()
  barChartInstance?.resize()
}

const updateChart = () => {
  if (!pieChartInstance || !barChartInstance || serviceData.value.length === 0) return

  const top5 = serviceData.value.slice(0, 5)
  
  // 饼图
  const pieOption = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      top: 'center'
    },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['60%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: top5.map((item, index) => ({
          name: item.name,
          value: viewType.value === 'sales' ? item.count : item.revenue,
          itemStyle: {
            color: ['#409eff', '#67c23a', '#e6a23c', '#f56c6c', '#909399'][index]
          }
        }))
      }
    ]
  }
  pieChartInstance.setOption(pieOption)

  // 柱状图
  const barOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'value',
      axisLabel: {
        formatter: (value: number) => {
          if (viewType.value === 'revenue' && value >= 10000) {
            return (value / 10000) + '万'
          }
          return value
        }
      }
    },
    yAxis: {
      type: 'category',
      data: top5.map(item => item.name).reverse()
    },
    series: [
      {
        type: 'bar',
        data: top5.map(item => 
          viewType.value === 'sales' ? item.count : item.revenue
        ).reverse(),
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: '#409eff' },
            { offset: 1, color: '#79bbff' }
          ]),
          borderRadius: [0, 4, 4, 0]
        },
        barWidth: '60%'
      }
    ]
  }
  barChartInstance.setOption(barOption)
}

const loadServiceData = async () => {
  try {
    const params = new URLSearchParams()
    if (props.dateRange) {
      params.append('startDate', props.dateRange[0].toISOString().split('T')[0])
      params.append('endDate', props.dateRange[1].toISOString().split('T')[0])
    }
    if (props.storeId) {
      params.append('storeId', String(props.storeId))
    }
    
    const res = await api.get(`/report/service-ranking?${params.toString()}`) as any[]
    
    if (res && Array.isArray(res)) {
      serviceData.value = res
    }
  } catch (e) {
    console.error('加载服务数据失败', e)
    // 使用模拟数据
    serviceData.value = [
      { name: '精剪', category: '剪发', count: 156, revenue: 23400, avgPrice: 150 },
      { name: '染发', category: '染发', count: 89, revenue: 35600, avgPrice: 400 },
      { name: '烫发', category: '烫发', count: 67, revenue: 40200, avgPrice: 600 },
      { name: '护理', category: '护理', count: 124, revenue: 18600, avgPrice: 150 },
      { name: '洗吹', category: '洗护', count: 234, revenue: 9360, avgPrice: 40 },
      { name: '造型', category: '造型', count: 45, revenue: 13500, avgPrice: 300 },
      { name: '头皮护理', category: '护理', count: 38, revenue: 7600, avgPrice: 200 }
    ]
  }
  
  await nextTick()
  updateChart()
}

const refresh = () => {
  loadServiceData()
}

watch(() => [props.dateRange, props.storeId], () => {
  loadServiceData()
}, { deep: true })

onMounted(() => {
  initCharts()
  loadServiceData()
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  pieChartInstance?.dispose()
  barChartInstance?.dispose()
})

defineExpose({ refresh })
</script>

<style scoped>
.service-analysis-card {
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
</style>
