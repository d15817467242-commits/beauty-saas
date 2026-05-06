<template>
  <div class="member-points-page">
    <el-row :gutter="20">
      <!-- 左侧：积分概览 -->
      <el-col :span="8">
        <el-card class="overview-card">
          <template #header>
            <span>积分概览</span>
          </template>
          <div class="overview-content">
            <div class="overview-item">
              <div class="overview-label">总发放积分</div>
              <div class="overview-value">{{ overview.totalIssued || 0 }}</div>
            </div>
            <div class="overview-item">
              <div class="overview-label">总消耗积分</div>
              <div class="overview-value warning">{{ overview.totalUsed || 0 }}</div>
            </div>
            <div class="overview-item">
              <div class="overview-label">当前总余额</div>
              <div class="overview-value success">{{ overview.totalBalance || 0 }}</div>
            </div>
            <div class="overview-item">
              <div class="overview-label">本月发放</div>
              <div class="overview-value">{{ overview.monthIssued || 0 }}</div>
            </div>
            <div class="overview-item">
              <div class="overview-label">本月消耗</div>
              <div class="overview-value warning">{{ overview.monthUsed || 0 }}</div>
            </div>
          </div>
        </el-card>

        <!-- 快捷操作 -->
        <el-card style="margin-top: 20px;">
          <template #header>
            <span>快捷操作</span>
          </template>
          <div class="quick-actions">
            <el-button type="primary" @click="showAdjustDialog()" style="width: 100%; margin-bottom: 10px;">
              积分调整
            </el-button>
            <el-button type="success" @click="showExchangeDialog()" style="width: 100%;">
              积分兑换
            </el-button>
          </div>
        </el-card>

        <!-- 兑换规则 -->
        <el-card style="margin-top: 20px;">
          <template #header>
            <div class="card-header">
              <span>兑换规则</span>
              <el-button link type="primary" @click="showRuleDialog()">管理</el-button>
            </div>
          </template>
          <div v-for="rule in exchangeRules" :key="rule.id" class="rule-item">
            <div class="rule-name">{{ rule.name }}</div>
            <div class="rule-info">
              <span>{{ rule.pointsRequired }} 积分 → ¥{{ rule.rewardAmount }}</span>
            </div>
          </div>
          <el-empty v-if="!exchangeRules.length" description="暂无兑换规则" :image-size="60" />
        </el-card>
      </el-col>

      <!-- 右侧：积分流水 -->
      <el-col :span="16">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>积分流水</span>
            </div>
          </template>

          <!-- 搜索栏 -->
          <el-form :inline="true" class="search-form">
            <el-form-item label="会员">
              <el-select 
                v-model="searchMemberId" 
                filterable 
                remote 
                reserve-keyword
                placeholder="搜索会员"
                :remote-method="searchMembers"
                clearable
                style="width: 200px;"
              >
                <el-option 
                  v-for="member in memberOptions" 
                  :key="member.id" 
                  :label="`${member.name} (${member.phone})`" 
                  :value="member.id" 
                />
              </el-select>
            </el-form-item>
            <el-form-item label="类型">
              <el-select v-model="searchType" clearable placeholder="全部" style="width: 120px;">
                <el-option label="获得" value="earn" />
                <el-option label="消费" value="spend" />
                <el-option label="兑换" value="exchange" />
                <el-option label="调整" value="adjust" />
                <el-option label="过期" value="expire" />
              </el-select>
            </el-form-item>
            <el-form-item label="时间">
              <el-date-picker 
                v-model="searchDateRange" 
                type="daterange" 
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                style="width: 240px;"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="loadRecords">查询</el-button>
              <el-button @click="resetSearch">重置</el-button>
            </el-form-item>
          </el-form>

          <!-- 流水列表 -->
          <el-table :data="records" v-loading="loading" stripe>
            <el-table-column prop="createdAt" label="时间" width="160">
              <template #default="{ row }">
                {{ new Date(row.createdAt).toLocaleString() }}
              </template>
            </el-table-column>
            <el-table-column prop="memberName" label="会员" width="120">
              <template #default="{ row }">
                {{ row.member?.name || row.memberName }}
              </template>
            </el-table-column>
            <el-table-column prop="type" label="类型" width="80">
              <template #default="{ row }">
                <el-tag :type="typeMap[row.type]?.type" size="small">
                  {{ typeMap[row.type]?.label || row.type }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="points" label="积分变动" width="120">
              <template #default="{ row }">
                <span :style="{ color: row.points > 0 ? '#67C23A' : '#F56C6C' }">
                  {{ row.points > 0 ? '+' : '' }}{{ row.points }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="balance" label="变动后余额" width="100">
              <template #default="{ row }">
                {{ row.balance }}
              </template>
            </el-table-column>
            <el-table-column prop="description" label="说明" />
            <el-table-column prop="operatorName" label="操作人" width="100" />
          </el-table>

          <!-- 分页 -->
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :total="total"
            :page-sizes="[20, 50, 100]"
            layout="total, sizes, prev, pager, next"
            @size-change="loadRecords"
            @current-change="loadRecords"
            style="margin-top: 16px; justify-content: flex-end;"
          />
        </el-card>
      </el-col>
    </el-row>

    <!-- 积分调整对话框 -->
    <el-dialog v-model="adjustDialogVisible" title="积分调整" width="500px">
      <el-form :model="adjustForm" label-width="100px" :rules="adjustRules" ref="adjustFormRef">
        <el-form-item label="选择会员" prop="memberId">
          <el-select 
            v-model="adjustForm.memberId" 
            filterable 
            remote 
            reserve-keyword
            placeholder="搜索会员"
            :remote-method="searchMembers"
            style="width: 100%;"
          >
            <el-option 
              v-for="member in memberOptions" 
              :key="member.id" 
              :label="`${member.name} (${member.phone})`" 
              :value="member.id" 
            />
          </el-select>
        </el-form-item>
        <el-form-item label="当前积分">
          <span style="font-size: 18px; font-weight: bold; color: #409EFF;">{{ selectedMemberPoints }}</span>
        </el-form-item>
        <el-form-item label="调整类型" prop="adjustType">
          <el-radio-group v-model="adjustForm.adjustType">
            <el-radio value="add">增加</el-radio>
            <el-radio value="subtract">扣减</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="调整积分" prop="points">
          <el-input-number v-model="adjustForm.points" :min="1" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="调整原因" prop="reason">
          <el-input v-model="adjustForm.reason" type="textarea" :rows="2" placeholder="请输入调整原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="adjustDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="adjustSubmitting" @click="submitAdjust">确认调整</el-button>
      </template>
    </el-dialog>

    <!-- 积分兑换对话框 -->
    <el-dialog v-model="exchangeDialogVisible" title="积分兑换" width="500px">
      <el-form :model="exchangeForm" label-width="100px" :rules="exchangeRules" ref="exchangeFormRef">
        <el-form-item label="选择会员" prop="memberId">
          <el-select 
            v-model="exchangeForm.memberId" 
            filterable 
            remote 
            reserve-keyword
            placeholder="搜索会员"
            :remote-method="searchMembers"
            style="width: 100%;"
            @change="handleExchangeMemberChange"
          >
            <el-option 
              v-for="member in memberOptions" 
              :key="member.id" 
              :label="`${member.name} (${member.phone})`" 
              :value="member.id" 
            />
          </el-select>
        </el-form-item>
        <el-form-item label="当前积分">
          <span style="font-size: 18px; font-weight: bold; color: #409EFF;">{{ exchangeMemberPoints }}</span>
        </el-form-item>
        <el-form-item label="兑换规则" prop="ruleId">
          <el-select v-model="exchangeForm.ruleId" placeholder="请选择兑换规则" style="width: 100%;">
            <el-option 
              v-for="rule in activeExchangeRules" 
              :key="rule.id" 
              :label="`${rule.name} (${rule.pointsRequired}积分 → ¥${rule.rewardAmount})`" 
              :value="rule.id" 
              :disabled="exchangeMemberPoints < rule.pointsRequired"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="兑换后积分">
          <span style="font-size: 18px; font-weight: bold; color: #67C23A;">
            {{ exchangeAfterPoints }}
          </span>
        </el-form-item>
        <el-form-item label="获得金额">
          <span style="font-size: 18px; font-weight: bold; color: #E6A23C;">
            ¥{{ selectedRule?.rewardAmount || 0 }}
          </span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="exchangeDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="exchangeSubmitting" @click="submitExchange">确认兑换</el-button>
      </template>
    </el-dialog>

    <!-- 兑换规则管理对话框 -->
    <el-dialog v-model="ruleDialogVisible" title="兑换规则管理" width="700px">
      <div class="rule-toolbar">
        <el-button type="primary" @click="showRuleEditDialog()">新增规则</el-button>
      </div>
      <el-table :data="allRules" stripe>
        <el-table-column prop="name" label="规则名称" />
        <el-table-column prop="pointsRequired" label="所需积分" />
        <el-table-column prop="rewardAmount" label="奖励金额">
          <template #default="{ row }">¥{{ row.rewardAmount }}</template>
        </el-table-column>
        <el-table-column prop="isActive" label="状态">
          <template #default="{ row }">
            <el-switch v-model="row.isActive" @change="toggleRuleStatus(row)" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button link @click="showRuleEditDialog(row)">编辑</el-button>
            <el-button link type="danger" @click="deleteRule(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <!-- 规则编辑对话框 -->
    <el-dialog v-model="ruleEditDialogVisible" :title="isEditRule ? '编辑规则' : '新增规则'" width="400px">
      <el-form :model="ruleForm" label-width="100px">
        <el-form-item label="规则名称">
          <el-input v-model="ruleForm.name" placeholder="如：100积分兑换10元" />
        </el-form-item>
        <el-form-item label="所需积分">
          <el-input-number v-model="ruleForm.pointsRequired" :min="1" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="奖励金额">
          <el-input-number v-model="ruleForm.rewardAmount" :min="1" :precision="2" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="启用">
          <el-switch v-model="ruleForm.isActive" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="ruleEditDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="ruleSubmitting" @click="saveRule">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'

const API_BASE = 'http://localhost:3000/api'
const token = localStorage.getItem('token') || ''

const typeMap: Record<string, { label: string; type: string }> = {
  earn: { label: '获得', type: 'success' },
  spend: { label: '消费', type: 'warning' },
  exchange: { label: '兑换', type: 'danger' },
  adjust: { label: '调整', type: 'info' },
  expire: { label: '过期', type: 'info' }
}

const loading = ref(false)
const adjustSubmitting = ref(false)
const exchangeSubmitting = ref(false)
const ruleSubmitting = ref(false)

const overview = ref({
  totalIssued: 0,
  totalUsed: 0,
  totalBalance: 0,
  monthIssued: 0,
  monthUsed: 0
})

const records = ref<any[]>([])
const exchangeRules = ref<any[]>([])
const allRules = ref<any[]>([])
const memberOptions = ref<any[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)

const searchMemberId = ref('')
const searchType = ref('')
const searchDateRange = ref<[Date, Date] | null>(null)

const adjustDialogVisible = ref(false)
const exchangeDialogVisible = ref(false)
const ruleDialogVisible = ref(false)
const ruleEditDialogVisible = ref(false)
const isEditRule = ref(false)
const editRuleId = ref('')

const adjustFormRef = ref<FormInstance>()
const exchangeFormRef = ref<FormInstance>()

const adjustForm = ref({
  memberId: '',
  adjustType: 'add',
  points: 1,
  reason: ''
})

const exchangeForm = ref({
  memberId: '',
  ruleId: ''
})

const ruleForm = ref({
  name: '',
  pointsRequired: 100,
  rewardAmount: 10,
  isActive: true
})

const adjustRules: FormRules = {
  memberId: [{ required: true, message: '请选择会员', trigger: 'change' }],
  adjustType: [{ required: true, message: '请选择调整类型', trigger: 'change' }],
  points: [{ required: true, message: '请输入积分', trigger: 'blur' }],
  reason: [{ required: true, message: '请输入调整原因', trigger: 'blur' }]
}

const exchangeRulesForm: FormRules = {
  memberId: [{ required: true, message: '请选择会员', trigger: 'change' }],
  ruleId: [{ required: true, message: '请选择兑换规则', trigger: 'change' }]
}

const selectedMemberPoints = computed(() => {
  const member = memberOptions.value.find(m => m.id === adjustForm.value.memberId)
  return member?.points || 0
})

const exchangeMemberPoints = computed(() => {
  const member = memberOptions.value.find(m => m.id === exchangeForm.value.memberId)
  return member?.points || 0
})

const activeExchangeRules = computed(() => {
  return exchangeRules.value.filter(r => r.isActive)
})

const selectedRule = computed(() => {
  return exchangeRules.value.find(r => r.id === exchangeForm.value.ruleId)
})

const exchangeAfterPoints = computed(() => {
  if (!selectedRule.value) return exchangeMemberPoints.value
  return exchangeMemberPoints.value - selectedRule.value.pointsRequired
})

const loadOverview = async () => {
  try {
    const res = await fetch(`${API_BASE}/points/overview`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    overview.value = await res.json()
  } catch (e) {
    console.error('加载概览失败')
  }
}

const loadRecords = async () => {
  loading.value = true
  try {
    const params = new URLSearchParams({
      page: currentPage.value.toString(),
      pageSize: pageSize.value.toString()
    })
    if (searchMemberId.value) params.append('memberId', searchMemberId.value)
    if (searchType.value) params.append('type', searchType.value)
    if (searchDateRange.value) {
      params.append('startDate', searchDateRange.value[0].toISOString())
      params.append('endDate', searchDateRange.value[1].toISOString())
    }
    
    const res = await fetch(`${API_BASE}/points/records?${params}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const data = await res.json()
    records.value = data.list || data
    total.value = data.total || records.value.length
  } catch (e) {
    ElMessage.error('加载流水失败')
  } finally {
    loading.value = false
  }
}

const loadExchangeRules = async () => {
  try {
    const res = await fetch(`${API_BASE}/points/exchange-rules`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    exchangeRules.value = await res.json()
  } catch (e) {
    console.error('加载兑换规则失败')
  }
}

const searchMembers = async (query: string) => {
  if (!query) {
    memberOptions.value = []
    return
  }
  try {
    const res = await fetch(`${API_BASE}/members?keyword=${encodeURIComponent(query)}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    memberOptions.value = await res.json()
  } catch (e) {
    console.error('搜索会员失败')
  }
}

const resetSearch = () => {
  searchMemberId.value = ''
  searchType.value = ''
  searchDateRange.value = null
  currentPage.value = 1
  loadRecords()
}

const showAdjustDialog = () => {
  adjustForm.value = {
    memberId: '',
    adjustType: 'add',
    points: 1,
    reason: ''
  }
  memberOptions.value = []
  adjustDialogVisible.value = true
}

const submitAdjust = async () => {
  if (!adjustFormRef.value) return
  await adjustFormRef.value.validate(async (valid) => {
    if (!valid) return
    
    adjustSubmitting.value = true
    try {
      const points = adjustForm.value.adjustType === 'add' 
        ? adjustForm.value.points 
        : -adjustForm.value.points
      
      const res = await fetch(`${API_BASE}/points/adjust`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          memberId: adjustForm.value.memberId,
          points,
          reason: adjustForm.value.reason
        })
      })
      if (res.ok) {
        ElMessage.success('调整成功')
        adjustDialogVisible.value = false
        loadOverview()
        loadRecords()
      } else {
        const err = await res.json()
        ElMessage.error(err.message || '调整失败')
      }
    } catch (e) {
      ElMessage.error('网络错误')
    } finally {
      adjustSubmitting.value = false
    }
  })
}

const showExchangeDialog = () => {
  exchangeForm.value = {
    memberId: '',
    ruleId: ''
  }
  memberOptions.value = []
  exchangeDialogVisible.value = true
}

const handleExchangeMemberChange = () => {
  exchangeForm.value.ruleId = ''
}

const submitExchange = async () => {
  if (!exchangeFormRef.value) return
  await exchangeFormRef.value.validate(async (valid) => {
    if (!valid) return
    
    if (exchangeAfterPoints.value < 0) {
      ElMessage.warning('积分不足')
      return
    }
    
    exchangeSubmitting.value = true
    try {
      const res = await fetch(`${API_BASE}/points/exchange`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          memberId: exchangeForm.value.memberId,
          ruleId: exchangeForm.value.ruleId
        })
      })
      if (res.ok) {
        ElMessage.success('兑换成功')
        exchangeDialogVisible.value = false
        loadOverview()
        loadRecords()
      } else {
        const err = await res.json()
        ElMessage.error(err.message || '兑换失败')
      }
    } catch (e) {
      ElMessage.error('网络错误')
    } finally {
      exchangeSubmitting.value = false
    }
  })
}

