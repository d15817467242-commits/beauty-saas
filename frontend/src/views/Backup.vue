<template>
  <div class="backup-page">
    <el-row :gutter="20">
      <!-- 数据库统计 -->
      <el-col :span="24">
        <el-card>
          <template #header>数据库统计</template>
          <el-row :gutter="20">
            <el-col :span="6">
              <el-statistic title="总表数" :value="dbStats.totalTables" />
            </el-col>
            <el-col :span="6">
              <el-statistic title="数据库大小" :value="dbStats.databaseSize" />
            </el-col>
            <el-col :span="6">
              <el-statistic title="会员数" :value="dbStats.tables?.members?.count || 0" />
            </el-col>
            <el-col :span="6">
              <el-statistic title="消费记录数" :value="dbStats.tables?.consumptions?.count || 0" />
            </el-col>
          </el-row>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <!-- 备份操作 -->
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>数据备份</span>
            </div>
          </template>
          
          <el-form label-width="100px">
            <el-form-item label="备份格式">
              <el-radio-group v-model="backupFormat">
                <el-radio value="json">JSON</el-radio>
                <el-radio value="sql">SQL</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="createBackup" :loading="backupLoading">
                创建备份
              </el-button>
            </el-form-item>
          </el-form>

          <el-divider />

          <h4>单表导出</h4>
          <el-form label-width="100px">
            <el-form-item label="选择表">
              <el-select v-model="selectedTable" placeholder="请选择表">
                <el-option 
                  v-for="table in tableList" 
                  :key="table" 
                  :label="table" 
                  :value="table" 
                />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="success" @click="exportTable" :disabled="!selectedTable">
                导出选中表
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>

      <!-- 自动备份配置 -->
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>自动备份配置</span>
              <el-switch v-model="autoBackupConfig.enabled" @change="saveAutoBackupConfig" />
            </div>
          </template>
          
          <el-form label-width="120px" :disabled="!autoBackupConfig.enabled">
            <el-form-item label="备份频率">
              <el-select v-model="autoBackupConfig.frequency" @change="saveAutoBackupConfig">
                <el-option label="每天" value="daily" />
                <el-option label="每周" value="weekly" />
                <el-option label="每月" value="monthly" />
              </el-select>
            </el-form-item>
            <el-form-item label="备份时间">
              <el-time-picker v-model="autoBackupConfig.time" format="HH:mm" @change="saveAutoBackupConfig" />
            </el-form-item>
            <el-form-item label="保留天数">
              <el-input-number v-model="autoBackupConfig.retentionDays" :min="1" :max="365" @change="saveAutoBackupConfig" />
            </el-form-item>
            <el-form-item label="备份格式">
              <el-radio-group v-model="autoBackupConfig.format" @change="saveAutoBackupConfig">
                <el-radio value="json">JSON</el-radio>
                <el-radio value="sql">SQL</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="存储位置">
              <el-select v-model="autoBackupConfig.storage" @change="saveAutoBackupConfig">
                <el-option label="本地存储" value="local" />
                <el-option label="云存储" value="cloud" />
              </el-select>
            </el-form-item>
            <el-form-item label="通知邮箱">
              <el-input v-model="autoBackupConfig.notifyEmail" placeholder="备份完成后通知" @change="saveAutoBackupConfig" />
            </el-form-item>
          </el-form>
          
          <el-divider />
          
          <div class="backup-status">
            <p><strong>上次备份:</strong> {{ autoBackupConfig.lastBackup ? formatDate(autoBackupConfig.lastBackup) : '从未备份' }}</p>
            <p><strong>下次备份:</strong> {{ autoBackupConfig.nextBackup ? formatDate(autoBackupConfig.nextBackup) : '-' }}</p>
            <p><strong>备份文件数:</strong> {{ autoBackupConfig.totalBackups || 0 }}</p>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 备份列表 -->
    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="24">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>备份文件列表</span>
              <div>
                <el-button type="primary" @click="showUploadDialog">
                  <el-icon><Upload /></el-icon>
                  上传备份
                </el-button>
                <el-button type="danger" @click="cleanBackups">
                  清理过期备份
                </el-button>
              </div>
            </div>
          </template>

          <el-table :data="backups" v-loading="listLoading" max-height="400">
            <el-table-column prop="filename" label="文件名" min-width="200" />
            <el-table-column prop="size" label="大小" width="120">
              <template #default="{ row }">
                {{ formatSize(row.size) }}
              </template>
            </el-table-column>
            <el-table-column prop="type" label="类型" width="100">
              <template #default="{ row }">
                <el-tag>{{ row.filename.endsWith('.sql') ? 'SQL' : 'JSON' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="source" label="来源" width="100">
              <template #default="{ row }">
                <el-tag :type="row.source === 'auto' ? 'success' : 'primary'">
                  {{ row.source === 'auto' ? '自动' : '手动' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="createdAt" label="创建时间" width="180">
              <template #default="{ row }">
                {{ formatDate(row.createdAt) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="250" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link @click="downloadBackup(row.filename)">
                  下载
                </el-button>
                <el-button 
                  type="success" 
                  link 
                  @click="restoreBackup(row.filename)"
                  v-if="row.filename.endsWith('.json')"
                >
                  恢复
                </el-button>
                <el-button type="info" link @click="compareBackup(row)">
                  对比
                </el-button>
                <el-button type="danger" link @click="deleteBackup(row.filename)">
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <!-- 上传备份弹窗 -->
    <el-dialog v-model="uploadDialogVisible" title="上传备份文件" width="500px">
      <el-upload
        ref="uploadRef"
        :action="uploadUrl"
        :headers="uploadHeaders"
        :on-success="handleUploadSuccess"
        :on-error="handleUploadError"
        :before-upload="beforeUpload"
        accept=".json,.sql"
        :auto-upload="false"
      >
        <template #trigger>
          <el-button type="primary">选择文件</el-button>
        </template>
        <el-button class="ml-3" type="success" @click="submitUpload">
          开始上传
        </el-button>
        <template #tip>
          <div class="el-upload__tip">
            只能上传 .json 或 .sql 备份文件，且不超过 100MB
          </div>
        </template>
      </el-upload>
    </el-dialog>

    <!-- 恢复确认弹窗 -->
    <el-dialog v-model="restoreDialogVisible" title="恢复数据" width="500px">
      <el-alert type="warning" :closable="false" style="margin-bottom: 20px">
        <template #title>
          <strong>警告：恢复操作将覆盖当前数据</strong>
        </template>
        恢复前建议先创建当前数据的备份
      </el-alert>
      
      <el-form :model="restoreForm" label-width="100px">
        <el-form-item label="备份文件">
          <el-input :value="restoreForm.filename" disabled />
        </el-form-item>
        <el-form-item label="恢复选项">
          <el-checkbox v-model="restoreForm.createBackup">恢复前创建备份</el-checkbox>
        </el-form-item>
        <el-form-item label="恢复范围">
          <el-checkbox-group v-model="restoreForm.tables">
            <el-checkbox label="members">会员数据</el-checkbox>
            <el-checkbox label="consumptions">消费记录</el-checkbox>
            <el-checkbox label="appointments">预约记录</el-checkbox>
            <el-checkbox label="employees">员工数据</el-checkbox>
            <el-checkbox label="services">服务项目</el-checkbox>
            <el-checkbox label="products">产品数据</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="restoreDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmRestore" :loading="restoring">
          确认恢复
        </el-button>
      </template>
    </el-dialog>

    <!-- 数据对比弹窗 -->
    <el-dialog v-model="compareDialogVisible" title="数据对比" width="800px">
      <el-table :data="compareData" border>
        <el-table-column prop="table" label="表名" width="150" />
        <el-table-column prop="currentCount" label="当前记录数" width="120" />
        <el-table-column prop="backupCount" label="备份记录数" width="120" />
        <el-table-column prop="diff" label="差异" width="100">
          <template #default="{ row }">
            <span :class="{ 'diff-positive': row.diff > 0, 'diff-negative': row.diff < 0 }">
              {{ row.diff > 0 ? '+' : '' }}{{ row.diff }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="lastModified" label="最后修改时间">
          <template #default="{ row }">
            {{ row.lastModified ? formatDate(row.lastModified) : '-' }}
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Upload } from '@element-plus/icons-vue'
import axios from 'axios'

const backupFormat = ref('json')
const selectedTable = ref('')
const backupLoading = ref(false)
const listLoading = ref(false)
const restoring = ref(false)
const backups = ref([])
const dbStats = ref<any>({
  totalTables: 0,
  databaseSize: '',
  tables: {},
})

const uploadDialogVisible = ref(false)
const restoreDialogVisible = ref(false)
const compareDialogVisible = ref(false)
const uploadRef = ref()

const uploadUrl = '/api/backup/upload'
const uploadHeaders = computed(() => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`
}))

const restoreForm = reactive({
  filename: '',
  createBackup: true,
  tables: ['members', 'consumptions', 'appointments', 'employees', 'services', 'products'],
})

const compareData = ref([])

const autoBackupConfig = reactive({
  enabled: false,
  frequency: 'daily',
  time: new Date(2024, 0, 1, 2, 0),
  retentionDays: 30,
  format: 'json',
  storage: 'local',
  notifyEmail: '',
  lastBackup: null,
  nextBackup: null,
  totalBackups: 0,
})

const tableList = computed(() => {
  return Object.keys(dbStats.value.tables || {})
})

const formatSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
  if (bytes < 1024 * 1024 * 1024) return (bytes / 1024 / 1024).toFixed(2) + ' MB'
  return (bytes / 1024 / 1024 / 1024).toFixed(2) + ' GB'
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleString('zh-CN')
}

const fetchStats = async () => {
  try {
    const res = await axios.get('/api/backup/stats')
    dbStats.value = res.data
  } catch (error) {
    ElMessage.error('获取数据库统计失败')
  }
}

const fetchBackups = async () => {
  listLoading.value = true
  try {
    const res = await axios.get('/api/backup/list')
    backups.value = res.data
  } catch (error) {
    ElMessage.error('获取备份列表失败')
  } finally {
    listLoading.value = false
  }
}

const createBackup = async () => {
  backupLoading.value = true
  try {
    const url = backupFormat.value === 'json' 
      ? '/api/backup/export/json' 
      : '/api/backup/export/sql'
    
    const res = await axios.post(url)
    ElMessage.success(res.data.message)
    fetchBackups()
  } catch (error) {
    ElMessage.error('创建备份失败')
  } finally {
    backupLoading.value = false
  }
}

const exportTable = async () => {
  if (!selectedTable.value) return
  
  try {
    const res = await axios.post(`/api/backup/export/table/${selectedTable.value}`, null, {
      params: { format: 'json' }
    })
    ElMessage.success(res.data.message)
    fetchBackups()
  } catch (error) {
    ElMessage.error('导出失败')
  }
}

const downloadBackup = (filename: string) => {
  window.open(`/api/backup/download/${filename}`, '_blank')
}

const restoreBackup = async (filename: string) => {
  try {
    await ElMessageBox.confirm(
      '恢复数据将覆盖当前数据，确定要继续吗？',
      '警告',
      { type: 'warning' }
    )
    
    const res = await axios.post(`/api/backup/restore/${filename}`)
    ElMessage.success(res.data.message)
    fetchStats()
  } catch (error) {
    // 取消操作
  }
}

const deleteBackup = async (filename: string) => {
  try {
    await ElMessageBox.confirm('确定要删除此备份吗？', '提示', { type: 'warning' })
    
    await axios.delete(`/api/backup/${filename}`)
    ElMessage.success('删除成功')
    fetchBackups()
  } catch (error) {
    // 取消操作
  }
}

const cleanBackups = async () => {
  try {
    await ElMessageBox.confirm('确定要清理30天前的备份吗？', '提示', { type: 'warning' })
    
    const res = await axios.post('/api/backup/clean')
    ElMessage.success(res.data.message)
    fetchBackups()
  } catch (error) {
    // 取消操作
  }
}

const showUploadDialog = () => {
  uploadDialogVisible.value = true
}

const beforeUpload = (file: File) => {
  const isValidType = file.name.endsWith('.json') || file.name.endsWith('.sql')
  const isLt100M = file.size / 1024 / 1024 < 100
  
  if (!isValidType) {
    ElMessage.error('只能上传 .json 或 .sql 文件')
    return false
  }
  if (!isLt100M) {
    ElMessage.error('文件大小不能超过 100MB')
    return false
  }
  return true
}

const submitUpload = () => {
  uploadRef.value?.submit()
}

const handleUploadSuccess = (response: any) => {
  ElMessage.success('上传成功')
  uploadDialogVisible.value = false
  fetchBackups()
}

const handleUploadError = () => {
  ElMessage.error('上传失败')
}

const confirmRestore = async () => {
  restoring.value = true
  try {
    const res = await axios.post(`/api/backup/restore/${restoreForm.filename}`, {
      createBackup: restoreForm.createBackup,
      tables: restoreForm.tables,
    })
    ElMessage.success(res.data.message)
    restoreDialogVisible.value = false
    fetchStats()
  } catch (error) {
    ElMessage.error('恢复失败')
  } finally {
    restoring.value = false
  }
}

const compareBackup = async (backup: any) => {
  try {
    const res = await axios.get(`/api/backup/compare/${backup.filename}`)
    compareData.value = res.data
    compareDialogVisible.value = true
  } catch (error) {
    ElMessage.error('获取对比数据失败')
  }
}

const fetchAutoBackupConfig = async () => {
  try {
    const res = await axios.get('/api/backup/auto-config')
    if (res.data) {
      Object.assign(autoBackupConfig, res.data)
    }
  } catch (error) {
    console.error('获取自动备份配置失败', error)
  }
}

const saveAutoBackupConfig = async () => {
  try {
    await axios.put('/api/backup/auto-config', autoBackupConfig)
    ElMessage.success('配置保存成功')
  } catch (error) {
    ElMessage.error('保存配置失败')
  }
}

onMounted(() => {
  fetchStats()
  fetchBackups()
  fetchAutoBackupConfig()
})
</script>

<style scoped>
.backup-page {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.backup-status {
  font-size: 14px;
  color: #606266;
}

.backup-status p {
  margin: 8px 0;
}

.diff-positive {
  color: #67c23a;
  font-weight: bold;
}

.diff-negative {
  color: #f56c6c;
  font-weight: bold;
}

.ml-3 {
  margin-left: 12px;
}
</style>
