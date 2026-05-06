import request from '@/utils/request'

// 次卡套餐相关
export interface CountCardPackage {
  id: string
  name: string
  code?: string
  count: number
  giftCount?: number
  price: number
  validDays?: number
  applicableServices?: string[]
  description?: string
  isActive: boolean
  createdAt: string
}

export interface MemberCountCard {
  id: string
  memberId: string
  member?: any
  packageId: string
  package?: CountCardPackage
  orderNo: string
  totalCount: number
  remainingCount: number
  purchasePrice: number
  expireDate?: string
  status: 'active' | 'expired' | 'used_up'
  usageRecords?: UsageRecord[]
  createdAt: string
}

export interface UsageRecord {
  date: string
  consumptionId: string
  serviceId: string
  serviceName: string
  employeeId?: string
  employeeName?: string
  count: number
}

// 次卡套餐API
export const countCardPackageApi = {
  // 获取所有次卡套餐
  list: () => request.get<CountCardPackage[]>('/count-card/packages'),

  // 获取单个次卡套餐
  get: (id: string) => request.get<CountCardPackage>(`/count-card/packages/${id}`),

  // 创建次卡套餐
  create: (data: Partial<CountCardPackage>) => request.post<CountCardPackage>('/count-card/packages', data),

  // 更新次卡套餐
  update: (id: string, data: Partial<CountCardPackage>) => 
    request.patch<CountCardPackage>(`/count-card/packages/${id}`, data),

  // 删除次卡套餐
  delete: (id: string) => request.delete(`/count-card/packages/${id}`),
}

// 会员次卡API
export const memberCountCardApi = {
  // 购买次卡
  purchase: (data: {
    memberId: string
    packageId: string
    paymentMethod?: string
    actualAmount?: number
    remark?: string
  }) => request.post<MemberCountCard>('/count-card/purchase', data),

  // 获取会员次卡列表
  list: (memberId: string) => request.get<MemberCountCard[]>(`/count-card/member/${memberId}`),

  // 获取单个会员次卡
  get: (id: string) => request.get<MemberCountCard>(`/count-card/member-card/${id}`),

  // 使用次卡
  use: (data: {
    memberCountCardId: string
    serviceId: string
    employeeId?: string
    count: number
    consumptionId?: string
  }) => request.post<MemberCountCard>('/count-card/use', data),

  // 获取会员可用次卡
  getAvailable: (memberId: string, serviceId?: string) => 
    serviceId 
      ? request.get<MemberCountCard[]>(`/count-card/available/${memberId}/service/${serviceId}`)
      : request.get<MemberCountCard[]>(`/count-card/available/${memberId}`),
}
