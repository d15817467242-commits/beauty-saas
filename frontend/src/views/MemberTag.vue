<template>
  <div class="member-tag-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>会员标签管理</span>
          <el-button type="primary" @click="showTagDialog()">新增标签</el-button>
        </div>
      </template>

      <!-- 搜索栏 -->
      <el-form :inline="true" class="search-form">
        <el-form-item label="标签名称">
          <el-input v-model="searchName" placeholder="请输入标签名称" clearable @keyup.enter="loadTags" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadTags">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 标签列表 -->
      <el-table :data="tags" v-loading="loading" stripe>
        <el-table-column prop="name" label="标签名称" width="200">
          <template #default="{ row }">
            <el-tag :color="row.color" style="color: white;">{{ row.name }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="color" label="颜色" width="100">
          <template #default="{ row }">
            <div :style="{ width: '30px', height: '30px', backgroundColor: row.color, borderRadius: '4px' }"></div>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" />
        <el-table-column prop="memberCount" label="关联会员数" width="120">
          <template #default="{ row }">
            <el-link type="primary" @click="showMemberList(row)">{{ row.memberCount || 0 }} 人</el-link>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180">
          <template #default="{ row }">
            {{ row.createdAt ? new Date(row.createdAt).toLocaleString() : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button size="small" @click="showTagDialog(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="deleteTag(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="loadTags"
        @current-change="loadTags"
        style="margin-top: 16px; justify-content: flex-end;"
      />
    </el-card>

    <!-- 新增/编辑标签对话框 -->
    <el-dialog v-model="tagDialogVisible" :title="isEdit ? '编辑标签' : '新增标签'" width="500px">
      <el-form :model="tagForm" label-width="100px" :rules="tagRules" ref="tagFormRef">
        <el-form-item label="标签名称" prop="name">
          <el-input v-model="tagForm.name" placeholder="请输入标签名称" maxlength="20" show-word-limit />
        </el-form-item>
        <el-form-item label="标签颜色" prop="color">
          <el-color-picker v-model="tagForm.color" :predefine="predefineColors" />
          <span style="margin-left: 10px; color: #999;">选择标签显示颜色</span>
        </el-form-item>
        <el-form-item label="标签描述">
          <el-input 
            v-model="tagForm.description" 
            type="textarea" 
            :rows="3" 
            placeholder="请输入标签描述" 
            maxlength="100" 
            show-word-limit 
          />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="tagForm.sort" :min="0" :max="999" />
          <span style="margin-left: 10px; color: #999;">数字越小越靠前</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="tagDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="saveTag">保存</el-button>
      </template>
    </el-dialog>

    <!-- 关联会员列表对话框 -->
    <el-dialog v-model="memberListVisible" :title="`${currentTag?.name || ''} - 关联会员`" width="800px">
      <el-table :data="tagMembers" v-loading="membersLoading" stripe max-height="400">
        <el-table-column prop="name" label="姓名" />
        <el-table-column prop="phone" label="手机号" />
        <el-table-column prop="level" label="会员等级">
          <template #default="{ row }">
            <el-tag :type="levelMap[row.level]?.type || 'info'">
              {{ levelMap[row.level]?.label || row.level }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="balance" label="余额">
          <template #default="{ row }">¥{{ row.balance || 0 }}</template>
        </el-table-column>
        <el-table-column prop="points" label="积分">
          <template #default="{ row }">{{ row.points || 0 }}</template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'

const API_BASE = 'http://localhost:3000/api'
const token = localStorage.getItem('token') || ''

const levelMap: Record<string, { label: string; type: string }> = {
  normal: { label: '普通会员', type: 'info' },
  silver: { label: '银卡会员', type: '' },
  gold: { label: '金卡会员', type: 'warning' },
  diamond: { label: '钻石会员', type: 'success' }
}

const predefineColors = [
  '#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#909399',
  '#00B5D8', '#9C27B0', '#FF5722', '#795548', '#607D8B'
]

const loading = ref(false)
const submitting = ref(false)
const membersLoading = ref(false)
const tags = ref<any[]>([])
const tagMembers = ref<any[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const searchName = ref('')

const tagDialogVisible = ref(false)
const memberListVisible = ref(false)
const isEdit = ref(false)
const editId = ref('')
const currentTag = ref<any>(null)
const tagFormRef = ref<FormInstance>()

const tagForm = ref({
  name: '',
  color: '#409EFF',
  description: '',
  sort: 0
})

const tagRules: FormRules = {
  name: [
    { required: true, message: '请输入标签名称', trigger: 'blur' },
    { min: 1, max: 20, message: '长度在 1 到 20 个字符', trigger: 'blur' }
  ],
  color: [
    { required: true, message: '请选择标签颜色', trigger: 'change' }
  ]
}

const resetSearch = () => {
  searchName.value = ''
  currentPage.value = 1
  loadTags()
}

const loadTags = async () => {
  loading.value = true
  try {
    const params = new URLSearchParams({
      page: currentPage.value.toString(),
      pageSize: pageSize.value.toString(),
      name: searchName.value
    })
    const res = await fetch(`${API_BASE}/member-tags?${params}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const data = await res.json()
    tags.value = data.list || data
    total.value = data.total || tags.value.length
  } catch (e) {
    ElMessage.error('加载标签失败')
  } finally {
    loading.value = false
  }
}

const showTagDialog = (row?: any) => {
  isEdit.value = !!row
  editId.value = row?.id || ''
  tagForm.value = row ? {
    name: row.name,
    color: row.color,
    description: row.description || '',
    sort: row.sort || 0
  } : {
    name: '',
    color: '#409EFF',
    description: '',
    sort: 0
  }
  tagDialogVisible.value = true
}

const saveTag = async () => {
  if (!tagFormRef.value) return
  await tagFormRef.value.validate(async (valid) => {
    if (!valid) return
    
    submitting.value = true
    try {
      const url = isEdit.value ? `${API_BASE}/member-tags/${editId.value}` : `${API_BASE}/member-tags`
      const method = isEdit.value ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(tagForm.value)
      })
      if (res.ok) {
        ElMessage.success(isEdit.value ? '修改成功' : '添加成功')
        tagDialogVisible.value = false
        loadTags()
      } else {
        const err = await res.json()
        ElMessage.error(err.message || '操作失败')
      }
    } catch (e) {
      ElMessage.error('网络错误')
    } finally {
      submitting.value = false
    }
  })
}

const deleteTag = async (row: any) => {
  try {
    await ElMessageBox.confirm(
      row.memberCount > 0 
        ? `该标签关联了 ${row.memberCount} 位会员，删除后将从这些会员中移除该标签，确定要删除吗？`
        : '确定要删除该标签吗？',
      '提示',
      { type: 'warning' }
    )
    const res = await fetch(`${API_BASE}/member-tags/${row.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    })
    if (res.ok) {
      ElMessage.success('删除成功')
      loadTags()
    } else {
      ElMessage.error('删除失败')
    }
  } catch (e) {}
}

const showMemberList = async (tag: any) => {
  currentTag.value = tag
  memberListVisible.value = true
  membersLoading.value = true
  try {
    const res = await fetch(`${API_BASE}/member-tags/${tag.id}/members`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    tagMembers.value = await res.json()
  } catch (e) {
    ElMessage.error('加载会员列表失败')
  } finally {
    membersLoading.value = false
  }
}

onMounted(loadTags)
</script>

<style scoped>
.member-tag-page {
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
</style>
