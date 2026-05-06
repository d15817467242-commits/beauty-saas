<template>
  <view class="appointment-page">
    <!-- 选择服务 -->
    <view class="section">
      <view class="section-header">
        <text class="title">选择服务</text>
      </view>
      <picker :range="services" range-key="name" @change="onServiceChange">
        <view class="picker">
          <text v-if="selectedService">{{ selectedService.name }} - ¥{{ selectedService.price }}</text>
          <text v-else class="placeholder">请选择服务项目</text>
        </view>
      </picker>
    </view>

    <!-- 选择发型师 -->
    <view class="section">
      <view class="section-header">
        <text class="title">选择发型师</text>
      </view>
      <scroll-view class="employee-scroll" scroll-x>
        <view 
          class="employee-item" 
          :class="{ active: selectedEmployee?.id === emp.id }"
          v-for="emp in employees" 
          :key="emp.id"
          @click="selectEmployee(emp)"
        >
          <image class="avatar" :src="emp.avatar || '/static/avatar.png'" mode="aspectFill" />
          <text class="name">{{ emp.name }}</text>
          <text class="position">{{ emp.position }}</text>
        </view>
      </scroll-view>
    </view>

    <!-- 选择日期 -->
    <view class="section">
      <view class="section-header">
        <text class="title">选择日期</text>
      </view>
      <picker mode="date" :start="minDate" :end="maxDate" @change="onDateChange">
        <view class="picker">
          <text v-if="selectedDate">{{ selectedDate }}</text>
          <text v-else class="placeholder">请选择日期</text>
        </view>
      </picker>
    </view>

    <!-- 选择时段 -->
    <view class="section" v-if="selectedEmployee && selectedDate">
      <view class="section-header">
        <text class="title">选择时段</text>
      </view>
      <view class="time-slots">
        <view 
          class="slot-item" 
          :class="{ active: selectedSlot === slot.time, disabled: !slot.available }"
          v-for="slot in timeSlots" 
          :key="slot.time"
          @click="selectSlot(slot)"
        >
          {{ formatTime(slot.time) }}
        </view>
      </view>
    </view>

    <!-- 备注 -->
    <view class="section">
      <view class="section-header">
        <text class="title">备注</text>
      </view>
      <textarea 
        v-model="remark" 
        placeholder="请输入备注信息" 
        class="remark-input"
      />
    </view>

    <!-- 提交按钮 -->
    <view class="submit-btn" @click="submitAppointment">
      <text>确认预约</text>
    </view>

    <!-- 我的预约 -->
    <view class="section" style="margin-top: 20rpx">
      <view class="section-header">
        <text class="title">我的预约</text>
      </view>
      <view class="appointment-list" v-if="myAppointments.length > 0">
        <view class="appointment-item card" v-for="apt in myAppointments" :key="apt.id">
          <view class="apt-info">
            <text class="apt-service">{{ apt.service?.name || '服务' }}</text>
            <text class="apt-employee">{{ apt.employee?.name || '发型师' }}</text>
          </view>
          <view class="apt-time">
            <text>{{ formatDateTime(apt.appointmentTime) }}</text>
          </view>
          <view class="apt-status">
            <text :class="'status-' + apt.status">{{ statusText(apt.status) }}</text>
          </view>
        </view>
      </view>
      <view class="empty" v-else>
        <text>暂无预约记录</text>
      </view>
    </view>
  </view>
</template>

<script>
import { ref, onMounted, watch } from 'vue'

