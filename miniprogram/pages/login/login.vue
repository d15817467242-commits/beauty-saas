<template>
  <view class="login-page">
    <view class="logo">
      <image src="/static/logo.png" mode="aspectFit" />
    </view>
    
    <view class="title">美业SaaS</view>
    <view class="subtitle">专业美容美发服务</view>

    <button class="login-btn" open-type="getPhoneNumber" @getphonenumber="onGetPhoneNumber">
      <text>微信授权登录</text>
    </button>

    <view class="agreement">
      <text>登录即表示同意</text>
      <text class="link">《用户协议》</text>
      <text>和</text>
      <text class="link">《隐私政策》</text>
    </view>
  </view>
</template>

<script>
export default {
  methods: {
    async onGetPhoneNumber(e) {
      if (e.detail.errMsg !== 'getPhoneNumber:ok') {
        uni.showToast({ title: '授权失败', icon: 'none' })
        return
      }

      // 实际项目中应该：
      // 1. 调用 wx.login 获取 code
      // 2. 将 code 发送到后端
      // 3. 后端调用微信API获取 openid 和 session_key
      // 4. 后端返回 token

      try {
        // 模拟登录
        const loginRes = await uni.login()
        
        // 调用后端登录接口
        const res = await uni.request({
          url: 'http://localhost:3001/api/miniapp/login',
          method: 'POST',
          data: { code: loginRes.code }
        })

        if (res.data) {
          uni.setStorageSync('token', res.data.token)
          uni.setStorageSync('openid', res.data.openid)
          
          // 跳转到绑定手机号页面或首页
          if (res.data.isNew) {
            uni.showModal({
              title: '绑定手机号',
              content: '请绑定手机号以完善会员信息',
              showCancel: false,
              success: () => {
                // 这里应该跳转到绑定手机号页面
                // 暂时直接跳转首页
                uni.switchTab({ url: '/pages/index/index' })
              }
            })
          } else {
            uni.switchTab({ url: '/pages/index/index' })
          }
        }
      } catch (e) {
        console.error('登录失败', e)
        uni.showToast({ title: '登录失败', icon: 'none' })
      }
    }
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40rpx;
  background: linear-gradient(135deg, #409EFF, #66b1ff);
}

.logo {
  width: 160rpx;
  height: 160rpx;
  margin-bottom: 40rpx;
}

.logo image {
  width: 100%;
  height: 100%;
}

.title {
  font-size: 48rpx;
  font-weight: bold;
  color: #ffffff;
  margin-bottom: 16rpx;
}

.subtitle {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 80rpx;
}

.login-btn {
  width: 100%;
  padding: 24rpx;
  background-color: #ffffff;
  color: #409EFF;
  border-radius: 40rpx;
  font-size: 32rpx;
  font-weight: bold;
  text-align: center;
}

.agreement {
  margin-top: 40rpx;
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.8);
}

.agreement .link {
  color: #ffffff;
}
</style>
