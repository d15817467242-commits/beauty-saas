<template>
  <div class="dashboard-screen" :class="{ 'fullscreen': isFullscreen }">
    <!-- 顶部标题栏 -->
    <header class="screen-header">
      <div class="header-left">
        <span class="title">美业数据统计大屏</span>
        <span class="subtitle">{{ currentDate }}</span>
      </div>
      <div class="header-center">
        <span class="time">{{ currentTime }}</span>
      </div>
      <div class="header-right">
        <el-button 
          :icon="isFullscreen ? ExitFullScreen : FullScreen" 
          @click="toggleFullscreen"
          circle
          class="fullscreen-btn"
        />
        <el-button 
          :icon="Refresh" 
          @click="refreshData"
          circle
          class="refresh-btn"
        />
      </div>
    </header>

    <!-- 主内容区域 -->
    <main class="screen-main">
      <!-- 左侧区域 -->
      <section class="left-section">
        <!-- 概览数据卡片 -->
        <div class="overview-cards">
          <div class="overview-card">
            <div class="card-icon revenue">
              <el-icon size="32"><Money /></el-icon>
            </div>
            <div class="card-content">
              <div class="card-value">
                <span class="prefix">¥</span>
                <span class="number">{{ formatNumber(overview.todayRevenue) }}</span>
              </div>
              <div class="card-label">今日营业额</div>
              <div class="card-trend" :class="overview.revenueTrend >= 0 ? 'up' : 'down'">
                {{ overview.revenueTrend >= 0 ? '↑' : '↓' }} {{ Math.abs(overview.revenueTrend || 0).toFixed(1) }}%
              </div>
            </div>
          </div>
          
          <div class="overview-card">
            <div class="card-icon customer">
              <el-icon size="32"><User /></el-icon>
            </div>
            <div class="card-content">
              <div class="card-value">
                <span class="number">{{ formatNumber(overview.todayCustomers) }}</span>
                <span class="suffix">人</span>
              </div>
              <div class="card-label">今日客流量</div>
              <div class="card-trend" :class="overview.customerTrend >= 0 ? 'up' : 'down'">
                {{ overview.customerTrend >= 0 ? '↑' : '↓' }} {{ Math.abs(overview.customerTrend || 0).toFixed(1) }}%
              </div>
            </div>
          </div>
          
          <div class="overview-card">
            <div class="card-icon member">
              <el-icon size="32"><Avatar /></el-icon>
            </div>
            <div class="card-content">
              <div class="card-value">
                <span class="number">{{ formatNumber(overview.totalMembers) }}</span>
                <span class="suffix">人</span>
              </div>
              <div class="card-label">会员总数</div>
              <div class="card-trend" :class="overview.memberTrend >= 0 ? 'up' : 'down'">
                今日新增 {{ overview.newMembersToday || 0 }} 人
              </div>
            </div>
          </div>
          
          <div class="overview-card">
            <div class="card-icon price">
              <el-icon size="32"><ShoppingCart /></el-icon>
            </div>
            <div class="card-content">
              <div class="card-value">
                <span class="prefix">¥</span>
                <span class="number">{{ overview.avgPrice?.toFixed(0) || 0 }}</span>
              </div>
              <div class="card-label">客单价</div>
              <div class="card-trend" :class="overview.priceTrend >= 0 ? 'up' : 'down'">
                {{ overview.priceTrend >= 0 ? '↑' : '↓' }} {{ Math.abs(overview.priceTrend || 0).toFixed(1) }}%
              </div>
            </div>
          </div>
        </div>

        <!-- 实时数据展示 -->
        <div class="realtime-panel">
          <div class="panel-header">
            <span class="panel-title">实时数据</span>
            <span class="realtime-badge">
              <span class="pulse"></span>
              实时更新
            </span>
          </div>
          <div class="realtime-content">
            <div class="realtime-item">
              <div class="realtime-icon">
                <el-icon size="24"><Location /></el-icon>
              </div>
              <div class="realtime-info">
                <div class="realtime-value">{{ realtime.inStore }} 人</div>
                <div class="realtime-label">当前在店人数</div>
              </div>
            </div>
            <div class="realtime-item">
              <div class="realtime-icon queue">
                <el-icon size="24"><List /></el-icon>
              </div>
              <div class="realtime-info">
                <div class="realtime-value">{{ realtime.queueCount }} 人</div>
                <div class="realtime-label">排队等候</div>
              </div>
            </div>
            <div class="realtime-item">
              <div class="realtime-icon serving">
                <el-icon size="24"><Service /></el-icon>
              </div>
              <div class="realtime-info">
                <div class="realtime-value">{{ realtime.serving }} 人</div>
                <div class="realtime-label">服务中</div>
              </div>
            </div>
            <div class="realtime-item">
              <div class="realtime-icon appointment">
                <el-icon size="24"><Calendar /></el-icon>
              </div>
              <div class="realtime-info">
                <div class="realtime-value">{{ realtime.todayAppointments }} 单</div>
                <div class="realtime-label">今日预约</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 服务销量排行 -->
        <div class="ranking-panel">
          <div class="panel-header">
            <span class="panel-title">服务销量排行</span>
          </div>
          <div class="ranking-list">
            <div 
              v-for="(item, index) in serviceRanking" 
              :key="item.id"
              class="ranking-item"
            >
              <div class="ranking-index" :class="getRankClass(index)">
                {{ index + 1 }}
              </div>
              <div class="ranking-name">{{ item.name }}</div>
              <div class="ranking-bar">
                <div class="bar-fill" :style="{ width: getBarWidth(item.count, serviceMaxCount) + '%' }"></div>
              </div>
              <div class="ranking-value">{{ item.count }} 次</div>
            </div>
            <el-empty v-if="!serviceRanking.length" description="暂无数据" :image-size="60" />
          </div>
        </div>
      </section>

      <!-- 中间区域 -->
      <section class="center-section">
        <!-- 营业额趋势图 -->
        <div class="chart-panel main-chart">
          <div class="panel-header">
            <span class="panel-title">营业额趋势</span>
            <div class="chart-tabs">
              <span 
                v-for="tab in chartTabs" 
                :key="tab.value"
                :class="['tab-item', { active: revenueChartType === tab.value }]"
                @click="revenueChartType = tab.value"
              >
                {{ tab.label }}
              </span>
            </div>
          </div>
          <div ref="revenueChartRef" class="chart-container"></div>
        </div>

        <!-- 客流趋势图 -->
        <div class="chart-panel main-chart">
          <div class="panel-header">
            <span class="panel-title">客流趋势</span>
            <div class="chart-tabs">
              <span 
                v-for="tab in chartTabs" 
                :key="tab.value"
                :class="['tab-item', { active: customerChartType === tab.value }]"
                @click="customerChartType = tab.value"
              >
                {{ tab.label }}
              </span>
            </div>
          </div>
          <div ref="customerChartRef" class="chart-container"></div>
        </div>
      </section>

      <!-- 右侧区域 -->
      <section class="right-section">
        <!-- 员工业绩排行 -->
        <div class="ranking-panel employee-ranking">
          <div class="panel-header">
            <span class="panel-title">员工业绩排行</span>
          </div>
          <div class="employee-list">
            <div 
              v-for="(item, index) in employeeRanking" 
              :key="item.id"
              class="employee-item"
            >
              <div class="employee-avatar">
                <el-avatar :size="40" :src="item.avatar">
                  {{ item.name?.charAt(0) }}
                </el-avatar>
                <div class="employee-rank" :class="getRankClass(index)">{{ index + 1 }}</div>
              </div>
              <div class="employee-info">
                <div class="employee-name">{{ item.name }}</div>
                <div class="employee-position">{{ item.position }}</div>
              </div>
              <div class="employee-stats">
                <div class="stat-item">
                  <span class="stat-label">业绩</span>
                  <span class="stat-value">¥{{ formatNumber(item.sales) }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">服务</span>
                  <span class="stat-value">{{ item.serviceCount }}次</span>
                </div>
              </div>
            </div>
            <el-empty v-if="!employeeRanking.length" description="暂无数据" :image-size="60" />
          </div>
        </div>

        <!-- 会员分布地图 -->
        <div class="map-panel">
          <div class="panel-header">
            <span class="panel-title">会员分布</span>
          </div>
          <div ref="mapChartRef" class="chart-container"></div>
        </div>

        <!-- 支付方式分布 -->
        <div class="chart-panel payment-panel">
          <div class="panel-header">
            <span class="panel-title">支付方式分布</span>
          </div>
          <div ref="paymentChartRef" class="chart-container-small"></div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { 
  Money, User, Avatar, ShoppingCart, Location, List, Calendar,
  Refresh
} from '@element-plus/icons-vue'
import * as echarts from 'echarts'

// API配置
const API_BASE = 'http://localhost:3000/api'
const token = localStorage.getItem('token') || ''

// 全屏状态
const isFullscreen = ref(false)

// 图标组件
const FullScreen = {
  template: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>'
}
const ExitFullScreen = {
  template: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/></svg>'
}

// 时间显示
const currentTime = ref('')
const currentDate = ref('')

// 图表类型选项
const chartTabs = [
  { label: '今日', value: 'today' },
  { label: '本周', value: 'week' },
  { label: '本月', value: 'month' }
]

// 数据状态
const overview = ref({
  todayRevenue: 0,
  revenueTrend: 0,
  todayCustomers: 0,
  customerTrend: 0,
  totalMembers: 0,
  memberTrend: 0,
  newMembersToday: 0,
  avgPrice: 0,
  priceTrend: 0
})

const realtime = ref({
  inStore: 0,
  queueCount: 0,
  serving: 0,
  todayAppointments: 0
})

const serviceRanking = ref<any[]>([])
const employeeRanking = ref<any[]>([])
const revenueChartType = ref('week')
const customerChartType = ref('week')

// 图表引用
const revenueChartRef = ref<HTMLElement>()
const customerChartRef = ref<HTMLElement>()
const mapChartRef = ref<HTMLElement>()
const paymentChartRef = ref<HTMLElement>()

// 图表实例
let revenueChart: echarts.ECharts | null = null
let customerChart: echarts.ECharts | null = null
let mapChart: echarts.ECharts | null = null
let paymentChart: echarts.ECharts | null = null

// 计算属性
const serviceMaxCount = computed(() => {
  return Math.max(...serviceRanking.value.map(s => s.count), 1)
})

// 工具函数
const formatNumber = (num: number) => {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万'
  }
  return num.toLocaleString()
}

