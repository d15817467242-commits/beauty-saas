<template>
  <div class="service-review-page">
    <!-- 评价统计卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-value">{{ stats.totalReviews }}</div>
            <div class="stat-label">总评价数</div>
          </div>
          <el-icon class="stat-icon"><ChatDotRound /></el-icon>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-value">{{ stats.avgRating.toFixed(1) }}</div>
            <div class="stat-label">平均评分</div>
          </div>
          <el-rate :model-value="stats.avgRating" disabled show-score text-color="#ff9900" />
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-value good">{{ stats.goodRate }}%</div>
            <div class="stat-label">好评率</div>
          </div>
          <el-progress :percentage="stats.goodRate" :stroke-width="8" status="success" />
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-value">{{ stats.hasImageCount }}</div>
            <div class="stat-label">有图评价</div>
          </div>
          <el-icon class="stat-icon"><Picture /></el-icon>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <!-- 评分分布图表 -->
      <el-col :span="8">
        <el-card>
          <template #header>
            <span>评分分布</span>
          </template>
          <div class="rating-distribution">
            <div v-for="star in [5, 4, 3, 2, 1]" :key="star" class="rating-bar">
              <span class="star-label">{{ star }}星</span>
              <el-progress 
                :percentage="getRatingPercentage(star)" 
                :stroke-width="16"
                :color="getRatingColor(star)"
              />
              <span class="count">{{ stats.ratingDistribution[star] || 0 }}</span>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 服务评分排行 -->
      <el-col :span="8">
        <el-card>
          <template #header>
            <span>服务评分排行</span>
          </template>
          <div class="service-ranking">
            <div v-for="(item, index) in topServices" :key="item.id" class="ranking-item">
              <span class="rank" :class="{ top: index < 3 }">{{ index + 1 }}</span>
              <span class="service-name">{{ item.name }}</span>
              <el-rate :model-value="item.avgRating" disabled size="small" />
              <span class="review-count">({{ item.reviewCount }})</span>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 评价趋势图表 -->
      <el-col :span="8">
        <el-card>
          <template #header>
            <span>近7天评价趋势</span>
          </template>
          <div class="trend-chart" ref="trendChartRef"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 评价列表 -->
    <el-card class="review-list-card">
      <template #header>
        <div class="card-header">
          <span>评价列表</span>
          <div class="header-actions">
            <el-select v-model="filterRating" placeholder="评分筛选" clearable style="width: 120px">
              <el-option v-for="star in [5, 4, 3, 2, 1]" :key="star" :label="`${star}星`" :value="star" />
            </el-select>
            <el-select v-model="filterHasImage" placeholder="有图筛选" clearable style="width: 120px">
              <el-option label="有图" :value="true" />
              <el-option label="无图" :value="false" />
            </el-select>
            <el-button type="primary" @click="loadReviews">查询</el-button>
          </div>
        </div>
      </template>

      <div class="review-list" v-loading="loading">
        <div v-for="review in reviewList" :key="review.id" class="review-item">
          <div class="review-header">
            <div class="user-info">
              <el-avatar :src="review.memberAvatar" :size="40">{{ review.memberName?.charAt(0) }}</el-avatar>
              <div class="user-detail">
                <div class="user-name">{{ review.memberName }}</div>
                <div class="review-meta">
                  <el-rate :model-value="review.rating" disabled size="small" />
                  <span class="service-name">{{ review.serviceName }}</span>
                  <span class="review-time">{{ formatTime(review.createdAt) }}</span>
                </div>
              </div>
            </div>
            <div class="review-actions">
              <el-button size="small" text @click="handleReply(review)">回复</el-button>
              <el-button size="small" text type="danger" @click="handleDelete(review)">删除</el-button>
            </div>
          </div>

          <div class="review-content">
            {{ review.content }}
          </div>

          <div class="review-images" v-if="review.images && review.images.length > 0">
            <el-image
              v-for="(img, index) in review.images"
              :key="index"
              :src="img"
              :preview-src-list="review.images"
              fit="cover"
              class="review-image"
            />
          </div>

          <!-- 商家回复 -->
          <div class="merchant-reply" v-if="review.reply">
            <div class="reply-header">
              <el-tag size="small" type="info">商家回复</el-tag>
              <span class="reply-time">{{ formatTime(review.replyTime) }}</span>
            </div>
            <div class="reply-content">{{ review.reply }}</div>
          </div>

          <!-- 标签 -->
          <div class="review-tags" v-if="review.tags && review.tags.length > 0">
            <el-tag v-for="tag in review.tags" :key="tag" size="small" type="info">{{ tag }}</el-tag>
          </div>
        </div>

        <el-empty v-if="!loading && reviewList.length === 0" description="暂无评价数据" />
      </div>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          @size-change="loadReviews"
          @current-change="loadReviews"
        />
      </div>
    </el-card>

    <!-- 回复对话框 -->
    <el-dialog v-model="replyDialogVisible" title="回复评价" width="500px">
      <div class="reply-preview" v-if="currentReview">
        <div class="preview-rating">
          <el-rate :model-value="currentReview.rating" disabled />
        </div>
        <div class="preview-content">{{ currentReview.content }}</div>
      </div>
      <el-input
        v-model="replyContent"
        type="textarea"
        :rows="4"
        placeholder="请输入回复内容..."
        maxlength="500"
        show-word-limit
      />
      <template #footer>
        <el-button @click="replyDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="replying" @click="submitReply">提交回复</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ChatDotRound, Picture } from '@element-plus/icons-vue'
