<template>
  <div class="appointment-reminder-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>预约提醒配置</span>
          <el-button type="primary" @click="handleAddTemplate">新增提醒模板</el-button>
        </div>
      </template>

      <el-tabs v-model="activeTab">
        <!-- 提醒设置 -->
        <el-tab-pane label="提醒设置" name="settings">
          <el-form :model="settingsForm" label-width="140px" style="max-width: 600px">
            <el-form-item label="启用预约提醒">
              <el-switch v-model="settingsForm.enabled" />
            </el-form-item>

            <el-form-item label="提前提醒时间">
              <el-checkbox-group v-model="settingsForm.reminderTimes">
                <el-checkbox label="30">30分钟</el-checkbox>
                <el-checkbox label="60">1小时</el-checkbox>
                <el-checkbox label="120">2小时</el-checkbox>
                <el-checkbox label="1440">1天</el-checkbox>
                <el-checkbox label="2880">2天</el-checkbox>
              </el-checkbox-group>
            </el-form-item>

            <el-form-item label="提醒方式">
              <el-checkbox-group v-model="settingsForm.reminderMethods">
                <el-checkbox label="sms">短信</el-checkbox>
                <el-checkbox label="wechat">微信</el-checkbox>
                <el-checkbox label="app">APP推送</el-checkbox>
              </el-checkbox-group>
            </el-form-item>

            <el-form-item label="客户提醒">
              <el-switch v-model="settingsForm.customerReminder" />
              <span class="form-tip">向客户发送预约提醒</span>
            </el-form-item>

            <el-form-item label="员工提醒">
              <el-switch v-model="settingsForm.employeeReminder" />
              <span class="form-tip">向员工发送预约提醒</span>
            </el-form-item>

            <el-form-item label="自动确认">
              <el-switch v-model="settingsForm.autoConfirm" />
              <span class="form-tip">预约后自动确认</span>
            </el-form-item>

            <el-form-item label="自动取消时间" v-if="!settingsForm.autoConfirm">
              <el-input-number v-model="settingsForm.autoCancelMinutes" :min="0" :max="1440" />
              <span class="form-tip">分钟未确认自动取消（0表示不自动取消）</span>
            </el-form-item>

            <el-form-item label="允许提前到店">
              <el-input-number v-model="settingsForm.earlyArrivalMinutes" :min="0" :max="60" />
              <span class="form-tip">分钟</span>
            </el-form-item>

            <el-form-item label="迟到处理">
              <el-select v-model="settingsForm.lateHandling" style="width: 200px">
                <el-option label="自动取消" value="cancel" />
                <el-option label="转为排队" value="queue" />
                <el-option label="保持预约" value="keep" />
              </el-select>
            </el-form-item>

            <el-form-item>
              <el-button type="primary" :loading="savingSettings" @click="handleSaveSettings">保存设置</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- 提醒模板 -->
        <el-tab-pane label="提醒模板" name="templates">
          <el-table :data="templateList" v-loading="loadingTemplates" stripe>
            <el-table-column prop="name" label="模板名称" width="150" />
            <el-table-column prop="type" label="模板类型" width="120">
              <template #default="{ row }">
                <el-tag :type="templateTypeMap[row.type]?.type">
                  {{ templateTypeMap[row.type]?.label || row.type }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="channel" label="发送渠道" width="100">
              <template #default="{ row }">
                {{ channelMap[row.channel] || row.channel }}
              </template>
            </el-table-column>
            <el-table-column prop="content" label="模板内容" show-overflow-tooltip>
              <template #default="{ row }">
                <div class="template-content">{{ row.content }}</div>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="80">
              <template #default="{ row }">
                <el-switch v-model="row.enabled" @change="handleToggleTemplate(row)" />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150">
              <template #default="{ row }">
                <el-button size="small" @click="handleEditTemplate(row)">编辑</el-button>
                <el-button size="small" type="danger" @click="handleDeleteTemplate(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <!-- 发送记录 -->
        <el-tab-pane label="发送记录" name="logs">
          <div class="filter-bar">
            <el-date-picker
              v-model="logDateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              @change="loadLogs"
            />
            <el-select v-model="logStatus" placeholder="发送状态" clearable style="width: 120px; margin-left: 10px" @change="loadLogs">
              <el-option label="全部" value="" />
              <el-option label="发送成功" value="success" />
              <el-option label="发送失败" value="failed" />
            </el-select>
          </div>

          <el-table :data="logList" v-loading="loadingLogs" stripe style="margin-top: 20px">
            <el-table-column label="接收人" width="150">
              <template #default="{ row }">
                <div>{{ row.recipientName }}</div>
                <div class="phone">{{ row.recipientPhone }}</div>
              </template>
            </el-table-column>
            <el-table-column prop="templateName" label="模板名称" width="150" />
            <el-table-column prop="channel" label="发送渠道" width="100">
              <template #default="{ row }">
                {{ channelMap[row.channel] || row.channel }}
              </template>
            </el-table-column>
            <el-table-column prop="content" label="发送内容" show-overflow-tooltip />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.status === 'success' ? 'success' : 'danger'">
                  {{ row.status === 'success' ? '成功' : '失败' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="发送时间" width="160">
              <template #default="{ row }">
                {{ formatTime(row.sentAt) }}
              </template>
            </el-table-column>
            <el-table-column prop="errorMessage" label="失败原因" show-overflow-tooltip>
              <template #default="{ row }">
                {{ row.errorMessage || '-' }}
              </template>
            </el-table-column>
          </el-table>

          <div class="pagination-container" v-if="logTotal > logPageSize">
            <el-pagination
              v-model:current-page="logCurrentPage"
              :page-size="logPageSize"
              :total="logTotal"
              layout="prev, pager, next"
              @current-change="loadLogs"
            />
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 模板编辑对话框 -->
    <el-dialog v-model="templateDialogVisible" :title="isEditTemplate ? '编辑模板' : '新增模板'" width="600px">
      <el-form :model="templateForm" label-width="100px">
        <el-form-item label="模板名称" required>
          <el-input v-model="templateForm.name" placeholder="请输入模板名称" />
        </el-form-item>

        <el-form-item label="模板类型" required>
          <el-select v-model="templateForm.type" placeholder="选择模板类型" style="width: 100%">
            <el-option label="预约创建提醒" value="created" />
            <el-option label="预约确认提醒" value="confirmed" />
            <el-option label="预约取消提醒" value="cancelled" />
            <el-option label="预约提醒" value="reminder" />
            <el-option label="服务完成提醒" value="completed" />
            <el-option label="评价邀请" value="review_invite" />
          </el-select>
        </el-form-item>

        <el-form-item label="发送渠道" required>
          <el-select v-model="templateForm.channel" placeholder="选择发送渠道" style="width: 100%">
            <el-option label="短信" value="sms" />
            <el-option label="微信" value="wechat" />
            <el-option label="APP推送" value="app" />
          </el-select>
        </el-form-item>

        <el-form-item label="模板内容" required>
          <el-input 
            v-model="templateForm.content" 
            type="textarea" 
            rows="5" 
            placeholder="请输入模板内容"
          />
          <div class="variable-tips">
            <div class="tip-title">可用变量：</div>
            <el-tag v-for="v in availableVariables" :key="v.value" size="small" style="margin: 2px" @click="insertVariable(v.value)">
              {{ v.label }}
            </el-tag>
          </div>
        </el-form-item>

        <el-form-item label="启用状态">
          <el-switch v-model="templateForm.enabled" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="templateDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="savingTemplate" @click="handleSubmitTemplate">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const API_BASE = 'http://localhost:3000/api'
const token = localStorage.getItem('token') || ''

const activeTab = ref('settings')
const savingSettings = ref(false)
const loadingTemplates = ref(false)
const savingTemplate = ref(false)
const loadingLogs = ref(false)
const templateDialogVisible = ref(false)
const isEditTemplate = ref(false)
const editTemplateId = ref('')

const templateTypeMap: Record<string, { label: string; type: string }> = {
  created: { label: '预约创建', type: 'primary' },
  confirmed: { label: '预约确认', type: 'success' },
  cancelled: { label: '预约取消', type: 'danger' },
  reminder: { label: '预约提醒', type: 'warning' },
  completed: { label: '服务完成', type: 'info' },
  review_invite: { label: '评价邀请', type: '' },
}

const channelMap: Record<string, string> = {
  sms: '短信',
  wechat: '微信',
  app: 'APP推送',
}

const availableVariables = [
  { label: '客户姓名', value: '{{customerName}}' },
  { label: '服务项目', value: '{{serviceName}}' },
  { label: '员工姓名', value: '{{employeeName}}' },
  { label: '预约日期', value: '{{appointmentDate}}' },
  { label: '预约时间', value: '{{appointmentTime}}' },
  { label: '门店名称', value: '{{storeName}}' },
  { label: '门店地址', value: '{{storeAddress}}' },
  { label: '门店电话', value: '{{storePhone}}' },
]

const settingsForm = ref({
  enabled: true,
  reminderTimes: ['30', '60'],
  reminderMethods: ['sms', 'wechat'],
  customerReminder: true,
  employeeReminder: true,
  autoConfirm: false,
  autoCancelMinutes: 30,
  earlyArrivalMinutes: 15,
  lateHandling: 'queue',
})

const templateList = ref<any[]>([])
const templateForm = ref({
  name: '',
  type: '',
  channel: 'sms',
  content: '',
  enabled: true,
})

const logList = ref<any[]>([])
const logDateRange = ref<[Date, Date] | null>(null)
const logStatus = ref('')
const logCurrentPage = ref(1)
const logPageSize = 20
const logTotal = ref(0)

const formatTime = (time: string) => {
  if (!time) return ''
  return new Date(time).toLocaleString()
}

const insertVariable = (variable: string) => {
  templateForm.value.content += variable
}

const loadSettings = async () => {
  try {
    const res = await fetch(`${API_BASE}/appointment-reminder/settings`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (res.ok) {
      const data = await res.json()
      settingsForm.value = { ...settingsForm.value, ...data }
    }
  } catch (e) {}
}

const handleSaveSettings = async () => {
  savingSettings.value = true
  try {
    const res = await fetch(`${API_BASE}/appointment-reminder/settings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(settingsForm.value)
    })
    
    if (res.ok) {
      ElMessage.success('保存成功')
    } else {
      ElMessage.error('保存失败')
    }
  } catch (e) {
    ElMessage.error('网络错误')
  } finally {
    savingSettings.value = false
  }
}

const loadTemplates = async () => {
  loadingTemplates.value = true
  try {
    const res = await fetch(`${API_BASE}/appointment-reminder/templates`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    templateList.value = await res.json()
  } catch (e) {
    ElMessage.error('加载模板失败')
  } finally {
    loadingTemplates.value = false
  }
}

const handleAddTemplate = () => {
  isEditTemplate.value = false
  editTemplateId.value = ''
  templateForm.value = {
    name: '',
    type: '',
    channel: 'sms',
    content: '',
    enabled: true,
  }
  templateDialogVisible.value = true
}

const handleEditTemplate = (row: any) => {
  isEditTemplate.value = true
  editTemplateId.value = row.id
  templateForm.value = {
    name: row.name,
    type: row.type,
    channel: row.channel,
    content: row.content,
    enabled: row.enabled,
  }
  templateDialogVisible.value = true
}

const handleToggleTemplate = async (row: any) => {
  try {
    await fetch(`${API_BASE}/appointment-reminder/templates/${row.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ enabled: row.enabled })
    })
    ElMessage.success(row.enabled ? '已启用' : '已禁用')
  } catch (e) {
    row.enabled = !row.enabled
    ElMessage.error('操作失败')
  }
}

const handleDeleteTemplate = async (row: any) => {
  try {
    await ElMessageBox.confirm('确定要删除该模板吗？', '提示', { type: 'warning' })
    const res = await fetch(`${API_BASE}/appointment-reminder/templates/${row.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    })
    if (res.ok) {
      ElMessage.success('删除成功')
      loadTemplates()
    }
  } catch (e) {}
}

const handleSubmitTemplate = async () => {
  if (!templateForm.value.name || !templateForm.value.type || !templateForm.value.content) {
    ElMessage.warning('请填写完整信息')
    return
  }
  
  savingTemplate.value = true
  try {
    const url = isEditTemplate.value 
      ? `${API_BASE}/appointment-reminder/templates/${editTemplateId.value}` 
      : `${API_BASE}/appointment-reminder/templates`
    const method = isEditTemplate.value ? 'PATCH' : 'POST'
    
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(templateForm.value)
    })
    
    if (res.ok) {
      ElMessage.success(isEditTemplate.value ? '修改成功' : '创建成功')
      templateDialogVisible.value = false
      loadTemplates()
    } else {
      const err = await res.json()
      ElMessage.error(err.message || '操作失败')
    }
  } catch (e) {
    ElMessage.error('网络错误')
  } finally {
    savingTemplate.value = false
  }
}

const loadLogs = async () => {
  loadingLogs.value = true
  try {
    const params = new URLSearchParams()
    params.append('page', logCurrentPage.value.toString())
    params.append('pageSize', logPageSize.toString())
    
    if (logDateRange.value) {
      params.append('startDate', logDateRange.value[0].toISOString().split('T')[0])
      params.append('endDate', logDateRange.value[1].toISOString().split('T')[0])
    }
    if (logStatus.value) {
      params.append('status', logStatus.value)
    }

    const res = await fetch(`${API_BASE}/appointment-reminder/logs?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const data = await res.json()
    logList.value = data.list || []
    logTotal.value = data.total || 0
  } catch (e) {
    ElMessage.error('加载记录失败')
  } finally {
    loadingLogs.value = false
  }
}

onMounted(() => {
  loadSettings()
  loadTemplates()
  loadLogs()
})
</script>

<style scoped>
.appointment-reminder-page {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.form-tip {
  margin-left: 10px;
  font-size: 12px;
  color: #909399;
}

.template-content {
  font-size: 13px;
  color: #606266;
  white-space: pre-wrap;
}

.variable-tips {
  margin-top: 10px;
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.tip-title {
  font-size: 12px;
  color: #909399;
  margin-bottom: 8px;
}

.filter-bar {
  display: flex;
  align-items: center;
}

.phone {
  font-size: 12px;
  color: #909399;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}
</style>
