<template>
  <div class="payment-config-page">
    <el-tabs v-model="activeTab">
      <!-- 支付方式配置 -->
      <el-tab-pane label="支付方式" name="methods">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>支付方式配置</span>
              <el-button type="primary" @click="openMethodDialog()">
                <el-icon><Plus /></el-icon>
                添加支付方式
              </el-button>
            </div>
          </template>

          <el-table :data="paymentMethods" v-loading="loading" stripe>
            <el-table-column prop="name" label="支付方式名称" width="180" />
            <el-table-column prop="code" label="编码" width="120" />
            <el-table-column prop="type" label="类型" width="120">
              <template #default="{ row }">
                <el-tag :type="getTypeTag(row.type)">
                  {{ getTypeName(row.type) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="feeRate" label="手续费率" width="120">
              <template #default="{ row }">
                {{ row.feeRate ? `${(row.feeRate * 100).toFixed(2)}%` : '无' }}
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-switch v-model="row.status" @change="toggleMethodStatus(row)" />
              </template>
            </el-table-column>
            <el-table-column prop="sort" label="排序" width="80" />
            <el-table-column label="操作" width="150" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link @click="openMethodDialog(row)">编辑</el-button>
                <el-button type="danger" link @click="deleteMethod(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>

      <!-- 支付渠道管理 -->
      <el-tab-pane label="支付渠道" name="channels">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>支付渠道管理</span>
              <el-button type="primary" @click="openChannelDialog()">
                <el-icon><Plus /></el-icon>
                添加支付渠道
              </el-button>
            </div>
          </template>

          <el-table :data="paymentChannels" v-loading="channelLoading" stripe>
            <el-table-column prop="name" label="渠道名称" width="180" />
            <el-table-column prop="provider" label="服务商" width="150">
              <template #default="{ row }">
                <el-tag>{{ getProviderName(row.provider) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="merchantId" label="商户号" width="200" />
            <el-table-column prop="appId" label="应用ID" width="200" show-overflow-tooltip />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.status === 'active' ? 'success' : 'danger'">
                  {{ row.status === 'active' ? '启用' : '禁用' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="isDefault" label="默认渠道" width="100">
              <template #default="{ row }">
                <el-tag v-if="row.isDefault" type="success">是</el-tag>
                <el-tag v-else type="info">否</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link @click="openChannelDialog(row)">编辑</el-button>
                <el-button type="success" link @click="testChannel(row)">测试</el-button>
                <el-button type="danger" link @click="deleteChannel(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>

      <!-- 支付记录 -->
      <el-tab-pane label="支付记录" name="records">
        <el-card>
          <template #header>
            <span>支付记录</span>
          </template>

          <!-- 搜索表单 -->
          <el-form :inline="true" :model="recordSearchForm" class="search-form">
            <el-form-item label="支付方式">
              <el-select v-model="recordSearchForm.paymentMethod" placeholder="请选择" clearable>
                <el-option
                  v-for="method in paymentMethods"
                  :key="method.id"
                  :label="method.name"
                  :value="method.code"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="支付状态">
              <el-select v-model="recordSearchForm.status" placeholder="请选择" clearable>
                <el-option label="待支付" value="pending" />
                <el-option label="已支付" value="paid" />
                <el-option label="已退款" value="refunded" />
                <el-option label="已取消" value="cancelled" />
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

          <el-table :data="paymentRecords" v-loading="recordLoading" stripe>
            <el-table-column prop="orderNo" label="订单号" width="200" />
            <el-table-column prop="transactionId" label="交易号" width="220" />
            <el-table-column prop="amount" label="金额" width="120">
              <template #default="{ row }">
                <span class="amount">¥{{ row.amount.toFixed(2) }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="paymentMethod" label="支付方式" width="120" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getRecordStatusType(row.status)">
                  {{ getRecordStatusName(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="memberName" label="会员" width="120" />
            <el-table-column prop="createdAt" label="支付时间" width="180">
              <template #default="{ row }">
                {{ formatDate(row.createdAt) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link @click="viewRecordDetail(row)">详情</el-button>
                <el-button
                  v-if="row.status === 'paid'"
                  type="warning"
                  link
                  @click="refundRecord(row)"
                >
                  退款
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

      <!-- 支付统计 -->
      <el-tab-pane label="支付统计" name="statistics">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-card shadow="hover">
              <el-statistic title="今日支付金额" :value="statistics.todayAmount" :precision="2" prefix="¥" />
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover">
              <el-statistic title="今日支付笔数" :value="statistics.todayCount" />
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover">
              <el-statistic title="本月支付金额" :value="statistics.monthAmount" :precision="2" prefix="¥" />
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover">
              <el-statistic title="本月支付笔数" :value="statistics.monthCount" />
            </el-card>
          </el-col>
        </el-row>

        <el-card style="margin-top: 20px">
          <template #header>支付方式分布</template>
          <div ref="methodChartRef" style="height: 300px"></div>
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <!-- 支付方式弹窗 -->
    <el-dialog v-model="methodDialogVisible" :title="editingMethod ? '编辑支付方式' : '添加支付方式'" width="500px">
      <el-form :model="methodForm" :rules="methodRules" ref="methodFormRef" label-width="100px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="methodForm.name" placeholder="请输入支付方式名称" />
        </el-form-item>
        <el-form-item label="编码" prop="code">
          <el-input v-model="methodForm.code" placeholder="请输入编码" :disabled="!!editingMethod" />
        </el-form-item>
        <el-form-item label="类型" prop="type">
          <el-select v-model="methodForm.type" placeholder="请选择类型">
            <el-option label="现金" value="cash" />
            <el-option label="微信支付" value="wechat" />
            <el-option label="支付宝" value="alipay" />
            <el-option label="银行卡" value="card" />
            <el-option label="储值卡" value="stored_value" />
            <el-option label="积分抵扣" value="points" />
          </el-select>
        </el-form-item>
        <el-form-item label="手续费率">
          <el-input-number v-model="methodForm.feeRate" :min="0" :max="1" :step="0.001" :precision="4" />
          <span style="margin-left: 10px">%</span>
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="methodForm.sort" :min="0" />
        </el-form-item>
        <el-form-item label="是否启用">
          <el-switch v-model="methodForm.status" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="methodForm.remark" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="methodDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveMethod" :loading="savingMethod">保存</el-button>
      </template>
    </el-dialog>

    <!-- 支付渠道弹窗 -->
    <el-dialog v-model="channelDialogVisible" :title="editingChannel ? '编辑支付渠道' : '添加支付渠道'" width="600px">
      <el-form :model="channelForm" :rules="channelRules" ref="channelFormRef" label-width="100px">
        <el-form-item label="渠道名称" prop="name">
          <el-input v-model="channelForm.name" placeholder="请输入渠道名称" />
        </el-form-item>
        <el-form-item label="服务商" prop="provider">
          <el-select v-model="channelForm.provider" placeholder="请选择服务商" @change="onProviderChange">
            <el-option label="微信支付" value="wechat" />
            <el-option label="支付宝" value="alipay" />
            <el-option label="银联" value="unionpay" />
            <el-option label="通联支付" value="allinpay" />
          </el-select>
        </el-form-item>
        <el-form-item label="商户号" prop="merchantId">
          <el-input v-model="channelForm.merchantId" placeholder="请输入商户号" />
        </el-form-item>
        <el-form-item label="应用ID" prop="appId">
          <el-input v-model="channelForm.appId" placeholder="请输入应用ID" />
        </el-form-item>
        <el-form-item label="API密钥" prop="apiKey">
          <el-input v-model="channelForm.apiKey" type="password" placeholder="请输入API密钥" show-password />
        </el-form-item>
        <el-form-item label="回调地址">
          <el-input v-model="channelForm.notifyUrl" placeholder="支付回调地址" />
        </el-form-item>
        <el-form-item label="证书路径" v-if="channelForm.provider === 'wechat'">
          <el-input v-model="channelForm.certPath" placeholder="apiclient_cert.pem路径" />
        </el-form-item>
        <el-form-item label="是否默认">
          <el-switch v-model="channelForm.isDefault" />
        </el-form-item>
        <el-form-item label="是否启用">
          <el-switch v-model="channelForm.status" active-value="active" inactive-value="inactive" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="channelDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveChannel" :loading="savingChannel">保存</el-button>
      </template>
    </el-dialog>

    <!-- 支付详情弹窗 -->
    <el-dialog v-model="recordDetailVisible" title="支付详情" width="600px">
      <el-descriptions :column="2" border v-if="currentRecord">
        <el-descriptions-item label="订单号">{{ currentRecord.orderNo }}</el-descriptions-item>
        <el-descriptions-item label="交易号">{{ currentRecord.transactionId }}</el-descriptions-item>
        <el-descriptions-item label="支付金额">
          <span class="amount">¥{{ currentRecord.amount?.toFixed(2) }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="支付方式">{{ currentRecord.paymentMethod }}</el-descriptions-item>
        <el-descriptions-item label="支付状态">
          <el-tag :type="getRecordStatusType(currentRecord.status)">
            {{ getRecordStatusName(currentRecord.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="会员">{{ currentRecord.memberName }}</el-descriptions-item>
        <el-descriptions-item label="支付时间">{{ formatDate(currentRecord.createdAt) }}</el-descriptions-item>
        <el-descriptions-item label="门店">{{ currentRecord.storeName }}</el-descriptions-item>
        <el-descriptions-item label="操作员">{{ currentRecord.operatorName }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ currentRecord.remark || '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import axios from 'axios'

const activeTab = ref('methods')
const loading = ref(false)
const channelLoading = ref(false)
const recordLoading = ref(false)
const savingMethod = ref(false)
const savingChannel = ref(false)
const methodDialogVisible = ref(false)
const channelDialogVisible = ref(false)
const recordDetailVisible = ref(false)
const editingMethod = ref(null)
const editingChannel = ref(null)
const currentRecord = ref(null)
const methodChartRef = ref()

const paymentMethods = ref<any[]>([])
const paymentChannels = ref<any[]>([])
const paymentRecords = ref<any[]>([])

const methodFormRef = ref()
const channelFormRef = ref()

const methodForm = reactive({
  name: '',
  code: '',
  type: 'cash',
  feeRate: 0,
  sort: 0,
  status: true,
  remark: '',
})

const channelForm = reactive({
  name: '',
  provider: 'wechat',
  merchantId: '',
  appId: '',
  apiKey: '',
  notifyUrl: '',
  certPath: '',
  isDefault: false,
  status: 'active',
})

const recordSearchForm = reactive({
  paymentMethod: '',
  status: '',
  dateRange: [],
})

const recordPagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0,
})

const statistics = reactive({
  todayAmount: 0,
  todayCount: 0,
  monthAmount: 0,
  monthCount: 0,
})

const methodRules = {
  name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入编码', trigger: 'blur' }],
  type: [{ required: true, message: '请选择类型', trigger: 'change' }],
}

const channelRules = {
  name: [{ required: true, message: '请输入渠道名称', trigger: 'blur' }],
  provider: [{ required: true, message: '请选择服务商', trigger: 'change' }],
  merchantId: [{ required: true, message: '请输入商户号', trigger: 'blur' }],
  appId: [{ required: true, message: '请输入应用ID', trigger: 'blur' }],
  apiKey: [{ required: true, message: '请输入API密钥', trigger: 'blur' }],
}

const typeMap = {
  cash: { name: '现金', tag: 'success' },
  wechat: { name: '微信支付', tag: 'primary' },
  alipay: { name: '支付宝', tag: 'info' },
  card: { name: '银行卡', tag: 'warning' },
  stored_value: { name: '储值卡', tag: '' },
  points: { name: '积分抵扣', tag: 'danger' },
}

const getTypeName = (type: string) => typeMap[type]?.name || type
const getTypeTag = (type: string) => typeMap[type]?.tag || ''

const providerMap = {
  wechat: '微信支付',
  alipay: '支付宝',
  unionpay: '银联',
  allinpay: '通联支付',
}

const getProviderName = (provider: string) => providerMap[provider] || provider

const recordStatusMap = {
  pending: { name: '待支付', type: 'warning' },
  paid: { name: '已支付', type: 'success' },
  refunded: { name: '已退款', type: 'info' },
  cancelled: { name: '已取消', type: 'danger' },
}

const getRecordStatusName = (status: string) => recordStatusMap[status]?.name || status
const getRecordStatusType = (status: string) => recordStatusMap[status]?.type || 'info'

const formatDate = (date: string) => {
  return new Date(date).toLocaleString('zh-CN')
}

// 支付方式
const fetchMethods = async () => {
  loading.value = true
  try {
    const res = await axios.get('/api/payment-methods')
    paymentMethods.value = res.data
  } catch (error) {
    ElMessage.error('获取支付方式失败')
  } finally {
    loading.value = false
  }
}

const openMethodDialog = (method?: any) => {
  editingMethod.value = method || null
  if (method) {
    Object.assign(methodForm, method)
  } else {
    Object.assign(methodForm, {
      name: '',
      code: '',
      type: 'cash',
      feeRate: 0,
      sort: 0,
      status: true,
      remark: '',
    })
  }
  methodDialogVisible.value = true
}

const saveMethod = async () => {
  try {
    await methodFormRef.value.validate()
  } catch {
    return
  }

  savingMethod.value = true
  try {
    if (editingMethod.value) {
      await axios.put(`/api/payment-methods/${editingMethod.value.id}`, methodForm)
      ElMessage.success('更新成功')
    } else {
      await axios.post('/api/payment-methods', methodForm)
      ElMessage.success('添加成功')
    }
    methodDialogVisible.value = false
    fetchMethods()
  } catch (error) {
    ElMessage.error('保存失败')
  } finally {
    savingMethod.value = false
  }
}

const toggleMethodStatus = async (method: any) => {
  try {
    await axios.put(`/api/payment-methods/${method.id}`, { status: method.status })
    ElMessage.success('状态更新成功')
  } catch (error) {
    method.status = !method.status
    ElMessage.error('更新失败')
  }
}

const deleteMethod = async (method: any) => {
  try {
    await ElMessageBox.confirm('确定要删除此支付方式吗？', '提示', { type: 'warning' })
    await axios.delete(`/api/payment-methods/${method.id}`)
    ElMessage.success('删除成功')
    fetchMethods()
  } catch (error) {
    // 取消操作
  }
}

// 支付渠道
const fetchChannels = async () => {
  channelLoading.value = true
  try {
    const res = await axios.get('/api/payment-channels')
    paymentChannels.value = res.data
  } catch (error) {
    ElMessage.error('获取支付渠道失败')
  } finally {
    channelLoading.value = false
  }
}

const openChannelDialog = (channel?: any) => {
  editingChannel.value = channel || null
  if (channel) {
    Object.assign(channelForm, channel)
  } else {
    Object.assign(channelForm, {
      name: '',
      provider: 'wechat',
      merchantId: '',
      appId: '',
      apiKey: '',
      notifyUrl: '',
      certPath: '',
      isDefault: false,
      status: 'active',
    })
  }
  channelDialogVisible.value = true
}

const onProviderChange = () => {
  const baseUrl = window.location.origin
  channelForm.notifyUrl = `${baseUrl}/api/payment/callback/${channelForm.provider}`
}

const saveChannel = async () => {
  try {
    await channelFormRef.value.validate()
  } catch {
    return
  }

  savingChannel.value = true
  try {
    if (editingChannel.value) {
      await axios.put(`/api/payment-channels/${editingChannel.value.id}`, channelForm)
      ElMessage.success('更新成功')
    } else {
      await axios.post('/api/payment-channels', channelForm)
      ElMessage.success('添加成功')
    }
    channelDialogVisible.value = false
    fetchChannels()
  } catch (error) {
    ElMessage.error('保存失败')
  } finally {
    savingChannel.value = false
  }
}

const testChannel = async (channel: any) => {
  try {
    const res = await axios.post(`/api/payment-channels/${channel.id}/test`)
    ElMessage.success(res.data.message || '测试成功')
  } catch (error) {
    ElMessage.error('测试失败')
  }
}

const deleteChannel = async (channel: any) => {
  try {
    await ElMessageBox.confirm('确定要删除此支付渠道吗？', '提示', { type: 'warning' })
    await axios.delete(`/api/payment-channels/${channel.id}`)
    ElMessage.success('删除成功')
    fetchChannels()
  } catch (error) {
    // 取消操作
  }
}

// 支付记录
const fetchRecords = async () => {
  recordLoading.value = true
  try {
    const params: any = {
      page: recordPagination.page,
      pageSize: recordPagination.pageSize,
      paymentMethod: recordSearchForm.paymentMethod,
      status: recordSearchForm.status,
    }
    
    if (recordSearchForm.dateRange?.length === 2) {
      params.startDate = recordSearchForm.dateRange[0]
      params.endDate = recordSearchForm.dateRange[1]
    }
    
    const res = await axios.get('/api/payment-records', { params })
    paymentRecords.value = res.data.list
    recordPagination.total = res.data.total
  } catch (error) {
    ElMessage.error('获取支付记录失败')
  } finally {
    recordLoading.value = false
  }
}

const resetRecordSearch = () => {
  recordSearchForm.paymentMethod = ''
  recordSearchForm.status = ''
  recordSearchForm.dateRange = []
  recordPagination.page = 1
  fetchRecords()
}

const viewRecordDetail = (record: any) => {
  currentRecord.value = record
  recordDetailVisible.value = true
}

const refundRecord = async (record: any) => {
  try {
    await ElMessageBox.confirm('确定要退款吗？', '提示', { type: 'warning' })
    await axios.post(`/api/payment-records/${record.id}/refund`)
    ElMessage.success('退款成功')
    fetchRecords()
  } catch (error) {
    // 取消操作
  }
}

// 统计
const fetchStatistics = async () => {
  try {
    const res = await axios.get('/api/payment-statistics')
    Object.assign(statistics, res.data)
  } catch (error) {
    console.error('获取统计失败', error)
  }
}

onMounted(() => {
  fetchMethods()
  fetchChannels()
  fetchRecords()
  fetchStatistics()
})
</script>

<style scoped>
.payment-config-page {
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

.amount {
  color: #f56c6c;
  font-weight: bold;
}

.el-pagination {
  margin-top: 20px;
  justify-content: flex-end;
}
</style>
