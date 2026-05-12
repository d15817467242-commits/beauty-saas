<template>
  <div class="license-manage">
    <div class="page-header">
      <h2>密钥管理</h2>
      <div style="display: flex; gap: 10px; align-items: center;">
        <el-select v-model="selectedStoreId" placeholder="选择门店" style="width: 180px;" required>
          <el-option v-for="s in storeList" :key="s.id" :label="s.name" :value="s.id" />
        </el-select>
        <el-input v-model="remark" placeholder="备注（选填，如：给XX老板）" style="width: 200px;" />
        <el-input-number v-model="genCount" :min="1" :max="50" style="width: 120px;" />
        <el-button type="primary" @click="handleGenerate" :loading="generating" :disabled="!selectedStoreId">生成密钥</el-button>
      </div>
    </div>

    <el-alert type="info" :closable="false" style="margin-bottom: 16px;">
      一店一钥：每个密钥绑定一个门店，店家注册后自动归属该门店。将密钥复制发给店家即可。
    </el-alert>

    <el-table :data="licenseList" v-loading="loading" stripe border style="width: 100%;">
      <el-table-column prop="key" label="密钥" width="240">
        <template #default="{ row }">
          <span style="font-family: monospace; font-size: 15px; letter-spacing: 1px; font-weight: 600;">{{ row.key }}</span>
          <el-button type="primary" link size="small" style="margin-left: 8px;" @click="copyKey(row.key)">复制</el-button>
        </template>
      </el-table-column>
      <el-table-column label="绑定门店" width="160">
        <template #default="{ row }">
          <span v-if="row.storeId">{{ getStoreName(row.storeId) }}</span>
          <span v-else style="color: #c0c4cc;">—</span>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="statusMap[row.status]?.type" size="small" effect="dark">{{ statusMap[row.status]?.label }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="remark" label="备注" min-width="140">
        <template #default="{ row }">{{ row.remark || '—' }}</template>
      </el-table-column>
      <el-table-column label="使用者" width="120">
        <template #default="{ row }">
          <span v-if="row.usedBy" style="color: #409eff;">{{ row.usedBy }}</span>
          <span v-else style="color: #c0c4cc;">—</span>
        </template>
      </el-table-column>
      <el-table-column label="使用时间" width="170">
        <template #default="{ row }">{{ row.usedAt ? new Date(row.usedAt).toLocaleString('zh-CN') : '—' }}</template>
      </el-table-column>
      <el-table-column label="操作" width="100" fixed="right" align="center">
        <template #default="{ row }">
          <el-button v-if="row.status === 'unused'" type="danger" link size="small" @click="handleRevoke(row)">作废</el-button>
          <span v-else style="color: #c0c4cc; font-size: 12px;">—</span>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request'

const loading = ref(false)
const generating = ref(false)
const licenseList = ref<any[]>([])
const storeList = ref<{ id: string; name: string }[]>([])
const selectedStoreId = ref('')
const remark = ref('')
const genCount = ref(1)

const statusMap: Record<string, { label: string; type: string }> = {
  unused: { label: '未使用', type: 'info' },
  used: { label: '已使用', type: 'success' },
  revoked: { label: '已作废', type: 'danger' },
}

const getStoreName = (storeId: string) => {
  const s = storeList.value.find(s => s.id === storeId)
  return s?.name || storeId
}

const loadStores = async () => {
  try {
    const res = await request.get('/stores/active')
    storeList.value = Array.isArray(res) ? res : (res.data || [])
    if (storeList.value.length > 0 && !selectedStoreId.value) {
      selectedStoreId.value = storeList.value[0].id
    }
  } catch {}
}

const loadList = async () => {
  loading.value = true
  try {
    const res = await request.get('/license')
    licenseList.value = Array.isArray(res) ? res : (res.data || [])
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || '加载失败')
  } finally {
    loading.value = false
  }
}

const handleGenerate = async () => {
  if (!selectedStoreId.value) {
    ElMessage.warning('请先选择门店')
    return
  }
  generating.value = true
  try {
    const res = await request.post('/license/generate', {
      storeId: selectedStoreId.value,
      count: genCount.value,
      remark: remark.value || undefined,
    })
    const keys = res.data || res
    ElMessage.success(`成功生成 ${Array.isArray(keys) ? keys.length : 1} 个密钥`)
    remark.value = ''
    await loadList()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || '生成失败')
  } finally {
    generating.value = false
  }
}

const handleRevoke = async (row: any) => {
  try {
    await ElMessageBox.confirm(`确定要作废密钥 ${row.key} 吗？`, '确认作废', { type: 'warning' })
    await request.patch(`/license/${row.id}/revoke`)
    ElMessage.success('已作废')
    await loadList()
  } catch {}
}

const copyKey = async (key: string) => {
  try {
    await navigator.clipboard.writeText(key)
    ElMessage.success('已复制到剪贴板')
  } catch {
    const input = document.createElement('input')
    input.value = key
    document.body.appendChild(input)
    input.select()
    document.execCommand('copy')
    document.body.removeChild(input)
    ElMessage.success('已复制到剪贴板')
  }
}

onMounted(() => {
  loadStores()
  loadList()
})
</script>

<style scoped>
.license-manage { padding: 20px; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.page-header h2 { margin: 0; font-size: 20px; }
</style>
