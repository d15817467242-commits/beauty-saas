<template>
  <div class="user-manage">
    <div class="page-header">
      <h2>帐号管理</h2>
      <el-button type="primary" @click="showAddDialog">新增帐号</el-button>
    </div>

    <!-- 搜索和筛选 -->
    <div class="search-bar">
      <el-input v-model="keyword" placeholder="搜索用户名/姓名/手机号" clearable style="width: 250px" @clear="loadUsers" @keyup.enter="loadUsers">
        <template #prefix><el-icon><Search /></el-icon></template>
      </el-input>
      <el-select v-model="roleFilter" placeholder="角色筛选" clearable style="width: 140px; margin-left: 8px;" @change="loadUsers">
        <el-option label="管理员" value="admin" />
        <el-option label="店长" value="manager" />
        <el-option label="收银员" value="cashier" />
        <el-option label="员工" value="employee" />
      </el-select>
    </div>

    <!-- 用户列表 -->
    <el-table :data="filteredUsers" v-loading="loading" stripe border style="width: 100%">
      <el-table-column prop="username" label="用户名" width="120" />
      <el-table-column prop="name" label="姓名" width="100" />
      <el-table-column prop="phone" label="手机号" width="130" />
      <el-table-column prop="role" label="角色" width="160">
        <template #default="{ row }">
          <el-tag :type="roleTagType(row.role)" effect="dark" size="small">{{ roleLabel(row.role) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="关联门店" min-width="180">
        <template #default="{ row }">
          <span v-if="row.stores && row.stores.length > 0">
            {{ row.stores.map(s => s.name).join('、') }}
          </span>
          <span v-else-if="row.role === 'superadmin'" style="color: #e6a23c;">全部门店</span>
          <span v-else style="color: #c0c4cc;">未分配</span>
        </template>
      </el-table-column>
      <el-table-column prop="isActive" label="状态" width="80" align="center">
        <template #default="{ row }">
          <el-tag :type="row.isActive === '1' || row.isActive === true ? 'success' : 'danger'" size="small">
            {{ row.isActive === '1' || row.isActive === true ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="240" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="editUser(row)">编辑</el-button>
          <el-button size="small" type="warning" @click="toggleActive(row)">
            {{ row.isActive === '1' || row.isActive === true ? '禁用' : '启用' }}
          </el-button>
          <el-button v-if="userStore.isSuperAdmin && row.role !== 'superadmin'" size="small" type="info" @click="editStores(row)">门店</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑帐号' : '新增帐号'" width="480px">
      <el-form :model="form" :rules="formRules" ref="formRef" label-width="80px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" placeholder="请输入用户名" :disabled="isEdit" />
        </el-form-item>
        <el-form-item v-if="!isEdit" label="密码" prop="password">
          <el-input v-model="form.password" type="password" show-password placeholder="请输入密码" />
        </el-form-item>
        <el-form-item label="姓名" prop="name">
          <el-input v-model="form.name" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="form.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="form.role" placeholder="请选择角色" style="width: 100%;">
            <el-option v-if="userStore.isSuperAdmin" label="管理员 — 管理门店业务" value="admin" />
            <el-option label="店长 — 管理本店业务" value="manager" />
            <el-option label="收银员 — 收银开单" value="cashier" />
            <el-option label="员工 — 基础查看" value="employee" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>

    <!-- 门店关联弹窗 -->
    <el-dialog v-model="storeDialogVisible" title="修改关联门店" width="480px">
      <el-checkbox-group v-model="selectedStoreIds">
        <el-checkbox v-for="s in allStores" :key="s.id" :label="s.id">{{ s.name }}</el-checkbox>
      </el-checkbox-group>
      <template #footer>
        <el-button @click="storeDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveStores" :loading="savingStores">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import request from '@/utils/request'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

const loading = ref(false)
const users = ref<any[]>([])
const keyword = ref('')
const roleFilter = ref('')
const dialogVisible = ref(false)
const isEdit = ref(false)
const submitting = ref(false)
const formRef = ref<FormInstance>()
const editingId = ref('')

// 门店关联
const storeDialogVisible = ref(false)
const savingStores = ref(false)
const allStores = ref<{ id: string; name: string }[]>([])
const selectedStoreIds = ref<string[]>([])
const editingUserId = ref('')

const form = ref({ username: '', password: '', name: '', phone: '', role: 'employee' })

const formRules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }, { min: 6, message: '密码至少6位', trigger: 'blur' }],
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  role: [{ required: true, message: '请选择角色', trigger: 'change' }],
}

const roleLabels: Record<string, string> = {
  superadmin: '服务商',
  admin: '管理员',
  manager: '店长',
  employee: '员工',
  cashier: '收银员',
}
const roleLabel = (role: string) => roleLabels[role] || role
const roleTagType = (role: string) => {
  const map: Record<string, string> = { superadmin: 'danger', admin: 'warning', manager: '', cashier: 'success', employee: 'info' }
  return map[role] || ''
}

const filteredUsers = computed(() => {
  let list = users.value
  if (keyword.value) {
    const kw = keyword.value.toLowerCase()
    list = list.filter(u =>
      (u.username || '').toLowerCase().includes(kw) ||
      (u.name || '').toLowerCase().includes(kw) ||
      (u.phone || '').includes(kw)
    )
  }
  if (roleFilter.value) {
    list = list.filter(u => u.role === roleFilter.value)
  }
  return list
})

const loadUsers = async () => {
  loading.value = true
  try {
    const res = await request.get('/users')
    users.value = Array.isArray(res) ? res : (res.data || [])
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || '加载失败')
  } finally {
    loading.value = false
  }
}

