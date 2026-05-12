<template>
  <div class="cashier-page">
    <el-card>
      <template #header>
        <div class="header-actions">
          <span>收银台</span>
          <div class="header-buttons">
            <el-button type="success" @click="showOpenCardDialog">开卡</el-button>
            <el-button type="warning" @click="showMergeOrderDialog">合单</el-button>
          </div>
        </div>
      </template>
      <el-row :gutter="20">
        <el-col :span="16">
          <el-card shadow="never">
            <template #header>
              <div class="service-header">
                <span>选择服务/商品</span>
                <el-select v-model="selectedCategory" placeholder="全部分类" clearable style="width: 150px; margin-left: 10px" @change="filterByCategory">
                  <el-option label="全部" value="" />
                  <el-option-group label="服务分类">
                    <el-option v-for="cat in serviceCategories" :key="'service-' + cat.id" :label="cat.name" :value="'service-' + cat.id" />
                  </el-option-group>
                  <el-option-group label="商品分类">
                    <el-option v-for="cat in productCategories" :key="'product-' + cat.id" :label="cat.name" :value="'product-' + cat.id" />
                  </el-option-group>
                </el-select>
              </div>
            </template>
            <el-input v-model="searchKeyword" placeholder="搜索服务/商品项目" style="margin-bottom: 15px" @input="filterServices">
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
            <div class="service-list">
              <div 
                v-for="service in filteredServices" 
                :key="service.id" 
                class="service-item"
                :class="{ selected: selectedServices.find(s => s.id === service.id) }"
                @click="toggleService(service)"
              >
                <div class="service-info">
                  <div class="service-name">
                    <el-tag v-if="service.type === 'product'" size="small" type="info">商品</el-tag>
                    <el-tag v-else size="small" type="success">服务</el-tag>
                    {{ service.name }}
                  </div>
                  <div class="service-price">
                    <span v-if="service.memberPrice && service.memberPrice < service.price">
                      <span class="original-price">¥{{ service.price }}</span>
                      <span class="member-price">¥{{ service.memberPrice }}</span>
                    </span>
                    <span v-else>¥{{ service.price }}</span>
                  </div>
                </div>
                <div v-if="selectedServices.find(s => s.id === service.id)" class="service-count">
                  x{{ selectedServices.find(s => s.id === service.id)?.quantity || 1 }}
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card shadow="never">
            <template #header>
              <span>订单信息</span>
            </template>
            <el-form label-width="80px">
              <el-form-item label="客户类型">
                <el-radio-group v-model="customerType" @change="handleCustomerTypeChange">
                  <el-radio value="member">会员</el-radio>
                  <el-radio value="walkin">散客</el-radio>
                </el-radio-group>
              </el-form-item>
              <el-form-item v-if="customerType === 'member'" label="会员">
                <el-input v-model="selectedMemberName" placeholder="选择会员" readonly @click="showMemberDialog = true">
                  <template #append>
                    <el-button @click="showMemberDialog = true">选择</el-button>
                  </template>
                </el-input>
              </el-form-item>
              <el-form-item v-else label="散客信息">
                <el-input v-model="walkinName" placeholder="散客姓名（选填）" />
              </el-form-item>
              <el-form-item label="服务员工">
                <el-select v-model="selectedEmployee" placeholder="选择员工" style="width: 100%">
                  <el-option v-for="emp in employees" :key="emp.id" :label="emp.name" :value="emp.id" />
                </el-select>
              </el-form-item>
              
              <!-- 仓库选择 -->
              <el-form-item label="出货仓库">
                <el-select v-model="selectedWarehouse" placeholder="选择仓库" style="width: 100%" clearable>
                  <el-option v-for="wh in warehouses" :key="wh.id" :label="wh.name" :value="wh.id" />
                </el-select>
              </el-form-item>
              
              <!-- 折扣输入 -->
              <el-form-item label="折扣">
                <div style="display: flex; align-items: center; gap: 8px; width: 100%;">
                  <el-input-number v-model="discount" :min="1" :max="100" :step="1" style="flex: 1" @change="onDiscountChange" />
                  <span>%</span>
                  <el-tag v-if="discountSource === 'member' && memberDiscountRate" size="small" type="success">
                    会员{{ memberDiscountRate }}折
                  </el-tag>
                  <el-tag v-else-if="discount < 100" size="small" type="warning">
                    手动折扣
                  </el-tag>
                </div>
              </el-form-item>
              
              <!-- 手工单号 -->
              <el-form-item label="手工单号">
                <el-input v-model="manualOrderNo" placeholder="手工单号（选填）" clearable />
              </el-form-item>
              
              <el-form-item label="支付方式">
                <el-radio-group v-model="paymentMethod" @change="handlePaymentMethodChange">
                  <el-radio value="cash">现金</el-radio>
                  <el-radio value="wechat">微信</el-radio>
                  <el-radio value="alipay">支付宝</el-radio>
                  <el-radio v-if="customerType === 'member'" value="card">会员卡</el-radio>
                  <el-radio v-if="customerType === 'member'" value="count_card">次卡</el-radio>
                </el-radio-group>
              </el-form-item>
              
              <!-- 次卡选择 -->
              <el-form-item v-if="paymentMethod === 'count_card' && customerType === 'member'" label="选择次卡">
                <el-select v-model="selectedCountCard" placeholder="选择次卡" style="width: 100%" @change="handleCountCardChange">
                  <el-option 
                    v-for="card in availableCountCards" 
                    :key="card.id" 
                    :label="`${card.package?.name} (剩余${card.remainingCount}次)`"
                    :value="card.id"
                  />
                </el-select>
              </el-form-item>
            </el-form>
            <el-divider />
            <div class="selected-services">
              <div v-for="item in selectedServices" :key="item.id" class="selected-item">
                <span>{{ item.name }}</span>
                <span>x{{ item.quantity }}</span>
                <span v-if="paymentMethod !== 'count_card'">
                  <span v-if="item.originalPrice && item.originalPrice > item.price" style="color: #909399; font-size: 12px;">
                    ¥{{ item.originalPrice * item.quantity }}
                  </span>
                  <span style="color: #f56c6c;">¥{{ item.price * item.quantity }}</span>
                </span>
                <span v-else>{{ item.quantity }}次</span>
              </div>
            </div>
            <el-divider />
            <div class="order-summary">
              <div class="summary-item">
                <span>原价：</span>
                <span class="amount">¥{{ totalAmount }}</span>
              </div>
              <div v-if="discount < 100" class="summary-item">
                <span>折扣：</span>
                <span class="discount">{{ discount }}%</span>
              </div>
              <div class="summary-item total">
                <span>实收：</span>
                <span v-if="paymentMethod !== 'count_card'" class="amount">¥{{ finalAmount }}</span>
                <span v-else class="amount">{{ totalCount }}次</span>
              </div>
            </div>
            <el-button type="primary" size="large" style="width: 100%; margin-top: 20px" :loading="submitting" @click="handleSubmit">
              确认收款
            </el-button>
          </el-card>
        </el-col>
      </el-row>
    </el-card>

    <!-- 会员选择对话框 -->
    <el-dialog v-model="showMemberDialog" title="选择会员" width="700px">
      <el-input v-model="memberSearchKeyword" placeholder="输入姓名或手机号搜索" clearable @input="searchMember">
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      <div style="margin-top: 10px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center;">
        <span style="color: #909399; font-size: 12px;">{{ memberList.length ? `找到 ${memberList.length} 位会员` : '请输入关键词搜索' }}</span>
        <el-button size="small" type="primary" link @click="showQuickAddMember = true">快速新增会员</el-button>
      </div>
      <el-table :data="memberList" style="margin-top: 5px" @row-click="selectMember" highlight-current-row>
        <el-table-column prop="name" label="姓名" width="100" />
        <el-table-column prop="phone" label="手机号" width="130" />
        <el-table-column prop="level" label="等级" width="80">
          <template #default="{ row }">
            <el-tag size="small">{{ row.level || '普通' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="balance" label="余额" width="100">
          <template #default="{ row }">
            ¥{{ row.balance }}
          </template>
        </el-table-column>
        <el-table-column label="最近到店" width="120">
          <template #default="{ row }">
            {{ row.lastVisitAt ? new Date(row.lastVisitAt).toLocaleDateString() : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="次卡">
          <template #default="{ row }">
            <el-button size="small" @click.stop="showMemberCountCards(row)">查看</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <!-- 快速新增会员对话框 -->
    <el-dialog v-model="showQuickAddMember" title="快速新增会员" width="400px" append-to-body>
      <el-form label-width="80px">
        <el-form-item label="姓名" required>
          <el-input v-model="quickAddMember.name" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="quickAddMember.phone" placeholder="请输入手机号" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showQuickAddMember = false">取消</el-button>
        <el-button type="primary" :loading="quickAddLoading" @click="handleQuickAddMember">确认新增</el-button>
      </template>
    </el-dialog>

    <!-- 开卡专用会员选择对话框 -->
    <el-dialog v-model="showOpenCardMemberDialog" title="选择会员（开卡）" width="700px">
      <el-input v-model="openCardMemberSearch" placeholder="输入姓名或手机号搜索" clearable @input="searchOpenCardMember" />
      <el-table :data="openCardMemberList" style="margin-top: 15px" @row-click="selectOpenCardMember">
        <el-table-column prop="name" label="姓名" />
        <el-table-column prop="phone" label="手机号" />
        <el-table-column prop="level" label="等级" />
        <el-table-column prop="balance" label="余额">
          <template #default="{ row }">
            ¥{{ row.balance }}
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <!-- 会员次卡详情对话框 -->
    <el-dialog v-model="showCountCardDialog" title="会员次卡" width="600px">
      <el-table :data="memberCountCards" v-loading="countCardLoading">
        <el-table-column prop="package.name" label="次卡名称" />
        <el-table-column label="剩余次数">
          <template #default="{ row }">
            {{ row.remainingCount }} / {{ row.totalCount }}次
          </template>
        </el-table-column>
        <el-table-column prop="expireDate" label="过期日期">
          <template #default="{ row }">
            {{ row.expireDate ? new Date(row.expireDate).toLocaleDateString() : '永久有效' }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态">
          <template #default="{ row }">
            <el-tag :type="countCardStatusMap[row.status]?.type">
              {{ countCardStatusMap[row.status]?.label }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <!-- 开卡对话框 -->
    <el-dialog v-model="showOpenCard" title="会员开卡" width="600px">
      <el-form :model="openCardForm" label-width="100px">
        <el-form-item label="开卡方式">
          <el-radio-group v-model="openCardForm.mode">
            <el-radio value="existing">已有会员</el-radio>
            <el-radio value="new">新客户开卡</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="openCardForm.mode === 'existing'" label="选择会员">
          <el-input v-model="openCardForm.memberName" placeholder="选择会员" readonly @click="showOpenCardMemberDialog = true">
            <template #append>
              <el-button @click="showOpenCardMemberDialog = true">选择</el-button>
            </template>
          </el-input>
        </el-form-item>
        <template v-if="openCardForm.mode === 'new'">
          <el-form-item label="姓名" required>
            <el-input v-model="openCardForm.newName" placeholder="请输入客户姓名" />
          </el-form-item>
          <el-form-item label="手机号">
            <el-input v-model="openCardForm.newPhone" placeholder="请输入手机号" />
          </el-form-item>
        </template>
        <el-form-item label="卡类型">
          <el-select v-model="openCardForm.cardType" placeholder="选择卡类型" style="width: 100%">
            <el-option label="储值卡" value="stored" />
            <el-option label="次卡" value="count" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="openCardForm.cardType === 'count'" label="次卡套餐">
          <el-select v-model="openCardForm.packageId" placeholder="选择套餐" style="width: 100%">
            <el-option v-for="pkg in countPackages" :key="pkg.id" :label="`${pkg.name} (${pkg.totalCount}次/¥${pkg.price})`" :value="pkg.id" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="openCardForm.cardType === 'stored'" label="充值金额">
          <el-input-number v-model="openCardForm.amount" :min="0" :step="100" style="width: 100%" />
        </el-form-item>
        <el-form-item v-if="openCardForm.cardType === 'stored'" label="赠送金额">
          <el-input-number v-model="openCardForm.bonus" :min="0" :step="10" style="width: 100%" />
        </el-form-item>
        <el-form-item label="支付方式">
          <el-radio-group v-model="openCardForm.paymentMethod">
            <el-radio value="cash">现金</el-radio>
            <el-radio value="wechat">微信</el-radio>
            <el-radio value="alipay">支付宝</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showOpenCard = false">取消</el-button>
        <el-button type="primary" :loading="openCardSubmitting" @click="handleOpenCard">确认开卡</el-button>
      </template>
    </el-dialog>

    <!-- 合单对话框 -->
    <el-dialog v-model="showMergeOrder" title="订单合并" width="800px">
      <el-form :inline="true" style="margin-bottom: 15px">
        <el-form-item label="日期">
          <el-date-picker v-model="mergeDateRange" type="daterange" start-placeholder="开始日期" end-placeholder="结束日期" />
        </el-form-item>
        <el-form-item label="关键词">
          <el-input v-model="mergeKeyword" placeholder="订单号/会员姓名/手机号" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="searchMergeOrders">搜索</el-button>
        </el-form-item>
      </el-form>
      <el-table ref="mergeOrderTableRef" :data="mergeOrderList" @selection-change="handleMergeSelectionChange">
        <el-table-column type="selection" width="55" />
        <el-table-column prop="orderNo" label="订单号" width="150" />
        <el-table-column label="会员" width="100">
          <template #default="{ row }">
            {{ row.member?.name || '散客' }}
          </template>
        </el-table-column>
        <el-table-column label="金额" width="100">
          <template #default="{ row }">
            ¥{{ row.actualAmount }}
          </template>
        </el-table-column>
        <el-table-column label="时间" width="180">
          <template #default="{ row }">
            {{ new Date(row.createdAt).toLocaleString() }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.mergedTo" type="warning">已合并</el-tag>
            <el-tag v-else-if="row.cancelledAt" type="danger">已取消</el-tag>
            <el-tag v-else type="success">正常</el-tag>
          </template>
        </el-table-column>
      </el-table>
      <el-divider />
      <div v-if="selectedMergeOrders.length > 0" class="merge-summary">
        <h4>合并预览</h4>
        <p>选中订单: {{ selectedMergeOrders.length }} 笔</p>
        <p>合并金额: ¥{{ mergeTotalAmount }}</p>
      </div>
      <template #footer>
        <el-button @click="showMergeOrder = false">取消</el-button>
        <el-button type="primary" :disabled="selectedMergeOrders.length < 2" :loading="mergeSubmitting" @click="handleMergeOrders">确认合并</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'
import request from '@/utils/request'

const router = useRouter()

// 数据
const services = ref<any[]>([])
const employees = ref<any[]>([])
const memberList = ref<any[]>([])
const availableCountCards = ref<any[]>([])
const memberCountCards = ref<any[]>([])
const warehouses = ref<any[]>([])
const serviceCategories = ref<any[]>([])
const productCategories = ref<any[]>([])
const countPackages = ref<any[]>([])

// 状态
const searchKeyword = ref('')
const selectedCategory = ref('')
const customerType = ref<'member' | 'walkin'>('walkin')
const selectedMember = ref<any>(null)
const selectedMemberName = ref('')
const walkinName = ref('')
const selectedEmployee = ref('')
const selectedWarehouse = ref('')
const discount = ref(100)
const memberDiscountRate = ref<number | null>(null)
const discountSource = ref<'member' | 'manual'>('manual')
const manualOrderNo = ref('')
const paymentMethod = ref('cash')
const selectedServices = ref<any[]>([])
const showMemberDialog = ref(false)
const memberSearchKeyword = ref('')
let memberSearchTimer: ReturnType<typeof setTimeout> | null = null
const submitting = ref(false)
const selectedCountCard = ref('')
const showCountCardDialog = ref(false)
const countCardLoading = ref(false)

// 开卡相关
const showOpenCard = ref(false)
const openCardSubmitting = ref(false)
const showOpenCardMemberDialog = ref(false)
const openCardMemberSearch = ref('')
const openCardMemberList = ref<any[]>([])
let openCardSearchTimer: ReturnType<typeof setTimeout> | null = null
const openCardForm = ref({
  mode: 'new' as 'existing' | 'new',
  memberId: '',
  memberName: '',
  newName: '',
  newPhone: '',
  cardType: 'stored',
  packageId: '',
  amount: 0,
  bonus: 0,
  paymentMethod: 'cash'
})

// 合单相关
const showMergeOrder = ref(false)
const mergeDateRange = ref<[Date, Date] | null>(null)
const mergeKeyword = ref('')
const mergeOrderList = ref<any[]>([])
const selectedMergeOrders = ref<any[]>([])
const mergeSubmitting = ref(false)

const countCardStatusMap: Record<string, { label: string; type: string }> = {
  active: { label: '有效', type: 'success' },
  expired: { label: '已过期', type: 'danger' },
  used_up: { label: '已用完', type: 'info' }
}

// 快速新增会员
const showQuickAddMember = ref(false)
const quickAddLoading = ref(false)
const quickAddMember = ref({ name: '', phone: '' })

// 计算属性
const filteredServices = computed(() => {
  let result = services.value
  if (searchKeyword.value) {
    result = result.filter(s => s.name.includes(searchKeyword.value))
  }
  if (selectedCategory.value) {
    const [type, catId] = selectedCategory.value.split('-')
    result = result.filter(s => s.type === type && s.categoryId === catId)
  }
  return result
})

const totalAmount = computed(() => {
  return selectedServices.value.reduce((sum, item) => sum + item.price * item.quantity, 0)
})

const finalAmount = computed(() => {
  return Math.round(totalAmount.value * discount.value / 100 * 100) / 100
})

const totalCount = computed(() => {
  return selectedServices.value.reduce((sum, item) => sum + item.quantity, 0)
})

const mergeTotalAmount = computed(() => {
  return selectedMergeOrders.value.reduce((sum, order) => sum + Number(order.actualAmount || order.amount || 0), 0)
})

// 方法
const filterServices = () => {}

const filterByCategory = () => {}

const toggleService = (service: any) => {
  const existing = selectedServices.value.find(s => s.id === service.id)
  if (existing) {
    existing.quantity++
  } else {
    // 选了会员时自动使用会员价
    const usePrice = (selectedMember.value && service.memberPrice && service.memberPrice > 0 && service.memberPrice < service.price)
      ? service.memberPrice
      : service.price
    selectedServices.value.push({
      ...service,
      price: usePrice,
      originalPrice: service.price,
      quantity: 1
    })
  }
}

const handleCustomerTypeChange = () => {
  selectedMember.value = null
  selectedMemberName.value = ''
  walkinName.value = ''
  availableCountCards.value = []
  selectedCountCard.value = ''
  // 切换为散客时恢复原价和折扣
  if (customerType.value === 'walkin') {
    restoreOriginalPrice()
    discount.value = 100
    memberDiscountRate.value = null
    discountSource.value = 'manual'
  }
  if (paymentMethod.value === 'card' && customerType.value === 'walkin') {
    paymentMethod.value = 'cash'
  }
  if (paymentMethod.value === 'count_card' && customerType.value === 'walkin') {
    paymentMethod.value = 'cash'
  }
}

const handlePaymentMethodChange = async () => {
  if (paymentMethod.value === 'count_card' && selectedMember.value) {
    await loadAvailableCountCards()
  }
}

const loadAvailableCountCards = async () => {
  if (!selectedMember.value) return
  try {
    availableCountCards.value = await request.get(`/count-card/available/${selectedMember.value.id}`)
  } catch (e) {
    console.error(e)
  }
}

const handleCountCardChange = () => {
  // 次卡选择变化时的处理
}

const searchMember = () => {
  if (memberSearchTimer) clearTimeout(memberSearchTimer)
  memberSearchTimer = setTimeout(async () => {
    if (memberSearchKeyword.value.length < 1) {
      memberList.value = []
      return
    }
    try {
      memberList.value = await request.get(`/members?keyword=${memberSearchKeyword.value}`)
    } catch (e) {
      console.error(e)
    }
  }, 300)
}

const handleQuickAddMember = async () => {
  if (!quickAddMember.value.name) {
    ElMessage.warning('请输入姓名')
    return
  }
  quickAddLoading.value = true
  try {
    const newMember = await request.post('/members', {
      name: quickAddMember.value.name,
      phone: quickAddMember.value.phone || undefined,
    })
    ElMessage.success('会员创建成功')
    // 自动选中新会员
    selectMember(newMember)
    showQuickAddMember.value = false
    quickAddMember.value = { name: '', phone: '' }
  } catch (e) {
    // 拦截器已处理错误提示
  } finally {
    quickAddLoading.value = false
  }
}

const selectMember = async (row: any) => {
  selectedMember.value = row
  selectedMemberName.value = `${row.name} (${row.phone})`
  openCardForm.value.memberId = row.id
  openCardForm.value.memberName = `${row.name} (${row.phone})`
  showMemberDialog.value = false

  // 自动加载会员等级折扣
  try {
    const levelInfo = await request.get(`/member-levels/member/${row.id}/level-info`)
    if (levelInfo.currentLevel?.discountRate) {
      // discountRate 如 0.95 表示95折，转换为百分比
      memberDiscountRate.value = Math.round(levelInfo.currentLevel.discountRate * 100)
      discount.value = memberDiscountRate.value
      discountSource.value = 'member'
    } else {
      // 没有等级折扣率，保持100%
      memberDiscountRate.value = null
      discount.value = 100
      discountSource.value = 'manual'
    }
  } catch (e) {
    console.error('加载会员等级失败', e)
  }

  // 已选服务项目自动切换为会员价
  applyMemberPrice()

  // 如果支付方式是次卡，加载可用次卡
  if (paymentMethod.value === 'count_card') {
    await loadAvailableCountCards()
  }
}

const showMemberCountCards = async (row: any) => {
  showCountCardDialog.value = true
  countCardLoading.value = true
  try {
    memberCountCards.value = await request.get(`/count-card/member/${row.id}`)
  } catch (e) {
    ElMessage.error('加载次卡失败')
  } finally {
    countCardLoading.value = false
  }
}

const handleSubmit = async () => {
  if (selectedServices.value.length === 0) {
    ElMessage.warning('请先选择服务项目')
    return
  }

  if (customerType.value === 'member' && !selectedMember.value) {
    ElMessage.warning('请选择会员')
    return
  }

  if (paymentMethod.value === 'count_card' && !selectedCountCard.value) {
    ElMessage.warning('请选择次卡')
    return
  }

  // 收款确认弹窗
  try {
    let confirmMsg = ''
    if (paymentMethod.value === 'count_card') {
      confirmMsg = `确认使用次卡消费 ${totalCount.value} 次吗？`
    } else {
      confirmMsg = `确认收款 ¥${finalAmount.value}？`
      if (discount.value < 100) {
        confirmMsg += `\n（原价 ¥${totalAmount.value}，${discountSource.value === 'member' ? '会员' : '手动'}${discount.value}%折）`
      }
    }
    await ElMessageBox.confirm(confirmMsg, '收款确认', {
      confirmButtonText: '确认收款',
      cancelButtonText: '取消',
      type: 'warning',
    })
  } catch {
    return
  }

  submitting.value = true
  try {
    if (paymentMethod.value === 'count_card') {
      // 次卡支付
      for (const service of selectedServices.value) {
        await request.post('/count-card/use', {
          memberCountCardId: selectedCountCard.value,
          serviceId: service.id,
          employeeId: selectedEmployee.value || undefined,
          count: service.quantity
        })
      }
      ElMessage.success('次卡消费成功！')
    } else {
      // 普通支付
      const orderData = {
        memberId: customerType.value === 'member' ? selectedMember.value?.id : null,
        paymentMethod: paymentMethod.value,
        items: selectedServices.value.map(s => ({
          serviceId: s.id,
          serviceName: s.name,
          price: s.price,
          quantity: s.quantity,
          amount: s.price * s.quantity,
          employeeId: selectedEmployee.value || null
        })),
        actualAmount: finalAmount.value,
        employeeId: selectedEmployee.value || null,
        remark: customerType.value === 'walkin' ? `散客: ${walkinName.value || '匿名'}` : ''
      }

      await request.post('/cashier/consume', orderData)
      ElMessage.success('收款成功！')
    }

    // 重置
    selectedServices.value = []
    selectedMember.value = null
    selectedMemberName.value = ''
    walkinName.value = ''
    selectedCountCard.value = ''
    availableCountCards.value = []
    discount.value = 100
    memberDiscountRate.value = null
    discountSource.value = 'manual'
    manualOrderNo.value = ''
    selectedWarehouse.value = ''
  } catch (e) {
    ElMessage.error('网络错误')
  } finally {
    submitting.value = false
  }
}

// 开卡功能
const showOpenCardDialog = () => {
  // 如果收银台已选会员，默认用已有会员
  if (selectedMember.value) {
    openCardForm.value.mode = 'existing'
    openCardForm.value.memberId = selectedMember.value.id
    openCardForm.value.memberName = selectedMemberName.value
  } else {
    openCardForm.value.mode = 'new'
    openCardForm.value.memberId = ''
    openCardForm.value.memberName = ''
    openCardForm.value.newName = ''
    openCardForm.value.newPhone = ''
  }
  showOpenCard.value = true
}

const handleOpenCard = async () => {
  // 校验
  if (openCardForm.value.mode === 'existing' && !openCardForm.value.memberId) {
    ElMessage.warning('请选择会员')
    return
  }
  if (openCardForm.value.mode === 'new' && !openCardForm.value.newName) {
    ElMessage.warning('请输入客户姓名')
    return
  }
  if (openCardForm.value.cardType === 'count' && !openCardForm.value.packageId) {
    ElMessage.warning('请选择次卡套餐')
    return
  }
  if (openCardForm.value.cardType === 'stored' && openCardForm.value.amount <= 0) {
    ElMessage.warning('请输入充值金额')
    return
  }

  openCardSubmitting.value = true
  try {
    if (openCardForm.value.mode === 'new') {
      // 新客户开卡：先创建会员再开卡
      const newMember = await request.post('/members', {
        name: openCardForm.value.newName,
        phone: openCardForm.value.newPhone || undefined,
      })
      openCardForm.value.memberId = newMember.id
    }

    if (openCardForm.value.cardType === 'count') {
      // 开次卡
      await request.post('/count-card/open', {
        memberId: openCardForm.value.memberId,
        packageId: openCardForm.value.packageId,
        paymentMethod: openCardForm.value.paymentMethod
      })
      ElMessage.success('次卡开通成功！')
      showOpenCard.value = false
    } else {
      // 储值卡充值
      await request.post('/member/recharge', {
        memberId: openCardForm.value.memberId,
        amount: openCardForm.value.amount,
        bonus: openCardForm.value.bonus,
        paymentMethod: openCardForm.value.paymentMethod
      })
      ElMessage.success('充值成功！')
      showOpenCard.value = false
    }
  } catch (e) {
    // 拦截器已处理错误提示
  } finally {
    openCardSubmitting.value = false
  }
}

// 开卡专用会员搜索
const searchOpenCardMember = () => {
  if (openCardSearchTimer) clearTimeout(openCardSearchTimer)
  openCardSearchTimer = setTimeout(async () => {
    if (openCardMemberSearch.value.length < 1) {
      openCardMemberList.value = []
      return
    }
    try {
      openCardMemberList.value = await request.get(`/members?keyword=${openCardMemberSearch.value}`)
    } catch (e) {
      console.error(e)
    }
  }, 300)
}

const selectOpenCardMember = (row: any) => {
  openCardForm.value.memberId = row.id
  openCardForm.value.memberName = `${row.name} (${row.phone})`
  showOpenCardMemberDialog.value = false
}

// 手动修改折扣时切换来源
const onDiscountChange = (val: number) => {
  if (memberDiscountRate.value && val !== memberDiscountRate.value) {
    discountSource.value = 'manual'
  } else if (memberDiscountRate.value && val === memberDiscountRate.value) {
    discountSource.value = 'member'
  }
}

// 会员价自动应用
const applyMemberPrice = () => {
  if (!selectedMember.value) return
  selectedServices.value.forEach(item => {
    if (item.memberPrice && item.memberPrice > 0 && item.memberPrice < item.price) {
      item.originalPrice = item.price
      item.price = item.memberPrice
    }
  })
}

// 恢复原价（取消会员选择时）
const restoreOriginalPrice = () => {
  selectedServices.value.forEach(item => {
    if (item.originalPrice && item.originalPrice > 0) {
      item.price = item.originalPrice
      item.originalPrice = undefined
    }
  })
}

// 合单功能
const showMergeOrderDialog = () => {
  showMergeOrder.value = true
  searchMergeOrders()
}

const searchMergeOrders = async () => {
  try {
    const params = new URLSearchParams()
    if (mergeDateRange.value) {
      params.append('startDate', new Date(mergeDateRange.value[0]).toISOString().split('T')[0])
      params.append('endDate', new Date(mergeDateRange.value[1]).toISOString().split('T')[0])
    }
    if (mergeKeyword.value) {
      params.append('keyword', mergeKeyword.value)
    }

    const data = await request.get(`/cashier/documents?${params.toString()}`)
    mergeOrderList.value = data.data || data
  } catch (e) {
    ElMessage.error('加载订单失败')
  }
}

const handleMergeSelectionChange = (selection: any[]) => {
  selectedMergeOrders.value = selection
}

const handleMergeOrders = async () => {
  if (selectedMergeOrders.value.length < 2) {
    ElMessage.warning('请至少选择两个订单')
    return
  }

  mergeSubmitting.value = true
  try {
    await request.post('/cashier/merge', {
      orderIds: selectedMergeOrders.value.map(o => o.id)
    })
    ElMessage.success('订单合并成功！')
    showMergeOrder.value = false
    selectedMergeOrders.value = []
  } catch (e) {
    // 拦截器已处理错误提示
  } finally {
    mergeSubmitting.value = false
  }
}

// 加载数据
onMounted(async () => {
  try {
    const [products, employeesData, warehousesData, serviceCatData, productCatData, packagesData] = await Promise.all([
      request.get('/products'),
      request.get('/employees'),
      request.get('/warehouse'),
      request.get('/service-category'),
      request.get('/product-category'),
      request.get('/count-card/packages')
    ])
    services.value = products
    employees.value = employeesData
    warehouses.value = warehousesData
    serviceCategories.value = serviceCatData
    productCategories.value = productCatData
    countPackages.value = packagesData
  } catch (e) {
    console.error(e)
  }
})
</script>

<style scoped>
.cashier-page {
  padding: 20px;
}

.header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-buttons {
  display: flex;
  gap: 10px;
}

.service-header {
  display: flex;
  align-items: center;
}

.service-list {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.service-item {
  padding: 15px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.service-item:hover {
  border-color: #409eff;
}

.service-item.selected {
  border-color: #409eff;
  background: #ecf5ff;
}

.service-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.service-name {
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 5px;
}

.service-price {
  color: #f56c6c;
  font-weight: bold;
}

.original-price {
  color: #909399;
  font-size: 12px;
  text-decoration: line-through;
  margin-right: 5px;
}

.member-price {
  color: #f56c6c;
  font-weight: bold;
}

.service-count {
  text-align: center;
  margin-top: 5px;
  color: #409eff;
}

.selected-services {
  max-height: 200px;
  overflow-y: auto;
}

.selected-item {
  display: flex;
  justify-content: space-between;
  padding: 5px 0;
  border-bottom: 1px dashed #e4e7ed;
}

.order-summary {
  text-align: right;
}

.summary-item {
  font-size: 16px;
  margin-bottom: 5px;
}

.summary-item.total {
  font-size: 18px;
  font-weight: bold;
}

.amount {
  font-size: 24px;
  color: #f56c6c;
  font-weight: bold;
}

.discount {
  color: #e6a23c;
  font-weight: bold;
}

.merge-summary {
  padding: 15px;
  background: #f5f7fa;
  border-radius: 4px;
}

.merge-summary h4 {
  margin: 0 0 10px 0;
}

.merge-summary p {
  margin: 5px 0;
}
</style>
