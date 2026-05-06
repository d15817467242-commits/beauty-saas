<template>
  <div class="store-expense-page">
    <el-tabs v-model="activeTab" type="border-card">
      <!-- 收支开单 -->
      <el-tab-pane label="收支开单" name="create">
        <el-form :model="form" label-width="100px" :rules="rules" ref="formRef">
          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="类型" prop="type">
                <el-radio-group v-model="form.type">
                  <el-radio value="income">收入</el-radio>
                  <el-radio value="expense">支出</el-radio>
                </el-radio-group>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="分类" prop="categoryId">
                <el-select v-model="form.categoryId" placeholder="选择分类" style="width: 100%;">
                  <el-option v-for="c in filteredCategories" :key="c.id" :label="c.name" :value="c.id" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="金额" prop="amount">
                <el-input-number v-model="form.amount" :min="0" :precision="2" style="width: 100%;" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="发生日期" prop="expenseDate">
                <el-date-picker v-model="form.expenseDate" type="date" placeholder="选择日期" style="width: 100%;" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="支付方式">
                <el-select v-model="form.paymentMethod" placeholder="选择支付方式" style="width: 100%;">
                  <el-option label="现金" value="cash" />
                  <el-option label="微信" value="wechat" />
                  <el-option label="支付宝" value="alipay" />
                  <el-option label="银行卡" value="bank" />
                  <el-option label="其他" value="other" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="经手人">
                <el-input v-model="form.handler" placeholder="经手人" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item label="备注">
            <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="备注信息" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="submitForm">保存</el-button>
            <el-button @click="resetForm">重置</el-button>
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <!-- 收支记录 -->
      <el-tab-pane label="收支记录" name="list">
        <div class="toolbar">
          <el-radio-group v-model="searchType" style="margin-right: 16px;">
            <el-radio-button value="">全部</el-radio-button>
            <el-radio-button value="income">收入</el-radio-button>
            <el-radio-button value="expense">支出</el-radio-button>
          </el-radio-group>
          <el-select v-model="searchCategoryId" placeholder="分类" clearable style="width: 150px;">
            <el-option v-for="c in categories" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
          <el-date-picker
            v-model="searchDateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="margin-left: 16px;"
          />
          <el-button type="primary" style="margin-left: 16px;" @click="loadExpenses">查询</el-button>
        </div>
        <el-row :gutter="20" style="margin-bottom: 20px;">
          <el-col :span="6">
            <el-card shadow="hover">
              <el-statistic title="总收入" :value="summary.totalIncome" :precision="2" prefix="¥" />
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover">
              <el-statistic title="总支出" :value="summary.totalExpense" :precision="2" prefix="¥" />
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover">
              <el-statistic title="净收入" :value="summary.netIncome" :precision="2" prefix="¥" />
            </el-card>
          </el-col>
        </el-row>
        <el-table :data="expenseList" stripe>
          <el-table-column prop="documentNo" label="单据编号" width="180" />
          <el-table-column prop="type" label="类型" width="80">
            <template #default="{ row }">
              <el-tag :type="row.type === 'income' ? 'success' : 'danger'">
                {{ row.type === 'income' ? '收入' : '支出' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="category.name" label="分类" width="120" />
          <el-table-column prop="amount" label="金额" width="120">
            <template #default="{ row }">
              <span :class="row.type === 'income' ? 'income-amount' : 'expense-amount'">
                {{ row.type === 'income' ? '+' : '-' }}¥{{ row.amount?.toFixed(2) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="expenseDate" label="发生日期" width="120">
            <template #default="{ row }">{{ row.expenseDate?.slice(0, 10) }}</template>
          </el-table-column>
          <el-table-column prop="paymentMethod" label="支付方式" width="100" />
          <el-table-column prop="handler" label="经手人" width="100" />
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="remark" label="备注" />
          <el-table-column label="操作" width="150">
            <template #default="{ row }">
              <el-button v-if="row.status === 'pending'" link type="primary" @click="approveExpense(row)">审核</el-button>
              <el-button link @click="viewDetail(row)">详情</el-button>
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
          @size-change="loadExpenses"
          @current-change="loadExpenses"
        />
      </el-tab-pane>

      <!-- 收支分类管理 -->
      <el-tab-pane label="分类管理" name="category">
        <div class="toolbar">
          <el-button type="primary" @click="showCategoryDialog()">新增分类</el-button>
        </div>
        <el-table :data="categories" stripe>
          <el-table-column prop="name" label="分类名称" />
          <el-table-column prop="code" label="分类编码" width="150" />
          <el-table-column prop="type" label="类型" width="100">
            <template #default="{ row }">
              <el-tag :type="row.type === 'income' ? 'success' : 'danger'">
                {{ row.type === 'income' ? '收入' : '支出' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="sort" label="排序" width="80" />
          <el-table-column prop="isActive" label="状态" width="80">
            <template #default="{ row }">
              <el-tag :type="row.isActive ? 'success' : 'info'">{{ row.isActive ? '启用' : '禁用' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150">
            <template #default="{ row }">
              <el-button link type="primary" @click="showCategoryDialog(row)">编辑</el-button>
              <el-button link type="danger" @click="deleteCategory(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <!-- 分类对话框 -->
    <el-dialog v-model="categoryDialogVisible" :title="categoryForm.id ? '编辑分类' : '新增分类'" width="500px">
      <el-form :model="categoryForm" label-width="100px">
        <el-form-item label="分类名称">
          <el-input v-model="categoryForm.name" />
        </el-form-item>
        <el-form-item label="分类编码">
          <el-input v-model="categoryForm.code" />
        </el-form-item>
        <el-form-item label="类型">
          <el-radio-group v-model="categoryForm.type">
            <el-radio value="income">收入</el-radio>
            <el-radio value="expense">支出</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="categoryForm.sort" :min="0" />
        </el-form-item>
        <el-form-item label="是否启用">
          <el-switch v-model="categoryForm.isActive" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="categoryForm.remark" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="categoryDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveCategory">保存</el-button>
      </template>
    </el-dialog>

    <!-- 详情对话框 -->
    <el-dialog v-model="detailVisible" title="收支详情" width="600px">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="单据编号">{{ currentExpense.documentNo }}</el-descriptions-item>
        <el-descriptions-item label="类型">
          <el-tag :type="currentExpense.type === 'income' ? 'success' : 'danger'">
            {{ currentExpense.type === 'income' ? '收入' : '支出' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="分类">{{ currentExpense.category?.name }}</el-descriptions-item>
        <el-descriptions-item label="金额">¥{{ currentExpense.amount?.toFixed(2) }}</el-descriptions-item>
        <el-descriptions-item label="发生日期">{{ currentExpense.expenseDate?.slice(0, 10) }}</el-descriptions-item>
        <el-descriptions-item label="支付方式">{{ currentExpense.paymentMethod }}</el-descriptions-item>
        <el-descriptions-item label="经手人">{{ currentExpense.handler }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusType(currentExpense.status)">{{ getStatusText(currentExpense.status) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ currentExpense.remark || '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance } from 'element-plus'

const API_BASE = 'http://localhost:3000/api'
const token = localStorage.getItem('token') || ''

const activeTab = ref('create')
const categories = ref<any[]>([])
const expenseList = ref<any[]>([])

const formRef = ref<FormInstance>()
const form = ref({
  type: 'expense',
  categoryId: '',
  amount: 0,
  expenseDate: new Date(),
  paymentMethod: 'cash',
  handler: '',
  remark: ''
})
const rules = {
  type: [{ required: true, message: '请选择类型', trigger: 'change' }],
  categoryId: [{ required: true, message: '请选择分类', trigger: 'change' }],
  amount: [{ required: true, message: '请输入金额', trigger: 'blur' }],
  expenseDate: [{ required: true, message: '请选择日期', trigger: 'change' }]
}

const searchType = ref('')
const searchCategoryId = ref('')
const searchDateRange = ref<[Date, Date] | null>(null)
const pagination = ref({ page: 1, pageSize: 20, total: 0 })
const summary = ref({ totalIncome: 0, totalExpense: 0, netIncome: 0 })

const categoryDialogVisible = ref(false)
const categoryForm = ref<any>({ type: 'expense', sort: 0, isActive: true })

const detailVisible = ref(false)
const currentExpense = ref<any>({})

const filteredCategories = computed(() => {
  return categories.value.filter(c => c.type === form.value.type && c.isActive)
})

const getStatusType = (status: string) => {
  const map: Record<string, string> = { pending: 'warning', approved: 'success', rejected: 'danger' }
  return map[status] || 'info'
}

const getStatusText = (status: string) => {
  const map: Record<string, string> = { pending: '待审核', approved: '已审核', rejected: '已拒绝' }
  return map[status] || status
}

const loadCategories = async () => {
  try {
    const res = await fetch(`${API_BASE}/expense/categories`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    categories.value = await res.json()
  } catch (e) {
    ElMessage.error('加载分类失败')
  }
}

const loadExpenses = async () => {
  try {
    const params = new URLSearchParams()
    if (searchType.value) params.append('type', searchType.value)
    if (searchCategoryId.value) params.append('categoryId', searchCategoryId.value)
    if (searchDateRange.value?.[0]) params.append('startDate', searchDateRange.value[0].toISOString())
    if (searchDateRange.value?.[1]) params.append('endDate', searchDateRange.value[1].toISOString())
    params.append('page', pagination.value.page.toString())
    params.append('pageSize', pagination.value.pageSize.toString())
    
    const res = await fetch(`${API_BASE}/expense?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const data = await res.json()
    expenseList.value = data.data || data
    pagination.value.total = data.total || expenseList.value.length
    calculateSummary()
  } catch (e) {
    ElMessage.error('加载收支记录失败')
  }
}

const calculateSummary = () => {
  let totalIncome = 0
  let totalExpense = 0
  for (const item of expenseList.value) {
    if (item.status === 'approved') {
      if (item.type === 'income') {
        totalIncome += Number(item.amount)
      } else {
        totalExpense += Number(item.amount)
      }
    }
  }
  summary.value = { totalIncome, totalExpense, netIncome: totalIncome - totalExpense }
}

const submitForm = async () => {
  try {
    await formRef.value?.validate()
    const res = await fetch(`${API_BASE}/expense`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(form.value)
    })
    if (res.ok) {
      ElMessage.success('保存成功')
      resetForm()
      loadExpenses()
    } else {
      const err = await res.json()
      ElMessage.error(err.message || '保存失败')
    }
  } catch (e) {
    ElMessage.error('网络错误')
  }
}

const resetForm = () => {
  form.value = {
    type: 'expense',
    categoryId: '',
    amount: 0,
    expenseDate: new Date(),
    paymentMethod: 'cash',
    handler: '',
    remark: ''
  }
}

const showCategoryDialog = (row?: any) => {
  categoryForm.value = row ? { ...row } : { type: 'expense', sort: 0, isActive: true }
  categoryDialogVisible.value = true
}

const saveCategory = async () => {
  try {
    const url = categoryForm.value.id ? `${API_BASE}/expense/categories/${categoryForm.value.id}` : `${API_BASE}/expense/categories`
    const method = categoryForm.value.id ? 'PUT' : 'POST'
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(categoryForm.value)
    })
    if (res.ok) {
      categoryDialogVisible.value = false
      loadCategories()
      ElMessage.success('保存成功')
    } else {
      ElMessage.error('保存失败')
    }
  } catch (e) {
    ElMessage.error('网络错误')
  }
}

const deleteCategory = async (row: any) => {
  try {
    await ElMessageBox.confirm('确定删除该分类？')
    const res = await fetch(`${API_BASE}/expense/categories/${row.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    })
    if (res.ok) {
      loadCategories()
      ElMessage.success('删除成功')
    } else {
      ElMessage.error('删除失败')
    }
  } catch (e: any) {
    if (e !== 'cancel') ElMessage.error('删除失败')
  }
}

const approveExpense = async (row: any) => {
  try {
    await ElMessageBox.confirm('确定审核通过？')
    const res = await fetch(`${API_BASE}/expense/${row.id}/approve`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    })
    if (res.ok) {
      ElMessage.success('审核成功')
      loadExpenses()
    } else {
      ElMessage.error('审核失败')
    }
  } catch (e: any) {
    if (e !== 'cancel') ElMessage.error('审核失败')
  }
}

const viewDetail = (row: any) => {
  currentExpense.value = row
  detailVisible.value = true
}

onMounted(() => {
  loadCategories()
  loadExpenses()
})
</script>

<style scoped>
.store-expense-page { padding: 20px; }
.toolbar { margin-bottom: 16px; display: flex; align-items: center; }
.income-amount { color: #67c23a; font-weight: bold; }
.expense-amount { color: #f56c6c; font-weight: bold; }
</style>
