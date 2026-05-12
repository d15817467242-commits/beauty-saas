<template>
  <div class="appointment-page">
    <el-row :gutter="20">
      <!-- 左侧日历 -->
      <el-col :span="6">
        <el-card>
          <template #header>
            <span>选择日期</span>
          </template>
          <el-calendar v-model="selectedDate" @click="handleDateClick" />
        </el-card>
      </el-col>

      <!-- 右侧预约列表 -->
      <el-col :span="18">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>{{ selectedDateStr }} 的预约</span>
              <el-button type="primary" @click="handleAdd" v-if="userStore.canCreate">新增预约</el-button>
            </div>
          </template>

          <el-table :data="appointmentList" v-loading="loading" stripe>
            <el-table-column prop="startTime" label="时间" width="100">
              <template #default="{ row }">
                {{ row.startTime }} - {{ row.endTime }}
              </template>
            </el-table-column>
            <el-table-column label="客户" width="120">
              <template #default="{ row }">
                {{ row.member?.name || row.guestName || '散客' }}
                <div v-if="row.member?.phone || row.guestPhone" class="phone">
                  {{ row.member?.phone || row.guestPhone }}
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="service.name" label="服务项目" width="150" />
            <el-table-column prop="employee.name" label="服务员工" width="100" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="statusMap[row.status]?.type">
                  {{ statusMap[row.status]?.label || row.status }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="remark" label="备注" show-overflow-tooltip />
            <el-table-column label="操作" width="200">
              <template #default="{ row }">
                <el-button size="small" @click="handleEdit(row)" :disabled="row.status === 'completed' || row.status === 'cancelled'" v-if="userStore.canEdit">编辑</el-button>
                <el-button size="small" type="success" @click="handleConfirm(row)" v-if="row.status === 'pending'">确认</el-button>
                <el-button size="small" type="primary" @click="handleComplete(row)" v-if="row.status === 'confirmed'">完成</el-button>
                <el-button size="small" type="danger" @click="handleCancel(row)" v-if="row.status !== 'completed' && row.status !== 'cancelled'">取消</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

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
import request from '@/utils/request'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

const statusMap: Record<string, { label: string; type: string }> = {
  pending: { label: '待确认', type: 'warning' },
  confirmed: { label: '已确认', type: 'primary' },
  completed: { label: '已完成', type: 'success' },
  cancelled: { label: '已取消', type: 'info' },
  no_show: { label: '未到店', type: 'danger' },
}

const loading = ref(false)
const submitting = ref(false)
const cancelSubmitting = ref(false)
const selectedDate = ref(new Date())
const appointmentList = ref<any[]>([])
const memberList = ref<any[]>([])
const employeeList = ref<any[]>([])
const serviceList = ref<any[]>([])
const dialogVisible = ref(false)
const cancelDialogVisible = ref(false)
const isEdit = ref(false)
const editId = ref('')
const currentCancelId = ref('')

const selectedDateStr = computed(() => {
  return new Date(selectedDate.value).toLocaleDateString()
})

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
    const date = new Date(selectedDate.value).toISOString().split('T')[0]
    appointmentList.value = await request.get('/appointments', { params: { date } })
  } catch (e) {
    ElMessage.error('加载预约失败')
  } finally {
    loading.value = false
  }
}

const loadMembers = async () => {
  try {
    memberList.value = await request.get('/members')
  } catch (e) {}
}

const loadEmployees = async () => {
  try {
    employeeList.value = await request.get('/employees')
  } catch (e) {}
}

const loadServices = async () => {
  try {
    serviceList.value = await request.get('/services')
  } catch (e) {}
}

const handleDateClick = () => {
  loadAppointments()
}

const handleServiceChange = (serviceId: string) => {
  const service = serviceList.value.find(s => s.id === serviceId)
  if (service?.duration) {
    // 根据服务时长自动设置结束时间
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
  form.value.appointmentDate = new Date(selectedDate.value).toISOString().split('T')[0]
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
    appointmentDate: new Date(row.appointmentDate).toISOString().split('T')[0],
    startTime: row.startTime,
    endTime: row.endTime,
    remark: row.remark || '',
  }
  dialogVisible.value = true
}

const handleConfirm = async (row: any) => {
  try {
    await request.post(`/appointments/${row.id}/confirm`)
    ElMessage.success('已确认')
    loadAppointments()
  } catch (e) {
    ElMessage.error('操作失败')
  }
}

const handleComplete = async (row: any) => {
  try {
    await request.post(`/appointments/${row.id}/complete`)
    ElMessage.success('已完成')
    loadAppointments()
  } catch (e) {
    ElMessage.error('操作失败')
  }
}

const handleCancel = (row: any) => {
  currentCancelId.value = row.id
  cancelForm.value = { cancelReason: '' }
  cancelDialogVisible.value = true
}

const handleCancelSubmit = async () => {
  if (!cancelForm.value.cancelReason) {
    ElMessage.warning('请输入取消原因')
    return
  }
  cancelSubmitting.value = true
  try {
    await request.post(`/appointments/${currentCancelId.value}/cancel`, cancelForm.value)
    ElMessage.success('已取消')
    cancelDialogVisible.value = false
    loadAppointments()
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

    if (isEdit.value) {
      await request.patch(`/appointments/${editId.value}`, data)
      ElMessage.success('修改成功')
    } else {
      await request.post('/appointments', data)
      ElMessage.success('预约成功')
    }
    dialogVisible.value = false
    loadAppointments()
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
.appointment-page {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.phone {
  font-size: 12px;
  color: #909399;
}
</style>
