<template>
  <div class="login-container">
    <!-- 金色装饰曲线 -->
    <svg class="deco-curve" viewBox="0 0 800 600" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M-50 100 Q200 -50 400 200 Q600 450 850 300" stroke="rgba(212,175,55,0.35)" stroke-width="1.5" fill="none"/>
      <path d="M-30 150 Q220 0 420 250 Q620 500 870 350" stroke="rgba(212,175,55,0.15)" stroke-width="1" fill="none"/>
    </svg>

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
            <span class="input-icon">📞</span>
            <span class="phone-prefix">+86</span>
            <el-input v-model="loginForm.username" placeholder="请输入手机号" size="large" class="custom-input" />
          </div>
        </el-form-item>
        <el-form-item prop="password">
          <div class="input-wrapper">
            <span class="input-icon">🔒</span>
            <el-input v-model="loginForm.password" type="password" placeholder="密码" size="large" show-password @keyup.enter="handleLogin" class="custom-input" />
          </div>
        </el-form-item>
        <p class="input-hint">请输入密码</p>
        <el-form-item>
          <button type="button" class="login-btn" :disabled="loading" @click="handleLogin">
            <span v-if="!loading">登 录</span>
            <span v-else>登录中...</span>
          </button>
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
            <span class="input-icon">📞</span>
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
          <button type="button" class="login-btn" :disabled="loading" @click="handleRegister">
            <span v-if="!loading">注 册</span>
            <span v-else>注册中...</span>
          </button>
        </el-form-item>
        <div class="bottom-links">
          <span @click="switchToLogin">已有账号？立即登录</span>
        </div>
      </el-form>

      <!-- 底部信息 -->
      <div class="footer-info">
        <p>2026美业会员管理系统v1.0.0</p>
        <p>秀吧美业技术支持</p>
        <p>客服微信：showba2689</p>
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

const loginForm = reactive({ username: '', password: '' })
const registerForm = reactive({ username: '', password: '', confirmPassword: '', name: '', phone: '' })

const loginRules: FormRules = {
  username: [{ required: true, message: '请输入手机号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

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
    { validator: (_rule: any, value: string, callback: any) => { value !== registerForm.password ? callback(new Error('两次密码不一致')) : callback() }, trigger: 'blur' }
  ],
  name: [{ required: true, message: '请输入真实姓名', trigger: 'blur' }]
}

const switchToRegister = () => { isRegister.value = true }
const switchToLogin = () => { isRegister.value = false }

const handleLogin = async () => {
  if (!loginFormRef.value) return
  await loginFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        const response = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(loginForm) })
        const data = await response.json()
        if (response.ok) {
          userStore.setToken(data.access_token)
          userStore.setUserInfo({ ...data.user, permissions: data.permissions || [] })
          ElMessage.success('登录成功')
          router.push('/')
        } else { ElMessage.error(data.message || '登录失败') }
      } catch (error) { ElMessage.error('登录失败，请检查网络') }
      finally { loading.value = false }
    }
  })
}

const handleRegister = async () => {
  if (!registerFormRef.value) return
  await registerFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        const response = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: registerForm.username, password: registerForm.password, name: registerForm.name, phone: registerForm.phone || undefined }) })
        const data = await response.json()
        if (response.ok) { ElMessage.success('注册成功，请登录'); isRegister.value = false; loginForm.username = registerForm.username }
        else { ElMessage.error(data.message || '注册失败') }
      } catch (error) { ElMessage.error('注册失败，请检查网络') }
      finally { loading.value = false }
    }
  })
}
</script>

<style scoped>
.login-container {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #d0d6db 0%, #ddd5d8 30%, #f0ddd8 60%, #f5e6e0 100%);
  position: relative;
  overflow: hidden;
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

.login-container::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background-image:
    radial-gradient(ellipse at 20% 30%, rgba(255,255,255,0.4) 0%, transparent 50%),
    radial-gradient(ellipse at 75% 15%, rgba(255,255,255,0.25) 0%, transparent 40%),
    radial-gradient(ellipse at 55% 85%, rgba(212,160,168,0.2) 0%, transparent 45%),
    radial-gradient(ellipse at 85% 70%, rgba(240,221,216,0.3) 0%, transparent 40%);
  pointer-events: none;
}

.deco-curve {
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
  pointer-events: none;
  z-index: 0;
}

