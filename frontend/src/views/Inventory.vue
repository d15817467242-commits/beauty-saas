<template>
  <div class="inventory-page">
    <el-tabs v-model="activeTab" type="border-card">
      <!-- 产品库存 -->
      <el-tab-pane label="产品库存" name="products">
        <div class="toolbar">
          <el-button type="primary" @click="showProductDialog()">新增产品</el-button>
          <el-input v-model="productSearch" placeholder="搜索产品" style="width: 200px; margin-left: 16px;" clearable />
        </div>
        <el-table :data="filteredProducts" stripe>
          <el-table-column prop="name" label="产品名称" />
          <el-table-column prop="productCode" label="编码" />
          <el-table-column prop="specification" label="规格" />
          <el-table-column prop="unit" label="单位" />
          <el-table-column prop="costPrice" label="成本价">
            <template #default="{ row }">¥{{ row.costPrice }}</template>
          </el-table-column>
          <el-table-column prop="salePrice" label="销售价">
            <template #default="{ row }">¥{{ row.salePrice }}</template>
          </el-table-column>
          <el-table-column prop="stock.quantity" label="库存">
            <template #default="{ row }">
              <span :class="{ 'low-stock': row.stock?.quantity <= row.stock?.warningQuantity }">
                {{ row.stock?.quantity || 0 }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200">
            <template #default="{ row }">
              <el-button link @click="showStockMovementDialog(row)">入库</el-button>
              <el-button link @click="showStockOutDialog(row)">出库</el-button>
              <el-button link @click="showProductDialog(row)">编辑</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- 耗材管理 -->
      <el-tab-pane label="耗材管理" name="consumables">
        <div class="toolbar">
          <el-button type="primary" @click="showConsumableDialog()">新增耗材</el-button>
        </div>
        <el-table :data="filteredConsumables" stripe>
          <el-table-column prop="name" label="耗材名称" />
          <el-table-column prop="consumableCode" label="编码" />
          <el-table-column prop="specification" label="规格" />
          <el-table-column prop="unit" label="单位" />
          <el-table-column prop="costPrice" label="成本价">
            <template #default="{ row }">¥{{ row.costPrice }}</template>
          </el-table-column>
          <el-table-column prop="stock" label="库存">
            <template #default="{ row }">
              <span :class="{ 'low-stock': row.stock <= row.warningStock }">
                {{ row.stock }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="warningStock" label="预警值" />
          <el-table-column label="操作" width="200">
            <template #default="{ row }">
              <el-button link @click="showConsumableMovementDialog(row)">入库</el-button>
              <el-button link @click="showConsumableDialog(row)">编辑</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- 库存预警 -->
      <el-tab-pane label="库存预警" name="warnings">
        <el-table :data="stockWarnings" stripe>
          <el-table-column prop="product.name" label="产品名称" />
          <el-table-column prop="currentQuantity" label="当前库存">
            <template #default="{ row }">
              <span class="low-stock">{{ row.currentQuantity }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="warningQuantity" label="预警值" />
          <el-table-column prop="isHandled" label="状态">
            <template #default="{ row }">
              <el-tag :type="row.isHandled ? 'success' : 'danger'">
                {{ row.isHandled ? '已处理' : '待处理' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100">
            <template #default="{ row }">
              <el-button v-if="!row.isHandled" link type="primary" @click="handleWarning(row)">处理</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- 出入库记录 -->
      <el-tab-pane label="出入库记录" name="movements">
        <el-table :data="stockMovements" stripe>
          <el-table-column prop="product.name" label="产品" />
          <el-table-column prop="movementType" label="类型">
            <template #default="{ row }">
              <el-tag :type="row.movementType === 'in' ? 'success' : row.movementType === 'out' ? 'danger' : 'info'">
                {{ row.movementType === 'in' ? '入库' : row.movementType === 'out' ? '出库' : '调整' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="quantity" label="数量" />
          <el-table-column prop="beforeQuantity" label="变动前" />
          <el-table-column prop="afterQuantity" label="变动后" />
          <el-table-column prop="remark" label="备注" />
          <el-table-column prop="createdAt" label="时间">
            <template #default="{ row }">{{ new Date(row.createdAt).toLocaleString() }}</template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- 服务耗材关联 -->
      <el-tab-pane label="服务耗材" name="serviceConsumables">
        <div class="toolbar">
          <el-select v-model="selectedServiceId" placeholder="选择服务" style="width: 200px;">
            <el-option v-for="s in services" :key="s.id" :label="s.name" :value="s.id" />
          </el-select>
          <el-button type="primary" @click="showServiceConsumableDialog()" :disabled="!selectedServiceId">添加耗材</el-button>
        </div>
        <el-table :data="serviceConsumables" stripe>
          <el-table-column prop="consumable.name" label="耗材名称" />
          <el-table-column prop="consumable.specification" label="规格" />
          <el-table-column prop="quantity" label="用量" />
          <el-table-column prop="consumable.unit" label="单位" />
          <el-table-column label="操作" width="100">
            <template #default="{ row }">
              <el-button link type="danger" @click="removeServiceConsumable(row.consumableId)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <!-- 产品对话框 -->
    <el-dialog v-model="productDialogVisible" title="产品" width="500px">
      <el-form :model="productForm" label-width="80px">
        <el-form-item label="名称">
          <el-input v-model="productForm.name" />
        </el-form-item>
        <el-form-item label="编码">
          <el-input v-model="productForm.productCode" />
        </el-form-item>
        <el-form-item label="规格">
          <el-input v-model="productForm.specification" />
        </el-form-item>
        <el-form-item label="单位">
          <el-input v-model="productForm.unit" />
        </el-form-item>
        <el-form-item label="成本价">
          <el-input-number v-model="productForm.costPrice" :min="0" :precision="2" />
        </el-form-item>
        <el-form-item label="销售价">
          <el-input-number v-model="productForm.salePrice" :min="0" :precision="2" />
        </el-form-item>
        <el-form-item label="品牌">
          <el-input v-model="productForm.brand" />
        </el-form-item>
        <el-form-item label="分类">
          <el-input v-model="productForm.category" />
        </el-form-item>
        <el-form-item label="供应商">
          <el-input v-model="productForm.supplier" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="productDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveProduct">保存</el-button>
      </template>
    </el-dialog>

    <!-- 库存变动对话框 -->
    <el-dialog v-model="stockMovementDialogVisible" title="入库" width="400px">
      <el-form :model="stockMovementForm" label-width="80px">
        <el-form-item label="产品">
          <el-input :value="stockMovementForm.productName" disabled />
        </el-form-item>
        <el-form-item label="数量">
          <el-input-number v-model="stockMovementForm.quantity" :min="1" />
        </el-form-item>
        <el-form-item label="单价">
          <el-input-number v-model="stockMovementForm.unitPrice" :min="0" :precision="2" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="stockMovementForm.remark" type="textarea" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="stockMovementDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveStockMovement">确认入库</el-button>
      </template>
    </el-dialog>

    <!-- 出库对话框 -->
    <el-dialog v-model="stockOutDialogVisible" title="出库" width="400px">
      <el-form :model="stockOutForm" label-width="80px">
        <el-form-item label="产品">
          <el-input :value="stockOutForm.productName" disabled />
        </el-form-item>
        <el-form-item label="当前库存">
          <el-input :value="stockOutForm.currentStock" disabled />
        </el-form-item>
        <el-form-item label="出库数量">
          <el-input-number v-model="stockOutForm.quantity" :min="1" :max="stockOutForm.currentStock" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="stockOutForm.remark" type="textarea" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="stockOutDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveStockOut">确认出库</el-button>
      </template>
    </el-dialog>

    <!-- 耗材对话框 -->
    <el-dialog v-model="consumableDialogVisible" title="耗材" width="500px">
      <el-form :model="consumableForm" label-width="80px">
        <el-form-item label="名称">
          <el-input v-model="consumableForm.name" />
        </el-form-item>
        <el-form-item label="编码">
          <el-input v-model="consumableForm.consumableCode" />
        </el-form-item>
        <el-form-item label="规格">
          <el-input v-model="consumableForm.specification" />
        </el-form-item>
        <el-form-item label="单位">
          <el-input v-model="consumableForm.unit" />
        </el-form-item>
        <el-form-item label="成本价">
          <el-input-number v-model="consumableForm.costPrice" :min="0" :precision="2" />
        </el-form-item>
        <el-form-item label="预警库存">
          <el-input-number v-model="consumableForm.warningStock" :min="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="consumableDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveConsumable">保存</el-button>
      </template>
    </el-dialog>

    <!-- 耗材入库对话框 -->
    <el-dialog v-model="consumableMovementDialogVisible" title="耗材入库" width="400px">
      <el-form :model="consumableMovementForm" label-width="80px">
        <el-form-item label="耗材">
          <el-input :value="consumableMovementForm.consumableName" disabled />
        </el-form-item>
        <el-form-item label="数量">
          <el-input-number v-model="consumableMovementForm.quantity" :min="0.01" :precision="2" />
        </el-form-item>
        <el-form-item label="单价">
          <el-input-number v-model="consumableMovementForm.unitPrice" :min="0" :precision="2" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="consumableMovementForm.remark" type="textarea" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="consumableMovementDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveConsumableMovement">确认入库</el-button>
      </template>
    </el-dialog>

    <!-- 服务耗材对话框 -->
    <el-dialog v-model="serviceConsumableDialogVisible" title="添加服务耗材" width="400px">
      <el-form :model="serviceConsumableForm" label-width="80px">
        <el-form-item label="耗材">
          <el-select v-model="serviceConsumableForm.consumableId">
            <el-option v-for="c in consumables" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="用量">
          <el-input-number v-model="serviceConsumableForm.quantity" :min="0.01" :precision="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="serviceConsumableDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveServiceConsumable">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'

const activeTab = ref('products')
const products = ref<any[]>([])
const consumables = ref<any[]>([])
const stockWarnings = ref<any[]>([])
const stockMovements = ref<any[]>([])
const serviceConsumables = ref<any[]>([])
const services = ref<any[]>([])
const productSearch = ref('')
const selectedServiceId = ref('')

// 对话框
const productDialogVisible = ref(false)
const stockMovementDialogVisible = ref(false)
const stockOutDialogVisible = ref(false)
const consumableDialogVisible = ref(false)
const consumableMovementDialogVisible = ref(false)
const serviceConsumableDialogVisible = ref(false)

// 表单
const productForm = ref<any>({})
const stockMovementForm = ref<any>({})
const stockOutForm = ref<any>({})
const consumableForm = ref<any>({ warningStock: 10 })
const consumableMovementForm = ref<any>({})
const serviceConsumableForm = ref<any>({ quantity: 1 })

const filteredProducts = computed(() => {
  if (!productSearch.value) return products.value
  return products.value.filter(p => 
    p.name.includes(productSearch.value) || 
    p.productCode?.includes(productSearch.value)
  )
})

const filteredConsumables = computed(() => consumables.value)

const loadData = async () => {
  try {
    const [productsRes, consumablesRes, warningsRes, movementsRes, servicesRes] = await Promise.all([
      axios.get('/api/inventory/products'),
      axios.get('/api/inventory/consumables'),
      axios.get('/api/inventory/stock/warnings'),
      axios.get('/api/inventory/stock/movements'),
      axios.get('/api/services'),
    ])
    products.value = productsRes.data
    consumables.value = consumablesRes.data
    stockWarnings.value = warningsRes.data
    stockMovements.value = movementsRes.data
    services.value = servicesRes.data
  } catch (e) {
    ElMessage.error('加载数据失败')
  }
}

// 产品
const showProductDialog = (row?: any) => {
  productForm.value = row ? { ...row } : {}
  productDialogVisible.value = true
}

const saveProduct = async () => {
  try {
    if (productForm.value.id) {
      await axios.put(`/api/inventory/products/${productForm.value.id}`, productForm.value)
    } else {
      await axios.post('/api/inventory/products', productForm.value)
    }
    productDialogVisible.value = false
    loadData()
    ElMessage.success('保存成功')
  } catch (e) {
    ElMessage.error('保存失败')
  }
}

// 入库
const showStockMovementDialog = (row: any) => {
  stockMovementForm.value = { productId: row.id, productName: row.name, quantity: 1, unitPrice: row.costPrice }
  stockMovementDialogVisible.value = true
}

const saveStockMovement = async () => {
  try {
    await axios.post('/api/inventory/stock/movement', {
      ...stockMovementForm.value,
      movementType: 'in',
    })
    stockMovementDialogVisible.value = false
    loadData()
    ElMessage.success('入库成功')
  } catch (e) {
    ElMessage.error('入库失败')
  }
}

// 出库
const showStockOutDialog = (row: any) => {
  stockOutForm.value = { 
    productId: row.id, 
    productName: row.name, 
    currentStock: row.stock?.quantity || 0,
    quantity: 1 
  }
  stockOutDialogVisible.value = true
}

const saveStockOut = async () => {
  try {
    await axios.post('/api/inventory/stock/movement', {
      productId: stockOutForm.value.productId,
      movementType: 'out',
      quantity: stockOutForm.value.quantity,
      remark: stockOutForm.value.remark,
    })
    stockOutDialogVisible.value = false
    loadData()
    ElMessage.success('出库成功')
  } catch (e) {
    ElMessage.error('出库失败')
  }
}

// 耗材
const showConsumableDialog = (row?: any) => {
  consumableForm.value = row ? { ...row } : { warningStock: 10 }
  consumableDialogVisible.value = true
}

const saveConsumable = async () => {
  try {
    if (consumableForm.value.id) {
      await axios.put(`/api/inventory/consumables/${consumableForm.value.id}`, consumableForm.value)
    } else {
      await axios.post('/api/inventory/consumables', consumableForm.value)
    }
    consumableDialogVisible.value = false
    loadData()
    ElMessage.success('保存成功')
  } catch (e) {
    ElMessage.error('保存失败')
  }
}

const showConsumableMovementDialog = (row: any) => {
  consumableMovementForm.value = { 
    consumableId: row.id, 
    consumableName: row.name, 
    quantity: 1, 
    unitPrice: row.costPrice 
  }
  consumableMovementDialogVisible.value = true
}

const saveConsumableMovement = async () => {
  try {
    await axios.post('/api/inventory/consumables/movement', {
      ...consumableMovementForm.value,
      movementType: 'in',
    })
    consumableMovementDialogVisible.value = false
    loadData()
    ElMessage.success('入库成功')
  } catch (e) {
    ElMessage.error('入库失败')
  }
}

// 预警处理
const handleWarning = async (row: any) => {
  const { value } = await ElMessageBox.prompt('请输入处理说明', '处理预警')
  await axios.post(`/api/inventory/stock/warnings/${row.id}/handle`, { remark: value })
  loadData()
  ElMessage.success('已处理')
}

// 服务耗材
watch(selectedServiceId, async (val) => {
  if (val) {
    const res = await axios.get(`/api/inventory/service-consumables/${val}`)
    serviceConsumables.value = res.data
  } else {
    serviceConsumables.value = []
  }
})

const showServiceConsumableDialog = () => {
  serviceConsumableForm.value = { quantity: 1 }
  serviceConsumableDialogVisible.value = true
}

const saveServiceConsumable = async () => {
  try {
    await axios.post('/api/inventory/service-consumables', {
      serviceId: selectedServiceId.value,
      ...serviceConsumableForm.value,
    })
    serviceConsumableDialogVisible.value = false
    const res = await axios.get(`/api/inventory/service-consumables/${selectedServiceId.value}`)
    serviceConsumables.value = res.data
    ElMessage.success('保存成功')
  } catch (e) {
    ElMessage.error('保存失败')
  }
}

const removeServiceConsumable = async (consumableId: string) => {
  await ElMessageBox.confirm('确定删除？')
  await axios.delete(`/api/inventory/service-consumables/${selectedServiceId.value}/${consumableId}`)
  const res = await axios.get(`/api/inventory/service-consumables/${selectedServiceId.value}`)
  serviceConsumables.value = res.data
  ElMessage.success('删除成功')
}

onMounted(loadData)
</script>

<style scoped>
.inventory-page {
  padding: 20px;
}
.toolbar {
  margin-bottom: 16px;
  display: flex;
  align-items: center;
}
.low-stock {
  color: #f56c6c;
  font-weight: bold;
}
</style>
