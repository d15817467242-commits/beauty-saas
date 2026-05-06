<template>
  <div class="appointment-calendar-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <el-radio-group v-model="viewMode" @change="handleViewModeChange">
              <el-radio-button value="day">日视图</el-radio-button>
              <el-radio-button value="week">周视图</el-radio-button>
              <el-radio-button value="month">月视图</el-radio-button>
            </el-radio-group>
            <div class="date-nav">
              <el-button :icon="ArrowLeft" circle @click="navigateDate(-1)" />
              <span class="current-date">{{ currentDateDisplay }}</span>
              <el-button :icon="ArrowRight" circle @click="navigateDate(1)" />
              <el-button type="primary" plain @click="goToToday">今天</el-button>
            </div>
          </div>
          <div class="header-right">
            <el-select v-model="filterEmployeeId" placeholder="全部员工" clearable @change="loadAppointments" style="width: 150px;">
              <el-option v-for="e in employeeList" :key="e.id" :label="e.name" :value="e.id" />
            </el-select>
            <el-button type="primary" @click="handleAdd">新增预约</el-button>
          </div>
        </div>
      </template>

      <!-- 日视图 -->
      <div v-if="viewMode === 'day'" class="day-view">
        <div class="time-grid">
          <div class="time-column">
            <div v-for="hour in 24" :key="hour" class="time-slot">
              {{ String(hour - 1).padStart(2, '0') }}:00
            </div>
          </div>
          <div class="appointment-column" ref="dayColumnRef">
            <div v-for="hour in 24" :key="hour" class="hour-slot" @click="handleTimeSlotClick(hour - 1)">
              <!-- 预约卡片 -->
              <div
                v-for="apt in getAppointmentsByHour(hour - 1)"
                :key="apt.id"
                class="appointment-card"
                :class="`status-${apt.status}`"
                :style="getAppointmentStyle(apt)"
                draggable="true"
                @dragstart="handleDragStart($event, apt)"
                @click.stop="handleAppointmentClick(apt)"
              >
                <div class="apt-time">{{ apt.startTime }} - {{ apt.endTime }}</div>
                <div class="apt-customer">{{ apt.member?.name || apt.guestName || '散客' }}</div>
                <div class="apt-service">{{ apt.service?.name }}</div>
                <div class="apt-employee">{{ apt.employee?.name }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 周视图 -->
      <div v-if="viewMode === 'week'" class="week-view">
        <div class="week-header">
          <div class="time-header"></div>
          <div v-for="day in weekDays" :key="day.date" class="day-header" :class="{ 'is-today': isToday(day.date) }">
            <div class="day-name">{{ day.name }}</div>
            <div class="day-date">{{ day.dayNum }}</div>
          </div>
        </div>
        <div class="week-body">
          <div class="time-column">
            <div v-for="hour in 24" :key="hour" class="time-slot">
              {{ String(hour - 1).padStart(2, '0') }}:00
            </div>
          </div>
          <div class="days-container">
            <div v-for="day in weekDays" :key="day.date" class="day-column" @click="handleDayColumnClick(day.date)">
              <div v-for="hour in 24" :key="hour" class="hour-slot">
                <div
                  v-for="apt in getAppointmentsByDayAndHour(day.date, hour - 1)"
                  :key="apt.id"
                  class="appointment-card mini"
                  :class="`status-${apt.status}`"
                  draggable="true"
                  @dragstart="handleDragStart($event, apt)"
                  @click.stop="handleAppointmentClick(apt)"
                >
                  <div class="apt-time">{{ apt.startTime }}</div>
                  <div class="apt-customer">{{ apt.member?.name || apt.guestName || '散客' }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 月视图 -->
      <div v-if="viewMode === 'month'" class="month-view">
        <div class="month-header">
          <div v-for="day in ['周日', '周一', '周二', '周三', '周四', '周五', '周六']" :key="day" class="weekday-header">
            {{ day }}
          </div>
        </div>
        <div class="month-body">
          <div v-for="(week, weekIndex) in monthWeeks" :key="weekIndex" class="week-row">
            <div
              v-for="day in week"
              :key="day.date"
              class="day-cell"
              :class="{ 'is-today': isToday(day.date), 'is-other-month': day.isOtherMonth }"
              @click="handleMonthDayClick(day.date)"
              @dragover.prevent
              @drop="handleDrop($event, day.date)"
            >
              <div class="day-number">{{ day.dayNum }}</div>
              <div class="day-appointments">
                <div
                  v-for="apt in getAppointmentsByDate(day.date).slice(0, 3)"
                  :key="apt.id"
                  class="appointment-dot"
                  :class="`status-${apt.status}`"
                  draggable="true"
                  @dragstart="handleDragStart($event, apt)"
                  @click.stop="handleAppointmentClick(apt)"
                >
                  <span class="apt-time-mini">{{ apt.startTime }}</span>
                  <span class="apt-customer-mini">{{ apt.member?.name || apt.guestName || '散客' }}</span>
                </div>
                <div v-if="getAppointmentsByDate(day.date).length > 3" class="more-appointments">
                  +{{ getAppointmentsByDate(day.date).length - 3 }} 更多
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 新增/编辑预约对话框 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑预约' : '新增预约'" width="600px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="客户类型">
          <el-radio-group v-model="form.customerType">
            <el-radio value="member">会员</el-radio>
            <el-radio value="guest">散客</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item label="会员" v-if="form.customerType === 'member'">
          <el-select v-model="form.memberId" placeholder="选择会员" filterable style="width: 100%">
            <el-option 
              v-for="m in memberList" 
              :key="m.id" 
              :label="`${m.name} (${m.phone})`" 
              :value="m.id" 
            />
          </el-select>
        </el-form-item>

        <template v-if="form.customerType === 'guest'">
          <el-form-item label="姓名">
            <el-input v-model="form.guestName" placeholder="请输入姓名" />
          </el-form-item>
          <el-form-item label="电话">
            <el-input v-model="form.guestPhone" placeholder="请输入电话" />
          </el-form-item>
        </template>

        <el-form-item label="服务项目" required>
          <el-select v-model="form.serviceId" placeholder="选择服务项目" style="width: 100%" @change="handleServiceChange">
            <el-option 
              v-for="s in serviceList" 
              :key="s.id" 
              :label="`${s.name} - ¥${s.price}`" 
              :value="s.id" 
            />
          </el-select>
        </el-form-item>

        <el-form-item label="服务员工" required>
          <el-select v-model="form.employeeId" placeholder="选择员工" style="width: 100%">
            <el-option 
              v-for="e in employeeList" 
              :key="e.id" 
              :label="`${e.name} (${e.position || '员工'})`" 
              :value="e.id" 
            />
          </el-select>
        </el-form-item>

        <el-form-item label="预约日期" required>
          <el-date-picker v-model="form.appointmentDate" type="date" placeholder="选择日期" style="width: 100%" />
        </el-form-item>

        <el-form-item label="预约时间" required>
          <el-col :span="11">
            <el-time-select v-model="form.startTime" placeholder="开始时间" :max-time="form.endTime" />
          </el-col>
          <el-col :span="2" style="text-align: center">-</el-col>
          <el-col :span="11">
            <el-time-select v-model="form.endTime" placeholder="结束时间" :min-time="form.startTime" />
          </el-col>
        </el-form-item>

        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 预约详情对话框 -->
    <el-dialog v-model="detailDialogVisible" title="预约详情" width="500px">
      <el-descriptions :column="1" border v-if="currentAppointment">
        <el-descriptions-item label="客户">{{ currentAppointment.member?.name || currentAppointment.guestName || '散客' }}</el-descriptions-item>
        <el-descriptions-item label="电话">{{ currentAppointment.member?.phone || currentAppointment.guestPhone || '-' }}</el-descriptions-item>
        <el-descriptions-item label="服务项目">{{ currentAppointment.service?.name }}</el-descriptions-item>
        <el-descriptions-item label="服务员工">{{ currentAppointment.employee?.name }}</el-descriptions-item>
        <el-descriptions-item label="预约时间">{{ currentAppointment.appointmentDate }} {{ currentAppointment.startTime }} - {{ currentAppointment.endTime }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="statusMap[currentAppointment.status]?.type">
            {{ statusMap[currentAppointment.status]?.label }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="备注">{{ currentAppointment.remark || '-' }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="handleEdit(currentAppointment)">编辑</el-button>
        <el-button type="success" @click="handleConfirm(currentAppointment)" v-if="currentAppointment?.status === 'pending'">确认</el-button>
        <el-button type="danger" @click="handleCancel(currentAppointment)" v-if="currentAppointment?.status !== 'completed' && currentAppointment?.status !== 'cancelled'">取消</el-button>
      </template>
    </el-dialog>

    <!-- 取消原因对话框 -->
    <el-dialog v-model="cancelDialogVisible" title="取消预约" width="400px">
      <el-form :model="cancelForm" label-width="80px">
        <el-form-item label="取消原因" required>
          <el-input v-model="cancelForm.cancelReason" type="textarea" rows="3" placeholder="请输入取消原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="cancelDialogVisible = false">取消</el-button>
        <el-button type="danger" :loading="cancelSubmitting" @click="handleCancelSubmit">确认取消</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, ArrowRight } from '@element-plus/icons-vue'

const API_BASE = 'http://localhost:3000/api'
const token = localStorage.getItem('token') || ''

const statusMap: Record<string, { label: string; type: string }> = {
  pending: { label: '待确认', type: 'warning' },
  confirmed: { label: '已确认', type: 'primary' },
  completed: { label: '已完成', type: 'success' },
  cancelled: { label: '已取消', type: 'info' },
  no_show: { label: '未到店', type: 'danger' },
}

const viewMode = ref<'day' | 'week' | 'month'>('week')
const currentDate = ref(new Date())
const loading = ref(false)
const submitting = ref(false)
const cancelSubmitting = ref(false)
const appointmentList = ref<any[]>([])
const memberList = ref<any[]>([])
const employeeList = ref<any[]>([])
const serviceList = ref<any[]>([])
const filterEmployeeId = ref('')

const dialogVisible = ref(false)
const detailDialogVisible = ref(false)
const cancelDialogVisible = ref(false)
const isEdit = ref(false)
const editId = ref('')
const currentAppointment = ref<any>(null)
const currentCancelId = ref('')
const draggedAppointment = ref<any>(null)

const form = ref({
  customerType: 'member',
  memberId: '',
  guestName: '',
  guestPhone: '',
  serviceId: '',
  employeeId: '',
  appointmentDate: '',
  startTime: '',
  endTime: '',
  remark: '',
})

const cancelForm = ref({
  cancelReason: '',
})

// 计算当前日期显示
const currentDateDisplay = computed(() => {
  const d = currentDate.value
  if (viewMode.value === 'day') {
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
  } else if (viewMode.value === 'week') {
    const weekStart = getWeekStart(d)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)
    return `${weekStart.getMonth() + 1}月${weekStart.getDate()}日 - ${weekEnd.getMonth() + 1}月${weekEnd.getDate()}日`
  } else {
    return `${d.getFullYear()}年${d.getMonth() + 1}月`
  }
})

// 计算周视图的天数
const weekDays = computed(() => {
  const weekStart = getWeekStart(currentDate.value)
  const days = []
  const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStart)
    date.setDate(date.getDate() + i)
    days.push({
      date: formatDateStr(date),
      name: dayNames[date.getDay()],
      dayNum: date.getDate(),
    })
  }
  return days
})

// 计算月视图的周
const monthWeeks = computed(() => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const weeks = []
  
  let currentWeek: any[] = []
  let currentDateIter = new Date(firstDay)
  
  // 填充月初空白
  for (let i = 0; i < firstDay.getDay(); i++) {
    const prevDate = new Date(firstDay)
    prevDate.setDate(prevDate.getDate() - (firstDay.getDay() - i))
    currentWeek.push({
      date: formatDateStr(prevDate),
      dayNum: prevDate.getDate(),
      isOtherMonth: true,
    })
  }
  
  // 填充本月日期
  while (currentDateIter <= lastDay) {
    currentWeek.push({
      date: formatDateStr(currentDateIter),
      dayNum: currentDateIter.getDate(),
      isOtherMonth: false,
    })
    
    if (currentWeek.length === 7) {
      weeks.push(currentWeek)
      currentWeek = []
    }
    currentDateIter.setDate(currentDateIter.getDate() + 1)
  }
  
  // 填充月末空白
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      const nextDate = new Date(lastDay)
      nextDate.setDate(nextDate.getDate() + (currentWeek.length - currentWeek.length + 1))
      currentWeek.push({
        date: formatDateStr(nextDate),
        dayNum: nextDate.getDate(),
        isOtherMonth: true,
      })
    }
    weeks.push(currentWeek)
  }
  
  return weeks
})