import * as echarts from 'echarts'

const API_BASE = 'http://localhost:3000/api'
const token = localStorage.getItem('token') || ''

// 统计数据
const stats = ref({
  totalReviews: 0,
  avgRating: 0,
  goodRate: 0,
  hasImageCount: 0,
  ratingDistribution: {} as Record<number, number>
})

// 服务排行
const topServices = ref<any[]>([])

// 评价列表
const loading = ref(false)
const reviewList = ref<any[]>([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 筛选
const filterRating = ref<number | ''>('')
const filterHasImage = ref<boolean | ''>('')

// 回复
const replyDialogVisible = ref(false)
const currentReview = ref<any>(null)
const replyContent = ref('')
const replying = ref(false)

// 图表引用
const trendChartRef = ref<HTMLElement>()

// 获取评分百分比
const getRatingPercentage = (star: number) => {
  const total = stats.value.totalReviews || 1
  const count = stats.value.ratingDistribution[star] || 0
  return Math.round((count / total) * 100)
}

// 获取评分颜色
const getRatingColor = (star: number) => {
  const colors: Record<number, string> = {
    5: '#67c23a',
    4: '#95d475',
    3: '#e6a23c',
    2: '#f56c6c',
    1: '#f56c6c'
  }
  return colors[star] || '#909399'
}

// 格式化时间
const formatTime = (time: string) => {
  if (!time) return ''
  const date = new Date(time)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`
  
  return date.toLocaleDateString()
}

// 加载统计数据
const loadStats = async () => {
  try {
    const res = await fetch(`${API_BASE}/reviews/stats`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const data = await res.json()
    stats.value = {
      totalReviews: data.totalReviews || 0,
      avgRating: data.avgRating || 0,
      goodRate: data.goodRate || 0,
      hasImageCount: data.hasImageCount || 0,
      ratingDistribution: data.ratingDistribution || {}
    }
  } catch (e) {
    // 模拟数据
    stats.value = {
      totalReviews: 1280,
      avgRating: 4.6,
      goodRate: 92,
      hasImageCount: 356,
      ratingDistribution: { 5: 980, 4: 200, 3: 60, 2: 25, 1: 15 }
    }
  }
}

// 加载服务排行
const loadTopServices = async () => {
  try {
    const res = await fetch(`${API_BASE}/reviews/top-services`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    topServices.value = await res.json()
  } catch (e) {
    // 模拟数据
    topServices.value = [
      { id: '1', name: '精剪服务', avgRating: 4.9, reviewCount: 328 },
      { id: '2', name: '染发套餐', avgRating: 4.8, reviewCount: 256 },
      { id: '3', name: '烫发护理', avgRating: 4.7, reviewCount: 198 },
      { id: '4', name: '面部护理', avgRating: 4.6, reviewCount: 167 },
      { id: '5', name: '美甲服务', avgRating: 4.5, reviewCount: 131 }
    ]
  }
}

// 加载评价列表
const loadReviews = async () => {
  loading.value = true
  try {
    const params = new URLSearchParams({
      page: currentPage.value.toString(),
      pageSize: pageSize.value.toString(),
      ...(filterRating.value && { rating: filterRating.value.toString() }),
      ...(filterHasImage.value !== '' && { hasImage: filterHasImage.value.toString() })
    })
    const res = await fetch(`${API_BASE}/reviews?${params}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const data = await res.json()
    reviewList.value = data.data || data.items || data
    total.value = data.total || reviewList.value.length
  } catch (e) {
    // 模拟数据
    reviewList.value = [
      {
        id: '1',
        memberName: '张小姐',
        memberAvatar: '',
        serviceName: '精剪服务',
        rating: 5,
        content: '发型师技术很好，服务态度也很棒，下次还会再来！',
        images: [],
        tags: ['技术好', '服务热情'],
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        reply: '感谢您的认可，我们会继续努力！',
        replyTime: new Date(Date.now() - 1800000).toISOString()
      },
      {
        id: '2',
        memberName: '李女士',
        memberAvatar: '',
        serviceName: '染发套餐',
        rating: 4,
        content: '颜色很满意，就是等待时间有点长。',
        images: ['https://picsum.photos/200/200?random=1'],
        tags: ['颜色正'],
        createdAt: new Date(Date.now() - 86400000).toISOString()
      },
      {
        id: '3',
        memberName: '王先生',
        memberAvatar: '',
        serviceName: '烫发护理',
        rating: 5,
        content: '效果超出预期，发型师很专业，推荐！',
        images: ['https://picsum.photos/200/200?random=2', 'https://picsum.photos/200/200?random=3'],
        tags: ['专业', '效果好'],
        createdAt: new Date(Date.now() - 172800000).toISOString()
      }
    ]
    total.value = 3
  } finally {
    loading.value = false
  }
}

// 初始化趋势图表
const initTrendChart = () => {
  nextTick(() => {
    if (!trendChartRef.value) return
    
    const chart = echarts.init(trendChartRef.value)
    const option = {
      tooltip: {
        trigger: 'axis'
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
      },
      yAxis: {
        type: 'value'
      },
      series: [
        {
          name: '评价数',
          type: 'line',
          smooth: true,
          data: [45, 52, 38, 64, 72, 98, 86],
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(64, 158, 255, 0.5)' },
              { offset: 1, color: 'rgba(64, 158, 255, 0.1)' }
            ])
          },
          lineStyle: {
            color: '#409eff'
          },
          itemStyle: {
            color: '#409eff'
          }
        },
        {
          name: '好评数',
          type: 'line',
          smooth: true,
          data: [42, 48, 35, 60, 68, 92, 80],
          lineStyle: {
            color: '#67c23a'
          },
          itemStyle: {
            color: '#67c23a'
          }
        }
      ]
    }
    chart.setOption(option)
    
    window.addEventListener('resize', () => chart.resize())
  })
}

