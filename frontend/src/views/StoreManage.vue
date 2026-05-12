<template>
  <div class="store-manage">
    <div class="page-header">
      <h2>门店管理</h2>
      <el-button v-if="userStore.isSuperAdmin" type="primary" @click="showAddDialog">新增门店</el-button>
    </div>

    <!-- 门店列表 -->
    <el-table :data="stores" v-loading="loading" stripe border style="width: 100%">
      <el-table-column prop="name" label="门店名称" min-width="160" />
      <el-table-column prop="address" label="地址" min-width="200">
        <template #default="{ row }">
          {{ row.address || '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="phone" label="电话" width="140">
        <template #default="{ row }">{{ row.phone || '-' }}</template>
      </el-table-column>
      <el-table-column label="管理员" min-width="140">
        <template #default="{ row }">
          <span v-if="row.admins && row.admins.length > 0">
            {{ row.admins.map(a => a.name).join('、') }}
          </span>
          <span v-else style="color: #c0c4cc;">未分配</span>
        </template>
      </el-table-column>
      <el-table-column prop="memberCount" label="会员数" width="90" align="center" />
      <el-table-column prop="employeeCount" label="员工数" width="90" align="center" />
      <el-table-column label="状态" width="90" align="center">
        <template #default="{ row }">
          <el-tag :type="row.status === 'active' ? 'success' : 'info'" size="small">
            {{ row.status === 'active' ? '活跃' : row.status || '活跃' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="editStore(row)">编辑</el-button>
          <el-button v-if="userStore.isSuperAdmin" size="small" type="warning" @click="generateKey(row)">生成密钥</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑门店' : '新增门店'" width="520px">
      <el-form :model="form" :rules="formRules" ref="formRef" label-width="80px">
        <el-form-item label="门店名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入门店名称" />
        </el-form-item>
        <el-form-item label="地址" prop="address">
          <el-input v-model="form.address" placeholder="请输入门店地址" />
        </el-form-item>
        <el-form-item label="电话" prop="phone">
          <el-input v-model="form.phone" placeholder="请输入门店电话" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="form.status" style="width: 100%;">
            <el-option label="活跃" value="active" />
            <el-option label="停用" value="inactive" />
            <el-option label="维护中" value="maintenance" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>

    <!-- 生成密钥弹窗 -->
    <el-dialog v-model="keyDialogVisible" title="生成密钥" width="480px">
      <el-form label-width="80px">
        <el-form-item label="门店">
          <el-input :model-value="keyStoreName" disabled />
        </el-form-item>
        <el-form-item label="密钥数量">
          <el-input-number v-model="keyCount" :min="1" :max="10" />
        </el-form-item>
      </el-form>
      <div v-if="generatedKeys.length > 0" style="margin-top: 16px;">
        <el-alert type="success" :closable="false" style="margin-bottom: 8px;">
          已生成 {{ generatedKeys.length }} 个密钥，请复制后发给客户
        </el-alert>
        <div v-for="key in generatedKeys" :key="key" class="key-item">
          <el-input :model-value="key" readonly>
            <template #append>
              <el-button @click="copyKey(key)">复制</el-button>
            </template>
          </el-input>
        </div>
      </div>
      <template #footer>
        <el-button @click="keyDialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="doGenerateKey" :loading="generatingKey">生成</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import request from '@/utils/request'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

const loading = ref(false)
const stores = ref<any[]>([])
const dialogVisible = ref(false)
const isEdit = ref(false)
const submitting = ref(false)
const formRef = ref<FormInstance>()
const editingId = ref('')

const form = ref({ name: '', address: '', phone: '', status: 'active' })

const formRules: FormRules = {
  name: [{ required: true, message: '请输入门店名称', trigger: 'blur' }],
}

// 密钥生成
const keyDialogVisible = ref(false)
const keyStoreId = ref('')
const keyStoreName = ref('')
const keyCount = ref(1)
const generatingKey = ref(false)
const generatedKeys = ref<string[]>([])

const loadStores = async () => {
  loading.value = true
  try {
    const res = await request.get('/stores')
    stores.value = Array.isArray(res) ? res : (res.data || [])
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || '加载失败')
  } finally {
    loading.value = false
  }
}

const showAddDialog = () => {
  isEdit.value = false
  editingId.value = ''
  form.value = { name: '', address: '', phone: '', status: 'active' }
  dialogVisible.value = true
}

const editStore = (row: any) => {
  isEdit.value = true
  editingId.value = row.id
  form.value = { name: row.name, address: row.address || '', phone: row.phone || '', status: row.status || 'active' }
  dialogVisible.value = true
}

const submitForm = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    submitting.value = true
    try {
      if (isEdit.value) {
        await request.put(`/stores/${editingId.value}`, form.value)
        ElMessage.success('修改成功')
      } else {
        await request.post('/stores', form.value)
        ElMessage.success('新增成功')
      }
      dialogVisible.value = false
      loadStores()
    } catch (e: any) {
      ElMessage.error(e?.response?.data?.message || '操作失败')
    } finally {
      submitting.value = false
    }
  })
}

const generateKey = (row: any) => {
  keyStoreId.value = row.id
  keyStoreName.value = row.name
  keyCount.value = 1
  generatedKeys.value = []
  keyDialogVisible.value = true
}

const doGenerateKey = async () => {
  generatingKey.value = true
  try {
    const res = await request.post('/license/generate', {
      storeId: keyStoreId.value,
      count: keyCount.value,
    })
    if (res?.key) {
      generatedKeys.value = [res.key]
    } else if (res?.keys) {
      generatedKeys.value = res.keys
    } else if (Array.isArray(res)) {
      generatedKeys.value = res.map((k: any) => k.key || k)
    } else {
      generatedKeys.value = [JSON.stringify(res)]
    }
    ElMessage.success('密钥生成成功')
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || '生成失败')
  } finally {
    generatingKey.value = false
  }
}

const copyKey = (key: string) => {
  navigator.clipboard.writeText(key).then(() => {
    ElMessage.success('已复制到剪贴板')
  }).catch(() => {
    ElMessage.warning('复制失败，请手动复制')
  })
}

onMounted(() => {
  loadStores()
})
</script>

<style scoped>
.store-manage { padding: 20px; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.page-header h2 { margin: 0; font-size: 20px; }
.key-item { margin-bottom: 8px; }
</style>