export default {
  setup() {
    const services = ref([])
    const employees = ref([])
    const timeSlots = ref([])
    const myAppointments = ref([])
    
    const selectedService = ref(null)
    const selectedEmployee = ref(null)
    const selectedDate = ref('')
    const selectedSlot = ref('')
    const remark = ref('')

    const minDate = new Date().toISOString().split('T')[0]
    const maxDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const loadServices = async () => {
      try {
        const res = await uni.request({
          url: 'http://localhost:3001/api/services'
        })
        services.value = res.data || []
      } catch (e) {
        console.error('加载服务失败', e)
      }
    }

    const loadEmployees = async () => {
      try {
        const res = await uni.request({
          url: 'http://localhost:3001/api/miniapp/team'
        })
        employees.value = res.data || []
      } catch (e) {
        console.error('加载员工失败', e)
      }
    }

    const loadTimeSlots = async () => {
      if (!selectedEmployee.value || !selectedDate.value) return

      try {
        const res = await uni.request({
          url: `http://localhost:3001/api/miniapp/available-slots?employeeId=${selectedEmployee.value.id}&date=${selectedDate.value}`
        })
        timeSlots.value = res.data || []
      } catch (e) {
        console.error('加载时段失败', e)
      }
    }

    const loadMyAppointments = async () => {
      const memberId = uni.getStorageSync('memberId')
      if (!memberId) return

      try {
        const res = await uni.request({
          url: `http://localhost:3001/api/miniapp/appointments?memberId=${memberId}`
        })
        myAppointments.value = res.data || []
      } catch (e) {
        console.error('加载预约失败', e)
      }
    }

    const onServiceChange = (e) => {
      selectedService.value = services.value[e.detail.value]
    }

    const selectEmployee = (emp) => {
      selectedEmployee.value = emp
      selectedSlot.value = ''
      loadTimeSlots()
    }

    const onDateChange = (e) => {
      selectedDate.value = e.detail.value
      selectedSlot.value = ''
      loadTimeSlots()
    }

    const selectSlot = (slot) => {
      if (slot.available) {
        selectedSlot.value = slot.time
      }
    }

    const formatTime = (time) => {
      const d = new Date(time)
      return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
    }

    const formatDateTime = (time) => {
      return new Date(time).toLocaleString('zh-CN')
    }

    const statusText = (status) => {
      const texts = {
        pending: '待确认',
        confirmed: '已确认',
        completed: '已完成',
        cancelled: '已取消'
      }
      return texts[status] || status
    }

    const submitAppointment = async () => {
      if (!selectedService.value) {
        uni.showToast({ title: '请选择服务', icon: 'none' })
        return
      }
      if (!selectedEmployee.value) {
        uni.showToast({ title: '请选择发型师', icon: 'none' })
        return
      }
      if (!selectedDate.value) {
        uni.showToast({ title: '请选择日期', icon: 'none' })
        return
      }
      if (!selectedSlot.value) {
        uni.showToast({ title: '请选择时段', icon: 'none' })
        return
      }

      const memberId = uni.getStorageSync('memberId')
      if (!memberId) {
        uni.showToast({ title: '请先登录', icon: 'none' })
        return
      }

      try {
        await uni.request({
          url: 'http://localhost:3001/api/miniapp/appointment',
          method: 'POST',
          data: {
            memberId,
            employeeId: selectedEmployee.value.id,
            serviceId: selectedService.value.id,
            appointmentTime: selectedSlot.value,
            remark: remark.value
          }
        })
        uni.showToast({ title: '预约成功', icon: 'success' })
        loadMyAppointments()
      } catch (e) {
        uni.showToast({ title: '预约失败', icon: 'none' })
      }
    }

    onMounted(() => {
      loadServices()
      loadEmployees()
      loadMyAppointments()
    })

    return {
      services,
      employees,
      timeSlots,
      myAppointments,
      selectedService,
      selectedEmployee,
      selectedDate,
      selectedSlot,
      remark,
      minDate,
      maxDate,
      onServiceChange,
      selectEmployee,
      onDateChange,
      selectSlot,
      formatTime,
      formatDateTime,
      statusText,
      submitAppointment
    }
  }
}
</script>

<style scoped>
.appointment-page {
  min-height: 100vh;
  background-color: #f8f8f8;
  padding: 20rpx;
}

.section {
  background-color: #ffffff;
  border-radius: 16rpx;
  padding: 20rpx;
  margin-bottom: 20rpx;
}

.section-header {
  margin-bottom: 20rpx;
}

.section-header .title {
  font-size: 32rpx;
  font-weight: bold;
}

.picker {
  padding: 20rpx;
  background-color: #f5f5f5;
  border-radius: 8rpx;
}

.picker .placeholder {
  color: #999999;
}

.employee-scroll {
  white-space: nowrap;
}

.employee-item {
  display: inline-block;
  width: 140rpx;
  text-align: center;
  margin-right: 20rpx;
  padding: 20rpx;
  border-radius: 12rpx;
  border: 2rpx solid transparent;
}

.employee-item.active {
  border-color: #409EFF;
  background-color: #ecf5ff;
}

.employee-item .avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  margin-bottom: 10rpx;
}

.employee-item .name {
  display: block;
  font-size: 28rpx;
  font-weight: bold;
}

.employee-item .position {
  display: block;
  font-size: 24rpx;
  color: #999999;
}

.time-slots {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.slot-item {
  width: calc(25% - 12rpx);
  padding: 16rpx;
  text-align: center;
  background-color: #f5f5f5;
  border-radius: 8rpx;
  font-size: 26rpx;
}

.slot-item.active {
  background-color: #409EFF;
  color: #ffffff;
}

.slot-item.disabled {
  background-color: #f5f5f5;
  color: #cccccc;
}

.remark-input {
  width: 100%;
  height: 150rpx;
  padding: 20rpx;
  background-color: #f5f5f5;
  border-radius: 8rpx;
  font-size: 28rpx;
}

.submit-btn {
  background-color: #409EFF;
  color: #ffffff;
  text-align: center;
  padding: 24rpx;
  border-radius: 40rpx;
  font-size: 32rpx;
  margin-top: 30rpx;
}

.appointment-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx;
  margin-bottom: 10rpx;
}

.apt-info .apt-service {
  display: block;
  font-size: 28rpx;
  font-weight: bold;
}

.apt-info .apt-employee {
  display: block;
  font-size: 24rpx;
  color: #999999;
}

.apt-time {
  font-size: 24rpx;
  color: #666666;
}

.status-pending {
  color: #e6a23c;
}

.status-confirmed {
  color: #409EFF;
}

.status-completed {
  color: #67c23a;
}

.status-cancelled {
  color: #999999;
}

.empty {
  text-align: center;
  padding: 40rpx;
  color: #999999;
}
</style>
