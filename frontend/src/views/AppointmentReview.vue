<template>
  <div class="appointment-review-page">
    <el-row :gutter="20">
      <!-- 左侧：评价统计 -->
      <el-col :span="8">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>评价统计</span>
            </div>
          </template>

          <!-- 总体评分 -->
          <div class="overall-rating">
            <div class="rating-score">{{ avgRating }}</div>
            <div class="rating-stars">
              <el-rate v-model="avgRatingValue" disabled show-score text-color="#ff9900" />
            </div>
            <div class="rating-count">{{ totalReviews }} 条评价</div>
          </div>

          <!-- 评分分布 -->
          <div class="rating-distribution">
            <div v-for="star in [5, 4, 3, 2, 1]" :key="star" class="rating-bar">
              <span class="star-label">{{ star }}星</span>
              <el-progress 
                :percentage="getRatingPercentage(star)" 
                :stroke-width="10" 
                :show-text="false"
                :color="getRatingColor(star)"
              />
              <span class="star-count">{{ getRatingCount(star) }}</span>
            </div>
          </div>
        </el-card>

        <!-- 服务评分 -->
        <el-card style="margin-top: 20px">
          <template #header>
            <span>各项评分</span>
          </template>

          <div class="service-ratings">
            <div class="rating-item">
              <span class="rating-label">服务态度</span>
              <el-rate v-model="serviceAttitudeRating" disabled show-score />
            </div>
            <div class="rating-item">
              <span class="rating-label">专业技能</span>
              <el-rate v-model="skillRating" disabled show-score />
            </div>
            <div class="rating-item">
              <span class="rating-label">环境卫生</span>
              <el-rate v-model="environmentRating" disabled show-score />
            </div>
            <div class="rating-item">
              <span class="rating-label">性价比</span>
              <el-rate v-model="valueRating" disabled show-score />
            </div>
          </div>
        </el-card>

        <!-- 员工评分排行 -->
        <el-card style="margin-top: 20px">
          <template #header>
            <span>员工评分排行</span>
          </template>

          <div class="employee-ranking">
            <div v-for="(emp, index) in employeeRanking" :key="emp.id" class="ranking-item">
              <span class="rank" :class="`rank-${index + 1}`">{{ index + 1 }}</span>
              <span class="employee-name">{{ emp.name }}</span>
              <el-rate v-model="emp.rating" disabled size="small" />
              <span class="review-count">({{ emp.reviewCount }})</span>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 右侧：评价列表 -->
      <el-col :span="16">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>评价列表</span>
              <div class="filter-bar">
                <el-select v-model="filterRating" placeholder="评分筛选" clearable style="width: 120px" @change="loadReviews">
                  <el-option label="全部" value="" />
                  <el-option label="5星" value="5" />
                  <el-option label="4星" value="4" />
                  <el-option label="3星" value="3" />
                  <el-option label="2星" value="2" />
                  <el-option label="1星" value="1" />
                </el-select>
                <el-select v-model="filterEmployeeId" placeholder="员工筛选" clearable style="width: 150px; margin-left: 10px" @change="loadReviews">
                  <el-option v-for="e in employeeList" :key="e.id" :label="e.name" :value="e.id" />
                </el-select>
                <el-date-picker
                  v-model="filterDateRange"
                  type="daterange"
                  range-separator="至"
                  start-placeholder="开始日期"
                  end-placeholder="结束日期"
                  style="margin-left: 10px"
                  @change="loadReviews"
                />
              </div>
            </div>
          </template>

          <div class="review-list" v-loading="loading">
            <div v-for="review in reviewList" :key="review.id" class="review-item">
              <div class="review-header">
                <div class="customer-info">
                  <el-avatar :size="40">{{ review.member?.name?.charAt(0) || '客' }}</el-avatar>
                  <div class="customer-detail">
                    <div class="customer-name">{{ review.member?.name || review.guestName || '散客' }}</div>
                    <div class="review-time">{{ formatTime(review.createdAt) }}</div>
                  </div>
                </div>
                <div class="review-rating">
                  <el-rate v-model="review.rating" disabled />
                </div>
              </div>

              <div class="review-content">
                {{ review.content || '用户未填写评价内容' }}
              </div>

              <div class="review-images" v-if="review.images?.length">
                <el-image
                  v-for="(img, index) in review.images"
                  :key="index"
                  :src="img"
                  :preview-src-list="review.images"
                  fit="cover"
                  style="width: 80px; height: 80px; margin-right: 10px; border-radius: 4px;"
                />
              </div>

              <div class="review-tags" v-if="review.tags?.length">
                <el-tag v-for="tag in review.tags" :key="tag" size="small" style="margin-right: 5px">
                  {{ tag }}
                </el-tag>
              </div>

              <div class="review-service">
                <span>服务项目：{{ review.appointment?.service?.name }}</span>
                <span style="margin-left: 20px">服务员工：{{ review.appointment?.employee?.name }}</span>
              </div>

              <div class="review-reply" v-if="review.reply">
                <div class="reply-header">
                  <span class="reply-label">商家回复：</span>
                  <span class="reply-time">{{ formatTime(review.replyTime) }}</span>
                </div>
                <div class="reply-content">{{ review.reply }}</div>
              </div>

              <div class="review-actions">
                <el-button size="small" @click="handleReply(review)" v-if="!review.reply">
                  回复
                </el-button>
                <el-button size="small" @click="handleEditReply(review)" v-else>
                  编辑回复
                </el-button>
              </div>
            </div>

            <el-empty v-if="reviewList.length === 0 && !loading" description="暂无评价" />
          </div>

          <!-- 分页 -->
          <div class="pagination-container" v-if="total > pageSize">
            <el-pagination
              v-model:current-page="currentPage"
              :page-size="pageSize"
              :total="total"
              layout="prev, pager, next"
              @current-change="loadReviews"
            />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 回复对话框 -->
    <el-dialog v-model="replyDialogVisible" title="回复评价" width="500px">
      <el-form :model="replyForm" label-width="80px">
        <el-form-item label="评价内容">
          <div class="original-review">{{ currentReview?.content || '用户未填写评价内容' }}</div>
        </el-form-item>
        <el-form-item label="回复内容" required>
          <el-input 
            v-model="replyForm.content" 
            type="textarea" 
            rows="4" 
            placeholder="请输入回复内容"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="replyDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="replySubmitting" @click="handleSubmitReply">提交回复</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'

