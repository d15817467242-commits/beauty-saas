<template>
  <div class="operation-log">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>操作日志</span>
          <div class="header-actions">
            <el-button type="success" @click="exportLogs">
              <el-icon><Download /></el-icon>
              导出日志
            </el-button>
            <el-button type="danger" @click="cleanLogs">清理过期日志</el-button>
          </div>
        </div>
      </template>

      <!-- 搜索表单 -->
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="操作类型">
          <el-select v-model="searchForm.operationType" placeholder="请选择" clearable>
            <el-option label="创建" value="create" />
            <el-option label="更新" value="update" />
            <el-option label="删除" value="delete" />
            <el-option label="登录" value="login" />
            <el-option label="登出" value="logout" />
            <el-option label="导出" value="export" />
            <el-option label="导入" value="import" />
          </el-select>
        </el-form-item>
        <el-form-item label="模块">
          <el-input v-model="searchForm.module" placeholder="请输入模块名" clearable />
        </el-form-item>
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="searchForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
          />
        </el-form-item>
        <el-form-item label="关键词">
          <el-input v-model="searchForm.keyword" placeholder="搜索描述" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchLogs">搜索</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 日志列表 -->
      <el-table :data="logs" v-loading="loading" stripe>
        <el-table-column prop="userName" label="操作人" width="120" />
        <el-table-column prop="operationType" label="操作类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getTypeTag(row.operationType)">
              {{ getTypeName(row.operationType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="module" label="模块" width="120" />
        <el-table-column prop="description" label="操作描述" min-width="200" show-overflow-tooltip />
        <el-table-column prop="ip" label="IP地址" width="140" />
        <el-table-column prop="isSuccess" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.isSuccess ? 'success' : 'danger'">
              {{ row.isSuccess ? '成功' : '失败' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="duration" label="耗时(ms)" width="100" />
        <el-table-column prop="createdAt" label="操作时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="viewDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="fetchLogs"
        @current-change="fetchLogs"
      />
    </el-card>

    <!-- 统计卡片 -->
    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="8">
        <el-card>
          <template #header>操作类型统计</template>
          <div ref="typeChartRef" style="height: 300px"></div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card>
          <template #header>模块操作统计</template>
          <div ref="moduleChartRef" style="height: 300px"></div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card>
          <template #header>用户操作排行</template>
          <el-table :data="userStats" max-height="300">
            <el-table-column prop="userName" label="用户" />
            <el-table-column prop="count" label="操作次数" />
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <!-- 详情弹窗 -->
    <el-dialog v-model="detailVisible" title="日志详情" width="600px">
      <el-descriptions :column="2" border v-if="currentLog">
        <el-descriptions-item label="操作人">{{ currentLog.userName }}</el-descriptions-item>
        <el-descriptions-item label="操作类型">{{ getTypeName(currentLog.operationType) }}</el-descriptions-item>
        <el-descriptions-item label="模块">{{ currentLog.module }}</el-descriptions-item>
        <el-descriptions-item label="IP地址">{{ currentLog.ip }}</el-descriptions-item>
        <el-descriptions-item label="操作时间">{{ formatDate(currentLog.createdAt) }}</el-descriptions-item>
        <el-descriptions-item label="耗时">{{ currentLog.duration }}ms</el-descriptions-item>
        <el-descriptions-item label="状态" :span="2">
          <el-tag :type="currentLog.isSuccess ? 'success' : 'danger'">
            {{ currentLog.isSuccess ? '成功' : '失败' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="操作描述" :span="2">{{ currentLog.description }}</el-descriptions-item>
        <el-descriptions-item label="请求路径" :span="2">{{ currentLog.method }} {{ currentLog.path }}</el-descriptions-item>
        <el-descriptions-item label="请求参数" :span="2">
          <pre>{{ JSON.stringify(currentLog.params, null, 2) }}</pre>
        </el-descriptions-item>
        <el-descriptions-item label="响应结果" :span="2" v-if="currentLog.result">
          <pre>{{ JSON.stringify(currentLog.result, null, 2) }}</pre>
        </el-descriptions-item>
        <el-descriptions-item label="错误信息" :span="2" v-if="currentLog.errorMessage">
          <el-text type="danger">{{ currentLog.errorMessage }}</el-text>
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Download } from '@element-plus/icons-vue'
import axios from 'axios'
import * as echarts from 'echarts'

const loading = ref(false)
const logs = ref<any[]>([])
const detailVisible = ref(false)
const currentLog = ref<any>(null)
const typeChartRef = ref()
const moduleChartRef = ref()
const userStats = ref<any[]>([])

const searchForm = reactive({
  operationType: '',
  module: '',
  dateRange: [],
  keyword: '',
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0,
})

const typeNames = {
  create: '创建',
  update: '更新',
  delete: '删除',
  login: '登录',
  logout: '登出',
  export: '导出',
  import: '导入',
  backup: '备份',
  restore: '恢复',
}

const getTypeName = (type: string) => (typeNames as any)[type] || type

const getTypeTag = (type: string) => {
  const map = {
    create: 'success',
    update: 'warning',
    delete: 'danger',
    login: 'primary',
    logout: 'info',
    export: '',
    import: '',
  }
  return (map as any)[type] || ''
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleString('zh-CN')
}

const fetchLogs = async () => {
  loading.value = true
  try {
    const params: any = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      operationType: searchForm.operationType,
      module: searchForm.module,
      keyword: searchForm.keyword,
    }
    
    if (searchForm.dateRange?.length === 2) {
      params.startDate = searchForm.dateRange[0]
      params.endDate = searchForm.dateRange[1]
    }
    
    const res = await axios.get('/api/operation-logs', { params })
    logs.value = res.data.list
    pagination.total = res.data.total
  } catch (error) {
    ElMessage.error('获取日志失败')
  } finally {
    loading.value = false
  }
}

const fetchStats = async () => {
  try {
    const today = new Date()
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
    
    const [typeRes, moduleRes, userRes] = await Promise.all([
      axios.get('/api/operation-logs/stats/type', {
        params: { startDate: monthStart, endDate: today }
      }),
      axios.get('/api/operation-logs/stats/module', {
        params: { startDate: monthStart, endDate: today }
      }),
      axios.get('/api/operation-logs/stats/user', {
        params: { startDate: monthStart, endDate: today }
      }),
    ])
    
    userStats.value = userRes.data
    
    // 渲染图表
    await nextTick()
    renderTypeChart(typeRes.data)
    renderModuleChart(moduleRes.data)
  } catch (error) {
    console.error('获取统计失败', error)
  }
}

const renderTypeChart = (data: any[]) => {
  if (!typeChartRef.value) return
  const chart = echarts.init(typeChartRef.value)
  chart.setOption({
    tooltip: { trigger: 'item' },
    legend: { bottom: 0 },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
      labelLine: { show: false },
      data: data.map(item => ({
        name: (typeNames as any)[item._id] || item._id,
        value: item.count
      }))
    }]
  })
}

const renderModuleChart = (data: any[]) => {
  if (!moduleChartRef.value) return
  const chart = echarts.init(moduleChartRef.value)
  chart.setOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: data.map(item => item._id) },
    yAxis: { type: 'value' },
    series: [{
      type: 'bar',
      data: data.map(item => item.count),
      itemStyle: { color: '#409eff' }
    }]
  })
}

