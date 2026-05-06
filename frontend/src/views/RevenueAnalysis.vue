<template>
  <div class="revenue-analysis-page">
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

    <!-- 目标概览 -->
    <TargetOverview ref="targetOverviewRef" :date-range="dateRange" :store-id="selectedStore" />

    <!-- 经营总览 -->
    <BusinessOverview ref="businessOverviewRef" :date-range="dateRange" :store-id="selectedStore" />

    <!-- 营收汇总 -->
    <RevenueSummary ref="revenueSummaryRef" :date-range="dateRange" :store-id="selectedStore" />

    <el-row :gutter="20">
      <!-- 员工业绩 -->
      <el-col :span="12">
        <EmployeePerformance ref="employeePerformanceRef" :date-range="dateRange" :store-id="selectedStore" />
      </el-col>
      <!-- 服务项目分析 -->
      <el-col :span="12">
        <ServiceAnalysis ref="serviceAnalysisRef" :date-range="dateRange" :store-id="selectedStore" />
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <!-- 会员分析 -->
      <el-col :span="12">
        <MemberAnalysis ref="memberAnalysisRef" :date-range="dateRange" :store-id="selectedStore" />
      </el-col>
      <!-- 时段分析 -->
      <el-col :span="12">
        <TimeSlotAnalysis ref="timeSlotAnalysisRef" :date-range="dateRange" :store-id="selectedStore" />
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Refresh } from '@element-plus/icons-vue'
import TargetOverview from '@/components/revenue/TargetOverview.vue'
import BusinessOverview from '@/components/revenue/BusinessOverview.vue'
import RevenueSummary from '@/components/revenue/RevenueSummary.vue'
import EmployeePerformance from '@/components/revenue/EmployeePerformance.vue'
import ServiceAnalysis from '@/components/revenue/ServiceAnalysis.vue'
import MemberAnalysis from '@/components/revenue/MemberAnalysis.vue'
import TimeSlotAnalysis from '@/components/revenue/TimeSlotAnalysis.vue'

// 日期范围
const dateRange = ref<[Date, Date] | null>(null)
const selectedStore = ref<string | number>('')
const storeList = ref<{ id: string | number; name: string }[]>([
  { id: '', name: '全部门店' },
  { id: '1', name: '总店' },
  { id: '2', name: '分店1' },
  { id: '3', name: '分店2' }
])

// 组件引用
const targetOverviewRef = ref()
const businessOverviewRef = ref()
const revenueSummaryRef = ref()
const employeePerformanceRef = ref()
const serviceAnalysisRef = ref()
const memberAnalysisRef = ref()
const timeSlotAnalysisRef = ref()

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
      end.setDate(0) // 上月最后一天
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

const refreshAllData = () => {
  targetOverviewRef.value?.refresh()
  businessOverviewRef.value?.refresh()
  revenueSummaryRef.value?.refresh()
  employeePerformanceRef.value?.refresh()
  serviceAnalysisRef.value?.refresh()
  memberAnalysisRef.value?.refresh()
  timeSlotAnalysisRef.value?.refresh()
}

onMounted(() => {
  // 默认选择本月
  const end = new Date()
  const start = new Date(end.getFullYear(), end.getMonth(), 1)
  dateRange.value = [start, end]
})
</script>

<style scoped>
.revenue-analysis-page {
  padding: 20px;
}

.filter-card {
  margin-bottom: 20px;
}
</style>
