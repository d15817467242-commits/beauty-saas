<template>
  <div class="permission-config">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>员工权限配置</span>
          <el-button type="primary" @click="handleSave" :loading="saving">保存配置</el-button>
        </div>
      </template>

      <el-row :gutter="20">
        <!-- 左侧：员工选择 -->
        <el-col :span="6">
          <div class="employee-list">
            <el-input 
              v-model="searchKeyword" 
              placeholder="搜索员工" 
              prefix-icon="Search"
              clearable
              style="margin-bottom: 15px;"
            />
            <el-scrollbar height="500px">
              <div 
                v-for="employee in filteredEmployees" 
                :key="employee.id"
                class="employee-item"
                :class="{ active: selectedEmployee?.id === employee.id }"
                @click="selectEmployee(employee)"
              >
                <el-avatar :size="40" :src="employee.avatar">
                  {{ employee.name?.charAt(0) }}
                </el-avatar>
                <div class="employee-info">
                  <div class="employee-name">{{ employee.name }}</div>
                  <div class="employee-position">{{ employee.position }}</div>
                </div>
                <el-tag size="small" :type="employee.status === 'active' ? 'success' : 'info'">
                  {{ employee.status === 'active' ? '在职' : '离职' }}
                </el-tag>
              </div>
            </el-scrollbar>
          </div>
        </el-col>

        <!-- 右侧：权限配置 -->
        <el-col :span="18">
          <div v-if="selectedEmployee" class="permission-panel">
            <div class="employee-header">
              <h3>{{ selectedEmployee.name }} 的权限配置</h3>
              <el-tag>{{ selectedEmployee.position }}</el-tag>
            </div>

            <el-tabs v-model="activeTab">
              <!-- 角色权限 -->
              <el-tab-pane label="角色权限" name="role">
                <el-form label-width="100px">
                  <el-form-item label="用户角色">
                    <el-select v-model="permissionForm.role" placeholder="选择角色" style="width: 200px;">
                      <el-option label="管理员" value="admin" />
                      <el-option label="店长" value="manager" />
                      <el-option label="前台" value="receptionist" />
                      <el-option label="发型师" value="stylist" />
                      <el-option label="技师" value="technician" />
                      <el-option label="学徒" value="apprentice" />
                    </el-select>
                  </el-form-item>
                  <el-form-item label="角色说明">
                    <span class="role-desc">{{ roleDescriptions[permissionForm.role] }}</span>
                  </el-form-item>
                </el-form>

                <el-divider>角色权限矩阵</el-divider>
                <el-table :data="permissionMatrix" border style="width: 100%">
                  <el-table-column prop="module" label="功能模块" width="150" fixed />
                  <el-table-column label="查看" width="80" align="center">
                    <template #default="{ row }">
                      <el-checkbox v-model="row.view" :disabled="isRolePreset('view', row.module)" />
                    </template>
                  </el-table-column>
                  <el-table-column label="新增" width="80" align="center">
                    <template #default="{ row }">
                      <el-checkbox v-model="row.add" :disabled="isRolePreset('add', row.module)" />
                    </template>
                  </el-table-column>
                  <el-table-column label="编辑" width="80" align="center">
                    <template #default="{ row }">
                      <el-checkbox v-model="row.edit" :disabled="isRolePreset('edit', row.module)" />
                    </template>
                  </el-table-column>
                  <el-table-column label="删除" width="80" align="center">
                    <template #default="{ row }">
                      <el-checkbox v-model="row.delete" :disabled="isRolePreset('delete', row.module)" />
                    </template>
                  </el-table-column>
                  <el-table-column label="导出" width="80" align="center">
                    <template #default="{ row }">
                      <el-checkbox v-model="row.export" :disabled="isRolePreset('export', row.module)" />
                    </template>
                  </el-table-column>
                  <el-table-column label="审批" width="80" align="center">
                    <template #default="{ row }">
                      <el-checkbox v-model="row.approve" :disabled="isRolePreset('approve', row.module)" />
                    </template>
                  </el-table-column>
                </el-table>
              </el-tab-pane>

              <!-- 数据权限 -->
              <el-tab-pane label="数据权限" name="data">
                <el-form label-width="120px">
                  <el-form-item label="会员数据范围">
                    <el-radio-group v-model="permissionForm.memberScope">
                      <el-radio value="all">全部会员</el-radio>
                      <el-radio value="department">本部门会员</el-radio>
                      <el-radio value="self">自己服务的会员</el-radio>
                    </el-radio-group>
                  </el-form-item>
                  <el-form-item label="订单数据范围">
                    <el-radio-group v-model="permissionForm.orderScope">
                      <el-radio value="all">全部订单</el-radio>
                      <el-radio value="department">本部门订单</el-radio>
                      <el-radio value="self">自己的订单</el-radio>
                    </el-radio-group>
                  </el-form-item>
                  <el-form-item label="业绩数据范围">
                    <el-radio-group v-model="permissionForm.performanceScope">
                      <el-radio value="all">全部业绩</el-radio>
                      <el-radio value="department">本部门业绩</el-radio>
                      <el-radio value="self">自己的业绩</el-radio>
                    </el-radio-group>
                  </el-form-item>
                  <el-form-item label="可查看成本">
                    <el-switch v-model="permissionForm.canViewCost" />
                  </el-form-item>
                  <el-form-item label="可查看利润">
                    <el-switch v-model="permissionForm.canViewProfit" />
                  </el-form-item>
                </el-form>
              </el-tab-pane>

              <!-- 操作权限 -->
              <el-tab-pane label="操作权限" name="operation">
                <el-form label-width="150px">
                  <el-form-item label="可修改价格">
                    <el-switch v-model="permissionForm.canModifyPrice" />
                  </el-form-item>
                  <el-form-item label="可打折">
                    <el-switch v-model="permissionForm.canDiscount" />
                    <el-slider 
                      v-if="permissionForm.canDiscount"
                      v-model="permissionForm.maxDiscount"
                      :min="50" 
                      :max="100" 
                      :format-tooltip="(val: number) => `${val}%`"
                      style="width: 200px; margin-left: 20px;"
                    />
                  </el-form-item>
                  <el-form-item label="可挂账">
                    <el-switch v-model="permissionForm.canCredit" />
                  </el-form-item>
                  <el-form-item label="最大挂账金额">
                    <el-input-number 
                      v-model="permissionForm.maxCreditAmount" 
                      :min="0" 
                      :disabled="!permissionForm.canCredit"
                    />
                    <span style="margin-left: 10px;">元</span>
                  </el-form-item>
                  <el-form-item label="可退款">
                    <el-switch v-model="permissionForm.canRefund" />
                  </el-form-item>
                  <el-form-item label="可作废订单">
                    <el-switch v-model="permissionForm.canVoidOrder" />
                  </el-form-item>
                  <el-form-item label="可导出数据">
                    <el-switch v-model="permissionForm.canExport" />
                  </el-form-item>
                </el-form>
              </el-tab-pane>

              <!-- 特殊权限 -->
              <el-tab-pane label="特殊权限" name="special">
                <el-form label-width="150px">
                  <el-form-item label="系统设置">
                    <el-switch v-model="permissionForm.canSystemConfig" />
                  </el-form-item>
                  <el-form-item label="员工管理">
                    <el-switch v-model="permissionForm.canManageEmployee" />
                  </el-form-item>
                  <el-form-item label="查看报表">
                    <el-switch v-model="permissionForm.canViewReport" />
                  </el-form-item>
                  <el-form-item label="审批权限">
                    <el-switch v-model="permissionForm.canApprove" />
                  </el-form-item>
                  <el-form-item label="库存管理">
                    <el-switch v-model="permissionForm.canManageInventory" />
                  </el-form-item>
                  <el-form-item label="营销活动">
                    <el-switch v-model="permissionForm.canMarketing" />
                  </el-form-item>
                </el-form>

                <el-divider>可访问的门店</el-divider>
                <el-checkbox-group v-model="permissionForm.allowedStores">
                  <el-checkbox label="store1">总店</el-checkbox>
                  <el-checkbox label="store2">分店A</el-checkbox>
                  <el-checkbox label="store3">分店B</el-checkbox>
                </el-checkbox-group>
              </el-tab-pane>
            </el-tabs>
          </div>

          <el-empty v-else description="请选择员工" />
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'

