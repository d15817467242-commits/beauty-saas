<template>
  <div class="store-page">
    <!-- 门店列表 -->
    <el-card>
      <template #header>
        <div class="card-header">
          <span>门店管理</span>
          <el-button type="primary" @click="openDialog()">
            <el-icon><Plus /></el-icon>
            添加门店
          </el-button>
        </div>
      </template>

      <!-- 搜索表单 -->
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="门店名称">
          <el-input v-model="searchForm.name" placeholder="请输入门店名称" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择" clearable>
            <el-option label="营业中" value="active" />
            <el-option label="已关闭" value="closed" />
            <el-option label="装修中" value="renovating" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchStores">搜索</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 门店列表 -->
      <el-table :data="stores" v-loading="loading" stripe>
        <el-table-column prop="name" label="门店名称" width="180" />
        <el-table-column prop="code" label="门店编码" width="120" />
        <el-table-column prop="address" label="地址" min-width="200" show-overflow-tooltip />
        <el-table-column prop="phone" label="联系电话" width="140" />
        <el-table-column prop="manager" label="店长" width="100" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusName(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="businessHours" label="营业时间" width="160">
          <template #default="{ row }">
            {{ row.openTime }} - {{ row.closeTime }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="openDialog(row)">编辑</el-button>
            <el-button type="success" link @click="openConfigDialog(row)">配置</el-button>
            <el-button type="danger" link @click="deleteStore(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="fetchStores"
        @current-change="fetchStores"
      />
    </el-card>

    <!-- 添加/编辑门店弹窗 -->
    <el-dialog v-model="dialogVisible" :title="editingStore ? '编辑门店' : '添加门店'" width="600px">
      <el-form :model="storeForm" :rules="storeRules" ref="storeFormRef" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="门店名称" prop="name">
              <el-input v-model="storeForm.name" placeholder="请输入门店名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="门店编码" prop="code">
              <el-input v-model="storeForm.code" placeholder="请输入门店编码" :disabled="!!editingStore" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="门店地址" prop="address">
          <el-input v-model="storeForm.address" placeholder="请输入门店地址" />
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="联系电话" prop="phone">
              <el-input v-model="storeForm.phone" placeholder="请输入联系电话" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="店长" prop="manager">
              <el-select v-model="storeForm.managerId" placeholder="请选择店长" clearable>
                <el-option
                  v-for="emp in employees"
                  :key="emp.id"
                  :label="emp.name"
                  :value="emp.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="营业开始">
              <el-time-picker v-model="storeForm.openTime" placeholder="开始时间" format="HH:mm" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="营业结束">
              <el-time-picker v-model="storeForm.closeTime" placeholder="结束时间" format="HH:mm" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="门店状态">
              <el-select v-model="storeForm.status" placeholder="请选择状态">
                <el-option label="营业中" value="active" />
                <el-option label="已关闭" value="closed" />
                <el-option label="装修中" value="renovating" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="门店类型">
              <el-select v-model="storeForm.type" placeholder="请选择类型">
                <el-option label="直营店" value="direct" />
                <el-option label="加盟店" value="franchise" />
                <el-option label="合作店" value="partner" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="门店简介">
          <el-input v-model="storeForm.description" type="textarea" :rows="3" placeholder="请输入门店简介" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveStore" :loading="saving">保存</el-button>
      </template>
    </el-dialog>

    <!-- 门店配置弹窗 -->
    <el-dialog v-model="configDialogVisible" title="门店配置" width="700px">
      <el-tabs v-model="configTab">
        <el-tab-pane label="基础配置" name="basic">
          <el-form :model="configForm" label-width="120px">
            <el-form-item label="是否启用预约">
              <el-switch v-model="configForm.enableAppointment" />
            </el-form-item>
            <el-form-item label="是否启用排队">
              <el-switch v-model="configForm.enableQueue" />
            </el-form-item>
            <el-form-item label="是否启用会员">
              <el-switch v-model="configForm.enableMember" />
            </el-form-item>
            <el-form-item label="是否启用积分">
              <el-switch v-model="configForm.enablePoints" />
            </el-form-item>
            <el-form-item label="是否启用优惠券">
              <el-switch v-model="configForm.enableCoupon" />
            </el-form-item>
            <el-form-item label="最大预约人数">
              <el-input-number v-model="configForm.maxAppointmentPerDay" :min="0" />
            </el-form-item>
          </el-form>
        </el-tab-pane>
        <el-tab-pane label="支付配置" name="payment">
          <el-form :model="configForm" label-width="120px">
            <el-form-item label="支持现金支付">
              <el-switch v-model="configForm.enableCash" />
            </el-form-item>
            <el-form-item label="支持微信支付">
              <el-switch v-model="configForm.enableWechat" />
            </el-form-item>
            <el-form-item label="支持支付宝">
              <el-switch v-model="configForm.enableAlipay" />
            </el-form-item>
            <el-form-item label="支持银行卡">
              <el-switch v-model="configForm.enableCard" />
            </el-form-item>
          </el-form>
        </el-tab-pane>
        <el-tab-pane label="通知配置" name="notification">
          <el-form :model="configForm" label-width="120px">
            <el-form-item label="预约提醒">
              <el-switch v-model="configForm.appointmentReminder" />
            </el-form-item>
            <el-form-item label="消费提醒">
              <el-switch v-model="configForm.consumptionReminder" />
            </el-form-item>
            <el-form-item label="会员生日提醒">
              <el-switch v-model="configForm.birthdayReminder" />
            </el-form-item>
            <el-form-item label="提醒提前时间">
              <el-input-number v-model="configForm.reminderMinutes" :min="0" />
              <span style="margin-left: 10px">分钟</span>
            </el-form-item>
          </el-form>
        </el-tab-pane>
        <el-tab-pane label="打印配置" name="print">
          <el-form :model="configForm" label-width="120px">
            <el-form-item label="自动打印小票">
              <el-switch v-model="configForm.autoPrintReceipt" />
            </el-form-item>
            <el-form-item label="打印份数">
              <el-input-number v-model="configForm.printCopies" :min="1" :max="5" />
            </el-form-item>
            <el-form-item label="小票打印机">
              <el-select v-model="configForm.receiptPrinter" placeholder="请选择打印机" clearable>
                <el-option v-for="p in printers" :key="p.id" :label="p.name" :value="p.id" />
              </el-select>
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>
      <template #footer>
        <el-button @click="configDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveConfig" :loading="savingConfig">保存配置</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'

const API_BASE = 'http://localhost:3000/api'
const token = localStorage.getItem('token') || ''

const loading = ref(false)
const saving = ref(false)
const savingConfig = ref(false)
const dialogVisible = ref(false)
const configDialogVisible = ref(false)
const editingStore = ref<any>(null)
const configTab = ref('basic')
const stores = ref<any[]>([])
const employees = ref<any[]>([])
const printers = ref<any[]>([])
const storeFormRef = ref()

const searchForm = reactive({
  name: '',
  status: '',
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
})

const storeForm = reactive({
  name: '',
  code: '',
  address: '',
  phone: '',
  managerId: '',
  manager: '',
  openTime: '09:00',
  closeTime: '21:00',
  status: 'active',
  type: 'direct',
  description: '',
})

const configForm = reactive({
  enableAppointment: true,
  enableQueue: true,
  enableMember: true,
  enablePoints: true,
  enableCoupon: true,
  maxAppointmentPerDay: 100,
  enableCash: true,
  enableWechat: true,
  enableAlipay: true,
  enableCard: false,
  appointmentReminder: true,
  consumptionReminder: true,
  birthdayReminder: true,
  reminderMinutes: 30,
  autoPrintReceipt: true,
  printCopies: 1,
  receiptPrinter: '',
})

const storeRules = {
  name: [{ required: true, message: '请输入门店名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入门店编码', trigger: 'blur' }],
  address: [{ required: true, message: '请输入门店地址', trigger: 'blur' }],
  phone: [{ required: true, message: '请输入联系电话', trigger: 'blur' }],
}

const statusMap = {
  active: { name: '营业中', type: 'success' },
  closed: { name: '已关闭', type: 'danger' },
  renovating: { name: '装修中', type: 'warning' },
}

const getStatusName = (status: string) => statusMap[status]?.name || status
const getStatusType = (status: string) => statusMap[status]?.type || 'info'

const fetchStores = async () => {
  loading.value = true
  try {
    const params = new URLSearchParams()
    params.append('page', pagination.page.toString())
    params.append('pageSize', pagination.pageSize.toString())
    if (searchForm.name) params.append('name', searchForm.name)
    if (searchForm.status) params.append('status', searchForm.status)
    
    const res = await fetch(`${API_BASE}/stores?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const data = await res.json()
    stores.value = data.data || data.list || data.records || data.items || data
    pagination.total = data.total || stores.value.length
  } catch (error) {
    ElMessage.error('获取门店列表失败')
  } finally {
    loading.value = false
  }
}

const fetchEmployees = async () => {
  try {
    const res = await fetch(`${API_BASE}/employees`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const data = await res.json()
    employees.value = data.data || data.list || data.records || data.items || data
  } catch (error) {
    console.error('获取员工列表失败', error)
  }
}

const fetchPrinters = async () => {
  try {
    const res = await fetch(`${API_BASE}/printers`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    printers.value = await res.json()
  } catch (error) {
    console.error('获取打印机列表失败', error)
  }
}

const resetSearch = () => {
  searchForm.name = ''
  searchForm.status = ''
  pagination.page = 1
  fetchStores()
}

const openDialog = (store?: any) => {
  editingStore.value = store || null
  if (store) {
    Object.assign(storeForm, {
      name: store.name,
      code: store.code,
      address: store.address,
      phone: store.phone,
      managerId: store.managerId,
      manager: store.manager,
      openTime: store.openTime,
      closeTime: store.closeTime,
      status: store.status,
      type: store.type,
      description: store.description,
    })
  } else {
    Object.assign(storeForm, {
      name: '',
      code: '',
      address: '',
      phone: '',
      managerId: '',
      manager: '',
      openTime: '09:00',
      closeTime: '21:00',
      status: 'active',
      type: 'direct',
      description: '',
    })
  }
  dialogVisible.value = true
}

const saveStore = async () => {
  try {
    await storeFormRef.value.validate()
  } catch {
    return
  }

  saving.value = true
  try {
    const url = editingStore.value ? `${API_BASE}/stores/${editingStore.value.id}` : `${API_BASE}/stores`
    const method = editingStore.value ? 'PUT' : 'POST'
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(storeForm)
    })
    if (res.ok) {
      ElMessage.success(editingStore.value ? '更新成功' : '添加成功')
      dialogVisible.value = false
      fetchStores()
    } else {
      const err = await res.json()
      ElMessage.error(err.message || '保存失败')
    }
  } catch (error) {
    ElMessage.error('网络错误')
  } finally {
    saving.value = false
  }
}

const deleteStore = async (store: any) => {
  try {
    await ElMessageBox.confirm('确定要删除此门店吗？', '提示', { type: 'warning' })
    const res = await fetch(`${API_BASE}/stores/${store.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    })
    if (res.ok) {
      ElMessage.success('删除成功')
      fetchStores()
    } else {
      ElMessage.error('删除失败')
    }
  } catch (error) {
    // 取消操作
  }
}

const openConfigDialog = async (store: any) => {
  editingStore.value = store
  configTab.value = 'basic'
  
  try {
    const res = await fetch(`${API_BASE}/stores/${store.id}/config`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const data = await res.json()
    if (data) {
      Object.assign(configForm, data)
    }
  } catch (error) {
    console.error('获取门店配置失败', error)
  }
  
  configDialogVisible.value = true
}

const saveConfig = async () => {
  savingConfig.value = true
  try {
    const res = await fetch(`${API_BASE}/stores/${editingStore.value.id}/config`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(configForm)
    })
    if (res.ok) {
      ElMessage.success('配置保存成功')
      configDialogVisible.value = false
    } else {
      ElMessage.error('保存配置失败')
    }
  } catch (error) {
    ElMessage.error('网络错误')
  } finally {
    savingConfig.value = false
  }
}

onMounted(() => {
  fetchStores()
  fetchEmployees()
  fetchPrinters()
})
</script>

<style scoped>
.store-page {
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

.el-pagination {
  margin-top: 20px;
  justify-content: flex-end;
}
</style>
