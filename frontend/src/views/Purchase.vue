<template>
  <div class="purchase-page">
    <el-tabs v-model="activeTab" type="border-card">
      <!-- 采购申请 -->
      <el-tab-pane label="采购申请" name="apply">
        <div class="toolbar">
          <el-button type="primary" @click="showApplyDialog">新建采购申请</el-button>
          <el-select v-model="applyStatusFilter" placeholder="状态筛选" clearable style="width: 150px; margin-left: 16px;">
            <el-option label="待审批" value="pending" />
            <el-option label="已通过" value="approved" />
            <el-option label="已拒绝" value="rejected" />
            <el-option label="已入库" value="stocked" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
        </div>
        <el-table :data="filteredApplies" stripe>
          <el-table-column prop="purchaseNo" label="采购单号" width="180" />
          <el-table-column prop="supplierName" label="供应商" />
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
          <el-table-column prop="expectedDate" label="期望到货" width="120">
            <template #default="{ row }">{{ formatDateShort(row.expectedDate) }}</template>
          </el-table-column>
          <el-table-column prop="createdAt" label="申请时间" width="180">
            <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
          </el-table-column>
          <el-table-column prop="applicant" label="申请人" width="100" />
          <el-table-column label="操作" width="250">
            <template #default="{ row }">
              <el-button link @click="viewPurchaseDetail(row)">查看</el-button>
              <el-button v-if="row.status === 'pending'" link type="primary" @click="editPurchase(row)">编辑</el-button>
              <el-button v-if="row.status === 'approved'" link type="success" @click="showStockInDialog(row)">入库</el-button>
              <el-button v-if="row.status === 'pending'" link type="danger" @click="cancelPurchase(row)">取消</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- 采购审批 -->
      <el-tab-pane label="采购审批" name="approve">
        <div class="toolbar">
          <el-input v-model="approveSearch" placeholder="搜索采购单号" style="width: 200px;" clearable />
        </div>
        <el-table :data="filteredApprovals" stripe>
          <el-table-column prop="purchaseNo" label="采购单号" width="180" />
          <el-table-column prop="supplierName" label="供应商" />
          <el-table-column prop="totalQuantity" label="总数量" width="100" />
          <el-table-column prop="totalAmount" label="总金额" width="120">
            <template #default="{ row }">¥{{ row.totalAmount?.toFixed(2) || '0.00' }}</template>
          </el-table-column>
          <el-table-column prop="expectedDate" label="期望到货" width="120">
            <template #default="{ row }">{{ formatDateShort(row.expectedDate) }}</template>
          </el-table-column>
          <el-table-column prop="applicant" label="申请人" width="100" />
          <el-table-column prop="createdAt" label="申请时间" width="180">
            <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="200">
            <template #default="{ row }">
              <el-button link @click="viewPurchaseDetail(row)">查看</el-button>
              <el-button link type="success" @click="approvePurchase(row)">通过</el-button>
              <el-button link type="danger" @click="rejectPurchase(row)">拒绝</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- 采购记录 -->
      <el-tab-pane label="采购记录" name="records">
        <div class="toolbar">
          <el-date-picker
            v-model="recordDateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
          />
          <el-select v-model="recordSupplierFilter" placeholder="供应商筛选" clearable style="width: 200px; margin-left: 16px;">
            <el-option v-for="s in suppliers" :key="s.id" :label="s.name" :value="s.id" />
          </el-select>
          <el-button type="primary" style="margin-left: 16px;" @click="exportRecords">导出</el-button>
        </div>
        <el-table :data="filteredRecords" stripe>
          <el-table-column prop="purchaseNo" label="采购单号" width="180" />
          <el-table-column prop="supplierName" label="供应商" />
          <el-table-column prop="productName" label="产品名称" />
          <el-table-column prop="quantity" label="采购数量" width="100" />
          <el-table-column prop="unitPrice" label="单价" width="100">
            <template #default="{ row }">¥{{ row.unitPrice?.toFixed(2) || '0.00' }}</template>
          </el-table-column>
          <el-table-column prop="amount" label="金额" width="120">
            <template #default="{ row }">¥{{ row.amount?.toFixed(2) || '0.00' }}</template>
          </el-table-column>
          <el-table-column prop="stockedInAt" label="入库时间" width="180">
            <template #default="{ row }">{{ formatDate(row.stockedInAt) }}</template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <!-- 新建采购申请对话框 -->
    <el-dialog v-model="applyDialogVisible" title="新建采购申请" width="900px">
      <el-form :model="applyForm" label-width="100px" :rules="applyRules" ref="applyFormRef">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="供应商" prop="supplierId">
              <el-select v-model="applyForm.supplierId" placeholder="选择供应商" filterable style="width: 100%;" @change="onSupplierChange">
                <el-option v-for="s in suppliers" :key="s.id" :label="s.name" :value="s.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="期望到货" prop="expectedDate">
              <el-date-picker v-model="applyForm.expectedDate" type="date" placeholder="选择日期" style="width: 100%;" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="采购原因" prop="reason">
          <el-input v-model="applyForm.reason" type="textarea" :rows="2" />
        </el-form-item>
        <el-divider>采购明细</el-divider>
        <el-table :data="applyForm.items" stripe>
          <el-table-column label="产品" width="250">
            <template #default="{ row }">
              <el-select v-model="row.productId" placeholder="选择产品" filterable @change="onProductSelect(row)">
                <el-option v-for="p in supplierProducts" :key="p.id" :label="p.name" :value="p.id" />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column prop="productCode" label="编码" width="120" />
          <el-table-column prop="currentStock" label="当前库存" width="100" />
          <el-table-column label="采购数量" width="150">
            <template #default="{ row }">
              <el-input-number v-model="row.quantity" :min="1" size="small" />
            </template>
          </el-table-column>
          <el-table-column label="单价" width="150">
            <template #default="{ row }">
              <el-input-number v-model="row.unitPrice" :min="0" :precision="2" size="small" />
            </template>
          </el-table-column>
          <el-table-column prop="amount" label="金额" width="120">
            <template #default="{ row }">¥{{ ((row.quantity || 0) * (row.unitPrice || 0)).toFixed(2) }}</template>
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
          <el-col :span="8">
            <el-form-item label="总数量">
              <el-input :value="totalQuantity" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="总金额">
              <el-input :value="'¥' + totalAmount.toFixed(2)" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="付款方式">
              <el-select v-model="applyForm.paymentMethod">
                <el-option label="月结" value="monthly" />
                <el-option label="现结" value="cash" />
                <el-option label="预付" value="prepay" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="applyDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitApply">提交申请</el-button>
      </template>
    </el-dialog>

    <!-- 采购详情对话框 -->
    <el-dialog v-model="detailDialogVisible" title="采购详情" width="900px">
      <el-descriptions :column="3" border>
        <el-descriptions-item label="采购单号">{{ currentPurchase.purchaseNo }}</el-descriptions-item>
        <el-descriptions-item label="供应商">{{ currentPurchase.supplierName }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusType(currentPurchase.status)">
            {{ getStatusText(currentPurchase.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="期望到货">{{ formatDateShort(currentPurchase.expectedDate) }}</el-descriptions-item>
        <el-descriptions-item label="申请人">{{ currentPurchase.applicant }}</el-descriptions-item>
        <el-descriptions-item label="申请时间">{{ formatDate(currentPurchase.createdAt) }}</el-descriptions-item>
        <el-descriptions-item label="采购原因" :span="3">{{ currentPurchase.reason || '-' }}</el-descriptions-item>
        <el-descriptions-item v-if="currentPurchase.approver" label="审批人">{{ currentPurchase.approver }}</el-descriptions-item>
        <el-descriptions-item v-if="currentPurchase.approvedAt" label="审批时间">{{ formatDate(currentPurchase.approvedAt) }}</el-descriptions-item>
        <el-descriptions-item v-if="currentPurchase.approveRemark" label="审批备注">{{ currentPurchase.approveRemark }}</el-descriptions-item>
      </el-descriptions>
      <el-divider>采购明细</el-divider>
      <el-table :data="currentPurchase.items" stripe>
        <el-table-column prop="productName" label="产品名称" />
        <el-table-column prop="productCode" label="编码" width="120" />
        <el-table-column prop="quantity" label="采购数量" width="100" />
        <el-table-column prop="unitPrice" label="单价" width="100">
          <template #default="{ row }">¥{{ row.unitPrice?.toFixed(2) || '0.00' }}</template>
        </el-table-column>
        <el-table-column prop="amount" label="金额" width="120">
          <template #default="{ row }">¥{{ row.amount?.toFixed(2) || '0.00' }}</template>
        </el-table-column>
        <el-table-column prop="stockedInQuantity" label="已入库" width="100">
          <template #default="{ row }">{{ row.stockedInQuantity || 0 }}</template>
        </el-table-column>
      </el-table>
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

    <!-- 入库对话框 -->
    <el-dialog v-model="stockInDialogVisible" title="采购入库" width="800px">
      <el-form :model="stockInForm" label-width="100px" ref="stockInFormRef">
        <el-form-item label="入库仓库" prop="warehouseId">
          <el-select v-model="stockInForm.warehouseId" placeholder="选择仓库" style="width: 100%;">
            <el-option v-for="w in warehouses" :key="w.id" :label="w.name" :value="w.id" />
          </el-select>
        </el-form-item>
        <el-divider>入库明细</el-divider>
        <el-table :data="stockInForm.items" stripe>
          <el-table-column prop="productName" label="产品名称" />
          <el-table-column prop="quantity" label="采购数量" width="100" />
          <el-table-column prop="stockedInQuantity" label="已入库" width="100" />
          <el-table-column label="本次入库" width="150">
            <template #default="{ row }">
              <el-input-number v-model="row.thisQuantity" :min="0" :max="row.quantity - row.stockedInQuantity" size="small" />
            </template>
          </el-table-column>
          <el-table-column prop="unitPrice" label="单价" width="100">
            <template #default="{ row }">¥{{ row.unitPrice?.toFixed(2) || '0.00' }}</template>
          </el-table-column>
        </el-table>
      </el-form>
      <template #footer>
        <el-button @click="stockInDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitStockIn">确认入库</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'

const activeTab = ref('apply')
const purchases = ref<any[]>([])
const approvals = ref<any[]>([])
const records = ref<any[]>([])
const suppliers = ref<any[]>([])
const warehouses = ref<any[]>([])
const supplierProducts = ref<any[]>([])

const applyStatusFilter = ref('')
const approveSearch = ref('')
const recordDateRange = ref<[Date, Date] | null>(null)
const recordSupplierFilter = ref('')

// 对话框
const applyDialogVisible = ref(false)
const detailDialogVisible = ref(false)
const approveDialogVisible = ref(false)
const stockInDialogVisible = ref(false)

// 表单
const applyFormRef = ref<FormInstance>()
const stockInFormRef = ref<FormInstance>()
const applyForm = ref({
  supplierId: '',
  expectedDate: '',
  reason: '',
  paymentMethod: 'monthly',
  items: [] as any[]
})
const applyRules = {
  supplierId: [{ required: true, message: '请选择供应商', trigger: 'change' }],
  expectedDate: [{ required: true, message: '请选择期望到货日期', trigger: 'change' }],
  reason: [{ required: true, message: '请输入采购原因', trigger: 'blur' }]
}

const currentPurchase = ref<any>({})
const approveType = ref<'approve' | 'reject'>('approve')
const approveForm = ref({ remark: '' })

const stockInForm = ref({
  warehouseId: '',
  items: [] as any[]
})

// 计算属性
const filteredApplies = computed(() => {
  if (!applyStatusFilter.value) return purchases.value
  return purchases.value.filter(p => p.status === applyStatusFilter.value)
})

const filteredApprovals = computed(() => {
  if (!approveSearch.value) return approvals.value
  return approvals.value.filter(p => p.purchaseNo.includes(approveSearch.value))
})

const filteredRecords = computed(() => {
  let result = records.value
  if (recordDateRange.value) {
    const [start, end] = recordDateRange.value
    result = result.filter(r => {
      const date = new Date(r.stockedInAt)
      return date >= start && date <= end
    })
  }
  if (recordSupplierFilter.value) {
    result = result.filter(r => r.supplierId === recordSupplierFilter.value)
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
    stocked: 'info',
    cancelled: 'info'
  }
  return map[status] || 'info'
}

const getStatusText = (status: string) => {
  const map: Record<string, string> = {
    pending: '待审批',
    approved: '已通过',
    rejected: '已拒绝',
    stocked: '已入库',
    cancelled: '已取消'
  }
  return map[status] || status
}

const formatDate = (date: string) => new Date(date).toLocaleString()
const formatDateShort = (date: string) => date ? new Date(date).toLocaleDateString() : '-'

// 加载数据
const loadData = async () => {
  try {
    const [purchasesRes, approvalsRes, recordsRes, suppliersRes, warehousesRes] = await Promise.all([
      axios.get('/api/inventory/purchases'),
      axios.get('/api/inventory/purchases/pending-approval'),
      axios.get('/api/inventory/purchases/records'),
      axios.get('/api/inventory/suppliers'),
      axios.get('/api/inventory/warehouses')
    ])
    purchases.value = purchasesRes.data
    approvals.value = approvalsRes.data
    records.value = recordsRes.data
    suppliers.value = suppliersRes.data
    warehouses.value = warehousesRes.data
  } catch (e) {
    ElMessage.error('加载数据失败')
  }
}

// 采购申请
const showApplyDialog = () => {
  applyForm.value = {
    supplierId: '',
    expectedDate: '',
    reason: '',
    paymentMethod: 'monthly',
    items: []
  }
  supplierProducts.value = []
  applyDialogVisible.value = true
}

const onSupplierChange = async (supplierId: string) => {
  try {
    const res = await axios.get(`/api/inventory/suppliers/${supplierId}/products`)
    supplierProducts.value = res.data
  } catch (e) {
    supplierProducts.value = []
  }
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
  const product = supplierProducts.value.find(p => p.id === row.productId)
  if (product) {
    row.productCode = product.productCode
    row.currentStock = product.currentStock || 0
    row.unitPrice = product.purchasePrice || product.costPrice
  }
}

const submitApply = async () => {
  try {
    await applyFormRef.value?.validate()
    if (applyForm.value.items.length === 0) {
      ElMessage.warning('请添加采购产品')
      return
    }
    await axios.post('/api/inventory/purchases', applyForm.value)
    applyDialogVisible.value = false
    loadData()
    ElMessage.success('申请提交成功')
  } catch (e: any) {
    if (e.response) {
      ElMessage.error(e.response.data?.message || '提交失败')
    }
  }
}

const editPurchase = async (row: any) => {
  try {
    const res = await axios.get(`/api/inventory/purchases/${row.id}`)
    applyForm.value = {
      supplierId: res.data.supplierId,
      expectedDate: res.data.expectedDate,
      reason: res.data.reason,
      paymentMethod: res.data.paymentMethod || 'monthly',
      items: res.data.items
    }
    await onSupplierChange(res.data.supplierId)
    applyDialogVisible.value = true
  } catch (e) {
    ElMessage.error('加载数据失败')
  }
}

const cancelPurchase = async (row: any) => {
  try {
    await ElMessageBox.confirm('确定取消该采购申请？')
    await axios.post(`/api/inventory/purchases/${row.id}/cancel`)
    loadData()
    ElMessage.success('已取消')
  } catch (e: any) {
    if (e !== 'cancel') {
      ElMessage.error('操作失败')
    }
  }
}

// 采购详情
const viewPurchaseDetail = async (row: any) => {
  try {
    const res = await axios.get(`/api/inventory/purchases/${row.id}`)
    currentPurchase.value = res.data
    detailDialogVisible.value = true
  } catch (e) {
    ElMessage.error('加载详情失败')
  }
}

// 审批
const approvePurchase = (row: any) => {
  currentPurchase.value = row
  approveType.value = 'approve'
  approveForm.value = { remark: '' }
  approveDialogVisible.value = true
}

const rejectPurchase = (row: any) => {
  currentPurchase.value = row
  approveType.value = 'reject'
  approveForm.value = { remark: '' }
  approveDialogVisible.value = true
}

const submitApprove = async () => {
  try {
    const url = approveType.value === 'approve' 
      ? `/api/inventory/purchases/${currentPurchase.value.id}/approve`
      : `/api/inventory/purchases/${currentPurchase.value.id}/reject`
    await axios.post(url, approveForm.value)
    approveDialogVisible.value = false
    loadData()
    ElMessage.success(approveType.value === 'approve' ? '审批通过' : '已拒绝')
  } catch (e) {
    ElMessage.error('操作失败')
  }
}

// 入库
const showStockInDialog = async (row: any) => {
  try {
    const res = await axios.get(`/api/inventory/purchases/${row.id}`)
    currentPurchase.value = res.data
    stockInForm.value = {
      warehouseId: '',
      items: res.data.items.map((item: any) => ({
        ...item,
        thisQuantity: item.quantity - (item.stockedInQuantity || 0)
      }))
    }
    stockInDialogVisible.value = true
  } catch (e) {
    ElMessage.error('加载数据失败')
  }
}

const submitStockIn = async () => {
  try {
    await stockInFormRef.value?.validate()
    await axios.post(`/api/inventory/purchases/${currentPurchase.value.id}/stock-in`, stockInForm.value)
    stockInDialogVisible.value = false
    loadData()
    ElMessage.success('入库成功')
  } catch (e) {
    ElMessage.error('入库失败')
  }
}

// 导出记录
const exportRecords = async () => {
  try {
    const res = await axios.get('/api/inventory/purchases/records/export', {
      params: {
        startDate: recordDateRange.value?.[0],
        endDate: recordDateRange.value?.[1],
        supplierId: recordSupplierFilter.value
      },
      responseType: 'blob'
    })
    const url = window.URL.createObjectURL(res.data)
    const link = document.createElement('a')
    link.href = url
    link.download = '采购记录.xlsx'
    link.click()
    window.URL.revokeObjectURL(url)
  } catch (e) {
    ElMessage.error('导出失败')
  }
}

onMounted(loadData)
</script>

<style scoped>
.purchase-page {
  padding: 20px;
}
.toolbar {
  margin-bottom: 16px;
  display: flex;
  align-items: center;
}
</style>
