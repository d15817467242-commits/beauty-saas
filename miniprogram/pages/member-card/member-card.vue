<template>
  <view class="member-card-page">
    <!-- 会员卡 -->
    <view class="member-card" :class="'level-' + memberInfo.level">
      <view class="card-header">
        <text class="shop-name">{{ shopName }}</text>
        <text class="level-name">{{ levelName }}</text>
      </view>
      <view class="card-body">
        <view class="balance-item">
          <text class="label">储值余额</text>
          <text class="value">¥{{ balanceInfo.balance || 0 }}</text>
        </view>
        <view class="balance-item">
          <text class="label">积分</text>
          <text class="value">{{ balanceInfo.points || 0 }}</text>
        </view>
      </view>
      <view class="card-footer">
        <text class="member-name">{{ memberInfo.name }}</text>
        <text class="member-phone">{{ memberInfo.phone }}</text>
      </view>
    </view>

    <!-- 次卡列表 -->
    <view class="section">
      <view class="section-header">
        <text class="title">我的次卡</text>
      </view>
      <view class="count-card-list" v-if="balanceInfo.countCards && balanceInfo.countCards.length > 0">
        <view class="count-card-item card" v-for="card in balanceInfo.countCards" :key="card.id">
          <view class="card-info">
            <text class="card-name">{{ card.packageName }}</text>
            <text class="card-expire" v-if="card.expireAt">有效期至 {{ formatDate(card.expireAt) }}</text>
          </view>
          <view class="card-count">
            <text class="remaining">{{ card.remainingCount }}</text>
            <text class="total">/{{ card.totalCount }}次</text>
          </view>
        </view>
      </view>
      <view class="empty" v-else>
        <text>暂无次卡</text>
      </view>
    </view>

    <!-- 快捷操作 -->
    <view class="quick-actions">
      <view class="action-item" @click="navigateTo('/pages/recharge/recharge')">
        <text class="icon">💰</text>
        <text class="name">充值</text>
      </view>
      <view class="action-item" @click="navigateTo('/pages/consumption/consumption')">
        <text class="icon">📋</text>
        <text class="name">消费记录</text>
      </view>
      <view class="action-item" @click="buyCountCard">
        <text class="icon">💳</text>
        <text class="name">购买次卡</text>
      </view>
    </view>
  </view>
</template>

<script>
import { ref, computed, onMounted } from 'vue'

export default {
  setup() {
    const shopName = ref('美业SaaS')
    const memberInfo = ref({
      name: '',
      phone: '',
      level: 'normal'
    })
    const balanceInfo = ref({
      balance: 0,
      points: 0,
      countCards: []
    })

    const levelName = computed(() => {
      const levels = {
        normal: '普通会员',
        silver: '银卡会员',
        gold: '金卡会员',
        diamond: '钻石会员'
      }
      return levels[memberInfo.value.level] || '普通会员'
    })

    const loadMemberInfo = async () => {
      const memberId = uni.getStorageSync('memberId')
      if (!memberId) return

      try {
        const res = await uni.request({
          url: `http://localhost:3001/api/miniapp/member/info?memberId=${memberId}`
        })
        if (res.data) {
          memberInfo.value = res.data.member || memberInfo.value
        }
      } catch (e) {
        console.error('加载会员信息失败', e)
      }
    }

    const loadBalanceInfo = async () => {
      const memberId = uni.getStorageSync('memberId')
      if (!memberId) return

      try {
        const res = await uni.request({
          url: `http://localhost:3001/api/miniapp/member/balance?memberId=${memberId}`
        })
        if (res.data) {
          balanceInfo.value = res.data
        }
      } catch (e) {
        console.error('加载余额信息失败', e)
      }
    }

    const formatDate = (date) => {
      return new Date(date).toLocaleDateString('zh-CN')
    }

    const navigateTo = (url) => {
      uni.navigateTo({ url })
    }

    const buyCountCard = () => {
      uni.showToast({ title: '购买次卡功能开发中', icon: 'none' })
    }

    onMounted(() => {
      loadMemberInfo()
      loadBalanceInfo()
    })

    return {
      shopName,
      memberInfo,
      balanceInfo,
      levelName,
      formatDate,
      navigateTo,
      buyCountCard
    }
  }
}
</script>

<style scoped>
.member-card-page {
  min-height: 100vh;
  background-color: #f8f8f8;
  padding: 20rpx;
}

.member-card {
  background: linear-gradient(135deg, #409EFF, #66b1ff);
  border-radius: 20rpx;
  padding: 30rpx;
  color: #ffffff;
  margin-bottom: 30rpx;
}

.member-card.level-silver {
  background: linear-gradient(135deg, #909399, #c0c4cc);
}

.member-card.level-gold {
  background: linear-gradient(135deg, #e6a23c, #f5d442);
}

.member-card.level-diamond {
  background: linear-gradient(135deg, #303133, #606266);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30rpx;
}

.shop-name {
  font-size: 28rpx;
  opacity: 0.8;
}

.level-name {
  font-size: 24rpx;
  padding: 4rpx 16rpx;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 20rpx;
}

.card-body {
  display: flex;
  justify-content: space-around;
  padding: 30rpx 0;
  border-top: 1rpx solid rgba(255, 255, 255, 0.2);
  border-bottom: 1rpx solid rgba(255, 255, 255, 0.2);
}

.balance-item {
  text-align: center;
}

.balance-item .label {
  display: block;
  font-size: 24rpx;
  opacity: 0.8;
  margin-bottom: 10rpx;
}

.balance-item .value {
  display: block;
  font-size: 40rpx;
  font-weight: bold;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  margin-top: 20rpx;
  font-size: 24rpx;
  opacity: 0.8;
}

.section {
  background-color: #ffffff;
  border-radius: 16rpx;
  padding: 20rpx;
  margin-bottom: 20rpx;
}

.section-header {
  margin-bottom: 20rpx;
}

.section-header .title {
  font-size: 32rpx;
  font-weight: bold;
}

.count-card-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx;
  margin-bottom: 10rpx;
}

.card-info .card-name {
  display: block;
  font-size: 28rpx;
  font-weight: bold;
  margin-bottom: 8rpx;
}

.card-info .card-expire {
  display: block;
  font-size: 24rpx;
  color: #999999;
}

.card-count .remaining {
  font-size: 40rpx;
  font-weight: bold;
  color: #409EFF;
}

.card-count .total {
  font-size: 24rpx;
  color: #999999;
}

.empty {
  text-align: center;
  padding: 40rpx;
  color: #999999;
}

.quick-actions {
  display: flex;
  background-color: #ffffff;
  border-radius: 16rpx;
  padding: 20rpx 0;
}

.action-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.action-item .icon {
  font-size: 48rpx;
  margin-bottom: 10rpx;
}

.action-item .name {
  font-size: 24rpx;
  color: #333333;
}
</style>
