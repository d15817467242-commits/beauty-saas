<template>
  <div class="gift-manage">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>礼品管理</span>
          <el-button type="primary" @click="handleAdd">新增礼品</el-button>
        </div>
      </template>

      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="关键词">
          <el-input v-model="searchForm.keyword" placeholder="礼品名称" clearable />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="searchForm.type" clearable>
            <el-option label="实物礼品" value="physical" />
            <el-option label="虚拟礼品" value="virtual" />
            <el-option label="服务礼品" value="service" />
            <el-option label="券礼品" value="coupon" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" clearable>
            <el-option label="可用" value="active" />
            <el-option label="停用" value="inactive" />
            <el-option label="缺货" value="out" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadData">查询</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="tableData" v-loading="loading">
        <el-table-column prop="name" label="礼品名称" />
        <el-table-column prop="code" label="编码" />
        <el-table-column label="类型">
          <template #default="{ row }">
            <el-tag>{{ typeMap[row.type] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="points" label="所需积分" width="100" />
        <el-table-column prop="stock" label="库存" width="80" />
        <el-table-column prop="exchangedCount" label="已兑换" width="80" />
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="statusTypeMap[row.status]">{{ statusMap[row.status] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next"
        @change="loadData"
      />
    </el-card>

    <!-- 礼品对话框 -->
    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑礼品' : '新增礼品'" width="600px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="礼品名称">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="礼品编码">
          <el-input v-model="form.code" />
        </el-form-item>
        <el-form-item label="礼品类型">
          <el-select v-model="form.type">
            <el-option label="实物礼品" value="physical" />
            <el-option label="虚拟礼品" value="virtual" />
            <el-option label="服务礼品" value="service" />
            <el-option label="券礼品" value="coupon" />
          </el-select>
        </el-form-item>
        <el-form-item label="礼品描述">
          <el-input v-model="form.description" type="textarea" />
        </el-form-item>
        <el-form-item label="所需积分">
          <el-input-number v-model="form.points" :min="0" />
        </el-form-item>
        <el-form-item label="礼品价值">
          <el-input-number v-model="form.value" :min="0" :precision="2" />
        </el-form-item>
        <el-form-item label="库存数量">
          <el-input-number v-model="form.stock" :min="0" />
        </el-form-item>
        <el-form-item label="每人限兑">
          <el-input-number v-model="form.limitPerMember" :min="0" />
          <span class="ml-2 text-gray">0表示不限</span>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="form.status">
            <el-option label="可用" value="active" />
            <el-option label="停用" value="inactive" />
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
import request from '@/utils/request'

const loading = ref(false)
const tableData = ref<any[]>([])
const dialogVisible = ref(false)

const searchForm = reactive({
  keyword: '',
  type: '',
  status: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const form = ref<any>({
  name: '',
  code: '',
  type: 'physical',
  description: '',
  points: 0,
  value: 0,
  stock: 0,
  limitPerMember: 0,
  status: 'active'
})

const typeMap: Record<string, string> = {
  physical: '实物',
  virtual: '虚拟',
  service: '服务',
  coupon: '券'
}

const statusMap: Record<string, string> = {
  active: '可用',
  inactive: '停用',
  out: '缺货'
}

const statusTypeMap: Record<string, string> = {
  active: 'success',
  inactive: 'info',
  out: 'danger'
}

onMounted(() => {
  loadData()
})

async function loadData() {
  loading.value = true
  try {
    const res = await request.get('/gift', {
      params: {
        ...searchForm,
        page: pagination.page,
        pageSize: pagination.pageSize
      }
    })
    tableData.value = res.data.data
    pagination.total = res.data.total
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

function handleAdd() {
  form.value = {
    name: '',
    code: '',
    type: 'physical',
    description: '',
    points: 0,
    value: 0,
    stock: 0,
    limitPerMember: 0,
    status: 'active'
  }
  dialogVisible.value = true
}

function handleEdit(row: any) {
  form.value = { ...row }
  dialogVisible.value = true
}

async function handleDelete(row: any) {
  try {
    await ElMessageBox.confirm('确定删除该礼品?', '提示')
    await request.delete(`/gift/${row.id}`)
    ElMessage.success('删除成功')
    loadData()
  } catch (e) {
    console.error(e)
  }
}

async function saveData() {
  try {
    if (form.value.id) {
      await request.put(`/gift/${form.value.id}`, form.value)
    } else {
      await request.post('/gift', form.value)
    }
    ElMessage.success('保存成功')
    dialogVisible.value = false
    loadData()
  } catch (e) {
    console.error(e)
  }
}
</script>

<style scoped>
.gift-manage {
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
.ml-2 {
  margin-left: 8px;
}
.text-gray {
  color: #999;
}
</style>
