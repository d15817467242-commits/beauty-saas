<template>
  <div class="stock-report-page">
    <el-tabs v-model="activeTab" type="border-card">
      <!-- 库存剩余统计 -->
      <el-tab-pane label="库存剩余" name="remaining">
        <div class="toolbar">
          <el-select v-model="remainingFilter.warehouseId" placeholder="仓库筛选" clearable style="width: 200px;">
            <el-option v-for="w in warehouses" :key="w.id" :label="w.name" :value="w.id" />
          </el-select>
          <el-button type="primary" style="margin-left: 16px;" @click="loadRemainingReport">查询</el-button>
          <el-button style="margin-left: 16px;" @click="exportRemaining">导出</el-button>
        </div>
        <el-table :data="remainingData" stripe>
          <el-table-column prop="productId" label="产品ID" />
          <el-table-column prop="productName" label="产品名称" />
          <el-table-column prop="totalQuantity" label="库存数量" width="120">
            <template #default="{ row }">
              <span :class="{ 'low-stock': row.totalQuantity <= 10 }">{{ row.totalQuantity }}</span>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- 入库统计 -->
      <el-tab-pane label="入库统计" name="in">
        <div class="toolbar">
          <el-date-picker
            v-model="inFilter.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
          />
          <el-select v-model="inFilter.supplierId" placeholder="供应商" clearable style="width: 200px; margin-left: 16px;">
            <el-option v-for="s in suppliers" :key="s.id" :label="s.name" :value="s.id" />
          </el-select>
          <el-button type="primary" style="margin-left: 16px;" @click="loadInReport">查询</el-button>
        </div>
        <el-row :gutter="20" style="margin-bottom: 20px;">
          <el-col :span="6">
            <el-card shadow="hover">
              <el-statistic title="入库单数" :value="inReport.count" />
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover">
              <el-statistic title="入库数量" :value="inReport.totalQuantity" />
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover">
              <el-statistic title="入库金额" :value="inReport.totalAmount" :precision="2" prefix="¥" />
            </el-card>
          </el-col>
        </el-row>
        <el-divider>按产品统计</el-divider>
        <el-table :data="inReport.byProduct" stripe>
          <el-table-column prop="productId" label="产品ID" />
          <el-table-column prop="quantity" label="入库数量" width="120" />
          <el-table-column prop="amount" label="入库金额" width="150">
            <template #default="{ row }">¥{{ row.amount?.toFixed(2) }}</template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- 出库统计 -->
      <el-tab-pane label="出库统计" name="out">
        <div class="toolbar">
          <el-date-picker
            v-model="outFilter.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
          />
          <el-select v-model="outFilter.type" placeholder="类型" clearable style="width: 120px; margin-left: 16px;">
            <el-option label="销售" value="sale" />
            <el-option label="报损" value="loss" />
            <el-option label="退货" value="return" />
            <el-option label="其他" value="other" />
          </el-select>
          <el-button type="primary" style="margin-left: 16px;" @click="loadOutReport">查询</el-button>
        </div>
        <el-row :gutter="20" style="margin-bottom: 20px;">
          <el-col :span="4">
            <el-card shadow="hover">
              <el-statistic title="出库单数" :value="outReport.count" />
            </el-card>
          </el-col>
          <el-col :span="4">
            <el-card shadow="hover">
              <el-statistic title="出库数量" :value="outReport.totalQuantity" />
            </el-card>
          </el-col>
          <el-col :span="4">
            <el-card shadow="hover">
              <el-statistic title="销售金额" :value="outReport.totalAmount" :precision="2" prefix="¥" />
            </el-card>
          </el-col>
          <el-col :span="4">
            <el-card shadow="hover">
              <el-statistic title="成本金额" :value="outReport.costAmount" :precision="2" prefix="¥" />
            </el-card>
          </el-col>
          <el-col :span="4">
            <el-card shadow="hover">
              <el-statistic title="毛利" :value="outReport.profit" :precision="2" prefix="¥" />
            </el-card>
          </el-col>
        </el-row>
        <el-divider>按产品统计</el-divider>
        <el-table :data="outReport.byProduct" stripe>
          <el-table-column prop="productId" label="产品ID" />
          <el-table-column prop="quantity" label="出库数量" width="120" />
          <el-table-column prop="amount" label="销售金额" width="150">
            <template #default="{ row }">¥{{ row.amount?.toFixed(2) }}</template>
          </el-table-column>
          <el-table-column prop="cost" label="成本金额" width="150">
            <template #default="{ row }">¥{{ row.cost?.toFixed(2) }}</template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- 出库毛利 -->
      <el-tab-pane label="出库毛利" name="profit">
        <div class="toolbar">
          <el-date-picker
            v-model="profitFilter.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
          />
          <el-button type="primary" style="margin-left: 16px;" @click="loadProfitReport">查询</el-button>
        </div>
        <el-row :gutter="20" style="margin-bottom: 20px;">
          <el-col :span="6">
            <el-card shadow="hover">
              <el-statistic title="总销售额" :value="profitReport.totalRevenue" :precision="2" prefix="¥" />
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover">
              <el-statistic title="总成本" :value="profitReport.totalCost" :precision="2" prefix="¥" />
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover">
              <el-statistic title="毛利润" :value="profitReport.grossProfit" :precision="2" prefix="¥" />
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover">
              <el-statistic title="毛利率" :value="profitReport.profitMargin" suffix="%" />
            </el-card>
          </el-col>
        </el-row>
        <el-divider>按产品毛利</el-divider>
        <el-table :data="profitReport.byProduct" stripe>
          <el-table-column prop="productId" label="产品ID" />
          <el-table-column prop="quantity" label="销售数量" width="120" />
          <el-table-column prop="amount" label="销售额" width="150">
            <template #default="{ row }">¥{{ row.amount?.toFixed(2) }}</template>
          </el-table-column>
          <el-table-column prop="cost" label="成本" width="150">
            <template #default="{ row }">¥{{ row.cost?.toFixed(2) }}</template>
          </el-table-column>
          <el-table-column prop="profit" label="毛利" width="150">
            <template #default="{ row }">
              <span :class="row.profit >= 0 ? 'profit-positive' : 'profit-negative'">¥{{ row.profit?.toFixed(2) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="profitMargin" label="毛利率" width="120" />
        </el-table>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

const API_BASE = 'http://localhost:3000/api'
const token = localStorage.getItem('token') || ''

const activeTab = ref('remaining')
const warehouses = ref<any[]>([])
const suppliers = ref<any[]>([])

const remainingFilter = ref({ warehouseId: '' })
const remainingData = ref<any[]>([])

const inFilter = ref({ dateRange: null as [Date, Date] | null, supplierId: '' })
const inReport = ref<any>({ count: 0, totalQuantity: 0, totalAmount: 0, byProduct: [] })

const outFilter = ref({ dateRange: null as [Date, Date] | null, type: '' })
const outReport = ref<any>({ count: 0, totalQuantity: 0, totalAmount: 0, costAmount: 0, profit: 0, byProduct: [] })

const profitFilter = ref({ dateRange: null as [Date, Date] | null })
const profitReport = ref<any>({ totalRevenue: 0, totalCost: 0, grossProfit: 0, profitMargin: '0%', byProduct: [] })

const loadData = async () => {
  try {
    const [warehousesRes, suppliersRes] = await Promise.all([
      fetch(`${API_BASE}/warehouses`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${API_BASE}/suppliers`, { headers: { Authorization: `Bearer ${token}` } })
    ])
    const warehousesData = await warehousesRes.json()
    const suppliersData = await suppliersRes.json()
    warehouses.value = warehousesData.data || warehousesData
    suppliers.value = suppliersData.data || suppliersData
  } catch (e) {
    ElMessage.error('加载数据失败')
  }
}

const loadRemainingReport = async () => {
  try {
    const params = new URLSearchParams()
    if (remainingFilter.value.warehouseId) params.append('warehouseId', remainingFilter.value.warehouseId)
    const res = await fetch(`${API_BASE}/stock/report/remaining?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    remainingData.value = await res.json()
  } catch (e) {
    ElMessage.error('加载库存剩余统计失败')
  }
}

const exportRemaining = () => {
  ElMessage.info('导出功能开发中')
}

const loadInReport = async () => {
  try {
    const params = new URLSearchParams()
    if (inFilter.value.dateRange) {
      params.append('startDate', inFilter.value.dateRange[0].toISOString())
      params.append('endDate', inFilter.value.dateRange[1].toISOString())
    }
    if (inFilter.value.supplierId) params.append('supplierId', inFilter.value.supplierId)
    const res = await fetch(`${API_BASE}/stock/report/in?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    inReport.value = await res.json()
  } catch (e) {
    ElMessage.error('加载入库统计失败')
  }
}

const loadOutReport = async () => {
  try {
    const params = new URLSearchParams()
    if (outFilter.value.dateRange) {
      params.append('startDate', outFilter.value.dateRange[0].toISOString())
      params.append('endDate', outFilter.value.dateRange[1].toISOString())
    }
    if (outFilter.value.type) params.append('type', outFilter.value.type)
    const res = await fetch(`${API_BASE}/stock/report/out?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    outReport.value = await res.json()
  } catch (e) {
    ElMessage.error('加载出库统计失败')
  }
}

const loadProfitReport = async () => {
  try {
    const params = new URLSearchParams()
    if (profitFilter.value.dateRange) {
      params.append('startDate', profitFilter.value.dateRange[0].toISOString())
      params.append('endDate', profitFilter.value.dateRange[1].toISOString())
    }
    const res = await fetch(`${API_BASE}/stock/report/profit?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    profitReport.value = await res.json()
  } catch (e) {
    ElMessage.error('加载毛利统计失败')
  }
}

onMounted(() => {
  loadData()
  loadRemainingReport()
  loadInReport()
  loadOutReport()
  loadProfitReport()
})
</script>

<style scoped>
.stock-report-page { padding: 20px; }
.toolbar { margin-bottom: 16px; display: flex; align-items: center; }
.low-stock { color: #f56c6c; font-weight: bold; }
.profit-positive { color: #67c23a; }
.profit-negative { color: #f56c6c; }
</style>
