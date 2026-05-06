<template>
  <div class="coupon-verify-page">
    <el-card>
      <template #header>
        <span>核销验券</span>
      </template>
      
      <el-row :gutter="20">
        <el-col :span="12">
          <el-card shadow="never">
            <template #header>
              <span>输入券码</span>
            </template>
            <el-form :model="verifyForm" label-width="100px">
              <el-form-item label="团购券码">
                <el-input 
                  v-model="verifyForm.couponCode" 
                  placeholder="请输入或扫描团购券码" 
                  size="large"
                  @keyup.enter="handleVerify"
                >
                  <template #append>
                    <el-button @click="handleVerify" :loading="verifying">核销</el-button>
                  </template>
                </el-input>
              </el-form-item>
              <el-form-item label="验证码">
                <el-input v-model="verifyForm.verifyCode" placeholder="验证码（如有）" />
              </el-form-item>
            </el-form>
            
            <el-divider />
            
            <div class="quick-actions">
              <el-button type="primary" size="large" @click="handleVerify" :loading="verifying">
                <el-icon><Check /></el-icon>
                立即核销
              </el-button>
              <el-button size="large" @click="handleClear">
                <el-icon><RefreshLeft /></el-icon>
                清空重输
              </el-button>
            </div>
          </el-card>
        </el-col>
        
        <el-col :span="12">
          <el-card shadow="never">
            <template #header>
              <span>券码信息</span>
            </template>
            
            <div v-if="!couponInfo && !verifying" class="empty-state">
              <el-empty description="请输入券码进行核销" />
            </div>
            
            <div v-else-if="verifying" class="loading-state">
              <el-skeleton :rows="5" animated />
            </div>
            
            <div v-else-if="couponInfo" class="coupon-info">
              <el-descriptions :column="1" border>
                <el-descriptions-item label="券码">{{ couponInfo.code }}</el-descriptions-item>
                <el-descriptions-item label="券类型">{{ couponInfo.type }}</el-descriptions-item>
                <el-descriptions-item label="券名称">{{ couponInfo.name }}</el-descriptions-item>
                <el-descriptions-item label="面值">
                  <span class="amount">¥{{ couponInfo.value }}</span>
                </el-descriptions-item>
                <el-descriptions-item label="购买人">{{ couponInfo.buyerName }} ({{ couponInfo.buyerPhone }})</el-descriptions-item>
                <el-descriptions-item label="购买时间">{{ new Date(couponInfo.buyTime).toLocaleString() }}</el-descriptions-item>
                <el-descriptions-item label="有效期至">{{ new Date(couponInfo.expireTime).toLocaleDateString() }}</el-descriptions-item>
                <el-descriptions-item label="状态">
                  <el-tag :type="couponStatusMap[couponInfo.status]?.tagType">
                    {{ couponStatusMap[couponInfo.status]?.label }}
                  </el-tag>
                </el-descriptions-item>
                <el-descriptions-item v-if="couponInfo.status === 'used'" label="核销时间">
                  {{ new Date(couponInfo.useTime).toLocaleString() }}
                </el-descriptions-item>
                <el-descriptions-item v-if="couponInfo.status === 'used'" label="核销门店">
                  {{ couponInfo.useStore }}
                </el-descriptions-item>
              </el-descriptions>
              
              <div v-if="couponInfo.status === 'valid'" class="verify-actions" style="margin-top: 20px">
                <el-button type="success" size="large" @click="confirmVerify" :loading="confirming">
                  <el-icon><Check /></el-icon>
                  确认核销
                </el-button>
              </div>
              
              <div v-else-if="couponInfo.status === 'used'" class="used-warning">
                <el-alert type="warning" title="此券已核销" :closable="false" show-icon />
              </div>
              
              <div v-else-if="couponInfo.status === 'expired'" class="expired-warning">
                <el-alert type="error" title="此券已过期" :closable="false" show-icon />
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
      
      <el-divider />
      
      <!-- 核销记录 -->
      <el-card shadow="never">
        <template #header>
          <div class="record-header">
            <span>今日核销记录</span>
            <el-button size="small" @click="loadTodayRecords">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
          </div>
        </template>
        
        <el-table :data="todayRecords" v-loading="recordsLoading">
          <el-table-column prop="code" label="券码" width="180" />
          <el-table-column prop="name" label="券名称" width="150" />
          <el-table-column prop="value" label="面值" width="100">
            <template #default="{ row }">
              ¥{{ row.value }}
            </template>
          </el-table-column>
          <el-table-column prop="buyerName" label="购买人" width="100" />
          <el-table-column prop="buyerPhone" label="手机号" width="120" />
          <el-table-column prop="useTime" label="核销时间" width="180">
            <template #default="{ row }">
              {{ new Date(row.useTime).toLocaleString() }}
            </template>
          </el-table-column>
          <el-table-column prop="operatorName" label="操作员" width="100" />
          <el-table-column label="状态">
            <template #default>
              <el-tag type="success">已核销</el-tag>
            </template>
          </el-table-column>
        </el-table>
        
        <div class="summary" style="margin-top: 15px; text-align: right">
          <span>今日核销: <strong>{{ todayRecords.length }}</strong> 张，</span>
          <span>总金额: <strong class="amount">¥{{ todayTotalAmount }}</strong></span>
        </div>
      </el-card>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const API_BASE = 'http://localhost:3000/api'
