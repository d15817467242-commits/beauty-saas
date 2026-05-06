<template>
  <div class="commission-tab" v-loading="loading">
    <!-- 提成汇总 -->
    <el-row :gutter="20" style="margin-bottom: 20px">
      <el-col :span="6">
        <el-card shadow="hover">
          <el-statistic title="总提成" :value="commissionData.summary?.totalCommission || 0" :precision="2" prefix="¥" />
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <el-statistic title="服务提成" :value="commissionData.summary?.serviceCommission || 0" :precision="2" prefix="¥" />
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <el-statistic title="商品提成" :value="commissionData.summary?.productCommission || 0" :precision="2" prefix="¥" />
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <el-statistic title="员工数" :value="commissionData.employees?.length || 0" />
        </el-card>
      </el-col>
    </el-row>

    <!-- 员工提成排行 -->
    <el-card shadow="never" style="margin-bottom: 20px">
      <template #header>
        <span>员工提成排行</span>
      </template>
      <el-table :data="commissionData.employees || []" stripe>
        <el-table-column prop="employeeName" label="员工" width="120" />
        <el-table-column prop="position" label="职位" width="100" />
        <el-table-column prop="serviceCommission" label="服务提成">
          <template #default="{ row }">
            <span style="color: #67c23a">¥{{ row.serviceCommission?.toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="productCommission" label="商品提成">
          <template #default="{ row }">
            <span style="color: #e6a23c">¥{{ row.productCommission?.toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="totalCommission" label="总提成">
          <template #default="{ row }">
            <span style="color: #409eff; font-weight: bold">¥{{ row.totalCommission?.toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="consumptionCount" label="服务笔数" width="100" />
      </el-table>
    </el-card>

    <!-- 工资统计 -->
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>工资统计</span>
          <el-checkbox v-model="includeBonus" @change="loadSalaryData">包含奖金</el-checkbox>
        </div>
      </template>
      <el-row :gutter="20" style="margin-bottom: 20px">
        <el-col :span="6">
          <el-statistic title="基本工资总额" :value="salaryData.summary?.totalBaseSalary || 0" :precision="2" prefix="¥" />
        </el-col>
        <el-col :span="6">
          <el-statistic title="提成总额" :value="salaryData.summary?.totalCommission || 0" :precision="2" prefix="¥" />
        </el-col>
        <el-col :span="6">
          <el-statistic title="奖金总额" :value="salaryData.summary?.totalBonus || 0" :precision="2" prefix="¥" />
        </el-col>
        <el-col :span="6">
          <el-statistic title="应付总额" :value="salaryData.summary?.total || 0" :precision="2" prefix="¥" />
        </el-col>
      </el-row>

      <el-table :data="salaryData.employees || []" stripe>
        <el-table-column prop="employeeName" label="员工" width="120" />
        <el-table-column prop="position" label="职位" width="100" />
        <el-table-column prop="baseSalary" label="基本工资">
          <template #default="{ row }">
            ¥{{ row.baseSalary?.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="commission" label="提成">
          <template #default="{ row }">
            ¥{{ row.commission?.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="bonus" label="奖金">
          <template #default="{ row }">
            ¥{{ row.bonus?.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="total" label="应付工资">
          <template #default="{ row }">
            <span style="color: #67c23a; font-weight: bold">¥{{ row.total?.toFixed(2) }}</span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, inject } from 'vue'

const API_BASE = inject('API_BASE') as string
const token = localStorage.getItem('token') || ''

const props = defineProps<{
  dateRange: [Date, Date] | null
  storeId: string | number
}>()

const loading = ref(false)
const commissionData = ref<any>({})
const salaryData = ref<any>({})
const includeBonus = ref(true)

const loadData = async () => {
  loading.value = true
  try {
    const params = new URLSearchParams()
    if (props.dateRange) {
      params.append('startDate', props.dateRange[0].toISOString().split('T')[0])
      params.append('endDate', props.dateRange[1].toISOString().split('T')[0])
    }

    // 员工提成汇总
    const commissionRes = await fetch(`${API_BASE}/report/employee-commission?${params}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    commissionData.value = await commissionRes.json()

    // 工资统计
    await loadSalaryData()
  } catch (e) {
    console.error('加载提成数据失败', e)
  } finally {
    loading.value = false
  }
}

const loadSalaryData = async () => {
  try {
    const params = new URLSearchParams()
    if (props.dateRange) {
      params.append('startDate', props.dateRange[0].toISOString().split('T')[0])
      params.append('endDate', props.dateRange[1].toISOString().split('T')[0])
    }
    params.append('includeBonus', includeBonus.value.toString())

    const res = await fetch(`${API_BASE}/report/salary?${params}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    salaryData.value = await res.json()
  } catch (e) {
    console.error('加载工资数据失败', e)
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
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
