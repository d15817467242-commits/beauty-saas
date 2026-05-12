import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import request from '@/utils/request'

export const useThemeStore = defineStore('theme', () => {
  const theme = ref<string>(localStorage.getItem('theme') || 'light')
  const primaryColor = ref<string>(localStorage.getItem('primaryColor') || '#409eff')
  const fontSize = ref<string>(localStorage.getItem('fontSize') || 'medium')
  const layout = ref<string>(localStorage.getItem('layout') || 'side')

  // 应用主题到DOM
  function applyTheme() {
    const html = document.documentElement

    // 暗色模式
    if (theme.value === 'dark' || (theme.value === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      html.classList.add('dark')
    } else {
      html.classList.remove('dark')
    }

    // 主色调
    html.style.setProperty('--el-color-primary', primaryColor.value)
    // 生成浅色变体
    html.style.setProperty('--el-color-primary-light-3', mixColor(primaryColor.value, '#ffffff', 0.3))
    html.style.setProperty('--el-color-primary-light-5', mixColor(primaryColor.value, '#ffffff', 0.5))
    html.style.setProperty('--el-color-primary-light-7', mixColor(primaryColor.value, '#ffffff', 0.7))
    html.style.setProperty('--el-color-primary-light-9', mixColor(primaryColor.value, '#ffffff', 0.9))
    html.style.setProperty('--el-color-primary-dark-2', mixColor(primaryColor.value, '#000000', 0.2))

    // 字体大小
    const sizeMap: Record<string, string> = { small: '12px', medium: '14px', large: '16px' }
    html.style.fontSize = sizeMap[fontSize.value] || '14px'

    // 持久化
    localStorage.setItem('theme', theme.value)
    localStorage.setItem('primaryColor', primaryColor.value)
    localStorage.setItem('fontSize', fontSize.value)
    localStorage.setItem('layout', layout.value)
  }

  // 从后端加载设置
  async function loadFromServer() {
    try {
      const res = await request.get('/user/settings')
      if (res.theme) theme.value = res.theme
      if (res.primaryColor) primaryColor.value = res.primaryColor
      if (res.fontSize) fontSize.value = res.fontSize
      if (res.layout) layout.value = res.layout
      applyTheme()
    } catch (e) {
      applyTheme()
    }
  }

  // 颜色混合
  function mixColor(color1: string, color2: string, ratio: number): string {
    const hex = (c: string) => {
      const v = parseInt(c.replace('#', ''), 16)
      return [(v >> 16) & 255, (v >> 8) & 255, v & 255]
    }
    const [r1, g1, b1] = hex(color1)
    const [r2, g2, b2] = hex(color2)
    const r = Math.round(r1 * (1 - ratio) + r2 * ratio)
    const g = Math.round(g1 * (1 - ratio) + g2 * ratio)
    const b = Math.round(b1 * (1 - ratio) + b2 * ratio)
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
  }

  // 监听系统主题变化（auto模式）
  if (typeof window !== 'undefined') {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (theme.value === 'auto') applyTheme()
    })
  }

  return { theme, primaryColor, fontSize, layout, applyTheme, loadFromServer }
})
