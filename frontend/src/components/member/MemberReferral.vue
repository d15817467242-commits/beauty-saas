<template>
  <div class="member-referral">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>推荐关系</span>
          <el-button type="primary" size="small" @click="showReferralDialog">邀请会员</el-button>
        </div>
      </template>

      <!-- 推荐统计 -->
      <el-row :gutter="20" class="stats-row">
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-value">{{ stats.totalReferrals || 0 }}</div>
            <div class="stat-label">直接推荐</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-value">{{ stats.indirectReferrals || 0 }}</div>
            <div class="stat-label">间接推荐</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-value">¥{{ stats.totalReward || 0 }}</div>
            <div class="stat-label">累计奖励</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-value">¥{{ stats.pendingReward || 0 }}</div>
            <div class="stat-label">待发放奖励</div>
          </div>
        </el-col>
      </el-row>

      <!-- 推荐人信息 -->
      <div v-if="referrer" class="referrer-section">
        <el-divider content-position="left">推荐人</el-divider>
        <div class="referrer-info">
          <el-avatar :size="48">{{ referrer.name?.charAt(0) }}</el-avatar>
          <div class="referrer-detail">
            <div class="referrer-name">{{ referrer.name }}</div>
            <div class="referrer-phone">{{ referrer.phone }}</div>
          </div>
          <el-button size="small" @click="viewMember(referrer.id)">查看详情</el-button>
        </div>
      </div>

      <!-- 推荐关系树 -->
      <div class="tree-section">
        <el-divider content-position="left">推荐关系树</el-divider>
        <div class="tree-container" ref="treeContainer">
          <div class="tree-node root" v-if="memberInfo">
            <div class="node-content">
              <el-avatar :size="40">{{ memberInfo.name?.charAt(0) }}</el-avatar>
              <div class="node-info">
                <div class="node-name">{{ memberInfo.name }}</div>
                <div class="node-phone">{{ memberInfo.phone }}</div>
              </div>
            </div>
          </div>
          
          <div class="tree-children" v-if="referrals.length">
            <div class="tree-line"></div>
            <div class="children-list">
              <div v-for="(child, idx) in referrals" :key="child.id" class="tree-node child">
                <div class="node-connector"></div>
                <div class="node-content" @click="viewMember(child.id)">
                  <el-avatar :size="36">{{ child.name?.charAt(0) }}</el-avatar>
                  <div class="node-info">
                    <div class="node-name">{{ child.name }}</div>
                    <div class="node-meta">
                      <span>{{ child.phone }}</span>
                      <el-tag size="small" type="success">+¥{{ child.rewardAmount || 0 }}</el-tag>
                    </div>
                  </div>
                </div>
                
                <!-- 二级推荐 -->
                <div v-if="child.children?.length" class="tree-grandchildren">
                  <div class="tree-line sub"></div>
                  <div v-for="grandchild in child.children" :key="grandchild.id" class="tree-node grandchild">
                    <div class="node-connector sub"></div>
                    <div class="node-content small" @click="viewMember(grandchild.id)">
                      <el-avatar :size="28">{{ grandchild.name?.charAt(0) }}</el-avatar>
                      <div class="node-info">
                        <div class="node-name">{{ grandchild.name }}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <el-empty v-else description="暂无推荐会员" :image-size="80" />
        </div>
      </div>
    </el-card>

    <!-- 推荐奖励记录 -->
    <el-card style="margin-top: 20px;">
      <template #header>
        <span>推荐奖励记录</span>
      </template>
      <el-table :data="rewards" v-loading="rewardsLoading" stripe>
        <el-table-column prop="createdAt" label="时间" width="160">
          <template #default="{ row }">
            {{ new Date(row.createdAt).toLocaleString() }}
          </template>
        </el-table-column>
        <el-table-column prop="referredMemberName" label="被推荐人" />
        <el-table-column prop="level" label="推荐层级" width="100">
          <template #default="{ row }">
            <el-tag size="small">{{ row.level === 1 ? '一级' : '二级' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="amount" label="奖励金额" width="120">
          <template #default="{ row }">
            <span style="color: #67C23A;">+¥{{ row.amount }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'paid' ? 'success' : 'warning'" size="small">
              {{ row.status === 'paid' ? '已发放' : '待发放' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" />
      </el-table>
    </el-card>

    <!-- 邀请会员对话框 -->
    <el-dialog v-model="referralDialogVisible" title="邀请会员" width="500px">
      <el-form :model="referralForm" label-width="100px" :rules="referralRules" ref="referralFormRef">
        <el-form-item label="邀请人">
          <span>{{ memberInfo?.name }} ({{ memberInfo?.phone }})</span>
        </el-form-item>
        <el-form-item label="新会员姓名" prop="name">
          <el-input v-model="referralForm.name" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="新会员手机" prop="phone">
          <el-input v-model="referralForm.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="奖励金额">
          <el-input-number v-model="referralForm.rewardAmount" :min="0" :precision="2" />
          <span style="margin-left: 8px; color: #999;">推荐成功后发放</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="referralDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="referralSubmitting" @click="submitReferral">确认邀请</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'

const props = defineProps<{
  memberId: string
}>()

const emit = defineEmits<{
  (e: 'viewMember', id: string): void
}>()

const API_BASE = 'http://localhost:3000/api'
const token = localStorage.getItem('token') || ''

const memberInfo = ref<any>(null)
const referrer = ref<any>(null)
const referrals = ref<any[]>([])
const rewards = ref<any[]>([])
const stats = ref({
  totalReferrals: 0,
  indirectReferrals: 0,
  totalReward: 0,
  pendingReward: 0
})

const rewardsLoading = ref(false)
const referralDialogVisible = ref(false)
const referralSubmitting = ref(false)
const referralFormRef = ref<FormInstance>()

const referralForm = ref({
  name: '',
  phone: '',
  rewardAmount: 10
})

const referralRules: FormRules = {
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ]
}

const loadReferralData = async () => {
  if (!props.memberId) return
  
  try {
    const res = await fetch(`${API_BASE}/members/${props.memberId}/referrals`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const data = await res.json()
    memberInfo.value = data.member
    referrer.value = data.referrer
    referrals.value = data.referrals || []
    stats.value = data.stats || stats.value
  } catch (e) {
    console.error('加载推荐关系失败')
  }
}

const loadRewards = async () => {
  if (!props.memberId) return
  
  rewardsLoading.value = true
  try {
    const res = await fetch(`${API_BASE}/members/${props.memberId}/referral-rewards`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    rewards.value = await res.json()
  } catch (e) {
    console.error('加载奖励记录失败')
  } finally {
    rewardsLoading.value = false
  }
}

const showReferralDialog = () => {
  referralForm.value = {
    name: '',
    phone: '',
    rewardAmount: 10
  }
  referralDialogVisible.value = true
}

const submitReferral = async () => {
  if (!referralFormRef.value) return
  await referralFormRef.value.validate(async (valid) => {
    if (!valid) return
    
    referralSubmitting.value = true
    try {
      const res = await fetch(`${API_BASE}/members/${props.memberId}/referrals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(referralForm.value)
      })
      if (res.ok) {
        ElMessage.success('邀请成功')
        referralDialogVisible.value = false
        loadReferralData()
        loadRewards()
      } else {
        const err = await res.json()
        ElMessage.error(err.message || '邀请失败')
      }
    } catch (e) {
      ElMessage.error('网络错误')
    } finally {
      referralSubmitting.value = false
    }
  })
}

const viewMember = (id: string) => {
  emit('viewMember', id)
}

watch(() => props.memberId, () => {
  loadReferralData()
  loadRewards()
})

onMounted(() => {
  loadReferralData()
  loadRewards()
})
</script>

<style scoped>
.member-referral {
  padding: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  text-align: center;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  color: white;
}

.stat-card .stat-value {
  font-size: 28px;
  font-weight: bold;
}

.stat-card .stat-label {
  font-size: 14px;
  opacity: 0.9;
  margin-top: 4px;
}

.referrer-section {
  margin-bottom: 20px;
}

.referrer-info {
  display: flex;
  align-items: center;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
}

.referrer-detail {
  flex: 1;
  margin-left: 12px;
}

.referrer-name {
  font-weight: bold;
  font-size: 16px;
}

.referrer-phone {
  color: #909399;
  font-size: 14px;
  margin-top: 4px;
}

.tree-section {
  margin-top: 20px;
}

.tree-container {
  min-height: 200px;
  padding: 20px;
  background: #fafafa;
  border-radius: 8px;
}

.tree-node {
  display: inline-block;
}

.tree-node.root {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

.node-content {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.2s;
}

.node-content:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.node-content.small {
  padding: 8px 12px;
}

.node-info {
  margin-left: 12px;
}

.node-name {
  font-weight: 500;
}

.node-phone {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}

.node-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
  font-size: 12px;
  color: #909399;
}

.tree-children {
  position: relative;
  padding-top: 30px;
}

.tree-line {
  position: absolute;
  top: 0;
  left: 50%;
  width: 2px;
  height: 30px;
  background: #dcdfe6;
}

.tree-line.sub {
  left: 20px;
  height: 20px;
}

.children-list {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  justify-content: center;
}

.tree-node.child {
  position: relative;
  padding-top: 20px;
}

.node-connector {
  position: absolute;
  top: 0;
  left: 50%;
  width: 2px;
  height: 20px;
  background: #dcdfe6;
}

.node-connector.sub {
  height: 16px;
}

.tree-grandchildren {
  position: relative;
  margin-top: 16px;
  padding-left: 40px;
}

.tree-node.grandchild {
  margin-bottom: 8px;
}
</style>