.login-box {
  width: 420px;
  padding: 50px 40px 30px;
  background: rgba(255, 255, 255, 0.18);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.35);
  box-shadow: 0 8px 32px rgba(0,0,0,0.06), 0 1px 4px rgba(212,175,55,0.08), inset 0 1px 0 rgba(255,255,255,0.5);
  position: relative;
  z-index: 1;
}

.login-header { text-align: center; margin-bottom: 32px; }

.login-header h1 {
  font-size: 26px;
  font-weight: 800;
  color: #fff;
  text-shadow: 0 1px 0 rgba(212,175,55,0.3), 0 2px 6px rgba(0,0,0,0.1), 0 0 30px rgba(255,255,255,0.15);
  letter-spacing: 4px;
  margin: 0;
  -webkit-text-stroke: 0.5px rgba(212,175,55,0.2);
}

.header-divider { display: flex; align-items: center; justify-content: center; margin-top: 16px; gap: 6px; }
.divider-line { width: 60px; height: 1px; background: linear-gradient(90deg, transparent, #d4af37, transparent); }
.divider-diamond { color: #d4af37; font-size: 7px; line-height: 1; }

.login-form { margin-top: 8px; }

.input-wrapper {
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 20px;
  overflow: hidden;
  border: none;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04), inset 0 1px 3px rgba(0,0,0,0.03);
  transition: all 0.3s ease;
  width: 100%;
  height: 48px;
}

.input-wrapper:focus-within { box-shadow: 0 2px 12px rgba(212,175,55,0.15), inset 0 1px 3px rgba(0,0,0,0.03); }

.input-icon { display: flex; align-items: center; justify-content: center; width: 44px; font-size: 18px; flex-shrink: 0; color: #333; }

.phone-prefix {
  display: flex; align-items: center; padding-right: 10px;
  font-size: 15px; color: #333; font-weight: 500;
  border-right: 1px solid #eee; margin-right: 2px; white-space: nowrap;
}

.custom-input :deep(.el-input__wrapper) { box-shadow: none !important; background: transparent !important; padding: 4px 8px; height: 44px; }
.custom-input :deep(.el-input__inner) { font-size: 15px; color: #333; height: 40px; }
.custom-input :deep(.el-input__inner::placeholder) { color: #aaa; }

.input-hint { font-size: 12px; color: #888; margin: -12px 0 8px 16px; }

.login-btn {
  width: 100%; height: 50px; border-radius: 25px;
  font-size: 18px; font-weight: 700; letter-spacing: 8px;
  border: none;
  background: linear-gradient(135deg, #d82e7b 0%, #ff7c5c 100%);
  color: #fff;
  box-shadow: 0 4px 16px rgba(216,46,123,0.35), inset 0 2px 4px rgba(255,255,255,0.25), inset 0 -1px 2px rgba(0,0,0,0.1);
  cursor: pointer; transition: all 0.3s ease;
  position: relative; overflow: hidden;
}

.login-btn::before {
  content: ''; position: absolute;
  top: 0; left: 10%; right: 10%; height: 50%;
  background: linear-gradient(180deg, rgba(255,255,255,0.3) 0%, transparent 100%);
  border-radius: 25px 25px 50% 50%;
  pointer-events: none;
}

.login-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(216,46,123,0.45), inset 0 2px 4px rgba(255,255,255,0.25), inset 0 -1px 2px rgba(0,0,0,0.1); }
.login-btn:active { transform: translateY(0); }
.login-btn:disabled { opacity: 0.7; cursor: not-allowed; transform: none; }

.bottom-links { text-align: center; margin-top: 16px; font-size: 13px; color: #555; }
.bottom-links span { cursor: pointer; transition: color 0.2s; }
.bottom-links span:hover { color: #d82e7b; }
.link-divider { margin: 0 12px; cursor: default !important; color: #999; }
.link-divider:hover { color: #999 !important; }

.footer-info { text-align: center; margin-top: 28px; padding-top: 18px; border-top: 1px solid rgba(0,0,0,0.06); }
.footer-info p { font-size: 12px; color: #888; margin: 3px 0; line-height: 1.6; }

:deep(.el-form-item) { margin-bottom: 18px; }
:deep(.el-form-item__error) { padding-top: 2px; padding-left: 16px; color: #d82e7b; }
</style>
