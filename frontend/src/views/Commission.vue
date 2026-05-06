<template>
  <div class="commission-page">
    <!-- 提成概览 -->
    <el-row :gutter="20" class="overview-cards">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <el-icon :size="40" color="#409EFF"><Money /></el-icon>
            <div class="stat-info">
              <div class="stat-value">¥{{ overview.totalCommission }}</div>
              <div class="stat-label">本月总提成</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <el-icon :size="40" color="#67C23A"><TrendCharts /></el-icon>
            <div class="stat-info">
              <div class="stat-value">¥{{ overview.totalSales }}</div>
              <div class="stat-label">本月总业绩</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <el-icon :size="40" color="#E6A23C"><User /></el-icon>
            <div class="stat-info">
              <div class="stat-value">{{ overview.employeeCount }}</div>
              <div class="stat-label">参与提成员工</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <el-icon :size="40" color="#F56C6C"><DataAnalysis /></el-icon>
            <div class="stat-info">
              <div class="stat-value">{{ overview.avgRate }}%</div>
              <div class="stat-label">平均提成比例</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-tabs v-model="activeTab" class="commission-tabs">
      <!-- 提成规则配置 -->
      <el-tab-pane label="提成规则" name="rules">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>提成规则配置</span>
              <el-button type="primary" @click="handleAddRule">新增规则</el-button>
            </div>
          </template>

          <el-table :data="ruleList" v-loading="rulesLoading" stripe>
            <el-table-column prop="name" label="规则名称" width="150" />
            <el-table-column prop="type" label="规则类型" width="120">
              <template #default="{ row }">
                <el-tag :type="ruleTypeMap[row.type]?.type">
                  {{ ruleTypeMap[row.type]?.label || row.type }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="target" label="适用对象" width="150">
              <template #default="{ row }">
                <span v-if="row.type === 'position'">{{ row.target }}</span>
                <span v-else-if="row.type === 'service'">{{ row.targetName }}</span>
                <span v-else>全部员工</span>
              </template>
            </el-table-column>
            <el-table-column label="提成方式" width="200">
              <template #default="{ row }">
                <span v-if="row.rateType === 'percent'">按比例 {{ row.rate }}%</span>
                <span v-else-if="row.rateType === 'fixed'">固定金额 ¥{{ row.fixedAmount }}</span>
                <span v-else>阶梯提成</span>
              </template>
            </el-table-column>
            <el-table-column prop="minAmount" label="最低业绩" width="120">
              <template #default="{ row }">
                {{ row.minAmount ? `¥${row.minAmount}` : '-' }}
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-switch v-model="row.status" active-value="active" inactive-value="inactive" @change="handleRuleStatusChange(row)" />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150">
              <template #default="{ row }">
                <el-button size="small" @click="handleEditRule(row)">编辑</el-button>
                <el-button size="small" type="danger" @click="handleDeleteRule(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>

      <!-- 提成记录查询 -->
      <el-tab-pane label="提成记录" name="records">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>提成记录</span>
              <div class="filter-bar">
                <el-date-picker
                  v-model="recordDateRange"
                  type="daterange"
                  range-separator="至"
                  start-placeholder="开始日期"
                  end-placeholder="结束日期"
                  @change="loadRecords"
                />
                <el-select v-model="filterEmployeeId" placeholder="选择员工" clearable @change="loadRecords" style="margin-left: 10px; width: 150px;">
                  <el-option v-for="e in employeeList" :key="e.id" :label="e.name" :value="e.id" />
                </el-select>
                <el-button type="primary" style="margin-left: 10px;" @click="handleExport">导出</el-button>
              </div>
            </div>
          </template>

          <el-table :data="recordList" v-loading="recordsLoading" stripe>
            <el-table-column prop="date" label="日期" width="120">
              <template #default="{ row }">
                {{ formatDate(row.date) }}
              </template>
            </el-table-column>
            <el-table-column prop="employee.name" label="员工" width="100" />
            <el-table-column prop="employee.position" label="职位" width="100" />
            <el-table-column prop="orderNo" label="订单号" width="150" />
            <el-table-column prop="serviceName" label="服务项目" width="150" />
            <el-table-column prop="orderAmount" label="订单金额" width="120">
              <template #default="{ row }">
                ¥{{ row.orderAmount }}
              </template>
            </el-table-column>
            <el-table-column prop="commissionRate" label="提成比例" width="100">
              <template #default="{ row }">
                {{ row.commissionRate }}%
              </template>
            </el-table-column>
            <el-table-column prop="commissionAmount" label="提成金额" width="120">
              <template #default="{ row }">
                <span style="color: #67C23A; font-weight: bold;">¥{{ row.commissionAmount }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="ruleName" label="适用规则" width="150" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.status === 'settled' ? 'success' : 'warning'">
                  {{ row.status === 'settled' ? '已结算' : '待结算' }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>

          <el-pagination
            v-model:current-page="recordPage"
            v-model:page-size="recordPageSize"
            :total="recordTotal"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="loadRecords"
            @current-change="loadRecords"
            style="margin-top: 20px; justify-content: flex-end;"
          />
        </el-card>
      </el-tab-pane>

      <!-- 提成统计报表 -->
      <el-tab-pane label="统计报表" name="stats">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>提成统计报表</span>
              <div class="filter-bar">
                <el-date-picker
                  v-model="statsMonth"
                  type="month"
                  placeholder="选择月份"
                  @change="loadStats"
                />
                <el-button type="primary" style="margin-left: 10px;" @click="handleExportStats">导出报表</el-button>
              </div>
            </div>
          </template>

          <!-- 员工提成排行 -->
          <el-row :gutter="20">
            <el-col :span="12">
              <div class="chart-title">员工提成排行</div>
              <div ref="rankChartRef" style="height: 400px;"></div>
            </el-col>
            <el-col :span="12">
              <div class="chart-title">提成趋势图</div>
              <div ref="trendChartRef" style="height: 400px;"></div>
            </el-col>
          </el-row>

          <!-- 员工提成明细表 -->
          <el-divider>员工提成明细</el-divider>
          <el-table :data="employeeStats" v-loading="statsLoading" stripe show-summary :summary-method="getSummary">
            <el-table-column type="index" label="排名" width="60" />
            <el-table-column prop="employeeName" label="员工" width="100" />
            <el-table-column prop="position" label="职位" width="100" />
            <el-table-column prop="orderCount" label="服务单数" width="100" />
            <el-table-column prop="totalSales" label="总业绩" width="120">
              <template #default="{ row }">
                ¥{{ row.totalSales }}
              </template>
            </el-table-column>
            <el-table-column prop="avgRate" label="平均提成比例" width="120">
              <template #default="{ row }">
                {{ row.avgRate }}%
              </template>
            </el-table-column>
            <el-table-column prop="totalCommission" label="提成总额" width="120">
              <template #default="{ row }">
                <span style="color: #67C23A; font-weight: bold;">¥{{ row.totalCommission }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="settledAmount" label="已结算" width="120">
              <template #default="{ row }">
                ¥{{ row.settledAmount }}
              </template>
            </el-table-column>
            <el-table-column prop="pendingAmount" label="待结算" width="120">
              <template #default="{ row }">
                ¥{{ row.pendingAmount }}
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <!-- 规则编辑对话框 -->
    <el-dialog v-model="ruleDialogVisible" :title="isEditRule ? '编辑规则' : '新增规则'" width="600px">
      <el-form :model="ruleForm" label-width="120px">
        <el-form-item label="规则名称" required>
          <el-input v-model="ruleForm.name" placeholder="如：发型师基础提成" />
        </el-form-item>
        <el-form-item label="规则类型" required>
          <el-radio-group v-model="ruleForm.type">
            <el-radio value="global">全局规则</el-radio>
            <el-radio value="position">按职位</el-radio>
            <el-radio value="service">按服务项目</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="适用职位" v-if="ruleForm.type === 'position'">
          <el-input v-model="ruleForm.target" placeholder="如：发型师、技师" />
        </el-form-item>
        <el-form-item label="适用服务" v-if="ruleForm.type === 'service'">
          <el-select v-model="ruleForm.target" placeholder="选择服务项目" style="width: 100%">
            <el-option v-for="s in serviceList" :key="s.id" :label="s.name" :value="s.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="提成方式" required>
          <el-radio-group v-model="ruleForm.rateType">
            <el-radio value="percent">按比例</el-radio>
            <el-radio value="fixed">固定金额</el-radio>
            <el-radio value="tiered">阶梯提成</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="提成比例" v-if="ruleForm.rateType === 'percent'">
          <el-input-number v-model="ruleForm.rate" :min="0" :max="100" :precision="1" />
          <span style="margin-left: 10px">%</span>
        </el-form-item>
        <el-form-item label="固定金额" v-if="ruleForm.rateType === 'fixed'">
          <el-input-number v-model="ruleForm.fixedAmount" :min="0" :precision="2" />
          <span style="margin-left: 10px">元</span>
        </el-form-item>
        <el-form-item label="阶梯配置" v-if="ruleForm.rateType === 'tiered'">
          <div v-for="(tier, index) in ruleForm.tiers" :key="index" style="margin-bottom: 10px;">
            <el-input-number v-model="tier.minAmount" :min="0" placeholder="最低金额" style="width: 120px;" />
            <span style="margin: 0 10px;">-</span>
            <el-input-number v-model="tier.maxAmount" :min="0" placeholder="最高金额" style="width: 120px;" />
            <el-input-number v-model="tier.rate" :min="0" :max="100" :precision="1" style="width: 100px; margin-left: 10px;" />
            <span style="margin-left: 5px;">%</span>
            <el-button type="danger" :icon="Delete" circle size="small" @click="ruleForm.tiers.splice(index, 1)" style="margin-left: 10px;" />
          </div>
          <el-button type="primary" size="small" @click="ruleForm.tiers.push({ minAmount: 0, maxAmount: 0, rate: 0 })">添加阶梯</el-button>
        </el-form-item>
        <el-form-item label="最低业绩要求">
          <el-input-number v-model="ruleForm.minAmount" :min="0" :precision="2" />
          <span style="margin-left: 10px">元（可选）</span>
        </el-form-item>
        <el-form-item label="生效日期">
          <el-date-picker v-model="ruleForm.effectiveDate" type="date" placeholder="选择日期" style="width: 100%" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="ruleForm.remark" type="textarea" rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="ruleDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="ruleSubmitting" @click="handleRuleSubmit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Money, TrendCharts, User, DataAnalysis, Delete } from '@element-plus/icons-vue'
import * as echarts from 'echarts'

const API_BASE = 'http://localhost:3000/api'
const token = localStorage.getItem('token') || ''

const ruleTypeMap: Record<string, { label: string; type: string }> = {
  global: { label: '全局规则', type: 'primary' },
  position: { label: '按职位', type: 'success' },
  service: { label: '按服务', type: 'warning' },
}

const activeTab = ref('rules')
const employeeList = ref<any[]>([])
const serviceList = ref<any[]>([])

// 概览数据
const overview = ref({
  totalCommission: 0,
  totalSales: 0,
  employeeCount: 0,
  avgRate: 0,
})

// 规则相关
const rulesLoading = ref(false)
const ruleList = ref<any[]>([])
const ruleDialogVisible = ref(false)
const isEditRule = ref(false)
const editRuleId = ref('')
const ruleSubmitting = ref(false)

const ruleForm = ref({
  name: '',
  type: 'global',
  target: '',
  rateType: 'percent',
  rate: 10,
  fixedAmount: 0,
  tiers: [] as { minAmount: number; maxAmount: number; rate: number }[],
  minAmount: 0,
  effectiveDate: '',
  remark: '',
})

// 记录相关
const recordsLoading = ref(false)
const recordList = ref<any[]>([])
const recordDateRange = ref<[Date, Date] | null>(null)
const filterEmployeeId = ref('')
const recordPage = ref(1)
const recordPageSize = ref(20)
const recordTotal = ref(0)

// 统计相关
const statsLoading = ref(false)
const statsMonth = ref(new Date())
const employeeStats = ref<any[]>([])
const rankChartRef = ref<HTMLElement>()
const trendChartRef = ref<HTMLElement>()

const formatDate = (date: string | Date) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString()
}

const loadOverview = async () => {
  try {
    const now = new Date()
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    
    const params = new URLSearchParams()
    params.append('startDate', startDate.toISOString().split('T')[0])
    params.append('endDate', endDate.toISOString().split('T')[0])
    
    const res = await fetch(`${API_BASE}/commission/overview?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (res.ok) {
      overview.value = await res.json()
    }
  } catch (e) {
    console.error(e)
  }
}

const loadRules = async () => {
  rulesLoading.value = true
  try {
    const res = await fetch(`${API_BASE}/commission/rules`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    ruleList.value = await res.json()
  } catch (e) {
    ElMessage.error('加载规则失败')
  } finally {
    rulesLoading.value = false
  }
}

const loadRecords = async () => {
  recordsLoading.value = true
  try {
    const params = new URLSearchParams()
    params.append('page', String(recordPage.value))
    params.append('pageSize', String(recordPageSize.value))
    
    if (recordDateRange.value) {
      params.append('startDate', new Date(recordDateRange.value[0]).toISOString().split('T')[0])
      params.append('endDate', new Date(recordDateRange.value[1]).toISOString().split('T')[0])
    }
    
    if (filterEmployeeId.value) {
      params.append('employeeId', filterEmployeeId.value)
    }

    const res = await fetch(`${API_BASE}/commission/records?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const data = await res.json()
    recordList.value = data.records || data
    recordTotal.value = data.total || recordList.value.length
  } catch (e) {
    ElMessage.error('加载记录失败')
  } finally {
    recordsLoading.value = false
  }
}

const loadStats = async () => {
  statsLoading.value = true
  try {
    const params = new URLSearchParams()
    if (statsMonth.value) {
      const d = new Date(statsMonth.value)
      params.append('year', String(d.getFullYear()))
      params.append('month', String(d.getMonth() + 1))
    }
    
    const res = await fetch(`${API_BASE}/commission/stats?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    employeeStats.value = await res.json()
    
    await nextTick()
    renderCharts()
  } catch (e) {
    ElMessage.error('加载统计失败')
  } finally {
    statsLoading.value = false
  }
}

const loadEmployees = async () => {
  try {
    const res = await fetch(`${API_BASE}/employees`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    employeeList.value = await res.json()
  } catch (e) {}
}

const loadServices = async () => {
  try {
    const res = await fetch(`${API_BASE}/services`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    serviceList.value = await res.json()
  } catch (e) {}
}

const renderCharts = () => {
  // 排行榜图表
  if (rankChartRef.value) {
    const chart = echarts.init(rankChartRef.value)
    const sortedStats = [...employeeStats.value].sort((a, b) => b.totalCommission - a.totalCommission).slice(0, 10)
    chart.setOption({
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'value' },
      yAxis: { 
        type: 'category', 
        data: sortedStats.map(s => s.employeeName).reverse(),
        axisLabel: { width: 60, overflow: 'truncate' }
      },
      series: [{
        type: 'bar',
        data: sortedStats.map(s => s.totalCommission).reverse(),
        itemStyle: { color: '#67C23A' },
        label: { show: true, position: 'right', formatter: '¥{c}' }
      }]
    })
  }

  // 趋势图
  if (trendChartRef.value) {
    const chart = echarts.init(trendChartRef.value)
    const days = Array.from({ length: 30 }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - 29 + i)
      return `${d.getMonth() + 1}/${d.getDate()}`
    })
    chart.setOption({
      tooltip: { trigger: 'axis' },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'category', data: days, axisLabel: { rotate: 45 } },
      yAxis: { type: 'value', name: '提成金额(元)' },
      series: [{
        type: 'line',
        data: Array.from({ length: 30 }, () => Math.floor(Math.random() * 1000 + 500)),
        smooth: true,
        areaStyle: { opacity: 0.3 },
        itemStyle: { color: '#409EFF' }
      }]
    })
  }
}

const handleAddRule = () => {
  isEditRule.value = false
  ruleForm.value = {
    name: '',
    type: 'global',
    target: '',
    rateType: 'percent',
    rate: 10,
    fixedAmount: 0,
    tiers: [],
    minAmount: 0,
    effectiveDate: '',
    remark: '',
  }
  ruleDialogVisible.value = true
}

const handleEditRule = (row: any) => {
  isEditRule.value = true
  editRuleId.value = row.id
  ruleForm.value = {
    name: row.name,
    type: row.type,
    target: row.target,
    rateType: row.rateType,
    rate: row.rate || 10,
    fixedAmount: row.fixedAmount || 0,
    tiers: row.tiers || [],
    minAmount: row.minAmount || 0,
    effectiveDate: row.effectiveDate || '',
    remark: row.remark || '',
  }
  ruleDialogVisible.value = true
}

const handleDeleteRule = async (row: any) => {
  try {
    await ElMessageBox.confirm('确定要删除该规则吗？', '提示', { type: 'warning' })
    const res = await fetch(`${API_BASE}/commission/rules/${row.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    })
    if (res.ok) {
      ElMessage.success('删除成功')
      loadRules()
    }
  } catch (e) {}
}

const handleRuleStatusChange = async (row: any) => {
  try {
    await fetch(`${API_BASE}/commission/rules/${row.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ status: row.status })
    })
    ElMessage.success('状态更新成功')
  } catch (e) {
    ElMessage.error('更新失败')
  }
}

const handleRuleSubmit = async () => {
  if (!ruleForm.value.name) {
    ElMessage.warning('请输入规则名称')
    return
  }
  ruleSubmitting.value = true
  try {
    const url = isEditRule.value 
      ? `${API_BASE}/commission/rules/${editRuleId.value}` 
      : `${API_BASE}/commission/rules`
    const method = isEditRule.value ? 'PATCH' : 'POST'
    
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(ruleForm.value)
    })
    
    if (res.ok) {
      ElMessage.success(isEditRule.value ? '修改成功' : '添加成功')
      ruleDialogVisible.value = false
      loadRules()
    } else {
      const err = await res.json()
      ElMessage.error(err.message || '操作失败')
    }
  } catch (e) {
    ElMessage.error('网络错误')
  } finally {
    ruleSubmitting.value = false
  }
}

const handleExport = () => {
  ElMessage.info('导出功能开发中...')
}

const handleExportStats = () => {
  ElMessage.info('导出报表功能开发中...')
}

const getSummary = (param: any) => {
  const { columns, data } = param
  const sums: string[] = []
  columns.forEach((column: any, index: number) => {
    if (index === 0) {
      sums[index] = '合计'
      return
    }
    if (['totalSales', 'totalCommission', 'settledAmount', 'pendingAmount'].includes(column.property)) {
      const values = data.map((item: any) => Number(item[column.property]) || 0)
      sums[index] = `¥${values.reduce((prev: number, curr: number) => prev + curr, 0).toFixed(2)}`
    } else {
      sums[index] = ''
    }
  })
  return sums
}

onMounted(() => {
  loadOverview()
  loadRules()
  loadRecords()
  loadStats()
  loadEmployees()
  loadServices()
})
</script>

<style scoped>
.commission-page {
  padding: 20px;
}

.overview-cards {
  margin-bottom: 20px;
}

.stat-card {
  height: 100%;
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 15px;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 5px;
}

.commission-tabs {
  margin-top: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filter-bar {
  display: flex;
  align-items: center;
}

.chart-title {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 15px;
  text-align: center;
}
</style>