const showRuleDialog = async () => {
  try {
    const res = await fetch(`${API_BASE}/points/exchange-rules`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    allRules.value = await res.json()
    ruleDialogVisible.value = true
  } catch (e) {
    ElMessage.error('加载规则失败')
  }
}

const showRuleEditDialog = (row?: any) => {
  isEditRule.value = !!row
  editRuleId.value = row?.id || ''
  ruleForm.value = row ? {
    name: row.name,
    pointsRequired: row.pointsRequired,
    rewardAmount: row.rewardAmount,
    isActive: row.isActive
  } : {
    name: '',
    pointsRequired: 100,
    rewardAmount: 10,
    isActive: true
  }
  ruleEditDialogVisible.value = true
}

const saveRule = async () => {
  ruleSubmitting.value = true
  try {
    const url = isEditRule.value 
      ? `${API_BASE}/points/exchange-rules/${editRuleId.value}` 
      : `${API_BASE}/points/exchange-rules`
    const method = isEditRule.value ? 'PUT' : 'POST'
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(ruleForm.value)
    })
    if (res.ok) {
      ElMessage.success('保存成功')
      ruleEditDialogVisible.value = false
      showRuleDialog()
      loadExchangeRules()
    } else {
      ElMessage.error('保存失败')
    }
  } catch (e) {
    ElMessage.error('网络错误')
  } finally {
    ruleSubmitting.value = false
  }
}