const loadStores = async () => {
  try {
    const res = await request.get('/stores')
    allStores.value = Array.isArray(res) ? res : (res.data || [])
  } catch {}
}

const showAddDialog = () => {
  isEdit.value = false
  editingId.value = ''
  form.value = { username: '', password: '', name: '', phone: '', role: 'employee' }
  dialogVisible.value = true
}

const editUser = (row: any) => {
  isEdit.value = true
  editingId.value = row.id
  form.value = { username: row.username, password: '', name: row.name, phone: row.phone || '', role: row.role }
  dialogVisible.value = true
}

const submitForm = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    submitting.value = true
    try {
      if (isEdit.value) {
        const data: any = { username: form.value.username, name: form.value.name, phone: form.value.phone, role: form.value.role }
        if (form.value.password) data.password = form.value.password
        await request.patch(`/users/${editingId.value}`, data)
        ElMessage.success('修改成功')
      } else {
        await request.post('/users', form.value)
        ElMessage.success('新增成功')
      }
      dialogVisible.value = false
      loadUsers()
    } catch (e: any) {
      ElMessage.error(e?.response?.data?.message || '操作失败')
    } finally {
      submitting.value = false
    }
  })
}

const toggleActive = async (row: any) => {
  const newActive = (row.isActive === '1' || row.isActive === true) ? '0' : '1'
  const label = newActive === '1' ? '启用' : '禁用'
  try {
    await ElMessageBox.confirm(`确定${label}帐号 "${row.name}" 吗？`, '提示', { type: 'warning' })
    await request.patch(`/users/${row.id}`, { isActive: newActive })
    ElMessage.success(`${label}成功`)
    loadUsers()
  } catch {}
}

const editStores = (row: any) => {
  editingUserId.value = row.id
  selectedStoreIds.value = (row.stores || []).map(s => s.id)
  storeDialogVisible.value = true
}

const saveStores = async () => {
  savingStores.value = true
  try {
    await request.patch(`/users/${editingUserId.value}/stores`, { storeIds: selectedStoreIds.value })
    ElMessage.success('门店关联已更新')
    storeDialogVisible.value = false
    loadUsers()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || '操作失败')
  } finally {
    savingStores.value = false
  }
}

onMounted(() => {
  loadUsers()
  loadStores()
})
</script>

<style scoped>
.user-manage { padding: 20px; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.page-header h2 { margin: 0; font-size: 20px; }
.search-bar { margin-bottom: 16px; display: flex; align-items: center; }
</style>