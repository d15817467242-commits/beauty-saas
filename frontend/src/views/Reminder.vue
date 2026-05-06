<template>
  <div class="reminder-page">
    <!-- 概览卡片 -->
    <el-row :gutter="20" style="margin-bottom: 20px">
      <el-col :span="4">
        <el-card shadow="hover" class="overview-card birthday">
          <div class="overview-content">
            <el-icon class="overview-icon"><Present /></el-icon>
            <div class="overview-info">
              <div class="overview-value">{{ overview.birthday?.count || 0 }}</div>
              <div class="overview-label">生日提醒</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="hover" class="overview-card inactive">
          <div class="overview-content">
            <el-icon class="overview-icon"><User /></el-icon>
            <div class="overview-info">
              <div class="overview-value">{{ overview.inactive?.count || 0 }}</div>
              <div class="overview-label">久未到店</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="hover" class="overview-card upgrade">
          <div class="overview-content">
            <el-icon class="overview-icon"><Medal /></el-icon>
            <div class="overview-info">
              <div class="overview-value">{{ overview.cardUpgrade?.count || 0 }}</div>
              <div class="overview-label">卡升级</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="hover" class="overview-card followup">
          <div class="overview-content">
            <el-icon class="overview-icon"><ChatDotRound /></el-icon>
            <div class="overview-info">
              <div class="overview-value">{{ overview.visitFollowUp?.count || 0 }}</div>
              <div class="overview-label">消费回访</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="hover" class="overview-card points">
          <div class="overview-content">
            <el-icon class="overview-icon"><Star /></el-icon>
            <div class="overview-info">
              <div class="overview-value">{{ overview.pointsExpiry?.count || 0 }}</div>
              <div class="overview-label">积分到期</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="hover" class="overview-card total">
          <div class="overview-content">
            <el-icon class="overview-icon"><Bell /></el-icon>
            <div class="overview-info">
              <div class="overview-value">{{ overview.total || 0 }}</div>
              <div class="overview-label">总提醒数</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 提醒列表 -->
    <el-row :gutter="20">
      <!-- 生日提醒 -->
      <el-col :span="6">
        <el-card>
          <template #header>
            <div class="card-header">
              <span><el-icon><Cake /></el-icon> 生日提醒</span>
              <el-tag type="warning">{{ birthdayList.length }}人</el-tag>
            </div>
          </template>
          <el-table :data="birthdayList" size="small" v-loading="loading" max-height="300">
            <el-table-column prop="memberName" label="会员" width="70" />
            <el-table-column prop="memberPhone" label="电话" width="90" />
            <el-table-column label="生日" width="70">
              <template #default="{ row }">
                {{ row.daysUntilBirthday === 0 ? '今天' : `${row.daysUntilBirthday}天后` }}
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <!-- 久未到店提醒 -->
      <el-col :span="6">
        <el-card>
          <template #header>
            <div class="card-header">
              <span><el-icon><User /></el-icon> 久未到店</span>
              <el-tag type="danger">{{ inactiveList.length }}人</el-tag>
            </div>
          </template>
          <el-table :data="inactiveList" size="small" v-loading="loading" max-height="300">
            <el-table-column prop="memberName" label="会员" width="70" />
            <el-table-column prop="memberPhone" label="电话" width="90" />
            <el-table-column label="未到店" width="70">
              <template #default="{ row }">
                {{ row.daysSinceLastVisit === 999 ? '从未' : `${row.daysSinceLastVisit}天` }}
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <!-- 卡升级提醒 -->
      <el-col :span="6">
        <el-card>
          <template #header>
            <div class="card-header">
              <span><el-icon><Medal /></el-icon> 卡升级提醒</span>
              <el-tag type="success">{{ cardUpgradeList.length }}人</el-tag>
            </div>
          </template>
          <el-table :data="cardUpgradeList" size="small" v-loading="loading" max-height="300">
            <el-table-column prop="memberName" label="会员" width="70" />
            <el-table-column label="当前等级" width="70">
              <template #default="{ row }">
                <el-tag size="small">{{ getLevelText(row.currentLevel) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="进度" width="80">
              <template #default="{ row }">
                <el-progress :percentage="row.progress" :stroke-width="6" />
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <!-- 消费回访提醒 -->
      <el-col :span="6">
        <el-card>
          <template #header>
            <div class="card-header">
              <span><el-icon><ChatDotRound /></el-icon> 消费回访</span>
              <el-tag type="info">{{ visitFollowUpList.length }}人</el-tag>
            </div>
          </template>
          <el-table :data="visitFollowUpList" size="small" v-loading="loading" max-height="300">
            <el-table-column prop="memberName" label="会员" width="70" />
            <el-table-column prop="lastService" label="服务" show-overflow-tooltip />
            <el-table-column label="天数" width="60">
              <template #default="{ row }">{{ row.daysSinceLastVisit }}天前</template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <!-- 第二行提醒 -->
    <el-row :gutter="20" style="margin-top: 20px">
      <!-- 积分到期提醒 -->
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span><el-icon><Star /></el-icon> 积分到期提醒（30天内）</span>
              <el-tag type="warning">{{ pointsExpiryList.length }}人</el-tag>
            </div>
          </template>
          <el-table :data="pointsExpiryList" size="small" v-loading="loading" max-height="250">
            <el-table-column prop="memberName" label="会员" width="100" />
            <el-table-column prop="memberPhone" label="电话" width="120" />
            <el-table-column prop="currentPoints" label="当前积分" width="100" />
            <el-table-column prop="expiringPoints" label="即将过期" width="100">
              <template #default="{ row }">
                <span style="color: #f56c6c;">{{ row.expiringPoints }}</span>
              </template>
            </el-table-column>
            <el-table-column label="过期时间" width="100">
              <template #default="{ row }">
                {{ row.daysUntilExpiry }}天后
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <!-- 次卡到期提醒 -->
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span><el-icon><Ticket /></el-icon> 次卡到期提醒（30天内）</span>
              <el-tag type="danger">{{ countCardExpiryList.length }}张</el-tag>
            </div>
          </template>
          <el-table :data="countCardExpiryList" size="small" v-loading="loading" max-height="250">
            <el-table-column prop="memberName" label="会员" width="100" />
            <el-table-column prop="memberPhone" label="电话" width="120" />
            <el-table-column prop="countCardName" label="次卡" width="120" />
            <el-table-column prop="remainingCount" label="剩余次数" width="80" />
            <el-table-column label="过期时间" width="100">
              <template #default="{ row }">
                {{ row.daysUntilExpiry }}天后
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { User, Clock, Bell, Phone, Present, Medal, ChatDotRound, Star, Ticket } from '@element-plus/icons-vue'

const API_BASE = 'http://localhost:3000/api'
const token = localStorage.getItem('token') || ''

const loading = ref(false)
const overview = ref<any>({})
const birthdayList = ref<any[]>([])
const inactiveList = ref<any[]>([])
const cardUpgradeList = ref<any[]>([])
const visitFollowUpList = ref<any[]>([])
const pointsExpiryList = ref<any[]>([])
const countCardExpiryList = ref<any[]>([])

const getLevelText = (level: string) => {
  const map: Record<string, string> = {
    normal: '普通',
    silver: '银卡',
    gold: '金卡',
    diamond: '钻石',
  }
  return map[level] || level
}

const loadOverview = async () => {
  loading.value = true
  try {
    const res = await fetch(`${API_BASE}/reminders/overview`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    overview.value = await res.json()
    birthdayList.value = overview.value.birthday?.items || []
    inactiveList.value = overview.value.inactive?.items || []
    cardUpgradeList.value = overview.value.cardUpgrade?.items || []
    visitFollowUpList.value = overview.value.visitFollowUp?.items || []
    pointsExpiryList.value = overview.value.pointsExpiry?.items || []
    countCardExpiryList.value = overview.value.countCardExpiry?.items || []
  } catch (e) {
    ElMessage.error('加载提醒数据失败')
  } finally {
    loading.value = false
  }
}

const callMember = (phone: string) => {
  if (phone) {
    window.location.href = `tel:${phone}`
  }
}

onMounted(loadOverview)
</script>

<style scoped>
.reminder-page {
  padding: 20px;
}

.overview-card {
  cursor: pointer;
  transition: all 0.3s;
}

.overview-card:hover {
  transform: translateY(-5px);
}

.overview-card.birthday {
  border-left: 4px solid #e6a23c;
}

.overview-card.inactive {
  border-left: 4px solid #f56c6c;
}

.overview-card.upgrade {
  border-left: 4px solid #67c23a;
}

.overview-card.followup {
  border-left: 4px solid #909399;
}

.overview-card.points {
  border-left: 4px solid #ff9900;
}

.overview-card.total {
  border-left: 4px solid #409eff;
}

.overview-content {
  display: flex;
  align-items: center;
  gap: 15px;
}

.overview-icon {
  font-size: 32px;
  color: #409eff;
}

.overview-info {
  flex: 1;
}

.overview-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}

.overview-label {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header span {
  display: flex;
  align-items: center;
  gap: 5px;
}
</style>
