<template>
  <view class="mine-page">
    <!-- 用户信息 -->
    <view class="user-info">
      <image class="avatar" :src="memberInfo.avatar || '/static/avatar.png'" mode="aspectFill" />
      <view class="info">
        <text class="name">{{ memberInfo.name || '未登录' }}</text>
        <text class="phone">{{ memberInfo.phone || '' }}</text>
      </view>
    </view>

    <!-- 统计 -->
    <view class="stats">
      <view class="stat-item">
        <text class="value">{{ memberInfo.totalSpent || 0 }}</text>
        <text class="label">累计消费</text>
      </view>
      <view class="stat-item">
        <text class="value">{{ memberInfo.visitCount || 0 }}</text>
        <text class="label">到店次数</text>
      </view>
      <view class="stat-item">
        <text class="value">{{ memberInfo.points || 0 }}</text>
        <text class="label">积分</text>
      </view>
    </view>

    <!-- 菜单列表 -->
    <view class="menu-list">
      <view class="menu-item" @click="navigateTo('/pages/consumption/consumption')">
        <text class="icon">📋</text>
        <text class="name">消费记录</text>
        <text class="arrow">></text>
      </view>
      <view class="menu-item" @click="navigateTo('/pages/recharge/recharge')">
        <text class="icon">💰</text>
        <text class="name">充值记录</text>
        <text class="arrow">></text>
      </view>
      <view class="menu-item" @click="navigateTo('/pages/member-card/member-card')">
        <text class="icon">💳</text>
        <text class="name">我的次卡</text>
        <text class="arrow">></text>
      </view>
      <view class="menu-item" @click="navigateTo('/pages/appointment/appointment')">
        <text class="icon">📅</text>
        <text class="name">我的预约</text>
        <text class="arrow">></text>
      </view>
    </view>

    <!-- 退出登录 -->
    <view class="logout-btn" @click="logout">
      <text>退出登录</text>
    </view>
  </view>
</template>

<script>
import { ref, onMounted } from 'vue'

export default {
  setup() {
    const memberInfo = ref({})

    const loadMemberInfo = async () => {
      const memberId = uni.getStorageSync('memberId')
      if (!memberId) return

      try {
        const res = await uni.request({
          url: `http://localhost:3001/api/miniapp/member/info?memberId=${memberId}`
        })
        if (res.data) {
          memberInfo.value = res.data.member || {}
        }
      } catch (e) {
        console.error('加载会员信息失败', e)
      }
    }

    const navigateTo = (url) => {
      uni.navigateTo({ url })
    }

    const logout = () => {
      uni.showModal({
        title: '提示',
        content: '确定要退出登录吗？',
        success: (res) => {
          if (res.confirm) {
            uni.removeStorageSync('token')
            uni.removeStorageSync('memberId')
            uni.reLaunch({ url: '/pages/login/login' })
          }
        }
      })
    }

    onMounted(() => {
      loadMemberInfo()
    })

    return {
      memberInfo,
      navigateTo,
      logout
    }
  }
}
</script>

<style scoped>
.mine-page {
  min-height: 100vh;
  background-color: #f8f8f8;
}

.user-info {
  display: flex;
  align-items: center;
  padding: 40rpx 30rpx;
  background: linear-gradient(135deg, #409EFF, #66b1ff);
  color: #ffffff;
}

.avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  margin-right: 30rpx;
}

.info .name {
  display: block;
  font-size: 36rpx;
  font-weight: bold;
  margin-bottom: 10rpx;
}

.info .phone {
  display: block;
  font-size: 28rpx;
  opacity: 0.8;
}

.stats {
  display: flex;
  background-color: #ffffff;
  padding: 30rpx 0;
  margin-bottom: 20rpx;
}

.stat-item {
  flex: 1;
  text-align: center;
}

.stat-item .value {
  display: block;
  font-size: 36rpx;
  font-weight: bold;
  color: #333333;
  margin-bottom: 10rpx;
}

.stat-item .label {
  display: block;
  font-size: 24rpx;
  color: #999999;
}

.menu-list {
  background-color: #ffffff;
  padding: 0 30rpx;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 30rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-item .icon {
  font-size: 40rpx;
  margin-right: 20rpx;
}

.menu-item .name {
  flex: 1;
  font-size: 30rpx;
}

.menu-item .arrow {
  color: #cccccc;
}

.logout-btn {
  margin: 40rpx 30rpx;
  padding: 24rpx;
  text-align: center;
  background-color: #ffffff;
  border-radius: 40rpx;
  color: #f56c6c;
  font-size: 30rpx;
}
</style>
