<template>
  <div class="report-page">
    <!-- 概览卡片 -->
    <el-row :gutter="20" style="margin-bottom: 20px">
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="stat-label">今日营业额</div>
            <div class="stat-value">¥{{ overview.today?.amount || 0 }}</div>
            <div class="stat-extra">{{ overview.today?.count || 0 }} 笔</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="stat-label">本月营业额</div>
            <div class="stat-value">¥{{ overview.month?.amount || 0 }}</div>
            <div class="stat-extra">{{ overview.month?.count || 0 }} 笔</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="stat-label">累计营业额</div>
            <div class="stat-value">¥{{ overview.total?.amount || 0 }}</div>
            <div class="stat-extra">{{ overview.total?.memberCount || 0 }} 会员</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="stat-label">累计提成</div>
            <div class="stat-value">¥{{ overview.total?.commission || 0 }}</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 趋势图 -->
    <el-row :gutter="20" style="margin-bottom: 20px">
      <el-col :span="16">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>营业趋势（近7天）</span>
            </div>
          </template>
          <div class="trend-chart">
            <div class="chart-bars">
              <div 
                v-for="(item, index) in trendData" 
                :key="index" 
                class="chart-bar"
                :style="{ height: getBarHeight(item.amount) + '%' }"
              >
                <div class="bar-tooltip">
                  ¥{{ item.amount }}<br>
                  {{ item.count }}笔
                </div>
              </div>
            </div>
            <div class="chart-labels">
              <div v-for="(item, index) in trendData" :key="index" class="chart-label">
                {{ formatDate(item.date) }}
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card>
          <template #header>
            <span>今日支付方式</span>
          </template>
          <div v-if="dailyReport.byPaymentMethod" class="payment-methods">
            <div v-for="(amount, method) in dailyReport.byPaymentMethod" :key="method" class="method-item">
              <span class="method-label">{{ paymentMethodMap[method] || method }}</span>
              <span class="method-amount">¥{{ amount }}</span>
            </div>
          </div>
          <el-empty v-else description="暂无数据" />
        </el-card>
      </el-col>
    </el-row>

    <!-- 员工业绩和服务排行 -->
    <el-row :gutter="20">
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>员工业绩排行</span>
              <el-date-picker
                v-model="employeeDateRange"
                type="daterange"
                size="small"
                @change="loadEmployeePerformance"
              />
            </div>
          </template>
          <el-table :data="employeePerformance" size="small" v-loading="employeeLoading">
            <el-table-column prop="employeeName" label="员工" width="100" />
            <el-table-column prop="position" label="职位" width="80" />
            <el-table-column prop="serviceCount" label="服务次数" width="80" />
            <el-table-column prop="totalSales" label="业绩">
              <template #default="{ row }">
                ¥{{ row.totalSales }}
              </template>
            </el-table-column>
            <el-table-column prop="totalCommission" label="提成">
              <template #default="{ row }">
                ¥{{ row.totalCommission }}
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>服务销售排行</span>
              <el-date-picker
                v-model="serviceDateRange"
                type="daterange"
                size="small"
                @change="loadServiceRanking"
              />
            </div>
          </template>
          <el-table :data="serviceRanking" size="small" v-loading="serviceLoading">
            <el-table-column prop="serviceName" label="服务项目" />
            <el-table-column prop="count" label="销售次数" width="100" />
            <el-table-column prop="totalAmount" label="销售金额">
              <template #default="{ row }">
                ¥{{ row.totalAmount }}
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <!-- 烫染转化率和客流趋势 -->
    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>烫染转化率统计</span>
              <el-date-picker
                v-model="permDyeDateRange"
                type="daterange"
                size="small"
                @change="loadPermDyeConversion"
              />
            </div>
          </template>
          <div v-if="permDyeData.summary" class="perm-dye-stats">
            <el-row :gutter="20">
              <el-col :span="6">
                <el-statistic title="总客户数" :value="permDyeData.summary.totalCustomers" />
              </el-col>
              <el-col :span="6">
                <el-statistic title="烫染客户" :value="permDyeData.summary.permDyeCustomers" />
              </el-col>
              <el-col :span="6">
                <el-statistic title="转化率" :value="permDyeData.summary.conversionRate" suffix="%" />
              </el-col>
              <el-col :span="6">
                <el-statistic title="烫染项目" :value="permDyeData.summary.permDyeServices" />
              </el-col>
            </el-row>
            <el-divider />
            <h4>烫染服务排行</h4>
            <el-table :data="permDyeData.permDyeRanking || []" size="small" max-height="200">
              <el-table-column prop="serviceName" label="服务项目" />
              <el-table-column prop="count" label="销售次数" width="100" />
              <el-table-column prop="amount" label="销售金额" width="120">
                <template #default="{ row }">
                  ¥{{ row.amount }}
                </template>
              </el-table-column>
            </el-table>
          </div>
          <el-empty v-else description="暂无数据" />
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>客流趋势分析</span>
              <div>
                <el-date-picker
                  v-model="customerFlowDateRange"
                  type="daterange"
                  size="small"
                  style="margin-right: 10px"
                  @change="loadCustomerFlow"
                />
                <el-select v-model="customerFlowGroupBy" size="small" @change="loadCustomerFlow">
                  <el-option value="day" label="按天" />
                  <el-option value="week" label="按周" />
                  <el-option value="month" label="按月" />
                </el-select>
              </div>
            </div>
          </template>
          <div v-if="customerFlowData.summary" class="customer-flow-stats">
            <el-row :gutter="20">
              <el-col :span="6">
                <el-statistic title="总客流" :value="customerFlowData.summary.totalCustomerCount" />
              </el-col>
              <el-col :span="6">
                <el-statistic title="新客户" :value="customerFlowData.summary.totalNewCustomerCount" />
              </el-col>
              <el-col :span="6">
                <el-statistic title="老客户" :value="customerFlowData.summary.totalOldCustomerCount" />
              </el-col>
              <el-col :span="6">
                <el-statistic title="日均客流" :value="customerFlowData.summary.avgDailyCustomers" />
              </el-col>
            </el-row>
            <el-divider />
            <h4>高峰时段分析</h4>
            <div class="peak-hours">
              <el-tag 
                v-for="item in customerFlowData.peakHoursAnalysis || []" 
                :key="item.hour"
                type="primary"
                style="margin: 5px"
              >
                {{ item.hour }}:00 - {{ item.count }}次
              </el-tag>
            </div>
          </div>
          <el-empty v-else description="暂无数据" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'

