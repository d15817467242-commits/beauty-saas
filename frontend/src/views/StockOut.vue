<template>
  <div class="stock-out-page">
    <el-tabs v-model="activeTab" type="border-card">
      <!-- 出库开单 -->
      <el-tab-pane label="出库开单" name="create">
        <el-form :model="form" label-width="100px" :rules="rules" ref="formRef">
          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="出库类型" prop="type">
                <el-select v-model="form.type" placeholder="选择类型" style="width: 100%;">
                  <el-option label="销售" value="sale" />
                  <el-option label="报损" value="loss" />
                  <el-option label="退货" value="return" />
                  <el-option label="其他" value="other" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="仓库">
                <el-select v-model="form.warehouseId" placeholder="选择仓库" style="width: 100%;">
                  <el-option v-for="w in warehouses" :key="w.id" :label="w.name" :value="w.id" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-divider>出库明细</el-divider>
          <el-table :data="form.items" stripe>
            <el-table-column label="产品" width="250">
              <template #default="{ row }">
                <el-select v-model="row.productId" placeholder="选择产品" filterable @change="onProductSelect(row)">
                  <el-option v-for="p in products" :key="p.id" :label="p.name" :value="p.id" />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column prop="productCode" label="编码" width="120" />
            <el-table-column prop="currentStock" label="当前库存" width="100" />
            <el-table-column label="出库数量" width="150">
              <template #default="{ row }">
                <el-input-number v-model="row.quantity" :min="1" :max="row.currentStock" size="small" @change="calculateTotal(row)" />
              </template>
            </el-table-column>
            <el-table-column label="销售单价" width="150">
              <template #default="{ row }">
                <el-input-number v-model="row.unitPrice" :min="0" :precision="2" size="small" @change="calculateTotal(row)" />
              </template>
            </el-table-column>
            <el-table-column prop="totalPrice" label="总价" width="120">
              <template #default="{ row }">¥{{ row.totalPrice?.toFixed(2) || '0.00' }}</template>
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
              <el-form-item label="成本金额">
                <el-input :value="'¥' + costAmount.toFixed(2)" disabled />
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item label="备注">
            <el-input v-model="form.remark" type="textarea" :rows="2" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="submitForm">保存出库单</el-button>
            <el-button @click="resetForm">重置</el-button>
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <!-- 出库单列表 -->
      <el-tab-pane label="出库单列表" name="list">
        <div class="toolbar">
          <el-input v-model="searchOrderNo" placeholder="出库单号" style="width: 200px;" clearable />
          <el-select v-model="searchType" placeholder="类型" clearable style="width: 120px; margin-left: 16px;">
            <el-option label="销售" value="sale" />
            <el-option label="报损" value="loss" />
            <el-option label="退货" value="return" />
            <el-option label="其他" value="other" />
          </el-select>
          <el-select v-model="searchStatus" placeholder="状态" clearable style="width: 120px; margin-left: 16px;">
            <el-option label="草稿" value="draft" />
            <el-option label="待审核" value="pending" />
            <el-option label="已审核" value="approved" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
          <el-button type="primary" style="margin-left: 16px;" @click="loadStockOutList">查询</el-button>
        </div>
        <el-table :data="stockOutList" stripe>
          <el-table-column prop="orderNo" label="出库单号" width="180" />
          <el-table-column prop="type" label="类型" width="100">
            <template #default="{ row }">
              <el-tag :type="getTypeTag(row.type)">{{ getTypeText(row.type) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="totalAmount" label="销售金额" width="120">
            <template #default="{ row }">¥{{ row.totalAmount?.toFixed(2) }}</template>
          </el-table-column>
          <el-table-column prop="costAmount" label="成本金额" width="120">
            <template #default="{ row }">¥{{ row.costAmount?.toFixed(2) }}</template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createdAt" label="创建时间" width="180">
            <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="200">
            <template #default="{ row }">
              <el-button link @click="viewDetail(row)">查看</el-button>
              <el-button v-if="row.status === 'draft'" link type="primary" @click="approveStockOut(row)">审核</el-button>
              <el-button v-if="row.status === 'draft'" link type="danger" @click="cancelStockOut(row)">取消</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          style="margin-top: 16px; justify-content: flex-end;"
          @size-change="loadStockOutList"
          @current-change="loadStockOutList"
        />
      </el-tab-pane>
    </el-tabs>

    <!-- 详情对话框 -->
    <el-dialog v-model="detailVisible" title="出库单详情" width="800px">
      <el-descriptions :column="3" border>
        <el-descriptions-item label="出库单号">{{ currentStockOut.orderNo }}</el-descriptions-item>
        <el-descriptions-item label="类型">
          <el-tag :type="getTypeTag(currentStockOut.type)">{{ getTypeText(currentStockOut.type) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusType(currentStockOut.status)">{{ getStatusText(currentStockOut.status) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="销售金额">¥{{ currentStockOut.totalAmount?.toFixed(2) }}</el-descriptions-item>
        <el-descriptions-item label="成本金额">¥{{ currentStockOut.costAmount?.toFixed(2) }}</el-descriptions-item>
        <el-descriptions-item label="毛利">¥{{ ((currentStockOut.totalAmount || 0) - (currentStockOut.costAmount || 0)).toFixed(2) }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ formatDate(currentStockOut.createdAt) }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ currentStockOut.remark || '-' }}</el-descriptions-item>
      </el-descriptions>
      <el-divider>出库明细</el-divider>
      <el-table :data="currentStockOut.items" stripe>
        <el-table-column prop="productId" label="产品ID" />
        <el-table-column prop="quantity" label="数量" width="100" />
        <el-table-column prop="unitPrice" label="销售单价" width="120">
          <template #default="{ row }">¥{{ row.unitPrice?.toFixed(2) }}</template>
        </el-table-column>
        <el-table-column prop="costPrice" label="成本单价" width="120">
          <template #default="{ row }">¥{{ row.costPrice?.toFixed(2) }}</template>
        </el-table-column>
        <el-table-column prop="totalPrice" label="总价" width="120">
          <template #default="{ row }">¥{{ row.totalPrice?.toFixed(2) }}</template>
        </el-table-column>
      </el-table>
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

const activeTab = ref('create')
const warehouses = ref<any[]>([])
const products = ref<any[]>([])
const stockOutList = ref<any[]>([])

const formRef = ref<FormInstance>()
const form = ref({
  type: 'sale',
  warehouseId: '',
  items: [] as any[],
  remark: ''
})
const rules = {
  type: [{ required: true, message: '请选择出库类型', trigger: 'change' }]
}

const searchOrderNo = ref('')
const searchType = ref('')
const searchStatus = ref('')
const pagination = ref({ page: 1, pageSize: 20, total: 0 })

const detailVisible = ref(false)
const currentStockOut = ref<any>({})

const totalQuantity = computed(() => form.value.items.reduce((sum, item) => sum + (item.quantity || 0), 0))
const totalAmount = computed(() => form.value.items.reduce((sum, item) => sum + (item.totalPrice || 0), 0))
const costAmount = computed(() => form.value.items.reduce((sum, item) => sum + ((item.quantity || 0) * (item.costPrice || 0)), 0))

const getTypeTag = (type: string) => {
  const map: Record<string, string> = { sale: 'success', loss: 'danger', return: 'warning', other: 'info' }
  return map[type] || 'info'
}

const getTypeText = (type: string) => {
  const map: Record<string, string> = { sale: '销售', loss: '报损', return: '退货', other: '其他' }
  return map[type] || type
}

const getStatusType = (status: string) => {
  const map: Record<string, string> = { draft: 'info', pending: 'warning', approved: 'success', cancelled: 'danger' }
  return map[status] || 'info'
}

const getStatusText = (status: string) => {
  const map: Record<string, string> = { draft: '草稿', pending: '待审核', approved: '已审核', cancelled: '已取消' }
  return map[status] || status
}

const formatDate = (date: string) => new Date(date).toLocaleString()

const loadData = async () => {
  try {
    const [warehousesRes, productsRes] = await Promise.all([
      fetch(`${API_BASE}/warehouses`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${API_BASE}/inventory/products`, { headers: { Authorization: `Bearer ${token}` } })
    ])
    const warehousesData = await warehousesRes.json()
    const productsData = await productsRes.json()
    warehouses.value = warehousesData.data || warehousesData
    products.value = productsData.data || productsData
  } catch (e) {
    ElMessage.error('加载数据失败')
  }
}

const loadStockOutList = async () => {
  try {
    const params = new URLSearchParams()
    if (searchOrderNo.value) params.append('orderNo', searchOrderNo.value)
    if (searchType.value) params.append('type', searchType.value)
    if (searchStatus.value) params.append('status', searchStatus.value)
    params.append('page', pagination.value.page.toString())
    params.append('pageSize', pagination.value.pageSize.toString())
    
    const res = await fetch(`${API_BASE}/stock/out?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const data = await res.json()
    stockOutList.value = data.data || data.list || data.records || data.items || data
    pagination.value.total = data.total || stockOutList.value.length
  } catch (e) {
    ElMessage.error('加载出库单列表失败')
  }
}

const addItem = () => {
  form.value.items.push({ productId: '', quantity: 1, unitPrice: 0, costPrice: 0, totalPrice: 0, currentStock: 0 })
}

const removeItem = (index: number) => {
  form.value.items.splice(index, 1)
}

const onProductSelect = (row: any) => {
  const product = products.value.find(p => p.id === row.productId)
  if (product) {
    row.productCode = product.productCode
    row.currentStock = product.stock?.quantity || 0
    row.unitPrice = product.salePrice || 0
    row.costPrice = product.costPrice || 0
    calculateTotal(row)
  }
}

const calculateTotal = (row: any) => {
  row.totalPrice = (row.quantity || 0) * (row.unitPrice || 0)
}

const submitForm = async () => {
  try {
    await formRef.value?.validate()
    if (form.value.items.length === 0) {
      ElMessage.warning('请添加出库产品')
      return
    }
    const res = await fetch(`${API_BASE}/stock/out`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(form.value)
    })
    if (res.ok) {
      ElMessage.success('出库单创建成功')
      resetForm()
      loadStockOutList()
    } else {
      const err = await res.json()
      ElMessage.error(err.message || '创建失败')
    }
  } catch (e) {
    ElMessage.error('网络错误')
  }
}

const resetForm = () => {
  form.value = { type: 'sale', warehouseId: '', items: [], remark: '' }
}

const viewDetail = async (row: any) => {
  try {
    const res = await fetch(`${API_BASE}/stock/out/${row.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    currentStockOut.value = await res.json()
    detailVisible.value = true
  } catch (e) {
    ElMessage.error('加载详情失败')
  }
}

const approveStockOut = async (row: any) => {
  try {
    await ElMessageBox.confirm('确定审核该出库单？')
    const res = await fetch(`${API_BASE}/stock/out/${row.id}/approve`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    })
    if (res.ok) {
      ElMessage.success('审核成功')
      loadStockOutList()
    } else {
      ElMessage.error('审核失败')
    }
  } catch (e: any) {
    if (e !== 'cancel') ElMessage.error('操作失败')
  }
}

const cancelStockOut = async (row: any) => {
  try {
    await ElMessageBox.confirm('确定取消该出库单？')
    const res = await fetch(`${API_BASE}/stock/out/${row.id}/cancel`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    })
    if (res.ok) {
      ElMessage.success('已取消')
      loadStockOutList()
    } else {
      ElMessage.error('操作失败')
    }
  } catch (e: any) {
    if (e !== 'cancel') ElMessage.error('操作失败')
  }
}

onMounted(() => {
  loadData()
  loadStockOutList()
})
</script>

<style scoped>
.stock-out-page { padding: 20px; }
.toolbar { margin-bottom: 16px; display: flex; align-items: center; }
</style>
