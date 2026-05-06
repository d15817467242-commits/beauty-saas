<template>
  <div class="employee-service">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>员工服务项目</span>
        </div>
      </template>

      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="员工">
          <el-select v-model="searchForm.employeeId" placeholder="选择员工" clearable filterable>
            <el-option v-for="e in employees" :key="e.id" :label="e.name" :value="e.id" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadData">查询</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="tableData" v-loading="loading">
        <el-table-column prop="employeeName" label="员工" />
        <el-table-column prop="serviceName" label="服务项目" />
        <el-table-column prop="price" label="服务价格">
          <template #default="{ row }">¥{{ row.price || '-' }}</template>
        </el-table-column>
        <el-table-column prop="commissionRate" label="提成比例">
          <template #default="{ row }">{{ row.commissionRate ? row.commissionRate + '%' : '-' }}</template>
        </el-table-column>
        <el-table-column prop="duration" label="服务时长">
          <template #default="{ row }">{{ row.duration ? row.duration + '分钟' : '-' }}</template>
        </el-table-column>
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.isActive ? 'success' : 'info'">{{ row.isActive ? '启用' : '禁用' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="danger" @click="handleDelete(row)">移除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 批量分配 -->
    <el-card class="mt-20">
      <template #header>
        <span>批量分配服务</span>
      </template>
      <el-form :model="assignForm" label-width="100px">
        <el-form-item label="选择员工">
          <el-select v-model="assignForm.employeeId" placeholder="选择员工" filterable>
            <el-option v-for="e in employees" :key="e.id" :label="e.name" :value="e.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="选择服务">
          <el-select v-model="assignForm.serviceIds" multiple placeholder="选择服务项目">
            <el-option v-for="s in services" :key="s.id" :label="s.name" :value="s.id" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="batchAssign">批量分配</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 编辑对话框 -->
    <el-dialog v-model="dialogVisible" title="编辑员工服务" width="500px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="服务价格">
          <el-input-number v-model="form.price" :min="0" :precision="2" />
        </el-form-item>
        <el-form-item label="提成比例(%)">
          <el-input-number v-model="form.commissionRate" :min="0" :max="100" :precision="2" />
        </el-form-item>
        <el-form-item label="服务时长">
          <el-input-number v-model="form.duration" :min="0" />
          <span class="ml-2">分钟</span>
        </el-form-item>
        <el-form-item label="启用">
          <el-switch v-model="form.isActive" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveData">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request'

const loading = ref(false)
const tableData = ref<any[]>([])
const employees = ref<any[]>([])
const services = ref<any[]>([])
const dialogVisible = ref(false)

const searchForm = reactive({
  employeeId: ''
})

const assignForm = reactive({
  employeeId: '',
  serviceIds: [] as string[]
})

const form = ref<any>({
  price: 0,
  commissionRate: 0,
  duration: 0,
  isActive: true
})

onMounted(() => {
  loadEmployees()
  loadServices()
  loadData()
})

async function loadEmployees() {
  try {
    const res = await request.get('/employees')
    employees.value = res.data
  } catch (e) {
    console.error(e)
  }
}

async function loadServices() {
  try {
    const res = await request.get('/services')
    services.value = res.data
  } catch (e) {
    console.error(e)
  }
}

async function loadData() {
  loading.value = true
  try {
    const res = await request.get('/employee-service', {
      params: searchForm
    })
    tableData.value = res.data
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

function handleEdit(row: any) {
  form.value = { ...row }
  dialogVisible.value = true
}

async function handleDelete(row: any) {
  try {
    await ElMessageBox.confirm('确定移除该服务?', '提示')
    await request.delete(`/employee-service/${row.id}`)
    ElMessage.success('移除成功')
    loadData()
  } catch (e) {
    console.error(e)
  }
}

async function saveData() {
  try {
    await request.put(`/employee-service/${form.value.id}`, form.value)
    ElMessage.success('保存成功')
    dialogVisible.value = false
    loadData()
  } catch (e) {
    console.error(e)
  }
}

async function batchAssign() {
  if (!assignForm.employeeId || assignForm.serviceIds.length === 0) {
    ElMessage.warning('请选择员工和服务')
    return
  }
  try {
    await request.post('/employee-service/batch-assign', assignForm)
    ElMessage.success('分配成功')
    assignForm.serviceIds = []
    loadData()
  } catch (e) {
    console.error(e)
  }
}
</script>

<style scoped>
.employee-service {
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
.mt-20 {
  margin-top: 20px;
}
.ml-2 {
  margin-left: 8px;
}
</style>
