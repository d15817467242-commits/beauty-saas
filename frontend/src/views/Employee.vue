<template>
  <div class="employee-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>员工管理</span>
          <el-button type="primary" @click="handleAdd" v-if="userStore.canCreate">新增员工</el-button>
        </div>
      </template>
      <el-table :data="employeeList" v-loading="loading" stripe>
        <el-table-column prop="name" label="姓名" />
        <el-table-column prop="employeeNo" label="工号" />
        <el-table-column prop="phone" label="手机号" />
        <el-table-column prop="position" label="职位" />
        <el-table-column prop="status" label="状态">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'info'">
              {{ row.status === 'active' ? '在职' : '离职' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="baseCommissionRate" label="基础提成">
          <template #default="{ row }">
            {{ row.baseCommissionRate || 0 }}%
          </template>
        </el-table-column>
        <el-table-column prop="totalSales" label="累计业绩">
          <template #default="{ row }">
            ¥{{ row.totalSales || 0 }}
          </template>
        </el-table-column>
        <el-table-column prop="totalCommission" label="累计提成">
          <template #default="{ row }">
            ¥{{ row.totalCommission || 0 }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280">
          <template #default="{ row }">
            <el-button size="small" @click="handleEdit(row)" v-if="userStore.canEdit">编辑</el-button>
            <el-button size="small" type="warning" @click="handleCommission(row)" v-if="userStore.isAdmin">提成设置</el-button>
            <el-button size="small" type="info" @click="handleResetPassword(row)" v-if="userStore.canEdit">重置密码</el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)" v-if="userStore.canDelete">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑员工' : '新增员工'" width="500px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="员工姓名" required>
          <el-input v-model="form.name" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="工号" required>
          <el-input v-model="form.employeeNo" placeholder="如：E001" />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="form.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="职位">
          <el-select v-model="form.position" placeholder="请选择职位" style="width: 100%" filterable allow-create>
            <el-option label="店长" value="店长" />
            <el-option label="收银员" value="收银员" />
            <el-option label="发型师" value="发型师" />
            <el-option label="美容师" value="美容师" />
            <el-option label="技师" value="技师" />
            <el-option label="顾问" value="顾问" />
            <el-option label="助理" value="助理" />
          </el-select>
        </el-form-item>
        <el-form-item label="入职日期">
          <el-date-picker v-model="form.hireDate" type="date" placeholder="选择日期" style="width: 100%" />
        </el-form-item>
        <el-form-item label="基础提成">
          <el-input-number v-model="form.baseCommissionRate" :min="0" :max="100" :precision="1" />
          <span style="margin-left: 10px">%</span>
        </el-form-item>
        <el-divider v-if="!isEdit && userStore.canCreate">登录帐号</el-divider>
        <el-form-item label="创建帐号" v-if="!isEdit && userStore.canCreate">
          <el-switch v-model="form.createAccount" active-text="是" inactive-text="否" />
        </el-form-item>
        <template v-if="form.createAccount && !isEdit">
          <el-form-item label="登录角色" required>
            <el-select v-model="form.accountRole" placeholder="选择登录角色" style="width: 100%">
              <el-option label="店长（管理运营）" value="manager" />
              <el-option label="收银员（收银开单）" value="cashier" />
              <el-option label="员工（查看业绩）" value="employee" />
            </el-select>
          </el-form-item>
          <el-form-item label="登录用户名" required>
            <el-input v-model="form.accountUsername" placeholder="用于登录的用户名" />
          </el-form-item>
          <el-form-item label="初始密码" required>
            <el-input v-model="form.accountPassword" type="password" placeholder="默认: 123456" show-password />
          </el-form-item>
        </template>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 提成设置对话框 -->
    <el-dialog v-model="commissionDialogVisible" title="提成设置" width="700px">
      <el-form label-width="100px">
        <el-form-item label="员工">
          <span>{{ currentEmployee?.name }} ({{ currentEmployee?.employeeNo }})</span>
        </el-form-item>
        <el-form-item label="基础提成比例">
          <el-input-number v-model="commissionForm.baseCommissionRate" :min="0" :max="100" :precision="1" />
          <span style="margin-left: 10px">%</span>
        </el-form-item>
        <el-divider>服务项目个性化提成</el-divider>
        <el-form-item label="">
          <el-table :data="commissionForm.serviceRules" size="small">
            <el-table-column prop="serviceName" label="服务项目" width="200" />
            <el-table-column label="提成比例(%)">
              <template #default="{ row }">
                <el-input-number v-model="row.commissionRate" :min="0" :max="100" :precision="1" size="small" />
              </template>
            </el-table-column>
            <el-table-column label="固定提成(元)">
              <template #default="{ row }">
                <el-input-number v-model="row.fixedCommission" :min="0" :precision="2" size="small" />
              </template>
            </el-table-column>
          </el-table>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="commissionDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="commissionSubmitting" @click="handleCommissionSubmit">保存</el-button>
      </template>
    </el-dialog>

    <!-- 重置密码对话框 -->
    <el-dialog v-model="resetPwdVisible" title="重置密码" width="400px">
      <el-form :model="resetPwdForm" label-width="100px">
        <el-form-item label="员工">
          <span>{{ resetPwdForm.employeeName }}</span>
        </el-form-item>
        <el-form-item label="新密码" required>
          <el-input v-model="resetPwdForm.newPassword" type="password" placeholder="请输入新密码" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="resetPwdVisible = false">取消</el-button>
        <el-button type="primary" :loading="resetPwdSubmitting" @click="handleResetPwdSubmit">确认重置</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

const loading = ref(false)
const submitting = ref(false)
const commissionSubmitting = ref(false)
const employeeList = ref<any[]>([])
const serviceList = ref<any[]>([])
const dialogVisible = ref(false)
const commissionDialogVisible = ref(false)
const isEdit = ref(false)
const editId = ref('')
const currentEmployee = ref<any>(null)

const form = ref({
  name: '',
  employeeNo: '',
  phone: '',
  position: '',
  hireDate: '',
  baseCommissionRate: 0,
  createAccount: false,
  accountRole: '',
  accountUsername: '',
  accountPassword: '123456',
})

const commissionForm = ref({
  baseCommissionRate: 0,
  serviceRules: [] as any[]
})

const resetPwdVisible = ref(false)
const resetPwdSubmitting = ref(false)
const resetPwdForm = ref({ employeeId: '', employeeName: '', newPassword: '' })

const resetForm = () => {
  form.value = {
    name: '',
    employeeNo: '',
    phone: '',
    position: '',
    hireDate: '',
    baseCommissionRate: 0,
    createAccount: false,
    accountRole: '',
    accountUsername: '',
    accountPassword: '123456',
  }
}

const loadEmployees = async () => {
  loading.value = true
  try {
    employeeList.value = await request.get('/employees')
  } catch (e) {
    ElMessage.error('加载失败')
  } finally {
    loading.value = false
  }
}

const loadServices = async () => {
  try {
    serviceList.value = await request.get('/services')
  } catch (e) {
    console.error(e)
  }
}

const handleAdd = () => {
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
}

const handleEdit = (row: any) => {
  isEdit.value = true
  editId.value = row.id
  form.value = {
    name: row.name,
    employeeNo: row.employeeNo,
    phone: row.phone || '',
    position: row.position || '',
    hireDate: row.hireDate || '',
    baseCommissionRate: row.baseCommissionRate || 0,
    createAccount: false,
    accountRole: '',
    accountUsername: '',
    accountPassword: '123456',
  }
  dialogVisible.value = true
}

const handleCommission = async (row: any) => {
  currentEmployee.value = row
  commissionForm.value.baseCommissionRate = row.baseCommissionRate || 0
  
  // 加载服务列表并初始化提成规则
  if (serviceList.value.length === 0) {
    await loadServices()
  }
  
  const existingRules = row.commissionRules || {}
  commissionForm.value.serviceRules = serviceList.value.map(s => ({
    serviceId: s.id,
    serviceName: s.name,
    commissionRate: existingRules[s.id]?.commissionRate || null,
    fixedCommission: existingRules[s.id]?.fixedCommission || null
  }))
  
  commissionDialogVisible.value = true
}

const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm('确定要删除该员工吗？', '提示', { type: 'warning' })
    await request.delete(`/employees/${row.id}`)
    ElMessage.success('删除成功')
    loadEmployees()
  } catch (e) {}
}

