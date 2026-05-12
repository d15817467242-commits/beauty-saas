<template>
  <div class="document-query-page">
    <el-card>
      <template #header>
        <span>单据查询</span>
      </template>

      <!-- 筛选条件 -->
      <el-form :inline="true" :model="queryParams" class="query-form">
        <el-form-item label="日期范围">
          <el-date-picker
            v-model="queryParams.dateRange"
            type="daterange"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="单据类型">
          <el-select v-model="queryParams.docType" placeholder="全部类型" clearable style="width: 150px">
            <el-option label="全部" value="" />
            <el-option label="消费订单" value="service" />
            <el-option label="充值订单" value="recharge" />
            <el-option label="产品购买" value="product" />
          </el-select>
        </el-form-item>
        <el-form-item label="会员">
          <el-input v-model="queryParams.memberKeyword" placeholder="姓名/手机号" clearable style="width: 150px" />
        </el-form-item>
        <el-form-item label="订单号">
          <el-input v-model="queryParams.orderNo" placeholder="订单号" clearable style="width: 180px" />
        </el-form-item>
        <el-form-item label="支付方式">
          <el-select v-model="queryParams.paymentMethod" placeholder="全部方式" clearable style="width: 120px">
            <el-option label="全部" value="" />
            <el-option label="现金" value="cash" />
            <el-option label="微信" value="wechat" />
            <el-option label="支付宝" value="alipay" />
            <el-option label="会员卡" value="card" />
            <el-option label="次卡" value="count_card" />
            <el-option label="混合" value="mixed" />
          </el-select>
        </el-form-item>
        <el-form-item label="审核状态">
          <el-select v-model="queryParams.reviewStatus" placeholder="全部" clearable style="width: 120px">
            <el-option label="全部" value="" />
            <el-option label="待审核" value="pending" />
            <el-option label="已审核" value="reviewed" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 订单列表 -->
      <el-table :data="orderList" v-loading="loading" style="margin-top: 15px" @row-click="showOrderDetail">
        <el-table-column prop="orderNo" label="订单号" width="180" />
        <el-table-column label="类型" width="80">
          <template #default="{ row }">
            <el-tag :type="orderTypeMap[row.consumptionType]?.tagType || 'info'" size="small">
              {{ orderTypeMap[row.consumptionType]?.label || row.consumptionType }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="会员" width="100">
          <template #default="{ row }">{{ row.member?.name || '散客' }}</template>
        </el-table-column>
        <el-table-column label="金额" width="90">
          <template #default="{ row }">
            <span class="amount">¥{{ row.actualAmount }}</span>
          </template>
        </el-table-column>
        <el-table-column label="支付方式" width="80">
          <template #default="{ row }">{{ paymentMethodMap[row.paymentMethod] || row.paymentMethod }}</template>
        </el-table-column>
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag v-if="row.cancelledAt" type="danger" size="small">已取消</el-tag>
            <el-tag v-else-if="row.mergedTo" type="warning" size="small">已合并</el-tag>
            <el-tag v-else type="success" size="small">正常</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="审核" width="80">
          <template #default="{ row }">
            <el-tag v-if="row.reviewStatus === 'reviewed'" type="success" size="small">已审核</el-tag>
            <el-tag v-else type="info" size="small">待审核</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="时间" width="160">
          <template #default="{ row }">{{ row.createdAt ? new Date(row.createdAt).toLocaleString() : '-' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="!row.cancelledAt && !row.mergedTo && (row.reviewStatus !== 'reviewed' || isAdmin)"
              type="primary"
              link
              size="small"
              @click.stop="handleEdit(row)"
            >修改</el-button>
            <el-button
              v-if="!row.cancelledAt && !row.mergedTo && row.reviewStatus !== 'reviewed' && isAdmin"
              type="success"
              link
              size="small"
              @click.stop="handleReview(row)"
            >审核</el-button>
            <el-button
              v-if="!row.cancelledAt && !row.mergedTo"
              type="danger"
              link
              size="small"
              @click.stop="handleCancelOrder(row)"
            >取消</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next"
        style="margin-top: 15px; justify-content: flex-end"
        @current-change="handleSearch"
        @size-change="handleSearch"
      />
    </el-card>

    <!-- 订单详情弹窗 -->
    <el-dialog v-model="detailVisible" title="订单详情" width="650px">
      <el-descriptions :column="2" border v-if="currentOrder">
        <el-descriptions-item label="订单号">{{ currentOrder.orderNo }}</el-descriptions-item>
        <el-descriptions-item label="类型">
          <el-tag :type="orderTypeMap[currentOrder.consumptionType]?.tagType || 'info'" size="small">
            {{ orderTypeMap[currentOrder.consumptionType]?.label || currentOrder.consumptionType }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="会员">{{ currentOrder.member?.name || '散客' }}</el-descriptions-item>
        <el-descriptions-item label="手机号">{{ currentOrder.member?.phone || '-' }}</el-descriptions-item>
        <el-descriptions-item label="原价">¥{{ currentOrder.amount }}</el-descriptions-item>
        <el-descriptions-item label="实收"><span class="amount">¥{{ currentOrder.actualAmount }}</span></el-descriptions-item>
        <el-descriptions-item label="优惠">¥{{ currentOrder.discountAmount }}</el-descriptions-item>
        <el-descriptions-item label="支付方式">{{ paymentMethodMap[currentOrder.paymentMethod] || currentOrder.paymentMethod }}</el-descriptions-item>
        <el-descriptions-item label="审核状态">
          <el-tag v-if="currentOrder.reviewStatus === 'reviewed'" type="success" size="small">已审核</el-tag>
          <el-tag v-else type="info" size="small">待审核</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="审核时间">{{ currentOrder.reviewedAt ? new Date(currentOrder.reviewedAt).toLocaleString() : '-' }}</el-descriptions-item>
        <el-descriptions-item label="时间">{{ new Date(currentOrder.createdAt).toLocaleString() }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ currentOrder.remark || '-' }}</el-descriptions-item>
      </el-descriptions>
      <el-divider content-position="left">消费项目</el-divider>
      <el-table :data="currentOrder?.items || []" size="small">
        <el-table-column prop="serviceName" label="项目" />
        <el-table-column prop="price" label="单价" width="80">
          <template #default="{ row }">¥{{ row.price }}</template>
        </el-table-column>
        <el-table-column prop="quantity" label="数量" width="60" />
        <el-table-column prop="amount" label="金额" width="80">
          <template #default="{ row }">¥{{ row.amount }}</template>
        </el-table-column>
        <el-table-column prop="employeeName" label="员工" width="80" />
      </el-table>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
        <el-button
          v-if="currentOrder && !currentOrder.cancelledAt && !currentOrder.mergedTo && (currentOrder.reviewStatus !== 'reviewed' || isAdmin)"
          type="primary"
          @click="handleEdit(currentOrder)"
        >修改</el-button>
        <el-button
          v-if="currentOrder && !currentOrder.cancelledAt && !currentOrder.mergedTo && currentOrder.reviewStatus !== 'reviewed' && isAdmin"
          type="success"
          @click="handleReview(currentOrder)"
        >审核</el-button>
        <el-button
          v-if="currentOrder && !currentOrder.cancelledAt && !currentOrder.mergedTo"
          type="danger"
          @click="handleCancelOrder(currentOrder)"
        >取消订单</el-button>
      </template>
    </el-dialog>

    <!-- 修改订单弹窗 -->
    <el-dialog v-model="editVisible" title="修改订单" width="650px">
      <el-form :model="editForm" label-width="80px" v-if="editForm">
        <el-form-item label="订单号">
          <el-input :value="editForm.orderNo" disabled />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="editForm.remark" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="实收金额">
          <el-input-number v-model="editForm.actualAmount" :min="0" :precision="2" />
        </el-form-item>
        <el-form-item label="支付方式">
          <el-select v-model="editForm.paymentMethod" style="width: 200px">
            <el-option label="现金" value="cash" />
            <el-option label="微信" value="wechat" />
            <el-option label="支付宝" value="alipay" />
            <el-option label="会员卡" value="card" />
            <el-option label="次卡" value="count_card" />
            <el-option label="混合" value="mixed" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" @click="submitEdit" :loading="editLoading">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const API_BASE = 'http://localhost:3000/api'

// 当前用户角色
const userRole = ref(localStorage.getItem('role') || '')
const isAdmin = computed(() => userRole.value === 'admin' || userRole.value === 'manager')

// 查询参数
const queryParams = reactive({
  dateRange: [] as string[],
  docType: '',
  memberKeyword: '',
  orderNo: '',
  paymentMethod: '',
  reviewStatus: ''
})

// 分页
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

// 数据
const orderList = ref<any[]>([])
const loading = ref(false)
const detailVisible = ref(false)
const currentOrder = ref<any>(null)
const editVisible = ref(false)
const editLoading = ref(false)
const editForm = ref<any>(null)

// 映射
const orderTypeMap: Record<string, { label: string; tagType: string }> = {
  service: { label: '消费', tagType: 'success' },
  recharge: { label: '充值', tagType: 'warning' },
  product: { label: '产品', tagType: 'info' },
}

const paymentMethodMap: Record<string, string> = {
  cash: '现金',
  wechat: '微信',
  alipay: '支付宝',
  card: '会员卡',
  count_card: '次卡',
  mixed: '混合',
}

// 获取token
const getToken = (): string => {
  const token = localStorage.getItem('token')
  if (!token) {
    ElMessage.error('请先登录')
  }
  return token || ''
}

// 查询
const handleSearch = async () => {
  const token = getToken()
  if (!token) return

  loading.value = true
  try {
    const params = new URLSearchParams()
    if (queryParams.dateRange && queryParams.dateRange.length === 2) {
      params.append('startDate', queryParams.dateRange[0])
      params.append('endDate', queryParams.dateRange[1])
    }
    if (queryParams.docType) params.append('type', queryParams.docType)
    if (queryParams.memberKeyword) params.append('memberKeyword', queryParams.memberKeyword)
    if (queryParams.orderNo) params.append('orderNo', queryParams.orderNo)
    if (queryParams.paymentMethod) params.append('paymentMethod', queryParams.paymentMethod)
    if (queryParams.reviewStatus) params.append('status', queryParams.reviewStatus)
    params.append('page', pagination.page.toString())
    params.append('pageSize', pagination.pageSize.toString())

    const res = await fetch(`${API_BASE}/documents?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    if (!res.ok) throw new Error(`HTTP ${res.status}`)

    const data = await res.json()
    orderList.value = data.data || []
    pagination.total = data.total || 0
  } catch (e: any) {
    ElMessage.error('查询失败: ' + e.message)
  } finally {
    loading.value = false
  }
}

// 重置
const handleReset = () => {
  const today = new Date().toISOString().split('T')[0]
  queryParams.dateRange = [today, today]
  queryParams.docType = ''
  queryParams.memberKeyword = ''
  queryParams.orderNo = ''
  queryParams.paymentMethod = ''
  queryParams.reviewStatus = ''
  pagination.page = 1
  handleSearch()
}

// 查看订单详情
const showOrderDetail = (row: any) => {
  currentOrder.value = row
  detailVisible.value = true
}

// 修改订单
const handleEdit = (row: any) => {
  detailVisible.value = false
  editForm.value = {
    orderNo: row.orderNo,
    remark: row.remark || '',
    actualAmount: Number(row.actualAmount),
    paymentMethod: row.paymentMethod,
  }
  editVisible.value = true
}

// 提交修改
const submitEdit = async () => {
  if (!editForm.value) return
  editLoading.value = true
  try {
    const res = await fetch(`${API_BASE}/documents/${editForm.value.orderNo}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${getToken()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        remark: editForm.value.remark,
        actualAmount: editForm.value.actualAmount,
        paymentMethod: editForm.value.paymentMethod,
      })
    })

    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.message || '修改失败')
    }

    ElMessage.success('修改成功')
    editVisible.value = false
    handleSearch()
  } catch (e: any) {
    ElMessage.error(e.message || '修改失败')
  } finally {
    editLoading.value = false
  }
}

