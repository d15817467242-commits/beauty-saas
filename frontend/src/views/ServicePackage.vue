<template>
  <div class="service-package-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>服务套餐管理</span>
          <el-button type="primary" @click="handleAdd">新增套餐</el-button>
        </div>
      </template>

      <!-- 搜索筛选 -->
      <div class="filter-bar">
        <el-input v-model="searchKeyword" placeholder="搜索套餐名称" clearable style="width: 200px" @keyup.enter="loadPackages">
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-select v-model="filterStatus" placeholder="状态" clearable style="width: 120px" @change="loadPackages">
          <el-option label="上架" :value="true" />
          <el-option label="下架" :value="false" />
        </el-select>
        <el-button type="primary" @click="loadPackages">查询</el-button>
      </div>

      <el-table :data="packageList" v-loading="loading" stripe>
        <el-table-column prop="name" label="套餐名称" min-width="180">
          <template #default="{ row }">
            <div class="package-name">
              <el-image v-if="row.image" :src="row.image" fit="cover" class="package-thumb" />
              <div class="package-info">
                <div class="package-title">{{ row.name }}</div>
                <div class="package-desc">{{ row.description || '暂无描述' }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="套餐内容" min-width="200">
          <template #default="{ row }">
            <div class="package-items">
              <el-tag v-for="item in (row.items || []).slice(0, 3)" :key="item.serviceId" size="small" style="margin: 2px">
                {{ item.serviceName }} x{{ item.quantity }}
              </el-tag>
              <el-tag v-if="(row.items || []).length > 3" size="small" type="info">
                +{{ row.items.length - 3 }}项
              </el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="originalPrice" label="原价" width="100">
          <template #default="{ row }">
            <span class="original-price">¥{{ calculateOriginalPrice(row.items) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="price" label="套餐价" width="100">
          <template #default="{ row }">
            <span class="package-price">¥{{ row.price }}</span>
          </template>
        </el-table-column>
        <el-table-column label="优惠" width="100">
          <template #default="{ row }">
            <el-tag type="danger" size="small">
              省¥{{ (calculateOriginalPrice(row.items) - row.price).toFixed(2) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="validityDays" label="有效期" width="100">
          <template #default="{ row }">
            {{ row.validityDays ? `${row.validityDays}天` : '永久有效' }}
          </template>
        </el-table-column>
        <el-table-column prop="salesCount" label="销量" width="80" />
        <el-table-column prop="isActive" label="状态" width="80">
          <template #default="{ row }">
            <el-switch v-model="row.isActive" @change="handleStatusChange(row)" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button size="small" type="info" @click="handlePreview(row)">预览</el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          @size-change="loadPackages"
          @current-change="loadPackages"
        />
      </div>
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑套餐' : '新增套餐'" width="900px" destroy-on-close>
      <el-form :model="form" label-width="100px" :rules="formRules" ref="formRef">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="套餐名称" prop="name">
              <el-input v-model="form.name" placeholder="请输入套餐名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="套餐编码">
              <el-input v-model="form.code" placeholder="如：PKG001">
                <template #append>
                  <el-button @click="generateCode">自动生成</el-button>
                </template>
              </el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="套餐图片">
          <el-upload
            :action="`${API_BASE}/upload`"
            :headers="{ Authorization: `Bearer ${token}` }"
            :show-file-list="false"
            :on-success="handleImageSuccess"
            accept="image/*"
            class="image-uploader"
          >
            <el-image v-if="form.image" :src="form.image" fit="cover" class="package-image" />
            <el-icon v-else class="upload-icon"><Plus /></el-icon>
          </el-upload>
        </el-form-item>

        <el-form-item label="套餐项目" prop="items">
          <div class="package-items-editor">
            <div class="items-header">
              <span>已选项目 ({{ form.items.length }}项)</span>
              <el-button type="primary" size="small" @click="showServiceSelector">添加服务项目</el-button>
            </div>
            <el-table :data="form.items" size="small" v-if="form.items.length > 0">
              <el-table-column prop="serviceName" label="服务名称" />
              <el-table-column prop="servicePrice" label="单价" width="100">
                <template #default="{ row }">
                  ¥{{ row.servicePrice }}
                </template>
              </el-table-column>
              <el-table-column label="数量" width="150">
                <template #default="{ row }">
                  <el-input-number v-model="row.quantity" :min="1" :max="99" size="small" @change="calculatePrice" />
                </template>
              </el-table-column>
              <el-table-column label="小计" width="100">
                <template #default="{ row }">
                  ¥{{ (row.servicePrice * row.quantity).toFixed(2) }}
                </template>
              </el-table-column>
              <el-table-column label="操作" width="80">
                <template #default="{ $index }">
                  <el-button size="small" type="danger" text @click="removeItem($index)">移除</el-button>
                </template>
              </el-table-column>
            </el-table>
            <el-empty v-else description="暂无服务项目，请添加" :image-size="60" />
          </div>
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="原价合计">
              <el-input :value="`¥${calculateOriginalPrice(form.items).toFixed(2)}`" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="套餐价" prop="price">
              <el-input-number v-model="form.price" :min="0" :precision="2" style="width: 100%" @change="calculateDiscount" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="优惠金额">
              <el-tag type="danger" size="large">
                省¥{{ discountAmount.toFixed(2) }} ({{ discountPercent }}%)
              </el-tag>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="有效期">
              <el-select v-model="form.validityType" style="width: 100%">
                <el-option label="永久有效" value="permanent" />
                <el-option label="指定天数" value="days" />
                <el-option label="指定日期" value="date" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="有效期设置">
              <el-input-number v-if="form.validityType === 'days'" v-model="form.validityDays" :min="1" style="width: 100%" />
              <el-date-picker v-else-if="form.validityType === 'date'" v-model="form.validityEndDate" type="date" placeholder="选择截止日期" style="width: 100%" />
              <el-input v-else value="永久有效" disabled />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="套餐描述">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="请输入套餐描述" />
        </el-form-item>

        <el-form-item label="使用须知">
          <el-input v-model="form.notice" type="textarea" :rows="2" placeholder="使用规则、注意事项等" />
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="排序">
              <el-input-number v-model="form.sort" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="限购数量">
              <el-input-number v-model="form.purchaseLimit" :min="0" style="width: 100%" />
              <div class="field-tip">0表示不限购</div>
            </el-form-item>
          </el-col>
          <el-col :span="8">
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

    <!-- 服务选择器 -->
    <el-dialog v-model="serviceSelectorVisible" title="选择服务项目" width="800px">
      <div class="service-selector">
        <div class="selector-filter">
          <el-input v-model="serviceSearchKeyword" placeholder="搜索服务" clearable style="width: 200px" />
          <el-select v-model="serviceFilterCategory" placeholder="分类" clearable style="width: 150px">
            <el-option v-for="cat in categories" :key="cat.id" :label="cat.name" :value="cat.id" />
          </el-select>
        </div>
        <el-table :data="filteredServices" @selection-change="handleServiceSelection" v-loading="servicesLoading">
          <el-table-column type="selection" width="50" />
          <el-table-column prop="name" label="服务名称" />
          <el-table-column prop="category" label="分类">
            <template #default="{ row }">
              {{ getCategoryName(row.category) }}
            </template>
          </el-table-column>
          <el-table-column prop="price" label="价格" width="100">
            <template #default="{ row }">
              ¥{{ row.price }}
            </template>
          </el-table-column>
          <el-table-column prop="duration" label="时长" width="100">
            <template #default="{ row }">
              {{ row.duration ? `${row.duration}分钟` : '-' }}
            </template>
          </el-table-column>
        </el-table>
      </div>
      <template #footer>
        <el-button @click="serviceSelectorVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmServiceSelection">确定添加</el-button>
      </template>
    </el-dialog>

    <!-- 套餐预览 -->
    <el-dialog v-model="previewVisible" title="套餐预览" width="500px">
      <div class="package-preview" v-if="previewData">
        <el-image v-if="previewData.image" :src="previewData.image" fit="cover" class="preview-image" />
        <h3>{{ previewData.name }}</h3>
        <div class="preview-price">
          <span class="current-price">¥{{ previewData.price }}</span>
          <span class="original-price">¥{{ calculateOriginalPrice(previewData.items) }}</span>
        </div>
        <el-divider>套餐内容</el-divider>
        <div class="preview-items">
          <div v-for="item in previewData.items" :key="item.serviceId" class="preview-item">
            <span>{{ item.serviceName }}</span>
            <span>x{{ item.quantity }}</span>
          </div>
        </div>
        <el-divider>使用须知</el-divider>
        <p class="preview-notice">{{ previewData.notice || '无特殊说明' }}</p>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus } from '@element-plus/icons-vue'

const API_BASE = 'http://localhost:3000/api'
const token = localStorage.getItem('token') || ''

// 分类
const categories = ref([
  { id: 'hair', name: '美发' },
  { id: 'beauty', name: '美容' },
  { id: 'nail', name: '美甲' },
  { id: 'other', name: '其他' }
])

// 表单验证规则
const formRules = {
  name: [{ required: true, message: '请输入套餐名称', trigger: 'blur' }],
  items: [{ required: true, message: '请添加服务项目', trigger: 'change' }],
  price: [{ required: true, message: '请输入套餐价格', trigger: 'blur' }]
}

// 状态
const loading = ref(false)
const submitting = ref(false)
const packageList = ref<any[]>([])
const dialogVisible = ref(false)
const isEdit = ref(false)
const editId = ref('')

// 分页
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)

// 搜索筛选
const searchKeyword = ref('')
const filterStatus = ref<boolean | ''>('')

// 服务选择器
const serviceSelectorVisible = ref(false)
const servicesLoading = ref(false)
const serviceList = ref<any[]>([])
const selectedServices = ref<any[]>([])
const serviceSearchKeyword = ref('')
const serviceFilterCategory = ref('')

// 预览
const previewVisible = ref(false)
const previewData = ref<any>(null)

// 优惠计算
const discountAmount = ref(0)
const discountPercent = ref(0)

// 表单
const formRef = ref()
const form = ref({
  name: '',
  code: '',
  image: '',
  items: [] as any[],
  price: 0,
  validityType: 'permanent',
  validityDays: 30,
  validityEndDate: '',
  description: '',
  notice: '',
  sort: 0,
  purchaseLimit: 0,
  isActive: true
})

// 获取分类名称
const getCategoryName = (categoryId: string) => {
  return categories.value.find(c => c.id === categoryId)?.name || categoryId
}

// 计算原价
const calculateOriginalPrice = (items: any[]) => {
  if (!items || items.length === 0) return 0
  return items.reduce((sum, item) => sum + item.servicePrice * item.quantity, 0)
}

// 计算优惠
const calculateDiscount = () => {
  const original = calculateOriginalPrice(form.value.items)
  discountAmount.value = original - form.value.price
  discountPercent.value = original > 0 ? Math.round((discountAmount.value / original) * 100) : 0
}

// 计算价格
const calculatePrice = () => {
  // 可以自动设置套餐价为原价的某个折扣
  calculateDiscount()
}

// 重置表单
const resetForm = () => {
  form.value = {
    name: '',
    code: '',
    image: '',
    items: [],
    price: 0,
    validityType: 'permanent',
    validityDays: 30,
    validityEndDate: '',
    description: '',
    notice: '',
    sort: 0,
    purchaseLimit: 0,
    isActive: true
  }
  discountAmount.value = 0
  discountPercent.value = 0
}

// 加载套餐列表
const loadPackages = async () => {
  loading.value = true
  try {
    const params = new URLSearchParams({
      page: currentPage.value.toString(),
      pageSize: pageSize.value.toString(),
      ...(searchKeyword.value && { keyword: searchKeyword.value }),
      ...(filterStatus.value !== '' && { isActive: filterStatus.value.toString() })
    })
    const res = await fetch(`${API_BASE}/packages?${params}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const data = await res.json()
    packageList.value = data.data || data.items || data
    total.value = data.total || packageList.value.length
  } catch (e) {
    ElMessage.error('加载失败')
  } finally {
    loading.value = false
  }
}

// 加载服务列表
const loadServices = async () => {
  servicesLoading.value = true
  try {
    const res = await fetch(`${API_BASE}/services?isActive=true`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    serviceList.value = await res.json()
  } catch (e) {
    ElMessage.error('加载服务列表失败')
  } finally {
    servicesLoading.value = false
  }
}

// 筛选服务
const filteredServices = computed(() => {
  let result = serviceList.value
  if (serviceSearchKeyword.value) {
    result = result.filter(s => s.name.includes(serviceSearchKeyword.value))
  }
  if (serviceFilterCategory.value) {
    result = result.filter(s => s.category === serviceFilterCategory.value)
  }
  return result
})

// 新增套餐
const handleAdd = () => {
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
}

// 编辑套餐
const handleEdit = (row: any) => {
  isEdit.value = true
  editId.value = row.id
  form.value = {
    name: row.name,
    code: row.code || '',
    image: row.image || '',
    items: row.items || [],
    price: row.price,
    validityType: row.validityDays ? 'days' : 'permanent',
    validityDays: row.validityDays || 30,
    validityEndDate: row.validityEndDate || '',
    description: row.description || '',
    notice: row.notice || '',
    sort: row.sort || 0,
    purchaseLimit: row.purchaseLimit || 0,
    isActive: row.isActive ?? true
  }
  calculateDiscount()
  dialogVisible.value = true
}

// 删除套餐
const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm('确定要删除该套餐吗？', '提示', { type: 'warning' })
    const res = await fetch(`${API_BASE}/packages/${row.id}`, {
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

// 状态切换
const handleStatusChange = async (row: any) => {
  try {
    const res = await fetch(`${API_BASE}/packages/${row.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ isActive: row.isActive })
    })
    if (res.ok) {
      ElMessage.success(row.isActive ? '已上架' : '已下架')
    } else {
      row.isActive = !row.isActive
      ElMessage.error('操作失败')
    }
  } catch (e) {
    row.isActive = !row.isActive
    ElMessage.error('网络错误')
  }
}

// 预览
const handlePreview = (row: any) => {
  previewData.value = row
  previewVisible.value = true
}

// 显示服务选择器
const showServiceSelector = () => {
  loadServices()
  selectedServices.value = []
  serviceSelectorVisible.value = true
}

// 服务选择
const handleServiceSelection = (selection: any[]) => {
  selectedServices.value = selection
}

// 确认服务选择
const confirmServiceSelection = () => {
  const newItems = selectedServices.value.map(s => ({
    serviceId: s.id,
    serviceName: s.name,
    servicePrice: s.price,
    quantity: 1
  }))
  
  // 去重添加
  newItems.forEach(item => {
    if (!form.value.items.find(i => i.serviceId === item.serviceId)) {
      form.value.items.push(item)
    }
  })
  
  // 自动设置价格为原价的8折
  const original = calculateOriginalPrice(form.value.items)
  form.value.price = Math.round(original * 0.8 * 100) / 100
  calculateDiscount()
  
  serviceSelectorVisible.value = false
  ElMessage.success(`已添加 ${newItems.length} 个服务项目`)
}

// 移除项目
const removeItem = (index: number) => {
  form.value.items.splice(index, 1)
  calculateDiscount()
}

// 生成编码
const generateCode = () => {
  const prefix = 'PKG'
  const timestamp = Date.now().toString().slice(-6)
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  form.value.code = `${prefix}${timestamp}${random}`
}

// 图片上传
const handleImageSuccess = (response: any) => {
  if (response.url) {
    form.value.image = response.url
    ElMessage.success('图片上传成功')
  }
}

// 提交表单
const handleSubmit = async () => {
  try {
    await formRef.value?.validate()
  } catch {
    return
  }

  if (form.value.items.length === 0) {
    ElMessage.warning('请添加服务项目')
    return
  }

  submitting.value = true
  try {
    const url = isEdit.value ? `${API_BASE}/packages/${editId.value}` : `${API_BASE}/packages`
    const method = isEdit.value ? 'PATCH' : 'POST'
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        ...form.value,
        validityDays: form.value.validityType === 'days' ? form.value.validityDays : null
      })
    })
    if (res.ok) {
      ElMessage.success(isEdit.value ? '修改成功' : '添加成功')
      dialogVisible.value = false
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
.service-package-page {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filter-bar {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.package-name {
  display: flex;
  align-items: center;
  gap: 10px;
}

.package-thumb {
  width: 50px;
  height: 50px;
  border-radius: 4px;
}

.package-info {
  flex: 1;
}

.package-title {
  font-weight: 500;
}

.package-desc {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.package-items {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.original-price {
  color: #909399;
  text-decoration: line-through;
}

.package-price {
  color: #f56c6c;
  font-weight: bold;
  font-size: 16px;
}

.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

/* 套餐项目编辑器 */
.package-items-editor {
  width: 100%;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 15px;
}

.items-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

/* 图片上传 */
.image-uploader {
  width: 150px;
  height: 100px;
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-uploader:hover {
  border-color: #409eff;
}

.package-image {
  width: 100%;
  height: 100%;
}

.upload-icon {
  font-size: 28px;
  color: #8c939d;
}

.field-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

/* 服务选择器 */
.service-selector {
  min-height: 300px;
}

.selector-filter {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}

/* 预览 */
.package-preview {
  text-align: center;
}

.preview-image {
  width: 100%;
  height: 200px;
  border-radius: 8px;
  margin-bottom: 15px;
}

.preview-price {
  margin: 15px 0;
}

.current-price {
  font-size: 24px;
  font-weight: bold;
  color: #f56c6c;
  margin-right: 10px;
}

.preview-items {
  text-align: left;
}

.preview-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px dashed #eee;
}

.preview-notice {
  text-align: left;
  color: #666;
  font-size: 14px;
}
</style>