const API_BASE = 'http://localhost:3000/api'
const token = localStorage.getItem('token') || ''

const paymentMethodMap: Record<string, string> = {
  cash: '现金',
  wechat: '微信',
  alipay: '支付宝',
  card: '会员卡',
  count_card: '次卡',
  mixed: '混合支付'
}

const overview = ref<any>({})
const trendData = ref<any[]>([])
const dailyReport = ref<any>({})
const employeePerformance = ref<any[]>([])
const serviceRanking = ref<any[]>([])
const employeeLoading = ref(false)
const serviceLoading = ref(false)

const employeeDateRange = ref<[Date, Date] | null>(null)
const serviceDateRange = ref<[Date, Date] | null>(null)
const permDyeDateRange = ref<[Date, Date] | null>(null)
const customerFlowDateRange = ref<[Date, Date] | null>(null)
const customerFlowGroupBy = ref('day')

const permDyeData = ref<any>({})
const customerFlowData = ref<any>({})

const maxTrendAmount = computed(() => {
  return Math.max(...trendData.value.map(t => t.amount), 1)
})

const getBarHeight = (amount: number) => {
  return (amount / maxTrendAmount.value) * 100
}

const formatDate = (date: string) => {
  const d = new Date(date)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

const loadOverview = async () => {
  try {
    const res = await fetch(`${API_BASE}/report/overview`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    overview.value = await res.json()
  } catch (e) {
    console.error(e)
  }
}

const loadTrend = async () => {
  try {
    const res = await fetch(`${API_BASE}/report/trend?days=7`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    trendData.value = await res.json()
  } catch (e) {
    console.error(e)
  }
}

const loadDailyReport = async () => {
  try {
    const today = new Date().toISOString().split('T')[0]
    const res = await fetch(`${API_BASE}/report/daily?date=${today}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    dailyReport.value = await res.json()
  } catch (e) {
    console.error(e)
  }
}

const loadEmployeePerformance = async () => {
  employeeLoading.value = true
  try {
    let start = ''
    let end = ''
    if (employeeDateRange.value) {
      start = new Date(employeeDateRange.value[0]).toISOString().split('T')[0]
      end = new Date(employeeDateRange.value[1]).toISOString().split('T')[0]
    }
    const res = await fetch(`${API_BASE}/report/employee-performance?startDate=${start}&endDate=${end}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    employeePerformance.value = await res.json()
  } catch (e) {
    ElMessage.error('加载员工业绩失败')
  } finally {
    employeeLoading.value = false
  }
}

const loadServiceRanking = async () => {
  serviceLoading.value = true
  try {
    let start = ''
    let end = ''
    if (serviceDateRange.value) {
      start = new Date(serviceDateRange.value[0]).toISOString().split('T')[0]
      end = new Date(serviceDateRange.value[1]).toISOString().split('T')[0]
    }
    const res = await fetch(`${API_BASE}/report/service-ranking?startDate=${start}&endDate=${end}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    serviceRanking.value = await res.json()
  } catch (e) {
    ElMessage.error('加载服务排行失败')
  } finally {
    serviceLoading.value = false
  }
}

const loadPermDyeConversion = async () => {
  try {
    let start = ''
    let end = ''
    if (permDyeDateRange.value) {
      start = new Date(permDyeDateRange.value[0]).toISOString().split('T')[0]
      end = new Date(permDyeDateRange.value[1]).toISOString().split('T')[0]
    }
    const res = await fetch(`${API_BASE}/report/perm-dye-conversion?startDate=${start}&endDate=${end}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    permDyeData.value = await res.json()
  } catch (e) {
    console.error('加载烫染转化率失败', e)
  }
}

const loadCustomerFlow = async () => {
  try {
    let start = ''
    let end = ''
    if (customerFlowDateRange.value) {
      start = new Date(customerFlowDateRange.value[0]).toISOString().split('T')[0]
      end = new Date(customerFlowDateRange.value[1]).toISOString().split('T')[0]
    }
    const res = await fetch(`${API_BASE}/report/customer-flow?startDate=${start}&endDate=${end}&groupBy=${customerFlowGroupBy.value}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    customerFlowData.value = await res.json()
  } catch (e) {
    console.error('加载客流趋势失败', e)
  }
}

onMounted(() => {
  loadOverview()
  loadTrend()
  loadDailyReport()
  loadEmployeePerformance()
  loadServiceRanking()
  loadPermDyeConversion()
  loadCustomerFlow()
})
</script>

<style scoped>
.report-page {
  padding: 20px;
}

.stat-card {
  text-align: center;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 10px;
}

.stat-value {
  font-size: 28px;
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

.trend-chart {
  height: 200px;
  display: flex;
  flex-direction: column;
}

.chart-bars {
  flex: 1;
  display: flex;
  align-items: flex-end;
  gap: 10px;
  padding-bottom: 10px;
}

.chart-bar {
  flex: 1;
  background: linear-gradient(to top, #409eff, #79bbff);
  border-radius: 4px 4px 0 0;
  min-height: 10px;
  position: relative;
  cursor: pointer;
  transition: all 0.3s;
}

.chart-bar:hover {
  background: linear-gradient(to top, #66b1ff, #a0cfff);
}

.bar-tooltip {
  display: none;
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: #303133;
  color: #fff;
  padding: 5px 10px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
  z-index: 10;
}

.chart-bar:hover .bar-tooltip {
  display: block;
}

.chart-labels {
  display: flex;
  gap: 10px;
}

.chart-label {
  flex: 1;
  text-align: center;
  font-size: 12px;
  color: #909399;
}

.payment-methods {
  padding: 10px 0;
}

.method-item {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid #ebeef5;
}

.method-item:last-child {
  border-bottom: none;
}

.method-label {
  color: #606266;
}

.method-amount {
  font-weight: bold;
  color: #303133;
}
</style>
