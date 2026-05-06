<template>
  <div class="data-settings-page">
    <el-card>
      <template #header>
        <span>数据设置</span>
      </template>
      
      <el-tabs v-model="activeTab">
        <!-- 门店管理 -->
        <el-tab-pane label="门店管理" name="stores">
          <div style="margin-bottom: 15px">
            <el-button type="primary" @click="showStoreDialog()">新增门店</el-button>
          </div>
          <el-table :data="stores" border>
            <el-table-column prop="name" label="门店名称" />
            <el-table-column prop="code" label="门店编码" />
            <el-table-column prop="address" label="地址" />
            <el-table-column prop="phone" label="电话" />
            <el-table-column prop="manager" label="负责人" />
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.isActive ? 'success' : 'danger'">
                  {{ row.isActive ? '启用' : '禁用' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150">
              <template #default="{ row }">
                <el-button type="primary" size="small" @click="showStoreDialog(row)">编辑</el-button>
                <el-button type="danger" size="small" @click="deleteStore(row.id)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        
        <!-- 部门管理 -->
        <el-tab-pane label="部门管理" name="departments">
          <div style="margin-bottom: 15px">
            <el-button type="primary" @click="showDepartmentDialog()">新增部门</el-button>
          </div>
          <el-table :data="departments" border>
            <el-table-column prop="name" label="部门名称" />
            <el-table-column prop="code" label="部门编码" />
            <el-table-column prop="parent?.name" label="上级部门" />
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.isActive ? 'success' : 'danger'">
                  {{ row.isActive ? '启用' : '禁用' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150">
              <template #default="{ row }">
                <el-button type="primary" size="small" @click="showDepartmentDialog(row)">编辑</el-button>
                <el-button type="danger" size="small" @click="deleteDepartment(row.id)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        
        <!-- 职位管理 -->
        <el-tab-pane label="职位管理" name="positions">
          <div style="margin-bottom: 15px">
            <el-button type="primary" @click="showPositionDialog()">新增职位</el-button>
          </div>
          <el-table :data="positions" border>
            <el-table-column prop="name" label="职位名称" />
            <el-table-column prop="code" label="职位编码" />
            <el-table-column prop="baseSalary" label="基本工资">
              <template #default="{ row }">
                ¥{{ row.baseSalary }}
              </template>
            </el-table-column>
            <el-table-column prop="commissionRate" label="提成比例">
              <template #default="{ row }">
                {{ row.commissionRate }}%
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
                <el-button type="primary" size="small" @click="showPositionDialog(row)">编辑</el-button>
                <el-button type="danger" size="small" @click="deletePosition(row.id)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        
        <!-- 商品单位 -->
        <el-tab-pane label="商品单位" name="units">
          <div style="margin-bottom: 15px">
            <el-button type="primary" @click="showUnitDialog()">新增单位</el-button>
          </div>
          <el-table :data="units" border>
            <el-table-column prop="name" label="单位名称" />
            <el-table-column prop="code" label="单位编码" />
            <el-table-column prop="symbol" label="符号" />
            <el-table-column label="操作" width="150">
              <template #default="{ row }">
                <el-button type="primary" size="small" @click="showUnitDialog(row)">编辑</el-button>
                <el-button type="danger" size="small" @click="deleteUnit(row.id)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        
        <!-- 商品规格 -->
        <el-tab-pane label="商品规格" name="specs">
          <div style="margin-bottom: 15px">
            <el-button type="primary" @click="showSpecDialog()">新增规格</el-button>
          </div>
          <el-table :data="specs" border>
            <el-table-column prop="name" label="规格名称" />
            <el-table-column prop="code" label="规格编码" />
            <el-table-column label="规格值">
              <template #default="{ row }">
                <el-tag v-for="v in row.values" :key="v" style="margin-right: 5px">{{ v }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150">
              <template #default="{ row }">
                <el-button type="primary" size="small" @click="showSpecDialog(row)">编辑</el-button>
                <el-button type="danger" size="small" @click="deleteSpec(row.id)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        
        <!-- 价格策略 -->
        <el-tab-pane label="价格策略" name="strategies">
          <div style="margin-bottom: 15px">
            <el-button type="primary" @click="showStrategyDialog()">新增策略</el-button>
          </div>
          <el-table :data="strategies" border>
            <el-table-column prop="name" label="策略名称" />
            <el-table-column prop="code" label="策略编码" />
            <el-table-column prop="type" label="策略类型">
              <template #default="{ row }">
                {{ strategyTypes[row.type] }}
              </template>
            </el-table-column>
            <el-table-column prop="value" label="折扣值">
              <template #default="{ row }">
                {{ row.value }}{{ row.type === 'percentage' ? '%' : '元' }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150">
              <template #default="{ row }">
                <el-button type="primary" size="small" @click="showStrategyDialog(row)">编辑</el-button>
                <el-button type="danger" size="small" @click="deleteStrategy(row.id)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-card>
    
    <!-- 门店对话框 -->
    <el-dialog v-model="storeDialogVisible" :title="storeForm.id ? '编辑门店' : '新增门店'" width="600px">
      <el-form :model="storeForm" label-width="100px">
        <el-form-item label="门店名称">
          <el-input v-model="storeForm.name" />
        </el-form-item>
        <el-form-item label="门店编码">
          <el-input v-model="storeForm.code" />
        </el-form-item>
        <el-form-item label="地址">
          <el-input v-model="storeForm.address" type="textarea" />
        </el-form-item>
        <el-form-item label="电话">
          <el-input v-model="storeForm.phone" />
        </el-form-item>
        <el-form-item label="负责人">
          <el-input v-model="storeForm.manager" />
        </el-form-item>
        <el-form-item label="是否启用">
          <el-switch v-model="storeForm.isActive" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="storeDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveStore">确定</el-button>
      </template>
    </el-dialog>
    
    <!-- 部门对话框 -->
    <el-dialog v-model="departmentDialogVisible" :title="departmentForm.id ? '编辑部门' : '新增部门'" width="500px">
      <el-form :model="departmentForm" label-width="100px">
        <el-form-item label="部门名称">
          <el-input v-model="departmentForm.name" />
        </el-form-item>
        <el-form-item label="部门编码">
          <el-input v-model="departmentForm.code" />
        </el-form-item>
        <el-form-item label="上级部门">
          <el-select v-model="departmentForm.parentId" placeholder="选择上级部门" clearable style="width: 100%">
            <el-option v-for="d in departments.filter(x => x.id !== departmentForm.id)" :key="d.id" :label="d.name" :value="d.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="是否启用">
          <el-switch v-model="departmentForm.isActive" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="departmentDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveDepartment">确定</el-button>
      </template>
    </el-dialog>
    
    <!-- 职位对话框 -->
    <el-dialog v-model="positionDialogVisible" :title="positionForm.id ? '编辑职位' : '新增职位'" width="500px">
      <el-form :model="positionForm" label-width="100px">
        <el-form-item label="职位名称">
          <el-input v-model="positionForm.name" />
        </el-form-item>
        <el-form-item label="职位编码">
          <el-input v-model="positionForm.code" />
        </el-form-item>
        <el-form-item label="基本工资">
          <el-input-number v-model="positionForm.baseSalary" :min="0" />
        </el-form-item>
        <el-form-item label="提成比例">
          <el-input-number v-model="positionForm.commissionRate" :min="0" :max="100" />
          <span style="margin-left: 10px">%</span>
        </el-form-item>
        <el-form-item label="是否启用">
          <el-switch v-model="positionForm.isActive" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="positionDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="savePosition">确定</el-button>
      </template>
    </el-dialog>
    
    <!-- 单位对话框 -->
    <el-dialog v-model="unitDialogVisible" :title="unitForm.id ? '编辑单位' : '新增单位'" width="400px">
      <el-form :model="unitForm" label-width="100px">
        <el-form-item label="单位名称">
          <el-input v-model="unitForm.name" />
        </el-form-item>
        <el-form-item label="单位编码">
          <el-input v-model="unitForm.code" />
        </el-form-item>
        <el-form-item label="符号">
          <el-input v-model="unitForm.symbol" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="unitDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveUnit">确定</el-button>
      </template>
    </el-dialog>
    
    <!-- 规格对话框 -->
    <el-dialog v-model="specDialogVisible" :title="specForm.id ? '编辑规格' : '新增规格'" width="500px">
      <el-form :model="specForm" label-width="100px">
        <el-form-item label="规格名称">
          <el-input v-model="specForm.name" />
        </el-form-item>
        <el-form-item label="规格编码">
          <el-input v-model="specForm.code" />
        </el-form-item>
        <el-form-item label="规格值">
          <el-select v-model="specForm.values" multiple filterable allow-create placeholder="输入规格值" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="specDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveSpec">确定</el-button>
      </template>
    </el-dialog>
    
    <!-- 策略对话框 -->
    <el-dialog v-model="strategyDialogVisible" :title="strategyForm.id ? '编辑策略' : '新增策略'" width="500px">
      <el-form :model="strategyForm" label-width="100px">
        <el-form-item label="策略名称">
          <el-input v-model="strategyForm.name" />
        </el-form-item>
        <el-form-item label="策略编码">
          <el-input v-model="strategyForm.code" />
        </el-form-item>
        <el-form-item label="策略类型">
          <el-select v-model="strategyForm.type" style="width: 100%">
            <el-option value="fixed" label="固定价格" />
            <el-option value="percentage" label="折扣比例" />
            <el-option value="member_level" label="会员等级价" />
            <el-option value="time_based" label="时段价格" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="strategyForm.type !== 'member_level'" label="折扣值">
          <el-input-number v-model="strategyForm.value" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="strategyDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveStrategy">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const API_BASE = 'http://localhost:3000/api'
const token = localStorage.getItem('token') || ''

const activeTab = ref('stores')

const strategyTypes: Record<string, string> = {
  fixed: '固定价格',
  percentage: '折扣比例',
  member_level: '会员等级价',
  time_based: '时段价格'
}

// 数据
const stores = ref<any[]>([])
const departments = ref<any[]>([])
const positions = ref<any[]>([])
const units = ref<any[]>([])
const specs = ref<any[]>([])
const strategies = ref<any[]>([])

// 对话框
const storeDialogVisible = ref(false)
const departmentDialogVisible = ref(false)
const positionDialogVisible = ref(false)
const unitDialogVisible = ref(false)
const specDialogVisible = ref(false)
const strategyDialogVisible = ref(false)

// 表单
const storeForm = ref<any>({ name: '', code: '', address: '', phone: '', manager: '', isActive: true })
const departmentForm = ref<any>({ name: '', code: '', parentId: '', isActive: true })
const positionForm = ref<any>({ name: '', code: '', baseSalary: 0, commissionRate: 0, isActive: true })
const unitForm = ref<any>({ name: '', code: '', symbol: '' })
const specForm = ref<any>({ name: '', code: '', values: [] })
const strategyForm = ref<any>({ name: '', code: '', type: 'percentage', value: 100 })

const loadData = async () => {
  try {
    const [storesRes, deptsRes, positionsRes, unitsRes, specsRes, strategiesRes] = await Promise.all([
      fetch(`${API_BASE}/data-settings/stores`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${API_BASE}/data-settings/departments`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${API_BASE}/data-settings/positions`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${API_BASE}/data-settings/product-units`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${API_BASE}/data-settings/product-specs`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${API_BASE}/data-settings/price-strategies`, { headers: { Authorization: `Bearer ${token}` } })
    ])
    
    stores.value = await storesRes.json()
    departments.value = await deptsRes.json()
    positions.value = await positionsRes.json()
    units.value = await unitsRes.json()
    specs.value = await specsRes.json()
    strategies.value = await strategiesRes.json()
  } catch (e) {
    console.error(e)
  }
}

// 门店操作
const showStoreDialog = (row?: any) => {
  storeForm.value = row ? { ...row } : { name: '', code: '', address: '', phone: '', manager: '', isActive: true }
  storeDialogVisible.value = true
}

const saveStore = async () => {
  try {
    const url = storeForm.value.id 
      ? `${API_BASE}/data-settings/stores/${storeForm.value.id}`
      : `${API_BASE}/data-settings/stores`
    const method = storeForm.value.id ? 'PUT' : 'POST'
    
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(storeForm.value)
    })
    
    ElMessage.success('保存成功')
    storeDialogVisible.value = false
    loadData()
  } catch (e) {
    ElMessage.error('保存失败')
  }
}

const deleteStore = async (id: string) => {
  await ElMessageBox.confirm('确定删除该门店？', '提示', { type: 'warning' })
  await fetch(`${API_BASE}/data-settings/stores/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
  ElMessage.success('删除成功')
  loadData()
}

// 部门操作
const showDepartmentDialog = (row?: any) => {
  departmentForm.value = row ? { ...row } : { name: '', code: '', parentId: '', isActive: true }
  departmentDialogVisible.value = true
}

const saveDepartment = async () => {
  try {
    const url = departmentForm.value.id 
      ? `${API_BASE}/data-settings/departments/${departmentForm.value.id}`
      : `${API_BASE}/data-settings/departments`
    const method = departmentForm.value.id ? 'PUT' : 'POST'
    
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(departmentForm.value)
    })
    
    ElMessage.success('保存成功')
    departmentDialogVisible.value = false
    loadData()
  } catch (e) {
    ElMessage.error('保存失败')
  }
}

const deleteDepartment = async (id: string) => {
  await ElMessageBox.confirm('确定删除该部门？', '提示', { type: 'warning' })
  await fetch(`${API_BASE}/data-settings/departments/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
  ElMessage.success('删除成功')
  loadData()
}

// 职位操作
const showPositionDialog = (row?: any) => {
  positionForm.value = row ? { ...row } : { name: '', code: '', baseSalary: 0, commissionRate: 0, isActive: true }
  positionDialogVisible.value = true
}

const savePosition = async () => {
  try {
    const url = positionForm.value.id 
      ? `${API_BASE}/data-settings/positions/${positionForm.value.id}`
      : `${API_BASE}/data-settings/positions`
    const method = positionForm.value.id ? 'PUT' : 'POST'
    
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(positionForm.value)
    })
    
    ElMessage.success('保存成功')
    positionDialogVisible.value = false
    loadData()
  } catch (e) {
    ElMessage.error('保存失败')
  }
}

const deletePosition = async (id: string) => {
  await ElMessageBox.confirm('确定删除该职位？', '提示', { type: 'warning' })
  await fetch(`${API_BASE}/data-settings/positions/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
  ElMessage.success('删除成功')
  loadData()
}

// 单位操作
const showUnitDialog = (row?: any) => {
  unitForm.value = row ? { ...row } : { name: '', code: '', symbol: '' }
  unitDialogVisible.value = true
}

const saveUnit = async () => {
  try {
    const url = unitForm.value.id 
      ? `${API_BASE}/data-settings/product-units/${unitForm.value.id}`
      : `${API_BASE}/data-settings/product-units`
    const method = unitForm.value.id ? 'PUT' : 'POST'
    
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(unitForm.value)
    })
    
    ElMessage.success('保存成功')
    unitDialogVisible.value = false
    loadData()
  } catch (e) {
    ElMessage.error('保存失败')
  }
}

const deleteUnit = async (id: string) => {
  await ElMessageBox.confirm('确定删除该单位？', '提示', { type: 'warning' })
  await fetch(`${API_BASE}/data-settings/product-units/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
  ElMessage.success('删除成功')
  loadData()
}

// 规格操作
const showSpecDialog = (row?: any) => {
  specForm.value = row ? { ...row } : { name: '', code: '', values: [] }
  specDialogVisible.value = true
}

const saveSpec = async () => {
  try {
    const url = specForm.value.id 
      ? `${API_BASE}/data-settings/product-specs/${specForm.value.id}`
      : `${API_BASE}/data-settings/product-specs`
    const method = specForm.value.id ? 'PUT' : 'POST'
    
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(specForm.value)
    })
    
    ElMessage.success('保存成功')
    specDialogVisible.value = false
    loadData()
  } catch (e) {
    ElMessage.error('保存失败')
  }
}

const deleteSpec = async (id: string) => {
  await ElMessageBox.confirm('确定删除该规格？', '提示', { type: 'warning' })
  await fetch(`${API_BASE}/data-settings/product-specs/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
  ElMessage.success('删除成功')
  loadData()
}

// 策略操作
const showStrategyDialog = (row?: any) => {
  strategyForm.value = row ? { ...row } : { name: '', code: '', type: 'percentage', value: 100 }
  strategyDialogVisible.value = true
}

const saveStrategy = async () => {
  try {
    const url = strategyForm.value.id 
      ? `${API_BASE}/data-settings/price-strategies/${strategyForm.value.id}`
      : `${API_BASE}/data-settings/price-strategies`
    const method = strategyForm.value.id ? 'PUT' : 'POST'
    
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(strategyForm.value)
    })
    
    ElMessage.success('保存成功')
    strategyDialogVisible.value = false
    loadData()
  } catch (e) {
    ElMessage.error('保存失败')
  }
}

const deleteStrategy = async (id: string) => {
  await ElMessageBox.confirm('确定删除该策略？', '提示', { type: 'warning' })
  await fetch(`${API_BASE}/data-settings/price-strategies/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
  ElMessage.success('删除成功')
  loadData()
}

onMounted(loadData)
</script>

<style scoped>
.data-settings-page {
  padding: 20px;
}
</style>
