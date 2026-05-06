<template>
  <div class="appointment-config-page">
    <el-card>
      <template #header>
        <span>预约设置</span>
      </template>
      
      <el-tabs v-model="activeTab">
        <!-- 营业时段设置 -->
        <el-tab-pane label="营业时段" name="businessHours">
          <el-table :data="businessHours" border>
            <el-table-column prop="dayOfWeek" label="星期" width="100">
              <template #default="{ row }">
                {{ dayNames[row.dayOfWeek] }}
              </template>
            </el-table-column>
            <el-table-column label="是否营业" width="100">
              <template #default="{ row }">
                <el-switch v-model="row.isOpen" @change="handleBusinessHourChange(row)" />
              </template>
            </el-table-column>
            <el-table-column label="营业时间" width="200">
              <template #default="{ row }">
                <el-time-select
                  v-model="row.openTime"
                  :disabled="!row.isOpen"
                  placeholder="开始时间"
                  :max-time="row.closeTime"
                  style="width: 90px"
                  @change="handleBusinessHourChange(row)"
                />
                -
                <el-time-select
                  v-model="row.closeTime"
                  :disabled="!row.isOpen"
                  placeholder="结束时间"
                  :min-time="row.openTime"
                  style="width: 90px"
                  @change="handleBusinessHourChange(row)"
                />
              </template>
            </el-table-column>
            <el-table-column label="休息时段">
              <template #default="{ row }">
                <el-time-select
                  v-model="row.breakStart"
                  :disabled="!row.isOpen"
                  placeholder="休息开始"
                  style="width: 90px"
                  @change="handleBusinessHourChange(row)"
                />
                -
                <el-time-select
                  v-model="row.breakEnd"
                  :disabled="!row.isOpen"
                  placeholder="休息结束"
                  style="width: 90px"
                  @change="handleBusinessHourChange(row)"
                />
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        
        <!-- 预约配置 -->
        <el-tab-pane label="预约配置" name="config">
          <el-form :model="config" label-width="150px" style="max-width: 600px">
            <el-form-item label="预约时间间隔">
              <el-select v-model="config.timeSlotInterval" style="width: 200px">
                <el-option :value="15" label="15分钟" />
                <el-option :value="30" label="30分钟" />
                <el-option :value="60" label="60分钟" />
              </el-select>
            </el-form-item>
            
            <el-form-item label="提前预约时间">
              <el-input-number v-model="config.advanceBookingMinutes" :min="0" :step="30" />
              <span style="margin-left: 10px">分钟</span>
            </el-form-item>
            
            <el-form-item label="取消提前时间">
              <el-input-number v-model="config.cancelAdvanceMinutes" :min="0" :step="30" />
              <span style="margin-left: 10px">分钟</span>
            </el-form-item>
            
            <el-form-item label="最大提前预约天数">
              <el-input-number v-model="config.maxAdvanceDays" :min="1" :max="90" />
              <span style="margin-left: 10px">天</span>
            </el-form-item>
            
            <el-form-item label="每日最大预约次数">
              <el-input-number v-model="config.maxDailyAppointments" :min="1" :max="10" />
            </el-form-item>
            
            <el-divider content-position="left">会员自助预约</el-divider>
            
            <el-form-item label="允许会员自助预约">
              <el-switch v-model="config.allowMemberSelfBooking" />
            </el-form-item>
            
            <el-form-item label="需要支付定金">
              <el-switch v-model="config.requireDeposit" />
            </el-form-item>
            
            <el-form-item v-if="config.requireDeposit" label="定金金额">
              <el-input-number v-model="config.depositAmount" :min="0" :precision="2" />
              <span style="margin-left: 10px">元</span>
            </el-form-item>
            
            <el-divider content-position="left">提醒设置</el-divider>
            
            <el-form-item label="发送预约提醒">
              <el-switch v-model="config.sendReminder" />
            </el-form-item>
            
            <el-form-item v-if="config.sendReminder" label="提前提醒时间">
              <el-input-number v-model="config.reminderMinutes" :min="30" :step="30" />
              <span style="margin-left: 10px">分钟</span>
            </el-form-item>
            
            <el-form-item label="自动确认预约">
              <el-switch v-model="config.autoConfirm" />
            </el-form-item>
            
            <el-form-item>
              <el-button type="primary" @click="saveConfig">保存配置</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
        
        <!-- 特殊日期设置 -->
        <el-tab-pane label="特殊日期" name="specialDays">
          <div style="margin-bottom: 15px">
            <el-button type="primary" @click="showAddSpecialDay">添加特殊日期</el-button>
          </div>
          
          <el-table :data="specialDays" border>
            <el-table-column prop="date" label="日期" width="150" />
            <el-table-column label="是否营业" width="100">
              <template #default="{ row }">
                <el-tag :type="row.isOpen ? 'success' : 'danger'">
                  {{ row.isOpen ? '营业' : '休息' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="营业时间">
              <template #default="{ row }">
                <span v-if="row.isOpen">{{ row.openTime }} - {{ row.closeTime }}</span>
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column prop="remark" label="备注" />
            <el-table-column label="操作" width="100">
              <template #default="{ row }">
                <el-button type="danger" size="small" @click="removeSpecialDay(row.date)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-card>
    
    <!-- 添加特殊日期对话框 -->
    <el-dialog v-model="showSpecialDayDialog" title="添加特殊日期" width="500px">
      <el-form :model="specialDayForm" label-width="100px">
        <el-form-item label="日期">
          <el-date-picker v-model="specialDayForm.date" type="date" placeholder="选择日期" style="width: 100%" />
        </el-form-item>
        <el-form-item label="是否营业">
          <el-switch v-model="specialDayForm.isOpen" />
        </el-form-item>
        <el-form-item v-if="specialDayForm.isOpen" label="营业时间">
          <el-time-select v-model="specialDayForm.openTime" placeholder="开始时间" style="width: 120px" />
          -
          <el-time-select v-model="specialDayForm.closeTime" placeholder="结束时间" style="width: 120px" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="specialDayForm.remark" type="textarea" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showSpecialDayDialog = false">取消</el-button>
        <el-button type="primary" @click="addSpecialDay">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'

const API_BASE = 'http://localhost:3000/api'
const token = localStorage.getItem('token') || ''

const activeTab = ref('businessHours')

const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

const businessHours = ref<any[]>([])
const config = ref({
  timeSlotInterval: 30,
  advanceBookingMinutes: 60,
  cancelAdvanceMinutes: 30,
  maxAdvanceDays: 15,
  maxDailyAppointments: 1,
  allowMemberSelfBooking: true,
  requireDeposit: false,
  depositAmount: 0,
  sendReminder: true,
  reminderMinutes: 120,
  autoConfirm: true,
})

const specialDays = computed(() => config.value.specialDays || [])

const showSpecialDayDialog = ref(false)
const specialDayForm = ref({
  date: '',
  isOpen: false,
  openTime: '09:00',
  closeTime: '18:00',
  remark: ''
})

const loadData = async () => {
  try {
    const [hoursRes, configRes] = await Promise.all([
      fetch(`${API_BASE}/appointment/business-hours`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${API_BASE}/appointment/config`, { headers: { Authorization: `Bearer ${token}` } })
    ])
    
    const hoursData = await hoursRes.json()
    const configData = await configRes.json()
    
    // 确保每天都有数据
    businessHours.value = Array.from({ length: 7 }, (_, i) => {
      const existing = hoursData.find((h: any) => h.dayOfWeek === i)
      return existing || {
        dayOfWeek: i,
        openTime: '09:00',
        closeTime: '18:00',
        isOpen: i !== 0,
        breakStart: '',
        breakEnd: ''
      }
    })
    
    if (configData) {
      config.value = { ...config.value, ...configData }
    }
  } catch (e) {
    console.error(e)
  }
}

const handleBusinessHourChange = async (row: any) => {
  try {
    await fetch(`${API_BASE}/appointment/business-hours`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(businessHours.value)
    })
    ElMessage.success('保存成功')
  } catch (e) {
    ElMessage.error('保存失败')
  }
}

const saveConfig = async () => {
  try {
    await fetch(`${API_BASE}/appointment/config`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(config.value)
    })
    ElMessage.success('保存成功')
  } catch (e) {
    ElMessage.error('保存失败')
  }
}

const showAddSpecialDay = () => {
  specialDayForm.value = {
    date: '',
    isOpen: false,
    openTime: '09:00',
    closeTime: '18:00',
    remark: ''
  }
  showSpecialDayDialog.value = true
}

const addSpecialDay = async () => {
  if (!specialDayForm.value.date) {
    ElMessage.warning('请选择日期')
    return
  }
  
  const dateStr = new Date(specialDayForm.value.date).toISOString().split('T')[0]
  
  try {
    await fetch(`${API_BASE}/appointment/config/${config.value.id}/special-day`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        date: dateStr,
        ...specialDayForm.value
      })
    })
    ElMessage.success('添加成功')
    showSpecialDayDialog.value = false
    loadData()
  } catch (e) {
    ElMessage.error('添加失败')
  }
}

const removeSpecialDay = async (date: string) => {
  try {
    await fetch(`${API_BASE}/appointment/config/${config.value.id}/special-day/${date}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    })
    ElMessage.success('删除成功')
    loadData()
  } catch (e) {
    ElMessage.error('删除失败')
  }
}

onMounted(loadData)
</script>

<style scoped>
.appointment-config-page {
  padding: 20px;
}
</style>