const toggleRuleStatus = async (row: any) => {
  try {
    await fetch(`${API_BASE}/points/exchange-rules/${row.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ isActive: row.isActive })
    })
    loadExchangeRules()
  } catch (e) {
    ElMessage.error('更新失败')
  }
}

const deleteRule = async (row: any) => {
  try {
    await ElMessageBox.confirm('确定删除该规则？', '提示', { type: 'warning' })
    await fetch(`${API_BASE}/points/exchange-rules/${row.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    })
    showRuleDialog()
    loadExchangeRules()
    ElMessage.success('删除成功')
  } catch (e) {}
}

onMounted(() => {
  loadOverview()
  loadRecords()
  loadExchangeRules()
})
</script>

<style scoped>
.member-points-page {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.overview-card .overview-content {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.overview-item {
  text-align: center;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
}

.overview-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.overview-value {
  font-size: 24px;
  font-weight: bold;
  color: #409EFF;
}

.overview-value.success {
  color: #67C23A;
}

.overview-value.warning {
  color: #E6A23C;
}

.quick-actions {
  display: flex;
  flex-direction: column;
}

.rule-item {
  padding: 12px;
  background: #f5f7fa;
  border-radius: 6px;
  margin-bottom: 8px;
}

.rule-name {
  font-weight: bold;
  margin-bottom: 4px;
}

.rule-info {
  font-size: 12px;
  color: #909399;
}

.search-form {
  margin-bottom: 16px;
}

.rule-toolbar {
  margin-bottom: 16px;
}
</style>