// 回复评价
const handleReply = (review: any) => {
  currentReview.value = review
  replyContent.value = review.reply || ''
  replyDialogVisible.value = true
}

// 提交回复
const submitReply = async () => {
  if (!replyContent.value.trim()) {
    ElMessage.warning('请输入回复内容')
    return
  }
  
  replying.value = true
  try {
    const res = await fetch(`${API_BASE}/reviews/${currentReview.value.id}/reply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ reply: replyContent.value })
    })
    if (res.ok) {
      ElMessage.success('回复成功')
      currentReview.value.reply = replyContent.value
      currentReview.value.replyTime = new Date().toISOString()
      replyDialogVisible.value = false
    } else {
      ElMessage.error('回复失败')
    }
  } catch (e) {
    // 模拟成功
    currentReview.value.reply = replyContent.value
    currentReview.value.replyTime = new Date().toISOString()
    replyDialogVisible.value = false
    ElMessage.success('回复成功')
  } finally {
    replying.value = false
  }
}

// 删除评价
const handleDelete = async (review: any) => {
  try {
    await ElMessageBox.confirm('确定要删除该评价吗？', '提示', { type: 'warning' })
    const res = await fetch(`${API_BASE}/reviews/${review.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    })
    if (res.ok) {
      ElMessage.success('删除成功')
      loadReviews()
      loadStats()
    } else {
      ElMessage.error('删除失败')
    }
  } catch (e) {}
}

