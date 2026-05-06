<template>
  <div class="stock-transfer-page">
    <el-tabs v-model="activeTab" type="border-card">
      <!-- 调拨申请 -->
      <el-tab-pane label="调拨申请" name="apply">
        <div class="toolbar">
          <el-button type="primary" @click="showApplyDialog">新建调拨申请</el-button>
          <el-select v-model="applyStatusFilter" placeholder="状态筛选" clearable style="width: 150px; margin-left: 16px;">
            <el-option label="待审批" value="pending" />
            <el-option label="已通过" value="approved" />
            <el-option label="已拒绝" value="rejected" />
            <el-option label="已完成" value="completed" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
        </div>
        <el-table :data="filteredApplies" stripe>
          <el-table-column prop="transferNo" label="调拨单号" width="180" />
          <el-table-column prop="fromWarehouse" label="调出仓库" />
          <el-table-column prop="toWarehouse" label="调入仓库" />
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.status)">
                {{ getStatusText(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="totalQuantity" label="总数量" width="100" />
          <el-table-column prop="totalAmount" label="总金额" width="120">
            <template #default="{ row }">¥{{ row.totalAmount?.toFixed(2) || '0.00' }}</template>
          </el-table-column>
          <el-table-column prop="createdAt" label="申请时间" width="180">
            <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
          </el-table-column>
          <el-table-column prop="applicant" label="申请人" width="100" />
          <el-table-column label="操作" width="200">
            <template #default="{ row }">
              <el-button link @click="viewTransferDetail(row)">查看</el-button>
              <el-button v-if="row.status === 'pending'" link type="primary" @click="editTransfer(row)">编辑</el-button>
              <el-button v-if="row.status === 'pending'" link type="danger" @click="cancelTransfer(row)">取消</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- 调拨审批 -->
      <el-tab-pane label="调拨审批" name="approve">
        <div class="toolbar">
          <el-input v-model="approveSearch" placeholder="搜索调拨单号" style="width: 200px;" clearable />
        </div>
        <el-table :data="filteredApprovals" stripe>
          <el-table-column prop="transferNo" label="调拨单号" width="180" />
          <el-table-column prop="fromWarehouse" label="调出仓库" />
          <el-table-column prop="toWarehouse" label="调入仓库" />
          <el-table-column prop="totalQuantity" label="总数量" width="100" />
          <el-table-column prop="totalAmount" label="总金额" width="120">
            <template #default="{ row }">¥{{ row.totalAmount?.toFixed(2) || '0.00' }}</template>
          </el-table-column>
          <el-table-column prop="applicant" label="申请人" width="100" />
          <el-table-column prop="createdAt" label="申请时间" width="180">
            <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="200">
            <template #default="{ row }">
              <el-button link @click="viewTransferDetail(row)">查看</el-button>
              <el-button link type="success" @click="approveTransfer(row)">通过</el-button>
              <el-button link type="danger" @click="rejectTransfer(row)">拒绝</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- 调拨记录 -->
      <el-tab-pane label="调拨记录" name="records">
        <div class="toolbar">
          <el-date-picker
            v-model="recordDateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
          />
          <el-select v-model="recordWarehouseFilter" placeholder="仓库筛选" clearable style="width: 150px; margin-left: 16px;">
            <el-option v-for="w in warehouses" :key="w.id" :label="w.name" :value="w.id" />
          </el-select>
          <el-button type="primary" style="margin-left: 16px;" @click="exportRecords">导出</el-button>
        </div>
        <el-table :data="filteredRecords" stripe>
          <el-table-column prop="transferNo" label="调拨单号" width="180" />
          <el-table-column prop="fromWarehouse" label="调出仓库" />
          <el-table-column prop="toWarehouse" label="调入仓库" />
          <el-table-column prop="productName" label="产品名称" />
          <el-table-column prop="quantity" label="调拨数量" width="100" />
          <el-table-column prop="unitPrice" label="单价" width="100">
            <template #default="{ row }">¥{{ row.unitPrice?.toFixed(2) || '0.00' }}</template>
          </el-table-column>
          <el-table-column prop="completedAt" label="完成时间" width="180">
            <template #default="{ row }">{{ formatDate(row.completedAt) }}</template>
          </el-table-column>
          <el-table-column prop="operator" label="操作人" width="100" />
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <!-- 新建调拨申请对话框 -->
    <el-dialog v-model="applyDialogVisible" title="新建调拨申请" width="800px">
      <el-form :model="applyForm" label-width="100px" :rules="applyRules" ref="applyFormRef">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="调出仓库" prop="fromWarehouseId">
              <el-select v-model="applyForm.fromWarehouseId" placeholder="选择仓库" style="width: 100%;">
                <el-option v-for="w in warehouses" :key="w.id" :label="w.name" :value="w.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="调入仓库" prop="toWarehouseId">
              <el-select v-model="applyForm.toWarehouseId" placeholder="选择仓库" style="width: 100%;">
                <el-option v-for="w in warehouses" :key="w.id" :label="w.name" :value="w.id" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="调拨原因" prop="reason">
          <el-input v-model="applyForm.reason" type="textarea" :rows="2" />
        </el-form-item>
        <el-divider>调拨明细</el-divider>
        <el-table :data="applyForm.items" stripe>
          <el-table-column label="产品" width="250">
            <template #default="{ row, $index }">
              <el-select v-model="row.productId" placeholder="选择产品" filterable @change="onProductSelect(row)">
                <el-option v-for="p in products" :key="p.id" :label="p.name" :value="p.id" />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column prop="productCode" label="编码" width="120" />
          <el-table-column prop="currentStock" label="当前库存" width="100" />
          <el-table-column label="调拨数量" width="150">
            <template #default="{ row }">
              <el-input-number v-model="row.quantity" :min="1" :max="row.currentStock" size="small" />
            </template>
          </el-table-column>
          <el-table-column prop="unitPrice" label="单价" width="100">
            <template #default="{ row }">¥{{ row.unitPrice?.toFixed(2) || '0.00' }}</template>
          </el-table-column>
          <el-table-column label="操作" width="80">
            <template #default="{ $index }">
              <el-button link type="danger" @click="removeItem($index)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-button type="primary" link @click="addItem" style="margin-top: 10px;">
          <el-icon><Plus /></el-icon> 添加产品
        </el-button>
        <el-row :gutter="20" style="margin-top: 20px;">
          <el-col :span="12">
            <el-form-item label="总数量">
              <el-input :value="totalQuantity" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="总金额">
              <el-input :value="'¥' + totalAmount.toFixed(2)" disabled />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="applyDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitApply">提交申请</el-button>
      </template>
    </el-dialog>

    <!-- 调拨详情对话框 -->
    <el-dialog v-model="detailDialogVisible" title="调拨详情" width="800px">
      <el-descriptions :column="3" border>
        <el-descriptions-item label="调拨单号">{{ currentTransfer.transferNo }}</el-descriptions-item>
        <el-descriptions-item label="调出仓库">{{ currentTransfer.fromWarehouse }}</el-descriptions-item>
        <el-descriptions-item label="调入仓库">{{ currentTransfer.toWarehouse }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusType(currentTransfer.status)">
            {{ getStatusText(currentTransfer.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="申请人">{{ currentTransfer.applicant }}</el-descriptions-item>
        <el-descriptions-item label="申请时间">{{ formatDate(currentTransfer.createdAt) }}</el-descriptions-item>
        <el-descriptions-item label="调拨原因" :span="3">{{ currentTransfer.reason || '-' }}</el-descriptions-item>
        <el-descriptions-item v-if="currentTransfer.approver" label="审批人">{{ currentTransfer.approver }}</el-descriptions-item>
        <el-descriptions-item v-if="currentTransfer.approvedAt" label="审批时间">{{ formatDate(currentTransfer.approvedAt) }}</el-descriptions-item>
        <el-descriptions-item v-if="currentTransfer.approveRemark" label="审批备注">{{ currentTransfer.approveRemark }}</el-descriptions-item>
      </el-descriptions>
      <el-divider>调拨明细</el-divider>
      <el-table :data="currentTransfer.items" stripe>
        <el-table-column prop="productName" label="产品名称" />
        <el-table-column prop="productCode" label="编码" width="120" />
        <el-table-column prop="quantity" label="调拨数量" width="100" />
        <el-table-column prop="unitPrice" label="单价" width="100">
          <template #default="{ row }">¥{{ row.unitPrice?.toFixed(2) || '0.00' }}</template>
        </el-table-column>
        <el-table-column prop="amount" label="金额" width="120">
          <template #default="{ row }">¥{{ row.amount?.toFixed(2) || '0.00' }}</template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
        <el-button v-if="currentTransfer.status === 'approved'" type="primary" @click="completeTransfer(currentTransfer)">确认完成</el-button>
      </template>
    </el-dialog>

    <!-- 审批对话框 -->
    <el-dialog v-model="approveDialogVisible" :title="approveType === 'approve' ? '审批通过' : '审批拒绝'" width="500px">
      <el-form :model="approveForm" label-width="100px">
        <el-form-item label="审批意见">
          <el-input v-model="approveForm.remark" type="textarea" :rows="3" placeholder="请输入审批意见" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="approveDialogVisible = false">取消</el-button>
        <el-button :type="approveType === 'approve' ? 'success' : 'danger'" @click="submitApprove">
          {{ approveType === 'approve' ? '确认通过' : '确认拒绝' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'

const API_BASE = 'http://localhost:3000/api'
const token = localStorage.getItem('token') || ''

const activeTab = ref('apply')
const transfers = ref<any[]>([])
const approvals = ref<any[]>([])
const records = ref<any[]>([])
const warehouses = ref<any[]>([])
const products = ref<any[]>([])

const applyStatusFilter = ref('')
const approveSearch = ref('')
const recordDateRange = ref<[Date, Date] | null>(null)
const recordWarehouseFilter = ref('')

// 对话框
const applyDialogVisible = ref(false)
const detailDialogVisible = ref(false)
const approveDialogVisible = ref(false)

// 表单
const applyFormRef = ref<FormInstance>()
const applyForm = ref({
  fromWarehouseId: '',
  toWarehouseId: '',
  reason: '',
  items: [] as any[]
})
const applyRules = {
  fromWarehouseId: [{ required: true, message: '请选择调出仓库', trigger: 'change' }],
  toWarehouseId: [{ required: true, message: '请选择调入仓库', trigger: 'change' }],
  reason: [{ required: true, message: '请输入调拨原因', trigger: 'blur' }]
}

const currentTransfer = ref<any>({})
const approveType = ref<'approve' | 'reject'>('approve')
const approveForm = ref({
  remark: ''
})

// 计算属性
const filteredApplies = computed(() => {
  if (!applyStatusFilter.value) return transfers.value
  return transfers.value.filter(t => t.status === applyStatusFilter.value)
})

const filteredApprovals = computed(() => {
  if (!approveSearch.value) return approvals.value
  return approvals.value.filter(t => t.transferNo.includes(approveSearch.value))
})

const filteredRecords = computed(() => {
  let result = records.value
  if (recordDateRange.value) {
    const [start, end] = recordDateRange.value
    result = result.filter(r => {
      const date = new Date(r.completedAt)
      return date >= start && date <= end
    })
  }
  if (recordWarehouseFilter.value) {
    result = result.filter(r => 
      r.fromWarehouseId === recordWarehouseFilter.value || 
      r.toWarehouseId === recordWarehouseFilter.value
    )
  }
  return result
})

const totalQuantity = computed(() => {
  return applyForm.value.items.reduce((sum, item) => sum + (item.quantity || 0), 0)
})

const totalAmount = computed(() => {
  return applyForm.value.items.reduce((sum, item) => sum + (item.quantity || 0) * (item.unitPrice || 0), 0)
})

// 方法
const getStatusType = (status: string) => {
  const map: Record<string, string> = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger',
    completed: 'info',
    cancelled: 'info'
  }
  return map[status] || 'info'
}

const getStatusText = (status: string) => {
  const map: Record<string, string> = {
    pending: '待审批',
    approved: '已通过',
    rejected: '已拒绝',
    completed: '已完成',
    cancelled: '已取消'
  }
  return map[status] || status
}

const formatDate = (date: string) => new Date(date).toLocaleString()

// 加载数据
const loadData = async () => {
  try {
    const [transfersRes, approvalsRes, recordsRes, warehousesRes, productsRes] = await Promise.all([
      fetch(`${API_BASE}/inventory/transfers`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${API_BASE}/inventory/transfers/pending-approval`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${API_BASE}/inventory/transfers/records`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${API_BASE}/inventory/warehouses`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${API_BASE}/inventory/products`, { headers: { Authorization: `Bearer ${token}` } })
    ])
    transfers.value = await transfersRes.json()
    approvals.value = await approvalsRes.json()
    records.value = await recordsRes.json()
    warehouses.value = await warehousesRes.json()
    products.value = await productsRes.json()
  } catch (e) {
    ElMessage.error('加载数据失败')
  }
}

// 调拨申请
const showApplyDialog = () => {
  applyForm.value = {
    fromWarehouseId: '',
    toWarehouseId: '',
    reason: '',
    items: []
  }
  applyDialogVisible.value = true
}

const addItem = () => {
  applyForm.value.items.push({
    productId: '',
    productCode: '',
    currentStock: 0,
    quantity: 1,
    unitPrice: 0
  })
}

const removeItem = (index: number) => {
  applyForm.value.items.splice(index, 1)
}

const onProductSelect = (row: any) => {
  const product = products.value.find(p => p.id === row.productId)
  if (product) {
    row.productCode = product.productCode
    row.currentStock = product.stock?.quantity || 0
    row.unitPrice = product.costPrice
  }
}

const submitApply = async () => {
  try {
    await applyFormRef.value?.validate()
    if (applyForm.value.items.length === 0) {
      ElMessage.warning('请添加调拨产品')
      return
    }
    const res = await fetch(`${API_BASE}/inventory/transfers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(applyForm.value)
    })
    if (res.ok) {
      applyDialogVisible.value = false
      loadData()
      ElMessage.success('申请提交成功')
    } else {
      const err = await res.json()
      ElMessage.error(err.message || '提交失败')
    }
  } catch (e) {
    ElMessage.error('网络错误')
  }
}

const editTransfer = async (row: any) => {
  try {
    const res = await fetch(`${API_BASE}/inventory/transfers/${row.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const data = await res.json()
    applyForm.value = {
      fromWarehouseId: data.fromWarehouseId,
      toWarehouseId: data.toWarehouseId,
      reason: data.reason,
      items: data.items
    }
    applyDialogVisible.value = true
  } catch (e) {
    ElMessage.error('加载数据失败')
  }
}

const cancelTransfer = async (row: any) => {
  try {
    await ElMessageBox.confirm('确定取消该调拨申请？')
    const res = await fetch(`${API_BASE}/inventory/transfers/${row.id}/cancel`, {
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

// 调拨详情
const viewTransferDetail = async (row: any) => {
  try {
    const res = await fetch(`${API_BASE}/inventory/transfers/${row.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    currentTransfer.value = await res.json()
    detailDialogVisible.value = true
  } catch (e) {
    ElMessage.error('加载详情失败')
  }
}

// 审批
const approveTransfer = (row: any) => {
  currentTransfer.value = row
  approveType.value = 'approve'
  approveForm.value = { remark: '' }
  approveDialogVisible.value = true
}

const rejectTransfer = (row: any) => {
  currentTransfer.value = row
  approveType.value = 'reject'
  approveForm.value = { remark: '' }
  approveDialogVisible.value = true
}

const submitApprove = async () => {
  try {
    const url = approveType.value === 'approve' 
      ? `${API_BASE}/inventory/transfers/${currentTransfer.value.id}/approve`
      : `${API_BASE}/inventory/transfers/${currentTransfer.value.id}/reject`
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(approveForm.value)
    })
    if (res.ok) {
      approveDialogVisible.value = false
      loadData()
      ElMessage.success(approveType.value === 'approve' ? '审批通过' : '已拒绝')
    } else {
      ElMessage.error('操作失败')
    }
  } catch (e) {
    ElMessage.error('网络错误')
  }
}

// 完成调拨
const completeTransfer = async (row: any) => {
  try {
    await ElMessageBox.confirm('确认完成调拨？将更新库存。')
    const res = await fetch(`${API_BASE}/inventory/transfers/${row.id}/complete`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    })
    if (res.ok) {
      detailDialogVisible.value = false
      loadData()
      ElMessage.success('调拨完成')
    } else {
      ElMessage.error('操作失败')
    }
  } catch (e: any) {
    if (e !== 'cancel') {
      ElMessage.error('操作失败')
    }
  }
}

// 导出记录
const exportRecords = async () => {
  try {
    const params = new URLSearchParams()
    if (recordDateRange.value?.[0]) params.append('startDate', recordDateRange.value[0].toISOString())
    if (recordDateRange.value?.[1]) params.append('endDate', recordDateRange.value[1].toISOString())
    if (recordWarehouseFilter.value) params.append('warehouseId', recordWarehouseFilter.value)
    
    const res = await fetch(`${API_BASE}/inventory/transfers/records/export?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const blob = await res.blob()
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = '调拨记录.xlsx'
    link.click()
    window.URL.revokeObjectURL(url)
  } catch (e) {
    ElMessage.error('导出失败')
  }
}

onMounted(loadData)
</script>

<style scoped>
.stock-transfer-page {
  padding: 20px;
}
.toolbar {
  margin-bottom: 16px;
  display: flex;
  align-items: center;
}
</style>
