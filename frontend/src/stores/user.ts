import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

interface UserInfo {
  id: number
  username: string
  name: string
  phone: string
  role: string
  storeId?: string
  storeName?: string
  avatar?: string
}

interface StoreInfo {
  id: string
  name: string
}

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '')
  const userInfo = ref<UserInfo | null>(null)
  const storeId = ref(localStorage.getItem('storeId') || '')
  const storeName = ref(localStorage.getItem('storeName') || '')
  const storeList = ref<StoreInfo[]>([])

  // 角色判断
  const isLoggedIn = computed(() => !!token.value)
  const role = computed(() => userInfo.value?.role || '')
  const isSuperAdmin = computed(() => role.value === 'superadmin')
  const isAdmin = computed(() => role.value === 'admin')
  const isManager = computed(() => role.value === 'manager')
  const isCashier = computed(() => role.value === 'cashier')
  const isEmployee = computed(() => role.value === 'employee')

  // 操作权限：是否可以新增/编辑/删除
  const canCreate = computed(() => ['superadmin', 'admin', 'manager'].includes(role.value))
  const canEdit = computed(() => ['superadmin', 'admin', 'manager'].includes(role.value))
  const canDelete = computed(() => ['superadmin', 'admin'].includes(role.value))

  // 特定模块权限
  const canManageEmployees = computed(() => ['superadmin', 'admin', 'manager'].includes(role.value))
  const canManageServices = computed(() => ['superadmin', 'admin', 'manager'].includes(role.value))
  const canCashier = computed(() => ['superadmin', 'admin', 'manager', 'cashier'].includes(role.value))
  const canViewReport = computed(() => ['superadmin', 'admin', 'manager'].includes(role.value))
  const canManageInventory = computed(() => ['superadmin', 'admin'].includes(role.value))
  const canSmsMarketing = computed(() => ['superadmin', 'admin'].includes(role.value))

  // 角色显示
  const roleLabel = computed(() => {
    const map: Record<string, string> = {
      superadmin: '服务商',
      admin: '管理员',
      manager: '店长',
      cashier: '收银员',
      employee: '员工',
    }
    return map[role.value] || '未知'
  })

  const roleTagColor = computed(() => {
    const map: Record<string, string> = {
      superadmin: 'danger',
      admin: 'warning',
      manager: '',
      cashier: 'success',
      employee: 'info',
    }
    return map[role.value] || 'info'
  })

  const roleHint = computed(() => {
    const map: Record<string, string> = {
      superadmin: '服务商 - 平台管理权限',
      admin: '管理员 - 全部业务权限',
      manager: '店长 - 业务管理权限（不可删除）',
      cashier: '收银员 - 收银和查看权限',
      employee: '员工 - 仅查看权限',
    }
    return map[role.value] || '未知角色'
  })

  function setToken(t: string) {
    token.value = t
    localStorage.setItem('token', t)
  }

  function setUserInfo(info: UserInfo) {
    userInfo.value = info
    localStorage.setItem('userInfo', JSON.stringify(info))
  }

  function switchStore(id: string, name: string) {
    storeId.value = id
    storeName.value = name
    localStorage.setItem('storeId', id)
    localStorage.setItem('storeName', name)
  }

  function setStoreList(list: StoreInfo[]) {
    storeList.value = list
  }

  function logout() {
    token.value = ''
    userInfo.value = null
    storeId.value = ''
    storeName.value = ''
    storeList.value = []
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
    localStorage.removeItem('storeId')
    localStorage.removeItem('storeName')
  }

  // 初始化：从 localStorage 恢复
  function init() {
    const savedInfo = localStorage.getItem('userInfo')
    if (savedInfo) {
      try {
        userInfo.value = JSON.parse(savedInfo)
      } catch {
        userInfo.value = null
      }
    }
  }

  init()

  return {
    token, userInfo, storeId, storeName, storeList,
    isLoggedIn, role, isSuperAdmin, isAdmin, isManager, isCashier, isEmployee,
    canCreate, canEdit, canDelete,
    canManageEmployees, canManageServices, canCashier, canViewReport,
    canManageInventory, canSmsMarketing,
    roleLabel, roleTagColor, roleHint,
    setToken, setUserInfo, switchStore, setStoreList, logout,
  }
})