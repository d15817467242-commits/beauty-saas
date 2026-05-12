<template>
  <div class="service-page">
    <!-- 分类管理抽屉 -->
    <el-drawer v-model="categoryDrawerVisible" title="服务分类管理" size="400px">
      <div class="category-manager">
        <div class="category-header">
          <el-input v-model="newCategoryName" placeholder="输入分类名称" style="width: 200px" />
          <el-button type="primary" @click="handleAddCategory" :disabled="!newCategoryName">添加</el-button>
        </div>
        <el-tree
          :data="categoryTree"
          :props="{ label: 'name', children: 'children' }"
          default-expand-all
          :expand-on-click-node="false"
        >
          <template #default="{ node, data }">
            <div class="category-node">
              <span>{{ node.label }}</span>
              <span class="category-actions">
                <el-button size="small" text @click="handleEditCategory(data)">编辑</el-button>
                <el-button size="small" text type="danger" @click="handleDeleteCategory(data)">删除</el-button>
              </span>
            </div>
          </template>
        </el-tree>
      </div>
    </el-drawer>

    <!-- 分类编辑对话框 -->
    <el-dialog v-model="categoryDialogVisible" title="编辑分类" width="400px">
      <el-form :model="categoryForm" label-width="80px">
        <el-form-item label="分类名称">
          <el-input v-model="categoryForm.name" placeholder="请输入分类名称" />
        </el-form-item>
        <el-form-item label="父级分类">
          <el-cascader
            v-model="categoryForm.parentId"
            :options="categoryTree"
            :props="{ value: 'id', label: 'name', children: 'children', checkStrictly: true, emitPath: false }"
            clearable
            placeholder="选择父级分类（可选）"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="categoryDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveCategory">保存</el-button>
      </template>
    </el-dialog>

    <el-card>
      <template #header>
        <div class="card-header">
          <span>服务项目管理</span>
          <div class="header-actions">
            <el-button @click="categoryDrawerVisible = true">分类管理</el-button>
            <el-button @click="handleImport">批量导入</el-button>
            <el-button @click="handleExport">导出数据</el-button>
            <el-button type="primary" @click="handleAdd" v-if="userStore.canManageServices">新增服务</el-button>
          </div>
        </div>
      </template>

      <!-- 搜索筛选 -->
      <div class="filter-bar">
        <el-input v-model="searchKeyword" placeholder="搜索服务名称" clearable style="width: 200px" @keyup.enter="loadServices">
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-select v-model="filterCategory" placeholder="选择分类" clearable style="width: 150px" @change="loadServices">
          <el-option v-for="cat in flatCategories" :key="cat.id" :label="cat.name" :value="cat.id" />
        </el-select>
        <el-select v-model="filterStatus" placeholder="状态" clearable style="width: 120px" @change="loadServices">
          <el-option label="上架" :value="true" />
          <el-option label="下架" :value="false" />
        </el-select>
        <el-button type="primary" @click="loadServices">查询</el-button>
      </div>

      <el-table :data="serviceList" v-loading="loading" stripe>
        <el-table-column prop="name" label="服务名称" min-width="150">
          <template #default="{ row }">
            <div class="service-name">
              <el-image v-if="row.image" :src="row.image" fit="cover" class="service-thumb" />
              <span>{{ row.name }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="code" label="编码" width="100" />
        <el-table-column prop="category" label="分类" width="120">
          <template #default="{ row }">
            {{ getCategoryName(row.category) }}
          </template>
        </el-table-column>
        <el-table-column prop="price" label="价格" width="100">
          <template #default="{ row }">
            ¥{{ row.price }}
          </template>
        </el-table-column>
        <el-table-column prop="memberPrice" label="会员价" width="100">
          <template #default="{ row }">
            <span :class="{ 'member-price': row.memberPrice && row.memberPrice < row.price }">
              ¥{{ row.memberPrice || row.price }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="时长" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.duration" type="info" size="small">{{ formatDuration(row.duration) }}</el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="提成设置" width="120">
          <template #default="{ row }">
            <span v-if="row.fixedCommission">固定¥{{ row.fixedCommission }}</span>
            <span v-else-if="row.commissionRate">{{ row.commissionRate }}%</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="isActive" label="状态" width="80">
          <template #default="{ row }">
            <el-switch v-model="row.isActive" @change="handleStatusChange(row)" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="handleEdit(row)" v-if="userStore.canEdit">编辑</el-button>
            <el-button size="small" type="info" @click="handleCopy(row)" v-if="userStore.canCreate">复制</el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)" v-if="userStore.canDelete">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadServices"
          @current-change="loadServices"
        />
      </div>
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑服务' : '新增服务'" width="700px" destroy-on-close>
      <el-form :model="form" label-width="100px" :rules="formRules" ref="formRef">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="服务名称" prop="name">
              <el-input v-model="form.name" placeholder="请输入服务名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="服务编码" prop="code">
              <el-input v-model="form.code" placeholder="如：JF001">
                <template #append>
                  <el-button @click="generateCode">自动生成</el-button>
                </template>
              </el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="服务分类" prop="categoryId">
              <el-cascader
                v-model="form.categoryId"
                :options="categoryTree"
                :props="{ value: 'id', label: 'name', children: 'children', checkStrictly: true, emitPath: false }"
                placeholder="请选择分类"
                style="width: 100%"
                clearable
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="服务时长" prop="duration">
              <el-input-number v-model="form.duration" :min="0" :step="5" style="width: 100%" />
              <div class="duration-presets">
                <el-tag v-for="preset in durationPresets" :key="preset" size="small" @click="form.duration = preset">
                  {{ preset }}分钟
                </el-tag>
              </div>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="价格" prop="price">
              <el-input-number v-model="form.price" :min="0" :precision="2" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="会员价">
              <el-input-number v-model="form.memberPrice" :min="0" :precision="2" style="width: 100%" />
              <div class="price-discount" v-if="form.price > 0 && form.memberPrice > 0 && form.memberPrice < form.price">
                <el-tag type="success" size="small">
                  会员优惠 {{ ((1 - form.memberPrice / form.price) * 100).toFixed(1) }}%
                </el-tag>
              </div>
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider>提成设置</el-divider>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="提成比例">
              <el-input-number v-model="form.commissionRate" :min="0" :max="100" :precision="1" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="固定提成">
              <el-input-number v-model="form.fixedCommission" :min="0" :precision="2" style="width: 100%" />
              <div class="commission-tip">
                <el-text size="small" type="info">固定提成优先于比例提成</el-text>
              </div>
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider>服务图片</el-divider>

        <el-form-item label="服务图片">
          <el-upload
            :action="`${API_BASE}/upload`"
            :headers="{ Authorization: `Bearer ${token}` }"
            :show-file-list="false"
            :on-success="handleImageSuccess"
            :before-upload="beforeImageUpload"
            accept="image/*"
            class="image-uploader"
          >
            <el-image v-if="form.image" :src="form.image" fit="cover" class="service-image" />
            <el-icon v-else class="upload-icon"><Plus /></el-icon>
          </el-upload>
          <div class="image-tip">
            <el-text size="small" type="info">建议尺寸: 800x600px, 支持jpg/png格式</el-text>
          </div>
        </el-form-item>

        <el-form-item label="服务描述">
          <el-input v-model="form.description" type="textarea" :rows="4" placeholder="请输入服务描述，支持详细说明服务内容、注意事项等" />
        </el-form-item>

        <el-form-item label="服务须知">
          <el-input v-model="form.notice" type="textarea" :rows="2" placeholder="预约须知、注意事项等" />
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="排序">
              <el-input-number v-model="form.sort" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态">
              <el-switch v-model="form.isActive" active-text="上架" inactive-text="下架" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 批量导入对话框 -->
    <el-dialog v-model="importDialogVisible" title="批量导入服务项目" width="500px">
      <div class="import-content">
        <el-alert type="info" :closable="false" style="margin-bottom: 20px">
          <template #title>
            <div>导入说明：</div>
            <ol style="margin: 10px 0; padding-left: 20px;">
              <li>下载导入模板，按格式填写数据</li>
              <li>支持 Excel (.xlsx) 和 CSV 格式</li>
              <li>服务编码重复将更新已有数据</li>
            </ol>
          </template>
        </el-alert>
        <el-button type="primary" link @click="downloadTemplate">下载导入模板</el-button>
        <el-upload
          :action="`${API_BASE}/services/import`"
          :headers="{ Authorization: `Bearer ${token}` }"
          :show-file-list="true"
          :on-success="handleImportSuccess"
          :on-error="handleImportError"
          accept=".xlsx,.xls,.csv"
          drag
          style="margin-top: 20px"
        >
          <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
          <div class="el-upload__text">拖拽文件到此处或 <em>点击上传</em></div>
        </el-upload>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus, UploadFilled } from '@element-plus/icons-vue'
