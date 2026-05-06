<template>
  <div class="param-settings-page">
    <el-card>
      <template #header>
        <span>参数设置</span>
      </template>
      
      <el-tabs v-model="activeTab">
        <!-- 前台参数 -->
        <el-tab-pane label="前台参数" name="front">
          <el-form :model="frontParams" label-width="150px" style="max-width: 600px">
            <el-form-item label="门店名称">
              <el-input v-model="frontParams['front.business_name']" />
            </el-form-item>
            <el-form-item label="联系电话">
              <el-input v-model="frontParams['front.business_phone']" />
            </el-form-item>
            <el-form-item label="门店地址">
              <el-input v-model="frontParams['front.business_address']" type="textarea" />
            </el-form-item>
            <el-form-item label="自动打印小票">
              <el-switch v-model="frontParams['front.auto_print']" />
            </el-form-item>
            <el-form-item label="显示会员价">
              <el-switch v-model="frontParams['front.show_member_price']" />
            </el-form-item>
            <el-form-item label="默认折扣">
              <el-input-number v-model="frontParams['front.default_discount']" :min="1" :max="100" />
              <span style="margin-left: 10px">%</span>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="saveFrontParams">保存</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
        
        <!-- 短信参数 -->
        <el-tab-pane label="短信参数" name="sms">
          <el-form :model="smsParams" label-width="150px" style="max-width: 600px">
            <el-form-item label="短信服务商">
              <el-select v-model="smsParams['sms.provider']" style="width: 100%">
                <el-option value="aliyun" label="阿里云" />
                <el-option value="tencent" label="腾讯云" />
                <el-option value="huawei" label="华为云" />
              </el-select>
            </el-form-item>
            <el-form-item label="AccessKey">
              <el-input v-model="smsParams['sms.access_key']" />
            </el-form-item>
            <el-form-item label="SecretKey">
              <el-input v-model="smsParams['sms.secret_key']" type="password" />
            </el-form-item>
            <el-form-item label="短信签名">
              <el-input v-model="smsParams['sms.sign_name']" />
            </el-form-item>
            <el-form-item label="短信模板">
              <el-input v-model="smsParams['sms.template_code']" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="saveSmsParams">保存</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
        
        <!-- 打印参数 -->
        <el-tab-pane label="打印参数" name="print">
          <el-form :model="printParams" label-width="150px" style="max-width: 600px">
            <el-form-item label="打印机名称">
              <el-input v-model="printParams['print.printer_name']" />
            </el-form-item>
            <el-form-item label="纸张宽度">
              <el-input-number v-model="printParams['print.paper_width']" :min="58" :max="80" />
              <span style="margin-left: 10px">mm</span>
            </el-form-item>
            <el-form-item label="打印抬头">
              <el-input v-model="printParams['print.print_header']" />
            </el-form-item>
            <el-form-item label="打印底部">
              <el-input v-model="printParams['print.print_footer']" />
            </el-form-item>
            <el-form-item label="自动切纸">
              <el-switch v-model="printParams['print.auto_cut']" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="savePrintParams">保存</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
        
        <!-- 提成参数 -->
        <el-tab-pane label="提成参数" name="commission">
          <el-form :model="commissionParams" label-width="150px" style="max-width: 600px">
            <el-form-item label="提成计算方式">
              <el-select v-model="commissionParams['commission.calculate_type']" style="width: 100%">
                <el-option value="service" label="按服务项目" />
                <el-option value="amount" label="按消费金额" />
                <el-option value="performance" label="按业绩目标" />
              </el-select>
            </el-form-item>
            <el-form-item label="默认提成比例">
              <el-input-number v-model="commissionParams['commission.default_rate']" :min="0" :max="100" />
              <span style="margin-left: 10px">%</span>
            </el-form-item>
            <el-form-item label="商品提成比例">
              <el-input-number v-model="commissionParams['commission.product_rate']" :min="0" :max="100" />
              <span style="margin-left: 10px">%</span>
            </el-form-item>
            <el-form-item label="开卡提成比例">
              <el-input-number v-model="commissionParams['commission.card_rate']" :min="0" :max="100" />
              <span style="margin-left: 10px">%</span>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="saveCommissionParams">保存</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
        
        <!-- 库存参数 -->
        <el-tab-pane label="库存参数" name="stock">
          <el-form :model="stockParams" label-width="150px" style="max-width: 600px">
            <el-form-item label="库存预警阈值">
              <el-input-number v-model="stockParams['stock.warning_threshold']" :min="0" />
            </el-form-item>
            <el-form-item label="自动库存预警">
              <el-switch v-model="stockParams['stock.auto_warning']" />
            </el-form-item>
            <el-form-item label="允许负库存">
              <el-switch v-model="stockParams['stock.negative_stock']" />
            </el-form-item>
            <el-form-item label="默认仓库">
              <el-select v-model="stockParams['stock.default_warehouse']" placeholder="选择默认仓库" style="width: 100%">
                <el-option v-for="w in warehouses" :key="w.id" :label="w.name" :value="w.id" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="saveStockParams">保存</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
        
        <!-- 提醒参数 -->
        <el-tab-pane label="提醒参数" name="reminder">
          <el-form :model="reminderParams" label-width="150px" style="max-width: 600px">
            <el-form-item label="会员生日提醒">
              <el-switch v-model="reminderParams['reminder.member_birthday']" />
            </el-form-item>
            <el-form-item v-if="reminderParams['reminder.member_birthday']" label="提前提醒天数">
              <el-input-number v-model="reminderParams['reminder.member_birthday_days']" :min="1" :max="30" />
              <span style="margin-left: 10px">天</span>
            </el-form-item>
            <el-form-item label="次卡到期提醒">
              <el-switch v-model="reminderParams['reminder.card_expire']" />
            </el-form-item>
            <el-form-item v-if="reminderParams['reminder.card_expire']" label="到期提前天数">
              <el-input-number v-model="reminderParams['reminder.card_expire_days']" :min="1" :max="90" />
              <span style="margin-left: 10px">天</span>
            </el-form-item>
            <el-form-item label="余额不足提醒">
              <el-switch v-model="reminderParams['reminder.balance_low']" />
            </el-form-item>
            <el-form-item v-if="reminderParams['reminder.balance_low']" label="余额阈值">
              <el-input-number v-model="reminderParams['reminder.balance_threshold']" :min="0" :precision="2" />
              <span style="margin-left: 10px">元</span>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="saveReminderParams">保存</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
        
        <!-- 用户组管理 -->
        <el-tab-pane label="用户组管理" name="userGroups">
          <div style="margin-bottom: 15px">
            <el-button type="primary" @click="showUserGroupDialog()">新增用户组</el-button>
          </div>
          <el-table :data="userGroups" border>
            <el-table-column prop="name" label="用户组名称" />
            <el-table-column prop="code" label="编码" />
            <el-table-column label="权限数量">
              <template #default="{ row }">
                {{ row.permissions?.length || 0 }}项
              </template>
            </el-table-column>
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.isActive ? 'success' : 'danger'">
                  {{ row.isActive ? '启用' : '禁用' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150">
              <template #default="{ row }">
                <el-button type="primary" size="small" @click="showUserGroupDialog(row)">编辑</el-button>
                <el-button type="danger" size="small" @click="deleteUserGroup(row.id)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-card>
    
    <!-- 用户组对话框 -->
    <el-dialog v-model="userGroupDialogVisible" :title="userGroupForm.id ? '编辑用户组' : '新增用户组'" width="600px">
      <el-form :model="userGroupForm" label-width="100px">
        <el-form-item label="用户组名称">
          <el-input v-model="userGroupForm.name" />
        </el-form-item>
        <el-form-item label="编码">
          <el-input v-model="userGroupForm.code" />
        </el-form-item>
        <el-form-item label="权限">
          <el-checkbox-group v-model="userGroupForm.permissions">
            <el-checkbox v-for="p in allPermissions" :key="p" :value="p">{{ p }}</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="是否启用">
          <el-switch v-model="userGroupForm.isActive" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="userGroupDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveUserGroup">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

const API_BASE = 'http://localhost:3000/api'
const token = localStorage.getItem('token') || ''

const activeTab = ref('front')

const frontParams = ref<Record<string, any>>({})
const smsParams = ref<Record<string, any>>({})
const printParams = ref<Record<string, any>>({})
const commissionParams = ref<Record<string, any>>({})
const stockParams = ref<Record<string, any>>({})
const reminderParams = ref<Record<string, any>>({})

const warehouses = ref<any[]>([])
const userGroups = ref<any[]>([])

const userGroupDialogVisible = ref(false)
const userGroupForm = ref<any>({ name: '', code: '', permissions: [], isActive: true })

const allPermissions = [
  'member.view', 'member.edit', 'member.delete',
  'employee.view', 'employee.edit', 'employee.delete',
  'service.view', 'service.edit', 'service.delete',
  'cashier.view', 'cashier.operate',
  'report.view', 'report.export',
  'inventory.view', 'inventory.edit',
  'marketing.view', 'marketing.edit',
  'system.config'
]

const loadParams = async () => {
  try {
    const [frontRes, smsRes, printRes, commissionRes, stockRes, reminderRes, groupsRes] = await Promise.all([
      fetch(`${API_BASE}/param/front`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${API_BASE}/param/sms`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${API_BASE}/param/print`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${API_BASE}/param/commission`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${API_BASE}/param/stock`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${API_BASE}/param/reminder`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${API_BASE}/param/user-groups`, { headers: { Authorization: `Bearer ${token}` } })
    ])
    
    frontParams.value = await frontRes.json()
    smsParams.value = await smsRes.json()
    printParams.value = await printRes.json()
    commissionParams.value = await commissionRes.json()
    stockParams.value = await stockRes.json()
    reminderParams.value = await reminderRes.json()
    userGroups.value = await groupsRes.json()
  } catch (e) {
    console.error(e)
  }
}

const saveFrontParams = async () => {
  try {
    await fetch(`${API_BASE}/param/front`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(frontParams.value)
    })
    ElMessage.success('保存成功')
  } catch (e) {
    ElMessage.error('保存失败')
  }
}

const saveSmsParams = async () => {
  try {
    await fetch(`${API_BASE}/param/sms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(smsParams.value)
    })
    ElMessage.success('保存成功')
  } catch (e) {
    ElMessage.error('保存失败')
  }
}

const savePrintParams = async () => {
  try {
    await fetch(`${API_BASE}/param/print`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(printParams.value)
    })
    ElMessage.success('保存成功')
  } catch (e) {
    ElMessage.error('保存失败')
  }
}

const saveCommissionParams = async () => {
  try {
    await fetch(`${API_BASE}/param/commission`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(commissionParams.value)
    })
    ElMessage.success('保存成功')
  } catch (e) {
    ElMessage.error('保存失败')
  }
}

const saveStockParams = async () => {
  try {
    await fetch(`${API_BASE}/param/stock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(stockParams.value)
    })
    ElMessage.success('保存成功')
  } catch (e) {
    ElMessage.error('保存失败')
  }
}