const API_BASE = 'http://localhost:3000/api'
const token = localStorage.getItem('token') || ''

const roleDescriptions: Record<string, string> = {
  admin: '拥有系统所有权限，可进行任何操作',
  manager: '可管理门店日常运营，查看所有数据报表',
  receptionist: '负责前台接待、收银、会员登记等工作',
  stylist: '可查看自己的业绩和提成，进行服务操作',
  technician: '可查看自己的业绩和提成，进行服务操作',
  apprentice: '基础权限，可查看自己的工作安排',
}

// 角色预设权限
const rolePresets: Record<string, any> = {
  admin: {
    member: { view: true, add: true, edit: true, delete: true, export: true, approve: true },
    order: { view: true, add: true, edit: true, delete: true, export: true, approve: true },
    employee: { view: true, add: true, edit: true, delete: true, export: true, approve: true },
    report: { view: true, add: false, edit: false, delete: false, export: true, approve: false },
    inventory: { view: true, add: true, edit: true, delete: true, export: true, approve: true },
    marketing: { view: true, add: true, edit: true, delete: true, export: true, approve: true },
  },
  manager: {
    member: { view: true, add: true, edit: true, delete: false, export: true, approve: true },
    order: { view: true, add: true, edit: true, delete: false, export: true, approve: true },
    employee: { view: true, add: true, edit: true, delete: false, export: true, approve: false },
    report: { view: true, add: false, edit: false, delete: false, export: true, approve: false },
    inventory: { view: true, add: true, edit: true, delete: false, export: true, approve: false },
    marketing: { view: true, add: true, edit: true, delete: false, export: true, approve: true },
  },
  receptionist: {
    member: { view: true, add: true, edit: true, delete: false, export: false, approve: false },
    order: { view: true, add: true, edit: true, delete: false, export: false, approve: false },
    employee: { view: true, add: false, edit: false, delete: false, export: false, approve: false },
    report: { view: false, add: false, edit: false, delete: false, export: false, approve: false },
    inventory: { view: true, add: false, edit: false, delete: false, export: false, approve: false },
    marketing: { view: true, add: false, edit: false, delete: false, export: false, approve: false },
  },
  stylist: {
    member: { view: true, add: false, edit: false, delete: false, export: false, approve: false },
    order: { view: true, add: false, edit: false, delete: false, export: false, approve: false },
    employee: { view: false, add: false, edit: false, delete: false, export: false, approve: false },
    report: { view: false, add: false, edit: false, delete: false, export: false, approve: false },
    inventory: { view: false, add: false, edit: false, delete: false, export: false, approve: false },
    marketing: { view: false, add: false, edit: false, delete: false, export: false, approve: false },
  },
  technician: {
    member: { view: true, add: false, edit: false, delete: false, export: false, approve: false },
    order: { view: true, add: false, edit: false, delete: false, export: false, approve: false },
    employee: { view: false, add: false, edit: false, delete: false, export: false, approve: false },
    report: { view: false, add: false, edit: false, delete: false, export: false, approve: false },
    inventory: { view: false, add: false, edit: false, delete: false, export: false, approve: false },
    marketing: { view: false, add: false, edit: false, delete: false, export: false, approve: false },
  },
  apprentice: {
    member: { view: false, add: false, edit: false, delete: false, export: false, approve: false },
    order: { view: false, add: false, edit: false, delete: false, export: false, approve: false },
    employee: { view: false, add: false, edit: false, delete: false, export: false, approve: false },
    report: { view: false, add: false, edit: false, delete: false, export: false, approve: false },
    inventory: { view: false, add: false, edit: false, delete: false, export: false, approve: false },
    marketing: { view: false, add: false, edit: false, delete: false, export: false, approve: false },
  },
}

