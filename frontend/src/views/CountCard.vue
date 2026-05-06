<template>
  <div class="count-card-page">
    <el-row :gutter="20">
      <!-- 次卡套餐管理 -->
      <el-col :span="24">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>次卡套餐管理</span>
              <el-button type="primary" @click="handleAddPackage">新增套餐</el-button>
            </div>
          </template>
          <el-table :data="packageList" v-loading="loading" stripe>
            <el-table-column prop="name" label="套餐名称" />
            <el-table-column prop="code" label="编码" />
            <el-table-column label="次数">
              <template #default="{ row }">
                {{ row.count }}次
                <el-tag v-if="row.giftCount" type="success" size="small">+{{ row.giftCount }}次</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="price" label="价格">
              <template #default="{ row }">
                ¥{{ row.price }}
              </template>
            </el-table-column>
            <el-table-column prop="validDays" label="有效期">
              <template #default="{ row }">
                {{ row.validDays ? `${row.validDays}天` : '永久有效' }}
              </template>
            </el-table-column>
            <el-table-column prop="description" label="描述" show-overflow-tooltip />
            <el-table-column prop="isActive" label="状态">
              <template #default="{ row }">
                <el-tag :type="row.isActive ? 'success' : 'info'">
                  {{ row.isActive ? '启用' : '禁用' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="180">
              <template #default="{ row }">
                <el-button size="small" @click="handleEditPackage(row)">编辑</el-button>
                <el-button size="small" type="danger" @click="handleDeletePackage(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <!-- 新增/编辑套餐对话框 -->
    <el-dialog v-model="packageDialogVisible" :title="isEditPackage ? '编辑套餐' : '新增套餐'" width="550px">
      <el-form :model="packageForm" label-width="100px">
        <el-form-item label="套餐名称" required>
          <el-input v-model="packageForm.name" placeholder="请输入套餐名称" />
        </el-form-item>
        <el-form-item label="套餐编码">
          <el-input v-model="packageForm.code" placeholder="请输入编码（可选）" />
        </el-form-item>
        <el-form-item label="次数" required>
          <el-input-number v-model="packageForm.count" :min="1" :max="999" />
        </el-form-item>
        <el-form-item label="赠送次数">
          <el-input-number v-model="packageForm.giftCount" :min="0" :max="999" />
        </el-form-item>
        <el-form-item label="价格" required>
          <el-input-number v-model="packageForm.price" :min="0" :precision="2" />
        </el-form-item>
        <el-form-item label="有效天数">
          <el-input-number v-model="packageForm.validDays" :min="0" placeholder="0表示永久有效" />
          <span style="margin-left: 10px; color: #909399; font-size: 12px;">0表示永久有效</span>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="packageForm.description" type="textarea" rows="2" placeholder="套餐描述" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="packageForm.isActive" active-text="启用" inactive-text="禁用" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="packageDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmitPackage">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const API_BASE = 'http://localhost:3000/api'
const token = localStorage.getItem('token') || ''

const loading = ref(false)
const submitting = ref(false)
const packageList = ref<any[]>([])
const packageDialogVisible = ref(false)
const isEditPackage = ref(false)
const editPackageId = ref('')

const packageForm = ref({
  name: '',
  code: '',
  count: 10,
  giftCount: 0,
  price: 100,
  validDays: 365,
  description: '',
  isActive: true
})

const resetPackageForm = () => {
  packageForm.value = {
    name: '',
    code: '',
    count: 10,
    giftCount: 0,
    price: 100,
    validDays: 365,
    description: '',
    isActive: true
  }
}

const loadPackages = async () => {
  loading.value = true
  try {
    const res = await fetch(`${API_BASE}/count-card/packages`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    packageList.value = await res.json()
  } catch (e) {
    ElMessage.error('加载失败')
  } finally {
    loading.value = false
  }
}

const handleAddPackage = () => {
  isEditPackage.value = false
  resetPackageForm()
  packageDialogVisible.value = true
}

const handleEditPackage = (row: any) => {
  isEditPackage.value = true
  editPackageId.value = row.id
  packageForm.value = {
    name: row.name,
    code: row.code || '',
    count: row.count,
    giftCount: row.giftCount || 0,
    price: row.price,
    validDays: row.validDays || 0,
    description: row.description || '',
    isActive: row.isActive
  }
  packageDialogVisible.value = true
}

const handleDeletePackage = async (row: any) => {
  try {
    await ElMessageBox.confirm('确定要删除该套餐吗？', '提示', { type: 'warning' })
    const res = await fetch(`${API_BASE}/count-card/packages/${row.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    })
    if (res.ok) {
      ElMessage.success('删除成功')
      loadPackages()
    } else {
      ElMessage.error('删除失败')
    }
  } catch (e) {}
}

const handleSubmitPackage = async () => {
  if (!packageForm.value.name || !packageForm.value.count || packageForm.value.price === undefined) {
    ElMessage.warning('请填写完整信息')
    return
  }
  submitting.value = true
  try {
    const url = isEditPackage.value 
      ? `${API_BASE}/count-card/packages/${editPackageId.value}` 
      : `${API_BASE}/count-card/packages`
    const method = isEditPackage.value ? 'PATCH' : 'POST'
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(packageForm.value)
    })
    if (res.ok) {
      ElMessage.success(isEditPackage.value ? '修改成功' : '添加成功')
      packageDialogVisible.value = false
      loadPackages()
    } else {
      const err = await res.json()
      ElMessage.error(err.message || '操作失败')
    }
  } catch (e) {
    ElMessage.error('网络错误')
  } finally {
    submitting.value = false
  }
}

onMounted(loadPackages)
</script>

<style scoped>
.count-card-page {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
