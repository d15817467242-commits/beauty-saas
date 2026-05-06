<template>
  <view class="recharge-page">
    <view class="balance-card">
      <text class="label">当前余额</text>
      <text class="value">¥{{ balance }}</text>
    </view>

    <view class="section">
      <view class="section-header">
        <text class="title">选择充值金额</text>
      </view>
      <view class="amount-list">
        <view 
          class="amount-item" 
          :class="{ active: selectedAmount === item.amount }"
          v-for="item in rechargeOptions" 
          :key="item.amount"
          @click="selectAmount(item)"
        >
          <text class="amount">¥{{ item.amount }}</text>
          <text class="bonus" v-if="item.bonus">送¥{{ item.bonus }}</text>
        </view>
      </view>
    </view>

    <view class="section">
      <view class="section-header">
        <text class="title">自定义金额</text>
      </view>
      <input 
        type="number" 
        v-model="customAmount" 
        placeholder="请输入充值金额" 
        class="amount-input"
        @input="onCustomAmountInput"
      />
    </view>

    <view class="payment-method">
      <view class="method-item" :class="{ active: paymentMethod === 'wechat' }" @click="paymentMethod = 'wechat'">
        <text class="icon">💚</text>
        <text class="name">微信支付</text>
      </view>
    </view>

    <view class="submit-btn" @click="submitRecharge">
      <text>立即充值 ¥{{ finalAmount }}</text>
    </view>

    <!-- 充值记录 -->
    <view class="section" style="margin-top: 20rpx">
      <view class="section-header">
        <text class="title">充值记录</text>
      </view>
      <view class="record-list" v-if="records.length > 0">
        <view class="record-item" v-for="record in records" :key="record.id">
          <view class="record-info">
            <text class="amount">+¥{{ record.amount }}</text>
            <text class="time">{{ formatTime(record.createdAt) }}</text>
          </view>
          <text class="status">{{ record.status === 'completed' ? '已完成' : '处理中' }}</text>
        </view>
      </view>
      <view class="empty" v-else>
        <text>暂无充值记录</text>
      </view>
    </view>
  </view>
</template>

<script>
import { ref, computed, onMounted } from 'vue'

export default {
  setup() {
    const balance = ref(0)
    const selectedAmount = ref(0)
    const customAmount = ref('')
    const paymentMethod = ref('wechat')
    const records = ref([])

    const rechargeOptions = [
      { amount: 100, bonus: 0 },
      { amount: 200, bonus: 20 },
      { amount: 500, bonus: 80 },
      { amount: 1000, bonus: 200 },
      { amount: 2000, bonus: 500 },
      { amount: 5000, bonus: 1500 },
    ]

    const finalAmount = computed(() => {
      return customAmount.value || selectedAmount.value || 0
    })

    const loadBalance = async () => {
      const memberId = uni.getStorageSync('memberId')
      if (!memberId) return

      try {
        const res = await uni.request({
          url: `http://localhost:3001/api/miniapp/member/balance?memberId=${memberId}`
        })
        if (res.data) {
          balance.value = res.data.balance || 0
        }
      } catch (e) {
        console.error('加载余额失败', e)
      }
    }

    const loadRecords = async () => {
      const memberId = uni.getStorageSync('memberId')
      if (!memberId) return

      try {
        const res = await uni.request({
          url: `http://localhost:3001/api/miniapp/member/info?memberId=${memberId}`
        })
        if (res.data) {
          records.value = res.data.recentCredits || []
        }
      } catch (e) {
        console.error('加载记录失败', e)
      }
    }

    const selectAmount = (item) => {
      selectedAmount.value = item.amount
      customAmount.value = ''
    }

    const onCustomAmountInput = () => {
      selectedAmount.value = 0
    }

    const formatTime = (time) => {
      return new Date(time).toLocaleString('zh-CN')
    }

    const submitRecharge = async () => {
      if (!finalAmount.value || finalAmount.value <= 0) {
        uni.showToast({ title: '请选择或输入充值金额', icon: 'none' })
        return
      }

      const memberId = uni.getStorageSync('memberId')
      if (!memberId) {
        uni.showToast({ title: '请先登录', icon: 'none' })
        return
      }

      try {
        // 实际项目中应该调用微信支付
        await uni.request({
          url: 'http://localhost:3001/api/miniapp/recharge',
          method: 'POST',
          data: {
            memberId,
            amount: Number(finalAmount.value),
            paymentMethod: paymentMethod.value
          }
        })

        uni.showToast({ title: '充值成功', icon: 'success' })
        loadBalance()
        loadRecords()
      } catch (e) {
        uni.showToast({ title: '充值失败', icon: 'none' })
      }
    }

    onMounted(() => {
      loadBalance()
      loadRecords()
    })

    return {
      balance,
      selectedAmount,
      customAmount,
      paymentMethod,
      records,
      rechargeOptions,
      finalAmount,
      selectAmount,
      onCustomAmountInput,
      formatTime,
      submitRecharge
    }
  }
}
</script>

<style scoped>
.recharge-page {
  min-height: 100vh;
  background-color: #f8f8f8;
  padding: 20rpx;
}

.balance-card {
  background: linear-gradient(135deg, #409EFF, #66b1ff);
  border-radius: 16rpx;
  padding: 40rpx;
  color: #ffffff;
  text-align: center;
  margin-bottom: 20rpx;
}

.balance-card .label {
  display: block;
  font-size: 28rpx;
  opacity: 0.8;
  margin-bottom: 10rpx;
}

.balance-card .value {
  display: block;
  font-size: 56rpx;
  font-weight: bold;
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

.amount-list {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.amount-item {
  width: calc(33.33% - 11rpx);
  padding: 24rpx;
  text-align: center;
  background-color: #f5f5f5;
  border-radius: 12rpx;
  border: 2rpx solid transparent;
}

.amount-item.active {
  border-color: #409EFF;
  background-color: #ecf5ff;
}

.amount-item .amount {
  display: block;
  font-size: 32rpx;
  font-weight: bold;
  color: #333333;
}

.amount-item .bonus {
  display: block;
  font-size: 24rpx;
  color: #f56c6c;
  margin-top: 8rpx;
}

.amount-input {
  width: 100%;
  padding: 20rpx;
  background-color: #f5f5f5;
  border-radius: 8rpx;
  font-size: 32rpx;
}

.payment-method {
  background-color: #ffffff;
  border-radius: 16rpx;
  padding: 20rpx;
  margin-bottom: 20rpx;
}

.method-item {
  display: flex;
  align-items: center;
  padding: 20rpx;
  border-radius: 8rpx;
  border: 2rpx solid transparent;
}

.method-item.active {
  border-color: #409EFF;
  background-color: #ecf5ff;
}

.method-item .icon {
  font-size: 40rpx;
  margin-right: 20rpx;
}

.method-item .name {
  font-size: 30rpx;
}

.submit-btn {
  background-color: #409EFF;
  color: #ffffff;
  text-align: center;
  padding: 24rpx;
  border-radius: 40rpx;
  font-size: 32rpx;
}

.record-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.record-item:last-child {
  border-bottom: none;
}

.record-info .amount {
  display: block;
  font-size: 28rpx;
  font-weight: bold;
  color: #67c23a;
}

.record-info .time {
  display: block;
  font-size: 24rpx;
  color: #999999;
  margin-top: 8rpx;
}

.record-item .status {
  font-size: 24rpx;
  color: #409EFF;
}

.empty {
  text-align: center;
  padding: 40rpx;
  color: #999999;
}
</style>
