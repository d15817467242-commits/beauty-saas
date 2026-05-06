<template>
  <div class="credit-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>挂账管理</span>
          <div>
            <el-select v-model="filterStatus" placeholder="状态筛选" clearable style="width: 120px; margin-right: 8px;">
              <el-option label="待还款" value="pending" />
              <el-option label="部分还款" value="partial" />
              <el-option label="已结清" value="settled" />
              <el-option label="已逾期" value="overdue" />
            </el-select>
            <el-input v-model="searchPhone" placeholder="手机号搜索" style="width: 150px;" clearable />
          </div>
        </div>
      </template>
      
      <el-table :data="filteredCredits" stripe>
        <el-table-column prop="orderNo" label="订单号" width="150" />
        <el-table-column prop="member.name" label="会员" />
        <el-table-column prop="member.phone" label="手机号" />
        <el-table-column prop="totalAmount" label="挂账金额">
          <template #default="{ row }">¥{{ row.totalAmount }}</template>
        </el-table-column>
        <el-table-column prop="paidAmount" label="已还金额">
          <template #default="{ row }">¥{{ row.paidAmount }}</template>
        </el-table-column>
        <el-table-column prop="remainingAmount" label="剩余金额">
          <template #default="{ row }">
            <span :class="{ 'overdue': row.status === 'overdue' }">¥{{ row.remainingAmount }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="creditTime" label="挂账时间">
          <template #default="{ row }">{{ formatDate(row.creditTime) }}</template>
        </el-table-column>
        <el-table-column prop="dueTime" label="应还时间">
          <template #default="{ row }">{{ row.dueTime ? formatDate(row.dueTime) : '-' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button 
              v-if="row.status !== 'settled'" 
              link 
              type="primary" 
              @click="showPaymentDialog(row)"
            >还款</el-button>
            <el-button link @click="showPaymentHistory(row)">还款记录</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 还款对话框 -->
    <el-dialog v-model="paymentDialogVisible" title="还款" width="400px">
      <el-form :model="paymentForm" label-width="100px">
        <el-form-item label="会员">
          <el-input :value="paymentForm.memberName" disabled />
        </el-form-item>
        <el-form-item label="挂账金额">
          <el-input :value="'¥' + paymentForm.totalAmount" disabled />
        </el-form-item>
        <el-form-item label="剩余金额">
          <el-input :value="'¥' + paymentForm.remainingAmount" disabled />
        </el-form-item>
        <el-form-item label="还款金额">
          <el-input-number v-model="paymentForm.amount" :min="0.01" :max="paymentForm.remainingAmount" :precision="2" />
        </el-form-item>
        <el-form-item label="支付方式">
          <el-select v-model="paymentForm.paymentMethod">
            <el-option label="现金" value="cash" />
            <el-option label="微信" value="wechat" />
            <el-option label="支付宝" value="alipay" />
            <el-option label="会员卡" value="card" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="paymentForm.remark" type="textarea" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="paymentDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitPayment">确认还款</el-button>
      </template>
    </el-dialog>

    <!-- 还款记录对话框 -->
    <el-dialog v-model="historyDialogVisible" title="还款记录" width="600px">
      <el-table :data="paymentHistory" stripe>
        <el-table-column prop="amount" label="还款金额">
          <template #default="{ row }">¥{{ row.amount }}</template>
        </el-table-column>
        <el-table-column prop="paymentMethod" label="支付方式" />
        <el-table-column prop="paymentTime" label="还款时间">
          <template #default="{ row }">{{ formatDate(row.paymentTime) }}</template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" />
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'

const credits = ref<any[]>([])
const filterStatus = ref('')
const searchPhone = ref('')

const paymentDialogVisible = ref(false)
const historyDialogVisible = ref(false)
const paymentForm = ref<any>({ amount: 0, paymentMethod: 'cash' })
const paymentHistory = ref<any[]>([])

const filteredCredits = computed(() => {
  let result = credits.value
  if (filterStatus.value) {
    result = result.filter(c => c.status === filterStatus.value)
  }
  if (searchPhone.value) {
    result = result.filter(c => c.member?.phone?.includes(searchPhone.value))
  }
  return result
})

const getStatusType = (status: string) => {
  const map: Record<string, string> = {
    pending: 'warning',
    partial: 'info',
    settled: 'success',
    overdue: 'danger',
  }
  return map[status] || 'info'
}

const getStatusText = (status: string) => {
  const map: Record<string, string> = {
    pending: '待还款',
    partial: '部分还款',
    settled: '已结清',
    overdue: '已逾期',
  }
  return map[status] || status
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleString()
}

const loadCredits = async () => {
  try {
    const res = await axios.get('/api/credits')
    credits.value = res.data
  } catch (e) {
    ElMessage.error('加载数据失败')
  }
}

const showPaymentDialog = (row: any) => {
  paymentForm.value = {
    creditId: row.id,
    memberName: row.member?.name,
    totalAmount: row.totalAmount,
    remainingAmount: row.remainingAmount,
    amount: row.remainingAmount,
    paymentMethod: 'cash',
    remark: '',
  }
  paymentDialogVisible.value = true
}

const submitPayment = async () => {
  try {
    await axios.post('/api/credits/payments', paymentForm.value)
    paymentDialogVisible.value = false
    loadCredits()
    ElMessage.success('还款成功')
  } catch (e) {
    ElMessage.error('还款失败')
  }
}

const showPaymentHistory = async (row: any) => {
  try {
    const res = await axios.get(`/api/credits/${row.id}/payments`)
    paymentHistory.value = res.data
    historyDialogVisible.value = true
  } catch (e) {
    ElMessage.error('加载记录失败')
  }
}

onMounted(loadCredits)
</script>

<style scoped>
.credit-page {
  padding: 20px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.overdue {
  color: #f56c6c;
  font-weight: bold;
}
</style>