const getRankClass = (index: number) => {
  if (index === 0) return 'first'
  if (index === 1) return 'second'
  if (index === 2) return 'third'
  return ''
}

const getBarWidth = (value: number, max: number) => {
  return (value / max) * 100
}

// 更新时间
const updateTime = () => {
  const now = new Date()
  currentTime.value = now.toLocaleTimeString('zh-CN', { hour12: false })
  currentDate.value = now.toLocaleDateString('zh-CN', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    weekday: 'long'
  })
}

// 切换全屏
const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen()
    isFullscreen.value = true
  } else {
    document.exitFullscreen()
    isFullscreen.value = false
  }
}

// 刷新数据
const refreshData = async () => {
  ElMessage.success('数据刷新中...')
  await loadAllData()
  ElMessage.success('数据已更新')
}

// 加载所有数据
const loadAllData = async () => {
  await Promise.all([
    loadOverview(),
    loadRealtime(),
    loadServiceRanking(),
    loadEmployeeRanking(),
    loadRevenueChart(),
    loadCustomerChart(),
    loadMapChart(),
    loadPaymentChart()
  ])
}

// 加载概览数据
const loadOverview = async () => {
  try {
    const res = await fetch(`${API_BASE}/report/overview`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const data = await res.json()
    overview.value = {
      todayRevenue: data.today?.amount || 0,
      revenueTrend: data.revenueTrend || 0,
      todayCustomers: data.today?.count || 0,
      customerTrend: data.customerTrend || 0,
      totalMembers: data.total?.memberCount || 0,
      memberTrend: data.memberTrend || 0,
      newMembersToday: data.newMembersToday || 0,
      avgPrice: data.today?.avgPrice || 0,
      priceTrend: data.priceTrend || 0
    }
  } catch (e) {
    // 使用模拟数据
    overview.value = {
      todayRevenue: 28650,
      revenueTrend: 12.5,
      todayCustomers: 156,
      customerTrend: 8.3,
      totalMembers: 3258,
      memberTrend: 5.2,
      newMembersToday: 12,
      avgPrice: 184,
      priceTrend: 3.8
    }
  }
}

// 加载实时数据
const loadRealtime = async () => {
  try {
    const res = await fetch(`${API_BASE}/dashboard/realtime`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    realtime.value = await res.json()
  } catch (e) {
    // 使用模拟数据
    realtime.value = {
      inStore: 23,
      queueCount: 5,
      serving: 18,
      todayAppointments: 42
    }
  }
}

// 加载服务排行
const loadServiceRanking = async () => {
  try {
    const res = await fetch(`${API_BASE}/report/service-ranking`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    serviceRanking.value = await res.json()
  } catch (e) {
    // 使用模拟数据
    serviceRanking.value = [
      { id: 1, name: '精剪造型', count: 86 },
      { id: 2, name: '烫发套餐', count: 65 },
      { id: 3, name: '染发护理', count: 52 },
      { id: 4, name: '美甲套餐', count: 48 },
      { id: 5, name: '头皮护理', count: 35 },
      { id: 6, name: '面部护理', count: 28 }
    ]
  }
}

// 加载员工排行
const loadEmployeeRanking = async () => {
  try {
    const res = await fetch(`${API_BASE}/report/employee-performance`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    employeeRanking.value = await res.json()
  } catch (e) {
    // 使用模拟数据
    employeeRanking.value = [
      { id: 1, name: '张美丽', position: '高级发型师', sales: 8650, serviceCount: 28, avatar: '' },
      { id: 2, name: '李小芳', position: '资深美甲师', sales: 7280, serviceCount: 32, avatar: '' },
      { id: 3, name: '王大明', position: '首席发型师', sales: 6540, serviceCount: 18, avatar: '' },
      { id: 4, name: '赵小燕', position: '美容师', sales: 5320, serviceCount: 22, avatar: '' },
      { id: 5, name: '刘小华', position: '发型师', sales: 4860, serviceCount: 25, avatar: '' }
    ]
  }
}

// 加载营业额趋势图
const loadRevenueChart = async () => {
  await nextTick()
  if (!revenueChartRef.value) return
  
  if (!revenueChart) {
    revenueChart = echarts.init(revenueChartRef.value)
  }
  
  let data: any = { dates: [], amounts: [], counts: [] }
  
  try {
    const res = await fetch(`${API_BASE}/report/trend?type=${revenueChartType.value}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    data = await res.json()
  } catch (e) {
    // 使用模拟数据
    if (revenueChartType.value === 'today') {
      data = {
        dates: ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'],
        amounts: [1200, 2800, 3500, 4200, 3800, 4500, 5200, 4800, 5600, 6200],
        counts: [8, 15, 22, 28, 25, 30, 35, 32, 38, 42]
      }
    } else if (revenueChartType.value === 'week') {
      data = {
        dates: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
        amounts: [18500, 22300, 19800, 24500, 28600, 35200, 32800],
        counts: [125, 148, 132, 165, 192, 235, 218]
      }
    } else {
      data = {
        dates: ['第1周', '第2周', '第3周', '第4周'],
        amounts: [125000, 138000, 142500, 156800],
        counts: [835, 920, 950, 1045]
      }
    }
  }
  
  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      borderColor: '#409EFF',
      textStyle: { color: '#fff' },
      axisPointer: {
        type: 'cross',
        crossStyle: { color: '#999' }
      }
    },
    legend: {
      data: ['营业额', '订单数'],
      textStyle: { color: '#fff' },
      top: 10
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: 60,
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: data.dates,
      axisLine: { lineStyle: { color: '#3a5a8c' } },
      axisLabel: { color: '#8cb4e8' }
    },
    yAxis: [
      {
        type: 'value',
        name: '营业额(元)',
        nameTextStyle: { color: '#8cb4e8' },
        axisLine: { lineStyle: { color: '#3a5a8c' } },
        axisLabel: { color: '#8cb4e8', formatter: (v: number) => v >= 1000 ? (v/1000) + 'k' : v },
        splitLine: { lineStyle: { color: 'rgba(58, 90, 140, 0.3)' } }
      },
      {
        type: 'value',
        name: '订单数',
        nameTextStyle: { color: '#8cb4e8' },
        axisLine: { lineStyle: { color: '#3a5a8c' } },
        axisLabel: { color: '#8cb4e8' },
        splitLine: { show: false }
      }
    ],
    series: [
      {
        name: '营业额',
        type: 'line',
        smooth: true,
        data: data.amounts,
        itemStyle: { color: '#409EFF' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(64, 158, 255, 0.5)' },
            { offset: 1, color: 'rgba(64, 158, 255, 0.1)' }
          ])
        }
      },
      {
        name: '订单数',
        type: 'bar',
        yAxisIndex: 1,
        data: data.counts,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#67C23A' },
            { offset: 1, color: 'rgba(103, 194, 58, 0.3)' }
          ]),
          borderRadius: [4, 4, 0, 0]
        },
        barWidth: '40%'
      }
    ]
  }
  
  revenueChart.setOption(option)
}

// 加载客流趋势图
const loadCustomerChart = async () => {
  await nextTick()
  if (!customerChartRef.value) return
  
  if (!customerChart) {
    customerChart = echarts.init(customerChartRef.value)
  }
  
  let data: any = { dates: [], newCustomers: [], oldCustomers: [] }
  
  try {
    const res = await fetch(`${API_BASE}/report/customer-flow?type=${customerChartType.value}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    data = await res.json()
  } catch (e) {
    // 使用模拟数据
    if (customerChartType.value === 'today') {
      data = {
        dates: ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'],
        newCustomers: [3, 5, 8, 6, 4, 7, 9, 5, 8, 6],
        oldCustomers: [5, 10, 14, 22, 21, 23, 26, 27, 30, 36]
      }
    } else if (customerChartType.value === 'week') {
      data = {
        dates: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
        newCustomers: [18, 22, 15, 25, 32, 45, 38],
        oldCustomers: [107, 126, 117, 140, 160, 190, 180]
      }
    } else {
      data = {
        dates: ['第1周', '第2周', '第3周', '第4周'],
        newCustomers: [125, 138, 142, 158],
        oldCustomers: [710, 782, 808, 887]
      }
    }
  }
  
  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      borderColor: '#67C23A',
      textStyle: { color: '#fff' }
    },
    legend: {
      data: ['新客户', '老客户'],
      textStyle: { color: '#fff' },
      top: 10
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: 60,
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: data.dates,
      boundaryGap: false,
      axisLine: { lineStyle: { color: '#3a5a8c' } },
      axisLabel: { color: '#8cb4e8' }
    },
    yAxis: {
      type: 'value',
      name: '人数',
      nameTextStyle: { color: '#8cb4e8' },
      axisLine: { lineStyle: { color: '#3a5a8c' } },
      axisLabel: { color: '#8cb4e8' },
      splitLine: { lineStyle: { color: 'rgba(58, 90, 140, 0.3)' } }
    },
    series: [
      {
        name: '新客户',
        type: 'line',
        smooth: true,
        stack: 'Total',
        data: data.newCustomers,
        itemStyle: { color: '#E6A23C' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(230, 162, 60, 0.5)' },
            { offset: 1, color: 'rgba(230, 162, 60, 0.1)' }
          ])
        }
      },
      {
        name: '老客户',
        type: 'line',
        smooth: true,
        stack: 'Total',
        data: data.oldCustomers,
        itemStyle: { color: '#67C23A' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(103, 194, 58, 0.5)' },
            { offset: 1, color: 'rgba(103, 194, 58, 0.1)' }
          ])
        }
      }
    ]
  }
  
  customerChart.setOption(option)
}