const handleSubmit = async () => {
  if (!form.value.name || !form.value.employeeNo) {
    ElMessage.warning('请填写姓名和工号')
    return
  }
  if (form.value.createAccount && (!form.value.accountRole || !form.value.accountUsername)) {
    ElMessage.warning('请填写登录角色和用户名')
    return
  }
  submitting.value = true
  try {
    if (isEdit.value) {
      await request.patch(`/employees/${editId.value}`, form.value)
      ElMessage.success('修改成功')
    } else {
      await request.post('/employees', form.value)
      // 如果勾选了创建帐号，同步创建登录帐号
      if (form.value.createAccount) {
        try {
          await request.post('/users', {
            username: form.value.accountUsername,
            password: form.value.accountPassword || '123456',
            name: form.value.name,
            phone: form.value.phone,
            role: form.value.accountRole,
            storeId: userStore.storeId,
            isActive: '1',
          })
          // 同时关联门店
          const newUser = await request.get('/users')
          const created = newUser.find(u => u.username === form.value.accountUsername)
          if (created) {
            await request.patch(`/users/${created.id}/stores`, {
              storeIds: [userStore.storeId],
            })
          }
          ElMessage.success('员工和登录帐号已创建')
        } catch (e: any) {
          ElMessage.warning('员工已创建，但登录帐号创建失败：' + (e?.response?.data?.message || '用户名可能已存在'))
        }
      } else {
        ElMessage.success('添加成功')
      }
    }
    dialogVisible.value = false
    loadEmployees()
  } catch (e) {
    ElMessage.error('网络错误')
  } finally {
    submitting.value = false
  }
}

const handleCommissionSubmit = async () => {
  if (!currentEmployee.value) return
  commissionSubmitting.value = true
  
  try {
    // 构建提成规则对象
    const commissionRules: Record<string, any> = {}
    for (const rule of commissionForm.value.serviceRules) {
      if (rule.commissionRate !== null || rule.fixedCommission !== null) {
        commissionRules[rule.serviceId] = {
          commissionRate: rule.commissionRate,
          fixedCommission: rule.fixedCommission
        }
      }
    }
    
    await request.patch(`/employees/${currentEmployee.value.id}/commission`, {
        baseCommissionRate: commissionForm.value.baseCommissionRate,
        commissionRules
      })
      ElMessage.success('提成设置保存成功')
      commissionDialogVisible.value = false
      loadEmployees()
  } catch (e) {
    ElMessage.error('网络错误')
  } finally {
    commissionSubmitting.value = false
  }
}

onMounted(() => {
  loadEmployees()
  loadServices()
})
</script>

<style scoped>
.employee-page {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
