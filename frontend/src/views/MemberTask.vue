<template>
  <div class="member-task-page">
    <el-row :gutter="20">
      <!-- 左侧：任务管理 -->
      <el-col :span="16">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>任务配置</span>
              <el-button type="primary" @click="showTaskDialog()">新增任务</el-button>
            </div>
          </template>

          <el-tabs v-model="activeTab">
            <!-- 日常任务 -->
            <el-tab-pane label="日常任务" name="daily">
              <el-table :data="dailyTasks" v-loading="loading" stripe>
                <el-table-column prop="name" label="任务名称" min-width="150" />
                <el-table-column prop="description" label="任务描述" min-width="200" />
                <el-table-column prop="type" label="类型" width="100">
                  <template #default="{ row }">
                    <el-tag size="small">{{ taskTypeMap[row.type] || row.type }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="targetValue" label="目标值" width="80" />
                <el-table-column prop="pointsReward" label="积分奖励" width="100">
                  <template #default="{ row }">
                    <span style="color: #E6A23C;">+{{ row.pointsReward }}</span>
                  </template>
                </el-table-column>
                <el-table-column prop="status" label="状态" width="80">
                  <template #default="{ row }">
                    <el-switch v-model="row.isActive" @change="toggleTaskStatus(row, 'daily')" />
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="150">
                  <template #default="{ row }">
                    <el-button link @click="showTaskDialog(row, 'daily')">编辑</el-button>
                    <el-button link type="danger" @click="deleteTask(row, 'daily')">删除</el-button>
                  </template>
                </el-table-column>
              </el-table>
            </el-tab-pane>

            <!-- 成长任务 -->
            <el-tab-pane label="成长任务" name="growth">
              <el-table :data="growthTasks" v-loading="loading" stripe>
                <el-table-column prop="name" label="任务名称" min-width="150" />
                <el-table-column prop="description" label="任务描述" min-width="200" />
                <el-table-column prop="type" label="类型" width="100">
                  <template #default="{ row }">
                    <el-tag size="small" type="success">{{ taskTypeMap[row.type] || row.type }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="targetValue" label="目标值" width="80" />
                <el-table-column prop="pointsReward" label="积分奖励" width="100">
                  <template #default="{ row }">
                    <span style="color: #E6A23C;">+{{ row.pointsReward }}</span>
                  </template>
                </el-table-column>
                <el-table-column prop="status" label="状态" width="80">
                  <template #default="{ row }">
                    <el-switch v-model="row.isActive" @change="toggleTaskStatus(row, 'growth')" />
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="150">
                  <template #default="{ row }">
                    <el-button link @click="showTaskDialog(row, 'growth')">编辑</el-button>
                    <el-button link type="danger" @click="deleteTask(row, 'growth')">删除</el-button>
                  </template>
                </el-table-column>
              </el-table>
            </el-tab-pane>

            <!-- 活动任务 -->
            <el-tab-pane label="活动任务" name="event">
              <el-table :data="eventTasks" v-loading="loading" stripe>
                <el-table-column prop="name" label="任务名称" min-width="150" />
                <el-table-column prop="description" label="任务描述" min-width="180" />
                <el-table-column label="活动时间" width="200">
                  <template #default="{ row }">
                    {{ formatDate(row.startTime) }} ~ {{ formatDate(row.endTime) }}
                  </template>
                </el-table-column>
                <el-table-column prop="pointsReward" label="积分奖励" width="100">
                  <template #default="{ row }">
                    <span style="color: #E6A23C;">+{{ row.pointsReward }}</span>
                  </template>
                </el-table-column>
                <el-table-column prop="status" label="状态" width="80">
                  <template #default="{ row }">
                    <el-tag :type="getEventStatus(row).type" size="small">
                      {{ getEventStatus(row).label }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="150">
                  <template #default="{ row }">
                    <el-button link @click="showTaskDialog(row, 'event')">编辑</el-button>
                    <el-button link type="danger" @click="deleteTask(row, 'event')">删除</el-button>
                  </template>
                </el-table-column>
              </el-table>
            </el-tab-pane>
          </el-tabs>
        </el-card>
      </el-col>

      <!-- 右侧：统计概览 -->
      <el-col :span="8">
        <el-card class="overview-card">
          <template #header>
            <span>任务概览</span>
          </template>
          <div class="overview-content">
            <div class="overview-item">
              <div class="overview-label">总任务数</div>
              <div class="overview-value">{{ overview.totalTasks || 0 }}</div>
            </div>
            <div class="overview-item">
              <div class="overview-label">今日完成</div>
              <div class="overview-value success">{{ overview.todayCompleted || 0 }}</div>
            </div>
            <div class="overview-item">
              <div class="overview-label">本月完成</div>
              <div class="overview-value warning">{{ overview.monthCompleted || 0 }}</div>
            </div>
            <div class="overview-item">
              <div class="overview-label">总发放积分</div>
              <div class="overview-value">{{ overview.totalPointsIssued || 0 }}</div>
            </div>
          </div>
        </el-card>

        <!-- 热门任务 -->
        <el-card style="margin-top: 20px;">
          <template #header>
            <span>热门任务 TOP5</span>
          </template>
          <div v-for="(item, index) in hotTasks" :key="item.id" class="hot-item">
            <div class="hot-rank" :class="{ top: index < 3 }">{{ index + 1 }}</div>
            <div class="hot-info">
              <div class="hot-name">{{ item.name }}</div>
              <div class="hot-count">完成 {{ item.completedCount }} 次</div>
            </div>
          </div>
          <el-empty v-if="!hotTasks.length" description="暂无数据" :image-size="60" />
        </el-card>
      </el-col>
    </el-row>

    <!-- 完成统计 -->
    <el-card style="margin-top: 20px;">
      <template #header>
        <div class="card-header">
          <span>完成统计</span>
          <el-button type="primary" @click="exportStats">导出统计</el-button>
        </div>
      </template>

      <el-form :inline="true" class="search-form">
        <el-form-item label="会员">
          <el-select 
            v-model="statsSearchMemberId" 
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
        <el-form-item label="任务类型">
          <el-select v-model="statsSearchType" clearable placeholder="全部" style="width: 120px;">
            <el-option label="签到" value="checkin" />
            <el-option label="消费" value="consume" />
            <el-option label="充值" value="recharge" />
            <el-option label="分享" value="share" />
            <el-option label="评价" value="review" />
            <el-option label="邀请" value="invite" />
          </el-select>
        </el-form-item>
        <el-form-item label="时间">
          <el-date-picker 
            v-model="statsSearchDateRange" 
            type="daterange" 
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 240px;"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadStats">查询</el-button>
          <el-button @click="resetStatsSearch">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="stats" v-loading="statsLoading" stripe>
        <el-table-column prop="completedAt" label="完成时间" width="160">
          <template #default="{ row }">
            {{ new Date(row.completedAt).toLocaleString() }}
          </template>
        </el-table-column>
        <el-table-column prop="memberName" label="会员" width="120">
          <template #default="{ row }">
            {{ row.member?.name || row.memberName }}
          </template>
        </el-table-column>
        <el-table-column prop="taskName" label="任务" min-width="150">
          <template #default="{ row }">
            {{ row.task?.name || row.taskName }}
          </template>
        </el-table-column>
        <el-table-column prop="taskType" label="类型" width="80">
          <template #default="{ row }">
            <el-tag size="small">{{ taskTypeMap[row.taskType] || row.taskType }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="progress" label="进度" width="120">
          <template #default="{ row }">
            {{ row.currentValue || 0 }} / {{ row.targetValue || 1 }}
          </template>
        </el-table-column>
        <el-table-column prop="pointsEarned" label="获得积分" width="100">
          <template #default="{ row }">
            <span style="color: #67C23A;">+{{ row.pointsEarned }}</span>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="statsCurrentPage"
        v-model:page-size="statsPageSize"
        :total="statsTotal"
        :page-sizes="[20, 50, 100]"
        layout="total, sizes, prev, pager, next"
        @size-change="loadStats"
        @current-change="loadStats"
        style="margin-top: 16px; justify-content: flex-end;"
      />
    </el-card>

    <!-- 任务对话框 -->
    <el-dialog v-model="taskDialogVisible" :title="isEditTask ? '编辑任务' : '新增任务'" width="600px">
      <el-form :model="taskForm" label-width="100px" :rules="taskRules" ref="taskFormRef">
        <el-form-item label="任务名称" prop="name">
          <el-input v-model="taskForm.name" placeholder="请输入任务名称" />
        </el-form-item>
        <el-form-item label="任务类型" prop="type">
          <el-select v-model="taskForm.type" placeholder="请选择类型" style="width: 100%;">
            <el-option label="签到" value="checkin" />
            <el-option label="消费" value="consume" />
            <el-option label="充值" value="recharge" />
            <el-option label="分享" value="share" />
            <el-option label="评价" value="review" />
            <el-option label="邀请" value="invite" />
            <el-option label="自定义" value="custom" />
          </el-select>
        </el-form-item>
        <el-form-item label="任务分类" prop="category">
          <el-radio-group v-model="taskForm.category">
            <el-radio value="daily">日常任务</el-radio>
            <el-radio value="growth">成长任务</el-radio>
            <el-radio value="event">活动任务</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="任务描述" prop="description">
          <el-input v-model="taskForm.description" type="textarea" :rows="2" placeholder="请输入任务描述" />
        </el-form-item>
        <el-form-item label="目标值" prop="targetValue">
          <el-input-number v-model="taskForm.targetValue" :min="1" style="width: 100%;" />
          <div class="form-tip">如：消费满3次，目标值为3</div>
        </el-form-item>
        <el-form-item label="积分奖励" prop="pointsReward">
          <el-input-number v-model="taskForm.pointsReward" :min="1" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="每日上限" v-if="taskForm.category === 'daily'">
          <el-input-number v-model="taskForm.dailyLimit" :min="1" style="width: 100%;" />
          <div class="form-tip">每天最多完成次数</div>
        </el-form-item>
        <el-form-item label="活动时间" v-if="taskForm.category === 'event'">
          <el-date-picker 
            v-model="taskForm.eventDateRange" 
            type="datetimerange" 
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            style="width: 100%;"
          />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="taskForm.sort" :min="0" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="启用">
          <el-switch v-model="taskForm.isActive" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="taskDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="taskSubmitting" @click="saveTask">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'

const API_BASE = 'http://localhost:3000/api'
const token = localStorage.getItem('token') || ''

const taskTypeMap: Record<string, string> = {
  checkin: '签到',
  consume: '消费',
  recharge: '充值',
  share: '分享',
  review: '评价',
  invite: '邀请',
  custom: '自定义'
}

const loading = ref(false)
const statsLoading = ref(false)
const taskSubmitting = ref(false)

const activeTab = ref('daily')

const dailyTasks = ref<any[]>([])
const growthTasks = ref<any[]>([])
const eventTasks = ref<any[]>([])
const stats = ref<any[]>([])
const memberOptions = ref<any[]>([])
const hotTasks = ref<any[]>([])

const statsTotal = ref(0)
const statsCurrentPage = ref(1)
const statsPageSize = ref(20)

const statsSearchMemberId = ref('')
const statsSearchType = ref('')
const statsSearchDateRange = ref<[Date, Date] | null>(null)

const taskDialogVisible = ref(false)
const isEditTask = ref(false)
const editTaskId = ref('')
const editTaskCategory = ref('daily')

const taskFormRef = ref<FormInstance>()

const overview = ref({
  totalTasks: 0,
  todayCompleted: 0,
  monthCompleted: 0,
  totalPointsIssued: 0
})

const taskForm = ref({
  name: '',
  type: 'checkin',
  category: 'daily',
  description: '',
  targetValue: 1,
  pointsReward: 10,
  dailyLimit: 1,
  eventDateRange: null as [Date, Date] | null,
  sort: 0,
  isActive: true
})

const taskRules: FormRules = {
  name: [{ required: true, message: '请输入任务名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择任务类型', trigger: 'change' }],
  category: [{ required: true, message: '请选择任务分类', trigger: 'change' }],
  targetValue: [{ required: true, message: '请输入目标值', trigger: 'blur' }],
  pointsReward: [{ required: true, message: '请输入积分奖励', trigger: 'blur' }]
}

const formatDate = (date: string) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString()
}

const getEventStatus = (row: any) => {
  const now = new Date()
  const start = new Date(row.startTime)
  const end = new Date(row.endTime)
  
  if (now < start) return { label: '未开始', type: 'info' }
  if (now > end) return { label: '已结束', type: 'danger' }
  return { label: '进行中', type: 'success' }
}

// 加载任务列表
const loadTasks = async () => {
  loading.value = true
  try {
    const res = await fetch(`${API_BASE}/member-tasks`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const data = await res.json()
    
    dailyTasks.value = (data.daily || []).filter((t: any) => t.category === 'daily' || !t.category)
    growthTasks.value = (data.growth || []).filter((t: any) => t.category === 'growth')
    eventTasks.value = (data.event || []).filter((t: any) => t.category === 'event')
  } catch (e) {
    ElMessage.error('加载任务失败')
  } finally {
    loading.value = false
  }
}

// 加载概览
const loadOverview = async () => {
  try {
    const res = await fetch(`${API_BASE}/member-tasks/overview`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    overview.value = await res.json()
  } catch (e) {
    console.error('加载概览失败')
  }
}

// 加载热门任务
const loadHotTasks = async () => {
  try {
    const res = await fetch(`${API_BASE}/member-tasks/hot`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    hotTasks.value = await res.json()
  } catch (e) {
    console.error('加载热门任务失败')
  }
}

// 加载完成统计
const loadStats = async () => {
  statsLoading.value = true
  try {
    const params = new URLSearchParams({
      page: statsCurrentPage.value.toString(),
      pageSize: statsPageSize.value.toString()
    })
    if (statsSearchMemberId.value) params.append('memberId', statsSearchMemberId.value)
    if (statsSearchType.value) params.append('type', statsSearchType.value)
    if (statsSearchDateRange.value) {
      params.append('startDate', statsSearchDateRange.value[0].toISOString())
      params.append('endDate', statsSearchDateRange.value[1].toISOString())
    }
    
    const res = await fetch(`${API_BASE}/member-tasks/stats?${params}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const data = await res.json()
    stats.value = data.list || data
    statsTotal.value = data.total || stats.value.length
  } catch (e) {
    ElMessage.error('加载统计失败')
  } finally {
    statsLoading.value = false
  }
}

// 搜索会员
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

const resetStatsSearch = () => {
  statsSearchMemberId.value = ''
  statsSearchType.value = ''
  statsSearchDateRange.value = null
  statsCurrentPage.value = 1
  loadStats()
}

// 显示任务对话框
const showTaskDialog = (row?: any, category: string = 'daily') => {
  isEditTask.value = !!row
  editTaskId.value = row?.id || ''
  editTaskCategory.value = category
  
  taskForm.value = row ? {
    name: row.name,
    type: row.type,
    category: row.category || category,
    description: row.description || '',
    targetValue: row.targetValue,
    pointsReward: row.pointsReward,
    dailyLimit: row.dailyLimit || 1,
    eventDateRange: row.startTime && row.endTime 
      ? [new Date(row.startTime), new Date(row.endTime)] 
      : null,
    sort: row.sort || 0,
    isActive: row.isActive
  } : {
    name: '',
    type: 'checkin',
    category: category,
    description: '',
    targetValue: 1,
    pointsReward: 10,
    dailyLimit: 1,
    eventDateRange: null,
    sort: 0,
    isActive: true
  }
  taskDialogVisible.value = true
}

// 保存任务
const saveTask = async () => {
  if (!taskFormRef.value) return
  await taskFormRef.value.validate(async (valid) => {
    if (!valid) return
    
    taskSubmitting.value = true
    try {
      const data: any = {
        name: taskForm.value.name,
        type: taskForm.value.type,
        category: taskForm.value.category,
        description: taskForm.value.description,
        targetValue: taskForm.value.targetValue,
        pointsReward: taskForm.value.pointsReward,
        dailyLimit: taskForm.value.dailyLimit,
        sort: taskForm.value.sort,
        isActive: taskForm.value.isActive
      }
      
      if (taskForm.value.category === 'event' && taskForm.value.eventDateRange) {
        data.startTime = taskForm.value.eventDateRange[0]
        data.endTime = taskForm.value.eventDateRange[1]
      }
      
      const url = isEditTask.value 
        ? `${API_BASE}/member-tasks/${editTaskId.value}` 
        : `${API_BASE}/member-tasks`
      const method = isEditTask.value ? 'PUT' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(data)
      })
      
      if (res.ok) {
        ElMessage.success('保存成功')
        taskDialogVisible.value = false
        loadTasks()
        loadOverview()
      } else {
        const err = await res.json()
        ElMessage.error(err.message || '保存失败')
      }
    } catch (e) {
      ElMessage.error('网络错误')
    } finally {
      taskSubmitting.value = false
    }
  })
}

// 切换任务状态
const toggleTaskStatus = async (row: any, category: string) => {
  try {
    await fetch(`${API_BASE}/member-tasks/${row.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ isActive: row.isActive })
    })
    ElMessage.success(row.isActive ? '已启用' : '已停用')
    loadOverview()
  } catch (e) {
    ElMessage.error('操作失败')
    row.isActive = !row.isActive
  }
}

// 删除任务
const deleteTask = async (row: any, category: string) => {
  try {
    await ElMessageBox.confirm('确定删除该任务？', '提示', { type: 'warning' })
    await fetch(`${API_BASE}/member-tasks/${row.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    })
    ElMessage.success('删除成功')
    loadTasks()
    loadOverview()
  } catch (e) {}
}

// 导出统计
const exportStats = async () => {
  try {
    const params = new URLSearchParams()
    if (statsSearchMemberId.value) params.append('memberId', statsSearchMemberId.value)
    if (statsSearchType.value) params.append('type', statsSearchType.value)
    if (statsSearchDateRange.value) {
      params.append('startDate', statsSearchDateRange.value[0].toISOString())
      params.append('endDate', statsSearchDateRange.value[1].toISOString())
    }
    
    const res = await fetch(`${API_BASE}/member-tasks/stats/export?${params}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const blob = await res.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `任务完成统计_${new Date().toISOString().split('T')[0]}.xlsx`
    a.click()
    window.URL.revokeObjectURL(url)
  } catch (e) {
    ElMessage.error('导出失败')
  }
}

onMounted(() => {
  loadTasks()
  loadOverview()
  loadHotTasks()
  loadStats()
})
</script>

<style scoped>
.member-task-page {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-form {
  margin-bottom: 16px;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
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

.hot-item {
  display: flex;
  align-items: center;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 6px;
  margin-bottom: 8px;
}

.hot-rank {
  width: 24px;
  height: 24px;
  background: #909399;
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  margin-right: 12px;
}

.hot-rank.top {
  background: #E6A23C;
}

.hot-info {
  flex: 1;
}

.hot-name {
  font-weight: bold;
  margin-bottom: 4px;
}

.hot-count {
  font-size: 12px;
  color: #909399;
}
</style>
