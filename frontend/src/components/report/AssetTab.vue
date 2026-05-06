<template>
  <div class="asset-tab" v-loading="loading">
    <!-- 资产概览 -->
    <el-row :gutter="20" style="margin-bottom: 20px">
      <el-col :span="6">
        <el-card shadow="hover" class="asset-card">
          <div class="asset-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)">
            <el-icon size="32"><Wallet /></el-icon>
          </div>
          <div class="asset-info">
            <div class="asset-label">会员余额</div>
            <div class="asset-value">¥{{ formatMoney(assetData.balance?.total || 0) }}</div>
            <div class="asset-extra">{{ assetData.balance?.memberCount || 0 }} 人</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="asset-card">
          <div class="asset-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%)">
            <el-icon size="32"><Coin /></el-icon>
          </div>
          <div class="asset-info">
            <div class="asset-label">会员积分</div>
            <div class="asset-value">{{ formatNumber(assetData.points?.total || 0) }}</div>
            <div class="asset-extra">人均 {{ formatNumber(assetData.points?.avgPoints || 0) }}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="asset-card">
          <div class="asset-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)">
            <el-icon size="32"><CreditCard /></el-icon>
          </div>
          <div class="asset-info">
            <div class="asset-label">本期充值</div>
            <div class="asset-value">¥{{ formatMoney(assetData.recharge?.total || 0) }}</div>
            <div class="asset-extra">{{ assetData.recharge?.count || 0 }} 笔</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="asset-card">
          <div class="asset-icon" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)">
            <el-icon size="32"><ShoppingCart /></el-icon>
          </div>
          <div class="asset-info">
            <div class="asset-label">本期消费</div>
            <div class="asset-value">¥{{ formatMoney(assetData.consumption?.total || 0) }}</div>
            <div class="asset-extra">{{ assetData.consumption?.count || 0 }} 笔</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 银行对账单 -->
    <el-card shadow="never" style="margin-bottom: 20px">
      <template #header>
        <span>银行对账单</span>
      </template>
      <el-row :gutter="20" style="margin-bottom: 20px">
        <el-col :span="8">
          <el-statistic title="总金额" :value="bankData.summary?.totalAmount || 0" :precision="2" prefix="¥" />
        </el-col>
        <el-col :span="8">
          <el-statistic title="总笔数" :value="bankData.summary?.totalCount || 0" />
        </el-col>
        <el-col :span="8">
          <el-statistic title="银行账户金额" :value="bankData.summary?.bankAmount || 0" :precision="2" prefix="¥" />
        </el-col>
      </el-row>

      <el-table :data="bankData.records || []" stripe max-height="300">
        <el-table-column prop="date" label="日期" width="120" />
        <el-table-column prop="orderNo" label="单号" width="180" />
        <el-table-column prop="memberName" label="会员" width="100" />
        <el-table-column prop="amount" label="金额">
          <template #default="{ row }">
            ¥{{ row.amount?.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="paymentMethod" label="支付方式" width="100">
          <template #default="{ row }">
            {{ getPaymentMethodName(row.paymentMethod) }}
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 现金对账 -->
    <el-card shadow="never">
      <template #header>
        <span>现金对账</span>
      </template>
      <el-row :gutter="20" style="margin-bottom: 20px">
        <el-col :span="8">
          <el-statistic title="应收金额" :value="cashData.summary?.totalExpected || 0" :precision="2" prefix="¥" />
        </el-col>
        <el-col :span="8">
          <el-statistic title="实收金额" :value="cashData.summary?.totalActual || 0" :precision="2" prefix="¥" />
        </el-col>
        <el-col :span="8">
          <el-statistic title="差异金额" :value="cashData.summary?.totalDifference || 0" :precision="2" prefix="¥" />
        </el-col>
      </el-row>

      <el-table :data="cashData.byDate || []" stripe max-height="300">
        <el-table-column prop="date" label="日期" width="150" />
        <el-table-column prop="expected" label="应收金额">
          <template #default="{ row }">
            ¥{{ row.expected?.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="actual" label="实收金额">
          <template #default="{ row }">
            ¥{{ row.actual?.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="difference" label="差异">
          <template #default="{ row }">
            <span :style="{ color: row.difference >= 0 ? '#67c23a' : '#f56c6c' }">
              {{ row.difference >= 0 ? '+' : '' }}¥{{ row.difference?.toFixed(2) }}
            </span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, inject } from 'vue'
import { Wallet, Coin, CreditCard, ShoppingCart } from '@element-plus/icons-vue'

const API_BASE = inject('API_BASE') as string
const token = localStorage.getItem('token') || ''

const props = defineProps<{
  dateRange: [Date, Date] | null
  storeId: string | number
}>()

const loading = ref(false)
const assetData = ref<any>({})
const bankData = ref<any>({})
const cashData = ref<any>({})

const formatMoney = (value: number) => {
  return value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const formatNumber = (value: number) => {
  return value.toLocaleString('zh-CN')
}

const getPaymentMethodName = (method: string) => {
  const names: Record<string, string> = {
    cash: '现金',
    wechat: '微信',
    alipay: '支付宝',
    card: '会员卡',
    bank: '银行卡'
  }
  return names[method] || method
}

const loadData = async () => {
  loading.value = true
  try {
    const params = new URLSearchParams()
    if (props.dateRange) {
      params.append('startDate', props.dateRange[0].toISOString().split('T')[0])
      params.append('endDate', props.dateRange[1].toISOString().split('T')[0])
    }

    // 资产报表
    const assetRes = await fetch(`${API_BASE}/report/asset?${params}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    assetData.value = await assetRes.json()

    // 银行对账单
    const bankRes = await fetch(`${API_BASE}/report/bank?${params}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    bankData.value = await bankRes.json()

    // 现金对账
    const cashRes = await fetch(`${API_BASE}/report/cash-reconciliation?${params}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    cashData.value = await cashRes.json()
  } catch (e) {
    console.error('加载资产数据失败', e)
  } finally {
    loading.value = false
  }
}

const refresh = () => {
  loadData()
}

watch(() => [props.dateRange, props.storeId], () => {
  loadData()
})

onMounted(() => {
  loadData()
})

defineExpose({ refresh })
</script>

<style scoped>
.asset-card {
  display: flex;
  align-items: center;
  padding: 20px;
}

.asset-card :deep(.el-card__body) {
  display: flex;
  align-items: center;
  width: 100%;
}

.asset-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  margin-right: 15px;
}

.asset-info {
  flex: 1;
}

.asset-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.asset-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}

.asset-extra {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}
</style>
