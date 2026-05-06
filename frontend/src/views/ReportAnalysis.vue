<template>
  <div class="report-analysis-page">
    <!-- 顶部筛选栏 -->
    <el-card shadow="never" class="filter-card">
      <el-row :gutter="20" align="middle">
        <el-col :span="6">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            :shortcuts="dateShortcuts"
            style="width: 100%"
            @change="handleDateChange"
          />
        </el-col>
        <el-col :span="4">
          <el-select v-model="selectedStore" placeholder="选择门店" clearable style="width: 100%" @change="handleStoreChange">
            <el-option v-for="store in storeList" :key="store.id" :label="store.name" :value="store.id" />
          </el-select>
        </el-col>
        <el-col :span="4">
          <el-button type="primary" @click="refreshAllData">
            <el-icon><Refresh /></el-icon>
            刷新数据
          </el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- 多标签页报表 -->
    <el-card shadow="never" class="report-card">
      <el-tabs v-model="activeTab" type="border-card" @tab-change="handleTabChange">
        <!-- 经营概览 -->
        <el-tab-pane label="经营概览" name="overview">
          <div class="tab-content">
            <OverviewTab ref="overviewRef" :date-range="dateRange" :store-id="selectedStore" />
          </div>
        </el-tab-pane>

        <!-- 营收分析 -->
        <el-tab-pane label="营收分析" name="revenue">
          <div class="tab-content">
            <RevenueTab ref="revenueRef" :date-range="dateRange" :store-id="selectedStore" />
          </div>
        </el-tab-pane>

        <!-- 员工业绩 -->
        <el-tab-pane label="员工业绩" name="employee">
          <div class="tab-content">
            <EmployeeTab ref="employeeRef" :date-range="dateRange" :store-id="selectedStore" />
          </div>
        </el-tab-pane>

        <!-- 会员分析 -->
        <el-tab-pane label="会员分析" name="member">
          <div class="tab-content">
            <MemberTab ref="memberRef" :date-range="dateRange" :store-id="selectedStore" />
          </div>
        </el-tab-pane>

        <!-- 消费明细 -->
        <el-tab-pane label="消费明细" name="consumption">
          <div class="tab-content">
            <ConsumptionTab ref="consumptionRef" :date-range="dateRange" :store-id="selectedStore" />
          </div>
        </el-tab-pane>

        <!-- 提成工资 -->
        <el-tab-pane label="提成工资" name="commission">
          <div class="tab-content">
            <CommissionTab ref="commissionRef" :date-range="dateRange" :store-id="selectedStore" />
          </div>
        </el-tab-pane>

        <!-- 资产报表 -->
        <el-tab-pane label="资产报表" name="asset">
          <div class="tab-content">
            <AssetTab ref="assetRef" :date-range="dateRange" :store-id="selectedStore" />
          </div>
        </el-tab-pane>

        <!-- 其他报表 -->
        <el-tab-pane label="其他报表" name="other">
          <div class="tab-content">
            <OtherTab ref="otherRef" :date-range="dateRange" :store-id="selectedStore" />
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, provide } from 'vue'
import { Refresh } from '@element-plus/icons-vue'
import OverviewTab from '@/components/report/OverviewTab.vue'
import RevenueTab from '@/components/report/RevenueTab.vue'
import EmployeeTab from '@/components/report/EmployeeTab.vue'
import MemberTab from '@/components/report/MemberTab.vue'
import ConsumptionTab from '@/components/report/ConsumptionTab.vue'
import CommissionTab from '@/components/report/CommissionTab.vue'
import AssetTab from '@/components/report/AssetTab.vue'
import OtherTab from '@/components/report/OtherTab.vue'

// API基础地址
const API_BASE = 'http://localhost:3000/api'
provide('API_BASE', API_BASE)

// 日期范围
const dateRange = ref<[Date, Date] | null>(null)
const selectedStore = ref<string | number>('')
const storeList = ref<{ id: string | number; name: string }[]>([
  { id: '', name: '全部门店' },
  { id: '1', name: '总店' },
  { id: '2', name: '分店1' }
])

const activeTab = ref('overview')

// 组件引用
const overviewRef = ref()
const revenueRef = ref()
const employeeRef = ref()
const memberRef = ref()
const consumptionRef = ref()
const commissionRef = ref()
const assetRef = ref()
const otherRef = ref()

// 日期快捷选项
const dateShortcuts = [
  {
    text: '今天',
    value: () => {
      const today = new Date()
      return [today, today]
    }
  },
  {
    text: '昨天',
    value: () => {
      const yesterday = new Date()
      yesterday.setTime(yesterday.getTime() - 3600 * 1000 * 24)
      return [yesterday, yesterday]
    }
  },
  {
    text: '本周',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - start.getDay() * 24 * 3600 * 1000)
      return [start, end]
    }
  },
  {
    text: '本月',
    value: () => {
      const end = new Date()
      const start = new Date(end.getFullYear(), end.getMonth(), 1)
      return [start, end]
    }
  },
  {
    text: '上月',
    value: () => {
      const end = new Date()
      const start = new Date(end.getFullYear(), end.getMonth() - 1, 1)
      end.setDate(0)
      return [start, end]
    }
  }
]

const handleDateChange = () => {
  refreshAllData()
}

const handleStoreChange = () => {
  refreshAllData()
}

const handleTabChange = (tab: string) => {
  // 切换标签时刷新对应数据
  refreshTab(tab)
}

const refreshTab = (tab: string) => {
  const refs: Record<string, any> = {
    overview: overviewRef,
    revenue: revenueRef,
    employee: employeeRef,
    member: memberRef,
    consumption: consumptionRef,
    commission: commissionRef,
    asset: assetRef,
    other: otherRef
  }
  refs[tab]?.value?.refresh?.()
}

const refreshAllData = () => {
  overviewRef.value?.refresh?.()
  revenueRef.value?.refresh?.()
  employeeRef.value?.refresh?.()
  memberRef.value?.refresh?.()
  consumptionRef.value?.refresh?.()
  commissionRef.value?.refresh?.()
  assetRef.value?.refresh?.()
  otherRef.value?.refresh?.()
}

onMounted(() => {
  // 默认选择本月
  const end = new Date()
  const start = new Date(end.getFullYear(), end.getMonth(), 1)
  dateRange.value = [start, end]
})
</script>

<style scoped>
.report-analysis-page {
  padding: 20px;
}

.filter-card {
  margin-bottom: 20px;
}

.report-card {
  min-height: calc(100vh - 200px);
}

.tab-content {
  padding: 20px;
  min-height: 500px;
}
</style>
