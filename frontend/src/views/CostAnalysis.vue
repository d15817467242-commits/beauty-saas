<template>
  <div class="cost-analysis-page">
    <el-card class="summary-card">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-statistic title="总库存成本" :value="summary.totalCost" prefix="¥" />
        </el-col>
        <el-col :span="6">
          <el-statistic title="本月采购成本" :value="summary.monthlyPurchaseCost" prefix="¥" />
        </el-col>
        <el-col :span="6">
          <el-statistic title="本月销售成本" :value="summary.monthlySaleCost" prefix="¥" />
        </el-col>
        <el-col :span="6">
          <el-statistic title="成本周转率" :value="summary.turnoverRate" suffix="%" />
        </el-col>
      </el-row>
    </el-card>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="16">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>成本趋势分析</span>
              <el-radio-group v-model="trendPeriod" size="small">
                <el-radio-button value="week">近7天</el-radio-button>
                <el-radio-button value="month">近30天</el-radio-button>
                <el-radio-button value="quarter">近3个月</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div ref="trendChartRef" style="height: 350px;"></div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card>
          <template #header>成本结构分布</template>
          <div ref="structureChartRef" style="height: 350px;"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="12">
        <el-card>
          <template #header>成本TOP10产品</template>
          <el-table :data="topCostProducts" stripe max-height="300">
            <el-table-column prop="name" label="产品名称" />
            <el-table-column prop="stockQuantity" label="库存数量" width="100" />
            <el-table-column prop="avgCost" label="平均成本" width="120">
              <template #default="{ row }">¥{{ row.avgCost?.toFixed(2) || '0.00' }}</template>
            </el-table-column>
            <el-table-column prop="totalCost" label="总成本" width="120">
              <template #default="{ row }">¥{{ row.totalCost?.toFixed(2) || '0.00' }}</template>
            </el-table-column>
            <el-table-column prop="costRatio" label="占比" width="100">
              <template #default="{ row }">{{ row.costRatio?.toFixed(1) || '0' }}%</template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>成本预警</template>
          <el-table :data="costWarnings" stripe max-height="300">
            <el-table-column prop="productName" label="产品名称" />
            <el-table-column prop="warningType" label="预警类型" width="120">
              <template #default="{ row }">
                <el-tag :type="getWarningType(row.warningType)" size="small">
                  {{ getWarningText(row.warningType) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="currentValue" label="当前值" width="100" />
            <el-table-column prop="threshold" label="阈值" width="100" />
            <el-table-column label="操作" width="80">
              <template #default="{ row }">
                <el-button link type="primary" @click="handleWarning(row)">处理</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="24">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>成本分析报表</span>
              <div>
                <el-date-picker
                  v-model="reportDateRange"
                  type="daterange"
                  range-separator="至"
                  start-placeholder="开始日期"
                  end-placeholder="结束日期"
                  size="small"
                />
                <el-button type="primary" size="small" style="margin-left: 10px;" @click="exportReport">导出报表</el-button>
              </div>
            </div>
          </template>
          <el-table :data="costReport" stripe>
            <el-table-column prop="date" label="日期" width="120" />
            <el-table-column prop="purchaseCost" label="采购成本" width="120">
              <template #default="{ row }">¥{{ row.purchaseCost?.toFixed(2) || '0.00' }}</template>
            </el-table-column>
            <el-table-column prop="saleCost" label="销售成本" width="120">
              <template #default="{ row }">¥{{ row.saleCost?.toFixed(2) || '0.00' }}</template>
            </el-table-column>
            <el-table-column prop="stockCost" label="库存成本" width="120">
              <template #default="{ row }">¥{{ row.stockCost?.toFixed(2) || '0.00' }}</template>
            </el-table-column>
            <el-table-column prop="grossProfit" label="毛利润" width="120">
              <template #default="{ row }">
                <span :class="row.grossProfit >= 0 ? 'profit' : 'loss'">
                  ¥{{ row.grossProfit?.toFixed(2) || '0.00' }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="grossMargin" label="毛利率" width="100">
              <template #default="{ row }">
                <span :class="row.grossMargin >= 0 ? 'profit' : 'loss'">
                  {{ row.grossMargin?.toFixed(1) || '0' }}%
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="turnoverDays" label="周转天数" width="100" />
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, watch } from 'vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'

const trendPeriod = ref('month')
const reportDateRange = ref<[Date, Date] | null>(null)

const summary = ref({
  totalCost: 0,
  monthlyPurchaseCost: 0,
  monthlySaleCost: 0,
  turnoverRate: 0
})

const topCostProducts = ref<any[]>([])
const costWarnings = ref<any[]>([])
const costReport = ref<any[]>([])

// 图表
const trendChartRef = ref<HTMLElement>()
const structureChartRef = ref<HTMLElement>()
let trendChart: echarts.ECharts
let structureChart: echarts.ECharts

// 方法
const getWarningType = (type: string) => {
  const map: Record<string, string> = {
    high_cost: 'danger',
    low_turnover: 'warning',
    over_stock: 'info'
  }
  return map[type] || 'warning'
}

const getWarningText = (type: string) => {
  const map: Record<string, string> = {
    high_cost: '成本过高',
    low_turnover: '周转过低',
    over_stock: '库存积压'
  }
  return map[type] || type
}

const handleWarning = (row: any) => {
  ElMessage.info(`处理预警: ${row.productName}`)
}

const exportReport = async () => {
  try {
    const res = await axios.get('/api/inventory/cost-analysis/export', {
      params: {
        startDate: reportDateRange.value?.[0],
        endDate: reportDateRange.value?.[1]
      },
      responseType: 'blob'
    })
    const url = window.URL.createObjectURL(res.data)
    const link = document.createElement('a')
    link.href = url
    link.download = '成本分析报表.xlsx'
    link.click()
    window.URL.revokeObjectURL(url)
  } catch (e) {
    ElMessage.error('导出失败')
  }
}

// 加载数据
const loadData = async () => {
  try {
    const [summaryRes, topRes, warningsRes, reportRes] = await Promise.all([
      axios.get('/api/inventory/cost-analysis/summary'),
      axios.get('/api/inventory/cost-analysis/top-products'),
      axios.get('/api/inventory/cost-analysis/warnings'),
      axios.get('/api/inventory/cost-analysis/report')
    ])
    summary.value = summaryRes.data
    topCostProducts.value = topRes.data
    costWarnings.value = warningsRes.data
    costReport.value = reportRes.data
  } catch (e) {
    ElMessage.error('加载数据失败')
  }
}

// 图表
const initCharts = () => {
  nextTick(() => {
    if (trendChartRef.value) {
      trendChart = echarts.init(trendChartRef.value)
      updateTrendChart()
    }
    if (structureChartRef.value) {
      structureChart = echarts.init(structureChartRef.value)
      structureChart.setOption({
        tooltip: { trigger: 'item' },
        legend: { orient: 'vertical', left: 'left' },
        series: [{
          type: 'pie',
          radius: ['40%', '70%'],
          data: [
            { value: 35000, name: '产品成本' },
            { value: 15000, name: '耗材成本' },
            { value: 8000, name: '设备折旧' },
            { value: 5000, name: '其他成本' }
          ]
        }]
      })
    }
  })
}

const updateTrendChart = () => {
  if (!trendChart) return
  
  // 根据周期生成数据
  let xData: string[] = []
  let purchaseData: number[] = []
  let saleData: number[] = []
  
  if (trendPeriod.value === 'week') {
    xData = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
    purchaseData = [5000, 4200, 5800, 4500, 6200, 4800, 5500]
    saleData = [4800, 5000, 5200, 4600, 5800, 5500, 5000]
  } else if (trendPeriod.value === 'month') {
    for (let i = 1; i <= 30; i++) {
      xData.push(`${i}日`)
      purchaseData.push(Math.floor(Math.random() * 5000) + 3000)
      saleData.push(Math.floor(Math.random() * 5000) + 2500)
    }
  } else {
    for (let i = 1; i <= 12; i++) {
      xData.push(`${i}月`)
      purchaseData.push(Math.floor(Math.random() * 50000) + 30000)
      saleData.push(Math.floor(Math.random() * 45000) + 25000)
    }
  }
  
  trendChart.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: ['采购成本', '销售成本'] },
    xAxis: { type: 'category', data: xData },
    yAxis: { type: 'value' },
    series: [
      {
        name: '采购成本',
        type: 'line',
        smooth: true,
        data: purchaseData,
        itemStyle: { color: '#409EFF' }
      },
      {
        name: '销售成本',
        type: 'line',
        smooth: true,
        data: saleData,
        itemStyle: { color: '#67C23A' }
      }
    ]
  })
}

watch(trendPeriod, () => {
  updateTrendChart()
})

onMounted(() => {
  loadData()
  initCharts()
})
</script>

<style scoped>
.cost-analysis-page {
  padding: 20px;
}
.summary-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
.summary-card :deep(.el-statistic__head) {
  color: rgba(255, 255, 255, 0.8);
}
.summary-card :deep(.el-statistic__content) {
  color: #fff;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.profit {
  color: #67c23a;
  font-weight: bold;
}
.loss {
  color: #f56c6c;
  font-weight: bold;
}
</style>