const exportLogs = async () => {
  try {
    const params: any = {
      operationType: searchForm.operationType,
      module: searchForm.module,
      keyword: searchForm.keyword,
    }
    
    if (searchForm.dateRange?.length === 2) {
      params.startDate = searchForm.dateRange[0]
      params.endDate = searchForm.dateRange[1]
    }
    
    const res = await axios.get('/api/operation-logs/export', {
      params,
      responseType: 'blob'
    })
    
    const url = window.URL.createObjectURL(new Blob([res.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `operation-logs-${new Date().toISOString().slice(0, 10)}.xlsx`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    
    ElMessage.success('导出成功')
  } catch (error) {
    ElMessage.error('导出失败')
  }
}

const resetSearch = () => {
  searchForm.operationType = ''
  searchForm.module = ''
  searchForm.dateRange = []
  searchForm.keyword = ''
  pagination.page = 1
  fetchLogs()
}

const viewDetail = (row: any) => {
  currentLog.value = row
  detailVisible.value = true
}

const cleanLogs = async () => {
  try {
    await ElMessageBox.confirm('确定要清理90天前的日志吗？', '提示', {
      type: 'warning',
    })
    
    const res = await axios.delete('/api/operation-logs/clean')
    ElMessage.success(res.data.message)
    fetchLogs()
  } catch (error) {
    // 取消操作
  }
}

onMounted(() => {
  fetchLogs()
  fetchStats()
})
</script>

<style scoped>
.operation-log {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-form {
  margin-bottom: 20px;
}

pre {
  background: #f5f5f5;
  padding: 10px;
  border-radius: 4px;
  overflow-x: auto;
  max-height: 200px;
}
</style>
