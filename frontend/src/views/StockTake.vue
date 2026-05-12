<template>
  <div class="stock-take-page">
    <el-tabs v-model="activeTab" type="border-card">
      <!-- 盘点单列表 -->
      <el-tab-pane label="盘点单列表" name="list">
        <div class="toolbar">
          <el-button type="primary" @click="showCreateDialog">创建盘点单</el-button>
          <el-select v-model="statusFilter" placeholder="状态筛选" clearable style="width: 150px; margin-left: 16px;">
            <el-option label="待盘点" value="pending" />
            <el-option label="盘点中" value="in_progress" />
            <el-option label="已完成" value="completed" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="margin-left: 16px;"
          />
        </div>
        <el-table :data="filteredStockTakes" stripe>
          <el-table-column prop="stockTakeNo" label="盘点单号" width="180" />
          <el-table-column prop="warehouse" label="仓库" />
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.status)">
                {{ getStatusText(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="totalItems" label="盘点项数" width="100" />
          <el-table-column prop="differenceItems" label="差异数" width="100">
            <template #default="{ row }">
              <span :class="{ 'has-difference': row.differenceItems > 0 }">
                {{ row.differenceItems || 0 }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="createdAt" label="创建时间" width="180">
            <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
          </el-table-column>
          <el-table-column prop="createdBy" label="创建人" width="100" />
          <el-table-column label="操作" width="250">
            <template #default="{ row }">
              <el-button link @click="viewDetail(row)">查看</el-button>
              <el-button v-if="row.status === 'pending'" link type="primary" @click="startStockTake(row)">开始盘点</el-button>
              <el-button v-if="row.status === 'in_progress'" link type="success" @click="continueStockTake(row)">继续盘点</el-button>
              <el-button v-if="row.status === 'in_progress'" link type="warning" @click="completeStockTake(row)">完成</el-button>
              <el-button v-if="row.status === 'pending'" link type="danger" @click="cancelStockTake(row)">取消</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- 盘点差异处理 -->
      <el-tab-pane label="差异处理" name="difference">
        <div class="toolbar">
          <el-select v-model="diffStatusFilter" placeholder="处理状态" clearable style="width: 150px;">
            <el-option label="待处理" value="pending" />
            <el-option label="已处理" value="handled" />
          </el-select>
        </div>
        <el-table :data="filteredDifferences" stripe>
          <el-table-column prop="stockTakeNo" label="盘点单号" width="180" />
          <el-table-column prop="productName" label="产品名称" />
          <el-table-column prop="productCode" label="产品编码" width="120" />
          <el-table-column prop="systemQuantity" label="系统库存" width="100" />
          <el-table-column prop="actualQuantity" label="实际库存" width="100" />
          <el-table-column prop="difference" label="差异数量" width="100">
            <template #default="{ row }">
              <span :class="row.difference > 0 ? 'positive-diff' : 'negative-diff'">
                {{ row.difference > 0 ? '+' : '' }}{{ row.difference }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="differenceAmount" label="差异金额" width="120">
            <template #default="{ row }">
              <span :class="row.differenceAmount > 0 ? 'positive-diff' : 'negative-diff'">
                ¥{{ row.differenceAmount?.toFixed(2) || '0.00' }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.status === 'handled' ? 'success' : 'danger'">
                {{ row.status === 'handled' ? '已处理' : '待处理' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150">
            <template #default="{ row }">
              <el-button v-if="row.status === 'pending'" link type="primary" @click="handleDifference(row)">处理</el-button>
              <el-button link @click="viewDifferenceLog(row)">日志</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <!-- 创建盘点单对话框 -->
    <el-dialog v-model="createDialogVisible" title="创建盘点单" width="600px">
      <el-form :model="createForm" label-width="100px" :rules="createRules" ref="createFormRef">
        <el-form-item label="盘点仓库" prop="warehouse">
          <el-select v-model="createForm.warehouse" placeholder="选择仓库" style="width: 100%;">
            <el-option v-for="w in warehouses" :key="w.id" :label="w.name" :value="w.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="盘点类型" prop="stockTakeType">
          <el-radio-group v-model="createForm.stockTakeType">
            <el-radio value="full">全盘</el-radio>
            <el-radio value="partial">部分盘点</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="createForm.stockTakeType === 'partial'" label="选择产品" prop="productIds">
          <el-select v-model="createForm.productIds" multiple placeholder="选择产品" style="width: 100%;">
            <el-option v-for="p in products" :key="p.id" :label="p.name" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="createForm.remark" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="createStockTake">创建</el-button>
      </template>
    </el-dialog>

    <!-- 盘点详情对话框 -->
    <el-dialog v-model="detailDialogVisible" title="盘点详情" width="900px">
      <div class="detail-header">
        <el-descriptions :column="3" border>
          <el-descriptions-item label="盘点单号">{{ currentStockTake.stockTakeNo }}</el-descriptions-item>
          <el-descriptions-item label="仓库">{{ currentStockTake.warehouseName }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusType(currentStockTake.status)">
              {{ getStatusText(currentStockTake.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ formatDate(currentStockTake.createdAt) }}</el-descriptions-item>
          <el-descriptions-item label="创建人">{{ currentStockTake.createdBy }}</el-descriptions-item>
          <el-descriptions-item label="备注">{{ currentStockTake.remark || '-' }}</el-descriptions-item>
        </el-descriptions>
      </div>
      <el-divider />
      <el-table :data="stockTakeItems" stripe max-height="400">
        <el-table-column prop="productName" label="产品名称" />
        <el-table-column prop="productCode" label="编码" width="120" />
        <el-table-column prop="systemQuantity" label="系统库存" width="100" />
        <el-table-column prop="actualQuantity" label="实际库存" width="120">
          <template #default="{ row }">
            <el-input-number
              v-if="currentStockTake.status === 'in_progress'"
              v-model="row.actualQuantity"
              :min="0"
              size="small"
              @change="calculateDifference(row)"
            />
            <span v-else>{{ row.actualQuantity ?? '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="difference" label="差异" width="100">
          <template #default="{ row }">
            <span :class="getDiffClass(row.difference)">
              {{ formatDifference(row.difference) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" width="150">
          <template #default="{ row }">
            <el-input
              v-if="currentStockTake.status === 'in_progress'"
              v-model="row.remark"
              size="small"
              placeholder="备注"
            />
            <span v-else>{{ row.remark || '-' }}</span>
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
        <el-button v-if="currentStockTake.status === 'in_progress'" type="primary" @click="saveStockTakeItems">保存</el-button>
      </template>
    </el-dialog>

    <!-- 差异处理对话框 -->
    <el-dialog v-model="diffHandleDialogVisible" title="差异处理" width="500px">
      <el-form :model="diffHandleForm" label-width="100px">
        <el-form-item label="产品">{{ currentDifference.productName }}</el-form-item>
        <el-form-item label="系统库存">{{ currentDifference.systemQuantity }}</el-form-item>
        <el-form-item label="实际库存">{{ currentDifference.actualQuantity }}</el-form-item>
        <el-form-item label="差异">
          <span :class="getDiffClass(currentDifference.difference)">
            {{ formatDifference(currentDifference.difference) }}
          </span>
        </el-form-item>
        <el-form-item label="处理方式" prop="handleType">
          <el-radio-group v-model="diffHandleForm.handleType">
            <el-radio value="adjust">调整库存</el-radio>
            <el-radio value="ignore">忽略差异</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="处理说明">
          <el-input v-model="diffHandleForm.remark" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="diffHandleDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitDifferenceHandle">确认处理</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance } from 'element-plus'

const API_BASE = 'http://localhost:3000/api'
const token = localStorage.getItem('token') || ''

const activeTab = ref('list')
const stockTakes = ref<any[]>([])
const differences = ref<any[]>([])
const warehouses = ref<any[]>([])
const products = ref<any[]>([])

const statusFilter = ref('')
const diffStatusFilter = ref('')
const dateRange = ref<[Date, Date] | null>(null)

// 对话框
const createDialogVisible = ref(false)
const detailDialogVisible = ref(false)
const diffHandleDialogVisible = ref(false)

// 表单
const createFormRef = ref<FormInstance>()
const createForm = ref({
  warehouse: '',
  stockTakeType: 'full',
  productIds: [] as string[],
  remark: ''
})
const createRules = {
  warehouse: [{ required: true, message: '请选择仓库', trigger: 'change' }],
  productIds: [{ required: true, message: '请选择产品', trigger: 'change' }]
}

const currentStockTake = ref<any>({})
const stockTakeItems = ref<any[]>([])

const currentDifference = ref<any>({})
const diffHandleForm = ref({
  handleType: 'adjust',
  remark: ''
})

// 计算属性
const filteredStockTakes = computed(() => {
  let result = stockTakes.value
  if (statusFilter.value) {
    result = result.filter(s => s.status === statusFilter.value)
  }
  if (dateRange.value) {
    const [start, end] = dateRange.value
    result = result.filter(s => {
      const date = new Date(s.createdAt)
      return date >= start && date <= end
    })
  }
  return result
})

const filteredDifferences = computed(() => {
  if (!diffStatusFilter.value) return differences.value
  return differences.value.filter(d => d.status === diffStatusFilter.value)
})

// 方法
const getStatusType = (status: string) => {
  const map: Record<string, string> = {
    pending: 'info',
    in_progress: 'warning',
    completed: 'success',
    cancelled: 'danger'
  }
  return map[status] || 'info'
}

const getStatusText = (status: string) => {
  const map: Record<string, string> = {
    pending: '待盘点',
    in_progress: '盘点中',
    completed: '已完成',
    cancelled: '已取消'
  }
  return map[status] || status
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleString()
}

const getDiffClass = (diff: number) => {
  if (!diff) return ''
  return diff > 0 ? 'positive-diff' : 'negative-diff'
}

const formatDifference = (diff: number) => {
  if (diff === null || diff === undefined) return '-'
  return diff > 0 ? `+${diff}` : `${diff}`
}

const calculateDifference = (row: any) => {
  row.difference = (row.actualQuantity ?? 0) - row.systemQuantity
}

// 加载数据
const loadData = async () => {
  try {
    const [stockTakesRes, diffRes, warehousesRes, productsRes] = await Promise.all([
      fetch(`${API_BASE}/inventory/stock-takes`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${API_BASE}/inventory/stock-takes/differences`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${API_BASE}/inventory/warehouses`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${API_BASE}/inventory/products`, { headers: { Authorization: `Bearer ${token}` } })
    ])
    stockTakes.value = await stockTakesRes.json()
    differences.value = await diffRes.json()
    warehouses.value = await warehousesRes.json()
    products.value = await productsRes.json()
  } catch (e) {
    ElMessage.error('加载数据失败')
  }
}

// 创建盘点单
const showCreateDialog = () => {
  createForm.value = {
    warehouse: '',
    stockTakeType: 'full',
    productIds: [],
    remark: ''
  }
  createDialogVisible.value = true
}

const createStockTake = async () => {
  try {
    await createFormRef.value?.validate()
    const res = await fetch(`${API_BASE}/inventory/stock-takes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(createForm.value)
    })
    if (res.ok) {
      createDialogVisible.value = false
      loadData()
      ElMessage.success('创建成功')
    } else {
      const err = await res.json()
      ElMessage.error(err.message || '创建失败')
    }
  } catch (e) {
    ElMessage.error('网络错误')
  }
}

// 盘点操作
const viewDetail = async (row: any) => {
  try {
    const res = await fetch(`${API_BASE}/inventory/stock-takes/${row.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const data = await res.json()
    currentStockTake.value = data
    stockTakeItems.value = data.items || []
    detailDialogVisible.value = true
  } catch (e) {
    ElMessage.error('加载详情失败')
  }
}

const startStockTake = async (row: any) => {
  try {
    await ElMessageBox.confirm('确定开始盘点？')
    const res = await fetch(`${API_BASE}/inventory/stock-takes/${row.id}/start`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    })
    if (res.ok) {
      loadData()
      ElMessage.success('已开始盘点')
    } else {
      ElMessage.error('操作失败')
    }
  } catch (e: any) {
    if (e !== 'cancel') {
      ElMessage.error('操作失败')
    }
  }
}

const continueStockTake = (row: any) => {
  viewDetail(row)
}

const saveStockTakeItems = async () => {
  try {
    const res = await fetch(`${API_BASE}/inventory/stock-takes/${currentStockTake.value.id}/items`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ items: stockTakeItems.value })
    })
    if (res.ok) {
      ElMessage.success('保存成功')
    } else {
      ElMessage.error('保存失败')
    }
  } catch (e) {
    ElMessage.error('网络错误')
  }
}

const completeStockTake = async (row: any) => {
  try {
    await ElMessageBox.confirm('确定完成盘点？完成后将生成差异记录。')
    const res = await fetch(`${API_BASE}/inventory/stock-takes/${row.id}/complete`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    })
    if (res.ok) {
      loadData()
      ElMessage.success('盘点已完成')
    } else {
      ElMessage.error('操作失败')
    }
  } catch (e: any) {
    if (e !== 'cancel') {
      ElMessage.error('操作失败')
    }
  }
}

const cancelStockTake = async (row: any) => {
  try {
    await ElMessageBox.confirm('确定取消该盘点单？')
    const res = await fetch(`${API_BASE}/inventory/stock-takes/${row.id}/cancel`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    })
    if (res.ok) {
      loadData()
      ElMessage.success('已取消')
    } else {
      ElMessage.error('操作失败')
    }
  } catch (e: any) {
    if (e !== 'cancel') {
      ElMessage.error('操作失败')
    }
  }
}

// 差异处理
const handleDifference = (row: any) => {
  currentDifference.value = row
  diffHandleForm.value = {
    handleType: 'adjust',
    remark: ''
  }
  diffHandleDialogVisible.value = true
}

const viewDifferenceLog = (row: any) => {
  ElMessage.info(`查看盘点差异日志: ${row.id}`)
}

const submitDifferenceHandle = async () => {
  try {
    const res = await fetch(`${API_BASE}/inventory/stock-takes/differences/${currentDifference.value.id}/handle`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(diffHandleForm.value)
    })
    if (res.ok) {
      diffHandleDialogVisible.value = false
      loadData()
      ElMessage.success('处理成功')
    } else {
      ElMessage.error('处理失败')
    }
  } catch (e) {
    ElMessage.error('网络错误')
  }
}

onMounted(loadData)
</script>

<style scoped>
.stock-take-page {
  padding: 20px;
}
.toolbar {
  margin-bottom: 16px;
  display: flex;
  align-items: center;
}
.has-difference {
  color: #e6a23c;
  font-weight: bold;
}
.positive-diff {
  color: #67c23a;
  font-weight: bold;
}
.negative-diff {
  color: #f56c6c;
  font-weight: bold;
}
.detail-header {
  margin-bottom: 16px;
}
</style>