function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  d.setDate(d.getDate() - day)
  return d
}

function formatDateStr(date: Date): string {
  return date.toISOString().split('T')[0]
}

function isToday(dateStr: string): boolean {
  return dateStr === formatDateStr(new Date())
}

function navigateDate(direction: number) {
  const d = new Date(currentDate.value)
  if (viewMode.value === 'day') {
    d.setDate(d.getDate() + direction)
  } else if (viewMode.value === 'week') {
    d.setDate(d.getDate() + direction * 7)
  } else {
    d.setMonth(d.getMonth() + direction)
  }
  currentDate.value = d
  loadAppointments()
}

function goToToday() {
  currentDate.value = new Date()
  loadAppointments()
}

function handleViewModeChange() {
  loadAppointments()
}

// 获取指定日期的预约
function getAppointmentsByDate(dateStr: string) {
  return appointmentList.value.filter(apt => apt.appointmentDate === dateStr)
}

// 获取指定日期和小时的预约
function getAppointmentsByDayAndHour(dateStr: string, hour: number) {
  return appointmentList.value.filter(apt => {
    if (apt.appointmentDate !== dateStr) return false
    const startHour = parseInt(apt.startTime.split(':')[0])
    return startHour === hour
  })
}

// 获取指定小时的预约（日视图）
function getAppointmentsByHour(hour: number) {
  const dateStr = formatDateStr(currentDate.value)
  return appointmentList.value.filter(apt => {
    if (apt.appointmentDate !== dateStr) return false
    const startHour = parseInt(apt.startTime.split(':')[0])
    return startHour === hour
  })
}

