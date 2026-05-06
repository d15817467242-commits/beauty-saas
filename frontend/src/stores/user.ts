import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUserStore = defineStore('user', () => {
  const token = ref<string>(localStorage.getItem('token') || '')
  const userInfo = ref<any>(null)

  const isLoggedIn = computed(() => !!token.value)
  
  const role = computed(() => userInfo.value?.role || 'employee')
  
  // 权限列表
  const permissions = computed(() => userInfo.value?.permissions || [])

  // 菜单权限映射
  const menuPermissions: Record<string, string> = {
    '/member': 'member:view',
    '/employee': 'employee:view',
    '/service': 'service:view',
    '/count-card': 'count_card:view',
    '/cashier': 'cashier:use',
    '/report': 'report:view',
    '/reminder': 'reminder:view',
    '/appointment': 'appointment:view',
    '/schedule': 'schedule:view',
    '/marketing': 'marketing:view',
    '/inventory': 'inventory:view',
    '/credit': 'credit:view',
    '/member-enhanced': 'member:view',
    '/member-tag': 'member:view',
    '/member-level': 'member:view',
    '/member-points': 'member:view',
  }

  // 检查是否有某个权限
  const hasPermission = (permission: string): boolean => {
    if (role.value === 'admin') return true
    return permissions.value.includes(permission)
  }

  // 检查菜单是否可见
  const canAccessMenu = (path: string): boolean => {
    const permission = menuPermissions[path]
    if (!permission) return true // 没有权限要求的菜单默认可见
    return hasPermission(permission)
  }

  const setToken = (newToken: string) => {
    token.value = newToken
    localStorage.setItem('token', newToken)
  }

  const setUserInfo = (info: any) => {
    userInfo.value = info
  }

  const logout = () => {
    token.value = ''
    userInfo.value = null
    localStorage.removeItem('token')
  }

  return {
    token,
    userInfo,
    isLoggedIn,
    role,
    permissions,
    hasPermission,
    canAccessMenu,
    setToken,
    setUserInfo,
    logout,
  }
})