const saving = ref(false)
const searchKeyword = ref('')
const employeeList = ref<any[]>([])
const selectedEmployee = ref<any>(null)
const activeTab = ref('role')

const filteredEmployees = computed(() => {
  if (!searchKeyword.value) return employeeList.value
  const keyword = searchKeyword.value.toLowerCase()
  return employeeList.value.filter(e => 
    e.name?.toLowerCase().includes(keyword) || 
    e.position?.toLowerCase().includes(keyword)
  )
})

const permissionForm = ref({
  role: 'stylist',
  memberScope: 'self',
  orderScope: 'self',
  performanceScope: 'self',
  canViewCost: false,
  canViewProfit: false,
  canModifyPrice: false,
  canDiscount: false,
  maxDiscount: 100,
  canCredit: false,
  maxCreditAmount: 0,
  canRefund: false,
  canVoidOrder: false,
  canExport: false,
  canSystemConfig: false,
  canManageEmployee: false,
  canViewReport: false,
  canApprove: false,
  canManageInventory: false,
  canMarketing: false,
  allowedStores: ['store1'],
})

const permissionMatrix = ref([
  { module: '会员管理', moduleKey: 'member', view: true, add: false, edit: false, delete: false, export: false, approve: false },
  { module: '订单管理', moduleKey: 'order', view: true, add: false, edit: false, delete: false, export: false, approve: false },
  { module: '员工管理', moduleKey: 'employee', view: false, add: false, edit: false, delete: false, export: false, approve: false },
  { module: '报表统计', moduleKey: 'report', view: false, add: false, edit: false, delete: false, export: false, approve: false },
  { module: '库存管理', moduleKey: 'inventory', view: false, add: false, edit: false, delete: false, export: false, approve: false },
  { module: '营销管理', moduleKey: 'marketing', view: false, add: false, edit: false, delete: false, export: false, approve: false },
])

