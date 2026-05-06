<template>
  <view class="consumption-page">
    <view class="summary">
      <text class="label">累计消费</text>
      <text class="value">¥{{ totalSpent }}</text>
    </view>

    <view class="filter">
      <picker :range="timeFilters" range-key="label" @change="onFilterChange">
        <view class="filter-picker">
          <text>{{ currentFilter.label }}</text>
          <text class="arrow">▼</text>
        </view>
      </picker>
    </view>

    <view class="consumption-list" v-if="consumptions.length > 0">
      <view class="consumption-item card" v-for="item in consumptions" :key="item.id">
        <view class="item-header">
          <text class="date">{{ formatDate(item.createdAt) }}</text>
          <text class="amount">-¥{{ item.actualAmount }}</text>
        </view>
        <view class="item-body">
          <view class="service-list">
            <text v-for="(service, index) in item.items" :key="index">
              {{ service.serviceName }} x{{ service.quantity || 1 }}
            </text>
          </view>
          <text class="employee" v-if="item.employee">服务人员：{{ item.employee.name }}</text>
        </view>
        <view class="item-footer">
          <text class="payment">{{ paymentMethodText(item.paymentMethod) }}</text>
        </view>
      </view>
    </view>

    <view class="empty" v-else>
      <text>暂无消费记录</text>
    </view>

    <view class="load-more" v-if="hasMore" @click="loadMore">
      <text>加载更多</text>
    </view>
  </view>
</template>

<script>
import { ref, onMounted } from 'vue'

export default {
  setup() {
    const consumptions = ref([])
    const totalSpent = ref(0)
    const hasMore = ref(true)
    const page = ref(1)

    const timeFilters = [
      { label: '全部', value: 'all' },
      { label: '本月', value: 'month' },
      { label: '近三个月', value: 'quarter' },
      { label: '今年', value: 'year' },
    ]
    const currentFilter = ref(timeFilters[0])

    const loadConsumptions = async (reset = false) => {
      const memberId = uni.getStorageSync('memberId')
      if (!memberId) return

      if (reset) {
        page.value = 1
        consumptions.value = []
      }

      try {
        const res = await uni.request({
          url: `http://localhost:3001/api/miniapp/member/consumptions?memberId=${memberId}&page=${page.value}&limit=20`
        })
        if (res.data) {
          if (reset) {
            consumptions.value = res.data.list || []
          } else {
            consumptions.value = [...consumptions.value, ...(res.data.list || [])]
          }
          hasMore.value = consumptions.value.length < res.data.total
          
          // 计算累计消费
          totalSpent.value = consumptions.value.reduce((sum, item) => sum + Number(item.actualAmount), 0)
        }
      } catch (e) {
        console.error('加载消费记录失败', e)
      }
    }

    const onFilterChange = (e) => {
      currentFilter.value = timeFilters[e.detail.value]
      loadConsumptions(true)
    }

    const loadMore = () => {
      page.value++
      loadConsumptions()
    }

    const formatDate = (date) => {
      return new Date(date).toLocaleString('zh-CN')
    }

    const paymentMethodText = (method) => {
      const methods = {
        cash: '现金',
        wechat: '微信支付',
        alipay: '支付宝',
        card: '会员卡',
        count_card: '次卡',
        mixed: '混合支付'
      }
      return methods[method] || method
    }

    onMounted(() => {
      loadConsumptions()
    })

    return {
      consumptions,
      totalSpent,
      hasMore,
      timeFilters,
      currentFilter,
      onFilterChange,
      loadMore,
      formatDate,
      paymentMethodText
    }
  }
}
</script>

<style scoped>
.consumption-page {
  min-height: 100vh;
  background-color: #f8f8f8;
  padding: 20rpx;
}

.summary {
  background: linear-gradient(135deg, #409EFF, #66b1ff);
  border-radius: 16rpx;
  padding: 40rpx;
  color: #ffffff;
  text-align: center;
  margin-bottom: 20rpx;
}

.summary .label {
  display: block;
  font-size: 28rpx;
  opacity: 0.8;
  margin-bottom: 10rpx;
}

.summary .value {
  display: block;
  font-size: 48rpx;
  font-weight: bold;
}

.filter {
  margin-bottom: 20rpx;
}

.filter-picker {
  display: inline-flex;
  align-items: center;
  padding: 16rpx 24rpx;
  background-color: #ffffff;
  border-radius: 8rpx;
}

.filter-picker .arrow {
  margin-left: 10rpx;
  font-size: 20rpx;
  color: #999999;
}

.consumption-item {
  margin-bottom: 20rpx;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.item-header .date {
  font-size: 24rpx;
  color: #999999;
}

.item-header .amount {
  font-size: 32rpx;
  font-weight: bold;
  color: #f56c6c;
}

.item-body {
  margin-bottom: 16rpx;
}

.service-list {
  font-size: 28rpx;
  color: #333333;
  margin-bottom: 8rpx;
}

.service-list text {
  margin-right: 16rpx;
}

.item-body .employee {
  font-size: 24rpx;
  color: #999999;
}

.item-footer {
  padding-top: 16rpx;
  border-top: 1rpx solid #f0f0f0;
}

.item-footer .payment {
  font-size: 24rpx;
  color: #999999;
}

.empty {
  text-align: center;
  padding: 100rpx 0;
  color: #999999;
}

.load-more {
  text-align: center;
  padding: 30rpx;
  color: #409EFF;
}
</style>