const token = localStorage.getItem('token') || ''

// 表单
const verifyForm = ref({
  couponCode: '',
  verifyCode: ''
})

// 状态
const verifying = ref(false)
const confirming = ref(false)
const couponInfo = ref<any>(null)
const todayRecords = ref<any[]>([])
const recordsLoading = ref(false)

// 映射
const couponStatusMap: Record<string, { label: string; tagType: string }> = {
  valid: { label: '有效', tagType: 'success' },
  used: { label: '已使用', tagType: 'info' },
  expired: { label: '已过期', tagType: 'danger' }
}

// 计算
const todayTotalAmount = computed(() => {
  return todayRecords.value.reduce((sum, r) => sum + r.value, 0)
})

// 方法
const handleVerify = async () => {
  if (!verifyForm.value.couponCode) {
    ElMessage.warning('请输入券码')
    return
  }
  
  verifying.value = true
  couponInfo.value = null
  
  try {
    const res = await fetch(`${API_BASE}/voucher/code/${verifyForm.value.couponCode}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    
    if (res.ok) {
      const data = await res.json()
      couponInfo.value = {
        code: data.couponCode,
        type: data.couponSource,
        name: data.couponName,
        value: data.couponValue,
        buyerName: data.member?.name || '-',
        buyerPhone: data.member?.phone || '-',
        buyTime: data.createdAt,
        expireTime: data.expireTime,
        status: data.status,
        useTime: data.verifyTime,
        useStore: '-'
      }
    } else {
      const err = await res.json()
      ElMessage.error(err.message || '查询失败')
    }
  } catch (e) {
    ElMessage.error('网络错误')
  } finally {
    verifying.value = false
  }
}

const confirmVerify = async () => {
  if (!couponInfo.value) return
  
  try {
    await ElMessageBox.confirm(
      `确认核销券码 ${couponInfo.value.code}，面值 ¥${couponInfo.value.value}？`,
      '核销确认',
      {
        confirmButtonText: '确认核销',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    confirming.value = true
    const res = await fetch(`${API_BASE}/voucher/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        couponCode: couponInfo.value.code,
        verifyCode: verifyForm.value.verifyCode
      })
    })
    
    if (res.ok) {
      ElMessage.success('核销成功！')
      couponInfo.value.status = 'used'
      couponInfo.value.useTime = new Date().toISOString()
      loadTodayRecords()
    } else {
      const err = await res.json()
      ElMessage.error(err.message || '核销失败')
    }
  } catch (e: any) {
    if (e !== 'cancel') {
      ElMessage.error('网络错误')
    }
  } finally {
    confirming.value = false
  }
}

const handleClear = () => {
  verifyForm.value.couponCode = ''
  verifyForm.value.verifyCode = ''
  couponInfo.value = null
}

const loadTodayRecords = async () => {
  recordsLoading.value = true
  try {
    const today = new Date().toISOString().split('T')[0]
    const res = await fetch(`${API_BASE}/voucher?date=${today}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const data = await res.json()
    todayRecords.value = data.filter((c: any) => c.status === 'verified').map((c: any) => ({
      code: c.couponCode,
      name: c.couponName,
      value: c.couponValue,
      buyerName: c.member?.name || '-',
      buyerPhone: c.member?.phone || '-',
      useTime: c.verifyTime,
      operatorName: '-'
    }))
  } catch (e) {
    console.error(e)
  } finally {
    recordsLoading.value = false
  }
}

onMounted(() => {
  loadTodayRecords()
})
</script>

<style scoped>
.coupon-verify-page {
  padding: 20px;
}

.quick-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
}

.empty-state {
  padding: 40px 0;
}

.loading-state {
  padding: 20px;
}

.coupon-info {
  padding: 10px;
}

.verify-actions {
  text-align: center;
}

.used-warning,
.expired-warning {
  margin-top: 20px;
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.amount {
  color: #f56c6c;
  font-weight: bold;
}

.summary strong {
  font-size: 16px;
}
</style>