const isRolePreset = (action: string, module: string): boolean => {
  const role = permissionForm.value.role
  const preset = rolePresets[role]?.[module]
  if (preset && preset[action] !== undefined) {
    return true
  }
  return false
}

const applyRolePreset = () => {
  const role = permissionForm.value.role
  const preset = rolePresets[role]
  if (preset) {
    permissionMatrix.value.forEach(item => {
      const modulePreset = preset[item.moduleKey]
      if (modulePreset) {
        item.view = modulePreset.view || false
        item.add = modulePreset.add || false
        item.edit = modulePreset.edit || false
        item.delete = modulePreset.delete || false
        item.export = modulePreset.export || false
        item.approve = modulePreset.approve || false
      }
    })
  }
}

watch(() => permissionForm.value.role, () => {
  applyRolePreset()
})

const loadEmployees = async () => {
  try {
    const res = await fetch(`${API_BASE}/employees`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    employeeList.value = await res.json()
  } catch (e) {
    ElMessage.error('加载员工列表失败')
  }
}

const selectEmployee = async (employee: any) => {
  selectedEmployee.value = employee
  
  // 加载员工权限配置
  try {
    const res = await fetch(`${API_BASE}/employees/${employee.id}/permissions`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (res.ok) {
      const data = await res.json()
      permissionForm.value = { ...permissionForm.value, ...data }
      if (data.permissionMatrix) {
        permissionMatrix.value = data.permissionMatrix
      }
    }
  } catch (e) {
    console.error(e)
  }
}

const handleSave = async () => {
  if (!selectedEmployee.value) {
    ElMessage.warning('请选择员工')
    return
  }
  
  saving.value = true
  try {
    const res = await fetch(`${API_BASE}/employees/${selectedEmployee.value.id}/permissions`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        ...permissionForm.value,
        permissionMatrix: permissionMatrix.value,
      })
    })
    
    if (res.ok) {
      ElMessage.success('权限配置保存成功')
    } else {
      const err = await res.json()
      ElMessage.error(err.message || '保存失败')
    }
  } catch (e) {
    ElMessage.error('网络错误')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadEmployees()
})
</script>

<style scoped>
.permission-config {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.employee-list {
  border: 1px solid #EBEEF5;
  border-radius: 4px;
  padding: 15px;
  background: #FAFAFA;
}

.employee-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  margin-bottom: 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.employee-item:hover {
  background: #ECF5FF;
}

.employee-item.active {
  background: #409EFF;
  color: white;
}

.employee-item.active .employee-position {
  color: rgba(255, 255, 255, 0.8);
}

.employee-info {
  flex: 1;
}

.employee-name {
  font-size: 14px;
  font-weight: bold;
}

.employee-position {
  font-size: 12px;
  color: #909399;
}

.permission-panel {
  padding: 0 20px;
}

.employee-header {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 20px;
}

.employee-header h3 {
  margin: 0;
  font-size: 18px;
}

.role-desc {
  color: #909399;
  font-size: 13px;
}
</style>
