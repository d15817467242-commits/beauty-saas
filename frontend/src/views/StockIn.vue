<template>
  <div class="stock-in-page">
    <el-tabs v-model="activeTab" type="border-card">
      <!-- 入库开单 -->
      <el-tab-pane label="入库开单" name="create">
        <el-form :model="form" label-width="100px" :rules="rules" ref="formRef">
          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="供应商" prop="supplierId">
                <el-select v-model="form.supplierId" placeholder="选择供应商" style="width: 100%;">
                  <el-option v-for="s in suppliers" :key="s.id" :label="s.name" :value="s.id" />
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
          <el-divider>入库明细</el-divider>
          <el-table :data="form.items" stripe>
            <el-table-column label="产品" width="250">
              <template #default="{ row }">
                <el-select v-model="row.productId" placeholder="选择产品" filterable @change="onProductSelect(row)">
                  <el-option v-for="p in products" :key="p.id" :label="p.name" :value="p.id" />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column prop="productCode" label="编码" width="120" />
            <el-table-column label="数量" width="150">
              <template #default="{ row }">
                <el-input-number v-model="row.quantity" :min="1" size="small" @change="calculateTotal(row)" />
              </template>
            </el-table-column>
            <el-table-column label="单价" width="150">
              <template #default="{ row }">
                <el-input-number v-model="row.unitPrice" :min="0" :precision="2" size="small" @change="calculateTotal(row)" />
              </template>
            </el-table-column>
            <el-table-column prop="totalPrice" label="总价" width="120">
              <template #default="{ row }">¥{{ row.totalPrice?.toFixed(2) || '0.00' }}</template>
            </el-table-column>
            <el-table-column label="备注" width="150">
              <template #default="{ row }">
                <el-input v-model="row.remark" size="small" placeholder="备注" />
              </template>
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
          </el-row>
          <el-form-item label="备注">
            <el-input v-model="form.remark" type="textarea" :rows="2" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="submitForm">保存入库单</el-button>
            <el-button @click="resetForm">重置</el-button>
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <!-- 入库单列表 -->
      <el-tab-pane label="入库单列表" name="list">
        <div class="toolbar">
          <el-input v-model="searchOrderNo" placeholder="入库单号" style="width: 200px;" clearable />
          <el-select v-model="searchStatus" placeholder="状态" clearable style="width: 120px; margin-left: 16px;">
            <el-option label="草稿" value="draft" />
            <el-option label="待审核" value="pending" />
            <el-option label="已审核" value="approved" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
          <el-date-picker
            v-model="searchDateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="margin-left: 16px;"
          />
          <el-button type="primary" style="margin-left: 16px;" @click="loadStockInList">查询</el-button>
        </div>
        <el-table :data="stockInList" stripe>
          <el-table-column prop="orderNo" label="入库单号" width="180" />
          <el-table-column prop="supplier.name" label="供应商" />
          <el-table-column prop="totalAmount" label="总金额" width="120">
            <template #default="{ row }">¥{{ row.totalAmount?.toFixed(2) }}</template>
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
              <el-button v-if="row.status === 'draft'" link type="primary" @click="approveStockIn(row)">审核</el-button>
              <el-button v-if="row.status === 'draft'" link type="danger" @click="cancelStockIn(row)">取消</el-button>
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
          @size-change="loadStockInList"
          @current-change="loadStockInList"
        />
      </el-tab-pane>
    </el-tabs>

    <!-- 详情对话框 -->
    <el-dialog v-model="detailVisible" title="入库单详情" width="800px">
      <el-descriptions :column="3" border>
        <el-descriptions-item label="入库单号">{{ currentStockIn.orderNo }}</el-descriptions-item>
        <el-descriptions-item label="供应商">{{ currentStockIn.supplier?.name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusType(currentStockIn.status)">{{ getStatusText(currentStockIn.status) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="总金额">¥{{ currentStockIn.totalAmount?.toFixed(2) }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ formatDate(currentStockIn.createdAt) }}</el-descriptions-item>
        <el-descriptions-item label="备注">{{ currentStockIn.remark || '-' }}</el-descriptions-item>
      </el-descriptions>
      <el-divider>入库明细</el-divider>
      <el-table :data="currentStockIn.items" stripe>
        <el-table-column prop="productId" label="产品ID" />
        <el-table-column prop="quantity" label="数量" width="100" />
        <el-table-column prop="unitPrice" label="单价" width="120">
          <template #default="{ row }">¥{{ row.unitPrice?.toFixed(2) }}</template>
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
const suppliers = ref<any[]>([])
const warehouses = ref<any[]>([])
const products = ref<any[]>([])
const stockInList = ref<any[]>([])

const formRef = ref<FormInstance>()
const form = ref({
  supplierId: '',
  warehouseId: '',
  items: [] as any[],
  remark: ''
})
const rules = {
  supplierId: [{ required: true, message: '请选择供应商', trigger: 'change' }]
}

const searchOrderNo = ref('')
const searchStatus = ref('')
const searchDateRange = ref<[Date, Date] | null>(null)
const pagination = ref({ page: 1, pageSize: 20, total: 0 })

const detailVisible = ref(false)
const currentStockIn = ref<any>({})

const totalQuantity = computed(() => form.value.items.reduce((sum, item) => sum + (item.quantity || 0), 0))
const totalAmount = computed(() => form.value.items.reduce((sum, item) => sum + (item.totalPrice || 0), 0))

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
    const [suppliersRes, warehousesRes, productsRes] = await Promise.all([
      fetch(`${API_BASE}/suppliers`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${API_BASE}/warehouses`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${API_BASE}/inventory/products`, { headers: { Authorization: `Bearer ${token}` } })
    ])
    const suppliersData = await suppliersRes.json()
    const warehousesData = await warehousesRes.json()
    const productsData = await productsRes.json()
    suppliers.value = suppliersData.data || suppliersData
    warehouses.value = warehousesData.data || warehousesData
    products.value = productsData.data || productsData
  } catch (e) {
    ElMessage.error('加载数据失败')
  }
}