import request from '@/utils/request'

// 时长预设
const durationPresets = [30, 45, 60, 90, 120]

// 分类数据
const categoryTree = ref<any[]>([])

// 加载服务分类
const loadCategories = async () => {
  try {
    const data = await request.get('/service-categories')
    categoryTree.value = data.data || data.items || data
  } catch (e) {
    console.error('加载分类失败')
  }
}

// 扁平化分类列表
const flatCategories = computed(() => {
  const result: any[] = []
  const flatten = (items: any[]) => {
    items.forEach(item => {
      result.push(item)
      if (item.children) flatten(item.children)
    })
  }
  flatten(categoryTree.value)
  return result
})

// 表单验证规则
const formRules = {
  name: [{ required: true, message: '请输入服务名称', trigger: 'blur' }],
  categoryId: [{ required: true, message: '请选择服务分类', trigger: 'change' }],
  price: [{ required: true, message: '请输入价格', trigger: 'blur' }]
}

// 状态
const loading = ref(false)
const submitting = ref(false)
const serviceList = ref<any[]>([])
const dialogVisible = ref(false)
const importDialogVisible = ref(false)
const isEdit = ref(false)
const editId = ref('')

// 分页
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)

// 搜索筛选
const searchKeyword = ref('')
const filterCategory = ref('')
const filterStatus = ref<boolean | ''>('')

