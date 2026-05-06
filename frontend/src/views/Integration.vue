<template>
  <div class="integration-page">
    <el-card>
      <template #header>
        <span>第三方对接</span>
      </template>
      
      <el-tabs v-model="activeTab">
        <!-- 美团对接 -->
        <el-tab-pane label="美团对接" name="meituan">
          <el-form :model="meituanConfig" label-width="120px" style="max-width: 600px">
            <el-form-item label="AppKey">
              <el-input v-model="meituanConfig.appKey" />
            </el-form-item>
            <el-form-item label="AppSecret">
              <el-input v-model="meituanConfig.appSecret" type="password" />
            </el-form-item>
            <el-form-item label="门店编码">
              <el-input v-model="meituanConfig.shopId" />
            </el-form-item>
            <el-form-item label="是否启用">
              <el-switch v-model="meituanConfig.isActive" />
            </el-form-item>
            <el-divider content-position="left">同步设置</el-divider>
            <el-form-item label="同步服务项目">
              <el-switch v-model="meituanConfig.syncSettings.syncServices" />
            </el-form-item>
            <el-form-item label="同步会员">
              <el-switch v-model="meituanConfig.syncSettings.syncMembers" />
            </el-form-item>
            <el-form-item label="同步订单">
              <el-switch v-model="meituanConfig.syncSettings.syncOrders" />
            </el-form-item>
            <el-form-item label="核销团购券">
              <el-switch v-model="meituanConfig.syncSettings.verifyCoupons" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="saveMeituanConfig">保存配置</el-button>
              <el-button @click="syncMeituanCoupons">同步券码</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
        
        <!-- 抖音核销 -->
        <el-tab-pane label="抖音核销" name="douyin">
          <el-form :model="douyinConfig" label-width="120px" style="max-width: 600px">
            <el-form-item label="AppID">
              <el-input v-model="douyinConfig.appId" />
            </el-form-item>
            <el-form-item label="AppSecret">
              <el-input v-model="douyinConfig.appSecret" type="password" />
            </el-form-item>
            <el-form-item label="店铺ID">
              <el-input v-model="douyinConfig.shopId" />
            </el-form-item>
            <el-form-item label="是否启用">
              <el-switch v-model="douyinConfig.isActive" />
            </el-form-item>
            <el-divider content-position="left">核销设置</el-divider>
            <el-form-item label="自动核销">
              <el-switch v-model="douyinConfig.verifySettings.autoVerify" />
            </el-form-item>
            <el-form-item label="核销备注">
              <el-input v-model="douyinConfig.verifySettings.verifyRemark" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="saveDouyinConfig">保存配置</el-button>
              <el-button @click="syncDouyinCoupons">同步券码</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
        
        <!-- 微信公众号 -->
        <el-tab-pane label="微信公众号" name="wechat">
          <el-form :model="wechatConfig" label-width="120px" style="max-width: 600px">
            <el-form-item label="AppID">
              <el-input v-model="wechatConfig.appId" />
            </el-form-item>
            <el-form-item label="AppSecret">
              <el-input v-model="wechatConfig.appSecret" type="password" />
            </el-form-item>
            <el-form-item label="商户号">
              <el-input v-model="wechatConfig.mchId" />
            </el-form-item>
            <el-form-item label="API密钥">
              <el-input v-model="wechatConfig.apiKey" type="password" />
            </el-form-item>
            <el-form-item label="是否启用">
              <el-switch v-model="wechatConfig.isActive" />
            </el-form-item>
            <el-divider content-position="left">功能设置</el-divider>
            <el-form-item label="网页授权">
              <el-switch v-model="wechatConfig.features.oauth" />
            </el-form-item>
            <el-form-item label="微信支付">
              <el-switch v-model="wechatConfig.features.pay" />
            </el-form-item>
            <el-form-item label="关注推送">
              <el-switch v-model="wechatConfig.features.subscribe" />
            </el-form-item>
            <el-form-item label="模板消息">
              <el-switch v-model="wechatConfig.features.templateMessage" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="saveWechatConfig">保存配置</el-button>
              <el-button type="success" @click="authorizeWechat">授权公众号</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
        
        <!-- 券码核销 -->
        <el-tab-pane label="券码核销" name="verify">
          <el-card shadow="never" style="margin-bottom: 20px">
            <el-form :inline="true">
              <el-form-item label="券码">
                <el-input v-model="verifyCode" placeholder="输入券码" style="width: 300px" />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="queryCoupon">查询</el-button>
                <el-button type="success" @click="verifyCoupon" :disabled="!currentCoupon">核销</el-button>
              </el-form-item>
            </el-form>
          </el-card>
          
          <el-card v-if="currentCoupon" shadow="never" style="margin-bottom: 20px">
            <template #header>
              <span>券码信息</span>
            </template>
            <el-descriptions :column="3" border>
              <el-descriptions-item label="券码">{{ currentCoupon.couponCode }}</el-descriptions-item>
              <el-descriptions-item label="平台">
                <el-tag :type="currentCoupon.platform === 'meituan' ? 'warning' : 'danger'">
                  {{ currentCoupon.platform === 'meituan' ? '美团' : '抖音' }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="状态">
                <el-tag :type="couponStatusTypes[currentCoupon.status]">
                  {{ couponStatusNames[currentCoupon.status] }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="券名称">{{ currentCoupon.couponName }}</el-descriptions-item>
              <el-descriptions-item label="面值">¥{{ currentCoupon.faceValue }}</el-descriptions-item>
              <el-descriptions-item label="售价">¥{{ currentCoupon.sellPrice }}</el-descriptions-item>
              <el-descriptions-item label="过期时间">
                {{ currentCoupon.expireAt ? new Date(currentCoupon.expireAt).toLocaleDateString() : '永久有效' }}
              </el-descriptions-item>
            </el-descriptions>
          </el-card>
          
          <el-table :data="coupons" border>
            <el-table-column prop="couponCode" label="券码" width="180" />
            <el-table-column prop="platform" label="平台" width="100">
              <template #default="{ row }">
                <el-tag :type="row.platform === 'meituan' ? 'warning' : 'danger'">
                  {{ row.platform === 'meituan' ? '美团' : '抖音' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="couponName" label="券名称" />
            <el-table-column prop="faceValue" label="面值" width="100">
              <template #default="{ row }">
                ¥{{ row.faceValue }}
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="couponStatusTypes[row.status]">
                  {{ couponStatusNames[row.status] }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="verifiedAt" label="核销时间" width="180">
              <template #default="{ row }">
                {{ row.verifiedAt ? new Date(row.verifiedAt).toLocaleString() : '-' }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100">
              <template #default="{ row }">
                <el-button 
                  v-if="row.status === 'pending'" 
                  type="success" 
                  size="small" 
                  @click="verifyCouponDirect(row)"
                >
                  核销
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        
        <!-- 统计 -->
        <el-tab-pane label="统计" name="statistics">
          <el-row :gutter="20">
            <el-col :span="6">
              <el-statistic title="总券码数" :value="couponStats.total" />
            </el-col>
            <el-col :span="6">
              <el-statistic title="待核销" :value="couponStats.pending" />
            </el-col>
            <el-col :span="6">
              <el-statistic title="已核销" :value="couponStats.verified" />
            </el-col>
            <el-col :span="6">
              <el-statistic title="核销金额" :value="couponStats.verifiedAmount" :precision="2" prefix="¥" />
            </el-col>
          </el-row>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const API_BASE = 'http://localhost:3000/api'
const token = localStorage.getItem('token') || ''

const activeTab = ref('meituan')

const couponStatusNames: Record<string, string> = { pending: '待核销', verified: '已核销', refunded: '已退款', expired: '已过期' }
const couponStatusTypes: Record<string, string> = { pending: 'warning', verified: 'success', refunded: 'info', expired: 'danger' }

const meituanConfig = ref<any>({
  storeId: 'default',
  appKey: '',
  appSecret: '',
  shopId: '',
  isActive: false,
  syncSettings: { syncServices: true, syncMembers: true, syncOrders: true, verifyCoupons: true }
})

const douyinConfig = ref<any>({
  storeId: 'default',
  appId: '',
  appSecret: '',
  shopId: '',
  isActive: false,
  verifySettings: { autoVerify: false, verifyRemark: '' }
})

const wechatConfig = ref<any>({
  storeId: 'default',
  appId: '',
  appSecret: '',
  mchId: '',
  apiKey: '',
  isActive: false,
  features: { oauth: true, pay: true, subscribe: true, templateMessage: true }
})

const verifyCode = ref('')
const currentCoupon = ref<any>(null)
const coupons = ref<any[]>([])

const couponStats = ref({
  total: 0,
  pending: 0,
  verified: 0,
  verifiedAmount: 0
})

const loadConfigs = async () => {
  try {
    const [meituanRes, douyinRes, wechatRes] = await Promise.all([
      fetch(`${API_BASE}/integration/meituan?storeId=default`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${API_BASE}/integration/douyin?storeId=default`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${API_BASE}/integration/wechat?storeId=default`, { headers: { Authorization: `Bearer ${token}` } })
    ])
    
    const meituanData = await meituanRes.json()
    const douyinData = await douyinRes.json()
    const wechatData = await wechatRes.json()
    
    if (meituanData) meituanConfig.value = { ...meituanConfig.value, ...meituanData }
    if (douyinData) douyinConfig.value = { ...douyinConfig.value, ...douyinData }
    if (wechatData) wechatConfig.value = { ...wechatConfig.value, ...wechatData }
  } catch (e) {
    console.error(e)
  }
}

const loadCoupons = async () => {
  try {
    const [couponsRes, statsRes] = await Promise.all([
      fetch(`${API_BASE}/integration/coupons?pageSize=20`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${API_BASE}/integration/coupon/statistics`, { headers: { Authorization: `Bearer ${token}` } })
    ])
    
    const couponsData = await couponsRes.json()
    coupons.value = couponsData.data
    
    couponStats.value = await statsRes.json()
  } catch (e) {
    console.error(e)
  }
}

const saveMeituanConfig = async () => {
  try {
    await fetch(`${API_BASE}/integration/meituan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(meituanConfig.value)
    })
    ElMessage.success('保存成功')
  } catch (e) {
    ElMessage.error('保存失败')
  }
}

const saveDouyinConfig = async () => {
  try {
    await fetch(`${API_BASE}/integration/douyin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(douyinConfig.value)
    })
    ElMessage.success('保存成功')
  } catch (e) {
    ElMessage.error('保存失败')
  }
}

const saveWechatConfig = async () => {
  try {
    await fetch(`${API_BASE}/integration/wechat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(wechatConfig.value)
    })
    ElMessage.success('保存成功')
  } catch (e) {
    ElMessage.error('保存失败')
  }
}

const syncMeituanCoupons = async () => {
  try {
    const res = await fetch(`${API_BASE}/integration/coupons/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ platform: 'meituan', storeId: 'default' })
    })
    const data = await res.json()
    ElMessage.success(`同步成功，共${data.count}条`)
    loadCoupons()
  } catch (e) {
    ElMessage.error('同步失败')
  }
}

const syncDouyinCoupons = async () => {
  try {
    const res = await fetch(`${API_BASE}/integration/coupons/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ platform: 'douyin', storeId: 'default' })
    })
    const data = await res.json()
    ElMessage.success(`同步成功，共${data.count}条`)
    loadCoupons()
  } catch (e) {
    ElMessage.error('同步失败')
  }
}

const authorizeWechat = () => {
  ElMessage.info('请前往微信公众平台进行授权')
}

const queryCoupon = async () => {
  if (!verifyCode.value) {
    ElMessage.warning('请输入券码')
    return
  }
  
  try {
    const res = await fetch(`${API_BASE}/integration/coupon/query?code=${verifyCode.value}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    currentCoupon.value = await res.json()
  } catch (e) {
    ElMessage.error('券码不存在')
    currentCoupon.value = null
  }
}

const verifyCoupon = async () => {
  if (!currentCoupon.value) return
  
  await ElMessageBox.confirm('确定核销该券码？', '提示', { type: 'warning' })
  
  try {
    await fetch(`${API_BASE}/integration/coupon/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ code: currentCoupon.value.couponCode })
    })
    
    ElMessage.success('核销成功')
    currentCoupon.value = null
    verifyCode.value = ''
    loadCoupons()
  } catch (e) {
    ElMessage.error('核销失败')
  }
}

const verifyCouponDirect = async (row: any) => {
  await ElMessageBox.confirm('确定核销该券码？', '提示', { type: 'warning' })
  
  try {
    await fetch(`${API_BASE}/integration/coupon/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ code: row.couponCode })
    })
    
    ElMessage.success('核销成功')
    loadCoupons()
  } catch (e) {
    ElMessage.error('核销失败')
  }
}

onMounted(() => {
  loadConfigs()
  loadCoupons()
})
</script>

<style scoped>
.integration-page {
  padding: 20px;
}
</style>
