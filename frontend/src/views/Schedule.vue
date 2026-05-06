<template>
  <div class="schedule-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>排班管理</span>
          <div>
            <el-button type="primary" @click="handleBatchAdd">批量排班</el-button>
            <el-button @click="handleAdd">单个排班</el-button>
          </div>
        </div>
      </template>

      <!-- 日期范围选择 -->
      <div class="filter-bar">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          @change="loadSchedules"
        />
        <el-select v-model="filterEmployeeId" placeholder="选择员工" clearable @change="loadSchedules" style="margin-left: 10px; width: 150px;">
          <el-option v-for="e in employeeList" :key="e.id" :label="e.name" :value="e.id" />
        </el-select>
      </div>

      <!-- 排班表格 -->
      <el-table :data="scheduleList" v-loading="loading" stripe>
        <el-table-column prop="date" label="日期" width="120">
          <template #default="{ row }">
            {{ formatDate(row.date) }}
            <div class="week-day">{{ getWeekDay(row.date) }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="employee.name" label="员工" width="100" />
        <el-table-column prop="employee.position" label="职位" width="100" />
        <el-table-column prop="type" label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="typeMap[row.type]?.type">
              {{ typeMap[row.type]?.label || row.type }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="工作时间" width="150">
          <template #default="{ row }">
            <span v-if="row.type === 'work'">{{ row.startTime || '09:00' }} - {{ row.endTime || '18:00' }}</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" show-overflow-tooltip />
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 单个排班对话框 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑排班' : '新增排班'" width="500px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="员工" required>
          <el-select v-model="form.employeeId" placeholder="选择员工" style="width: 100%" :disabled="isEdit">
            <el-option v-for="e in employeeList" :key="e.id" :label="e.name" :value="e.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="日期" required>
          <el-date-picker v-model="form.date" type="date" placeholder="选择日期" style="width: 100%" :disabled="isEdit" />
        </el-form-item>
        <el-form-item label="类型" required>
          <el-radio-group v-model="form.type">
            <el-radio value="work">上班</el-radio>
            <el-radio value="rest">休息</el-radio>
            <el-radio value="leave">请假</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="上班时间" v-if="form.type === 'work'">
          <el-col :span="11">
            <el-time-select v-model="form.startTime" placeholder="上班时间" />
          </el-col>
          <el-col :span="2" style="text-align: center">-</el-col>
          <el-col :span="11">
            <el-time-select v-model="form.endTime" placeholder="下班时间" />
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

    <!-- 批量排班对话框 -->
    <el-dialog v-model="batchDialogVisible" title="批量排班" width="600px">
      <el-form :model="batchForm" label-width="100px">
        <el-form-item label="员工" required>
          <el-select v-model="batchForm.employeeIds" multiple placeholder="选择员工" style="width: 100%">
            <el-option v-for="e in employeeList" :key="e.id" :label="e.name" :value="e.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="日期范围" required>
          <el-date-picker v-model="batchForm.dateRange" type="daterange" style="width: 100%" />
        </el-form-item>
        <el-form-item label="类型">
          <el-radio-group v-model="batchForm.type">
            <el-radio value="work">上班</el-radio>
            <el-radio value="rest">休息</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="工作时间" v-if="batchForm.type === 'work'">
          <el-col :span="11">
            <el-time-select v-model="batchForm.startTime" placeholder="上班时间" />
          </el-col>
          <el-col :span="2" style="text-align: center">-</el-col>
          <el-col :span="11">
            <el-time-select v-model="batchForm.endTime" placeholder="下班时间" />
          </el-col>
        </el-form-item>
        <el-form-item label="休息日">
          <el-checkbox-group v-model="batchForm.restDays">
            <el-checkbox label="0">周日</el-checkbox>
            <el-checkbox label="1">周一</el-checkbox>
            <el-checkbox label="2">周二</el-checkbox>
            <el-checkbox label="3">周三</el-checkbox>
            <el-checkbox label="4">周四</el-checkbox>
            <el-checkbox label="5">周五</el-checkbox>
            <el-checkbox label="6">周六</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="batchDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="batchSubmitting" @click="handleBatchSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const API_BASE = 'http://localhost:3000/api'
const token = localStorage.getItem('token') || ''

const typeMap: Record<string, { label: string; type: string }> = {
  work: { label: '上班', type: 'success' },
  rest: { label: '休息', type: 'info' },
  leave: { label: '请假', type: 'warning' },
}

const loading = ref(false)
const submitting = ref(false)
const batchSubmitting = ref(false)
const scheduleList = ref<any[]>([])
const employeeList = ref<any[]>([])
const dateRange = ref<[Date, Date] | null>(null)
const filterEmployeeId = ref('')
const dialogVisible = ref(false)
const batchDialogVisible = ref(false)
const isEdit = ref(false)
const editId = ref('')

const form = ref({
  employeeId: '',
  date: '',
  type: 'work',
  startTime: '09:00',
  endTime: '18:00',
  remark: '',
})

const batchForm = ref({
  employeeIds: [] as string[],
  dateRange: null as [Date, Date] | null,
  type: 'work',
  startTime: '09:00',
  endTime: '18:00',
  restDays: ['0', '6'] as string[],
})

const resetForm = () => {
  form.value = {
    employeeId: '',
    date: '',
    type: 'work',
    startTime: '09:00',
    endTime: '18:00',
    remark: '',
  }
}

const formatDate = (date: string | Date) => {
  return new Date(date).toLocaleDateString()
}

const getWeekDay = (date: string | Date) => {
  const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return days[new Date(date).getDay()]
}

const loadSchedules = async () => {
  loading.value = true
  try {
    const params = new URLSearchParams()
    
    if (dateRange.value) {
      params.append('startDate', new Date(dateRange.value[0]).toISOString().split('T')[0])
      params.append('endDate', new Date(dateRange.value[1]).toISOString().split('T')[0])
    } else {
      // 默认显示本周
      const today = new Date()
      const start = new Date(today)
      start.setDate(start.getDate() - start.getDay())
      const end = new Date(start)
      end.setDate(end.getDate() + 6)
      params.append('startDate', start.toISOString().split('T')[0])
      params.append('endDate', end.toISOString().split('T')[0])
    }
    
    if (filterEmployeeId.value) {
      params.append('employeeId', filterEmployeeId.value)
    }

    const res = await fetch(`${API_BASE}/appointments/schedules?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const data = await res.json()
    scheduleList.value = data.data || data.list || data.records || data.items || data
  } catch (e) {
    ElMessage.error('加载排班失败')
  } finally {
    loading.value = false
  }
}

const loadEmployees = async () => {
  try {
    const res = await fetch(`${API_BASE}/employees`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const data = await res.json()
    employeeList.value = data.data || data.list || data.records || data.items || data
  } catch (e) {}
}

const handleAdd = () => {
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
}

const handleBatchAdd = () => {
  batchForm.value = {
    employeeIds: [],
    dateRange: null,
    type: 'work',
    startTime: '09:00',
    endTime: '18:00',
    restDays: ['0', '6'],
  }
  batchDialogVisible.value = true
}

const handleEdit = (row: any) => {
  isEdit.value = true
  editId.value = row.id
  form.value = {
    employeeId: row.employeeId,
    date: new Date(row.date).toISOString().split('T')[0],
    type: row.type,
    startTime: row.startTime || '09:00',
    endTime: row.endTime || '18:00',
    remark: row.remark || '',
  }
  dialogVisible.value = true
}

const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm('确定要删除该排班记录吗？', '提示', { type: 'warning' })
    const res = await fetch(`${API_BASE}/appointments/schedules/${row.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    })
    if (res.ok) {
      ElMessage.success('删除成功')
      loadSchedules()
    }
  } catch (e) {}
}

const handleSubmit = async () => {
  if (!form.value.employeeId || !form.value.date) {
    ElMessage.warning('请填写完整信息')
    return
  }
  submitting.value = true
  try {
    const url = isEdit.value 
      ? `${API_BASE}/appointments/schedules/${editId.value}` 
      : `${API_BASE}/appointments/schedules`
    const method = isEdit.value ? 'PATCH' : 'POST'
    
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        ...form.value,
        date: new Date(form.value.date).toISOString().split('T')[0],
      })
    })
    
    if (res.ok) {
      ElMessage.success(isEdit.value ? '修改成功' : '添加成功')
      dialogVisible.value = false
      loadSchedules()
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

const handleBatchSubmit = async () => {
  if (!batchForm.value.employeeIds.length || !batchForm.value.dateRange) {
    ElMessage.warning('请选择员工和日期范围')
    return
  }
  batchSubmitting.value = true
  try {
    const res = await fetch(`${API_BASE}/appointments/schedules/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        employeeIds: batchForm.value.employeeIds,
        startDate: new Date(batchForm.value.dateRange[0]).toISOString().split('T')[0],
        endDate: new Date(batchForm.value.dateRange[1]).toISOString().split('T')[0],
        type: batchForm.value.type,
        startTime: batchForm.value.startTime,
        endTime: batchForm.value.endTime,
        restDays: batchForm.value.restDays,
      })
    })
    
    if (res.ok) {
      const result = await res.json()
      ElMessage.success(`成功创建 ${result.length} 条排班记录`)
      batchDialogVisible.value = false
      loadSchedules()
    } else {
      const err = await res.json()
      ElMessage.error(err.message || '操作失败')
    }
  } catch (e) {
    ElMessage.error('网络错误')
  } finally {
    batchSubmitting.value = false
  }
}

onMounted(() => {
  loadSchedules()
  loadEmployees()
})
</script>

<style scoped>
.schedule-page {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filter-bar {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
}

.week-day {
  font-size: 12px;
  color: #909399;
}
</style>