// 分类管理
const categoryDrawerVisible = ref(false)
const categoryDialogVisible = ref(false)
const newCategoryName = ref('')
const categoryForm = ref({ id: '', name: '', parentId: '' })

// 表单
const formRef = ref()
const form = ref({
  name: '',
  code: '',
  category: 'other', // 默认使用枚举值
  categoryId: '',
  price: 0,
  memberPrice: 0,
  commissionRate: null as number | null,
  fixedCommission: null as number | null,
  duration: 60,
  description: '',
  notice: '',
  image: '',
  sort: 0,
  isActive: true
})

// 获取分类名称
const getCategoryName = (categoryId: string) => {
  const cat = flatCategories.value.find(c => c.id === categoryId)
  return cat?.name || categoryId
}

// 格式化时长
const formatDuration = (minutes: number) => {
  if (minutes < 60) return `${minutes}分钟`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`
}

// 重置表单
const resetForm = () => {
  form.value = {
    name: '',
    code: '',
    category: 'other',
    categoryId: '',
    price: 0,
    memberPrice: 0,
    commissionRate: null,
    fixedCommission: null,
    duration: 60,
    description: '',
    notice: '',
    image: '',
    sort: 0,
    isActive: true
  }
}

// 加载服务列表
const loadServices = async () => {
  loading.value = true
  try {
    const params: Record<string, string> = {
      page: currentPage.value.toString(),
      pageSize: pageSize.value.toString(),
    }
    if (searchKeyword.value) params.keyword = searchKeyword.value
    if (filterCategory.value) params.category = filterCategory.value
    if (filterStatus.value !== '') params.isActive = filterStatus.value.toString()
    const data = await request.get('/services', { params })
    serviceList.value = data.data || data.items || data
    total.value = data.total || serviceList.value.length
  } catch (e) {
    ElMessage.error('加载失败')
  } finally {
    loading.value = false
  }
}

// 新增服务
const handleAdd = () => {
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
}

// 编辑服务
const handleEdit = (row: any) => {
  isEdit.value = true
  editId.value = row.id
  form.value = {
    name: row.name,
    code: row.code || '',
    category: row.category || 'other',
    categoryId: row.categoryId || '',
    price: row.price,
    memberPrice: row.memberPrice || 0,
    commissionRate: row.commissionRate || null,
    fixedCommission: row.fixedCommission || null,
    duration: row.duration || 60,
    description: row.description || '',
    notice: row.notice || '',
    image: row.image || '',
    sort: row.sort || 0,
    isActive: row.isActive ?? true
  }
  dialogVisible.value = true
}

// 复制服务
const handleCopy = (row: any) => {
  isEdit.value = false
  form.value = {
    ...row,
    name: `${row.name}(复制)`,
    code: '',
    category: row.category || 'other',
    categoryId: row.categoryId || '',
    isActive: true
  }
  dialogVisible.value = true
}

// 删除服务
const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm('确定要删除该服务吗？', '提示', { type: 'warning' })
    await request.delete(`/services/${row.id}`)
    ElMessage.success('删除成功')
    loadServices()
  } catch (e) {}
}

// 状态切换
const handleStatusChange = async (row: any) => {
  try {
    await request.patch(`/services/${row.id}`, { isActive: row.isActive })
    ElMessage.success(row.isActive ? '已上架' : '已下架')
  } catch (e) {
    row.isActive = !row.isActive
    ElMessage.error('操作失败')
  }
}

// 提交表单
const handleSubmit = async () => {
  try {
    await formRef.value?.validate()
  } catch {
    return
  }

  submitting.value = true
  try {
    const url = isEdit.value ? `${API_BASE}/services/${editId.value}` : `${API_BASE}/services`
    const method = isEdit.value ? 'PATCH' : 'POST'
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(form.value)
    })
    if (res.ok) {
      ElMessage.success(isEdit.value ? '修改成功' : '添加成功')
      dialogVisible.value = false
      loadServices()
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

// 生成编码
const generateCode = () => {
  const prefix = 'SVC'
  const timestamp = Date.now().toString().slice(-6)
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  form.value.code = `${prefix}${timestamp}${random}`
}

// 图片上传
const beforeImageUpload = (file: File) => {
  const isImage = file.type.startsWith('image/')
  const isLt2M = file.size / 1024 / 1024 < 2
  if (!isImage) {
    ElMessage.error('只能上传图片文件!')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过 2MB!')
    return false
  }
  return true
}

const handleImageSuccess = (response: any) => {
  if (response.url) {
    form.value.image = response.url
    ElMessage.success('图片上传成功')
  }
}

// 分类管理
const handleAddCategory = () => {
  if (!newCategoryName.value) return
  categoryTree.value.push({
    id: `cat_${Date.now()}`,
    name: newCategoryName.value
  })
  newCategoryName.value = ''
  ElMessage.success('分类添加成功')
}

const handleEditCategory = (data: any) => {
  categoryForm.value = {
    id: data.id,
    name: data.name,
    parentId: ''
  }
  categoryDialogVisible.value = true
}

const handleDeleteCategory = async (data: any) => {
  try {
    await ElMessageBox.confirm('确定要删除该分类吗？', '提示', { type: 'warning' })
    // 递归删除
    const removeById = (items: any[], id: string): any[] => {
      return items.filter(item => {
        if (item.id === id) return false
        if (item.children) item.children = removeById(item.children, id)
        return true
      })
    }
    categoryTree.value = removeById(categoryTree.value, data.id)
    ElMessage.success('删除成功')
  } catch (e) {}
}

const handleSaveCategory = () => {
  // 简化实现：更新分类名称
  const updateName = (items: any[], id: string, name: string) => {
    items.forEach(item => {
      if (item.id === id) item.name = name
      if (item.children) updateName(item.children, id, name)
    })
  }
  updateName(categoryTree.value, categoryForm.value.id, categoryForm.value.name)
  categoryDialogVisible.value = false
  ElMessage.success('保存成功')
}

// 导入导出
const handleImport = () => {
  importDialogVisible.value = true
}

const handleExport = async () => {
  try {
    const res = await fetch(`${API_BASE}/services/export`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const blob = await res.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `服务项目_${new Date().toISOString().slice(0, 10)}.xlsx`
    a.click()
    window.URL.revokeObjectURL(url)
    ElMessage.success('导出成功')
  } catch (e) {
    ElMessage.error('导出失败')
  }
}

const downloadTemplate = () => {
  // 创建模板数据
  const template = [
    ['服务名称*', '服务编码', '分类*', '价格*', '会员价', '时长(分钟)', '提成比例(%)', '固定提成', '描述', '状态(上架/下架)'],
    ['示例服务', 'SVC001', 'hair', '100', '88', '60', '10', '', '服务描述', '上架']
  ]
  
  // 导出CSV
  const csv = template.map(row => row.join(',')).join('\n')
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = '服务项目导入模板.csv'
  a.click()
  window.URL.revokeObjectURL(url)
}

const handleImportSuccess = (response: any) => {
  ElMessage.success(`成功导入 ${response.success || 0} 条数据`)
  if (response.failed > 0) {
    ElMessage.warning(`${response.failed} 条数据导入失败`)
  }
  importDialogVisible.value = false
  loadServices()
}

const handleImportError = () => {
  ElMessage.error('导入失败，请检查文件格式')
}

onMounted(() => {
  loadServices()
  loadCategories()
})
</script>

<style scoped>
.service-page {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.filter-bar {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.service-name {
  display: flex;
  align-items: center;
  gap: 10px;
}

.service-thumb {
  width: 40px;
  height: 40px;
  border-radius: 4px;
}

.member-price {
  color: #f56c6c;
}

.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.duration-presets {
  margin-top: 8px;
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
  max-width: 100%;
}

.duration-presets .el-tag {
  cursor: pointer;
  flex-shrink: 0;
  font-size: 12px;
  padding: 4px 8px;
  height: 24px;
  line-height: 16px;
}

.duration-presets .el-tag:hover {
  background-color: #409eff;
  color: white;
}

.price-discount {
  margin-top: 5px;
}

.commission-tip {
  margin-top: 5px;
}

.image-uploader {
  width: 200px;
  height: 150px;
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-uploader:hover {
  border-color: #409eff;
}

.service-image {
  width: 100%;
  height: 100%;
}

.upload-icon {
  font-size: 28px;
  color: #8c939d;
}

.image-tip {
  margin-top: 8px;
}

/* 分类管理 */
.category-manager {
  padding: 0 20px;
}

.category-header {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.category-node {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-right: 10px;
}

.category-actions {
  display: flex;
  gap: 5px;
}

/* 导入 */
.import-content {
  padding: 10px 0;
}
</style>
