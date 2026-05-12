<template>
  <div class="print-template-page">
    <el-tabs v-model="activeTab">
      <!-- 模板列表 -->
      <el-tab-pane label="模板列表" name="list">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>打印模板</span>
              <el-button type="primary" @click="openTemplateDialog()">
                <el-icon><Plus /></el-icon>
                新建模板
              </el-button>
            </div>
          </template>

          <el-table :data="templates" v-loading="loading" stripe>
            <el-table-column prop="name" label="模板名称" width="180" />
            <el-table-column prop="type" label="模板类型" width="120">
              <template #default="{ row }">
                <el-tag>{{ getTypeName(row.type) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="paperSize" label="纸张大小" width="100">
              <template #default="{ row }">
                {{ row.paperSize || '58mm' }}
              </template>
            </el-table-column>
            <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
            <el-table-column prop="isDefault" label="默认模板" width="100">
              <template #default="{ row }">
                <el-tag v-if="row.isDefault" type="success">是</el-tag>
                <el-tag v-else type="info">否</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="80">
              <template #default="{ row }">
                <el-switch v-model="row.status" @change="toggleTemplateStatus(row)" />
              </template>
            </el-table-column>
            <el-table-column prop="updatedAt" label="更新时间" width="180">
              <template #default="{ row }">
                {{ formatDate(row.updatedAt) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link @click="editTemplate(row)">编辑</el-button>
                <el-button type="success" link @click="previewTemplate(row)">预览</el-button>
                <el-button type="warning" link @click="copyTemplate(row)">复制</el-button>
                <el-button type="danger" link @click="deleteTemplate(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>

      <!-- 模板编辑器 -->
      <el-tab-pane label="模板编辑器" name="editor" :disabled="!editingTemplate">
        <el-card v-if="editingTemplate">
          <template #header>
            <div class="card-header">
              <span>编辑模板: {{ editingTemplate.name }}</span>
              <div>
                <el-button @click="previewCurrentTemplate">预览</el-button>
                <el-button type="primary" @click="saveTemplateContent" :loading="saving">保存</el-button>
              </div>
            </div>
          </template>

          <el-row :gutter="20">
            <!-- 左侧：编辑区 -->
            <el-col :span="14">
              <div class="editor-section">
                <div class="editor-toolbar">
                  <el-button-group>
                    <el-button size="small" @click="insertField('storeName')">门店名称</el-button>
                    <el-button size="small" @click="insertField('orderNo')">订单号</el-button>
                    <el-button size="small" @click="insertField('date')">日期</el-button>
                    <el-button size="small" @click="insertField('time')">时间</el-button>
                    <el-button size="small" @click="insertField('total')">合计金额</el-button>
                    <el-button size="small" @click="insertField('memberName')">会员名称</el-button>
                  </el-button-group>
                  <el-button-group style="margin-left: 10px">
                    <el-button size="small" @click="insertCommand('alignLeft')">左对齐</el-button>
                    <el-button size="small" @click="insertCommand('alignCenter')">居中</el-button>
                    <el-button size="small" @click="insertCommand('alignRight')">右对齐</el-button>
                    <el-button size="small" @click="insertCommand('bold')">加粗</el-button>
                    <el-button size="small" @click="insertCommand('divider')">分割线</el-button>
                  </el-button-group>
                </div>
                <el-input
                  v-model="templateContent"
                  type="textarea"
                  :rows="25"
                  placeholder="请输入模板内容"
                  class="template-editor"
                />
              </div>
            </el-col>

            <!-- 右侧：预览区 -->
            <el-col :span="10">
              <div class="preview-section">
                <div class="preview-header">打印预览</div>
                <div class="preview-content" v-html="previewHtml"></div>
              </div>
            </el-col>
          </el-row>
        </el-card>
      </el-tab-pane>

      <!-- 打印机管理 -->
      <el-tab-pane label="打印机管理" name="printers">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>打印机列表</span>
              <el-button type="primary" @click="openPrinterDialog()">
                <el-icon><Plus /></el-icon>
                添加打印机
              </el-button>
            </div>
          </template>

          <el-table :data="printers" v-loading="printerLoading" stripe>
            <el-table-column prop="name" label="打印机名称" width="180" />
            <el-table-column prop="type" label="类型" width="120">
              <template #default="{ row }">
                <el-tag>{{ row.type === 'network' ? '网络打印机' : '本地打印机' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="ip" label="IP地址" width="150" />
            <el-table-column prop="paperSize" label="纸张宽度" width="100">
              <template #default="{ row }">
                {{ row.paperSize || '58mm' }}
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.status === 'online' ? 'success' : 'danger'">
                  {{ row.status === 'online' ? '在线' : '离线' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="isDefault" label="默认" width="80">
              <template #default="{ row }">
                <el-tag v-if="row.isDefault" type="success">是</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200" fixed="right">
              <template #default="{ row }">
                <el-button type="success" link @click="testPrinter(row)">测试打印</el-button>
                <el-button type="primary" link @click="openPrinterDialog(row)">编辑</el-button>
                <el-button type="danger" link @click="deletePrinter(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <!-- 模板信息弹窗 -->
    <el-dialog v-model="templateDialogVisible" :title="templateForm.id ? '编辑模板' : '新建模板'" width="500px">
      <el-form :model="templateForm" :rules="templateRules" ref="templateFormRef" label-width="100px">
        <el-form-item label="模板名称" prop="name">
          <el-input v-model="templateForm.name" placeholder="请输入模板名称" />
        </el-form-item>
        <el-form-item label="模板类型" prop="type">
          <el-select v-model="templateForm.type" placeholder="请选择类型">
            <el-option label="消费小票" value="receipt" />
            <el-option label="预约单" value="appointment" />
            <el-option label="会员卡" value="member_card" />
            <el-option label="服务单" value="service" />
            <el-option label="库存单" value="inventory" />
            <el-option label="自定义" value="custom" />
          </el-select>
        </el-form-item>
        <el-form-item label="纸张大小">
          <el-select v-model="templateForm.paperSize" placeholder="请选择纸张">
            <el-option label="58mm" value="58mm" />
            <el-option label="80mm" value="80mm" />
            <el-option label="A4" value="A4" />
          </el-select>
        </el-form-item>
        <el-form-item label="设为默认">
          <el-switch v-model="templateForm.isDefault" />
        </el-form-item>
        <el-form-item label="是否启用">
          <el-switch v-model="templateForm.status" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="templateForm.description" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="templateDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveTemplateInfo" :loading="saving">保存</el-button>
      </template>
    </el-dialog>

    <!-- 打印机弹窗 -->
    <el-dialog v-model="printerDialogVisible" :title="printerForm.id ? '编辑打印机' : '添加打印机'" width="500px">
      <el-form :model="printerForm" :rules="printerRules" ref="printerFormRef" label-width="100px">
        <el-form-item label="打印机名称" prop="name">
          <el-input v-model="printerForm.name" placeholder="请输入打印机名称" />
        </el-form-item>
        <el-form-item label="类型" prop="type">
          <el-radio-group v-model="printerForm.type">
            <el-radio value="network">网络打印机</el-radio>
            <el-radio value="local">本地打印机</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="IP地址" prop="ip" v-if="printerForm.type === 'network'">
          <el-input v-model="printerForm.ip" placeholder="请输入IP地址" />
        </el-form-item>
        <el-form-item label="端口" v-if="printerForm.type === 'network'">
          <el-input-number v-model="printerForm.port" :min="1" :max="65535" />
        </el-form-item>
        <el-form-item label="纸张宽度">
          <el-select v-model="printerForm.paperSize" placeholder="请选择">
            <el-option label="58mm" value="58mm" />
            <el-option label="80mm" value="80mm" />
          </el-select>
        </el-form-item>
        <el-form-item label="设为默认">
          <el-switch v-model="printerForm.isDefault" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="printerForm.remark" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="printerDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="savePrinter" :loading="savingPrinter">保存</el-button>
      </template>
    </el-dialog>

    <!-- 预览弹窗 -->
    <el-dialog v-model="previewDialogVisible" title="打印预览" width="400px">
      <div class="preview-dialog-content" v-html="previewHtml"></div>
      <template #footer>
        <el-button @click="previewDialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="printPreview">打印</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import axios from 'axios'

const activeTab = ref('list')
const loading = ref(false)
const saving = ref(false)
const printerLoading = ref(false)
const savingPrinter = ref(false)
const templateDialogVisible = ref(false)
const printerDialogVisible = ref(false)
const previewDialogVisible = ref(false)
const editingTemplate = ref(null)
const templateContent = ref('')

const templates = ref<any[]>([])
const printers = ref<any[]>([])

const templateFormRef = ref()
const printerFormRef = ref()

const templateForm = reactive({
  id: '',
  name: '',
  type: 'receipt',
  paperSize: '58mm',
  isDefault: false,
  status: true,
  description: '',
})

const printerForm = reactive({
  id: '',
  name: '',
  type: 'network',
  ip: '',
  port: 9100,
  paperSize: '58mm',
  isDefault: false,
  remark: '',
})

const templateRules = {
  name: [{ required: true, message: '请输入模板名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择模板类型', trigger: 'change' }],
}

const printerRules = {
  name: [{ required: true, message: '请输入打印机名称', trigger: 'blur' }],
  ip: [{ required: true, message: '请输入IP地址', trigger: 'blur' }],
}

const typeMap = {
  receipt: '消费小票',
  appointment: '预约单',
  member_card: '会员卡',
  service: '服务单',
  inventory: '库存单',
  custom: '自定义',
}

const getTypeName = (type: string) => typeMap[type] || type

const formatDate = (date: string) => {
  return new Date(date).toLocaleString('zh-CN')
}

// 默认模板内容
const defaultTemplates = {
  receipt: `<div style="text-align: center;">
  <div style="font-size: 16px; font-weight: bold;">{{storeName}}</div>
  <div style="font-size: 12px;">地址: {{storeAddress}}</div>
  <div style="font-size: 12px;">电话: {{storePhone}}</div>
  <hr />
  <div style="text-align: left;">
    <div>订单号: {{orderNo}}</div>
    <div>日期: {{date}} {{time}}</div>
    <div>收银员: {{cashier}}</div>
  </div>
  <hr />
  <table style="width: 100%; font-size: 12px;">
    <thead>
      <tr><th>项目</th><th>数量</th><th>金额</th></tr>
    </thead>
    <tbody>
      {{#each items}}
      <tr><td>{{name}}</td><td>{{quantity}}</td><td>{{price}}</td></tr>
      {{/each}}
    </tbody>
  </table>
  <hr />
  <div style="text-align: left;">
    <div>合计: {{total}}</div>
    <div>优惠: {{discount}}</div>
    <div>实付: {{actualAmount}}</div>
  </div>
  <hr />
  <div style="text-align: center; font-size: 12px;">
    <div>谢谢光临，欢迎再次光临!</div>
    <div>会员: {{memberName}}</div>
  </div>
</div>`,
  appointment: `<div style="text-align: center;">
  <div style="font-size: 16px; font-weight: bold;">{{storeName}}</div>
  <div>预约确认单</div>
  <hr />
  <div style="text-align: left;">
    <div>预约编号: {{appointmentNo}}</div>
    <div>预约时间: {{appointmentDate}} {{appointmentTime}}</div>
    <div>服务项目: {{serviceName}}</div>
    <div>服务人员: {{staffName}}</div>
    <div>会员: {{memberName}}</div>
    <div>联系电话: {{memberPhone}}</div>
  </div>
  <hr />
  <div style="text-align: center; font-size: 12px;">
    请准时到店，如有变动请提前联系
  </div>
</div>`,
}

const previewHtml = computed(() => {
  if (!templateContent.value) return '<div class="empty-preview">暂无内容</div>'
  
  // 简单替换变量用于预览
  let html = templateContent.value
  const sampleData = {
    storeName: '美业旗舰店',
    storeAddress: '北京市朝阳区xxx路xxx号',
    storePhone: '010-12345678',
    orderNo: 'ORD202401010001',
    date: new Date().toLocaleDateString(),
    time: new Date().toLocaleTimeString(),
    cashier: '张三',
    total: '¥299.00',
    discount: '¥30.00',
    actualAmount: '¥269.00',
    memberName: '李四',
    appointmentNo: 'APT202401010001',
    appointmentDate: new Date().toLocaleDateString(),
    appointmentTime: '14:00',
    serviceName: '美甲护理',
    staffName: '王五',
    memberPhone: '138****8888',
  }
  
  Object.keys(sampleData).forEach(key => {
    html = html.replace(new RegExp(`{{${key}}}`, 'g'), sampleData[key])
  })
  
  return html
})

// 模板操作
const fetchTemplates = async () => {
  loading.value = true
  try {
    const res = await axios.get('/api/print-templates')
    templates.value = res.data
  } catch (error) {
    ElMessage.error('获取模板列表失败')
  } finally {
    loading.value = false
  }
}

const openTemplateDialog = (template?: any) => {
  if (template) {
    Object.assign(templateForm, template)
  } else {
    Object.assign(templateForm, {
      id: '',
      name: '',
      type: 'receipt',
      paperSize: '58mm',
      isDefault: false,
      status: true,
      description: '',
    })
  }
  templateDialogVisible.value = true
}

const saveTemplateInfo = async () => {
  try {
    await templateFormRef.value.validate()
  } catch {
    return
  }

  saving.value = true
  try {
    if (templateForm.id) {
      await axios.put(`/api/print-templates/${templateForm.id}`, templateForm)
      ElMessage.success('更新成功')
    } else {
      // 新建模板时使用默认内容
      const data = {
        ...templateForm,
        content: defaultTemplates[templateForm.type] || '',
      }
      await axios.post('/api/print-templates', data)
      ElMessage.success('创建成功')
    }
    templateDialogVisible.value = false
    fetchTemplates()
  } catch (error) {
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

const editTemplate = (template: any) => {
  editingTemplate.value = template
  templateContent.value = template.content || ''
  activeTab.value = 'editor'
}

const previewTemplate = (template: any) => {
  editingTemplate.value = template
  templateContent.value = template.content || ''
  previewDialogVisible.value = true
}

const previewCurrentTemplate = () => {
  previewDialogVisible.value = true
}

const copyTemplate = async (template: any) => {
  try {
    await axios.post(`/api/print-templates/${template.id}/copy`)
    ElMessage.success('复制成功')
    fetchTemplates()
  } catch (error) {
    ElMessage.error('复制失败')
  }
}

const deleteTemplate = async (template: any) => {
  try {
    await ElMessageBox.confirm('确定要删除此模板吗？', '提示', { type: 'warning' })
    await axios.delete(`/api/print-templates/${template.id}`)
    ElMessage.success('删除成功')
    fetchTemplates()
  } catch (error) {
    // 取消操作
  }
}

const toggleTemplateStatus = async (template: any) => {
  try {
    await axios.put(`/api/print-templates/${template.id}`, { status: template.status })
    ElMessage.success('状态更新成功')
  } catch (error) {
    template.status = !template.status
    ElMessage.error('更新失败')
  }
}

const saveTemplateContent = async () => {
  if (!editingTemplate.value) return
  
  saving.value = true
  try {
    await axios.put(`/api/print-templates/${editingTemplate.value.id}`, {
      content: templateContent.value,
    })
    ElMessage.success('保存成功')
    fetchTemplates()
  } catch (error) {
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

const insertField = (field: string) => {
  const textarea = document.querySelector('.template-editor textarea') as HTMLTextAreaElement
  if (textarea) {
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const text = templateContent.value
    const insert = `{{${field}}}`
    templateContent.value = text.substring(0, start) + insert + text.substring(end)
  }
}

const insertCommand = (command: string) => {
  const commands = {
    alignLeft: '<div style="text-align: left;">',
    alignCenter: '<div style="text-align: center;">',
    alignRight: '<div style="text-align: right;">',
    bold: '<b></b>',
    divider: '<hr />',
  }
  
  const textarea = document.querySelector('.template-editor textarea') as HTMLTextAreaElement
  if (textarea && commands[command]) {
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const text = templateContent.value
    templateContent.value = text.substring(0, start) + commands[command] + text.substring(end)
  }
}

const printPreview = () => {
  const printWindow = window.open('', '_blank')
  if (printWindow) {
    printWindow.document.write(`
      <html>
        <head><title>打印预览</title></head>
        <body>${previewHtml.value}</body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
  }
}

// 打印机操作
const fetchPrinters = async () => {
  printerLoading.value = true
  try {
    const res = await axios.get('/api/printers')
    printers.value = res.data
  } catch (error) {
    ElMessage.error('获取打印机列表失败')
  } finally {
    printerLoading.value = false
  }
}

const openPrinterDialog = (printer?: any) => {
  if (printer) {
    Object.assign(printerForm, printer)
  } else {
    Object.assign(printerForm, {
      id: '',
      name: '',
      type: 'network',
      ip: '',
      port: 9100,
      paperSize: '58mm',
      isDefault: false,
      remark: '',
    })
  }
  printerDialogVisible.value = true
}

const savePrinter = async () => {
  try {
    await printerFormRef.value.validate()
  } catch {
    return
  }

  savingPrinter.value = true
  try {
    if (printerForm.id) {
      await axios.put(`/api/printers/${printerForm.id}`, printerForm)
      ElMessage.success('更新成功')
    } else {
      await axios.post('/api/printers', printerForm)
      ElMessage.success('添加成功')
    }
    printerDialogVisible.value = false
    fetchPrinters()
  } catch (error) {
    ElMessage.error('保存失败')
  } finally {
    savingPrinter.value = false
  }
}

const testPrinter = async (printer: any) => {
  try {
    await axios.post(`/api/printers/${printer.id}/test`)
    ElMessage.success('测试打印已发送')
  } catch (error) {
    ElMessage.error('测试打印失败')
  }
}

const deletePrinter = async (printer: any) => {
  try {
    await ElMessageBox.confirm('确定要删除此打印机吗？', '提示', { type: 'warning' })
    await axios.delete(`/api/printers/${printer.id}`)
    ElMessage.success('删除成功')
    fetchPrinters()
  } catch (error) {
    // 取消操作
  }
}

onMounted(() => {
  fetchTemplates()
  fetchPrinters()
})
</script>

<style scoped>
.print-template-page {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.editor-section {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
}

.editor-toolbar {
  padding: 10px;
  border-bottom: 1px solid #dcdfe6;
  background: #f5f7fa;
}

.template-editor :deep(textarea) {
  font-family: monospace;
  font-size: 13px;
  line-height: 1.5;
  border: none;
  border-radius: 0;
}

.preview-section {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  height: 100%;
}

.preview-header {
  padding: 10px;
  border-bottom: 1px solid #dcdfe6;
  background: #f5f7fa;
  font-weight: bold;
}

.preview-content {
  padding: 15px;
  background: #fff;
  min-height: 500px;
  font-family: monospace;
  font-size: 12px;
}

.empty-preview {
  color: #909399;
  text-align: center;
  padding: 50px;
}

.preview-dialog-content {
  background: #fff;
  padding: 15px;
  border: 1px solid #dcdfe6;
  font-family: monospace;
  font-size: 12px;
  min-height: 300px;
}
</style>
