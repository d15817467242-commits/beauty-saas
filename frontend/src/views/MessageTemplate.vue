<template>
  <div class="message-template-page">
    <el-tabs v-model="activeTab">
      <!-- 短信模板 -->
      <el-tab-pane label="短信模板" name="sms">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>短信模板管理</span>
              <div>
                <el-button type="success" @click="syncSmsTemplates">同步模板状态</el-button>
                <el-button type="primary" @click="openSmsDialog()">
                  <el-icon><Plus /></el-icon>
                  新建模板
                </el-button>
              </div>
            </div>
          </template>

          <el-table :data="smsTemplates" v-loading="smsLoading" stripe>
            <el-table-column prop="name" label="模板名称" width="180" />
            <el-table-column prop="code" label="模板编码" width="180" />
            <el-table-column prop="type" label="类型" width="100">
              <template #default="{ row }">
                <el-tag>{{ getSmsTypeName(row.type) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="content" label="模板内容" min-width="250" show-overflow-tooltip />
            <el-table-column prop="status" label="审核状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getAuditStatusType(row.status)">
                  {{ getAuditStatusName(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="enabled" label="启用" width="80">
              <template #default="{ row }">
                <el-switch v-model="row.enabled" @change="toggleSmsStatus(row)" />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link @click="openSmsDialog(row)">编辑</el-button>
                <el-button type="danger" link @click="deleteSmsTemplate(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>

      <!-- 微信模板 -->
      <el-tab-pane label="微信模板" name="wechat">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>微信模板消息管理</span>
              <div>
                <el-button type="success" @click="syncWechatTemplates">同步微信模板</el-button>
                <el-button type="primary" @click="openWechatDialog()">
                  <el-icon><Plus /></el-icon>
                  新建模板
                </el-button>
              </div>
            </div>
          </template>

          <el-table :data="wechatTemplates" v-loading="wechatLoading" stripe>
            <el-table-column prop="title" label="模板标题" width="180" />
            <el-table-column prop="templateId" label="模板ID" width="220" show-overflow-tooltip />
            <el-table-column prop="scene" label="使用场景" width="150">
              <template #default="{ row }">
                <el-tag>{{ getSceneName(row.scene) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="content" label="模板内容" min-width="250">
              <template #default="{ row }">
                <el-button type="primary" link @click="previewWechatTemplate(row)">查看内容</el-button>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.status === 'active' ? 'success' : 'danger'">
                  {{ row.status === 'active' ? '可用' : '不可用' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="enabled" label="启用" width="80">
              <template #default="{ row }">
                <el-switch v-model="row.enabled" @change="toggleWechatStatus(row)" />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link @click="openWechatDialog(row)">编辑</el-button>
                <el-button type="danger" link @click="deleteWechatTemplate(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>

      <!-- 消息记录 -->
      <el-tab-pane label="发送记录" name="records">
        <el-card>
          <template #header>
            <span>消息发送记录</span>
          </template>

          <!-- 搜索表单 -->
          <el-form :inline="true" :model="recordSearchForm" class="search-form">
            <el-form-item label="消息类型">
              <el-select v-model="recordSearchForm.type" placeholder="请选择" clearable>
                <el-option label="短信" value="sms" />
                <el-option label="微信" value="wechat" />
              </el-select>
            </el-form-item>
            <el-form-item label="发送状态">
              <el-select v-model="recordSearchForm.status" placeholder="请选择" clearable>
                <el-option label="发送中" value="sending" />
                <el-option label="发送成功" value="success" />
                <el-option label="发送失败" value="failed" />
              </el-select>
            </el-form-item>
            <el-form-item label="时间范围">
              <el-date-picker
                v-model="recordSearchForm.dateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="fetchRecords">搜索</el-button>
              <el-button @click="resetRecordSearch">重置</el-button>
            </el-form-item>
          </el-form>

          <el-table :data="messageRecords" v-loading="recordLoading" stripe>
            <el-table-column prop="type" label="类型" width="80">
              <template #default="{ row }">
                <el-tag :type="row.type === 'sms' ? 'warning' : 'success'">
                  {{ row.type === 'sms' ? '短信' : '微信' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="templateName" label="模板名称" width="150" />
            <el-table-column prop="receiver" label="接收人" width="150" />
            <el-table-column prop="phone" label="手机号" width="130" />
            <el-table-column prop="content" label="消息内容" min-width="200" show-overflow-tooltip />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getSendStatusType(row.status)">
                  {{ getSendStatusName(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="sentAt" label="发送时间" width="180">
              <template #default="{ row }">
                {{ formatDate(row.sentAt) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100" fixed="right">
              <template #default="{ row }">
                <el-button
                  v-if="row.status === 'failed'"
                  type="primary"
                  link
                  @click="resendMessage(row)"
                >
                  重发
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <el-pagination
            v-model:current-page="recordPagination.page"
            v-model:page-size="recordPagination.pageSize"
            :total="recordPagination.total"
            :page-sizes="[20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="fetchRecords"
            @current-change="fetchRecords"
          />
        </el-card>
      </el-tab-pane>

      <!-- 消息统计 -->
      <el-tab-pane label="发送统计" name="statistics">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-card shadow="hover">
              <el-statistic title="今日发送" :value="statistics.todayCount" />
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover">
              <el-statistic title="今日成功率" :value="statistics.todaySuccessRate" suffix="%" />
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover">
              <el-statistic title="本月发送" :value="statistics.monthCount" />
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover">
              <el-statistic title="本月成功率" :value="statistics.monthSuccessRate" suffix="%" />
            </el-card>
          </el-col>
        </el-row>

        <el-row :gutter="20" style="margin-top: 20px">
          <el-col :span="12">
            <el-card>
              <template #header>短信发送趋势</template>
              <div ref="smsChartRef" style="height: 300px"></div>
            </el-card>
          </el-col>
          <el-col :span="12">
            <el-card>
              <template #header>微信发送趋势</template>
              <div ref="wechatChartRef" style="height: 300px"></div>
            </el-card>
          </el-col>
        </el-row>
      </el-tab-pane>
    </el-tabs>

    <!-- 短信模板弹窗 -->
    <el-dialog v-model="smsDialogVisible" :title="smsForm.id ? '编辑短信模板' : '新建短信模板'" width="600px">
      <el-form :model="smsForm" :rules="smsRules" ref="smsFormRef" label-width="100px">
        <el-form-item label="模板名称" prop="name">
          <el-input v-model="smsForm.name" placeholder="请输入模板名称" />
        </el-form-item>
        <el-form-item label="模板编码" prop="code">
          <el-input v-model="smsForm.code" placeholder="请输入模板编码" :disabled="!!smsForm.id" />
        </el-form-item>
        <el-form-item label="模板类型" prop="type">
          <el-select v-model="smsForm.type" placeholder="请选择类型">
            <el-option label="验证码" value="verify" />
            <el-option label="通知" value="notify" />
            <el-option label="营销" value="marketing" />
          </el-select>
        </el-form-item>
        <el-form-item label="模板内容" prop="content">
          <el-input
            v-model="smsForm.content"
            type="textarea"
            :rows="4"
            placeholder="请输入模板内容，变量使用 ${变量名} 格式"
          />
          <div class="template-tips">
            <p>可用变量：</p>
            <el-tag v-for="v in smsVariables" :key="v" style="margin-right: 5px; cursor: pointer" @click="insertSmsVariable(v)">
              ${`{${v}}`}
            </el-tag>
          </div>
        </el-form-item>
        <el-form-item label="短信签名">
          <el-input v-model="smsForm.sign" placeholder="请输入短信签名" />
        </el-form-item>
        <el-form-item label="是否启用">
          <el-switch v-model="smsForm.enabled" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="smsForm.remark" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="smsDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveSmsTemplate" :loading="savingSms">保存</el-button>
      </template>
    </el-dialog>

    <!-- 微信模板弹窗 -->
    <el-dialog v-model="wechatDialogVisible" :title="wechatForm.id ? '编辑微信模板' : '新建微信模板'" width="700px">
      <el-form :model="wechatForm" :rules="wechatRules" ref="wechatFormRef" label-width="100px">
        <el-form-item label="模板标题" prop="title">
          <el-input v-model="wechatForm.title" placeholder="请输入模板标题" />
        </el-form-item>
        <el-form-item label="模板ID" prop="templateId">
          <el-input v-model="wechatForm.templateId" placeholder="请输入微信模板ID" />
        </el-form-item>
        <el-form-item label="使用场景" prop="scene">
          <el-select v-model="wechatForm.scene" placeholder="请选择场景">
            <el-option label="预约提醒" value="appointment" />
            <el-option label="消费通知" value="consumption" />
            <el-option label="会员充值" value="recharge" />
            <el-option label="积分变动" value="points" />
            <el-option label="生日祝福" value="birthday" />
            <el-option label="优惠券提醒" value="coupon" />
          </el-select>
        </el-form-item>
        <el-form-item label="模板内容">
          <div class="wechat-template-editor">
            <div v-for="(item, index) in wechatForm.dataItems" :key="index" class="data-item">
              <el-input v-model="item.key" placeholder="字段名" style="width: 150px" />
              <el-input v-model="item.value" placeholder="示例值" style="flex: 1; margin: 0 10px" />
              <el-color-picker v-model="item.color" />
              <el-button type="danger" link @click="removeWechatDataItem(index)">删除</el-button>
            </div>
            <el-button type="primary" link @click="addWechatDataItem">添加字段</el-button>
          </div>
        </el-form-item>
        <el-form-item label="跳转页面">
          <el-input v-model="wechatForm.page" placeholder="点击跳转的小程序页面路径" />
        </el-form-item>
        <el-form-item label="是否启用">
          <el-switch v-model="wechatForm.enabled" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="wechatDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveWechatTemplate" :loading="savingWechat">保存</el-button>
      </template>
    </el-dialog>

    <!-- 微信模板预览弹窗 -->
    <el-dialog v-model="wechatPreviewVisible" title="模板内容预览" width="500px">
      <div class="wechat-preview">
        <div class="wechat-header">{{ wechatPreviewData.title }}</div>
        <div class="wechat-body">
          <div v-for="(item, index) in wechatPreviewData.items" :key="index" class="wechat-item">
            <span class="label">{{ item.key }}:</span>
            <span class="value" :style="{ color: item.color }">{{ item.value }}</span>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import axios from 'axios'

const activeTab = ref('sms')
const smsLoading = ref(false)
const wechatLoading = ref(false)
const recordLoading = ref(false)
const savingSms = ref(false)
const savingWechat = ref(false)
const smsDialogVisible = ref(false)
const wechatDialogVisible = ref(false)
const wechatPreviewVisible = ref(false)

const smsTemplates = ref([])
const wechatTemplates = ref([])
const messageRecords = ref([])
const wechatPreviewData = ref({ title: '', items: [] })

const smsFormRef = ref()
const wechatFormRef = ref()
const smsChartRef = ref()
const wechatChartRef = ref()

const smsForm = reactive({
  id: '',
  name: '',
  code: '',
  type: 'notify',
  content: '',
  sign: '',
  enabled: true,
  remark: '',
})

const wechatForm = reactive({
  id: '',
  title: '',
  templateId: '',
  scene: 'appointment',
  dataItems: [] as Array<{ key: string; value: string; color: string }>,
  page: '',
  enabled: true,
})

const recordSearchForm = reactive({
  type: '',
  status: '',
  dateRange: [],
})

const recordPagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0,
})

const statistics = reactive({
  todayCount: 0,
  todaySuccessRate: 0,
  monthCount: 0,
  monthSuccessRate: 0,
})

const smsRules = {
  name: [{ required: true, message: '请输入模板名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入模板编码', trigger: 'blur' }],
  type: [{ required: true, message: '请选择模板类型', trigger: 'change' }],
  content: [{ required: true, message: '请输入模板内容', trigger: 'blur' }],
}

const wechatRules = {
  title: [{ required: true, message: '请输入模板标题', trigger: 'blur' }],
  templateId: [{ required: true, message: '请输入模板ID', trigger: 'blur' }],
  scene: [{ required: true, message: '请选择使用场景', trigger: 'change' }],
}

const smsVariables = ['code', 'name', 'time', 'date', 'amount', 'store', 'service']

const smsTypeMap = {
  verify: '验证码',
  notify: '通知',
  marketing: '营销',
}

const getSmsTypeName = (type: string) => smsTypeMap[type] || type

const auditStatusMap = {
  pending: { name: '审核中', type: 'warning' },
  approved: { name: '已通过', type: 'success' },
  rejected: { name: '已拒绝', type: 'danger' },
}

const getAuditStatusName = (status: string) => auditStatusMap[status]?.name || status
const getAuditStatusType = (status: string) => auditStatusMap[status]?.type || 'info'

const sceneMap = {
  appointment: '预约提醒',
  consumption: '消费通知',
  recharge: '会员充值',
  points: '积分变动',
  birthday: '生日祝福',
  coupon: '优惠券提醒',
}

const getSceneName = (scene: string) => sceneMap[scene] || scene

const sendStatusMap = {
  sending: { name: '发送中', type: 'warning' },
  success: { name: '发送成功', type: 'success' },
  failed: { name: '发送失败', type: 'danger' },
}

const getSendStatusName = (status: string) => sendStatusMap[status]?.name || status
const getSendStatusType = (status: string) => sendStatusMap[status]?.type || 'info'

const formatDate = (date: string) => {
  return new Date(date).toLocaleString('zh-CN')
}

// 短信模板
const fetchSmsTemplates = async () => {
  smsLoading.value = true
  try {
    const res = await axios.get('/api/sms-templates')
    smsTemplates.value = res.data
  } catch (error) {
    ElMessage.error('获取短信模板失败')
  } finally {
    smsLoading.value = false
  }
}

const openSmsDialog = (template?: any) => {
  if (template) {
    Object.assign(smsForm, template)
  } else {
    Object.assign(smsForm, {
      id: '',
      name: '',
      code: '',
      type: 'notify',
      content: '',
      sign: '',
      enabled: true,
      remark: '',
    })
  }
  smsDialogVisible.value = true
}

const saveSmsTemplate = async () => {
  try {
    await smsFormRef.value.validate()
  } catch {
    return
  }

  savingSms.value = true
  try {
    if (smsForm.id) {
      await axios.put(`/api/sms-templates/${smsForm.id}`, smsForm)
      ElMessage.success('更新成功')
    } else {
      await axios.post('/api/sms-templates', smsForm)
      ElMessage.success('创建成功')
    }
    smsDialogVisible.value = false
    fetchSmsTemplates()
  } catch (error) {
    ElMessage.error('保存失败')
  } finally {
    savingSms.value = false
  }
}

const toggleSmsStatus = async (template: any) => {
  try {
    await axios.put(`/api/sms-templates/${template.id}`, { enabled: template.enabled })
    ElMessage.success('状态更新成功')
  } catch (error) {
    template.enabled = !template.enabled
    ElMessage.error('更新失败')
  }
}

const deleteSmsTemplate = async (template: any) => {
  try {
    await ElMessageBox.confirm('确定要删除此模板吗？', '提示', { type: 'warning' })
    await axios.delete(`/api/sms-templates/${template.id}`)
    ElMessage.success('删除成功')
    fetchSmsTemplates()
  } catch (error) {
    // 取消操作
  }
}

const syncSmsTemplates = async () => {
  try {
    await axios.post('/api/sms-templates/sync')
    ElMessage.success('同步成功')
    fetchSmsTemplates()
  } catch (error) {
    ElMessage.error('同步失败')
  }
}

const insertSmsVariable = (variable: string) => {
  smsForm.content += `\${${variable}}`
}

// 微信模板
const fetchWechatTemplates = async () => {
  wechatLoading.value = true
  try {
    const res = await axios.get('/api/wechat-templates')
    wechatTemplates.value = res.data
  } catch (error) {
    ElMessage.error('获取微信模板失败')
  } finally {
    wechatLoading.value = false
  }
}

const openWechatDialog = (template?: any) => {
  if (template) {
    Object.assign(wechatForm, {
      ...template,
      dataItems: template.dataItems || [],
    })
  } else {
    Object.assign(wechatForm, {
      id: '',
      title: '',
      templateId: '',
      scene: 'appointment',
      dataItems: [],
      page: '',
      enabled: true,
    })
  }
  wechatDialogVisible.value = true
}

const addWechatDataItem = () => {
  wechatForm.dataItems.push({ key: '', value: '', color: '#173177' })
}

const removeWechatDataItem = (index: number) => {
  wechatForm.dataItems.splice(index, 1)
}

const saveWechatTemplate = async () => {
  try {
    await wechatFormRef.value.validate()
  } catch {
    return
  }

  savingWechat.value = true
  try {
    if (wechatForm.id) {
      await axios.put(`/api/wechat-templates/${wechatForm.id}`, wechatForm)
      ElMessage.success('更新成功')
    } else {
      await axios.post('/api/wechat-templates', wechatForm)
      ElMessage.success('创建成功')
    }
    wechatDialogVisible.value = false
    fetchWechatTemplates()
  } catch (error) {
    ElMessage.error('保存失败')
  } finally {
    savingWechat.value = false
  }
}

const toggleWechatStatus = async (template: any) => {
  try {
    await axios.put(`/api/wechat-templates/${template.id}`, { enabled: template.enabled })
    ElMessage.success('状态更新成功')
  } catch (error) {
    template.enabled = !template.enabled
    ElMessage.error('更新失败')
  }
}

const deleteWechatTemplate = async (template: any) => {
  try {
    await ElMessageBox.confirm('确定要删除此模板吗？', '提示', { type: 'warning' })
    await axios.delete(`/api/wechat-templates/${template.id}`)
    ElMessage.success('删除成功')
    fetchWechatTemplates()
  } catch (error) {
    // 取消操作
  }
}

const syncWechatTemplates = async () => {
  try {
    await axios.post('/api/wechat-templates/sync')
    ElMessage.success('同步成功')
    fetchWechatTemplates()
  } catch (error) {
    ElMessage.error('同步失败')
  }
}

const previewWechatTemplate = (template: any) => {
  wechatPreviewData.value = {
    title: template.title,
    items: template.dataItems || [],
  }
  wechatPreviewVisible.value = true
}

// 消息记录
const fetchRecords = async () => {
  recordLoading.value = true
  try {
    const params: any = {
      page: recordPagination.page,
      pageSize: recordPagination.pageSize,
      type: recordSearchForm.type,
      status: recordSearchForm.status,
    }
    
    if (recordSearchForm.dateRange?.length === 2) {
      params.startDate = recordSearchForm.dateRange[0]
      params.endDate = recordSearchForm.dateRange[1]
    }
    
    const res = await axios.get('/api/message-records', { params })
    messageRecords.value = res.data.list
    recordPagination.total = res.data.total
  } catch (error) {
    ElMessage.error('获取记录失败')
  } finally {
    recordLoading.value = false
  }
}

const resetRecordSearch = () => {
  recordSearchForm.type = ''
  recordSearchForm.status = ''
  recordSearchForm.dateRange = []
  recordPagination.page = 1
  fetchRecords()
}

const resendMessage = async (record: any) => {
  try {
    await axios.post(`/api/message-records/${record.id}/resend`)
    ElMessage.success('重发成功')
    fetchRecords()
  } catch (error) {
    ElMessage.error('重发失败')
  }
}

// 统计
const fetchStatistics = async () => {
  try {
    const res = await axios.get('/api/message-statistics')
    Object.assign(statistics, res.data)
  } catch (error) {
    console.error('获取统计失败', error)
  }
}

onMounted(() => {
  fetchSmsTemplates()
  fetchWechatTemplates()
  fetchRecords()
  fetchStatistics()
})
</script>

<style scoped>
.message-template-page {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-form {
  margin-bottom: 20px;
}

.template-tips {
  margin-top: 10px;
  font-size: 12px;
  color: #909399;
}

.template-tips p {
  margin-bottom: 5px;
}

.wechat-template-editor .data-item {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.wechat-preview {
  background: #f5f5f5;
  border-radius: 8px;
  overflow: hidden;
}

.wechat-header {
  background: #07c160;
  color: white;
  padding: 15px;
  font-size: 16px;
  font-weight: bold;
}

.wechat-body {
  background: white;
  padding: 15px;
}

.wechat-item {
  margin-bottom: 10px;
}

.wechat-item .label {
  color: #909399;
  margin-right: 10px;
}

.wechat-item .value {
  color: #173177;
}

.el-pagination {
  margin-top: 20px;
  justify-content: flex-end;
}
</style>