// 计算预约卡片样式
function getAppointmentStyle(apt: any) {
  const startHour = parseInt(apt.startTime.split(':')[0])
  const startMin = parseInt(apt.startTime.split(':')[1])
  const endHour = parseInt(apt.endTime.split(':')[0])
  const endMin = parseInt(apt.endTime.split(':')[1])
  
  const top = (startHour + startMin / 60) * 60
  const height = ((endHour - startHour) + (endMin - startMin) / 60) * 60
  
  return {
    top: `${top}px`,
    height: `${height}px`,
  }
}

// 拖拽相关
function handleDragStart(event: DragEvent, apt: any) {
  draggedAppointment.value = apt
  event.dataTransfer?.setData('text/plain', apt.id)
}

async function handleDrop(event: DragEvent, newDate: string) {
  if (!draggedAppointment.value) return
  
  const apt = draggedAppointment.value
  const oldDate = apt.appointmentDate
  
  if (oldDate !== newDate) {
    try {
      const res = await fetch(`${API_BASE}/appointments/${apt.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ appointmentDate: newDate })
      })
      
      if (res.ok) {
        ElMessage.success('预约已移动')
        loadAppointments()
      }
    } catch (e) {
      ElMessage.error('移动失败')
    }
  }
  
  draggedAppointment.value = null
}

// 点击时间槽
function handleTimeSlotClick(hour: number) {
  const startTime = `${String(hour).padStart(2, '0')}:00`
  const endTime = `${String(hour + 1).padStart(2, '0')}:00`
  
  isEdit.value = false
  resetForm()
  form.value.appointmentDate = formatDateStr(currentDate.value)
  form.value.startTime = startTime
  form.value.endTime = endTime
  dialogVisible.value = true
}

function handleDayColumnClick(dateStr: string) {
  currentDate.value = new Date(dateStr)
  viewMode.value = 'day'
}

function handleMonthDayClick(dateStr: string) {
  currentDate.value = new Date(dateStr)
  viewMode.value = 'day'
}

function handleAppointmentClick(apt: any) {
  currentAppointment.value = apt
  detailDialogVisible.value = true
}

const resetForm = () => {
  form.value = {
    customerType: 'member',
    memberId: '',
    guestName: '',
    guestPhone: '',
    serviceId: '',
    employeeId: '',
    appointmentDate: '',
    startTime: '',
    endTime: '',
    remark: '',
  }
}

const loadAppointments = async () => {
  loading.value = true
  try {
    const params = new URLSearchParams()
    
    if (viewMode.value === 'day') {
      params.append('date', formatDateStr(currentDate.value))
    } else if (viewMode.value === 'week') {
      const weekStart = getWeekStart(currentDate.value)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 6)
      params.append('startDate', formatDateStr(weekStart))
      params.append('endDate', formatDateStr(weekEnd))
    } else {
      const year = currentDate.value.getFullYear()
      const month = currentDate.value.getMonth()
      params.append('startDate', formatDateStr(new Date(year, month, 1)))
      params.append('endDate', formatDateStr(new Date(year, month + 1, 0)))
    }
    
    if (filterEmployeeId.value) {
      params.append('employeeId', filterEmployeeId.value)
    }

    const res = await fetch(`${API_BASE}/appointments?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    appointmentList.value = await res.json()
  } catch (e) {
    ElMessage.error('加载预约失败')
  } finally {
    loading.value = false
  }
}

const loadMembers = async () => {
  try {
    const res = await fetch(`${API_BASE}/members`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    memberList.value = await res.json()
  } catch (e) {}
}

const loadEmployees = async () => {
  try {
    const res = await fetch(`${API_BASE}/employees`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    employeeList.value = await res.json()
  } catch (e) {}
}

const loadServices = async () => {
  try {
    const res = await fetch(`${API_BASE}/services`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    serviceList.value = await res.json()
  } catch (e) {}
}

const handleServiceChange = (serviceId: string) => {
  const service = serviceList.value.find(s => s.id === serviceId)
  if (service?.duration) {
    const start = form.value.startTime
    if (start) {
      const [h, m] = start.split(':').map(Number)
      const endH = h + Math.floor((m + service.duration) / 60)
      const endM = (m + service.duration) % 60
      form.value.endTime = `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`
    }
  }
}

const handleAdd = () => {
  isEdit.value = false
  resetForm()
  form.value.appointmentDate = formatDateStr(currentDate.value)
  dialogVisible.value = true
}

const handleEdit = (row: any) => {
  isEdit.value = true
  editId.value = row.id
  form.value = {
    customerType: row.memberId ? 'member' : 'guest',
    memberId: row.memberId || '',
    guestName: row.guestName || '',
    guestPhone: row.guestPhone || '',
    serviceId: row.serviceId,
    employeeId: row.employeeId,
    appointmentDate: row.appointmentDate,
    startTime: row.startTime,
    endTime: row.endTime,
    remark: row.remark || '',
  }
  detailDialogVisible.value = false
  dialogVisible.value = true
}

const handleConfirm = async (row: any) => {
  try {
    const res = await fetch(`${API_BASE}/appointments/${row.id}/confirm`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    })
    if (res.ok) {
      ElMessage.success('已确认')
      detailDialogVisible.value = false
      loadAppointments()
    }
  } catch (e) {
    ElMessage.error('操作失败')
  }
}

const handleCancel = (row: any) => {
  currentCancelId.value = row.id
  cancelForm.value = { cancelReason: '' }
  detailDialogVisible.value = false
  cancelDialogVisible.value = true
}

const handleCancelSubmit = async () => {
  if (!cancelForm.value.cancelReason) {
    ElMessage.warning('请输入取消原因')
    return
  }
  cancelSubmitting.value = true
  try {
    const res = await fetch(`${API_BASE}/appointments/${currentCancelId.value}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(cancelForm.value)
    })
    if (res.ok) {
      ElMessage.success('已取消')
      cancelDialogVisible.value = false
      loadAppointments()
    }
  } catch (e) {
    ElMessage.error('操作失败')
  } finally {
    cancelSubmitting.value = false
  }
}

const handleSubmit = async () => {
  if (!form.value.serviceId || !form.value.employeeId || !form.value.appointmentDate || !form.value.startTime || !form.value.endTime) {
    ElMessage.warning('请填写完整信息')
    return
  }
  submitting.value = true
  try {
    const data: any = {
      serviceId: form.value.serviceId,
      employeeId: form.value.employeeId,
      appointmentDate: form.value.appointmentDate,
      startTime: form.value.startTime,
      endTime: form.value.endTime,
      remark: form.value.remark,
    }
    
    if (form.value.customerType === 'member') {
      data.memberId = form.value.memberId
    } else {
      data.guestName = form.value.guestName
      data.guestPhone = form.value.guestPhone
    }

    const url = isEdit.value ? `${API_BASE}/appointments/${editId.value}` : `${API_BASE}/appointments`
    const method = isEdit.value ? 'PATCH' : 'POST'
    
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(data)
    })
    
    if (res.ok) {
      ElMessage.success(isEdit.value ? '修改成功' : '预约成功')
      dialogVisible.value = false
      loadAppointments()
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
  loadAppointments()
  loadMembers()
  loadEmployees()
  loadServices()
})
</script>

<style scoped>
.appointment-calendar-page {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.date-nav {
  display: flex;
  align-items: center;
  gap: 10px;
}

.current-date {
  font-size: 16px;
  font-weight: 500;
  min-width: 180px;
  text-align: center;
}

.header-right {
  display: flex;
  gap: 10px;
}

/* 日视图 */
.day-view {
  min-height: 600px;
}

.time-grid {
  display: flex;
  position: relative;
}

.time-column {
  width: 60px;
  flex-shrink: 0;
}

.time-slot {
  height: 60px;
  font-size: 12px;
  color: #909399;
  text-align: right;
  padding-right: 10px;
  border-bottom: 1px solid #ebeef5;
}

.appointment-column {
  flex: 1;
  position: relative;
}

.hour-slot {
  height: 60px;
  border-bottom: 1px solid #ebeef5;
  position: relative;
  cursor: pointer;
}

.hour-slot:hover {
  background-color: #f5f7fa;
}

.appointment-card {
  position: absolute;
  left: 5px;
  right: 5px;
  background: #409eff;
  border-radius: 4px;
  padding: 5px 8px;
  color: white;
  cursor: pointer;
  overflow: hidden;
  z-index: 10;
  transition: transform 0.1s;
}

.appointment-card:hover {
  transform: scale(1.02);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.appointment-card.status-pending {
  background: #e6a23c;
}

.appointment-card.status-confirmed {
  background: #409eff;
}

.appointment-card.status-completed {
  background: #67c23a;
}

.appointment-card.status-cancelled {
  background: #909399;
}

.appointment-card.mini {
  font-size: 12px;
  padding: 2px 5px;
}

.apt-time {
  font-size: 11px;
  opacity: 0.9;
}

.apt-customer {
  font-weight: 500;
  font-size: 13px;
}

.apt-service {
  font-size: 12px;
  opacity: 0.9;
}

.apt-employee {
  font-size: 11px;
  opacity: 0.8;
}

/* 周视图 */
.week-view {
  min-height: 600px;
}

.week-header {
  display: flex;
  border-bottom: 1px solid #ebeef5;
}

.time-header {
  width: 60px;
  flex-shrink: 0;
}

.day-header {
  flex: 1;
  text-align: center;
  padding: 10px;
  border-left: 1px solid #ebeef5;
}

.day-header.is-today {
  background-color: #ecf5ff;
}

.day-name {
  font-size: 12px;
  color: #909399;
}

.day-date {
  font-size: 20px;
  font-weight: 500;
}

.week-body {
  display: flex;
  max-height: 500px;
  overflow-y: auto;
}

.days-container {
  display: flex;
  flex: 1;
}

.day-column {
  flex: 1;
  border-left: 1px solid #ebeef5;
}

.day-column .hour-slot {
  height: 60px;
  border-bottom: 1px solid #ebeef5;
  position: relative;
  cursor: pointer;
}

.day-column .hour-slot:hover {
  background-color: #f5f7fa;
}

/* 月视图 */
.month-view {
  min-height: 600px;
}

.month-header {
  display: flex;
  border-bottom: 1px solid #ebeef5;
}

.weekday-header {
  flex: 1;
  text-align: center;
  padding: 10px;
  font-weight: 500;
  background-color: #f5f7fa;
}

.week-row {
  display: flex;
  border-bottom: 1px solid #ebeef5;
}

.day-cell {
  flex: 1;
  min-height: 100px;
  padding: 5px;
  border-right: 1px solid #ebeef5;
  cursor: pointer;
}

.day-cell:hover {
  background-color: #f5f7fa;
}

.day-cell.is-today {
  background-color: #ecf5ff;
}

.day-cell.is-other-month {
  background-color: #fafafa;
}

.day-cell.is-other-month .day-number {
  color: #c0c4cc;
}

.day-number {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 5px;
}

.day-appointments {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.appointment-dot {
  font-size: 11px;
  padding: 2px 5px;
  border-radius: 3px;
  color: white;
  cursor: pointer;
  display: flex;
  gap: 5px;
}

.appointment-dot.status-pending {
  background-color: #e6a23c;
}

.appointment-dot.status-confirmed {
  background-color: #409eff;
}

.appointment-dot.status-completed {
  background-color: #67c23a;
}

.appointment-dot.status-cancelled {
  background-color: #909399;
}

.apt-time-mini {
  font-weight: 500;
}

.apt-customer-mini {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.more-appointments {
  font-size: 11px;
  color: #409eff;
  cursor: pointer;
}
</style>