// 加载地图
const loadMapChart = async () => {
  await nextTick()
  if (!mapChartRef.value) return
  
  if (!mapChart) {
    mapChart = echarts.init(mapChartRef.value)
  }
  
  // 使用柱状图展示会员分布（替代地图）
  const mapData = [
    { name: '北京', value: 320 },
    { name: '上海', value: 280 },
    { name: '广东', value: 450 },
    { name: '浙江', value: 380 },
    { name: '江苏', value: 420 },
    { name: '四川', value: 260 },
    { name: '湖北', value: 180 },
    { name: '山东', value: 220 },
    { name: '河南', value: 150 },
    { name: '福建', value: 190 }
  ]
  
  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      borderColor: '#409EFF',
      textStyle: { color: '#fff' },
      axisPointer: { type: 'shadow' }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: 10,
      containLabel: true
    },
    xAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: '#3a5a8c' } },
      axisLabel: { color: '#8cb4e8' },
      splitLine: { lineStyle: { color: 'rgba(58, 90, 140, 0.3)' } }
    },
    yAxis: {
      type: 'category',
      data: mapData.map(d => d.name).reverse(),
      axisLine: { lineStyle: { color: '#3a5a8c' } },
      axisLabel: { color: '#8cb4e8' }
    },
    series: [
      {
        name: '会员数',
        type: 'bar',
        data: mapData.map(d => d.value).reverse(),
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: '#1a3a5c' },
            { offset: 0.5, color: '#409EFF' },
            { offset: 1, color: '#67C23A' }
          ]),
          borderRadius: [0, 4, 4, 0]
        },
        label: {
          show: true,
          position: 'right',
          color: '#fff',
          fontSize: 12
        },
        barWidth: '60%'
      }
    ]
  }
  
  mapChart.setOption(option)
}

