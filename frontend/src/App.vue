<template>
  <el-config-provider :locale="zhCn">
    <router-view />
  </el-config-provider>
</template>

<script setup lang="ts">
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
import { useThemeStore } from '@/stores/theme'
import { useUserStore } from '@/stores/user'

const themeStore = useThemeStore()
const userStore = useUserStore()

// 已登录则从服务器加载主题，否则用本地缓存
if (userStore.isLoggedIn) {
  themeStore.loadFromServer()
} else {
  themeStore.applyTheme()
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body, #app {
  height: 100%;
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', Arial, sans-serif;
}

/* 暗色模式 */
html.dark {
  --el-bg-color: #141414;
  --el-bg-color-overlay: #1d1d1d;
  --el-bg-color-page: #0a0a0a;
  --el-text-color-primary: #e5eaf3;
  --el-text-color-regular: #cfd3dc;
  --el-text-color-secondary: #a3a6ad;
  --el-text-color-placeholder: #8d9095;
  --el-border-color: #4c4d4f;
  --el-border-color-light: #414243;
  --el-border-color-lighter: #363637;
  --el-border-color-extra-light: #2b2b2c;
  --el-fill-color: #303030;
  --el-fill-color-light: #262727;
  --el-fill-color-lighter: #1d1d1d;
  --el-fill-color-extra-light: #191919;
  --el-fill-color-blank: transparent;
  --el-mask-color: rgba(0, 0, 0, 0.8);
  color-scheme: dark;
}

html.dark body {
  background-color: #0a0a0a;
  color: #e5eaf3;
}

html.dark .el-card {
  --el-card-bg-color: #1d1d1d;
  border-color: #414243;
}

html.dark .el-table {
  --el-table-bg-color: #1d1d1d;
  --el-table-tr-bg-color: #1d1d1d;
  --el-table-header-bg-color: #262727;
  --el-table-row-hover-bg-color: #262727;
  --el-table-border-color: #414243;
}

html.dark .el-dialog {
  --el-dialog-bg-color: #1d1d1d;
}

html.dark .el-form-item__label {
  color: #cfd3dc;
}

html.dark .el-input__wrapper {
  background-color: #262727;
  box-shadow: 0 0 0 1px #414243 inset;
}

html.dark .el-select .el-input__wrapper {
  background-color: #262727;
}

html.dark .el-menu {
  --el-menu-bg-color: #1a1a2e;
  --el-menu-text-color: #bfcbd9;
  --el-menu-hover-bg-color: #262727;
}
</style>
