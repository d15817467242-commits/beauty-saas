<template>
  <div class="user-center">
    <el-row :gutter="20">
      <!-- 个人信息 -->
      <el-col :span="16">
        <el-card>
          <template #header>
            <span>个人信息</span>
          </template>
          <el-form :model="profile" label-width="100px">
            <el-form-item label="用户名">
              <el-input v-model="profile.username" disabled />
            </el-form-item>
            <el-form-item label="真实姓名">
              <el-input v-model="profile.name" />
            </el-form-item>
            <el-form-item label="手机号">
              <el-input v-model="profile.phone" />
            </el-form-item>
            <el-form-item label="头像">
              <el-upload
                class="avatar-uploader"
                action="/api/upload"
                :show-file-list="false"
                :on-success="handleAvatarSuccess"
                :headers="uploadHeaders"
                accept="image/*"
              >
                <img v-if="profile.avatar" :src="profile.avatar" class="avatar" />
                <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
              </el-upload>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="saveProfile">保存</el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <!-- 修改密码 -->
        <el-card class="mt-20">
          <template #header>
            <span>修改密码</span>
          </template>
          <el-form :model="passwordForm" label-width="100px">
            <el-form-item label="旧密码">
              <el-input v-model="passwordForm.oldPassword" type="password" show-password />
            </el-form-item>
            <el-form-item label="新密码">
              <el-input v-model="passwordForm.newPassword" type="password" show-password />
            </el-form-item>
            <el-form-item label="确认密码">
              <el-input v-model="passwordForm.confirmPassword" type="password" show-password />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="changePassword">修改密码</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>

      <!-- 主题设置 -->
      <el-col :span="8">
        <el-card>
          <template #header>
            <span>主题设置</span>
          </template>
          <el-form :model="settings" label-width="80px">
            <el-form-item label="主题">
              <el-select v-model="settings.theme" @change="saveTheme">
                <el-option label="浅色" value="light" />
                <el-option label="深色" value="dark" />
                <el-option label="跟随系统" value="auto" />
              </el-select>
            </el-form-item>
            <el-form-item label="主色调">
              <el-color-picker v-model="settings.primaryColor" @change="saveTheme" />
            </el-form-item>
            <el-form-item label="字体大小">
              <el-select v-model="settings.fontSize" @change="saveTheme">
                <el-option label="小" value="small" />
                <el-option label="中" value="medium" />
                <el-option label="大" value="large" />
              </el-select>
            </el-form-item>
            <el-form-item label="布局">
              <el-select v-model="settings.layout" @change="saveTheme">
                <el-option label="侧边栏" value="side" />
                <el-option label="顶部栏" value="top" />
              </el-select>
            </el-form-item>
          </el-form>
        </el-card>

        <!-- 通知设置 -->
        <el-card class="mt-20">
          <template #header>
            <span>通知设置</span>
          </template>
          <el-form label-width="80px">
            <el-form-item label="邮件通知">
              <el-switch v-model="settings.notifications.email" @change="saveNotifications" />
            </el-form-item>
            <el-form-item label="短信通知">
              <el-switch v-model="settings.notifications.sms" @change="saveNotifications" />
            </el-form-item>
            <el-form-item label="推送通知">
              <el-switch v-model="settings.notifications.push" @change="saveNotifications" />
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import request from '@/utils/request'
import { useThemeStore } from '@/stores/theme'

const themeStore = useThemeStore()

const uploadHeaders = { Authorization: `Bearer ${localStorage.getItem('token')}` }

const profile = ref<any>({
  username: '',
  name: '',
  phone: '',
  avatar: ''
})

const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const settings = ref<any>({
  theme: 'light',
  primaryColor: '#409eff',
  fontSize: 'medium',
  layout: 'side',
  notifications: {
    email: true,
    sms: true,
    push: true
  }
})

onMounted(() => {
  loadProfile()
  loadSettings()
})

async function loadProfile() {
  try {
    const res = await request.get('/user/profile')
    profile.value = res
  } catch (e) {
    console.error(e)
  }
}

async function loadSettings() {
  try {
    const res = await request.get('/user/settings')
    settings.value = res
  } catch (e) {
    console.error(e)
  }
}

async function saveProfile() {
  try {
    await request.put('/user/profile', profile.value)
    ElMessage.success('保存成功')
  } catch (e) {
    console.error(e)
  }
}

function handleAvatarSuccess(res: any) {
  if (res.url) {
    profile.value.avatar = res.url
    // 同步更新到后端
    request.put('/user/profile', { avatar: res.url })
    ElMessage.success('头像上传成功')
  } else {
    ElMessage.error('头像上传失败')
  }
}

async function changePassword() {
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    ElMessage.error('两次密码输入不一致')
    return
  }
  try {
    await request.put('/user/password', passwordForm)
    ElMessage.success('密码修改成功')
    passwordForm.oldPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
  } catch (e) {
    console.error(e)
  }
}

async function saveTheme() {
  try {
    const { theme, primaryColor, fontSize, layout } = settings.value
    await request.put('/user/theme', { theme, primaryColor, fontSize, layout })
    // 立即应用到页面
    themeStore.theme = theme
    themeStore.primaryColor = primaryColor
    themeStore.fontSize = fontSize
    themeStore.layout = layout
    themeStore.applyTheme()
    ElMessage.success('主题设置已保存')
  } catch (e) {
    console.error(e)
  }
}

async function saveNotifications() {
  try {
    await request.put('/user/notifications', settings.value.notifications)
    ElMessage.success('通知设置已保存')
  } catch (e) {
    console.error(e)
  }
}
</script>

<style scoped>
.user-center {
  padding: 20px;
}
.mt-20 {
  margin-top: 20px;
}
.avatar-uploader {
  display: inline-block;
}
.avatar-uploader .avatar {
  width: 100px;
  height: 100px;
  display: block;
  border-radius: 50%;
}
.avatar-uploader-icon {
  width: 100px;
  height: 100px;
  line-height: 100px;
  text-align: center;
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  font-size: 28px;
  color: #8c939d;
}
</style>