const API_BASE = 'http://localhost:3000/api'
const token = localStorage.getItem('token') || ''

const loading = ref(false)
const replySubmitting = ref(false)
const replyDialogVisible = ref(false)
const currentReview = ref<any>(null)

const reviewList = ref<any[]>([])
const employeeList = ref<any[]>([])
const employeeRanking = ref<any[]>([])

const filterRating = ref('')
const filterEmployeeId = ref('')
const filterDateRange = ref<[Date, Date] | null>(null)
const currentPage = ref(1)
const pageSize = 10
const total = ref(0)

const replyForm = ref({
  content: '',
})

// 统计数据
const totalReviews = ref(0)
const avgRating = ref('0.0')
const avgRatingValue = ref(0)
const ratingDistribution = ref<Record<number, number>>({ 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 })
const serviceAttitudeRating = ref(0)
const skillRating = ref(0)
const environmentRating = ref(0)
const valueRating = ref(0)

// 计算评分百分比
const getRatingPercentage = (star: number) => {
  if (totalReviews.value === 0) return 0
  return Math.round((ratingDistribution.value[star] || 0) / totalReviews.value * 100)
}

const getRatingCount = (star: number) => {
  return ratingDistribution.value[star] || 0
}

const getRatingColor = (star: number) => {
  const colors: Record<number, string> = {
    5: '#67c23a',
    4: '#95d475',
    3: '#e6a23c',
    2: '#f5c76a',
    1: '#f56c6c',
  }
  return colors[star]
}

const formatTime = (time: string) => {
  if (!time) return ''
  return new Date(time).toLocaleString()
}

