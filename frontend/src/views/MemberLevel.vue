<template>
  <div class="member-level-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>会员等级管理</span>
          <el-button type="primary" @click="showLevelDialog()">新增等级</el-button>
        </div>
      </template>

      <!-- 等级列表 -->
      <el-table :data="levels" v-loading="loading" stripe>
        <el-table-column prop="name" label="等级名称" width="150">
          <template #default="{ row }">
            <el-tag :type="row.type" size="large">{{ row.name }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="code" label="等级编码" width="120" />
        <el-table-column prop="minPoints" label="升级所需积分" width="140">
          <template #default="{ row }">
            {{ row.minPoints || 0 }} 积分
          </template>
        </el-table-column>
        <el-table-column prop="discount" label="折扣" width="100">
          <template #default="{ row }">
            <span v-if="row.discount">{{ (row.discount * 10).toFixed(1) }} 折</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="pointsRate" label="积分倍率" width="100">
          <template #default="{ row }">
            {{ row.pointsRate || 1 }} 倍
          </template>
        </el-table-column>
        <el-table-column label="等级权益">
          <template #default="{ row }">
            <div class="benefits-list">
              <el-tag v-for="(benefit, idx) in row.benefits" :key="idx" size="small" style="margin-right: 4px; margin-bottom: 4px;">
                {{ benefit }}
              </el-tag>
              <span v-if="!row.benefits?.length" style="color: #999;">暂无权益</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="memberCount" label="会员数量" width="100">
          <template #default="{ row }">
            {{ row.memberCount || 0 }} 人
          </template>
        </el-table-column>
        <el-table-column prop="sort" label="排序" width="80" />
        <el-table-column prop="isActive" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.isActive ? 'success' : 'info'">{{ row.isActive ? '启用' : '停用' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button size="small" @click="showLevelDialog(row)">编辑</el-button>
            <el-button size="small" @click="showBenefitsDialog(row)">权益配置</el-button>
            <el-button size="small" type="danger" @click="deleteLevel(row)" :disabled="row.memberCount > 0">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增/编辑等级对话框 -->
    <el-dialog v-model="levelDialogVisible" :title="isEdit ? '编辑等级' : '新增等级'" width="600px">
      <el-form :model="levelForm" label-width="120px" :rules="levelRules" ref="levelFormRef">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="等级名称" prop="name">
              <el-input v-model="levelForm.name" placeholder="如：银卡会员" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="等级编码" prop="code">
              <el-input v-model="levelForm.code" placeholder="如：silver" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="升级所需积分">
              <el-input-number v-model="levelForm.minPoints" :min="0" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="等级标签样式">
              <el-select v-model="levelForm.type" style="width: 100%;">
                <el-option label="默认" value="" />
                <el-option label="成功" value="success" />
                <el-option label="警告" value="warning" />
                <el-option label="危险" value="danger" />
                <el-option label="信息" value="info" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="消费折扣">
              <el-input-number 
                v-model="levelForm.discount" 
                :min="0.1" 
                :max="1" 
                :step="0.05" 
                :precision="2"
                style="width: 100%;" 
              />
              <div class="form-tip">0.1-1之间，如0.9表示9折</div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="积分倍率">
              <el-input-number v-model="levelForm.pointsRate" :min="1" :max="10" :precision="1" style="width: 100%;" />
              <div class="form-tip">消费获得积分的倍率</div>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="排序">
              <el-input-number v-model="levelForm.sort" :min="0" :max="999" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态">
              <el-switch v-model="levelForm.isActive" active-text="启用" inactive-text="停用" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="等级图标">
          <el-upload
            class="icon-uploader"
            :action="`${API_BASE}/upload`"
            :headers="{ Authorization: `Bearer ${token}` }"
            :show-file-list="false"
            :on-success="handleIconUpload"
          >
            <img v-if="levelForm.icon" :src="levelForm.icon" class="icon-preview" />
            <el-icon v-else class="icon-uploader-icon"><Plus /></el-icon>
          </el-upload>
        </el-form-item>
        <el-form-item label="等级说明">
          <el-input v-model="levelForm.description" type="textarea" :rows="3" placeholder="等级说明信息" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="levelDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="saveLevel">保存</el-button>
      </template>
    </el-dialog>

    <!-- 权益配置对话框 -->
    <el-dialog v-model="benefitsDialogVisible" title="等级权益配置" width="600px">
      <div class="benefits-header">
        <span>当前等级：{{ currentLevel?.name }}</span>
      </div>
      <div class="benefits-editor">
        <div v-for="(benefit, idx) in benefitsForm" :key="idx" class="benefit-item">
          <el-input v-model="benefitsForm[idx]" placeholder="请输入权益内容" style="flex: 1;" />
          <el-button type="danger" :icon="Delete" circle @click="removeBenefit(idx)" style="margin-left: 8px;" />
        </div>
        <el-button type="primary" plain @click="addBenefit" style="margin-top: 8px;">
          <el-icon><Plus /></el-icon> 添加权益
        </el-button>
      </div>
      <template #footer>
        <el-button @click="benefitsDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="benefitsSubmitting" @click="saveBenefits">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Delete } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'

const API_BASE = 'http://localhost:3000/api'
const token = localStorage.getItem('token') || ''

const loading = ref(false)
const submitting = ref(false)
const benefitsSubmitting = ref(false)
const levels = ref<any[]>([])

const levelDialogVisible = ref(false)
const benefitsDialogVisible = ref(false)
const isEdit = ref(false)
const editId = ref('')
const currentLevel = ref<any>(null)
const levelFormRef = ref<FormInstance>()

const levelForm = ref({
  name: '',
  code: '',
  minPoints: 0,
  discount: 1,
  pointsRate: 1,
  type: '',
  icon: '',
  description: '',
  sort: 0,
  isActive: true
})

const benefitsForm = ref<string[]>([])

const levelRules: FormRules = {
  name: [
    { required: true, message: '请输入等级名称', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入等级编码', trigger: 'blur' },
    { pattern: /^[a-z_]+$/, message: '编码只能包含小写字母和下划线', trigger: 'blur' }
  ]
}

const loadLevels = async () => {
  loading.value = true
  try {
    const res = await fetch(`${API_BASE}/member-levels`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    levels.value = await res.json()
  } catch (e) {
    ElMessage.error('加载等级失败')
  } finally {
    loading.value = false
  }
}

const showLevelDialog = (row?: any) => {
  isEdit.value = !!row
  editId.value = row?.id || ''
  levelForm.value = row ? {
    name: row.name,
    code: row.code,
    minPoints: row.minPoints || 0,
    discount: row.discount || 1,
    pointsRate: row.pointsRate || 1,
    type: row.type || '',
    icon: row.icon || '',
    description: row.description || '',
    sort: row.sort || 0,
    isActive: row.isActive !== false
  } : {
    name: '',
    code: '',
    minPoints: 0,
    discount: 1,
    pointsRate: 1,
    type: '',
    icon: '',
    description: '',
    sort: 0,
    isActive: true
  }
  levelDialogVisible.value = true
}

const saveLevel = async () => {
  if (!levelFormRef.value) return
  await levelFormRef.value.validate(async (valid) => {
    if (!valid) return
    
    submitting.value = true
    try {
      const url = isEdit.value ? `${API_BASE}/member-levels/${editId.value}` : `${API_BASE}/member-levels`
      const method = isEdit.value ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(levelForm.value)
      })
      if (res.ok) {
        ElMessage.success(isEdit.value ? '修改成功' : '添加成功')
        levelDialogVisible.value = false
        loadLevels()
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

const deleteLevel = async (row: any) => {
  if (row.memberCount > 0) {
    ElMessage.warning('该等级下有会员，无法删除')
    return
  }
  try {
    await ElMessageBox.confirm('确定要删除该等级吗？', '提示', { type: 'warning' })
    const res = await fetch(`${API_BASE}/member-levels/${row.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    })
    if (res.ok) {
      ElMessage.success('删除成功')
      loadLevels()
    } else {
      ElMessage.error('删除失败')
    }
  } catch (e) {}
}

const showBenefitsDialog = (row: any) => {
  currentLevel.value = row
  benefitsForm.value = row.benefits?.length ? [...row.benefits] : ['']
  benefitsDialogVisible.value = true
}

const addBenefit = () => {
  benefitsForm.value.push('')
}

const removeBenefit = (idx: number) => {
  benefitsForm.value.splice(idx, 1)
}

const saveBenefits = async () => {
  if (!currentLevel.value) return
  
  const benefits = benefitsForm.value.filter(b => b.trim())
  benefitsSubmitting.value = true
  try {
    const res = await fetch(`${API_BASE}/member-levels/${currentLevel.value.id}/benefits`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ benefits })
    })
    if (res.ok) {
      ElMessage.success('保存成功')
      benefitsDialogVisible.value = false
      loadLevels()
    } else {
      ElMessage.error('保存失败')
    }
  } catch (e) {
    ElMessage.error('网络错误')
  } finally {
    benefitsSubmitting.value = false
  }
}

const handleIconUpload = (response: any) => {
  levelForm.value.icon = response.url
}

onMounted(loadLevels)
</script>

<style scoped>
.member-level-page {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.benefits-list {
  display: flex;
  flex-wrap: wrap;
}

.form-tip {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.icon-uploader {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-uploader:hover {
  border-color: #409EFF;
}

.icon-preview {
  width: 60px;
  height: 60px;
  object-fit: contain;
}

.icon-uploader-icon {
  font-size: 28px;
  color: #8c939d;
}

.benefits-header {
  margin-bottom: 16px;
  font-weight: bold;
}

.benefit-item {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}
</style>
