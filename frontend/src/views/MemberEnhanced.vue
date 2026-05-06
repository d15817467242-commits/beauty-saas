<template>
  <div class="member-enhanced-page">
    <el-tabs v-model="activeTab" type="border-card">
      <!-- 会员标签 -->
      <el-tab-pane label="会员标签" name="tags">
        <div class="toolbar">
          <el-button type="primary" @click="showTagDialog()">新增标签</el-button>
        </div>
        <el-row :gutter="16">
          <el-col :span="8" v-for="tag in tags" :key="tag.id">
            <el-card class="tag-card" :body-style="{ padding: '16px' }">
              <div class="tag-header">
                <el-tag :color="tag.color" style="color: white;">{{ tag.name }}</el-tag>
                <div>
                  <el-button link @click="showTagDialog(tag)">编辑</el-button>
                  <el-button link type="danger" @click="deleteTag(tag.id)">删除</el-button>
                </div>
              </div>
              <div class="tag-desc">{{ tag.description || '暂无描述' }}</div>
              <div class="tag-count">{{ tag.memberCount || 0 }} 位会员</div>
            </el-card>
          </el-col>
        </el-row>
      </el-tab-pane>

      <!-- 消费排行榜 -->
      <el-tab-pane label="消费排行" name="ranking">
        <div class="toolbar">
          <el-date-picker v-model="rankingMonth" type="month" placeholder="选择月份" />
          <el-button type="primary" @click="loadRanking" style="margin-left: 8px;">查询</el-button>
        </div>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-card>
              <template #header>消费排行榜 TOP 10</template>
              <el-table :data="spendRanking" stripe>
                <el-table-column label="排名" width="60">
                  <template #default="{ $index }">
                    <el-tag v-if="$index < 3" :type="['danger', 'warning', 'success'][$index]">{{ $index + 1 }}</el-tag>
                    <span v-else>{{ $index + 1 }}</span>
                  </template>
                </el-table-column>
                <el-table-column prop="member.name" label="会员" />
                <el-table-column prop="member.phone" label="手机号" />
                <el-table-column prop="totalSpent" label="消费总额">
                  <template #default="{ row }">¥{{ row.totalSpent }}</template>
                </el-table-column>
              </el-table>
            </el-card>
          </el-col>
          <el-col :span="12">
            <el-card>
              <template #header>到店排行榜 TOP 10</template>
              <el-table :data="visitRanking" stripe>
                <el-table-column label="排名" width="60">
                  <template #default="{ $index }">
                    <el-tag v-if="$index < 3" :type="['danger', 'warning', 'success'][$index]">{{ $index + 1 }}</el-tag>
                    <span v-else>{{ $index + 1 }}</span>
                  </template>
                </el-table-column>
                <el-table-column prop="member.name" label="会员" />
                <el-table-column prop="member.phone" label="手机号" />
                <el-table-column prop="visitCount" label="到店次数" />
              </el-table>
            </el-card>
          </el-col>
        </el-row>
      </el-tab-pane>

      <!-- 积分兑换 -->
      <el-tab-pane label="积分兑换" name="exchange">
        <div class="toolbar">
          <el-button type="primary" @click="showExchangeRuleDialog()">新增兑换规则</el-button>
        </div>
        <el-table :data="exchangeRules" stripe>
          <el-table-column prop="name" label="规则名称" />
          <el-table-column prop="pointsRequired" label="所需积分" />
          <el-table-column prop="rewardAmount" label="奖励金额">
            <template #default="{ row }">¥{{ row.rewardAmount || 0 }}</template>
          </el-table-column>
          <el-table-column prop="isActive" label="状态">
            <template #default="{ row }">
              <el-tag :type="row.isActive ? 'success' : 'info'">{{ row.isActive ? '启用' : '停用' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150">
            <template #default="{ row }">
              <el-button link @click="showExchangeRuleDialog(row)">编辑</el-button>
              <el-button link type="danger" @click="deleteExchangeRule(row.id)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- 门店管理 -->
      <el-tab-pane label="门店管理" name="stores">
        <div class="toolbar">
          <el-button type="primary" @click="showStoreDialog()">新增门店</el-button>
        </div>
        <el-table :data="stores" stripe>
          <el-table-column prop="name" label="门店名称" />
          <el-table-column prop="code" label="门店编码" />
          <el-table-column prop="address" label="地址" />
          <el-table-column prop="phone" label="电话" />
          <el-table-column prop="isActive" label="状态">
            <template #default="{ row }">
              <el-tag :type="row.isActive ? 'success' : 'info'">{{ row.isActive ? '启用' : '停用' }}</el-tag>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <!-- 标签对话框 -->
    <el-dialog v-model="tagDialogVisible" title="会员标签" width="400px">
      <el-form :model="tagForm" label-width="80px">
        <el-form-item label="标签名称">
          <el-input v-model="tagForm.name" />
        </el-form-item>
        <el-form-item label="标签颜色">
          <el-color-picker v-model="tagForm.color" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="tagForm.description" type="textarea" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="tagDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveTag">保存</el-button>
      </template>
    </el-dialog>

    <!-- 兑换规则对话框 -->
    <el-dialog v-model="exchangeRuleDialogVisible" title="积分兑换规则" width="400px">
      <el-form :model="exchangeRuleForm" label-width="100px">
        <el-form-item label="规则名称">
          <el-input v-model="exchangeRuleForm.name" />
        </el-form-item>
        <el-form-item label="所需积分">
          <el-input-number v-model="exchangeRuleForm.pointsRequired" :min="1" />
        </el-form-item>
        <el-form-item label="奖励金额">
          <el-input-number v-model="exchangeRuleForm.rewardAmount" :min="0" />
        </el-form-item>
        <el-form-item label="启用">
          <el-switch v-model="exchangeRuleForm.isActive" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="exchangeRuleDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveExchangeRule">保存</el-button>
      </template>
    </el-dialog>

    <!-- 门店对话框 -->
    <el-dialog v-model="storeDialogVisible" title="门店" width="500px">
      <el-form :model="storeForm" label-width="80px">
        <el-form-item label="门店名称">
          <el-input v-model="storeForm.name" />
        </el-form-item>
        <el-form-item label="门店编码">
          <el-input v-model="storeForm.code" />
        </el-form-item>
        <el-form-item label="地址">
          <el-input v-model="storeForm.address" />
        </el-form-item>
        <el-form-item label="电话">
          <el-input v-model="storeForm.phone" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="storeDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveStore">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'

const activeTab = ref('tags')
const tags = ref<any[]>([])
const spendRanking = ref<any[]>([])
const visitRanking = ref<any[]>([])
const exchangeRules = ref<any[]>([])
const stores = ref<any[]>([])
const rankingMonth = ref(new Date())

// 对话框
const tagDialogVisible = ref(false)
const exchangeRuleDialogVisible = ref(false)
const storeDialogVisible = ref(false)

// 表单
const tagForm = ref<any>({ color: '#409EFF' })
const exchangeRuleForm = ref<any>({ pointsRequired: 100, rewardAmount: 10, isActive: true })
const storeForm = ref<any>({})

const loadTags = async () => {
  try {
    const res = await axios.get('/api/member-tags')
    tags.value = res.data
  } catch (e) {
    ElMessage.error('加载标签失败')
  }
}

const loadRanking = async () => {
  try {
    const yearMonth = rankingMonth.value.getFullYear() * 100 + (rankingMonth.value.getMonth() + 1)
    const res = await axios.get(`/api/member-rankings?yearMonth=${yearMonth}`)
    spendRanking.value = res.data.spendRanking
    visitRanking.value = res.data.visitRanking
  } catch (e) {
    ElMessage.error('加载排行榜失败')
  }
}

const loadExchangeRules = async () => {
  try {
    const res = await axios.get('/api/point-exchange/rules')
    exchangeRules.value = res.data
  } catch (e) {
    ElMessage.error('加载兑换规则失败')
  }
}

const loadStores = async () => {
  try {
    const res = await axios.get('/api/stores')
    stores.value = res.data
  } catch (e) {
    ElMessage.error('加载门店失败')
  }
}

// 标签
const showTagDialog = (row?: any) => {
  tagForm.value = row ? { ...row } : { color: '#409EFF' }
  tagDialogVisible.value = true
}

const saveTag = async () => {
  try {
    if (tagForm.value.id) {
      await axios.put(`/api/member-tags/${tagForm.value.id}`, tagForm.value)
    } else {
      await axios.post('/api/member-tags', tagForm.value)
    }
    tagDialogVisible.value = false
    loadTags()
    ElMessage.success('保存成功')
  } catch (e) {
    ElMessage.error('保存失败')
  }
}

const deleteTag = async (id: string) => {
  await ElMessageBox.confirm('确定删除？')
  await axios.delete(`/api/member-tags/${id}`)
  loadTags()
  ElMessage.success('删除成功')
}

// 兑换规则
const showExchangeRuleDialog = (row?: any) => {
  exchangeRuleForm.value = row ? { ...row } : { pointsRequired: 100, rewardAmount: 10, isActive: true }
  exchangeRuleDialogVisible.value = true
}

const saveExchangeRule = async () => {
  try {
    if (exchangeRuleForm.value.id) {
      await axios.put(`/api/point-exchange/rules/${exchangeRuleForm.value.id}`, exchangeRuleForm.value)
    } else {
      await axios.post('/api/point-exchange/rules', exchangeRuleForm.value)
    }
    exchangeRuleDialogVisible.value = false
    loadExchangeRules()
    ElMessage.success('保存成功')
  } catch (e) {
    ElMessage.error('保存失败')
  }
}

const deleteExchangeRule = async (id: string) => {
  await ElMessageBox.confirm('确定删除？')
  await axios.delete(`/api/point-exchange/rules/${id}`)
  loadExchangeRules()
  ElMessage.success('删除成功')
}

// 门店
const showStoreDialog = (row?: any) => {
  storeForm.value = row ? { ...row } : {}
  storeDialogVisible.value = true
}

const saveStore = async () => {
  try {
    if (storeForm.value.id) {
      await axios.put(`/api/stores/${storeForm.value.id}`, storeForm.value)
    } else {
      await axios.post('/api/stores', storeForm.value)
    }
    storeDialogVisible.value = false
    loadStores()
    ElMessage.success('保存成功')
  } catch (e) {
    ElMessage.error('保存失败')
  }
}

onMounted(() => {
  loadTags()
  loadRanking()
  loadExchangeRules()
  loadStores()
})
</script>

<style scoped>
.member-enhanced-page {
  padding: 20px;
}
.toolbar {
  margin-bottom: 16px;
}
.tag-card {
  margin-bottom: 16px;
}
.tag-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.tag-desc {
  color: #999;
  font-size: 12px;
  margin-top: 8px;
}
.tag-count {
  color: #666;
  font-size: 14px;
  margin-top: 8px;
}
</style>
