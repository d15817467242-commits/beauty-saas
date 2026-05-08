<template>
  <div class="user-manage">
    <div class="page-header">
      <h2>用户管理</h2>
      <el-button type="primary" @click="showAddDialog">新增用户</el-button>
    </div>

    <!-- 搜索栏 -->
    <div class="search-bar">
      <el-input v-model="keyword" placeholder="搜索用户名/姓名/手机号" clearable style="width: 300px" @clear="loadUsers" @keyup.enter="loadUsers">
        <template #prefix><el-icon><Search /></el-icon></template>
      </el-input>
      <el-button type="primary" link @click="loadUsers" style="margin-left: 8px">搜索</el-button>
    </div>

    <!-- 用户列表 -->
    <el-table :data="users" v-loading="loading" stripe border style="width: 100%">
      <el-table-column prop="username" label="用户名" width="140" />
      <el-table-column prop="name" label="姓名" width="120" />
      <el-table-column prop="phone" label="手机号" width="140" />
      <el-table-column prop="role" label="角色" width="100">
        <template #default="{ row }">
          <el-tag :type="roleTagType(row.role)">{{ roleLabel(row.role) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="isActive" label="状态" width="80">
        <template #default="{ row }">
          <el-tag :type="row.isActive === '1' || row.isActive === true ? 'success' : 'danger'" size="small">
            {{ row.isActive === '1' || row.isActive === true ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="创建时间" width="180">
        <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="260" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="editUser(row)">编辑</el-button>
          <el-button size="small" type="warning" @click="toggleActive(row)">
            {{ row.isActive === '1' || row.isActive === true ? '禁用' : '启用' }}
          </el-button>
          <el-button size="small" type="danger" @click="deleteUser(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑用户' : '新增用户'" width="480px">
      <el-form :model="form" :rules="formRules" ref="formRef" label-width="80px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" :disabled="isEdit" placeholder="请输入用户名" />
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
          <el-select v-model="form.role" placeholder="请选择角色">
            <el-option label="管理员" value="admin" />
            <el-option label="店长" value="manager" />
            <el-option label="员工" value="employee" />
            <el-option label="收银员" value="cashier" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import axios from '@/utils/request'

const loading = ref(false)
const users = ref<any[]>([])
const keyword = ref('')
const dialogVisible = ref(false)
const isEdit = ref(false)
const submitting = ref(false)
const formRef = ref<FormInstance>()
const editingId = ref('')

const form = reactive({ username: '', password: '', name: '', phone: '', role: 'employee' })

const formRules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }, { min: 6, message: '密码至少6位', trigger: 'blur' }],
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  role: [{ required: true, message: '请选择角色', trigger: 'change' }]
}

const roleLabels: Record<string, string> = { admin: '管理员', manager: '店长', employee: '员工', cashier: '收银员' }
const roleLabel = (role: string) => roleLabels[role] || role
const roleTagType = (role: string) => {
  const map: Record<string, string> = { admin: 'danger', manager: 'warning', employee: '', cashier: 'success' }
  return map[role] || ''
}
const formatDate = (d: string) => d ? new Date(d).toLocaleString('zh-CN') : ''

const loadUsers = async () => {
  loading.value = true
  try {
    const res = await axios.get('/users')
    let list = res.data || res
    if (keyword.value) {
      const kw = keyword.value.toLowerCase()
      list = list.filter((u: any) => (u.username || '').toLowerCase().includes(kw) || (u.name || '').toLowerCase().includes(kw) || (u.phone || '').includes(kw))
    }
    users.value = list
  } catch (e: any) { ElMessage.error(e.response?.data?.message || '加载失败') }
  finally { loading.value = false }
}

const showAddDialog = () => {
  isEdit.value = false
  editingId.value = ''
  Object.assign(form, { username: '', password: '', name: '', phone: '', role: 'employee' })
  dialogVisible.value = true
}

const editUser = (row: any) => {
  isEdit.value = true
  editingId.value = row.id
  Object.assign(form, { username: row.username, password: '', name: row.name, phone: row.phone || '', role: row.role })
  dialogVisible.value = true
}

const submitForm = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    submitting.value = true
    try {
      if (isEdit.value) {
        const data: any = { name: form.name, phone: form.phone, role: form.role }
        if (form.password) data.password = form.password
        await axios.patch(`/users/${editingId.value}`, data)
        ElMessage.success('修改成功')
      } else {
        await axios.post('/users', form)
        ElMessage.success('新增成功')
      }
      dialogVisible.value = false
      loadUsers()
    } catch (e: any) { ElMessage.error(e.response?.data?.message || '操作失败') }
    finally { submitting.value = false }
  })
}

const toggleActive = async (row: any) => {
  const newActive = (row.isActive === '1' || row.isActive === true) ? '0' : '1'
  const label = newActive === '1' ? '启用' : '禁用'
  try {
    await ElMessageBox.confirm(`确定${label}用户 "${row.name}" 吗？`, '提示', { type: 'warning' })
    await axios.patch(`/users/${row.id}`, { isActive: newActive })
    ElMessage.success(`${label}成功`)
    loadUsers()
  } catch {}
}

const deleteUser = async (row: any) => {
  try {
    await ElMessageBox.confirm(`确定删除用户 "${row.name}" 吗？此操作不可恢复！`, '警告', { type: 'error' })
    await axios.delete(`/users/${row.id}`)
    ElMessage.success('删除成功')
    loadUsers()
  } catch {}
}

onMounted(loadUsers)
</script>

<style scoped>
.user-manage { padding: 20px; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.page-header h2 { margin: 0; font-size: 20px; }
.search-bar { margin-bottom: 16px; display: flex; align-items: center; }
</style>