// 加载支付方式图表
const loadPaymentChart = async () => {
  await nextTick()
  if (!paymentChartRef.value) return
  
  if (!paymentChart) {
    paymentChart = echarts.init(paymentChartRef.value)
  }
  
  let data: any[] = []
  
  try {
    const res = await fetch(`${API_BASE}/report/payment-methods`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    data = await res.json()
  } catch (e) {
    // 使用模拟数据
    data = [
      { name: '微信支付', value: 12580 },
      { name: '支付宝', value: 8650 },
      { name: '会员卡', value: 5230 },
      { name: '现金', value: 1890 },
      { name: '次卡', value: 300 }
    ]
  }
  
  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      borderColor: '#409EFF',
      textStyle: { color: '#fff' },
      formatter: '{b}: ¥{c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      textStyle: { color: '#8cb4e8', fontSize: 12 },
      top: 'center'
    },
    series: [
      {
        name: '支付方式',
        type: 'pie',
        radius: ['45%', '70%'],
        center: ['60%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 8,
          borderColor: '#0a1e36',
          borderWidth: 2
        },
        label: {
          show: false
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold',
            color: '#fff'
          }
        },
        labelLine: {
          show: false
        },
        data: data.map((item, index) => ({
          ...item,
          itemStyle: { 
            color: ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#909399'][index % 5] 
          }
        }))
      }
    ]
  }
  
  paymentChart.setOption(option)
}

