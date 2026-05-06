<template>
  <view class="index-page">
    <!-- 头部商家信息 -->
    <view class="header">
      <image class="logo" :src="shopInfo.logo || '/static/logo.png'" mode="aspectFill" />
      <view class="shop-info">
        <text class="shop-name">{{ shopInfo.name }}</text>
        <text class="shop-desc">{{ shopInfo.description }}</text>
      </view>
    </view>

    <!-- 轮播图 -->
    <swiper class="banner" indicator-dots autoplay circular>
      <swiper-item v-for="(img, index) in shopInfo.images" :key="index">
        <image :src="img" mode="aspectFill" />
      </swiper-item>
    </swiper>

    <!-- 快捷入口 -->
    <view class="quick-entry">
      <view class="entry-item" @click="navigateTo('/pages/appointment/appointment')">
        <view class="icon">📅</view>
        <text>在线预约</text>
      </view>
      <view class="entry-item" @click="navigateTo('/pages/member-card/member-card')">
        <view class="icon">💳</view>
        <text>会员卡</text>
      </view>
      <view class="entry-item" @click="navigateTo('/pages/recharge/recharge')">
        <view class="icon">💰</view>
        <text>充值</text>
      </view>
      <view class="entry-item" @click="navigateTo('/pages/consumption/consumption')">
        <view class="icon">📋</view>
        <text>消费记录</text>
      </view>
    </view>

    <!-- 优惠活动 -->
    <view class="section">
      <view class="section-header">
        <text class="title">最新优惠</text>
        <text class="more" @click="viewMorePromotions">更多 ></text>
      </view>
      <view class="promotion-list">
        <view class="promotion-item card" v-for="item in promotions" :key="item.id" @click="viewPromotion(item)">
          <view class="promotion-tag" :class="'type-' + item.type">
            {{ item.type === 'coupon' ? '优惠券' : '服务' }}
          </view>
          <text class="promotion-name">{{ item.name }}</text>
          <text class="promotion-value">
            {{ item.type === 'coupon' ? '满' + item.minAmount + '减' + item.discount : '¥' + item.price }}
          </text>
        </view>
      </view>
    </view>

    <!-- 团队展示 -->
    <view class="section">
      <view class="section-header">
        <text class="title">专业团队</text>
      </view>
      <scroll-view class="team-scroll" scroll-x>
        <view class="team-item" v-for="employee in team" :key="employee.id">
          <image class="avatar" :src="employee.avatar || '/static/avatar.png'" mode="aspectFill" />
          <text class="name">{{ employee.name }}</text>
          <text class="position">{{ employee.position }}</text>
        </view>
      </scroll-view>
    </view>

    <!-- 店铺信息 -->
    <view class="shop-detail card">
      <view class="info-item">
        <text class="label">营业时间</text>
        <text class="value">{{ shopInfo.businessHours }}</text>
      </view>
      <view class="info-item">
        <text class="label">联系电话</text>
        <text class="value text-primary" @click="callPhone">{{ shopInfo.phone }}</text>
      </view>
      <view class="info-item">
        <text class="label">店铺地址</text>
        <text class="value">{{ shopInfo.address }}</text>
      </view>
    </view>
  </view>
</template>

<script>
import { ref, onMounted } from 'vue'

