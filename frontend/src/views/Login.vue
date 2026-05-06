<template>
  <div class="login-container">
    <!-- 金色装饰线条 -->
    <div class="deco-line deco-line-1"></div>
    <div class="deco-line deco-line-2"></div>
    
    <!-- 登录主体 -->
    <div class="login-box">
      <!-- 标题区域 -->
      <div class="login-header">
        <h1>秀吧美业会员管理系统</h1>
        <div class="header-divider">
          <span class="divider-line"></span>
          <span class="divider-diamond">◆</span>
          <span class="divider-diamond">◆</span>
          <span class="divider-line"></span>
        </div>
      </div>

      <!-- 登录表单 -->
      <el-form v-if="!isRegister" :model="loginForm" :rules="loginRules" ref="loginFormRef" label-width="0" class="login-form">
        <el-form-item prop="username">
          <div class="input-wrapper">
            <span class="input-icon">📱</span>
            <span class="phone-prefix">+86</span>
            <el-input v-model="loginForm.username" placeholder="请输入手机号" size="large" class="custom-input" />
          </div>
        </el-form-item>
        <el-form-item prop="password">
          <div class="input-wrapper">
            <span class="input-icon">🔒</span>
            <el-input v-model="loginForm.password" type="password" placeholder="请输入密码" size="large" show-password @keyup.enter="handleLogin" class="custom-input" />
          </div>
        </el-form-item>
        <el-form-item>
          <el-button size="large" :loading="loading" @click="handleLogin" class="login-btn">登 录</el-button>
        </el-form-item>
        <div class="bottom-links">
          <span @click="switchToRegister">注册账号</span>
          <span class="link-divider">|</span>
          <span>忘记密码</span>
        </div>
      </el-form>

      <!-- 注册表单 -->
      <el-form v-else :model="registerForm" :rules="registerRules" ref="registerFormRef" label-width="0" class="login-form">
        <el-form-item prop="username">
          <div class="input-wrapper">
            <span class="input-icon">📱</span>
            <span class="phone-prefix">+86</span>
            <el-input v-model="registerForm.username" placeholder="请输入手机号" size="large" class="custom-input" />
          </div>
        </el-form-item>
        <el-form-item prop="password">
          <div class="input-wrapper">
            <span class="input-icon">🔒</span>
            <el-input v-model="registerForm.password" type="password" placeholder="请输入密码" size="large" show-password class="custom-input" />
          </div>
        </el-form-item>
        <el-form-item prop="confirmPassword">
          <div class="input-wrapper">
            <span class="input-icon">🔒</span>
            <el-input v-model="registerForm.confirmPassword" type="password" placeholder="请确认密码" size="large" show-password class="custom-input" />
          </div>
        </el-form-item>
        <el-form-item prop="name">
          <div class="input-wrapper">
            <span class="input-icon">👤</span>
            <el-input v-model="registerForm.name" placeholder="请输入真实姓名" size="large" class="custom-input" />
          </div>
        </el-form-item>
        <el-form-item>
          <el-button size="large" :loading="loading" @click="handleRegister" class="login-btn">注 册</el-button>
        </el-form-item>
        <div class="bottom-links">
          <span @click="switchToLogin">已有账号？立即登录</span>
        </div>
      </el-form>

      <!-- 底部信息 -->
      <div class="footer-info">
        <p>2026美业会员管理系统v1.0.0</p>
        <p>秀吧美业技术支持 | 客服微信：showba2689</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()
const loginFormRef = ref<FormInstance>()
const registerFormRef = ref<FormInstance>()
const loading = ref(false)
const isRegister = ref(false)

// 登录表单
const loginForm = reactive({
  username: '',
  password: ''
})

// 注册表单
const registerForm = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  name: '',
  phone: ''
})

// 登录校验规则
const loginRules: FormRules = {
  username: [{ required: true, message: '请输入手机号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

// 注册校验规则
const registerRules: FormRules = {
  username: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度3-20个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度6-20个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    { 
      validator: (_rule: any, value: string, callback: any) => {
        if (value !== registerForm.password) {
          callback(new Error('两次密码不一致'))
        } else {
          callback()
        }
      }, 
      trigger: 'blur' 
    }
  ],
  name: [{ required: true, message: '请输入真实姓名', trigger: 'blur' }]
}

// 切换到注册
const switchToRegister = () => {
  isRegister.value = true
}

// 切换到登录
const switchToLogin = () => {
  isRegister.value = false
}

// 登录
const handleLogin = async () => {
  if (!loginFormRef.value) return
  await loginFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(loginForm)
        })
        const data = await response.json()
        if (response.ok) {
          userStore.setToken(data.access_token)
          userStore.setUserInfo({
            ...data.user,
            permissions: data.permissions || []
          })
          ElMessage.success('登录成功')
          router.push('/')
        } else {
          ElMessage.error(data.message || '登录失败')
        }
      } catch (error) {
        ElMessage.error('登录失败，请检查网络')
      } finally {
        loading.value = false
      }
    }
  })
}