const saveReminderParams = async () => {
  try {
    await fetch(`${API_BASE}/param/reminder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(reminderParams.value)
    })
    ElMessage.success('保存成功')
  } catch (e) {
    ElMessage.error('保存失败')
  }
}

const showUserGroupDialog = (row?: any) => {
  userGroupForm.value = row ? { ...row } : { name: '', code: '', permissions: [], isActive: true }
  userGroupDialogVisible.value = true
}

const saveUserGroup = async () => {
  try {
    const url = userGroupForm.value.id 
      ? `${API_BASE}/param/user-groups/${userGroupForm.value.id}`
      : `${API_BASE}/param/user-groups`
    const method = userGroupForm.value.id ? 'PUT' : 'POST'
    
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(userGroupForm.value)
    })
    
    ElMessage.success('保存成功')
    userGroupDialogVisible.value = false
    loadParams()
  } catch (e) {
    ElMessage.error('保存失败')
  }
}

const deleteUserGroup = async (id: string) => {
  try {
    await fetch(`${API_BASE}/param/user-groups/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
    ElMessage.success('删除成功')
    loadParams()
  } catch (e) {
    ElMessage.error('删除失败')
  }
}

onMounted(loadParams)
</script>

<style scoped>
.param-settings-page {
  padding: 20px;
}
</style>
