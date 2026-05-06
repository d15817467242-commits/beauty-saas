<template>
  <div class="sms-marketing">
    <el-row :gutter="20">
      <!-- 短信账户 -->
      <el-col :span="8">
        <el-card>
          <template #header>
            <span>短信账户</span>
          </template>
          <div class="account-info" v-if="account">
            <p><strong>服务商:</strong> {{ account.provider }}</p>
            <p><strong>余额:</strong> ¥{{ account.balance }}</p>
            <p><strong>累计充值:</strong> ¥{{ account.totalRecharge }}</p>
            <p><strong>累计消费:</strong> ¥{{ account.totalConsumed }}</p>
          </div>
          <el-button type="primary" class="mt-20" @click="rechargeDialogVisible = true">充值</el-button>
        </el-card>
      </el-col>

      <!-- 发送短信 -->
      <el-col :span="16">
        <el-card>
          <template #header>
            <span>发送短信</span>
          </template>
          <el-form :model="sendForm" label-width="100px">
            <el-form-item label="发送类型">
              <el-radio-group v-model="sendForm.sendType">
                <el-radio label="single">单个发送</el-radio>
                <el-radio label="batch">批量发送</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="手机号" v-if="sendForm.sendType === 'single'">
              <el-input v-model="sendForm.phone" placeholder="请输入手机号" />
            </el-form-item>
            <el-form-item label="手机号" v-else>
              <el-input v-model="sendForm.phones" type="textarea" :rows="4" placeholder="多个手机号用换行分隔" />
            </el-form-item>
            <el-form-item label="短信模板">
              <el-select v-model="sendForm.templateId" @change="loadTemplate">
                <el-option v-for="t in templates" :key="t.id" :label="t.name" :value="t.id" />
              </el-select>
            </el-form-item>
            <el-form-item label="短信内容">
              <el-input v-model="sendForm.content" type="textarea" :rows="4" :disabled="!!sendForm.templateId" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="sendSms">发送</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>
    </el-row>

    <!-- 发送记录 -->
    <el-card class="mt-20">
      <template #header>
        <span>发送记录</span>
      </template>
      <el-table :data="records" v-loading="loading">
        <el-table-column prop="phone" label="手机号" width="120" />
        <el-table-column prop="content" label="短信内容" show-overflow-tooltip />
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="statusTypeMap[row.status]">{{ statusMap[row.status] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="cost" label="费用" width="80">
          <template #default="{ row }">¥{{ row.cost }}</template>
        </el-table-column>
        <el-table-column prop="createdAt" label="发送时间" width="180" />
      </el-table>
    </el-card>

    <!-- 充值对话框 -->
    <el-dialog v-model="rechargeDialogVisible" title="短信充值" width="400px">
      <el-form label-width="80px">
        <el-form-item label="充值金额">
          <el-input-number v-model="rechargeAmount" :min="1" :precision="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rechargeDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="recharge">确认充值</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'

const loading = ref(false)
const account = ref<any>(null)
const templates = ref<any[]>([])
const records = ref<any[]>([])
const rechargeDialogVisible = ref(false)
const rechargeAmount = ref(100)

const sendForm = reactive({
  sendType: 'single',
  phone: '',
  phones: '',
  templateId: '',
  content: ''
})

const statusMap: Record<string, string> = {
  pending: '待发送',
  sent: '已发送',
  failed: '发送失败'
}

const statusTypeMap: Record<string, string> = {
  pending: 'info',
  sent: 'success',
  failed: 'danger'
}

onMounted(() => {
  loadAccount()
  loadTemplates()
  loadRecords()
})

async function loadAccount() {
  try {
    const res = await request.get('/sms/accounts')
    account.value = res.data[0]
  } catch (e) {
    console.error(e)
  }
}

async function loadTemplates() {
  try {
    const res = await request.get('/sms/templates')
    templates.value = res.data
  } catch (e) {
    console.error(e)
  }
}

async function loadRecords() {
  loading.value = true
  try {
    const res = await request.get('/sms/records')
    records.value = res.data.data
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

function loadTemplate() {
  const template = templates.value.find(t => t.id === sendForm.templateId)
  if (template) {
    sendForm.content = template.content
  }
}

async function sendSms() {
  try {
    if (sendForm.sendType === 'single') {
      await request.post('/sms/send/single', {
        phone: sendForm.phone,
        content: sendForm.content,
        templateId: sendForm.templateId
      })
    } else {
      const phones = sendForm.phones.split('\n').filter(p => p.trim())
      await request.post('/sms/send/batch', {
        phones,
        content: sendForm.content,
        templateId: sendForm.templateId
      })
    }
    ElMessage.success('发送成功')
    loadRecords()
    loadAccount()
  } catch (e) {
    console.error(e)
  }
}

async function recharge() {
  try {
    await request.post(`/sms/accounts/${account.value.id}/recharge`, {
      amount: rechargeAmount.value
    })
    ElMessage.success('充值成功')
    rechargeDialogVisible.value = false
    loadAccount()
  } catch (e) {
    console.error(e)
  }
}
</script>

<style scoped>
.sms-marketing {
  padding: 20px;
}
.mt-20 {
  margin-top: 20px;
}
.account-info p {
  margin: 8px 0;
}
</style>
