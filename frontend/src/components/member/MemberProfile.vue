<template>
  <div class="member-profile">
    <el-row :gutter="20">
      <!-- 消费习惯 -->
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>消费习惯分析</span>
              <el-date-picker 
                v-model="chartMonth" 
                type="month" 
                placeholder="选择月份"
                size="small"
                @change="loadProfile"
              />
            </div>
          </template>
          
          <!-- 消费趋势图 -->
          <div class="chart-container" ref="trendChartRef"></div>
          
          <!-- 消费统计 -->
          <el-row :gutter="16" class="stats-row">
            <el-col :span="8">
              <div class="stat-item">
                <div class="stat-value">¥{{ profile.monthSpent || 0 }}</div>
                <div class="stat-label">本月消费</div>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="stat-item">
                <div class="stat-value">{{ profile.monthVisit || 0 }}</div>
                <div class="stat-label">本月到店</div>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="stat-item">
                <div class="stat-value">¥{{ profile.avgSpent || 0 }}</div>
                <div class="stat-label">客单价</div>
              </div>
            </el-col>
          </el-row>
        </el-card>
      </el-col>

      <!-- 偏好服务 -->
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>偏好服务 TOP 5</span>
          </template>
          
          <div class="chart-container" ref="serviceChartRef"></div>
          
          <div class="service-list">
            <div v-for="(item, idx) in profile.topServices" :key="idx" class="service-item">
              <div class="service-rank">{{ idx + 1 }}</div>
              <div class="service-info">
                <div class="service-name">{{ item.serviceName }}</div>
                <div class="service-count">消费 {{ item.count }} 次 · ¥{{ item.totalAmount }}</div>
              </div>
              <el-progress 
                :percentage="item.percentage" 
                :stroke-width="8"
                :show-text="false"
                style="width: 100px;"
              />
            </div>
            <el-empty v-if="!profile.topServices?.length" description="暂无消费记录" :image-size="60" />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <!-- 消费时段分布 -->
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>消费时段分布</span>
          </template>
          <div class="chart-container" ref="timeChartRef"></div>
        </el-card>
      </el-col>

      <!-- 消费类型分布 -->
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>消费类型分布</span>
          </template>
          <div class="chart-container" ref="typeChartRef"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 消费标签 -->
    <el-card style="margin-top: 20px;">
      <template #header>
        <div class="card-header">
          <span>消费标签</span>
          <el-button type="primary" size="small" @click="showTagSelect">添加标签</el-button>
        </div>
      </template>
      <div class="tag-list">
        <el-tag 
          v-for="tag in memberTags" 
          :key="tag.id" 
          :color="tag.color" 
          style="color: white; margin-right: 8px; margin-bottom: 8px;"
          closable
          @close="removeTag(tag)"
        >
          {{ tag.name }}
        </el-tag>
        <span v-if="!memberTags?.length" style="color: #999;">暂无标签</span>
      </div>
    </el-card>

    <!-- 标签选择对话框 -->
    <el-dialog v-model="tagSelectVisible" title="选择标签" width="500px">
      <el-input 
        v-model="tagSearchKeyword" 
        placeholder="搜索标签" 
        clearable 
        style="margin-bottom: 16px;"
      />
      <div class="tag-select-list">
        <div 
          v-for="tag in availableTags" 
          :key="tag.id" 
          class="tag-select-item"
          :class="{ selected: selectedTagIds.includes(tag.id) }"
          @click="toggleTag(tag)"
        >
          <el-tag :color="tag.color" style="color: white;">{{ tag.name }}</el-tag>
          <el-icon v-if="selectedTagIds.includes(tag.id)" class="check-icon"><Check /></el-icon>
        </div>
      </div>
      <template #footer>
        <el-button @click="tagSelectVisible = false">取消</el-button>
        <el-button type="primary" :loading="tagSubmitting" @click="saveTags">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { Check } from '@element-plus/icons-vue'
import * as echarts from 'echarts'

const props = defineProps<{
  memberId: string
}>()

const API_BASE = 'http://localhost:3000/api'
const token = localStorage.getItem('token') || ''

const chartMonth = ref(new Date())
const profile = ref<any>({
  monthSpent: 0,
  monthVisit: 0,
  avgSpent: 0,
  topServices: []
})

const memberTags = ref<any[]>([])
const allTags = ref<any[]>([])
const selectedTagIds = ref<string[]>([])
const tagSearchKeyword = ref('')
const tagSelectVisible = ref(false)
const tagSubmitting = ref(false)

const trendChartRef = ref<HTMLElement>()
const serviceChartRef = ref<HTMLElement>()
const timeChartRef = ref<HTMLElement>()
const typeChartRef = ref<HTMLElement>()

let trendChart: echarts.ECharts | null = null
let serviceChart: echarts.ECharts | null = null
let timeChart: echarts.ECharts | null = null
let typeChart: echarts.ECharts | null = null

const availableTags = computed(() => {
  if (!tagSearchKeyword.value) return allTags.value
  return allTags.value.filter(t => t.name.includes(tagSearchKeyword.value))
})

import { computed } from 'vue'

