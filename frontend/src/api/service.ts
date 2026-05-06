import api from './index'

// 服务项目接口
export interface Service {
  id: string
  name: string
  code: string
  category: string
  price: number
  memberPrice?: number
  commissionRate?: number
  fixedCommission?: number
  duration?: number
  description?: string
  notice?: string
  image?: string
  sort?: number
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

// 服务套餐接口
export interface ServicePackage {
  id: string
  name: string
  code: string
  image?: string
  items: PackageItem[]
  price: number
  validityDays?: number
  validityEndDate?: string
  description?: string
  notice?: string
  sort?: number
  purchaseLimit?: number
  isActive: boolean
  salesCount?: number
  createdAt?: string
  updatedAt?: string
}

export interface PackageItem {
  serviceId: string
  serviceName: string
  servicePrice: number
  quantity: number
}

// 服务评价接口
export interface ServiceReview {
  id: string
  memberId: string
  memberName: string
  memberAvatar?: string
  serviceId: string
  serviceName: string
  rating: number
  content: string
  images?: string[]
  tags?: string[]
  reply?: string
  replyTime?: string
  createdAt: string
}

// 服务分类接口
export interface ServiceCategory {
  id: string
  name: string
  parentId?: string
  children?: ServiceCategory[]
}

// 服务项目API
export const serviceApi = {
  // 获取服务列表
  getList(params?: {
    keyword?: string
    category?: string
    isActive?: boolean
    page?: number
    pageSize?: number
  }) {
    return api.get('/services', { params })
  },

  // 获取单个服务
  getById(id: string) {
    return api.get(`/services/${id}`)
  },

  // 创建服务
  create(data: Partial<Service>) {
    return api.post('/services', data)
  },

  // 更新服务
  update(id: string, data: Partial<Service>) {
    return api.patch(`/services/${id}`, data)
  },

  // 删除服务
  delete(id: string) {
    return api.delete(`/services/${id}`)
  },

  // 批量导入
  import(file: File) {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/services/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },

  // 导出
  export() {
    return api.get('/services/export', { responseType: 'blob' })
  },

  // 获取分类列表
  getCategories() {
    return api.get('/services/categories')
  },

  // 创建分类
  createCategory(data: Partial<ServiceCategory>) {
    return api.post('/services/categories', data)
  },

  // 更新分类
  updateCategory(id: string, data: Partial<ServiceCategory>) {
    return api.patch(`/services/categories/${id}`, data)
  },

  // 删除分类
  deleteCategory(id: string) {
    return api.delete(`/services/categories/${id}`)
  }
}

// 服务套餐API
export const packageApi = {
  // 获取套餐列表
  getList(params?: {
    keyword?: string
    isActive?: boolean
    page?: number
    pageSize?: number
  }) {
    return api.get('/packages', { params })
  },

  // 获取单个套餐
  getById(id: string) {
    return api.get(`/packages/${id}`)
  },

  // 创建套餐
  create(data: Partial<ServicePackage>) {
    return api.post('/packages', data)
  },

  // 更新套餐
  update(id: string, data: Partial<ServicePackage>) {
    return api.patch(`/packages/${id}`, data)
  },

  // 删除套餐
  delete(id: string) {
    return api.delete(`/packages/${id}`)
  }
}

// 服务评价API
export const reviewApi = {
  // 获取评价列表
  getList(params?: {
    rating?: number
    hasImage?: boolean
    serviceId?: string
    page?: number
    pageSize?: number
  }) {
    return api.get('/reviews', { params })
  },

  // 获取评价统计
  getStats() {
    return api.get('/reviews/stats')
  },

  // 获取服务评分排行
  getTopServices(limit?: number) {
    return api.get('/reviews/top-services', { params: { limit } })
  },

  // 回复评价
  reply(id: string, reply: string) {
    return api.post(`/reviews/${id}/reply`, { reply })
  },

  // 删除评价
  delete(id: string) {
    return api.delete(`/reviews/${id}`)
  }
}

export default {
  service: serviceApi,
  package: packageApi,
  review: reviewApi
}
