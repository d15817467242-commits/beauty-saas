<template>
  <div class="other-tab" v-loading="loading">
    <!-- 子标签页 -->
    <el-tabs v-model="activeSubTab" type="card">
      <!-- 品项分析 -->
      <el-tab-pane label="品项分析" name="item">
        <div class="sub-content">
          <el-row :gutter="20" style="margin-bottom: 20px">
            <el-col :span="6">
              <el-statistic title="品项总数" :value="itemData.summary?.totalItems || 0" />
            </el-col>
            <el-col :span="6">
              <el-statistic title="销售次数" :value="itemData.summary?.totalCount || 0" />
            </el-col>
            <el-col :span="6">
              <el-statistic title="销售金额" :value="itemData.summary?.totalRevenue || 0" :precision="2" prefix="¥" />
            </el-col>
            <el-col :span="6">
              <el-statistic title="平均金额" :value="itemData.summary?.avgRevenuePerService || 0" :precision="2" prefix="¥" />
            </el-col>
          </el-row>

          <el-table :data="itemData.items || []" stripe>
            <el-table-column prop="itemName" label="品项名称" />
            <el-table-column prop="category" label="分类" width="100" />
            <el-table-column prop="count" label="销售次数" width="100" />
            <el-table-column prop="revenue" label="销售金额">
              <template #default="{ row }">
                ¥{{ row.revenue?.toFixed(2) }}
              </template>
            </el-table-column>
            <el-table-column prop="avgPrice" label="平均单价">
              <template #default="{ row }">
                ¥{{ row.avgPrice?.toFixed(2) }}
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>

      <!-- 客流统计 -->
      <el-tab-pane label="客流统计" name="traffic">
        <div class="sub-content">
          <el-row :gutter="20" style="margin-bottom: 20px">
            <el-col :span="6">
              <el-statistic title="总客流" :value="trafficData.summary?.totalCount || 0" />
            </el-col>
            <el-col :span="6">
              <el-statistic title="总金额" :value="trafficData.summary?.totalAmount || 0" :precision="2" prefix="¥" />
            </el-col>
            <el-col :span="6">
              <el-statistic title="平均客流" :value="trafficData.summary?.avgCount || 0" :precision="1" />
            </el-col>
          </el-row>

          <el-radio-group v-model="trafficGroupBy" @change="loadTrafficData" style="margin-bottom: 20px">
            <el-radio-button label="hour">按时段</el-radio-button>
            <el-radio-button label="day">按天</el-radio-button>
            <el-radio-button label="week">按周</el-radio-button>
          </el-radio-group>

          <el-table :data="trafficData.timeSlots || []" stripe>
            <el-table-column prop="timeSlot" label="时段" width="100" />
            <el-table-column prop="count" label="客流" width="100" />
            <el-table-column prop="amount" label="金额">
              <template #default="{ row }">
                ¥{{ row.amount?.toFixed(2) }}
              </template>
            </el-table-column>
            <el-table-column prop="avgTicket" label="客单价">
              <template #default="{ row }">
                ¥{{ row.avgTicket?.toFixed(2) }}
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>

      <!-- 优惠统计 -->
      <el-tab-pane label="优惠统计" name="discount">
        <div class="sub-content">
          <el-row :gutter="20" style="margin-bottom: 20px">
            <el-col :span="6">
              <el-statistic title="原价总额" :value="discountData.summary?.totalOriginal || 0" :precision="2" prefix="¥" />
            </el-col>
            <el-col :span="6">
              <el-statistic title="实收总额" :value="discountData.summary?.totalActual || 0" :precision="2" prefix="¥" />
            </el-col>
            <el-col :span="6">
              <el-statistic title="优惠金额" :value="discountData.summary?.totalDiscount || 0" :precision="2" prefix="¥" />
            </el-col>
            <el-col :span="6">
              <el-statistic title="优惠率" :value="discountData.summary?.discountRate || 0" :precision="2" suffix="%" />
            </el-col>
          </el-row>

          <el-table :data="discountByType" stripe>
            <el-table-column prop="type" label="优惠类型" />
            <el-table-column prop="count" label="使用次数" width="120" />
            <el-table-column prop="amount" label="优惠金额">
              <template #default="{ row }">
                ¥{{ row.amount?.toFixed(2) }}
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>

      <!-- 积分变更 -->
      <el-tab-pane label="积分变更" name="points">
        <div class="sub-content">
          <el-row :gutter="20" style="margin-bottom: 20px">
            <el-col :span="12">
              <el-statistic title="总获得积分" :value="pointData.summary?.totalEarn || 0" />
            </el-col>
            <el-col :span="12">
              <el-statistic title="总使用积分" :value="pointData.summary?.totalUse || 0" />
            </el-col>
          </el-row>

          <el-table :data="pointData.data || []" stripe>
            <el-table-column prop="date" label="日期" width="120" />
            <el-table-column prop="memberName" label="会员" width="120" />
            <el-table-column prop="changeType" label="类型" width="80">
              <template #default="{ row }">
                <el-tag :type="row.changeType === 'earn' ? 'success' : 'warning'">
                  {{ row.changeType === 'earn' ? '获得' : '使用' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="points" label="积分" width="100" />
            <el-table-column prop="balance" label="余额" width="100" />
            <el-table-column prop="remark" label="备注" />
          </el-table>
        </div>
      </el-tab-pane>

      <!-- 短信费 -->
      <el-tab-pane label="短信费" name="sms">
        <div class="sub-content">
          <el-row :gutter="20" style="margin-bottom: 20px">
            <el-col :span="12">
              <el-statistic title="短信费用" :value="smsFeeData.summary?.totalFee || 0" :precision="2" prefix="¥" />
            </el-col>
            <el-col :span="12">
              <el-statistic title="发送条数" :value="smsFeeData.summary?.totalCount || 0" />
            </el-col>
          </el-row>

          <el-empty description="暂无短信费记录" />
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, inject } from 'vue'

const API_BASE = inject('API_BASE') as string
const token = localStorage.getItem('token') || ''

const props = defineProps<{
  dateRange: [Date, Date] | null
  storeId: string | number
}>()

const loading = ref(false)
const activeSubTab = ref('item')

const itemData = ref<any>({})
const trafficData = ref<any>({})
const discountData = ref<any>({})
const pointData = ref<any>({})
const smsFeeData = ref<any>({})

const trafficGroupBy = ref('hour')

const discountByType = computed(() => {
  const byType = discountData.value.byType || {}
  return Object.entries(byType).map(([type, data]: [string, any]) => ({
    type: type === 'none' ? '无优惠' : type,
    count: data.count,
    amount: data.amount
  }))
})

const loadData = async () => {
  loading.value = true
  try {
    const params = new URLSearchParams()
    if (props.dateRange) {
      params.append('startDate', props.dateRange[0].toISOString().split('T')[0])
      params.append('endDate', props.dateRange[1].toISOString().split('T')[0])
    }

    // 品项分析
    const itemRes = await fetch(`${API_BASE}/report/item-analysis?${params}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    itemData.value = await itemRes.json()

    // 客流统计
    await loadTrafficData()

    // 优惠统计
    const discountRes = await fetch(`${API_BASE}/report/discount?${params}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    discountData.value = await discountRes.json()

    // 积分变更
    const pointRes = await fetch(`${API_BASE}/report/point-change?${params}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    pointData.value = await pointRes.json()

    // 短信费
    const smsRes = await fetch(`${API_BASE}/report/sms-fee?${params}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    smsFeeData.value = await smsRes.json()
  } catch (e) {
    console.error('加载其他报表数据失败', e)
  } finally {
    loading.value = false
  }
}

const loadTrafficData = async () => {
  try {
    const params = new URLSearchParams()
    if (props.dateRange) {
      params.append('startDate', props.dateRange[0].toISOString().split('T')[0])
      params.append('endDate', props.dateRange[1].toISOString().split('T')[0])
    }
    params.append('groupBy', trafficGroupBy.value)

    const res = await fetch(`${API_BASE}/report/traffic?${params}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    trafficData.value = await res.json()
  } catch (e) {
    console.error('加载客流数据失败', e)
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
.sub-content {
  padding: 20px;
}
</style>
