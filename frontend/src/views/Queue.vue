<template>
  <div class="queue-page">
    <el-row :gutter="20">
      <!-- 左侧：排队取号 -->
      <el-col :span="8">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>排队取号</span>
            </div>
          </template>

          <el-form :model="takeNumberForm" label-width="80px">
            <el-form-item label="客户类型">
              <el-radio-group v-model="takeNumberForm.customerType">
                <el-radio value="member">会员</el-radio>
                <el-radio value="guest">散客</el-radio>
              </el-radio-group>
            </el-form-item>

            <el-form-item label="会员" v-if="takeNumberForm.customerType === 'member'">
              <el-select v-model="takeNumberForm.memberId" placeholder="选择会员" filterable style="width: 100%">
                <el-option 
                  v-for="m in memberList" 
                  :key="m.id" 
                  :label="`${m.name} (${m.phone})`" 
                  :value="m.id" 
                />
              </el-select>
            </el-form-item>

            <template v-if="takeNumberForm.customerType === 'guest'">
              <el-form-item label="姓名">
                <el-input v-model="takeNumberForm.guestName" placeholder="请输入姓名" />
              </el-form-item>
              <el-form-item label="电话">
                <el-input v-model="takeNumberForm.guestPhone" placeholder="请输入电话" />
              </el-form-item>
            </template>

            <el-form-item label="服务项目" required>
              <el-select v-model="takeNumberForm.serviceId" placeholder="选择服务项目" style="width: 100%">
                <el-option 
                  v-for="s in serviceList" 
                  :key="s.id" 
                  :label="s.name" 
                  :value="s.id" 
                />
              </el-select>
            </el-form-item>

            <el-form-item label="预约员工">
              <el-select v-model="takeNumberForm.employeeId" placeholder="可选，不选则随机分配" clearable style="width: 100%">
                <el-option 
                  v-for="e in availableEmployees" 
                  :key="e.id" 
                  :label="e.name" 
                  :value="e.id" 
                />
              </el-select>
            </el-form-item>

            <el-form-item label="备注">
              <el-input v-model="takeNumberForm.remark" type="textarea" rows="2" placeholder="特殊需求说明" />
            </el-form-item>

            <el-form-item>
              <el-button type="primary" size="large" style="width: 100%" :loading="takingNumber" @click="handleTakeNumber">
                取号排队
              </el-button>
            </el-form-item>
          </el-form>

          <!-- 取号成功提示 -->
          <el-alert
            v-if="lastQueueNumber"
            :title="`取号成功：${lastQueueNumber}`"
            type="success"
            :closable="false"
            show-icon
            style="margin-top: 10px"
          >
            <template #default>
              <div>前面还有 <strong>{{ lastQueueWait }}</strong> 人等待</div>
              <div>预计等待时间：<strong>{{ lastQueueWaitTime }}</strong></div>
            </template>
          </el-alert>
        </el-card>

        <!-- 当前叫号信息 -->
        <el-card style="margin-top: 20px">
          <template #header>
            <div class="card-header">
              <span>当前叫号</span>
              <el-button type="primary" size="small" @click="handleCallNext">叫下一个</el-button>
            </div>
          </template>

          <div v-if="currentCalling" class="calling-info">
            <div class="queue-number-large">{{ currentCalling.queueNumber }}</div>
            <div class="customer-info">
              <div>客户：{{ currentCalling.member?.name || currentCalling.guestName || '散客' }}</div>
              <div>服务：{{ currentCalling.service?.name }}</div>
              <div>员工：{{ currentCalling.employee?.name || '待分配' }}</div>
            </div>
            <div class="calling-actions">
              <el-button type="success" @click="handleStartService(currentCalling)">开始服务</el-button>
              <el-button type="warning" @click="handleSkip(currentCalling)">跳过</el-button>
              <el-button type="danger" @click="handleCancelQueue(currentCalling)">取消</el-button>
            </div>
          </div>
          <el-empty v-else description="暂无叫号" />
        </el-card>
      </el-col>

      <!-- 右侧：排队状态 -->
      <el-col :span="16">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>排队状态</span>
              <div>
                <el-tag type="info">等待中：{{ waitingCount }}</el-tag>
                <el-tag type="warning" style="margin-left: 10px">服务中：{{ servingCount }}</el-tag>
                <el-tag type="success" style="margin-left: 10px">已完成：{{ completedCount }}</el-tag>
              </div>
            </div>
          </template>

          <el-tabs v-model="activeTab">
            <el-tab-pane label="等待队列" name="waiting">
              <el-table :data="waitingList" v-loading="loading" stripe>
                <el-table-column prop="queueNumber" label="排队号" width="100">
                  <template #default="{ row }">
                    <span class="queue-number">{{ row.queueNumber }}</span>
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
                <el-table-column prop="employee.name" label="预约员工" width="100">
                  <template #default="{ row }">
                    {{ row.employee?.name || '随机分配' }}
                  </template>
                </el-table-column>
                <el-table-column label="等待时间" width="100">
                  <template #default="{ row }">
                    {{ getWaitTime(row) }}
                  </template>
                </el-table-column>
                <el-table-column label="前面人数" width="100">
                  <template #default="{ row }">
                    {{ getWaitingPosition(row) }} 人
                  </template>
                </el-table-column>
                <el-table-column prop="remark" label="备注" show-overflow-tooltip />
                <el-table-column label="操作" width="200">
                  <template #default="{ row }">
                    <el-button size="small" type="primary" @click="handleCall(row)">叫号</el-button>
                    <el-button size="small" type="success" @click="handleStartService(row)">开始服务</el-button>
                    <el-button size="small" type="danger" @click="handleCancelQueue(row)">取消</el-button>
                  </template>
                </el-table-column>
              </el-table>
            </el-tab-pane>

            <el-tab-pane label="服务中" name="serving">
              <el-table :data="servingList" v-loading="loading" stripe>
                <el-table-column prop="queueNumber" label="排队号" width="100">
                  <template #default="{ row }">
                    <span class="queue-number">{{ row.queueNumber }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="客户" width="120">
                  <template #default="{ row }">
                    {{ row.member?.name || row.guestName || '散客' }}
                  </template>
                </el-table-column>
                <el-table-column prop="service.name" label="服务项目" width="150" />
                <el-table-column prop="employee.name" label="服务员工" width="100" />
                <el-table-column label="服务时长" width="100">
                  <template #default="{ row }">
                    {{ getServiceTime(row) }}
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="150">
                  <template #default="{ row }">
                    <el-button size="small" type="success" @click="handleCompleteService(row)">完成服务</el-button>
                  </template>
                </el-table-column>
              </el-table>
            </el-tab-pane>

            <el-tab-pane label="已完成" name="completed">
              <el-table :data="completedList" v-loading="loading" stripe>
                <el-table-column prop="queueNumber" label="排队号" width="100" />
                <el-table-column label="客户" width="120">
                  <template #default="{ row }">
                    {{ row.member?.name || row.guestName || '散客' }}
                  </template>
                </el-table-column>
                <el-table-column prop="service.name" label="服务项目" width="150" />
                <el-table-column prop="employee.name" label="服务员工" width="100" />
                <el-table-column label="完成时间" width="160">
                  <template #default="{ row }">
                    {{ formatTime(row.completedAt) }}
                  </template>
                </el-table-column>
                <el-table-column label="等待时长" width="100">
                  <template #default="{ row }">
                    {{ row.waitTime }} 分钟
                  </template>
                </el-table-column>
                <el-table-column label="服务时长" width="100">
                  <template #default="{ row }">
                    {{ row.serviceTime }} 分钟
                  </template>
                </el-table-column>
              </el-table>
            </el-tab-pane>

            <el-tab-pane label="已取消" name="cancelled">
              <el-table :data="cancelledList" v-loading="loading" stripe>
                <el-table-column prop="queueNumber" label="排队号" width="100" />
                <el-table-column label="客户" width="120">
                  <template #default="{ row }">
                    {{ row.member?.name || row.guestName || '散客' }}
                  </template>
                </el-table-column>
                <el-table-column prop="service.name" label="服务项目" width="150" />
                <el-table-column label="取消时间" width="160">
                  <template #default="{ row }">
                    {{ formatTime(row.cancelledAt) }}
                  </template>
                </el-table-column>
                <el-table-column prop="cancelReason" label="取消原因" show-overflow-tooltip />
              </el-table>
            </el-tab-pane>
          </el-tabs>
        </el-card>

        <!-- 排队统计 -->
        <el-row :gutter="20" style="margin-top: 20px">
          <el-col :span="8">
            <el-card class="stat-card">
              <div class="stat-content">
                <div class="stat-icon waiting">
                  <el-icon><Clock /></el-icon>
                </div>
                <div class="stat-info">
                  <div class="stat-value">{{ waitingCount }}</div>
                  <div class="stat-label">等待中</div>
                </div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="8">
            <el-card class="stat-card">
              <div class="stat-content">
                <div class="stat-icon serving">
                  <el-icon><Service /></el-icon>
                </div>
                <div class="stat-info">
                  <div class="stat-value">{{ servingCount }}</div>
                  <div class="stat-label">服务中</div>
                </div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="8">
            <el-card class="stat-card">
              <div class="stat-content">
                <div class="stat-icon avg-wait">
                  <el-icon><Timer /></el-icon>
                </div>
                <div class="stat-info">
                  <div class="stat-value">{{ avgWaitTime }}分钟</div>
                  <div class="stat-label">平均等待</div>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </el-col>
    </el-row>

    <!-- 取消排队对话框 -->
    <el-dialog v-model="cancelDialogVisible" title="取消排队" width="400px">
      <el-form :model="cancelForm" label-width="80px">
        <el-form-item label="取消原因">
          <el-select v-model="cancelForm.cancelReason" placeholder="选择原因" style="width: 100%">
            <el-option label="客户主动取消" value="客户主动取消" />
            <el-option label="联系不上客户" value="联系不上客户" />
            <el-option label="客户迟到" value="客户迟到" />
            <el-option label="其他原因" value="其他原因" />
          </el-select>
        </el-form-item>
        <el-form-item label="详细说明" v-if="cancelForm.cancelReason === '其他原因'">
          <el-input v-model="cancelForm.cancelDetail" type="textarea" rows="2" />
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
import { ref, onMounted, computed, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Clock, Service, Timer } from '@element-plus/icons-vue'

const API_BASE = 'http://localhost:3000/api'
const token = localStorage.getItem('token') || ''

const loading = ref(false)
const takingNumber = ref(false)
const cancelSubmitting = ref(false)
const activeTab = ref('waiting')
const memberList = ref<any[]>([])
const serviceList = ref<any[]>([])
const employeeList = ref<any[]>([])
const queueList = ref<any[]>([])
const currentCalling = ref<any>(null)
const cancelDialogVisible = ref(false)
const cancelQueueId = ref('')
const lastQueueNumber = ref('')
const lastQueueWait = ref(0)
const lastQueueWaitTime = ref('')

let refreshTimer: any = null

const takeNumberForm = ref({
  customerType: 'member',
  memberId: '',
  guestName: '',
  guestPhone: '',
  serviceId: '',
  employeeId: '',
  remark: '',
})

const cancelForm = ref({
  cancelReason: '',
  cancelDetail: '',
})

// 计算属性
const availableEmployees = computed(() => {
  return employeeList.value.filter(e => e.status === 'active')
})

const waitingList = computed(() => {
  return queueList.value.filter(q => q.status === 'waiting').sort((a, b) => 
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  )
})

const servingList = computed(() => {
  return queueList.value.filter(q => q.status === 'serving')
})

const completedList = computed(() => {
  return queueList.value.filter(q => q.status === 'completed').sort((a, b) => 
    new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
  )
})

const cancelledList = computed(() => {
  return queueList.value.filter(q => q.status === 'cancelled')
})

const waitingCount = computed(() => waitingList.value.length)
const servingCount = computed(() => servingList.value.length)
const completedCount = computed(() => completedList.value.length)

const avgWaitTime = computed(() => {
  const completed = completedList.value
  if (completed.length === 0) return 0
  const total = completed.reduce((sum, q) => sum + (q.waitTime || 0), 0)
  return Math.round(total / completed.length)
})

// 方法
const getWaitTime = (row: any) => {
  const created = new Date(row.createdAt)
  const now = new Date()
  const minutes = Math.floor((now.getTime() - created.getTime()) / 60000)
  if (minutes < 60) return `${minutes}分钟`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours}小时${mins}分钟`
}

const getServiceTime = (row: any) => {
  if (!row.serviceStartedAt) return '0分钟'
  const started = new Date(row.serviceStartedAt)
  const now = new Date()
  const minutes = Math.floor((now.getTime() - started.getTime()) / 60000)
  return `${minutes}分钟`
}

const getWaitingPosition = (row: any) => {
  const index = waitingList.value.findIndex(q => q.id === row.id)
  return index >= 0 ? index : 0
}

const formatTime = (time: string) => {
  if (!time) return '-'
  return new Date(time).toLocaleString()
}

const loadMembers = async () => {
  try {
    const res = await fetch(`${API_BASE}/members`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    memberList.value = await res.json()
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

const loadEmployees = async () => {
  try {
    const res = await fetch(`${API_BASE}/employees`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    employeeList.value = await res.json()
  } catch (e) {}
}

const loadQueueList = async () => {
  loading.value = true
  try {
    const res = await fetch(`${API_BASE}/queue`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    queueList.value = await res.json()
    
    // 获取当前叫号
    const calling = queueList.value.find(q => q.status === 'calling')
    currentCalling.value = calling || null
  } catch (e) {
    ElMessage.error('加载排队数据失败')
  } finally {
    loading.value = false
  }
}

const handleTakeNumber = async () => {
  if (!takeNumberForm.value.serviceId) {
    ElMessage.warning('请选择服务项目')
    return
  }
  
  takingNumber.value = true
  try {
    const data: any = {
      serviceId: takeNumberForm.value.serviceId,
      employeeId: takeNumberForm.value.employeeId || null,
      remark: takeNumberForm.value.remark,
    }
    
    if (takeNumberForm.value.customerType === 'member') {
      data.memberId = takeNumberForm.value.memberId
    } else {
      data.guestName = takeNumberForm.value.guestName
      data.guestPhone = takeNumberForm.value.guestPhone
    }

    const res = await fetch(`${API_BASE}/queue/take`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(data)
    })
    
    if (res.ok) {
      const result = await res.json()
      lastQueueNumber.value = result.queueNumber
      lastQueueWait.value = result.waitingCount
      lastQueueWaitTime.value = result.estimatedWaitTime
      
      // 重置表单
      takeNumberForm.value = {
        customerType: 'member',
        memberId: '',
        guestName: '',
        guestPhone: '',
        serviceId: '',
        employeeId: '',
        remark: '',
      }
      
      loadQueueList()
      ElMessage.success('取号成功')
    } else {
      const err = await res.json()
      ElMessage.error(err.message || '取号失败')
    }
  } catch (e) {
    ElMessage.error('网络错误')
  } finally {
    takingNumber.value = false
  }
}

const handleCallNext = async () => {
  if (waitingList.value.length === 0) {
    ElMessage.warning('暂无等待客户')
    return
  }
  
  const next = waitingList.value[0]
  await handleCall(next)
}

const handleCall = async (row: any) => {
  try {
    const res = await fetch(`${API_BASE}/queue/${row.id}/call`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    })
    
    if (res.ok) {
      ElMessage.success(`请 ${row.queueNumber} 号客户到服务台`)
      loadQueueList()
    }
  } catch (e) {
    ElMessage.error('叫号失败')
  }
}

const handleStartService = async (row: any) => {
  try {
    const res = await fetch(`${API_BASE}/queue/${row.id}/start`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    })
    
    if (res.ok) {
      ElMessage.success('开始服务')
      currentCalling.value = null
      loadQueueList()
    }
  } catch (e) {
    ElMessage.error('操作失败')
  }
}

const handleCompleteService = async (row: any) => {
  try {
    const res = await fetch(`${API_BASE}/queue/${row.id}/complete`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    })
    
    if (res.ok) {
      ElMessage.success('服务完成')
      loadQueueList()
    }
  } catch (e) {
    ElMessage.error('操作失败')
  }
}

const handleSkip = async (row: any) => {
  try {
    await ElMessageBox.confirm('确定要跳过此客户吗？', '提示', { type: 'warning' })
    const res = await fetch(`${API_BASE}/queue/${row.id}/skip`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    })
    
    if (res.ok) {
      ElMessage.success('已跳过')
      currentCalling.value = null
      loadQueueList()
    }
  } catch (e) {}
}

const handleCancelQueue = (row: any) => {
  cancelQueueId.value = row.id
  cancelForm.value = {
    cancelReason: '',
    cancelDetail: '',
  }
  cancelDialogVisible.value = true
}

const handleCancelSubmit = async () => {
  cancelSubmitting.value = true
  try {
    const res = await fetch(`${API_BASE}/queue/${cancelQueueId.value}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        cancelReason: cancelForm.value.cancelReason,
        cancelDetail: cancelForm.value.cancelDetail,
      })
    })
    
    if (res.ok) {
      ElMessage.success('已取消排队')
      cancelDialogVisible.value = false
      currentCalling.value = null
      loadQueueList()
    }
  } catch (e) {
    ElMessage.error('操作失败')
  } finally {
    cancelSubmitting.value = false
  }
}

onMounted(() => {
  loadMembers()
  loadServices()
  loadEmployees()
  loadQueueList()
  
  // 定时刷新
  refreshTimer = setInterval(() => {
    loadQueueList()
  }, 30000)
})

onUnmounted(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
  }
})
</script>

<style scoped>
.queue-page {
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

.queue-number {
  font-size: 16px;
  font-weight: 600;
  color: #409eff;
}

.calling-info {
  text-align: center;
  padding: 20px;
}

.queue-number-large {
  font-size: 48px;
  font-weight: 700;
  color: #409eff;
  margin-bottom: 20px;
}

.customer-info {
  margin-bottom: 20px;
  color: #606266;
}

.customer-info div {
  margin: 5px 0;
}

.calling-actions {
  display: flex;
  justify-content: center;
  gap: 10px;
}

.stat-card {
  cursor: default;
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 20px;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  color: white;
}

.stat-icon.waiting {
  background: linear-gradient(135deg, #e6a23c, #f5c76a);
}

.stat-icon.serving {
  background: linear-gradient(135deg, #409eff, #79bbff);
}

.stat-icon.avg-wait {
  background: linear-gradient(135deg, #67c23a, #95d475);
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 5px;
}
</style>