export default {
  setup() {
    const shopInfo = ref({
      name: '美业SaaS示范店',
      logo: '/static/logo.png',
      description: '专业美容美发服务',
      businessHours: '09:00-21:00',
      phone: '400-123-4567',
      address: '示范路123号',
      images: []
    })
    
    const promotions = ref([])
    const team = ref([])

    const loadShopInfo = async () => {
      try {
        const res = await uni.request({
          url: 'http://localhost:3001/api/miniapp/shop/info'
        })
        if (res.data) {
          shopInfo.value = { ...shopInfo.value, ...res.data }
        }
      } catch (e) {
        console.error('加载店铺信息失败', e)
      }
    }

    const loadPromotions = async () => {
      try {
        const res = await uni.request({
          url: 'http://localhost:3001/api/miniapp/promotions'
        })
        promotions.value = res.data || []
      } catch (e) {
        console.error('加载优惠活动失败', e)
      }
    }

    const loadTeam = async () => {
      try {
        const res = await uni.request({
          url: 'http://localhost:3001/api/miniapp/team'
        })
        team.value = res.data || []
      } catch (e) {
        console.error('加载团队失败', e)
      }
    }

    const navigateTo = (url) => {
      uni.navigateTo({ url })
    }

    const viewMorePromotions = () => {
      uni.showToast({ title: '更多优惠活动', icon: 'none' })
    }

    const viewPromotion = (item) => {
      uni.showToast({ title: item.name, icon: 'none' })
    }

    const callPhone = () => {
      uni.makePhoneCall({
        phoneNumber: shopInfo.value.phone
      })
    }

    onMounted(() => {
      loadShopInfo()
      loadPromotions()
      loadTeam()
    })

    return {
      shopInfo,
      promotions,
      team,
      navigateTo,
      viewMorePromotions,
      viewPromotion,
      callPhone
    }
  }
}
</script>

<style scoped>
.index-page {
  min-height: 100vh;
  background-color: #f8f8f8;
}

.header {
  display: flex;
  align-items: center;
  padding: 30rpx;
  background: linear-gradient(135deg, #409EFF, #66b1ff);
  color: #ffffff;
}

.logo {
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
  margin-right: 20rpx;
}

.shop-info {
  flex: 1;
}

.shop-name {
  font-size: 36rpx;
  font-weight: bold;
  display: block;
}

.shop-desc {
  font-size: 24rpx;
  opacity: 0.8;
  margin-top: 10rpx;
  display: block;
}

.banner {
  height: 300rpx;
}

.banner image {
  width: 100%;
  height: 100%;
}

.quick-entry {
  display: flex;
  background-color: #ffffff;
  padding: 30rpx 0;
  margin-bottom: 20rpx;
}

.entry-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.entry-item .icon {
  font-size: 48rpx;
  margin-bottom: 10rpx;
}

.entry-item text {
  font-size: 24rpx;
  color: #333333;
}

.section {
  background-color: #ffffff;
  padding: 20rpx 30rpx;
  margin-bottom: 20rpx;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.section-header .title {
  font-size: 32rpx;
  font-weight: bold;
}

.section-header .more {
  font-size: 24rpx;
  color: #999999;
}

.promotion-list {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
}

.promotion-item {
  width: calc(50% - 10rpx);
  padding: 20rpx;
  position: relative;
}

.promotion-tag {
  position: absolute;
  top: 0;
  right: 0;
  padding: 4rpx 12rpx;
  font-size: 20rpx;
  border-radius: 0 16rpx 0 16rpx;
}

.promotion-tag.type-coupon {
  background-color: #f56c6c;
  color: #ffffff;
}

.promotion-tag.type-service {
  background-color: #67c23a;
  color: #ffffff;
}

.promotion-name {
  display: block;
  font-size: 28rpx;
  font-weight: bold;
  margin-bottom: 10rpx;
}

.promotion-value {
  display: block;
  font-size: 32rpx;
  color: #f56c6c;
  font-weight: bold;
}

.team-scroll {
  white-space: nowrap;
}

.team-item {
  display: inline-block;
  width: 160rpx;
  text-align: center;
  margin-right: 20rpx;
}

.team-item .avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  margin-bottom: 10rpx;
}

.team-item .name {
  display: block;
  font-size: 28rpx;
  font-weight: bold;
}

.team-item .position {
  display: block;
  font-size: 24rpx;
  color: #999999;
}

.shop-detail {
  margin: 20rpx;
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.info-item:last-child {
  border-bottom: none;
}

.info-item .label {
  color: #999999;
}

.info-item .value {
  color: #333333;
}
</style>
