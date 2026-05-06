<template>
  <div class="room-manage">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>房间管理</span>
          <el-button type="primary" @click="handleAdd">新增房间</el-button>
        </div>
      </template>

      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="关键词">
          <el-input v-model="searchForm.keyword" placeholder="房间名称" clearable />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="searchForm.type" clearable>
            <el-option label="单人间" value="single" />
            <el-option label="双人间" value="double" />
            <el-option label="套房" value="suite" />
            <el-option label="VIP房" value="vip" />
            <el-option label="治疗室" value="treatment" />
            <el-option label="等候区" value="waiting" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" clearable>
            <el-option label="空闲" value="available" />
            <el-option label="使用中" value="occupied" />
            <el-option label="维护中" value="maintenance" />
            <el-option label="清洁中" value="cleaning" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadData">查询</el-button>
        </el-form-item>
      </el-form>

      <el-row :gutter="20">
        <el-col :span="6" v-for="room in tableData" :key="room.id">
          <el-card class="room-card" :class="`status-${room.status}`">
            <div class="room-header">
              <span class="room-name">{{ room.name }}</span>
              <el-tag :type="statusTypeMap[room.status]" size="small">{{ statusMap[room.status] }}</el-tag>
            </div>
            <div class="room-info">
              <p>类型: {{ typeMap[room.type] }}</p>
              <p>床位: {{ room.bedCount }}</p>
              <p>容量: {{ room.capacity }}人</p>
            </div>
            <div class="room-actions">
              <el-button size="small" @click="handleEdit(room)">编辑</el-button>
              <el-button size="small" type="danger" @click="handleDelete(room)">删除</el-button>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </el-card>

    <!-- 房间对话框 -->
    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑房间' : '新增房间'" width="500px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="房间名称">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="房间编号">
          <el-input v-model="form.code" />
        </el-form-item>
        <el-form-item label="房间类型">
          <el-select v-model="form.type">
            <el-option label="单人间" value="single" />
            <el-option label="双人间" value="double" />
            <el-option label="套房" value="suite" />
            <el-option label="VIP房" value="vip" />
            <el-option label="治疗室" value="treatment" />
            <el-option label="等候区" value="waiting" />
          </el-select>
        </el-form-item>
        <el-form-item label="床位数">
          <el-input-number v-model="form.bedCount" :min="1" />
        </el-form-item>
        <el-form-item label="容纳人数">
          <el-input-number v-model="form.capacity" :min="1" />
        </el-form-item>
        <el-form-item label="所属楼层">
          <el-input v-model="form.floor" />
        </el-form-item>
        <el-form-item label="房间设施">
          <el-input v-model="form.facilities" type="textarea" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="form.status">
            <el-option label="空闲" value="available" />
            <el-option label="维护中" value="maintenance" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveData">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
const API_BASE = 'http://localhost:3000/api'
const token = localStorage.getItem('token') || ''

const loading = ref(false)
const tableData = ref<any[]>([])
const dialogVisible = ref(false)

const searchForm = reactive({
  keyword: '',
  type: '',
  status: ''
})

const form = ref<any>({
  name: '',
  code: '',
  type: 'treatment',
  bedCount: 1,
  capacity: 1,
  floor: '',
  facilities: '',
  status: 'available'
})

const typeMap: Record<string, string> = {
  single: '单人间',
  double: '双人间',
  suite: '套房',
  vip: 'VIP房',
  treatment: '治疗室',
  waiting: '等候区'
}

const statusMap: Record<string, string> = {
  available: '空闲',
  occupied: '使用中',
  maintenance: '维护中',
  cleaning: '清洁中'
}

const statusTypeMap: Record<string, string> = {
  available: 'success',
  occupied: 'warning',
  maintenance: 'danger',
  cleaning: 'info'
}

onMounted(() => {
  loadData()
})

async function loadData() {
  loading.value = true
  try {
    const params = new URLSearchParams()
    if (searchForm.keyword) params.append('keyword', searchForm.keyword)
    if (searchForm.type) params.append('type', searchForm.type)
    if (searchForm.status) params.append('status', searchForm.status)
    const res = await fetch(`${API_BASE}/rooms?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const data = await res.json()
    tableData.value = data.data || data.list || data.records || data.items || data
  } catch (e) {
    ElMessage.error('加载房间数据失败')
  } finally {
    loading.value = false
  }
}

function handleAdd() {
  form.value = {
    name: '',
    code: '',
    type: 'treatment',
    bedCount: 1,
    capacity: 1,
    floor: '',
    facilities: '',
    status: 'available'
  }
  dialogVisible.value = true
}

function handleEdit(row: any) {
  form.value = { ...row }
  dialogVisible.value = true
}

async function handleDelete(row: any) {
  try {
    await ElMessageBox.confirm('确定删除该房间?', '提示')
    const res = await fetch(`${API_BASE}/rooms/${row.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    })
    if (res.ok) {
      ElMessage.success('删除成功')
      loadData()
    } else {
      ElMessage.error('删除失败')
    }
  } catch (e) {}
}

async function saveData() {
  try {
    const url = form.value.id ? `${API_BASE}/rooms/${form.value.id}` : `${API_BASE}/rooms`
    const method = form.value.id ? 'PUT' : 'POST'
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(form.value)
    })
    if (res.ok) {
      ElMessage.success('保存成功')
      dialogVisible.value = false
      loadData()
    } else {
      const err = await res.json()
      ElMessage.error(err.message || '保存失败')
    }
  } catch (e) {
    ElMessage.error('网络错误')
  }
}
</script>

<style scoped>
.room-manage {
  padding: 20px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.search-form {
  margin-bottom: 16px;
}
.room-card {
  margin-bottom: 20px;
}
.room-card.status-available {
  border-left: 4px solid #67c23a;
}
.room-card.status-occupied {
  border-left: 4px solid #e6a23c;
}
.room-card.status-maintenance {
  border-left: 4px solid #f56c6c;
}
.room-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.room-name {
  font-size: 16px;
  font-weight: bold;
}
.room-info p {
  margin: 4px 0;
  color: #666;
  font-size: 13px;
}
.room-actions {
  margin-top: 12px;
  text-align: right;
}
</style>
