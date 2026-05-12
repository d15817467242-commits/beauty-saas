import axios from 'axios'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'

const request = axios.create({
  baseURL: '/api',
  timeout: 30000,
})

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    const userStore = useUserStore()
    if (userStore.token) {
      config.headers.Authorization = `Bearer ${userStore.token}`
    }
    // 自动附加 storeId 到请求参数
    const currentStoreId = userStore.storeId
    if (currentStoreId) {
      if (config.method === 'get') {
        config.params = { ...config.params, storeId: currentStoreId }
      } else {
        // POST/PUT/PATCH: 确保 data 是对象后再合并
        if (config.data && typeof config.data === 'object') {
          config.data = { ...config.data, storeId: currentStoreId }
        } else if (!config.data) {
          config.data = { storeId: currentStoreId }
        }
        // GET 请求也加 params，方便后端 @Query 接收
        config.params = { ...config.params, storeId: currentStoreId }
      }
    }
    return config
  },
  (error) => Promise.reject(error),
)

// 响应拦截器
request.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.message || '请求失败'
    if (Array.isArray(message)) {
      ElMessage.error(message.join('；'))
    } else {
      ElMessage.error(message)
    }
    if (error.response?.status === 401) {
      const userStore = useUserStore()
      userStore.logout()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  },
)

export default request