const loadReviews = async () => {
  loading.value = true
  try {
    const params = new URLSearchParams()
    params.append('page', currentPage.value.toString())
    params.append('pageSize', pageSize.toString())
    
    if (filterRating.value) {
      params.append('rating', filterRating.value)
    }
    if (filterEmployeeId.value) {
      params.append('employeeId', filterEmployeeId.value)
    }
    if (filterDateRange.value) {
      params.append('startDate', filterDateRange.value[0].toISOString().split('T')[0])
      params.append('endDate', filterDateRange.value[1].toISOString().split('T')[0])
    }

    const res = await fetch(`${API_BASE}/appointment-reviews?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const data = await res.json()
    
    reviewList.value = data.list || []
    total.value = data.total || 0
  } catch (e) {
    ElMessage.error('加载评价失败')
  } finally {
    loading.value = false
  }
}

const loadStatistics = async () => {
  try {
    const res = await fetch(`${API_BASE}/appointment-reviews/statistics`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const data = await res.json()
    
    totalReviews.value = data.totalReviews || 0
    avgRating.value = data.avgRating?.toFixed(1) || '0.0'
    avgRatingValue.value = parseFloat(data.avgRating?.toFixed(1) || '0')
    ratingDistribution.value = data.ratingDistribution || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    serviceAttitudeRating.value = data.serviceAttitudeRating || 0
    skillRating.value = data.skillRating || 0
    environmentRating.value = data.environmentRating || 0
    valueRating.value = data.valueRating || 0
    employeeRanking.value = data.employeeRanking || []
  } catch (e) {}
}

const loadEmployees = async () => {
  try {
    const res = await fetch(`${API_BASE}/employees`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    employeeList.value = await res.json()
  } catch (e) {}
}

const handleReply = (review: any) => {
  currentReview.value = review
  replyForm.value = {
    content: review.reply || '',
  }
  replyDialogVisible.value = true
}

const handleEditReply = (review: any) => {
  handleReply(review)
}

const handleSubmitReply = async () => {
  if (!replyForm.value.content.trim()) {
    ElMessage.warning('请输入回复内容')
    return
  }
  
  replySubmitting.value = true
  try {
    const res = await fetch(`${API_BASE}/appointment-reviews/${currentReview.value.id}/reply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ reply: replyForm.value.content })
    })
    
    if (res.ok) {
      ElMessage.success('回复成功')
      replyDialogVisible.value = false
      loadReviews()
    } else {
      const err = await res.json()
      ElMessage.error(err.message || '回复失败')
    }
  } catch (e) {
    ElMessage.error('网络错误')
  } finally {
    replySubmitting.value = false
  }
}

onMounted(() => {
  loadReviews()
  loadStatistics()
  loadEmployees()
})
</script>

<style scoped>
.appointment-review-page {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filter-bar {
  display: flex;
  align-items: center;
}

/* 总体评分 */
.overall-rating {
  text-align: center;
  padding: 20px 0;
  border-bottom: 1px solid #ebeef5;
}

.rating-score {
  font-size: 48px;
  font-weight: 700;
  color: #ff9900;
}

.rating-stars {
  margin: 10px 0;
}

.rating-count {
  color: #909399;
  font-size: 14px;
}

/* 评分分布 */
.rating-distribution {
  padding: 20px 0;
}

.rating-bar {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.star-label {
  width: 40px;
  font-size: 12px;
  color: #606266;
}

.rating-bar .el-progress {
  flex: 1;
  margin: 0 10px;
}

.star-count {
  width: 40px;
  text-align: right;
  font-size: 12px;
  color: #909399;
}

/* 各项评分 */
.service-ratings {
  padding: 10px 0;
}

.rating-item {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
}

.rating-label {
  width: 80px;
  font-size: 14px;
  color: #606266;
}

/* 员工排行 */
.employee-ranking {
  padding: 10px 0;
}

.ranking-item {
  display: flex;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #ebeef5;
}

.ranking-item:last-child {
  border-bottom: none;
}

.rank {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  margin-right: 10px;
  background-color: #f0f0f0;
  color: #909399;
}

.rank-1 {
  background-color: #ff9900;
  color: white;
}

.rank-2 {
  background-color: #c0c0c0;
  color: white;
}

.rank-3 {
  background-color: #cd7f32;
  color: white;
}

.employee-name {
  flex: 1;
  font-size: 14px;
}

.review-count {
  font-size: 12px;
  color: #909399;
  margin-left: 5px;
}

/* 评价列表 */
.review-list {
  min-height: 400px;
}

.review-item {
  padding: 20px 0;
  border-bottom: 1px solid #ebeef5;
}

.review-item:last-child {
  border-bottom: none;
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
}

.customer-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.customer-name {
  font-size: 14px;
  font-weight: 500;
}

.review-time {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.review-content {
  font-size: 14px;
  line-height: 1.6;
  color: #303133;
  margin-bottom: 15px;
}

.review-images {
  margin-bottom: 15px;
}

.review-tags {
  margin-bottom: 15px;
}

.review-service {
  font-size: 12px;
  color: #909399;
  margin-bottom: 15px;
}

.review-reply {
  background-color: #f5f7fa;
  padding: 12px;
  border-radius: 4px;
  margin-bottom: 15px;
}

.reply-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.reply-label {
  font-size: 12px;
  font-weight: 500;
  color: #409eff;
}

.reply-time {
  font-size: 12px;
  color: #909399;
}

.reply-content {
  font-size: 13px;
  color: #606266;
  line-height: 1.5;
}

.review-actions {
  text-align: right;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.original-review {
  background-color: #f5f7fa;
  padding: 10px;
  border-radius: 4px;
  font-size: 13px;
  color: #606266;
}
</style>