// 监听图表类型变化
watch(revenueChartType, () => {
  loadRevenueChart()
})

watch(customerChartType, () => {
  loadCustomerChart()
})

// 窗口大小变化时重绘图表
const handleResize = () => {
  revenueChart?.resize()
  customerChart?.resize()
  mapChart?.resize()
  paymentChart?.resize()
}

// 定时刷新
let refreshTimer: number | null = null
let timeTimer: number | null = null

onMounted(() => {
  // 更新时间
  updateTime()
  timeTimer = window.setInterval(updateTime, 1000)
  
  // 加载数据
  loadAllData()
  
  // 定时刷新数据（每30秒）
  refreshTimer = window.setInterval(() => {
    loadRealtime()
  }, 30000)
  
  // 监听窗口大小变化
  window.addEventListener('resize', handleResize)
  
  // 监听全屏变化
  document.addEventListener('fullscreenchange', () => {
    isFullscreen.value = !!document.fullscreenElement
  })
})

onUnmounted(() => {
  if (timeTimer) clearInterval(timeTimer)
  if (refreshTimer) clearInterval(refreshTimer)
  window.removeEventListener('resize', handleResize)
  revenueChart?.dispose()
  customerChart?.dispose()
  mapChart?.dispose()
  paymentChart?.dispose()
})
</script>

