<template>
  <div class="member-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>会员管理</span>
          <div class="header-actions">
            <el-input v-model="searchKeyword" placeholder="搜索姓名/手机号" clearable style="width: 240px; margin-right: 12px;" @keyup.enter="loadMembers" @clear="loadMembers">
              <template #prefix><el-icon><Search /></el-icon></template>
            </el-input>
            <el-select v-model="searchLevel" placeholder="会员等级" clearable style="width: 140px; margin-right: 12px;" @change="loadMembers">
              <el-option label="普通会员" value="normal" />
              <el-option label="银卡会员" value="silver" />
              <el-option label="金卡会员" value="gold" />
              <el-option label="铂金会员" value="platinum" />
            </el-select>
            <el-button type="primary" @click="handleAdd" v-if="userStore.canCreate">新增会员</el-button>
          </div>
        </div>
      </template>
      <el-table :data="memberList" v-loading="loading" stripe @row-click="handleDetail" style="cursor: pointer;">
        <el-table-column prop="name" label="姓名" />
        <el-table-column prop="phone" label="手机号" />
        <el-table-column prop="level" label="会员等级">
          <template #default="{ row }">
            <el-tag :type="levelMap[row.level]?.type || 'info'">
              {{ levelMap[row.level]?.label || row.level }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="balance" label="余额">
          <template #default="{ row }">
            ¥{{ row.balance || 0 }}
          </template>
        </el-table-column>
        <el-table-column prop="points" label="积分">
          <template #default="{ row }">
            {{ row.points || 0 }}
          </template>
        </el-table-column>
        <el-table-column prop="visitCount" label="到店次数">
          <template #default="{ row }">
            {{ row.visitCount || 0 }}次
          </template>
        </el-table-column>
        <el-table-column prop="lastVisitAt" label="最后到店">
          <template #default="{ row }">
            {{ row.lastVisitAt ? new Date(row.lastVisitAt).toLocaleDateString() : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280">
          <template #default="{ row }">
            <el-button size="small" type="primary" @click.stop="handleDetail(row)">查看资料</el-button>
            <el-button size="small" @click.stop="handleEdit(row)" v-if="userStore.canEdit">编辑</el-button>
            <el-button size="small" type="success" @click.stop="handleRecharge(row)" v-if="userStore.canCashier">充值</el-button>
            <el-button size="small" type="danger" @click.stop="handleDelete(row)" v-if="userStore.canDelete">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑会员' : '新增会员'" width="500px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="会员姓名" required>
          <el-input v-model="form.name" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="手机号" required>
          <el-input v-model="form.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="性别">
          <el-radio-group v-model="form.gender">
            <el-radio value="男">男</el-radio>
            <el-radio value="女">女</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="生日">
          <el-date-picker v-model="form.birthday" type="date" placeholder="选择生日" style="width: 100%" />
        </el-form-item>
        <el-form-item label="会员等级">
          <el-select v-model="form.level" placeholder="请选择等级" style="width: 100%">
            <el-option label="普通会员" value="normal" />
            <el-option label="银卡会员" value="silver" />
            <el-option label="金卡会员" value="gold" />
            <el-option label="铂金会员" value="platinum" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 充值对话框 -->
    <el-dialog v-model="rechargeVisible" title="会员充值" width="400px">
      <el-form :model="rechargeForm" label-width="100px">
        <el-form-item label="会员">
          <span>{{ currentMember?.name }} ({{ currentMember?.phone }})</span>
        </el-form-item>
        <el-form-item label="当前余额">
          <span style="color: #f56c6c; font-size: 18px; font-weight: bold;">¥{{ currentMember?.balance || 0 }}</span>
        </el-form-item>
        <el-form-item label="充值金额" required>
          <el-input-number v-model="rechargeForm.amount" :min="1" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="赠送金额">
          <el-input-number v-model="rechargeForm.giftAmount" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="支付方式">
          <el-radio-group v-model="rechargeForm.paymentMethod">
            <el-radio value="cash">现金</el-radio>
            <el-radio value="wechat">微信</el-radio>
            <el-radio value="alipay">支付宝</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rechargeVisible = false">取消</el-button>
        <el-button type="primary" :loading="rechargeSubmitting" @click="handleRechargeSubmit">确认充值</el-button>
      </template>
    </el-dialog>

    <!-- 会员详情对话框 -->
    <el-dialog v-model="detailVisible" title="会员详情" width="1000px" top="5vh">
      <el-tabs v-model="detailTab">
        <!-- 基本信息 -->
        <el-tab-pane label="基本信息" name="basic">
          <el-descriptions :column="3" border v-if="memberDetail">
            <el-descriptions-item label="姓名">{{ memberDetail.name }}</el-descriptions-item>
            <el-descriptions-item label="手机号">{{ memberDetail.phone }}</el-descriptions-item>
            <el-descriptions-item label="会员等级">
              <el-tag :type="levelMap[memberDetail.level]?.type || 'info'">
                {{ levelMap[memberDetail.level]?.label || memberDetail.level }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="余额">¥{{ memberDetail.balance || 0 }}</el-descriptions-item>
            <el-descriptions-item label="积分">{{ memberDetail.points || 0 }}</el-descriptions-item>
            <el-descriptions-item label="到店次数">{{ memberDetail.visitCount || 0 }}次</el-descriptions-item>
            <el-descriptions-item label="累计消费">¥{{ memberDetail.totalSpent || 0 }}</el-descriptions-item>
            <el-descriptions-item label="最后到店">
              {{ memberDetail.lastVisitAt ? new Date(memberDetail.lastVisitAt).toLocaleDateString() : '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="注册时间">
              {{ new Date(memberDetail.createdAt).toLocaleDateString() }}
            </el-descriptions-item>
          </el-descriptions>

          <el-divider>消费记录</el-divider>

          <el-table :data="memberConsumptions" v-loading="consumptionsLoading" size="small" max-height="300">
            <el-table-column prop="orderNo" label="订单号" width="180" />
            <el-table-column prop="createdAt" label="时间" width="160">
              <template #default="{ row }">
                {{ new Date(row.createdAt).toLocaleString() }}
              </template>
            </el-table-column>
            <el-table-column prop="consumptionType" label="类型" width="80">
              <template #default="{ row }">
                {{ consumptionTypeMap[row.consumptionType] || row.consumptionType }}
              </template>
            </el-table-column>
            <el-table-column prop="amount" label="金额" width="100">
              <template #default="{ row }">
                ¥{{ row.amount }}
              </template>
            </el-table-column>
            <el-table-column prop="actualAmount" label="实收" width="100">
              <template #default="{ row }">
                ¥{{ row.actualAmount }}
              </template>
            </el-table-column>
            <el-table-column prop="paymentMethod" label="支付方式" width="100">
              <template #default="{ row }">
                {{ paymentMethodMap[row.paymentMethod] || row.paymentMethod }}
              </template>
            </el-table-column>
            <el-table-column label="消费项目">
              <template #default="{ row }">
                <span v-for="(item, idx) in row.items" :key="idx">
                  {{ item.serviceName }}x{{ item.quantity }}
                  <span v-if="idx < row.items.length - 1">, </span>
                </span>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <!-- 会员画像 - 懒加载 -->
        <el-tab-pane label="会员画像" name="profile">
          <MemberProfile v-if="detailTab === 'profile' && memberDetail" :member-id="memberDetail.id" />
        </el-tab-pane>

        <!-- 推荐关系 - 懒加载 -->
        <el-tab-pane label="推荐关系" name="referral">
          <MemberReferral
            v-if="detailTab === 'referral' && memberDetail"
            :member-id="memberDetail.id"
            @view-member="handleViewMember"
          />
        </el-tab-pane>
      </el-tabs>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import request from '@/utils/request'
import { useUserStore } from '@/stores/user'
import MemberProfile from '@/components/member/MemberProfile.vue'
import MemberReferral from '@/components/member/MemberReferral.vue'

const userStore = useUserStore()

const levelMap: Record<string, { label: string; type: string }> = {
  normal: { label: '普通会员', type: 'info' },
  silver: { label: '银卡会员', type: '' },
  gold: { label: '金卡会员', type: 'warning' },
  platinum: { label: '铂金会员', type: 'success' }
}

const consumptionTypeMap: Record<string, string> = {
  service: '服务',
  recharge: '充值',
  product: '产品'
}

const paymentMethodMap: Record<string, string> = {
  cash: '现金',
  wechat: '微信',
  alipay: '支付宝',
  card: '会员卡',
  count_card: '次卡',
  mixed: '混合支付'
}

const loading = ref(false)
const searchKeyword = ref('')
const searchLevel = ref('')
const submitting = ref(false)
const rechargeSubmitting = ref(false)
const consumptionsLoading = ref(false)
const memberList = ref<any[]>([])
const dialogVisible = ref(false)
const rechargeVisible = ref(false)
const detailVisible = ref(false)
const detailTab = ref('basic')
const isEdit = ref(false)
const editId = ref('')
const currentMember = ref<any>(null)
const memberDetail = ref<any>(null)
const memberConsumptions = ref<any[]>([])

const form = ref({
  name: '',
  phone: '',
  gender: '女',
  birthday: '',
  level: 'normal',
  remark: ''
})

const rechargeForm = ref({
  amount: 100,
  giftAmount: 0,
  paymentMethod: 'wechat'
})

const resetForm = () => {
  form.value = {
    name: '',
    phone: '',
    gender: '女',
    birthday: '',
    level: 'normal',
    remark: ''
  }
}

const loadMembers = async () => {
  loading.value = true
  try {
    const params: any = {}
    if (searchKeyword.value) params.keyword = searchKeyword.value
    if (searchLevel.value) params.level = searchLevel.value
    const res = await request.get('/members', { params })
    memberList.value = Array.isArray(res) ? res : (res.data || res.items || [])
  } catch (e) {
    ElMessage.error('加载失败')
  } finally {
    loading.value = false
  }
}

const handleAdd = () => {
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
}

const handleEdit = (row: any) => {
  isEdit.value = true
  editId.value = row.id
  form.value = {
    name: row.name,
    phone: row.phone,
    gender: row.gender || '女',
    birthday: row.birthday || '',
    level: row.level || 'normal',
    remark: row.remark || ''
  }
  dialogVisible.value = true
}

const handleDetail = async (row: any) => {
  currentMember.value = row
  detailTab.value = 'basic'
  detailVisible.value = true
  consumptionsLoading.value = true

  try {
    const res = await request.get(`/members/${row.id}/detail`)
    memberDetail.value = res
    memberConsumptions.value = res.consumptions || []
  } catch (e) {
    ElMessage.error('加载详情失败')
  } finally {
    consumptionsLoading.value = false
  }
}

const handleViewMember = (memberId: string) => {
  const member = memberList.value.find(m => m.id === memberId)
  if (member) {
    handleDetail(member)
  }
}

const handleRecharge = (row: any) => {
  currentMember.value = row
  rechargeForm.value = { amount: 100, giftAmount: 0, paymentMethod: 'wechat' }
  rechargeVisible.value = true
}

const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm('确定要删除该会员吗？', '提示', { type: 'warning' })
    await request.delete(`/members/${row.id}`)
    ElMessage.success('删除成功')
    loadMembers()
  } catch (e) {}
}

const handleSubmit = async () => {
  if (!form.value.name || !form.value.phone) {
    ElMessage.warning('请填写姓名和手机号')
    return
  }
  submitting.value = true
  try {
    if (isEdit.value) {
      await request.patch(`/members/${editId.value}`, form.value)
      ElMessage.success('修改成功')
    } else {
      await request.post('/members', form.value)
      ElMessage.success('添加成功')
    }
    dialogVisible.value = false
    loadMembers()
  } catch (e) {
    console.error(e)
  } finally {
    submitting.value = false
  }
}

const handleRechargeSubmit = async () => {
  if (!currentMember.value || rechargeForm.value.amount <= 0) {
    ElMessage.warning('请输入正确的充值金额')
    return
  }
  rechargeSubmitting.value = true
  try {
    await request.post(`/members/${currentMember.value.id}/recharge`, {
      amount: rechargeForm.value.amount,
      giftAmount: rechargeForm.value.giftAmount,
      paymentMethod: rechargeForm.value.paymentMethod
    })
    ElMessage.success('充值成功')
    rechargeVisible.value = false
    loadMembers()
  } catch (e) {
    console.error(e)
  } finally {
    rechargeSubmitting.value = false
  }
}

onMounted(loadMembers)
</script>

<style scoped>
.member-page {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  align-items: center;
}
</style>