const loadProfile = async () => {
  if (!props.memberId) return
  
  try {
    const yearMonth = chartMonth.value.getFullYear() * 100 + (chartMonth.value.getMonth() + 1)
    const res = await fetch(`${API_BASE}/members/${props.memberId}/profile?yearMonth=${yearMonth}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    profile.value = await res.json()
    
    await nextTick()
    renderCharts()
  } catch (e) {
    console.error('加载画像失败')
  }
}

const loadMemberTags = async () => {
  if (!props.memberId) return
  
  try {
    const res = await fetch(`${API_BASE}/members/${props.memberId}/tags`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    memberTags.value = await res.json()
    selectedTagIds.value = memberTags.value.map(t => t.id)
  } catch (e) {
    console.error('加载标签失败')
  }
}

const loadAllTags = async () => {
  try {
    const res = await fetch(`${API_BASE}/member-tags`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    allTags.value = await res.json()
  } catch (e) {
    console.error('加载所有标签失败')
  }
}

const renderCharts = () => {
  // 消费趋势图
  if (trendChartRef.value) {
    if (!trendChart) {
      trendChart = echarts.init(trendChartRef.value)
    }
    trendChart.setOption({
      tooltip: { trigger: 'axis' },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: {
        type: 'category',
        data: profile.value.trendDates || ['1', '2', '3', '4', '5', '6', '7']
      },
      yAxis: { type: 'value' },
      series: [{
        name: '消费金额',
        type: 'line',
        smooth: true,
        data: profile.value.trendData || [120, 200, 150, 80, 70, 110, 130],
        areaStyle: { opacity: 0.3 },
        itemStyle: { color: '#409EFF' }
      }]
    })
  }

  // 偏好服务图
  if (serviceChartRef.value) {
    if (!serviceChart) {
      serviceChart = echarts.init(serviceChartRef.value)
    }
    const serviceData = (profile.value.topServices || []).map((s: any) => ({
      name: s.serviceName,
      value: s.count
    }))
    serviceChart.setOption({
      tooltip: { trigger: 'item' },
      series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
        label: { show: false },
        emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
        data: serviceData.length ? serviceData : [{ name: '暂无数据', value: 1 }]
      }]
    })
  }

  // 消费时段分布
  if (timeChartRef.value) {
    if (!timeChart) {
      timeChart = echarts.init(timeChartRef.value)
    }
    timeChart.setOption({
      tooltip: { trigger: 'axis' },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: {
        type: 'category',
        data: ['上午', '中午', '下午', '傍晚', '晚上']
      },
      yAxis: { type: 'value' },
      series: [{
        type: 'bar',
        data: profile.value.timeDistribution || [30, 50, 80, 60, 40],
        itemStyle: { color: '#67C23A' }
      }]
    })
  }

  // 消费类型分布
  if (typeChartRef.value) {
    if (!typeChart) {
      typeChart = echarts.init(typeChartRef.value)
    }
    typeChart.setOption({
      tooltip: { trigger: 'item' },
      series: [{
        type: 'pie',
        radius: '60%',
        data: profile.value.typeDistribution || [
          { name: '服务', value: 60 },
          { name: '产品', value: 30 },
          { name: '充值', value: 10 }
        ],
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }]
    })
  }
}

const showTagSelect = () => {
  loadAllTags()
  selectedTagIds.value = memberTags.value.map(t => t.id)
  tagSelectVisible.value = true
}

const toggleTag = (tag: any) => {
  const idx = selectedTagIds.value.indexOf(tag.id)
  if (idx > -1) {
    selectedTagIds.value.splice(idx, 1)
  } else {
    selectedTagIds.value.push(tag.id)
  }
}

const saveTags = async () => {
  tagSubmitting.value = true
  try {
    const res = await fetch(`${API_BASE}/members/${props.memberId}/tags`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ tagIds: selectedTagIds.value })
    })
    if (res.ok) {
      ElMessage.success('保存成功')
      tagSelectVisible.value = false
      loadMemberTags()
    } else {
      ElMessage.error('保存失败')
    }
  } catch (e) {
    ElMessage.error('网络错误')
  } finally {
    tagSubmitting.value = false
  }
}

const removeTag = async (tag: any) => {
  try {
    const res = await fetch(`${API_BASE}/members/${props.memberId}/tags/${tag.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    })
    if (res.ok) {
      loadMemberTags()
    }
  } catch (e) {
    ElMessage.error('移除失败')
  }
}

watch(() => props.memberId, () => {
  loadProfile()
  loadMemberTags()
})

onMounted(() => {
  loadProfile()
  loadMemberTags()
})
</script>

<style scoped>
.member-profile {
  padding: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-container {
  height: 200px;
}

.stats-row {
  margin-top: 16px;
}

.stat-item {
  text-align: center;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 6px;
}

.stat-value {
  font-size: 20px;
  font-weight: bold;
  color: #409EFF;
}

.stat-label {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.service-list {
  margin-top: 16px;
}

.service-item {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.service-item:last-child {
  border-bottom: none;
}

.service-rank {
  width: 24px;
  height: 24px;
  background: #409EFF;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  margin-right: 12px;
}

.service-info {
  flex: 1;
}

.service-name {
  font-weight: 500;
}

.service-count {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.tag-list {
  min-height: 40px;
}

.tag-select-list {
  max-height: 300px;
  overflow-y: auto;
}

.tag-select-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  margin-bottom: 8px;
  background: #f5f7fa;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.tag-select-item:hover {
  background: #e6e8eb;
}

.tag-select-item.selected {
  background: #ecf5ff;
  border: 1px solid #409EFF;
}

.check-icon {
  color: #409EFF;
}
</style>