<style scoped>
.dashboard-screen {
  min-height: 100vh;
  background: linear-gradient(135deg, #0a1628 0%, #0d2137 50%, #0a1628 100%);
  color: #fff;
  overflow-x: hidden;
}

.dashboard-screen.fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
}

/* 头部样式 */
.screen-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: linear-gradient(90deg, rgba(10, 30, 54, 0.9) 0%, rgba(20, 50, 80, 0.9) 50%, rgba(10, 30, 54, 0.9) 100%);
  border-bottom: 1px solid rgba(64, 158, 255, 0.3);
}

.header-left {
  display: flex;
  align-items: baseline;
  gap: 16px;
}

.title {
  font-size: 28px;
  font-weight: bold;
  background: linear-gradient(90deg, #409EFF, #67C23A);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: 4px;
}

.subtitle {
  font-size: 14px;
  color: #8cb4e8;
}

.header-center {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}

.time {
  font-size: 42px;
  font-weight: bold;
  font-family: 'Courier New', monospace;
  color: #409EFF;
  text-shadow: 0 0 20px rgba(64, 158, 255, 0.5);
}

.header-right {
  display: flex;
  gap: 12px;
}

.fullscreen-btn,
.refresh-btn {
  background: rgba(64, 158, 255, 0.2);
  border: 1px solid rgba(64, 158, 255, 0.5);
  color: #409EFF;
}

.fullscreen-btn:hover,
.refresh-btn:hover {
  background: rgba(64, 158, 255, 0.3);
}

/* 主内容区域 */
.screen-main {
  display: grid;
  grid-template-columns: 1fr 1.5fr 1fr;
  gap: 16px;
  padding: 16px;
  height: calc(100vh - 80px);
}

/* 左侧区域 */
.left-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 概览卡片 */
.overview-cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.overview-card {
  background: linear-gradient(135deg, rgba(20, 40, 70, 0.8) 0%, rgba(15, 30, 50, 0.9) 100%);
  border: 1px solid rgba(64, 158, 255, 0.2);
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.card-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.card-icon.revenue {
  background: linear-gradient(135deg, #409EFF, #79bbff);
}

.card-icon.customer {
  background: linear-gradient(135deg, #67C23A, #95d475);
}

.card-icon.member {
  background: linear-gradient(135deg, #E6A23C, #eebe77);
}

.card-icon.price {
  background: linear-gradient(135deg, #F56C6C, #fab6b6);
}

.card-content {
  flex: 1;
}

.card-value {
  font-size: 24px;
  font-weight: bold;
  color: #fff;
}

.card-value .prefix {
  font-size: 16px;
  margin-right: 2px;
}

.card-value .suffix {
  font-size: 14px;
  margin-left: 2px;
}

.card-label {
  font-size: 13px;
  color: #8cb4e8;
  margin-top: 4px;
}

.card-trend {
  font-size: 12px;
  margin-top: 4px;
}

.card-trend.up {
  color: #67C23A;
}

.card-trend.down {
  color: #F56C6C;
}

/* 面板通用样式 */
.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.panel-title {
  font-size: 16px;
  font-weight: bold;
  color: #fff;
  padding-left: 12px;
  border-left: 3px solid #409EFF;
}

/* 实时数据面板 */
.realtime-panel {
  background: linear-gradient(135deg, rgba(20, 40, 70, 0.8) 0%, rgba(15, 30, 50, 0.9) 100%);
  border: 1px solid rgba(64, 158, 255, 0.2);
  border-radius: 12px;
  padding: 16px;
}

.realtime-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #67C23A;
}

.pulse {
  width: 8px;
  height: 8px;
  background: #67C23A;
  border-radius: 50%;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(103, 194, 58, 0.7);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(103, 194, 58, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(103, 194, 58, 0);
  }
}

.realtime-content {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.realtime-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(64, 158, 255, 0.1);
  border-radius: 8px;
}

.realtime-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(64, 158, 255, 0.3);
  color: #409EFF;
}

.realtime-icon.queue {
  background: rgba(230, 162, 60, 0.3);
  color: #E6A23C;
}

.realtime-icon.serving {
  background: rgba(103, 194, 58, 0.3);
  color: #67C23A;
}

.realtime-icon.appointment {
  background: rgba(245, 108, 108, 0.3);
  color: #F56C6C;
}

.realtime-value {
  font-size: 20px;
  font-weight: bold;
  color: #fff;
}

.realtime-label {
  font-size: 12px;
  color: #8cb4e8;
}

/* 排行榜面板 */
.ranking-panel {
  flex: 1;
  background: linear-gradient(135deg, rgba(20, 40, 70, 0.8) 0%, rgba(15, 30, 50, 0.9) 100%);
  border: 1px solid rgba(64, 158, 255, 0.2);
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
}

.ranking-list {
  flex: 1;
  overflow-y: auto;
}

.ranking-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid rgba(64, 158, 255, 0.1);
}

.ranking-item:last-child {
  border-bottom: none;
}

.ranking-index {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
  background: rgba(64, 158, 255, 0.2);
  color: #8cb4e8;
}

.ranking-index.first {
  background: linear-gradient(135deg, #FFD700, #FFA500);
  color: #fff;
}

.ranking-index.second {
  background: linear-gradient(135deg, #C0C0C0, #A0A0A0);
  color: #fff;
}

.ranking-index.third {
  background: linear-gradient(135deg, #CD7F32, #8B4513);
  color: #fff;
}

.ranking-name {
  flex: 1;
  font-size: 14px;
  color: #fff;
}

.ranking-bar {
  width: 100px;
  height: 6px;
  background: rgba(64, 158, 255, 0.2);
  border-radius: 3px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #409EFF, #67C23A);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.ranking-value {
  width: 60px;
  text-align: right;
  font-size: 13px;
  color: #8cb4e8;
}

/* 中间区域 */
.center-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 图表面板 */
.chart-panel {
  background: linear-gradient(135deg, rgba(20, 40, 70, 0.8) 0%, rgba(15, 30, 50, 0.9) 100%);
  border: 1px solid rgba(64, 158, 255, 0.2);
  border-radius: 12px;
  padding: 16px;
}

.chart-panel.main-chart {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.chart-tabs {
  display: flex;
  gap: 8px;
}

.tab-item {
  padding: 4px 12px;
  font-size: 12px;
  color: #8cb4e8;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.3s;
}

.tab-item:hover {
  background: rgba(64, 158, 255, 0.2);
}

.tab-item.active {
  background: #409EFF;
  color: #fff;
}

.chart-container {
  flex: 1;
  min-height: 200px;
}

/* 右侧区域 */
.right-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 员工排行 */
.employee-ranking {
  flex: 1;
}

.employee-list {
  flex: 1;
  overflow-y: auto;
}

.employee-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid rgba(64, 158, 255, 0.1);
}

.employee-item:last-child {
  border-bottom: none;
}

.employee-avatar {
  position: relative;
}

.employee-rank {
  position: absolute;
  top: -4px;
  right: -4px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: bold;
  background: rgba(64, 158, 255, 0.2);
  color: #8cb4e8;
}

.employee-rank.first {
  background: linear-gradient(135deg, #FFD700, #FFA500);
  color: #fff;
}

.employee-rank.second {
  background: linear-gradient(135deg, #C0C0C0, #A0A0A0);
  color: #fff;
}

.employee-rank.third {
  background: linear-gradient(135deg, #CD7F32, #8B4513);
  color: #fff;
}

.employee-info {
  flex: 1;
}

.employee-name {
  font-size: 14px;
  font-weight: bold;
  color: #fff;
}

.employee-position {
  font-size: 12px;
  color: #8cb4e8;
  margin-top: 2px;
}

.employee-stats {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stat-label {
  font-size: 12px;
  color: #8cb4e8;
}

.stat-value {
  font-size: 13px;
  font-weight: bold;
  color: #fff;
}

/* 地图面板 */
.map-panel {
  flex: 1;
  background: linear-gradient(135deg, rgba(20, 40, 70, 0.8) 0%, rgba(15, 30, 50, 0.9) 100%);
  border: 1px solid rgba(64, 158, 255, 0.2);
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
}

.map-panel .chart-container {
  flex: 1;
  min-height: 200px;
}

/* 支付方式面板 */
.payment-panel {
  background: linear-gradient(135deg, rgba(20, 40, 70, 0.8) 0%, rgba(15, 30, 50, 0.9) 100%);
  border: 1px solid rgba(64, 158, 255, 0.2);
  border-radius: 12px;
  padding: 16px;
}

.chart-container-small {
  height: 180px;
}

/* 滚动条样式 */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: rgba(64, 158, 255, 0.1);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb {
  background: rgba(64, 158, 255, 0.3);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(64, 158, 255, 0.5);
}

/* 响应式 */
@media (max-width: 1400px) {
  .screen-main {
    grid-template-columns: 1fr 1.2fr 1fr;
  }
}

@media (max-width: 1200px) {
  .screen-main {
    grid-template-columns: 1fr 1fr;
  }
  
  .center-section {
    grid-column: span 2;
    flex-direction: row;
  }
  
  .chart-panel.main-chart {
    flex: 1;
  }
}

@media (max-width: 768px) {
  .screen-main {
    grid-template-columns: 1fr;
  }
  
  .center-section {
    grid-column: span 1;
    flex-direction: column;
  }
  
  .overview-cards {
    grid-template-columns: 1fr;
  }
  
  .time {
    font-size: 28px;
  }
}
</style>
