<template>
  <el-card shadow="hover" class="employee-performance-card">
    <template #header>
      <div class="card-header">
        <span>员工业绩排行</span>
        <el-button type="primary" size="small" link @click="showAllEmployees = !showAllEmployees">
          {{ showAllEmployees ? '收起' : '查看全部' }}
        </el-button>
      </div>
    </template>

    <el-table :data="displayEmployees" size="small" v-loading="loading">
      <el-table-column type="index" label="排名" width="60" />
      <el-table-column prop="name" label="员工" width="100">
        <template #default="{ row }">
          <div class="employee-info">
            <el-avatar :size="28" :src="row.avatar">{{ row.name?.charAt(0) }}</el-avatar>
            <span style="margin-left: 8px">{{ row.name }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="serviceCount" label="服务次数" width="90" align="center">
        <template #default="{ row }">
          <el-tag size="small" type="info">{{ row.serviceCount }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="performance" label="业绩金额">
        <template #default="{ row }">
          <span class="performance-value">¥{{ formatNumber(row.performance) }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="commission" label="提成金额">
        <template #default="{ row }">
          <span class="commission-value">¥{{ formatNumber(row.commission) }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="avgTicket" label="客单价" width="100">
        <template #default="{ row }">
          ¥{{ row.avgTicket }}
        </template>
      </el-table-column>
    </el-table>

    <!-- 业绩图表 -->
    <div ref="chartRef" class="chart-container" style="margin-top: 20px"></div>
  </el-card>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, nextTick, computed } from 'vue'
import * as echarts from 'echarts'
import api from '@/api/index'

interface Props {
  dateRange: [Date, Date] | null
  storeId: string | number
}

const props = defineProps<Props>()

const loading = ref(false)
const showAllEmployees = ref(false)
const chartRef = ref<HTMLElement>()
let chartInstance: echarts.ECharts | null = null

const employeeData = ref<any[]>([])

const displayEmployees = computed(() => {
  return showAllEmployees.value ? employeeData.value : employeeData.value.slice(0, 5)
})

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
  if (!chartInstance || employeeData.value.length === 0) return

  const top5 = employeeData.value.slice(0, 5)
  
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    legend: {
      data: ['业绩金额', '提成金额']
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: top5.map(item => item.name)
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: (value: number) => {
          if (value >= 10000) {
            return (value / 10000) + '万'
          }
          return value
        }
      }
    },
    series: [
      {
        name: '业绩金额',
        type: 'bar',
        barWidth: '35%',
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#409eff' },
            { offset: 1, color: '#79bbff' }
          ])
        },
        data: top5.map(item => item.performance)
      },
      {
        name: '提成金额',
        type: 'bar',
        barWidth: '35%',
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#67c23a' },
            { offset: 1, color: '#95d475' }
          ])
        },
        data: top5.map(item => item.commission)
      }
    ]
  }

  chartInstance.setOption(option)
}

const loadEmployeeData = async () => {
  loading.value = true
  try {
    const params = new URLSearchParams()
    if (props.dateRange) {
      params.append('startDate', props.dateRange[0].toISOString().split('T')[0])
      params.append('endDate', props.dateRange[1].toISOString().split('T')[0])
    }
    if (props.storeId) {
      params.append('storeId', String(props.storeId))
    }
    
    const res = await api.get(`/report/employee-performance?${params.toString()}`) as any[]
    
    if (res && Array.isArray(res)) {
      employeeData.value = res
    }
  } catch (e) {
    console.error('加载员工业绩失败', e)
    // 使用模拟数据
    employeeData.value = [
      { name: '张三', serviceCount: 86, performance: 25800, commission: 3870, avgTicket: 300 },
      { name: '李四', serviceCount: 72, performance: 21600, commission: 3240, avgTicket: 300 },
      { name: '王五', serviceCount: 65, performance: 19500, commission: 2925, avgTicket: 300 },
      { name: '赵六', serviceCount: 58, performance: 17400, commission: 2610, avgTicket: 300 },
      { name: '钱七', serviceCount: 52, performance: 15600, commission: 2340, avgTicket: 300 },
      { name: '孙八', serviceCount: 48, performance: 14400, commission: 2160, avgTicket: 300 },
      { name: '周九', serviceCount: 42, performance: 12600, commission: 1890, avgTicket: 300 }
    ]
  } finally {
    loading.value = false
  }
  
  await nextTick()
  updateChart()
}

const refresh = () => {
  loadEmployeeData()
}

watch(() => [props.dateRange, props.storeId], () => {
  loadEmployeeData()
}, { deep: true })

onMounted(() => {
  initChart()
  loadEmployeeData()
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  chartInstance?.dispose()
})

defineExpose({ refresh })
</script>

<style scoped>
.employee-performance-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.employee-info {
  display: flex;
  align-items: center;
}

.performance-value {
  color: #409eff;
  font-weight: 500;
}

.commission-value {
  color: #67c23a;
  font-weight: 500;
}

.chart-container {
  height: 200px;
}
</style>