// 注册
const handleRegister = async () => {
  if (!registerFormRef.value) return
  await registerFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: registerForm.username,
            password: registerForm.password,
            name: registerForm.name,
            phone: registerForm.phone || undefined
          })
        })
        const data = await response.json()
        if (response.ok) {
          ElMessage.success('注册成功，请登录')
          isRegister.value = false
          loginForm.username = registerForm.username
        } else {
          ElMessage.error(data.message || '注册失败')
        }
      } catch (error) {
        ElMessage.error('注册失败，请检查网络')
      } finally {
        loading.value = false
      }
    }
  })
}
</script>

<style scoped>
/* 整体容器 - 大理石质感灰粉渐变背景 */
.login-container {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #e8e0e3 0%, #f0d5d8 40%, #e8c4c8 70%, #d4a0a8 100%);
  position: relative;
  overflow: hidden;
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

/* 背景纹理 - 模拟大理石 */
.login-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: 
    radial-gradient(ellipse at 20% 50%, rgba(255,255,255,0.3) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 20%, rgba(255,255,255,0.2) 0%, transparent 40%),
    radial-gradient(ellipse at 60% 80%, rgba(212,160,168,0.3) 0%, transparent 50%);
  pointer-events: none;
}

/* 金色装饰线条 */
.deco-line {
  position: absolute;
  width: 400px;
  height: 400px;
  border: 2px solid transparent;
  pointer-events: none;
}

.deco-line-1 {
  top: -100px;
  left: -100px;
  border-radius: 50%;
  border-top-color: rgba(212, 175, 55, 0.4);
  border-left-color: rgba(212, 175, 55, 0.2);
  animation: rotate-slow 20s linear infinite;
}

.deco-line-2 {
  bottom: -150px;
  right: -150px;
  border-radius: 50%;
  border-bottom-color: rgba(212, 175, 55, 0.4);
  border-right-color: rgba(212, 175, 55, 0.2);
  animation: rotate-slow 25s linear infinite reverse;
}

@keyframes rotate-slow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 登录主体框 */
.login-box {
  width: 420px;
  padding: 50px 40px 30px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.08),
    0 2px 8px rgba(212, 175, 55, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.4);
  position: relative;
  z-index: 1;
}

/* 标题区域 */
.login-header {
  text-align: center;
  margin-bottom: 36px;
}

.login-header h1 {
  font-size: 26px;
  font-weight: 700;
  color: #fff;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1), 0 0 20px rgba(212, 175, 55, 0.2);
  letter-spacing: 3px;
  margin: 0;
}

/* 标题下方金色分隔线 */
.header-divider {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 16px;
  gap: 8px;
}

.divider-line {
  width: 60px;
  height: 1px;
  background: linear-gradient(90deg, transparent, #d4af37, transparent);
}

.divider-diamond {
  color: #d4af37;
  font-size: 8px;
  line-height: 1;
}

/* 表单区域 */
.login-form {
  margin-top: 10px;
}

/* 输入框外层 */
.input-wrapper {
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.3s ease;
  width: 100%;
}

.input-wrapper:focus-within {
  border-color: rgba(212, 175, 55, 0.4);
  box-shadow: 0 2px 12px rgba(212, 175, 55, 0.15);
}

.input-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  font-size: 18px;
  flex-shrink: 0;
  color: #666;
}

.phone-prefix {
  display: flex;
  align-items: center;
  padding: 0 8px 0 0;
  font-size: 14px;
  color: #333;
  font-weight: 500;
  border-right: 1px solid #eee;
  margin-right: 4px;
  white-space: nowrap;
}

/* 自定义输入框样式 */
.custom-input :deep(.el-input__wrapper) {
  box-shadow: none !important;
  background: transparent !important;
  padding: 4px 8px;
}

.custom-input :deep(.el-input__inner) {
  font-size: 15px;
  color: #333;
}

.custom-input :deep(.el-input__inner::placeholder) {
  color: #bbb;
}

/* 登录按钮 - 渐变粉橙色 */
.login-btn {
  width: 100%;
  height: 48px;
  border-radius: 12px !important;
  font-size: 18px;
  font-weight: 600;
  letter-spacing: 8px;
  border: none !important;
  background: linear-gradient(135deg, #e8668a 0%, #f08c5a 100%) !important;
  color: #fff !important;
  box-shadow: 0 4px 16px rgba(232, 102, 138, 0.35);
  transition: all 0.3s ease;
  cursor: pointer;
}

.login-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(232, 102, 138, 0.45);
  background: linear-gradient(135deg, #ec7a9a 0%, #f29a6e 100%) !important;
}

.login-btn:active {
  transform: translateY(0);
}

/* 底部链接 */
.bottom-links {
  text-align: center;
  margin-top: 16px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
}

.bottom-links span {
  cursor: pointer;
  transition: color 0.2s;
}

.bottom-links span:hover {
  color: #fff;
}

.link-divider {
  margin: 0 12px;
  cursor: default !important;
}

/* 底部信息 */
.footer-info {
  text-align: center;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.15);
}

.footer-info p {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  margin: 4px 0;
  line-height: 1.6;
}

/* Element Plus 表单覆盖 */
:deep(.el-form-item) {
  margin-bottom: 20px;
}

:deep(.el-form-item__error) {
  padding-top: 4px;
  color: #ff6b8a;
}
</style>
