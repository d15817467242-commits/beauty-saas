<template>
  <el-card shadow="hover" class="target-overview-card">
    <template #header>
      <div class="card-header">
        <span>目标概览</span>
        <el-button type="primary" size="small" @click="showEditDialog = true">
          <el-icon><Edit /></el-icon>
          设置目标
        </el-button>
      </div>
    </template>

    <el-row :gutter="20">
      <el-col :span="8" v-for="target in targetList" :key="target.key">
        <div class="target-item">
          <div class="target-header">
            <span class="target-name">{{ target.name }}</span>
            <el-tag :type="getProgressType(target.progress)" size="small">
              {{ target.progress >= 100 ? '已达成' : target.progress >= 80 ? '接近达成' : '进行中' }}
            </el-tag>
          </div>
          <div class="target-values">
            <span class="current-value">¥{{ formatNumber(target.current) }}</span>
            <span class="target-divider">/</span>
            <span class="target-value">¥{{ formatNumber(target.target) }}</span>
          </div>
          <el-progress 
            :percentage="Math.min(target.progress, 100)" 
            :status="target.progress >= 100 ? 'success' : ''"
            :stroke-width="12"
          />
          <div class="target-extra">
            <span>完成度 {{ target.progress.toFixed(1) }}%</span>
            <span v-if="target.progress < 100">
              还差 ¥{{ formatNumber(target.target - target.current) }}
            </span>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 编辑目标对话框 -->
    <el-dialog v-model="showEditDialog" title="设置目标" width="500px">
      <el-form :model="targetForm" label-width="100px">
        <el-form-item label="月度营业目标">
          <el-input-number v-model="targetForm.monthlyRevenue" :min="0" :step="1000" style="width: 100%" />
        </el-form-item>
        <el-form-item label="月度客流目标">
          <el-input-number v-model="targetForm.monthlyCustomer" :min="0" :step="10" style="width: 100%" />
        </el-form-item>
        <el-form-item label="月度新会员目标">
          <el-input-number v-model="targetForm.monthlyNewMember" :min="0" :step="5" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" @click="saveTarget">保存</el-button>
      </template>
    </el-dialog>
  </el-card>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { Edit } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import api from '@/api/index'

interface Props {
  dateRange: [Date, Date] | null
  storeId: string | number
}

const props = defineProps<Props>()

const showEditDialog = ref(false)
const targetForm = ref({
  monthlyRevenue: 100000,
  monthlyCustomer: 500,
  monthlyNewMember: 50
})

const targetList = ref([
  { key: 'revenue', name: '营业额目标', current: 0, target: 100000, progress: 0 },
  { key: 'customer', name: '客流量目标', current: 0, target: 500, progress: 0 },
  { key: 'newMember', name: '新会员目标', current: 0, target: 50, progress: 0 }
])

const formatNumber = (num: number) => {
  return num.toLocaleString('zh-CN')
}

const getProgressType = (progress: number) => {
  if (progress >= 100) return 'success'
  if (progress >= 80) return 'warning'
  return 'info'
}

const loadTargetData = async () => {
  try {
    const params = new URLSearchParams()
    if (props.dateRange) {
      params.append('startDate', props.dateRange[0].toISOString().split('T')[0])
      params.append('endDate', props.dateRange[1].toISOString().split('T')[0])
    }
    if (props.storeId) {
      params.append('storeId', String(props.storeId))
    }
    
    const res = await api.get(`/report/targets?${params.toString()}`) as any
    
    if (res) {
      targetList.value = [
        { 
          key: 'revenue', 
          name: '营业额目标', 
          current: res.revenue?.current || 0, 
          target: res.revenue?.target || targetForm.value.monthlyRevenue, 
          progress: res.revenue?.progress || 0 
        },
        { 
          key: 'customer', 
          name: '客流量目标', 
          current: res.customer?.current || 0, 
          target: res.customer?.target || targetForm.value.monthlyCustomer, 
          progress: res.customer?.progress || 0 
        },
        { 
          key: 'newMember', 
          name: '新会员目标', 
          current: res.newMember?.current || 0, 
          target: res.newMember?.target || targetForm.value.monthlyNewMember, 
          progress: res.newMember?.progress || 0 
        }
      ]
      
      targetForm.value = {
        monthlyRevenue: res.revenue?.target || 100000,
        monthlyCustomer: res.customer?.target || 500,
        monthlyNewMember: res.newMember?.target || 50
      }
    }
  } catch (e) {
    console.error('加载目标数据失败', e)
    // 使用模拟数据
    targetList.value = [
      { key: 'revenue', name: '营业额目标', current: 78500, target: 100000, progress: 78.5 },
      { key: 'customer', name: '客流量目标', current: 423, target: 500, progress: 84.6 },
      { key: 'newMember', name: '新会员目标', current: 38, target: 50, progress: 76 }
    ]
  }
}

const saveTarget = async () => {
  try {
    await api.post('/report/targets', targetForm.value)
    ElMessage.success('目标设置成功')
    showEditDialog.value = false
    loadTargetData()
  } catch (e) {
    ElMessage.error('保存失败')
  }
}

const refresh = () => {
  loadTargetData()
}

watch(() => [props.dateRange, props.storeId], () => {
  loadTargetData()
}, { deep: true })

onMounted(() => {
  loadTargetData()
})

defineExpose({ refresh })
</script>

<style scoped>
.target-overview-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.target-item {
  padding: 15px;
  background: #f5f7fa;
  border-radius: 8px;
}

.target-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.target-name {
  font-size: 14px;
  color: #606266;
}

.target-values {
  margin-bottom: 10px;
}

.current-value {
  font-size: 24px;
  font-weight: bold;
  color: #409eff;
}

.target-divider {
  margin: 0 8px;
  color: #909399;
}

.target-value {
  font-size: 16px;
  color: #909399;
}

.target-extra {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  font-size: 12px;
  color: #909399;
}
</style>
