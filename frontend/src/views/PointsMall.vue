<template>
  <div class="points-mall-page">
    <el-row :gutter="20">
      <!-- 左侧：商品管理 -->
      <el-col :span="16">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>积分商品</span>
              <el-button type="primary" @click="showProductDialog()">新增商品</el-button>
            </div>
          </template>

          <!-- 搜索栏 -->
          <el-form :inline="true" class="search-form">
            <el-form-item label="商品名称">
              <el-input v-model="searchName" placeholder="搜索商品" clearable style="width: 200px;" />
            </el-form-item>
            <el-form-item label="状态">
              <el-select v-model="searchStatus" clearable placeholder="全部" style="width: 120px;">
                <el-option label="上架" value="active" />
                <el-option label="下架" value="inactive" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="loadProducts">查询</el-button>
              <el-button @click="resetSearch">重置</el-button>
            </el-form-item>
          </el-form>

          <!-- 商品列表 -->
          <el-table :data="products" v-loading="loading" stripe>
            <el-table-column prop="image" label="图片" width="80">
              <template #default="{ row }">
                <el-image 
                  v-if="row.image" 
                  :src="row.image" 
                  style="width: 50px; height: 50px;"
                  fit="cover"
                />
                <div v-else class="no-image">暂无图片</div>
              </template>
            </el-table-column>
            <el-table-column prop="name" label="商品名称" min-width="150" />
            <el-table-column prop="category" label="分类" width="100">
              <template #default="{ row }">
                <el-tag size="small">{{ categoryMap[row.category] || row.category }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="points" label="所需积分" width="100">
              <template #default="{ row }">
                <span style="color: #E6A23C; font-weight: bold;">{{ row.points }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="stock" label="库存" width="80">
              <template #default="{ row }">
                <span :class="{ 'low-stock': row.stock < 10 }">{{ row.stock }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="exchangedCount" label="已兑换" width="80" />
            <el-table-column prop="status" label="状态" width="80">
              <template #default="{ row }">
                <el-tag :type="row.status === 'active' ? 'success' : 'info'" size="small">
                  {{ row.status === 'active' ? '上架' : '下架' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150" fixed="right">
              <template #default="{ row }">
                <el-button link @click="showProductDialog(row)">编辑</el-button>
                <el-button 
                  link 
                  :type="row.status === 'active' ? 'warning' : 'success'" 
                  @click="toggleProductStatus(row)"
                >
                  {{ row.status === 'active' ? '下架' : '上架' }}
                </el-button>
                <el-button link type="danger" @click="deleteProduct(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>

          <!-- 分页 -->
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :total="total"
            :page-sizes="[10, 20, 50]"
            layout="total, sizes, prev, pager, next"
            @size-change="loadProducts"
            @current-change="loadProducts"
            style="margin-top: 16px; justify-content: flex-end;"
          />
        </el-card>
      </el-col>

      <!-- 右侧：统计概览 -->
      <el-col :span="8">
        <el-card class="overview-card">
          <template #header>
            <span>兑换概览</span>
          </template>
          <div class="overview-content">
            <div class="overview-item">
              <div class="overview-label">总商品数</div>
              <div class="overview-value">{{ overview.totalProducts || 0 }}</div>
            </div>
            <div class="overview-item">
              <div class="overview-label">总兑换次数</div>
              <div class="overview-value warning">{{ overview.totalExchanges || 0 }}</div>
            </div>
            <div class="overview-item">
              <div class="overview-label">本月兑换</div>
              <div class="overview-value success">{{ overview.monthExchanges || 0 }}</div>
            </div>
            <div class="overview-item">
              <div class="overview-label">消耗总积分</div>
              <div class="overview-value">{{ overview.totalPointsUsed || 0 }}</div>
            </div>
          </div>
        </el-card>

        <!-- 热门商品 -->
        <el-card style="margin-top: 20px;">
          <template #header>
            <span>热门商品 TOP5</span>
          </template>
          <div v-for="(item, index) in hotProducts" :key="item.id" class="hot-item">
            <div class="hot-rank" :class="{ top: index < 3 }">{{ index + 1 }}</div>
            <div class="hot-info">
              <div class="hot-name">{{ item.name }}</div>
              <div class="hot-count">兑换 {{ item.exchangedCount }} 次</div>
            </div>
          </div>
          <el-empty v-if="!hotProducts.length" description="暂无数据" :image-size="60" />
        </el-card>
      </el-col>
    </el-row>

    <!-- 兑换记录 -->
    <el-card style="margin-top: 20px;">
      <template #header>
        <div class="card-header">
          <span>兑换记录</span>
          <el-button type="primary" @click="exportRecords">导出记录</el-button>
        </div>
      </template>

      <el-form :inline="true" class="search-form">
        <el-form-item label="会员">
          <el-select 
            v-model="recordSearchMemberId" 
            filterable 
            remote 
            reserve-keyword
            placeholder="搜索会员"
            :remote-method="searchMembers"
            clearable
            style="width: 200px;"
          >
            <el-option 
              v-for="member in memberOptions" 
              :key="member.id" 
              :label="`${member.name} (${member.phone})`" 
              :value="member.id" 
            />
          </el-select>
        </el-form-item>
        <el-form-item label="商品">
          <el-select v-model="recordSearchProductId" clearable placeholder="全部" style="width: 150px;">
            <el-option 
              v-for="p in products" 
              :key="p.id" 
              :label="p.name" 
              :value="p.id" 
            />
          </el-select>
        </el-form-item>
        <el-form-item label="时间">
          <el-date-picker 
            v-model="recordSearchDateRange" 
            type="daterange" 
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 240px;"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadRecords">查询</el-button>
          <el-button @click="resetRecordSearch">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="records" v-loading="recordsLoading" stripe>
        <el-table-column prop="createdAt" label="兑换时间" width="160">
          <template #default="{ row }">
            {{ new Date(row.createdAt).toLocaleString() }}
          </template>
        </el-table-column>
        <el-table-column prop="memberName" label="会员" width="120">
          <template #default="{ row }">
            {{ row.member?.name || row.memberName }}
          </template>
        </el-table-column>
        <el-table-column prop="productName" label="商品" min-width="150">
          <template #default="{ row }">
            {{ row.product?.name || row.productName }}
          </template>
        </el-table-column>
        <el-table-column prop="points" label="消耗积分" width="100">
          <template #default="{ row }">
            <span style="color: #E6A23C;">{{ row.points }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusMap[row.status]?.type" size="small">
              {{ statusMap[row.status]?.label || row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button 
              v-if="row.status === 'pending'" 
              link 
              type="primary" 
              @click="fulfillExchange(row)"
            >发货</el-button>
            <el-button link @click="showRecordDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="recordCurrentPage"
        v-model:page-size="recordPageSize"
        :total="recordTotal"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        @size-change="loadRecords"
        @current-change="loadRecords"
        style="margin-top: 16px; justify-content: flex-end;"
      />
    </el-card>

    <!-- 商品对话框 -->
    <el-dialog v-model="productDialogVisible" :title="isEditProduct ? '编辑商品' : '新增商品'" width="600px">
      <el-form :model="productForm" label-width="100px" :rules="productRules" ref="productFormRef">
        <el-form-item label="商品名称" prop="name">
          <el-input v-model="productForm.name" placeholder="请输入商品名称" />
        </el-form-item>
        <el-form-item label="分类" prop="category">
          <el-select v-model="productForm.category" placeholder="请选择分类" style="width: 100%;">
            <el-option label="实物商品" value="physical" />
            <el-option label="虚拟商品" value="virtual" />
            <el-option label="优惠券" value="coupon" />
            <el-option label="服务项目" value="service" />
          </el-select>
        </el-form-item>
        <el-form-item label="所需积分" prop="points">
          <el-input-number v-model="productForm.points" :min="1" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="库存" prop="stock">
          <el-input-number v-model="productForm.stock" :min="0" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="商品图片" prop="image">
          <el-input v-model="productForm.image" placeholder="图片URL" />
        </el-form-item>
        <el-form-item label="商品描述" prop="description">
          <el-input v-model="productForm.description" type="textarea" :rows="3" placeholder="请输入商品描述" />
        </el-form-item>
        <el-form-item label="关联内容" v-if="productForm.category !== 'physical'">
          <el-select 
            v-model="productForm.relatedId" 
            placeholder="选择关联内容" 
            style="width: 100%;"
            clearable
          >
            <el-option 
              v-for="item in relatedOptions" 
              :key="item.id" 
              :label="item.name" 
              :value="item.id" 
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="productForm.isActive" active-text="上架" inactive-text="下架" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="productDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="productSubmitting" @click="saveProduct">保存</el-button>
      </template>
    </el-dialog>

    <!-- 兑换详情对话框 -->
    <el-dialog v-model="recordDetailVisible" title="兑换详情" width="500px">
      <el-descriptions :column="1" border v-if="selectedRecord">
        <el-descriptions-item label="兑换时间">
          {{ new Date(selectedRecord.createdAt).toLocaleString() }}
        </el-descriptions-item>
        <el-descriptions-item label="会员">
          {{ selectedRecord.member?.name || selectedRecord.memberName }}
        </el-descriptions-item>
        <el-descriptions-item label="商品">
          {{ selectedRecord.product?.name || selectedRecord.productName }}
        </el-descriptions-item>
        <el-descriptions-item label="消耗积分">
          {{ selectedRecord.points }}
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="statusMap[selectedRecord.status]?.type">
            {{ statusMap[selectedRecord.status]?.label }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="备注" v-if="selectedRecord.remark">
          {{ selectedRecord.remark }}
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'

const API_BASE = 'http://localhost:3000/api'
const token = localStorage.getItem('token') || ''

const categoryMap: Record<string, string> = {
  physical: '实物商品',
  virtual: '虚拟商品',
  coupon: '优惠券',
  service: '服务项目'
}

const statusMap: Record<string, { label: string; type: string }> = {
  pending: { label: '待发货', type: 'warning' },
  fulfilled: { label: '已完成', type: 'success' },
  cancelled: { label: '已取消', type: 'info' }
}

const loading = ref(false)
const recordsLoading = ref(false)
const productSubmitting = ref(false)

const products = ref<any[]>([])
const records = ref<any[]>([])
const memberOptions = ref<any[]>([])
const hotProducts = ref<any[]>([])
const relatedOptions = ref<any[]>([])

const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

const recordTotal = ref(0)
const recordCurrentPage = ref(1)
const recordPageSize = ref(10)

const searchName = ref('')
const searchStatus = ref('')

const recordSearchMemberId = ref('')
const recordSearchProductId = ref('')
const recordSearchDateRange = ref<[Date, Date] | null>(null)

const productDialogVisible = ref(false)
const recordDetailVisible = ref(false)
const isEditProduct = ref(false)
const editProductId = ref('')

const productFormRef = ref<FormInstance>()
const selectedRecord = ref<any>(null)

const overview = ref({
  totalProducts: 0,
  totalExchanges: 0,
  monthExchanges: 0,
  totalPointsUsed: 0
})

const productForm = ref({
  name: '',
  category: 'physical',
  points: 100,
  stock: 100,
  image: '',
  description: '',
  relatedId: '',
  isActive: true
})

const productRules: FormRules = {
  name: [{ required: true, message: '请输入商品名称', trigger: 'blur' }],
  category: [{ required: true, message: '请选择分类', trigger: 'change' }],
  points: [{ required: true, message: '请输入所需积分', trigger: 'blur' }],
  stock: [{ required: true, message: '请输入库存', trigger: 'blur' }]
}

// 加载商品列表
const loadProducts = async () => {
  loading.value = true
  try {
    const params = new URLSearchParams({
      page: currentPage.value.toString(),
      pageSize: pageSize.value.toString()
    })
    if (searchName.value) params.append('name', searchName.value)
    if (searchStatus.value) params.append('status', searchStatus.value)
    
    const res = await fetch(`${API_BASE}/points-mall/products?${params}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const data = await res.json()
    products.value = data.list || data
    total.value = data.total || products.value.length
  } catch (e) {
    ElMessage.error('加载商品失败')
  } finally {
    loading.value = false
  }
}

// 加载概览
const loadOverview = async () => {
  try {
    const res = await fetch(`${API_BASE}/points-mall/overview`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    overview.value = await res.json()
  } catch (e) {
    console.error('加载概览失败')
  }
}

// 加载热门商品
const loadHotProducts = async () => {
  try {
    const res = await fetch(`${API_BASE}/points-mall/hot-products`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    hotProducts.value = await res.json()
  } catch (e) {
    console.error('加载热门商品失败')
  }
}

// 加载兑换记录
const loadRecords = async () => {
  recordsLoading.value = true
  try {
    const params = new URLSearchParams({
      page: recordCurrentPage.value.toString(),
      pageSize: recordPageSize.value.toString()
    })
    if (recordSearchMemberId.value) params.append('memberId', recordSearchMemberId.value)
    if (recordSearchProductId.value) params.append('productId', recordSearchProductId.value)
    if (recordSearchDateRange.value) {
      params.append('startDate', recordSearchDateRange.value[0].toISOString())
      params.append('endDate', recordSearchDateRange.value[1].toISOString())
    }
    
    const res = await fetch(`${API_BASE}/points-mall/exchanges?${params}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const data = await res.json()
    records.value = data.list || data
    recordTotal.value = data.total || records.value.length
  } catch (e) {
    ElMessage.error('加载记录失败')
  } finally {
    recordsLoading.value = false
  }
}

// 搜索会员
const searchMembers = async (query: string) => {
  if (!query) {
    memberOptions.value = []
    return
  }
  try {
    const res = await fetch(`${API_BASE}/members?keyword=${encodeURIComponent(query)}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    memberOptions.value = await res.json()
  } catch (e) {
    console.error('搜索会员失败')
  }
}

// 加载关联选项
const loadRelatedOptions = async () => {
  try {
    const category = productForm.value.category
    if (category === 'coupon') {
      const res = await fetch(`${API_BASE}/marketing/coupons`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      relatedOptions.value = await res.json()
    } else if (category === 'service') {
      const res = await fetch(`${API_BASE}/services`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      relatedOptions.value = await res.json()
    } else {
      relatedOptions.value = []
    }
  } catch (e) {
    console.error('加载关联选项失败')
  }
}

// 监听分类变化
watch(() => productForm.value.category, () => {
  productForm.value.relatedId = ''
  loadRelatedOptions()
})

const resetSearch = () => {
  searchName.value = ''
  searchStatus.value = ''
  currentPage.value = 1
  loadProducts()
}

const resetRecordSearch = () => {
  recordSearchMemberId.value = ''
  recordSearchProductId.value = ''
  recordSearchDateRange.value = null
  recordCurrentPage.value = 1
  loadRecords()
}

// 显示商品对话框
const showProductDialog = (row?: any) => {
  isEditProduct.value = !!row
  editProductId.value = row?.id || ''
  productForm.value = row ? {
    name: row.name,
    category: row.category,
    points: row.points,
    stock: row.stock,
    image: row.image || '',
    description: row.description || '',
    relatedId: row.relatedId || '',
    isActive: row.status === 'active'
  } : {
    name: '',
    category: 'physical',
    points: 100,
    stock: 100,
    image: '',
    description: '',
    relatedId: '',
    isActive: true
  }
  loadRelatedOptions()
  productDialogVisible.value = true
}

// 保存商品
const saveProduct = async () => {
  if (!productFormRef.value) return
  await productFormRef.value.validate(async (valid) => {
    if (!valid) return
    
    productSubmitting.value = true
    try {
      const data = {
        ...productForm.value,
        status: productForm.value.isActive ? 'active' : 'inactive'
      }
      
      const url = isEditProduct.value 
        ? `${API_BASE}/points-mall/products/${editProductId.value}` 
        : `${API_BASE}/points-mall/products`
      const method = isEditProduct.value ? 'PUT' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(data)
      })
      
      if (res.ok) {
        ElMessage.success('保存成功')
        productDialogVisible.value = false
        loadProducts()
        loadOverview()
      } else {
        const err = await res.json()
        ElMessage.error(err.message || '保存失败')
      }
    } catch (e) {
      ElMessage.error('网络错误')
    } finally {
      productSubmitting.value = false
    }
  })
}

// 切换商品状态
const toggleProductStatus = async (row: any) => {
  try {
    const newStatus = row.status === 'active' ? 'inactive' : 'active'
    await fetch(`${API_BASE}/points-mall/products/${row.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ status: newStatus })
    })
    ElMessage.success(newStatus === 'active' ? '已上架' : '已下架')
    loadProducts()
  } catch (e) {
    ElMessage.error('操作失败')
  }
}

// 删除商品
const deleteProduct = async (row: any) => {
  try {
    await ElMessageBox.confirm('确定删除该商品？', '提示', { type: 'warning' })
    await fetch(`${API_BASE}/points-mall/products/${row.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    })
    ElMessage.success('删除成功')
    loadProducts()
    loadOverview()
  } catch (e) {}
}

// 发货
const fulfillExchange = async (row: any) => {
  try {
    await ElMessageBox.confirm('确认发货？', '提示', { type: 'info' })
    await fetch(`${API_BASE}/points-mall/exchanges/${row.id}/fulfill`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    })
    ElMessage.success('发货成功')
    loadRecords()
  } catch (e) {}
}

// 显示记录详情
const showRecordDetail = (row: any) => {
  selectedRecord.value = row
  recordDetailVisible.value = true
}

// 导出记录
const exportRecords = async () => {
  try {
    const params = new URLSearchParams()
    if (recordSearchMemberId.value) params.append('memberId', recordSearchMemberId.value)
    if (recordSearchProductId.value) params.append('productId', recordSearchProductId.value)
    if (recordSearchDateRange.value) {
      params.append('startDate', recordSearchDateRange.value[0].toISOString())
      params.append('endDate', recordSearchDateRange.value[1].toISOString())
    }
    
    const res = await fetch(`${API_BASE}/points-mall/exchanges/export?${params}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const blob = await res.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `兑换记录_${new Date().toISOString().split('T')[0]}.xlsx`
    a.click()
    window.URL.revokeObjectURL(url)
  } catch (e) {
    ElMessage.error('导出失败')
  }
}

onMounted(() => {
  loadProducts()
  loadOverview()
  loadHotProducts()
  loadRecords()
})
</script>

<style scoped>
.points-mall-page {
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

.no-image {
  width: 50px;
  height: 50px;
  background: #f5f7fa;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #909399;
}

.low-stock {
  color: #F56C6C;
  font-weight: bold;
}

.overview-card .overview-content {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.overview-item {
  text-align: center;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
}

.overview-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.overview-value {
  font-size: 24px;
  font-weight: bold;
  color: #409EFF;
}

.overview-value.success {
  color: #67C23A;
}

.overview-value.warning {
  color: #E6A23C;
}

.hot-item {
  display: flex;
  align-items: center;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 6px;
  margin-bottom: 8px;
}

.hot-rank {
  width: 24px;
  height: 24px;
  background: #909399;
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  margin-right: 12px;
}

.hot-rank.top {
  background: #E6A23C;
}

.hot-info {
  flex: 1;
}

.hot-name {
  font-weight: bold;
  margin-bottom: 4px;
}

.hot-count {
  font-size: 12px;
  color: #909399;
}
</style>