// 审核订单
const handleReview = async (row: any) => {
  try {
    await ElMessageBox.confirm(`确认审核订单 ${row.orderNo}？审核后收银员将无法修改。`, '审核确认', { type: 'warning' })
  } catch { return }

  try {
    const res = await fetch(`${API_BASE}/documents/${row.orderNo}/review`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${getToken()}` }
    })
    if (res.ok) {
      ElMessage.success('审核成功')
      detailVisible.value = false
      handleSearch()
    } else {
      const err = await res.json()
      ElMessage.error(err.message || '审核失败')
    }
  } catch (e: any) {
    ElMessage.error('网络错误')
  }
}

// 取消订单
const handleCancelOrder = async (row: any) => {
  try {
    await ElMessageBox.confirm(`确认取消订单 ${row.orderNo}？此操作不可恢复。`, '取消确认', { type: 'warning' })
  } catch { return }

  try {
    const res = await fetch(`${API_BASE}/documents/${row.orderNo}/cancel`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${getToken()}` }
    })
    if (res.ok) {
      ElMessage.success('订单已取消')
      detailVisible.value = false
      handleSearch()
    } else {
      const err = await res.json()
      ElMessage.error(err.message || '取消失败')
    }
  } catch (e: any) {
    ElMessage.error('网络错误')
  }
}

// 初始化 - 默认查当天
onMounted(() => {
  const today = new Date().toISOString().split('T')[0]
  queryParams.dateRange = [today, today]
  handleSearch()
})
</script>

<style scoped>
.document-query-page {
  padding: 20px;
}

.query-form {
  background: #f5f7fa;
  padding: 15px;
  border-radius: 4px;
}

.amount {
  color: #f56c6c;
  font-weight: bold;
}
</style>