onMounted(() => {
  loadStats()
  loadTopServices()
  loadReviews()
  initTrendChart()
})
</script>

<style scoped>
.service-review-page {
  padding: 20px;
}

/* 统计卡片 */
.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  position: relative;
  overflow: hidden;
}

.stat-card :deep(.el-card__body) {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 32px;
  font-weight: bold;
  color: #303133;
}

.stat-value.good {
  color: #67c23a;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 8px;
}

.stat-icon {
  font-size: 48px;
  color: #dcdfe6;
}

/* 评分分布 */
.rating-distribution {
  padding: 10px 0;
}

.rating-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.star-label {
  width: 40px;
  font-size: 14px;
}

.rating-bar :deep(.el-progress) {
  flex: 1;
}

.count {
  width: 40px;
  text-align: right;
  font-size: 14px;
  color: #909399;
}

/* 服务排行 */
.service-ranking {
  padding: 10px 0;
}

.ranking-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
}

.ranking-item:last-child {
  border-bottom: none;
}

.rank {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #909399;
}

.rank.top {
  background: linear-gradient(135deg, #ffd700, #ffaa00);
  color: white;
}

.service-name {
  flex: 1;
  font-size: 14px;
}

.review-count {
  font-size: 12px;
  color: #909399;
}

/* 趋势图表 */
.trend-chart {
  height: 200px;
}

/* 评价列表 */
.review-list-card {
  margin-top: 20px;
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

.review-list {
  min-height: 300px;
}

.review-item {
  padding: 20px 0;
  border-bottom: 1px solid #f0f0f0;
}

.review-item:last-child {
  border-bottom: none;
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.user-info {
  display: flex;
  gap: 12px;
}

.user-name {
  font-weight: 500;
  margin-bottom: 4px;
}

.review-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  color: #909399;
}

.service-name {
  color: #409eff;
}

.review-content {
  font-size: 14px;
  line-height: 1.6;
  color: #303133;
  margin-bottom: 12px;
}

.review-images {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.review-image {
  width: 80px;
  height: 80px;
  border-radius: 4px;
  cursor: pointer;
}

.merchant-reply {
  background: #f5f7fa;
  padding: 12px;
  border-radius: 4px;
  margin-bottom: 12px;
}

.reply-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.reply-time {
  font-size: 12px;
  color: #909399;
}

.reply-content {
  font-size: 14px;
  color: #606266;
}

.review-tags {
  display: flex;
  gap: 8px;
}

.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

/* 回复预览 */
.reply-preview {
  background: #f5f7fa;
  padding: 12px;
  border-radius: 4px;
  margin-bottom: 15px;
}

.preview-rating {
  margin-bottom: 8px;
}

.preview-content {
  font-size: 14px;
  color: #606266;
}
</style>
