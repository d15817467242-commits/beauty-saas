<template>
  <div class="supplier-page">
    <el-tabs v-model="activeTab" type="border-card">
      <!-- 供应商列表 -->
      <el-tab-pane label="供应商列表" name="list">
        <div class="toolbar">
          <el-button type="primary" @click="showSupplierDialog()">新增供应商</el-button>
          <el-input v-model="searchKeyword" placeholder="搜索供应商名称/编码" style="width: 250px; margin-left: 16px;" clearable />
          <el-select v-model="statusFilter" placeholder="状态筛选" clearable style="width: 120px; margin-left: 16px;">
            <el-option label="启用" value="active" />
            <el-option label="停用" value="inactive" />
          </el-select>
          <el-select v-model="categoryFilter" placeholder="分类筛选" clearable style="width: 150px; margin-left: 16px;">
            <el-option v-for="c in categories" :key="c" :label="c" :value="c" />
          </el-select>
        </div>
        <el-table :data="filteredSuppliers" stripe>
          <el-table-column prop="supplierCode" label="供应商编码" width="150" />
          <el-table-column prop="name" label="供应商名称" />
          <el-table-column prop="category" label="分类" width="120" />
          <el-table-column prop="contact" label="联系人" width="100" />
          <el-table-column prop="phone" label="联系电话" width="130" />
          <el-table-column prop="rating" label="评级" width="150">
            <template #default="{ row }">
              <el-rate v-model="row.rating" disabled />
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="80">
            <template #default="{ row }">
              <el-tag :type="row.status === 'active' ? 'success' : 'info'">
                {{ row.status === 'active' ? '启用' : '停用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200">
            <template #default="{ row }">
              <el-button link @click="viewSupplierDetail(row)">详情</el-button>
              <el-button link @click="showSupplierDialog(row)">编辑</el-button>
              <el-button link type="danger" @click="deleteSupplier(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- 供应商统计 -->
      <el-tab-pane label="供应商统计" name="statistics">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-card>
              <el-statistic title="供应商总数" :value="statistics.total" />
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card>
              <el-statistic title="活跃供应商" :value="statistics.active" />
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card>
              <el-statistic title="本月采购额" :value="statistics.monthlyAmount" prefix="¥" />
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card>
              <el-statistic title="平均评级" :value="statistics.avgRating" suffix="星" />
            </el-card>
          </el-col>
        </el-row>
        <el-divider />
        <el-row :gutter="20">
          <el-col :span="12">
            <div class="chart-title">采购额TOP10供应商</div>
            <div ref="topChartRef" style="height: 350px;"></div>
          </el-col>
          <el-col :span="12">
            <div class="chart-title">供应商分类分布</div>
            <div ref="categoryChartRef" style="height: 350px;"></div>
          </el-col>
        </el-row>
      </el-tab-pane>
    </el-tabs>

    <!-- 供应商表单对话框 -->
    <el-dialog v-model="supplierDialogVisible" :title="supplierForm.id ? '编辑供应商' : '新增供应商'" width="700px">
      <el-form :model="supplierForm" label-width="100px" :rules="supplierRules" ref="supplierFormRef">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="供应商名称" prop="name">
              <el-input v-model="supplierForm.name" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="供应商编码" prop="supplierCode">
              <el-input v-model="supplierForm.supplierCode" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="分类" prop="category">
              <el-select v-model="supplierForm.category" placeholder="选择分类" style="width: 100%;">
                <el-option label="原材料" value="原材料" />
                <el-option label="耗材" value="耗材" />
                <el-option label="设备" value="设备" />
                <el-option label="服务" value="服务" />
                <el-option label="其他" value="其他" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="评级">
              <el-rate v-model="supplierForm.rating" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-divider>联系信息</el-divider>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="联系人" prop="contact">
              <el-input v-model="supplierForm.contact" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系电话" prop="phone">
              <el-input v-model="supplierForm.phone" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="邮箱">
              <el-input v-model="supplierForm.email" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="传真">
              <el-input v-model="supplierForm.fax" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="地址">
          <el-input v-model="supplierForm.address" />
        </el-form-item>
        <el-divider>财务信息</el-divider>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="开户银行">
              <el-input v-model="supplierForm.bankName" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="银行账号">
              <el-input v-model="supplierForm.bankAccount" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="税号">
              <el-input v-model="supplierForm.taxNumber" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="付款方式">
              <el-select v-model="supplierForm.paymentMethod" style="width: 100%;">
                <el-option label="月结" value="monthly" />
                <el-option label="现结" value="cash" />
                <el-option label="预付" value="prepay" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="账期(天)">
              <el-input-number v-model="supplierForm.creditDays" :min="0" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态">
              <el-radio-group v-model="supplierForm.status">
                <el-radio value="active">启用</el-radio>
                <el-radio value="inactive">停用</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="备注">
          <el-input v-model="supplierForm.remark" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="supplierDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveSupplier">保存</el-button>
      </template>
    </el-dialog>

    <!-- 供应商详情对话框 -->
    <el-dialog v-model="detailDialogVisible" title="供应商详情" width="900px">
      <el-tabs type="border-card">
        <el-tab-pane label="基本信息">
          <el-descriptions :column="3" border>
            <el-descriptions-item label="供应商编码">{{ currentSupplier.supplierCode }}</el-descriptions-item>
            <el-descriptions-item label="供应商名称">{{ currentSupplier.name }}</el-descriptions-item>
            <el-descriptions-item label="分类">{{ currentSupplier.category }}</el-descriptions-item>
            <el-descriptions-item label="联系人">{{ currentSupplier.contact }}</el-descriptions-item>
            <el-descriptions-item label="联系电话">{{ currentSupplier.phone }}</el-descriptions-item>
            <el-descriptions-item label="邮箱">{{ currentSupplier.email || '-' }}</el-descriptions-item>
            <el-descriptions-item label="地址" :span="3">{{ currentSupplier.address || '-' }}</el-descriptions-item>
            <el-descriptions-item label="开户银行">{{ currentSupplier.bankName || '-' }}</el-descriptions-item>
            <el-descriptions-item label="银行账号">{{ currentSupplier.bankAccount || '-' }}</el-descriptions-item>
            <el-descriptions-item label="税号">{{ currentSupplier.taxNumber || '-' }}</el-descriptions-item>
            <el-descriptions-item label="付款方式">{{ getPaymentMethod(currentSupplier.paymentMethod) }}</el-descriptions-item>
            <el-descriptions-item label="账期">{{ currentSupplier.creditDays }}天</el-descriptions-item>
            <el-descriptions-item label="评级">
              <el-rate v-model="currentSupplier.rating" disabled />
            </el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="currentSupplier.status === 'active' ? 'success' : 'info'">
                {{ currentSupplier.status === 'active' ? '启用' : '停用' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ formatDate(currentSupplier.createdAt) }}</el-descriptions-item>
            <el-descriptions-item label="备注" :span="3">{{ currentSupplier.remark || '-' }}</el-descriptions-item>
          </el-descriptions>
        </el-tab-pane>
        <el-tab-pane label="供应产品">
          <el-table :data="supplierProducts" stripe>
            <el-table-column prop="productCode" label="产品编码" width="150" />
            <el-table-column prop="productName" label="产品名称" />
            <el-table-column prop="specification" label="规格" />
            <el-table-column prop="unitPrice" label="采购价" width="120">
              <template #default="{ row }">¥{{ row.unitPrice?.toFixed(2) || '0.00' }}</template>
            </el-table-column>
            <el-table-column prop="minOrderQuantity" label="最小起订量" width="120" />
            <el-table-column prop="leadTime" label="交货周期(天)" width="120" />
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="采购记录">
          <el-table :data="purchaseRecords" stripe>
            <el-table-column prop="purchaseNo" label="采购单号" width="180" />
            <el-table-column prop="totalAmount" label="采购金额" width="120">
              <template #default="{ row }">¥{{ row.totalAmount?.toFixed(2) || '0.00' }}</template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getPurchaseStatusType(row.status)">
                  {{ getPurchaseStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="createdAt" label="采购时间" width="180">
              <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="对账记录">
          <el-table :data="reconciliationRecords" stripe>
            <el-table-column prop="period" label="账期" width="150" />
            <el-table-column prop="totalAmount" label="应付金额" width="120">
              <template #default="{ row }">¥{{ row.totalAmount?.toFixed(2) || '0.00' }}</template>
            </el-table-column>
            <el-table-column prop="paidAmount" label="已付金额" width="120">
              <template #default="{ row }">¥{{ row.paidAmount?.toFixed(2) || '0.00' }}</template>
            </el-table-column>
            <el-table-column prop="unpaidAmount" label="未付金额" width="120">
              <template #default="{ row }">
                <span :class="{ 'unpaid': row.unpaidAmount > 0 }">
                  ¥{{ row.unpaidAmount?.toFixed(2) || '0.00' }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.status === 'settled' ? 'success' : 'warning'">
                  {{ row.status === 'settled' ? '已结清' : '待付款' }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance } from 'element-plus'
import * as echarts from 'echarts'

const API_BASE = 'http://localhost:3000/api'
const token = localStorage.getItem('token') || ''

const activeTab = ref('list')
const suppliers = ref<any[]>([])
const categories = ref<string[]>([])

const searchKeyword = ref('')
const statusFilter = ref('')
const categoryFilter = ref('')

const statistics = ref({
  total: 0,
  active: 0,
  monthlyAmount: 0,
  avgRating: 0
})

// 对话框
const supplierDialogVisible = ref(false)
const detailDialogVisible = ref(false)

// 表单
const supplierFormRef = ref<FormInstance>()
const supplierForm = ref<any>({
  id: null,
  name: '',
  supplierCode: '',
  category: '',
  contact: '',
  phone: '',
  email: '',
  fax: '',
  address: '',
  bankName: '',
  bankAccount: '',
  taxNumber: '',
  paymentMethod: 'monthly',
  creditDays: 30,
  rating: 3,
  status: 'active',
  remark: ''
})

const supplierRules = {
  name: [{ required: true, message: '请输入供应商名称', trigger: 'blur' }],
  supplierCode: [{ required: true, message: '请输入供应商编码', trigger: 'blur' }],
  category: [{ required: true, message: '请选择分类', trigger: 'change' }],
  contact: [{ required: true, message: '请输入联系人', trigger: 'blur' }],
  phone: [{ required: true, message: '请输入联系电话', trigger: 'blur' }]
}

const currentSupplier = ref<any>({})
const supplierProducts = ref<any[]>([])
const purchaseRecords = ref<any[]>([])
const reconciliationRecords = ref<any[]>([])

// 图表
const topChartRef = ref<HTMLElement>()
const categoryChartRef = ref<HTMLElement>()
let topChart: echarts.ECharts
let categoryChart: echarts.ECharts

// 计算属性
const filteredSuppliers = computed(() => {
  let result = suppliers.value
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter(s => 
      s.name.toLowerCase().includes(keyword) || 
      s.supplierCode.toLowerCase().includes(keyword)
    )
  }
  if (statusFilter.value) {
    result = result.filter(s => s.status === statusFilter.value)
  }
  if (categoryFilter.value) {
    result = result.filter(s => s.category === categoryFilter.value)
  }
  return result
})

// 方法
const formatDate = (date: string) => new Date(date).toLocaleString()

const getPaymentMethod = (method: string) => {
  const map: Record<string, string> = {
    monthly: '月结',
    cash: '现结',
    prepay: '预付'
  }
  return map[method] || method
}

const getPurchaseStatusType = (status: string) => {
  const map: Record<string, string> = {
    pending: 'warning',
    approved: 'success',
    completed: 'info'
  }
  return map[status] || 'info'
}

const getPurchaseStatusText = (status: string) => {
  const map: Record<string, string> = {
    pending: '待审批',
    approved: '已通过',
    completed: '已完成'
  }
  return map[status] || status
}

// 加载数据
const loadData = async () => {
  try {
    const [suppliersRes, statsRes] = await Promise.all([
      fetch(`${API_BASE}/inventory/suppliers`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${API_BASE}/inventory/suppliers/statistics`, { headers: { Authorization: `Bearer ${token}` } })
    ])
    const suppliersData = await suppliersRes.json()
    const statsData = await statsRes.json()
    suppliers.value = suppliersData
    statistics.value = statsData
    categories.value = [...new Set(suppliersData.map((s: any) => s.category))] as string[]
  } catch (e) {
    ElMessage.error('加载数据失败')
  }
}

// 供应商管理
const showSupplierDialog = (row?: any) => {
  if (row) {
    supplierForm.value = { ...row }
  } else {
    supplierForm.value = {
      name: '',
      supplierCode: '',
      category: '',
      contact: '',
      phone: '',
      email: '',
      fax: '',
      address: '',
      bankName: '',
      bankAccount: '',
      taxNumber: '',
      paymentMethod: 'monthly',
      creditDays: 30,
      rating: 3,
      status: 'active',
      remark: ''
    }
  }
  supplierDialogVisible.value = true
}

const saveSupplier = async () => {
  try {
    await supplierFormRef.value?.validate()
    const url = supplierForm.value.id ? `${API_BASE}/inventory/suppliers/${supplierForm.value.id}` : `${API_BASE}/inventory/suppliers`
    const method = supplierForm.value.id ? 'PUT' : 'POST'
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(supplierForm.value)
    })
    if (res.ok) {
      supplierDialogVisible.value = false
      loadData()
      ElMessage.success('保存成功')
    } else {
      const err = await res.json()
      ElMessage.error(err.message || '保存失败')
    }
  } catch (e) {
    ElMessage.error('网络错误')
  }
}

const deleteSupplier = async (row: any) => {
  try {
    await ElMessageBox.confirm('确定删除该供应商？')
    const res = await fetch(`${API_BASE}/inventory/suppliers/${row.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    })
    if (res.ok) {
      loadData()
      ElMessage.success('删除成功')
    } else {
      ElMessage.error('删除失败')
    }
  } catch (e: any) {
    if (e !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

// 供应商详情
const viewSupplierDetail = async (row: any) => {
  try {
    const [detailRes, productsRes, purchaseRes, reconciliationRes] = await Promise.all([
      fetch(`${API_BASE}/inventory/suppliers/${row.id}`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${API_BASE}/inventory/suppliers/${row.id}/products`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${API_BASE}/inventory/suppliers/${row.id}/purchases`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${API_BASE}/inventory/suppliers/${row.id}/reconciliations`, { headers: { Authorization: `Bearer ${token}` } })
    ])
    currentSupplier.value = await detailRes.json()
    supplierProducts.value = await productsRes.json()
    purchaseRecords.value = await purchaseRes.json()
    reconciliationRecords.value = await reconciliationRes.json()
    detailDialogVisible.value = true
  } catch (e) {
    ElMessage.error('加载详情失败')
  }
}

// 图表
const initCharts = () => {
  nextTick(() => {
    if (topChartRef.value) {
      topChart = echarts.init(topChartRef.value)
      topChart.setOption({
        tooltip: { trigger: 'axis' },
        xAxis: { type: 'value' },
        yAxis: { 
          type: 'category',
          data: ['供应商A', '供应商B', '供应商C', '供应商D', '供应商E']
        },
        series: [{
          type: 'bar',
          data: [50000, 42000, 35000, 28000, 22000]
        }]
      })
    }
    if (categoryChartRef.value) {
      categoryChart = echarts.init(categoryChartRef.value)
      categoryChart.setOption({
        tooltip: { trigger: 'item' },
        legend: { orient: 'vertical', left: 'left' },
        series: [{
          type: 'pie',
          radius: '50%',
          data: [
            { value: 10, name: '原材料' },
            { value: 8, name: '耗材' },
            { value: 5, name: '设备' },
            { value: 3, name: '服务' }
          ]
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
.supplier-page {
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
.unpaid {
  color: #f56c6c;
  font-weight: bold;
}
</style>
