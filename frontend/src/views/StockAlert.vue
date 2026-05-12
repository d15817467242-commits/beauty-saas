<template>
  <div class="stock-alert-page">
    <el-tabs v-model="activeTab" type="border-card">
      <!-- 预警列表 -->
      <el-tab-pane label="预警列表" name="alerts">
        <div class="toolbar">
          <el-select v-model="alertTypeFilter" placeholder="预警类型" clearable style="width: 150px;">
            <el-option label="库存不足" value="low_stock" />
            <el-option label="库存过剩" value="over_stock" />
            <el-option label="临期预警" value="expiring" />
            <el-option label="滞销预警" value="unsold" />
          </el-select>
          <el-select v-model="alertStatusFilter" placeholder="处理状态" clearable style="width: 150px; margin-left: 16px;">
            <el-option label="待处理" value="pending" />
            <el-option label="处理中" value="processing" />
            <el-option label="已处理" value="handled" />
            <el-option label="已忽略" value="ignored" />
          </el-select>
          <el-button type="primary" style="margin-left: 16px;" @click="batchHandleAlerts" :disabled="selectedAlerts.length === 0">
            批量处理 ({{ selectedAlerts.length }})
          </el-button>
        </div>
        <el-table :data="filteredAlerts" stripe @selection-change="handleSelectionChange">
          <el-table-column type="selection" width="55" />
          <el-table-column prop="alertType" label="预警类型" width="120">
            <template #default="{ row }">
              <el-tag :type="getAlertTypeStyle(row.alertType)">
                {{ getAlertTypeText(row.alertType) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="productName" label="产品名称" />
          <el-table-column prop="productCode" label="编码" width="120" />
          <el-table-column prop="currentValue" label="当前值" width="100" />
          <el-table-column prop="thresholdValue" label="阈值" width="100" />
          <el-table-column prop="severity" label="严重程度" width="100">
            <template #default="{ row }">
              <el-tag :type="getSeverityStyle(row.severity)" size="small">
                {{ getSeverityText(row.severity) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getStatusStyle(row.status)">
                {{ getStatusText(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createdAt" label="触发时间" width="180">
            <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="200">
            <template #default="{ row }">
              <el-button v-if="row.status === 'pending'" link type="primary" @click="handleAlert(row)">处理</el-button>
              <el-button v-if="row.status === 'pending'" link type="info" @click="ignoreAlert(row)">忽略</el-button>
              <el-button link @click="viewAlertDetail(row)">详情</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- 预警规则配置 -->
      <el-tab-pane label="规则配置" name="rules">
        <div class="toolbar">
          <el-button type="primary" @click="showRuleDialog()">新增规则</el-button>
        </div>
        <el-table :data="alertRules" stripe>
          <el-table-column prop="ruleName" label="规则名称" />
          <el-table-column prop="ruleType" label="规则类型" width="120">
            <template #default="{ row }">
              <el-tag :type="getAlertTypeStyle(row.ruleType)">
                {{ getAlertTypeText(row.ruleType) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="condition" label="条件" width="200">
            <template #default="{ row }">{{ formatCondition(row) }}</template>
          </el-table-column>
          <el-table-column prop="severity" label="严重程度" width="100">
            <template #default="{ row }">
              <el-tag :type="getSeverityStyle(row.severity)" size="small">
                {{ getSeverityText(row.severity) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="notifyChannels" label="通知渠道" width="150">
            <template #default="{ row }">
              <el-tag v-for="ch in row.notifyChannels" :key="ch" size="small" style="margin-right: 4px;">
                {{ ch }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="isEnabled" label="状态" width="80">
            <template #default="{ row }">
              <el-switch v-model="row.isEnabled" @change="toggleRule(row)" />
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150">
            <template #default="{ row }">
              <el-button link @click="showRuleDialog(row)">编辑</el-button>
              <el-button link type="danger" @click="deleteRule(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- 预警统计 -->
      <el-tab-pane label="预警统计" name="statistics">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-card>
              <el-statistic title="今日预警" :value="statistics.todayTotal" />
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card>
              <el-statistic title="待处理" :value="statistics.pending" />
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card>
              <el-statistic title="已处理" :value="statistics.handled" />
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card>
              <el-statistic title="处理率" :value="statistics.handleRate" suffix="%" />
            </el-card>
          </el-col>
        </el-row>
        <el-divider />
        <el-row :gutter="20">
          <el-col :span="12">
            <div class="chart-title">预警类型分布</div>
            <div ref="typeChartRef" style="height: 300px;"></div>
          </el-col>
          <el-col :span="12">
            <div class="chart-title">近7天预警趋势</div>
            <div ref="trendChartRef" style="height: 300px;"></div>
          </el-col>
        </el-row>
      </el-tab-pane>
    </el-tabs>

    <!-- 处理预警对话框 -->
    <el-dialog v-model="handleDialogVisible" title="处理预警" width="500px">
      <el-form :model="handleForm" label-width="100px">
        <el-form-item label="预警信息">
          <el-text>{{ currentAlert.productName }} - {{ getAlertTypeText(currentAlert.alertType) }}</el-text>
        </el-form-item>
        <el-form-item label="处理方式" prop="handleType">
          <el-radio-group v-model="handleForm.handleType">
            <el-radio value="purchase">立即采购</el-radio>
            <el-radio value="transfer">库存调拨</el-radio>
            <el-radio value="adjust">调整阈值</el-radio>
            <el-radio value="other">其他处理</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="handleForm.handleType === 'purchase'" label="采购数量">
          <el-input-number v-model="handleForm.purchaseQuantity" :min="1" />
        </el-form-item>
        <el-form-item v-if="handleForm.handleType === 'transfer'" label="调拨仓库">
          <el-select v-model="handleForm.targetWarehouse" placeholder="选择仓库">
            <el-option v-for="w in warehouses" :key="w.id" :label="w.name" :value="w.id" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="handleForm.handleType === 'adjust'" label="新阈值">
          <el-input-number v-model="handleForm.newThreshold" :min="0" />
        </el-form-item>
        <el-form-item label="处理说明">
          <el-input v-model="handleForm.remark" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="handleDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitHandle">确认处理</el-button>
      </template>
    </el-dialog>

    <!-- 规则配置对话框 -->
    <el-dialog v-model="ruleDialogVisible" title="预警规则" width="600px">
      <el-form :model="ruleForm" label-width="100px" :rules="ruleRules" ref="ruleFormRef">
        <el-form-item label="规则名称" prop="ruleName">
          <el-input v-model="ruleForm.ruleName" />
        </el-form-item>
        <el-form-item label="规则类型" prop="ruleType">
          <el-select v-model="ruleForm.ruleType" style="width: 100%;">
            <el-option label="库存不足" value="low_stock" />
            <el-option label="库存过剩" value="over_stock" />
            <el-option label="临期预警" value="expiring" />
            <el-option label="滞销预警" value="unsold" />
          </el-select>
        </el-form-item>
        <el-form-item label="阈值" prop="threshold">
          <el-input-number v-model="ruleForm.threshold" :min="0" />
        </el-form-item>
        <el-form-item label="严重程度" prop="severity">
          <el-select v-model="ruleForm.severity" style="width: 100%;">
            <el-option label="低" value="low" />
            <el-option label="中" value="medium" />
            <el-option label="高" value="high" />
            <el-option label="紧急" value="critical" />
          </el-select>
        </el-form-item>
        <el-form-item label="通知渠道" prop="notifyChannels">
          <el-checkbox-group v-model="ruleForm.notifyChannels">
            <el-checkbox value="系统通知">系统通知</el-checkbox>
            <el-checkbox value="短信">短信</el-checkbox>
            <el-checkbox value="邮件">邮件</el-checkbox>
            <el-checkbox value="微信">微信</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="适用产品">
          <el-select v-model="ruleForm.productIds" multiple placeholder="留空则全部产品" style="width: 100%;">
            <el-option v-for="p in products" :key="p.id" :label="p.name" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="启用">
          <el-switch v-model="ruleForm.isEnabled" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="ruleDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveRule">保存</el-button>
      </template>
    </el-dialog>

    <!-- 预警详情对话框 -->
    <el-dialog v-model="detailDialogVisible" title="预警详情" width="600px">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="预警类型">{{ getAlertTypeText(currentAlert.alertType) }}</el-descriptions-item>
        <el-descriptions-item label="严重程度">{{ getSeverityText(currentAlert.severity) }}</el-descriptions-item>
        <el-descriptions-item label="产品名称">{{ currentAlert.productName }}</el-descriptions-item>
        <el-descriptions-item label="产品编码">{{ currentAlert.productCode }}</el-descriptions-item>
        <el-descriptions-item label="当前值">{{ currentAlert.currentValue }}</el-descriptions-item>
        <el-descriptions-item label="阈值">{{ currentAlert.thresholdValue }}</el-descriptions-item>
        <el-descriptions-item label="触发时间">{{ formatDate(currentAlert.createdAt) }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ getStatusText(currentAlert.status) }}</el-descriptions-item>
        <el-descriptions-item label="处理人">{{ currentAlert.handlerName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="处理时间">{{ currentAlert.handledAt ? formatDate(currentAlert.handledAt) : '-' }}</el-descriptions-item>
        <el-descriptions-item label="处理说明" :span="2">{{ currentAlert.handleRemark || '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance } from 'element-plus'
import * as echarts from 'echarts'

const activeTab = ref('alerts')
const alerts = ref<any[]>([])
const alertRules = ref<any[]>([])
const warehouses = ref<any[]>([])
const products = ref<any[]>([])
const selectedAlerts = ref<any[]>([])

const alertTypeFilter = ref('')
const alertStatusFilter = ref('')

const statistics = ref({
  todayTotal: 0,
  pending: 0,
  handled: 0,
  handleRate: 0
})

// 对话框
const handleDialogVisible = ref(false)
const ruleDialogVisible = ref(false)
const detailDialogVisible = ref(false)

// 表单
const ruleFormRef = ref<FormInstance>()
const currentAlert = ref<any>({})
const handleForm = ref({
  handleType: 'purchase',
  purchaseQuantity: 0,
  targetWarehouse: '',
  newThreshold: 0,
  remark: ''
})

const ruleForm = ref<any>({
  id: null,
  ruleName: '',
  ruleType: 'low_stock',
  threshold: 10,
  severity: 'medium',
  notifyChannels: ['系统通知'] as string[],
  productIds: [] as string[],
  isEnabled: true
})

const ruleRules = {
  ruleName: [{ required: true, message: '请输入规则名称', trigger: 'blur' }],
  ruleType: [{ required: true, message: '请选择规则类型', trigger: 'change' }],
  threshold: [{ required: true, message: '请输入阈值', trigger: 'blur' }]
}

// 图表
const typeChartRef = ref<HTMLElement>()
const trendChartRef = ref<HTMLElement>()
let typeChart: echarts.ECharts
let trendChart: echarts.ECharts

// 计算属性
const filteredAlerts = computed(() => {
  let result = alerts.value
  if (alertTypeFilter.value) {
    result = result.filter(a => a.alertType === alertTypeFilter.value)
  }
  if (alertStatusFilter.value) {
    result = result.filter(a => a.status === alertStatusFilter.value)
  }
  return result
})

// 方法
const getAlertTypeStyle = (type: string) => {
  const map: Record<string, string> = {
    low_stock: 'danger',
    over_stock: 'warning',
    expiring: 'warning',
    unsold: 'info'
  }
  return map[type] || 'info'
}

const getAlertTypeText = (type: string) => {
  const map: Record<string, string> = {
    low_stock: '库存不足',
    over_stock: '库存过剩',
    expiring: '临期预警',
    unsold: '滞销预警'
  }
  return map[type] || type
}

const getSeverityStyle = (severity: string) => {
  const map: Record<string, string> = {
    low: 'info',
    medium: 'warning',
    high: 'danger',
    critical: 'danger'
  }
  return map[severity] || 'info'
}

const getSeverityText = (severity: string) => {
  const map: Record<string, string> = {
    low: '低',
    medium: '中',
    high: '高',
    critical: '紧急'
  }
  return map[severity] || severity
}

const getStatusStyle = (status: string) => {
  const map: Record<string, string> = {
    pending: 'danger',
    processing: 'warning',
    handled: 'success',
    ignored: 'info'
  }
  return map[status] || 'info'
}

const getStatusText = (status: string) => {
  const map: Record<string, string> = {
    pending: '待处理',
    processing: '处理中',
    handled: '已处理',
    ignored: '已忽略'
  }
  return map[status] || status
}

const formatDate = (date: string) => new Date(date).toLocaleString()

const formatCondition = (rule: any) => {
  if (rule.ruleType === 'low_stock') return `库存 < ${rule.threshold}`
  if (rule.ruleType === 'over_stock') return `库存 > ${rule.threshold}`
  if (rule.ruleType === 'expiring') return `距过期 < ${rule.threshold}天`
  if (rule.ruleType === 'unsold') return `未销售 > ${rule.threshold}天`
  return '-'
}

const handleSelectionChange = (selection: any[]) => {
  selectedAlerts.value = selection
}

// 加载数据
const loadData = async () => {
  try {
    const [alertsRes, rulesRes, warehousesRes, productsRes, statsRes] = await Promise.all([
      axios.get('/api/inventory/alerts'),
      axios.get('/api/inventory/alert-rules'),
      axios.get('/api/inventory/warehouses'),
      axios.get('/api/inventory/products'),
      axios.get('/api/inventory/alerts/statistics')
    ])
    alerts.value = alertsRes.data
    alertRules.value = rulesRes.data
    warehouses.value = warehousesRes.data
    products.value = productsRes.data
    statistics.value = statsRes.data
  } catch (e) {
    ElMessage.error('加载数据失败')
  }
}

// 处理预警
const handleAlert = (row: any) => {
  currentAlert.value = row
  handleForm.value = {
    handleType: 'purchase',
    purchaseQuantity: row.thresholdValue - row.currentValue,
    targetWarehouse: '',
    newThreshold: row.thresholdValue,
    remark: ''
  }
  handleDialogVisible.value = true
}

const submitHandle = async () => {
  try {
    await axios.post(`/api/inventory/alerts/${currentAlert.value.id}/handle`, handleForm.value)
    handleDialogVisible.value = false
    loadData()
    ElMessage.success('处理成功')
  } catch (e) {
    ElMessage.error('处理失败')
  }
}

const ignoreAlert = async (row: any) => {
  try {
    await ElMessageBox.confirm('确定忽略该预警？')
    await axios.post(`/api/inventory/alerts/${row.id}/ignore`)
    loadData()
    ElMessage.success('已忽略')
  } catch (e: any) {
    if (e !== 'cancel') {
      ElMessage.error('操作失败')
    }
  }
}

const batchHandleAlerts = async () => {
  try {
    await ElMessageBox.confirm(`确定批量处理 ${selectedAlerts.value.length} 条预警？`)
    await axios.post('/api/inventory/alerts/batch-handle', {
      ids: selectedAlerts.value.map(a => a.id)
    })
    loadData()
    ElMessage.success('批量处理成功')
  } catch (e: any) {
    if (e !== 'cancel') {
      ElMessage.error('操作失败')
    }
  }
}

const viewAlertDetail = (row: any) => {
  currentAlert.value = row
  detailDialogVisible.value = true
}

// 规则管理
const showRuleDialog = (row?: any) => {
  if (row) {
    ruleForm.value = { ...row }
  } else {
    ruleForm.value = {
      ruleName: '',
      ruleType: 'low_stock',
      threshold: 10,
      severity: 'medium',
      notifyChannels: ['系统通知'],
      productIds: [],
      isEnabled: true
    }
  }
  ruleDialogVisible.value = true
}

const saveRule = async () => {
  try {
    await ruleFormRef.value?.validate()
    if (ruleForm.value.id) {
      await axios.put(`/api/inventory/alert-rules/${ruleForm.value.id}`, ruleForm.value)
    } else {
      await axios.post('/api/inventory/alert-rules', ruleForm.value)
    }
    ruleDialogVisible.value = false
    loadData()
    ElMessage.success('保存成功')
  } catch (e: any) {
    if (e.response) {
      ElMessage.error(e.response.data?.message || '保存失败')
    }
  }
}

const toggleRule = async (row: any) => {
  try {
    await axios.put(`/api/inventory/alert-rules/${row.id}`, { isEnabled: row.isEnabled })
    ElMessage.success(row.isEnabled ? '已启用' : '已禁用')
  } catch (e) {
    row.isEnabled = !row.isEnabled
    ElMessage.error('操作失败')
  }
}

const deleteRule = async (row: any) => {
  try {
    await ElMessageBox.confirm('确定删除该规则？')
    await axios.delete(`/api/inventory/alert-rules/${row.id}`)
    loadData()
    ElMessage.success('删除成功')
  } catch (e: any) {
    if (e !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

// 图表
const initCharts = () => {
  nextTick(() => {
    if (typeChartRef.value) {
      typeChart = echarts.init(typeChartRef.value)
      typeChart.setOption({
        tooltip: { trigger: 'item' },
        legend: { orient: 'vertical', left: 'left' },
        series: [{
          type: 'pie',
          radius: '50%',
          data: [
            { value: 10, name: '库存不足' },
            { value: 5, name: '库存过剩' },
            { value: 3, name: '临期预警' },
            { value: 2, name: '滞销预警' }
          ]
        }]
      })
    }
    if (trendChartRef.value) {
      trendChart = echarts.init(trendChartRef.value)
      trendChart.setOption({
        tooltip: { trigger: 'axis' },
        xAxis: {
          type: 'category',
          data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
        },
        yAxis: { type: 'value' },
        series: [{
          type: 'line',
          data: [12, 8, 15, 10, 6, 9, 11],
          smooth: true
        }]
      })
    }
  })
}

onMounted(() => {
  loadData()
  initCharts()
})
</script>

<style scoped>
.stock-alert-page {
  padding: 20px;
}
.toolbar {
  margin-bottom: 16px;
  display: flex;
  align-items: center;
}
.chart-title {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 10px;
}
</style>
