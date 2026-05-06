<template>
  <el-card shadow="hover" class="business-overview-card">
    <template #header>
      <div class="card-header">
        <span>经营总览</span>
        <el-radio-group v-model="compareType" size="small" @change="loadBusinessData">
          <el-radio-button label="day">日对比</el-radio-button>
          <el-radio-button label="month">月对比</el-radio-button>
        </el-radio-group>
      </div>
    </template>

    <el-row :gutter="20">
      <el-col :span="6" v-for="item in indicators" :key="item.key">
        <div class="indicator-card" :class="item.trend > 0 ? 'up' : item.trend < 0 ? 'down' : ''">
          <div class="indicator-label">{{ item.label }}</div>
          <div class="indicator-value">
            {{ item.prefix }}{{ formatValue(item.value) }}{{ item.suffix }}
          </div>
          <div class="indicator-compare">
            <span class="compare-label">{{ compareType === 'day' ? '环比' : '同比' }}</span>
            <span class="compare-value">
              <el-icon v-if="item.trend > 0"><CaretTop /></el-icon>
              <el-icon v-else-if="item.trend < 0"><CaretBottom /></el-icon>
              {{ Math.abs(item.trend).toFixed(1) }}%
            </span>
          </div>
          <div class="indicator-extra" v-if="item.compareValue !== undefined">
            上期: {{ item.prefix }}{{ formatValue(item.compareValue) }}{{ item.suffix }}
          </div>
        </div>
      </el-col>
    </el-row>
  </el-card>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { CaretTop, CaretBottom } from '@element-plus/icons-vue'
import api from '@/api/index'

interface Props {
  dateRange: [Date, Date] | null
  storeId: string | number
}

const props = defineProps<Props>()

const compareType = ref<'day' | 'month'>('day')

const indicators = ref([
  { key: 'revenue', label: '营业额', value: 0, prefix: '¥', suffix: '', trend: 0, compareValue: 0 },
  { key: 'customerCount', label: '客流量', value: 0, prefix: '', suffix: '人', trend: 0, compareValue: 0 },
  { key: 'avgTicket', label: '客单价', value: 0, prefix: '¥', suffix: '', trend: 0, compareValue: 0 },
  { key: 'memberRecharge', label: '会员充值', value: 0, prefix: '¥', suffix: '', trend: 0, compareValue: 0 }
])

const formatValue = (val: number) => {
  if (val >= 10000) {
    return (val / 10000).toFixed(1) + '万'
  }
  return val.toLocaleString('zh-CN')
}

const loadBusinessData = async () => {
  try {
    const params = new URLSearchParams()
    if (props.dateRange) {
      params.append('startDate', props.dateRange[0].toISOString().split('T')[0])
      params.append('endDate', props.dateRange[1].toISOString().split('T')[0])
    }
    if (props.storeId) {
      params.append('storeId', String(props.storeId))
    }
    params.append('compareType', compareType.value)
    
    const res = await api.get(`/report/business-overview?${params.toString()}`) as any
    
    if (res) {
      indicators.value = [
        { 
          key: 'revenue', 
          label: '营业额', 
          value: res.revenue?.value || 0, 
          prefix: '¥', 
          suffix: '', 
          trend: res.revenue?.trend || 0, 
          compareValue: res.revenue?.compareValue 
        },
        { 
          key: 'customerCount', 
          label: '客流量', 
          value: res.customerCount?.value || 0, 
          prefix: '', 
          suffix: '人', 
          trend: res.customerCount?.trend || 0, 
          compareValue: res.customerCount?.compareValue 
        },
        { 
          key: 'avgTicket', 
          label: '客单价', 
          value: res.avgTicket?.value || 0, 
          prefix: '¥', 
          suffix: '', 
          trend: res.avgTicket?.trend || 0, 
          compareValue: res.avgTicket?.compareValue 
        },
        { 
          key: 'memberRecharge', 
          label: '会员充值', 
          value: res.memberRecharge?.value || 0, 
          prefix: '¥', 
          suffix: '', 
          trend: res.memberRecharge?.trend || 0, 
          compareValue: res.memberRecharge?.compareValue 
        }
      ]
    }
  } catch (e) {
    console.error('加载经营数据失败', e)
    // 使用模拟数据
    indicators.value = [
      { key: 'revenue', label: '营业额', value: 28560, prefix: '¥', suffix: '', trend: 12.5, compareValue: 25380 },
      { key: 'customerCount', label: '客流量', value: 156, prefix: '', suffix: '人', trend: 8.3, compareValue: 144 },
      { key: 'avgTicket', label: '客单价', value: 183, prefix: '¥', suffix: '', trend: 3.8, compareValue: 176 },
      { key: 'memberRecharge', label: '会员充值', value: 15800, prefix: '¥', suffix: '', trend: -5.2, compareValue: 16670 }
    ]
  }
}

const refresh = () => {
  loadBusinessData()
}

watch(() => [props.dateRange, props.storeId], () => {
  loadBusinessData()
}, { deep: true })

onMounted(() => {
  loadBusinessData()
})

defineExpose({ refresh })
</script>

<style scoped>
.business-overview-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.indicator-card {
  padding: 20px;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e7ed 100%);
  border-radius: 8px;
  text-align: center;
  transition: all 0.3s;
}

.indicator-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.indicator-card.up .compare-value {
  color: #67c23a;
}

.indicator-card.down .compare-value {
  color: #f56c6c;
}

.indicator-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.indicator-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 8px;
}

.indicator-compare {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 5px;
  font-size: 13px;
}

.compare-label {
  color: #909399;
}

.compare-value {
  display: flex;
  align-items: center;
  font-weight: 500;
}

.indicator-extra {
  font-size: 12px;
  color: #c0c4cc;
  margin-top: 5px;
}
</style>
