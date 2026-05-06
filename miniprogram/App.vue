<script>
export default {
  onLaunch() {
    console.log('App Launch')
    // 检查登录状态
    this.checkLogin()
  },
  onShow() {
    console.log('App Show')
  },
  onHide() {
    console.log('App Hide')
  },
  methods: {
    checkLogin() {
      const token = uni.getStorageSync('token')
      if (!token) {
        // 未登录，跳转到登录页
        uni.navigateTo({
          url: '/pages/login/login'
        })
      }
    }
  }
}
</script>

<style>
/* 全局样式 */
page {
  background-color: #f8f8f8;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
}

.container {
  padding: 20rpx;
}

/* 主题色 */
.text-primary {
  color: #409EFF;
}

.bg-primary {
  background-color: #409EFF;
}

/* 卡片样式 */
.card {
  background-color: #ffffff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
}

/* 按钮样式 */
.btn-primary {
  background-color: #409EFF;
  color: #ffffff;
  border-radius: 40rpx;
  padding: 20rpx 40rpx;
  text-align: center;
  font-size: 28rpx;
}

.btn-primary:active {
  background-color: #66b1ff;
}

/* 列表样式 */
.list-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.list-item:last-child {
  border-bottom: none;
}
</style>
