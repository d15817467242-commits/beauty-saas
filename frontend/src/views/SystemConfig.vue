<template>
  <div class="system-config">
    <el-tabs v-model="activeGroup" @tab-change="fetchConfigs">
      <el-tab-pane label="基础设置" name="basic" />
      <el-tab-pane label="积分设置" name="points" />
      <el-tab-pane label="会员设置" name="member" />
      <el-tab-pane label="预约设置" name="appointment" />
      <el-tab-pane label="备份设置" name="backup" />
      <el-tab-pane label="通知设置" name="notification" />
    </el-tabs>

    <el-card v-loading="loading">
      <el-form :model="formData" label-width="180px" class="config-form">
        <el-form-item 
          v-for="config in configs" 
          :key="config.key"
          :label="config.description || config.key"
        >
          <!-- 根据类型渲染不同的输入组件 -->
          <template v-if="config.type === 'boolean'">
            <el-switch v-model="formData[config.key]" />
          </template>
          <template v-else-if="config.type === 'number'">
            <el-input-number v-model="formData[config.key]" />
          </template>
          <template v-else-if="config.type === 'json'">
            <el-input 
              v-model="formData[config.key]" 
              type="textarea" 
              :rows="3"
              style="width: 400px"
            />
          </template>
          <template v-else>
            <el-input v-model="formData[config.key]" style="width: 400px" />
          </template>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="saveConfigs" :loading="saving">
            保存设置
          </el-button>
          <el-button @click="resetForm">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 自定义配置 -->
    <el-card style="margin-top: 20px">
      <template #header>
        <div class="card-header">
          <span>自定义配置</span>
          <el-button type="primary" size="small" @click="addConfigDialog = true">
            添加配置
          </el-button>
        </div>
      </template>

      <el-table :data="customConfigs" stripe>
        <el-table-column prop="key" label="配置键" width="200" />
        <el-table-column prop="description" label="描述" width="200" />
        <el-table-column prop="value" label="值" min-width="200" show-overflow-tooltip />
        <el-table-column prop="type" label="类型" width="100" />
        <el-table-column prop="isPublic" label="公开" width="80">
          <template #default="{ row }">
            <el-tag :type="row.isPublic ? 'success' : 'info'">
              {{ row.isPublic ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="editConfig(row)">编辑</el-button>
            <el-button type="danger" link @click="deleteConfig(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 添加/编辑配置弹窗 -->
    <el-dialog v-model="addConfigDialog" :title="editingConfig ? '编辑配置' : '添加配置'" width="500px">
      <el-form :model="configForm" label-width="100px">
        <el-form-item label="配置键">
          <el-input v-model="configForm.key" :disabled="!!editingConfig" />
        </el-form-item>
        <el-form-item label="配置值">
          <el-input v-model="configForm.value" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="configForm.description" />
        </el-form-item>
        <el-form-item label="分组">
          <el-input v-model="configForm.group" />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="configForm.type">
            <el-option value="string" label="字符串" />
            <el-option value="number" label="数字" />
            <el-option value="boolean" label="布尔值" />
            <el-option value="json" label="JSON" />
          </el-select>
        </el-form-item>
        <el-form-item label="是否公开">
          <el-switch v-model="configForm.isPublic" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addConfigDialog = false">取消</el-button>
        <el-button type="primary" @click="saveConfig">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'

const activeGroup = ref('basic')
const loading = ref(false)
const saving = ref(false)
const configs = ref([])
const allConfigs = ref([])
const addConfigDialog = ref(false)
const editingConfig = ref(null)

const formData = reactive<Record<string, any>>({})

const configForm = reactive({
  key: '',
  value: '',
  description: '',
  group: 'custom',
  type: 'string',
  isPublic: false,
})

const customConfigs = computed(() => {
  return allConfigs.value.filter(c => c.group === 'custom' || !['basic', 'points', 'member', 'appointment', 'backup', 'notification'].includes(c.group))
})

const fetchConfigs = async () => {
  loading.value = true
  try {
    const res = await axios.get('/api/system-config', {
      params: { group: activeGroup.value }
    })
    configs.value = res.data
    
    // 填充表单数据
    for (const config of configs.value) {
      let value = config.value
      if (config.type === 'number') value = Number(value)
      else if (config.type === 'boolean') value = value === 'true'
      formData[config.key] = value
    }
  } catch (error) {
    ElMessage.error('获取配置失败')
  } finally {
    loading.value = false
  }
}

const fetchAllConfigs = async () => {
  try {
    const res = await axios.get('/api/system-config')
    allConfigs.value = res.data
  } catch (error) {
    console.error('获取所有配置失败', error)
  }
}

const saveConfigs = async () => {
  saving.value = true
  try {
    const updates = configs.value.map(c => ({
      key: c.key,
      value: formData[c.key],
    }))
    
    await axios.post('/api/system-config/batch', updates)
    ElMessage.success('保存成功')
    
    // 刷新缓存
    await axios.post('/api/system-config/refresh-cache')
  } catch (error) {
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

const resetForm = () => {
  fetchConfigs()
}

const editConfig = (config: any) => {
  editingConfig.value = config
  Object.assign(configForm, {
    key: config.key,
    value: config.value,
    description: config.description,
    group: config.group,
    type: config.type || 'string',
    isPublic: config.isPublic,
  })
  addConfigDialog.value = true
}

const saveConfig = async () => {
  try {
    await axios.post('/api/system-config', configForm)
    ElMessage.success('保存成功')
    addConfigDialog.value = false
    editingConfig.value = null
    
    // 重置表单
    Object.assign(configForm, {
      key: '',
      value: '',
      description: '',
      group: 'custom',
      type: 'string',
      isPublic: false,
    })
    
    fetchAllConfigs()
  } catch (error) {
    ElMessage.error('保存失败')
  }
}

const deleteConfig = async (config: any) => {
  try {
    await ElMessageBox.confirm('确定要删除此配置吗？', '提示', { type: 'warning' })
    
    await axios.delete(`/api/system-config/${config.key}`)
    ElMessage.success('删除成功')
    fetchAllConfigs()
  } catch (error) {
    // 取消操作
  }
}

onMounted(() => {
  fetchConfigs()
  fetchAllConfigs()
})
</script>

<style scoped>
.system-config {
  padding: 20px;
}

.config-form {
  max-width: 800px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
