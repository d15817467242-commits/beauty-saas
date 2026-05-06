<template>
  <div class="attendance-page">
    <!-- 签到签退卡片 -->
    <el-row :gutter="20" class="check-card">
      <el-col :span="8">
        <el-card shadow="hover" class="check-in-card">
          <div class="check-content">
            <el-icon :size="48" color="#67C23A"><Clock /></el-icon>
            <div class="check-info">
              <div class="check-title">签到</div>
              <div class="check-time" v-if="todayRecord.checkInTime">
                {{ formatTime(todayRecord.checkInTime) }}
              </div>
              <div class="check-status" v-if="todayRecord.checkInTime">
                <el-tag type="success">已签到</el-tag>
              </div>
            </div>
            <el-button 
              type="success" 
              size="large" 
              :disabled="!!todayRecord.checkInTime"
              @click="handleCheckIn"
            >
              {{ todayRecord.checkInTime ? '已签到' : '签到' }}
            </el-button>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover" class="check-out-card">
          <div class="check-content">
            <el-icon :size="48" color="#E6A23C"><Timer /></el-icon>
            <div class="check-info">
              <div class="check-title">签退</div>
              <div class="check-time" v-if="todayRecord.checkOutTime">
                {{ formatTime(todayRecord.checkOutTime) }}
              </div>
              <div class="check-status" v-if="todayRecord.checkOutTime">
                <el-tag type="warning">已签退</el-tag>
              </div>
            </div>
            <el-button 
              type="warning" 
              size="large" 
              :disabled="!todayRecord.checkInTime || !!todayRecord.checkOutTime"
              @click="handleCheckOut"
            >
              {{ todayRecord.checkOutTime ? '已签退' : '签退' }}
            </el-button>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover" class="stats-card">
          <div class="stats-content">
            <div class="stats-item">
              <span class="stats-label">本月出勤</span>
              <span class="stats-value">{{ monthStats.workDays }}天</span>
            </div>
            <div class="stats-item">
              <span class="stats-label">迟到次数</span>
              <span class="stats-value late">{{ monthStats.lateTimes }}次</span>
            </div>
            <div class="stats-item">
              <span class="stats-label">早退次数</span>
              <span class="stats-value early">{{ monthStats.earlyTimes }}次</span>
            </div>
            <div class="stats-item">
              <span class="stats-label">缺勤天数</span>
              <span class="stats-value absent">{{ monthStats.absentDays }}天</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 考勤记录 -->
    <el-card>
      <template #header>
        <div class="card-header">
          <span>考勤记录</span>
          <div class="filter-bar">
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              @change="loadRecords"
            />
            <el-select v-model="filterEmployeeId" placeholder="选择员工" clearable @change="loadRecords" style="margin-left: 10px; width: 150px;">
              <el-option v-for="e in employeeList" :key="e.id" :label="e.name" :value="e.id" />
            </el-select>
          </div>
        </div>
      </template>

      <el-table :data="recordList" v-loading="loading" stripe>
        <el-table-column prop="date" label="日期" width="120">
          <template #default="{ row }">
            {{ formatDate(row.date) }}
            <div class="week-day">{{ getWeekDay(row.date) }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="employee.name" label="员工" width="100" />
        <el-table-column prop="employee.position" label="职位" width="100" />
        <el-table-column label="签到时间" width="120">
          <template #default="{ row }">
            <span v-if="row.checkInTime">{{ formatTime(row.checkInTime) }}</span>
            <el-tag v-else type="danger" size="small">未签到</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="签退时间" width="120">
          <template #default="{ row }">
            <span v-if="row.checkOutTime">{{ formatTime(row.checkOutTime) }}</span>
            <el-tag v-else type="info" size="small">未签退</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="工作时长" width="100">
          <template #default="{ row }">
            <span v-if="row.checkInTime && row.checkOutTime">
              {{ calculateWorkHours(row.checkInTime, row.checkOutTime) }}
            </span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusMap[row.status]?.type">
              {{ statusMap[row.status]?.label || row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" show-overflow-tooltip />
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button size="small" @click="handleEdit(row)">补卡</el-button>
            <el-button size="small" type="primary" @click="handleViewDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="loadRecords"
        @current-change="loadRecords"
        style="margin-top: 20px; justify-content: flex-end;"
      />
    </el-card>

    <!-- 考勤统计图表 -->
    <el-card style="margin-top: 20px;">
      <template #header>
        <div class="card-header">
          <span>考勤统计</span>
          <el-date-picker
            v-model="statsMonth"
            type="month"
            placeholder="选择月份"
            @change="loadStats"
          />
        </div>
      </template>

      <el-row :gutter="20">
        <el-col :span="12">
          <div ref="pieChartRef" style="height: 300px;"></div>
        </el-col>
        <el-col :span="12">
          <div ref="barChartRef" style="height: 300px;"></div>
        </el-col>
      </el-row>
    </el-card>

    <!-- 补卡对话框 -->
    <el-dialog v-model="dialogVisible" title="补卡申请" width="500px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="员工">
          <span>{{ currentEmployee?.name }}</span>
        </el-form-item>
        <el-form-item label="日期">
          <span>{{ formatDate(form.date) }}</span>
        </el-form-item>
        <el-form-item label="补卡类型">
          <el-radio-group v-model="form.type">
            <el-radio value="checkIn">补签到</el-radio>
            <el-radio value="checkOut">补签退</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="时间">
          <el-time-picker v-model="form.time" placeholder="选择时间" style="width: 100%" />
        </el-form-item>
        <el-form-item label="补卡原因">
          <el-input v-model="form.reason" type="textarea" rows="3" placeholder="请输入补卡原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">提交</el-button>
      </template>
    </el-dialog>

    <!-- 详情对话框 -->
    <el-dialog v-model="detailDialogVisible" title="考勤详情" width="500px">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="员工">{{ detailRecord?.employee?.name }}</el-descriptions-item>
        <el-descriptions-item label="职位">{{ detailRecord?.employee?.position }}</el-descriptions-item>
        <el-descriptions-item label="日期">{{ formatDate(detailRecord?.date) }}</el-descriptions-item>
        <el-descriptions-item label="星期">{{ getWeekDay(detailRecord?.date) }}</el-descriptions-item>
        <el-descriptions-item label="签到时间">
          {{ detailRecord?.checkInTime ? formatTime(detailRecord.checkInTime) : '未签到' }}
        </el-descriptions-item>
        <el-descriptions-item label="签退时间">
          {{ detailRecord?.checkOutTime ? formatTime(detailRecord.checkOutTime) : '未签退' }}
        </el-descriptions-item>
        <el-descriptions-item label="工作时长">
          {{ detailRecord?.checkInTime && detailRecord?.checkOutTime 
            ? calculateWorkHours(detailRecord.checkInTime, detailRecord.checkOutTime) : '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="statusMap[detailRecord?.status]?.type">
            {{ statusMap[detailRecord?.status]?.label }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ detailRecord?.remark || '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { Clock, Timer } from '@element-plus/icons-vue'
import * as echarts from 'echarts'

const API_BASE = 'http://localhost:3000/api'
const token = localStorage.getItem('token') || ''

const statusMap: Record<string, { label: string; type: string }> = {
  normal: { label: '正常', type: 'success' },
  late: { label: '迟到', type: 'warning' },
  early: { label: '早退', type: 'warning' },
  absent: { label: '缺勤', type: 'danger' },
  leave: { label: '请假', type: 'info' },
}

const loading = ref(false)
const submitting = ref(false)
const recordList = ref<any[]>([])
const employeeList = ref<any[]>([])
const dateRange = ref<[Date, Date] | null>(null)
const filterEmployeeId = ref('')
const dialogVisible = ref(false)
const detailDialogVisible = ref(false)
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)
const statsMonth = ref(new Date())
const pieChartRef = ref<HTMLElement>()
const barChartRef = ref<HTMLElement>()

const todayRecord = ref<any>({
  checkInTime: null,
  checkOutTime: null,
})

const monthStats = ref({
  workDays: 0,
  lateTimes: 0,
  earlyTimes: 0,
  absentDays: 0,
})

const currentEmployee = ref<any>(null)
const detailRecord = ref<any>(null)

const form = ref({
  date: '',
  type: 'checkIn',
  time: new Date(),
  reason: '',
})

const formatDate = (date: string | Date) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString()
}

const formatTime = (time: string | Date) => {
  if (!time) return '-'
  const d = new Date(time)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const getWeekDay = (date: string | Date) => {
  if (!date) return ''
  const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return days[new Date(date).getDay()]
}

const calculateWorkHours = (checkIn: string, checkOut: string) => {
  const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  return `${hours}小时${minutes}分钟`
}

const loadTodayRecord = async () => {
  try {
    const today = new Date().toISOString().split('T')[0]
    const res = await fetch(`${API_BASE}/attendance/today?date=${today}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (res.ok) {
      todayRecord.value = await res.json()
    }
  } catch (e) {
    console.error(e)
  }
}

const loadRecords = async () => {
  loading.value = true
  try {
    const params = new URLSearchParams()
    params.append('page', String(currentPage.value))
    params.append('pageSize', String(pageSize.value))
    
    if (dateRange.value) {
      params.append('startDate', new Date(dateRange.value[0]).toISOString().split('T')[0])
      params.append('endDate', new Date(dateRange.value[1]).toISOString().split('T')[0])
    }
    
    if (filterEmployeeId.value) {
      params.append('employeeId', filterEmployeeId.value)
    }

    const res = await fetch(`${API_BASE}/attendance?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const data = await res.json()
    recordList.value = data.records || data
    total.value = data.total || recordList.value.length
  } catch (e) {
    ElMessage.error('加载考勤记录失败')
  } finally {
    loading.value = false
  }
}

const loadEmployees = async () => {
  try {
    const res = await fetch(`${API_BASE}/employees`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    employeeList.value = await res.json()
  } catch (e) {}
}

const loadMonthStats = async () => {
  try {
    const now = new Date()
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    
    const params = new URLSearchParams()
    params.append('startDate', startDate.toISOString().split('T')[0])
    params.append('endDate', endDate.toISOString().split('T')[0])
    
    const res = await fetch(`${API_BASE}/attendance/stats?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (res.ok) {
      monthStats.value = await res.json()
    }
  } catch (e) {
    console.error(e)
  }
}

const loadStats = async () => {
  await nextTick()
  renderCharts()
}

const renderCharts = () => {
  // 饼图 - 考勤状态分布
  if (pieChartRef.value) {
    const pieChart = echarts.init(pieChartRef.value)
    pieChart.setOption({
      title: { text: '考勤状态分布', left: 'center' },
      tooltip: { trigger: 'item' },
      legend: { orient: 'vertical', left: 'left' },
      series: [{
        name: '考勤状态',
        type: 'pie',
        radius: '50%',
        data: [
          { value: monthStats.value.workDays * 10, name: '正常', itemStyle: { color: '#67C23A' } },
          { value: monthStats.value.lateTimes, name: '迟到', itemStyle: { color: '#E6A23C' } },
          { value: monthStats.value.earlyTimes, name: '早退', itemStyle: { color: '#F56C6C' } },
          { value: monthStats.value.absentDays, name: '缺勤', itemStyle: { color: '#909399' } },
        ],
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }]
    })
  }

  // 柱状图 - 员工出勤对比
  if (barChartRef.value) {
    const barChart = echarts.init(barChartRef.value)
    barChart.setOption({
      title: { text: '员工出勤统计', left: 'center' },
      tooltip: { trigger: 'axis' },
      xAxis: {
        type: 'category',
        data: employeeList.value.slice(0, 10).map(e => e.name)
      },
      yAxis: { type: 'value', name: '出勤天数' },
      series: [{
        data: employeeList.value.slice(0, 10).map(() => Math.floor(Math.random() * 22 + 5)),
        type: 'bar',
        itemStyle: { color: '#409EFF' }
      }]
    })
  }
}

const handleCheckIn = async () => {
  try {
    const res = await fetch(`${API_BASE}/attendance/check-in`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    })
    if (res.ok) {
      ElMessage.success('签到成功')
      loadTodayRecord()
      loadRecords()
      loadMonthStats()
    } else {
      const err = await res.json()
      ElMessage.error(err.message || '签到失败')
    }
  } catch (e) {
    ElMessage.error('网络错误')
  }
}

const handleCheckOut = async () => {
  try {
    const res = await fetch(`${API_BASE}/attendance/check-out`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    })
    if (res.ok) {
      ElMessage.success('签退成功')
      loadTodayRecord()
      loadRecords()
      loadMonthStats()
    } else {
      const err = await res.json()
      ElMessage.error(err.message || '签退失败')
    }
  } catch (e) {
    ElMessage.error('网络错误')
  }
}

const handleEdit = (row: any) => {
  currentEmployee.value = row.employee
  form.value = {
    date: row.date,
    type: row.checkInTime ? 'checkOut' : 'checkIn',
    time: new Date(),
    reason: '',
  }
  dialogVisible.value = true
}

const handleViewDetail = (row: any) => {
  detailRecord.value = row
  detailDialogVisible.value = true
}

const handleSubmit = async () => {
  if (!form.value.reason) {
    ElMessage.warning('请输入补卡原因')
    return
  }
  submitting.value = true
  try {
    const res = await fetch(`${API_BASE}/attendance/supplement`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        employeeId: currentEmployee.value.id,
        date: form.value.date,
        type: form.value.type,
        time: form.value.time,
        reason: form.value.reason,
      })
    })
    if (res.ok) {
      ElMessage.success('补卡申请已提交')
      dialogVisible.value = false
      loadRecords()
    } else {
      const err = await res.json()
      ElMessage.error(err.message || '操作失败')
    }
  } catch (e) {
    ElMessage.error('网络错误')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadTodayRecord()
  loadRecords()
  loadEmployees()
  loadMonthStats()
  loadStats()
})
</script>

<style scoped>
.attendance-page {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filter-bar {
  display: flex;
  align-items: center;
}

.check-card {
  margin-bottom: 20px;
}

.check-content {
  display: flex;
  align-items: center;
  gap: 20px;
}

.check-info {
  flex: 1;
}

.check-title {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 8px;
}

.check-time {
  font-size: 24px;
  font-weight: bold;
  color: #409EFF;
}

.check-status {
  margin-top: 8px;
}

.stats-content {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
}

.stats-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stats-label {
  font-size: 14px;
  color: #909399;
}

.stats-value {
  font-size: 20px;
  font-weight: bold;
  color: #409EFF;
}

.stats-value.late {
  color: #E6A23C;
}

.stats-value.early {
  color: #F56C6C;
}

.stats-value.absent {
  color: #909399;
}

.week-day {
  font-size: 12px;
  color: #909399;
}
</style>
