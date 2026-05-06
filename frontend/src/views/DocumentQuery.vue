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
            <el-option label="消费订单" value="consume" />
            <el-option label="充值订单" value="recharge" />
            <el-option label="开卡订单" value="open_card" />
            <el-option label="退款订单" value="refund" />
          </el-select>
        </el-form-item>
        <el-form-item label="会员">
          <el-input v-model="queryParams.memberKeyword" placeholder="姓名/手机号" clearable style="width: 150px" />
        </el-form-item>
        <el-form-item label="订单号">
          <el-input v-model="queryParams.orderNo" placeholder="订单号" clearable style="width: 180px" />
        </el-form-item>
        <el-form-item label="支付状态">
          <el-select v-model="queryParams.status" placeholder="全部状态" clearable style="width: 120px">
            <el-option label="全部" value="" />
            <el-option label="已支付" value="paid" />
            <el-option label="待支付" value="pending" />
            <el-option label="已退款" value="refunded" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            查询
          </el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
      
      <!-- 订单列表 -->
      <el-table :data="orderList" v-loading="loading" style="margin-top: 15px">
        <el-table-column prop="orderNo" label="订单号" width="180" />
        <el-table-column prop="type" label="类型" width="100">
          <template #default="{ row }">
            <el-tag>{{ orderTypeMap[row.type]?.label || row.type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="memberName" label="会员" width="120">
          <template #default="{ row }">
            {{ row.memberName || '散客' }}
          </template>
        </el-table-column>
        <el-table-column prop="memberPhone" label="手机号" width="120" />
        <el-table-column prop="totalAmount" label="金额" width="100">
          <template #default="{ row }">
            <span class="amount">¥{{ row.totalAmount }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="paymentMethod" label="支付方式" width="100" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusMap[row.status]?.tagType">{{ statusMap[row.status]?.label || row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="时间" width="180">
          <template #default="{ row }">
            {{ row.createdAt ? new Date(row.createdAt).toLocaleString() : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="operatorName" label="操作员" width="100" />
      </el-table>
      
      <!-- 分页 -->
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next"
        style="margin-top: 15px; justify-content: flex-end"
      />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

const API_BASE = 'http://localhost:3000/api'

// 查询参数
const queryParams = reactive({
  dateRange: [] as string[],
  docType: '',
  memberKeyword: '',
  orderNo: '',
  status: ''
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

// 映射
const orderTypeMap: Record<string, { label: string }> = {
  consume: { label: '消费' },
  recharge: { label: '充值' },
  open_card: { label: '开卡' },
  refund: { label: '退款' }
}

const statusMap: Record<string, { label: string; tagType: string }> = {
  paid: { label: '已支付', tagType: 'success' },
  pending: { label: '待支付', tagType: 'warning' },
  refunded: { label: '已退款', tagType: 'info' }
}

// 获取token
const getToken = (): string => {
  const token = localStorage.getItem('token')
  if (!token) {
    console.error('未找到token，请先登录')
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
    if (queryParams.status) params.append('status', queryParams.status)
    params.append('page', pagination.page.toString())
    params.append('pageSize', pagination.pageSize.toString())
    
    const res = await fetch(`${API_BASE}/documents?${params.toString()}`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`)
    }
    
    const data = await res.json()
    orderList.value = data.data || data.list || []
    pagination.total = data.total || 0
  } catch (e: any) {
    console.error('查询失败:', e)
    ElMessage.error('查询失败: ' + e.message)
  } finally {
    loading.value = false
  }
}

// 重置
const handleReset = () => {
  queryParams.dateRange = []
  queryParams.docType = ''
  queryParams.memberKeyword = ''
  queryParams.orderNo = ''
  queryParams.status = ''
  pagination.page = 1
  handleSearch()
}

// 初始化
onMounted(() => {
  // 默认查询今天
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