const loadStockInList = async () => {
  try {
    const params = new URLSearchParams()
    if (searchOrderNo.value) params.append('orderNo', searchOrderNo.value)
    if (searchStatus.value) params.append('status', searchStatus.value)
    if (searchDateRange.value?.[0]) params.append('startDate', searchDateRange.value[0].toISOString())
    if (searchDateRange.value?.[1]) params.append('endDate', searchDateRange.value[1].toISOString())
    params.append('page', pagination.value.page.toString())
    params.append('pageSize', pagination.value.pageSize.toString())
    
    const res = await fetch(`${API_BASE}/stock/in?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const data = await res.json()
    stockInList.value = data.data || data.list || data.records || data.items || data
    pagination.value.total = data.total || stockInList.value.length
  } catch (e) {
    ElMessage.error('加载入库单列表失败')
  }
}

const addItem = () => {
  form.value.items.push({ productId: '', quantity: 1, unitPrice: 0, totalPrice: 0, remark: '' })
}

const removeItem = (index: number) => {
  form.value.items.splice(index, 1)
}

const onProductSelect = (row: any) => {
  const product = products.value.find(p => p.id === row.productId)
  if (product) {
    row.productCode = product.productCode
    row.unitPrice = product.costPrice || 0
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
      ElMessage.warning('请添加入库产品')
      return
    }
    const res = await fetch(`${API_BASE}/stock/in`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(form.value)
    })
    if (res.ok) {
      ElMessage.success('入库单创建成功')
      resetForm()
      loadStockInList()
    } else {
      const err = await res.json()
      ElMessage.error(err.message || '创建失败')
    }
  } catch (e) {
    ElMessage.error('网络错误')
  }
}

const resetForm = () => {
  form.value = { supplierId: '', warehouseId: '', items: [], remark: '' }
}

const viewDetail = async (row: any) => {
  try {
    const res = await fetch(`${API_BASE}/stock/in/${row.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    currentStockIn.value = await res.json()
    detailVisible.value = true
  } catch (e) {
    ElMessage.error('加载详情失败')
  }
}

const approveStockIn = async (row: any) => {
  try {
    await ElMessageBox.confirm('确定审核该入库单？')
    const res = await fetch(`${API_BASE}/stock/in/${row.id}/approve`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    })
    if (res.ok) {
      ElMessage.success('审核成功')
      loadStockInList()
    } else {
      ElMessage.error('审核失败')
    }
  } catch (e: any) {
    if (e !== 'cancel') ElMessage.error('操作失败')
  }
}

const cancelStockIn = async (row: any) => {
  try {
    await ElMessageBox.confirm('确定取消该入库单？')
    const res = await fetch(`${API_BASE}/stock/in/${row.id}/cancel`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    })
    if (res.ok) {
      ElMessage.success('已取消')
      loadStockInList()
    } else {
      ElMessage.error('操作失败')
    }
  } catch (e: any) {
    if (e !== 'cancel') ElMessage.error('操作失败')
  }
}

onMounted(() => {
  loadData()
  loadStockInList()
})
</script>

<style scoped>
.stock-in-page { padding: 20px; }
.toolbar { margin-bottom: 16px; display: flex; align-items: center; }
</style>
