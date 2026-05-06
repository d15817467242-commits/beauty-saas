<template>
  <div class="consumption-tab" v-loading="loading">
    <!-- 消费类型选择 -->
    <el-radio-group v-model="consumptionType" @change="loadData" style="margin-bottom: 20px">
      <el-radio-button label="all">全部</el-radio-button>
      <el-radio-button label="recharge">充值明细</el-radio-button>
      <el-radio-button label="card_sales">次卡销售</el-radio-button>
      <el-radio-button label="card_use">次卡消费</el-radio-button>
    </el-radio-group>

    <!-- 汇总卡片 -->
    <el-row :gutter="20" style="margin-bottom: 20px">
      <el-col :span="8">
        <el-card shadow="hover">
          <el-statistic title="总金额" :value="summary.totalAmount || 0" :precision="2" prefix="¥" />
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover">
          <el-statistic title="总笔数" :value="summary.totalCount || 0" />
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover">
          <el-statistic title="平均金额" :value="avgAmount" :precision="2" prefix="¥" />
        </el-card>
      </el-col>
    </el-row>

    <!-- 消费明细表格 -->
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>消费明细</span>
          <el-button type="primary" size="small" @click="exportData">导出</el-button>
        </div>
      </template>
      <el-table :data="tableData" stripe v-loading="tableLoading" @sort-change="handleSortChange">
        <el-table-column prop="date" label="日期" width="120" />
        <el-table-column prop="orderNo" label="单号" width="180" />
        <el-table-column prop="memberName" label="会员" width="100" />
        <el-table-column prop="type" label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getTypeTag(row.type)">{{ getTypeName(row.type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="amount" label="金额" sortable="custom">
          <template #default="{ row }">
            <span style="color: #67c23a; font-weight: bold">¥{{ row.amount?.toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="paymentMethod" label="支付方式" width="100">
          <template #default="{ row }">
            {{ getPaymentMethodName(row.paymentMethod) }}
          </template>
        </el-table-column>
        <el-table-column prop="employeeName" label="员工" width="100" />
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadData"
          @current-change="loadData"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, inject } from 'vue'
import { ElMessage } from 'element-plus'

const API_BASE = inject('API_BASE') as string
const token = localStorage.getItem('token') || ''

const props = defineProps<{
  dateRange: [Date, Date] | null
  storeId: string | number
}>()

const loading = ref(false)
const tableLoading = ref(false)
const consumptionType = ref('all')
const summary = ref<any>({})
const tableData = ref<any[]>([])
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)

const avgAmount = computed(() => {
  const count = summary.value.totalCount || 1
  return (summary.value.totalAmount || 0) / count
})

const getTypeTag = (type: string) => {
  const tags: Record<string, string> = {
    recharge: 'success',
    service: 'primary',
    product: 'warning',
    card_sale: 'danger',
    card_use: 'info'
  }
  return tags[type] || 'info'
}

const getTypeName = (type: string) => {
  const names: Record<string, string> = {
    recharge: '充值',
    service: '服务',
    product: '商品',
    card_sale: '次卡销售',
    card_use: '次卡消费'
  }
  return names[type] || type
}

const getPaymentMethodName = (method: string) => {
  const names: Record<string, string> = {
    cash: '现金',
    wechat: '微信',
    alipay: '支付宝',
    card: '会员卡',
    mixed: '混合'
  }
  return names[method] || method
}

const loadData = async () => {
  tableLoading.value = true
  try {
    const params = new URLSearchParams()
    if (props.dateRange) {
      params.append('startDate', props.dateRange[0].toISOString().split('T')[0])
      params.append('endDate', props.dateRange[1].toISOString().split('T')[0])
    }
    params.append('page', page.value.toString())
    params.append('pageSize', pageSize.value.toString())

    let endpoint = 'customer-detail'
    if (consumptionType.value === 'recharge') {
      endpoint = 'recharge-detail'
    } else if (consumptionType.value === 'card_sales') {
      endpoint = 'card-sales'
    } else if (consumptionType.value === 'card_use') {
      endpoint = 'card-consumption'
    }

    const res = await fetch(`${API_BASE}/report/${endpoint}?${params}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const result = await res.json()
    summary.value = result.summary || {}
    tableData.value = result.data || []
    total.value = result.pagination?.total || 0
  } catch (e) {
    console.error('加载消费明细失败', e)
  } finally {
    tableLoading.value = false
  }
}

const handleSortChange = ({ prop, order }: { prop: string; order: string }) => {
  // TODO: 实现排序
  loadData()
}

const exportData = () => {
  ElMessage.success('导出功能开发中')
}

const refresh = () => {
  page.value = 1
  loadData()
}

watch(() => [props.dateRange, props.storeId], () => {
  refresh()
})

onMounted(() => {
  loadData()
})

defineExpose({ refresh })
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
