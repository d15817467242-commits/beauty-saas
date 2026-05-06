<template>
  <div class="training-page">
    <el-tabs v-model="activeTab" class="training-tabs">
      <!-- 培训课程 -->
      <el-tab-pane label="培训课程" name="courses">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>培训课程管理</span>
              <el-button type="primary" @click="handleAddCourse">新增课程</el-button>
            </div>
          </template>

          <el-row :gutter="20">
            <el-col :span="6" v-for="course in courseList" :key="course.id">
              <el-card shadow="hover" class="course-card" @click="handleViewCourse(course)">
                <div class="course-cover">
                  <el-icon :size="60" color="#409EFF"><Reading /></el-icon>
                </div>
                <div class="course-info">
                  <div class="course-name">{{ course.name }}</div>
                  <div class="course-meta">
                    <el-tag size="small" :type="categoryMap[course.category]?.type">
                      {{ categoryMap[course.category]?.label || course.category }}
                    </el-tag>
                    <span class="course-duration">{{ course.duration }}课时</span>
                  </div>
                  <div class="course-desc">{{ course.description || '暂无描述' }}</div>
                  <div class="course-stats">
                    <span><el-icon><User /></el-icon> {{ course.enrolledCount || 0 }}人已学</span>
                    <el-rate v-model="course.rating" disabled show-score text-color="#ff9900" />
                  </div>
                </div>
                <div class="course-actions">
                  <el-button size="small" @click.stop="handleEditCourse(course)">编辑</el-button>
                  <el-button size="small" type="primary" @click.stop="handleEnroll(course)">分配学员</el-button>
                  <el-button size="small" type="danger" @click.stop="handleDeleteCourse(course)">删除</el-button>
                </div>
              </el-card>
            </el-col>
          </el-row>

          <el-empty v-if="!courseList.length && !coursesLoading" description="暂无培训课程" />
        </el-card>
      </el-tab-pane>

      <!-- 培训记录 -->
      <el-tab-pane label="培训记录" name="records">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>培训记录</span>
              <div class="filter-bar">
                <el-select v-model="filterCourseId" placeholder="选择课程" clearable @change="loadRecords" style="width: 200px;">
                  <el-option v-for="c in courseList" :key="c.id" :label="c.name" :value="c.id" />
                </el-select>
                <el-select v-model="filterEmployeeId" placeholder="选择员工" clearable @change="loadRecords" style="margin-left: 10px; width: 150px;">
                  <el-option v-for="e in employeeList" :key="e.id" :label="e.name" :value="e.id" />
                </el-select>
                <el-select v-model="filterStatus" placeholder="学习状态" clearable @change="loadRecords" style="margin-left: 10px; width: 120px;">
                  <el-option label="未开始" value="not_started" />
                  <el-option label="学习中" value="in_progress" />
                  <el-option label="已完成" value="completed" />
                </el-select>
              </div>
            </div>
          </template>

          <el-table :data="recordList" v-loading="recordsLoading" stripe>
            <el-table-column prop="employee.name" label="员工" width="100" />
            <el-table-column prop="employee.position" label="职位" width="100" />
            <el-table-column prop="course.name" label="课程名称" width="200" />
            <el-table-column prop="course.category" label="课程类型" width="100">
              <template #default="{ row }">
                <el-tag :type="categoryMap[row.course?.category]?.type" size="small">
                  {{ categoryMap[row.course?.category]?.label || row.course?.category }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="学习进度" width="200">
              <template #default="{ row }">
                <el-progress 
                  :percentage="row.progress || 0" 
                  :status="row.progress === 100 ? 'success' : ''"
                  :stroke-width="10"
                />
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="statusMap[row.status]?.type">
                  {{ statusMap[row.status]?.label || row.status }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="score" label="考核成绩" width="100">
              <template #default="{ row }">
                <span v-if="row.score !== null && row.score !== undefined">
                  <el-tag :type="row.score >= 60 ? 'success' : 'danger'">{{ row.score }}分</el-tag>
                </span>
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column prop="startTime" label="开始时间" width="120">
              <template #default="{ row }">
                {{ row.startTime ? formatDate(row.startTime) : '-' }}
              </template>
            </el-table-column>
            <el-table-column prop="completeTime" label="完成时间" width="120">
              <template #default="{ row }">
                {{ row.completeTime ? formatDate(row.completeTime) : '-' }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150">
              <template #default="{ row }">
                <el-button size="small" @click="handleViewRecord(row)">详情</el-button>
                <el-button size="small" type="primary" @click="handleExam(row)" v-if="row.status === 'completed' && !row.score">考核</el-button>
              </template>
            </el-table-column>
          </el-table>

          <el-pagination
            v-model:current-page="recordPage"
            v-model:page-size="recordPageSize"
            :total="recordTotal"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="loadRecords"
            @current-change="loadRecords"
            style="margin-top: 20px; justify-content: flex-end;"
          />
        </el-card>
      </el-tab-pane>

      <!-- 培训统计 -->
      <el-tab-pane label="培训统计" name="stats">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-card shadow="hover" class="stat-card">
              <div class="stat-content">
                <el-icon :size="40" color="#409EFF"><Reading /></el-icon>
                <div class="stat-info">
                  <div class="stat-value">{{ stats.totalCourses }}</div>
                  <div class="stat-label">培训课程</div>
                </div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover" class="stat-card">
              <div class="stat-content">
                <el-icon :size="40" color="#67C23A"><User /></el-icon>
                <div class="stat-info">
                  <div class="stat-value">{{ stats.totalEnrolled }}</div>
                  <div class="stat-label">参与人次</div>
                </div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover" class="stat-card">
              <div class="stat-content">
                <el-icon :size="40" color="#E6A23C"><CircleCheck /></el-icon>
                <div class="stat-info">
                  <div class="stat-value">{{ stats.completedCount }}</div>
                  <div class="stat-label">完成人次</div>
                </div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover" class="stat-card">
              <div class="stat-content">
                <el-icon :size="40" color="#F56C6C"><TrendCharts /></el-icon>
                <div class="stat-info">
                  <div class="stat-value">{{ stats.avgScore }}分</div>
                  <div class="stat-label">平均成绩</div>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>

        <el-card style="margin-top: 20px;">
          <template #header>
            <span>员工培训排行</span>
          </template>
          <el-table :data="employeeRankList" stripe>
            <el-table-column type="index" label="排名" width="60" />
            <el-table-column prop="employeeName" label="员工" width="100" />
            <el-table-column prop="position" label="职位" width="100" />
            <el-table-column prop="completedCourses" label="完成课程数" width="120" />
            <el-table-column prop="totalHours" label="学习时长" width="120">
              <template #default="{ row }">
                {{ row.totalHours }}小时
              </template>
            </el-table-column>
            <el-table-column prop="avgScore" label="平均成绩" width="120">
              <template #default="{ row }">
                <el-tag :type="row.avgScore >= 80 ? 'success' : row.avgScore >= 60 ? 'warning' : 'danger'">
                  {{ row.avgScore }}分
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="学习进度">
              <template #default="{ row }">
                <el-progress :percentage="row.progress" :stroke-width="10" />
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <!-- 课程编辑对话框 -->
    <el-dialog v-model="courseDialogVisible" :title="isEditCourse ? '编辑课程' : '新增课程'" width="600px">
      <el-form :model="courseForm" label-width="100px">
        <el-form-item label="课程名称" required>
          <el-input v-model="courseForm.name" placeholder="请输入课程名称" />
        </el-form-item>
        <el-form-item label="课程类型" required>
          <el-select v-model="courseForm.category" placeholder="选择类型" style="width: 100%">
            <el-option label="技能培训" value="skill" />
            <el-option label="服务培训" value="service" />
            <el-option label="安全培训" value="safety" />
            <el-option label="管理培训" value="management" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="课时数" required>
          <el-input-number v-model="courseForm.duration" :min="1" :max="100" />
          <span style="margin-left: 10px">课时</span>
        </el-form-item>
        <el-form-item label="讲师">
          <el-input v-model="courseForm.instructor" placeholder="请输入讲师姓名" />
        </el-form-item>
        <el-form-item label="课程描述">
          <el-input v-model="courseForm.description" type="textarea" rows="3" placeholder="请输入课程描述" />
        </el-form-item>
        <el-form-item label="课程内容">
          <el-input v-model="courseForm.content" type="textarea" rows="5" placeholder="请输入课程内容大纲" />
        </el-form-item>
        <el-form-item label="考核方式">
          <el-radio-group v-model="courseForm.examType">
            <el-radio value="none">无需考核</el-radio>
            <el-radio value="online">在线考试</el-radio>
            <el-radio value="practice">实操考核</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="及格分数" v-if="courseForm.examType !== 'none'">
          <el-input-number v-model="courseForm.passScore" :min="0" :max="100" />
          <span style="margin-left: 10px">分</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="courseDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="courseSubmitting" @click="handleCourseSubmit">保存</el-button>
      </template>
    </el-dialog>

    <!-- 分配学员对话框 -->
    <el-dialog v-model="enrollDialogVisible" title="分配学员" width="500px">
      <el-form label-width="80px">
        <el-form-item label="课程">
          <span>{{ currentCourse?.name }}</span>
        </el-form-item>
        <el-form-item label="选择员工">
          <el-select v-model="enrollEmployeeIds" multiple placeholder="选择员工" style="width: 100%">
            <el-option v-for="e in employeeList" :key="e.id" :label="e.name" :value="e.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="截止日期">
          <el-date-picker v-model="enrollDeadline" type="date" placeholder="选择截止日期" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="enrollDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="enrollSubmitting" @click="handleEnrollSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 记录详情对话框 -->
    <el-dialog v-model="recordDetailVisible" title="培训记录详情" width="600px">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="员工">{{ currentRecord?.employee?.name }}</el-descriptions-item>
        <el-descriptions-item label="职位">{{ currentRecord?.employee?.position }}</el-descriptions-item>
        <el-descriptions-item label="课程名称" :span="2">{{ currentRecord?.course?.name }}</el-descriptions-item>
        <el-descriptions-item label="课程类型">
          <el-tag :type="categoryMap[currentRecord?.course?.category]?.type" size="small">
            {{ categoryMap[currentRecord?.course?.category]?.label }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="课时">{{ currentRecord?.course?.duration }}课时</el-descriptions-item>
        <el-descriptions-item label="学习进度">
          <el-progress :percentage="currentRecord?.progress || 0" :stroke-width="15" style="width: 150px;" />
        </el-descriptions-item>
        <el-descriptions-item label="学习状态">
          <el-tag :type="statusMap[currentRecord?.status]?.type">
            {{ statusMap[currentRecord?.status]?.label }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="开始时间">{{ currentRecord?.startTime ? formatDate(currentRecord.startTime) : '-' }}</el-descriptions-item>
        <el-descriptions-item label="完成时间">{{ currentRecord?.completeTime ? formatDate(currentRecord.completeTime) : '-' }}</el-descriptions-item>
        <el-descriptions-item label="考核成绩">
          <el-tag v-if="currentRecord?.score !== null && currentRecord?.score !== undefined" 
            :type="currentRecord.score >= 60 ? 'success' : 'danger'">
            {{ currentRecord.score }}分
          </el-tag>
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ currentRecord?.remark || '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>

    <!-- 考核对话框 -->
    <el-dialog v-model="examDialogVisible" title="考核评分" width="400px">
      <el-form :model="examForm" label-width="100px">
        <el-form-item label="员工">
          <span>{{ currentRecord?.employee?.name }}</span>
        </el-form-item>
        <el-form-item label="课程">
          <span>{{ currentRecord?.course?.name }}</span>
        </el-form-item>
        <el-form-item label="考核成绩" required>
          <el-input-number v-model="examForm.score" :min="0" :max="100" />
          <span style="margin-left: 10px">分</span>
        </el-form-item>
        <el-form-item label="评语">
          <el-input v-model="examForm.comment" type="textarea" rows="3" placeholder="请输入评语" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="examDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="examSubmitting" @click="handleExamSubmit">提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Reading, User, CircleCheck, TrendCharts } from '@element-plus/icons-vue'

const API_BASE = 'http://localhost:3000/api'
const token = localStorage.getItem('token') || ''

const categoryMap: Record<string, { label: string; type: string }> = {
  skill: { label: '技能培训', type: 'primary' },
  service: { label: '服务培训', type: 'success' },
  safety: { label: '安全培训', type: 'warning' },
  management: { label: '管理培训', type: 'danger' },
  other: { label: '其他', type: 'info' },
}

const statusMap: Record<string, { label: string; type: string }> = {
  not_started: { label: '未开始', type: 'info' },
  in_progress: { label: '学习中', type: 'warning' },
  completed: { label: '已完成', type: 'success' },
}

const activeTab = ref('courses')
const employeeList = ref<any[]>([])

// 课程相关
const coursesLoading = ref(false)
const courseList = ref<any[]>([])
const courseDialogVisible = ref(false)
const isEditCourse = ref(false)
const editCourseId = ref('')
const courseSubmitting = ref(false)

const courseForm = ref({
  name: '',
  category: 'skill',
  duration: 1,
  instructor: '',
  description: '',
  content: '',
  examType: 'none',
  passScore: 60,
})

// 记录相关
const recordsLoading = ref(false)
const recordList = ref<any[]>([])
const filterCourseId = ref('')
const filterEmployeeId = ref('')
const filterStatus = ref('')
const recordPage = ref(1)
const recordPageSize = ref(20)
const recordTotal = ref(0)
const recordDetailVisible = ref(false)
const currentRecord = ref<any>(null)

// 分配学员
const enrollDialogVisible = ref(false)
const enrollSubmitting = ref(false)
const currentCourse = ref<any>(null)
const enrollEmployeeIds = ref<string[]>([])
const enrollDeadline = ref('')

// 考核
const examDialogVisible = ref(false)
const examSubmitting = ref(false)
const examForm = ref({
  score: 0,
  comment: '',
})

// 统计
const stats = ref({
  totalCourses: 0,
  totalEnrolled: 0,
  completedCount: 0,
  avgScore: 0,
})
const employeeRankList = ref<any[]>([])

const formatDate = (date: string | Date) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString()
}

const loadCourses = async () => {
  coursesLoading.value = true
  try {
    const res = await fetch(`${API_BASE}/training/courses`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    courseList.value = await res.json()
  } catch (e) {
    ElMessage.error('加载课程失败')
  } finally {
    coursesLoading.value = false
  }
}

const loadRecords = async () => {
  recordsLoading.value = true
  try {
    const params = new URLSearchParams()
    params.append('page', String(recordPage.value))
    params.append('pageSize', String(recordPageSize.value))
    
    if (filterCourseId.value) params.append('courseId', filterCourseId.value)
    if (filterEmployeeId.value) params.append('employeeId', filterEmployeeId.value)
    if (filterStatus.value) params.append('status', filterStatus.value)

    const res = await fetch(`${API_BASE}/training/records?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const data = await res.json()
    recordList.value = data.data || data.records || data.list || data.items || data
    recordTotal.value = data.total || recordList.value.length
  } catch (e) {
    ElMessage.error('加载记录失败')
  } finally {
    recordsLoading.value = false
  }
}

const loadEmployees = async () => {
  try {
    const res = await fetch(`${API_BASE}/employees`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    employeeList.value = await res.json()
  } catch (e) {}
}

const loadStats = async () => {
  try {
    const res = await fetch(`${API_BASE}/training/stats`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const data = await res.json()
    stats.value = data.stats || stats.value
    employeeRankList.value = data.rankList || []
  } catch (e) {
    console.error(e)
  }
}

const handleAddCourse = () => {
  isEditCourse.value = false
  courseForm.value = {
    name: '',
    category: 'skill',
    duration: 1,
    instructor: '',
    description: '',
    content: '',
    examType: 'none',
    passScore: 60,
  }
  courseDialogVisible.value = true
}

const handleEditCourse = (course: any) => {
  isEditCourse.value = true
  editCourseId.value = course.id
  courseForm.value = {
    name: course.name,
    category: course.category,
    duration: course.duration,
    instructor: course.instructor || '',
    description: course.description || '',
    content: course.content || '',
    examType: course.examType || 'none',
    passScore: course.passScore || 60,
  }
  courseDialogVisible.value = true
}

const handleViewCourse = (course: any) => {
  ElMessage.info(`查看课程详情: ${course.name}`)
}

const handleDeleteCourse = async (course: any) => {
  try {
    await ElMessageBox.confirm('确定要删除该课程吗？', '提示', { type: 'warning' })
    const res = await fetch(`${API_BASE}/training/courses/${course.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    })
    if (res.ok) {
      ElMessage.success('删除成功')
      loadCourses()
    }
  } catch (e) {}
}

const handleCourseSubmit = async () => {
  if (!courseForm.value.name) {
    ElMessage.warning('请输入课程名称')
    return
  }
  courseSubmitting.value = true
  try {
    const url = isEditCourse.value 
      ? `${API_BASE}/training/courses/${editCourseId.value}` 
      : `${API_BASE}/training/courses`
    const method = isEditCourse.value ? 'PATCH' : 'POST'
    
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(courseForm.value)
    })
    
    if (res.ok) {
      ElMessage.success(isEditCourse.value ? '修改成功' : '添加成功')
      courseDialogVisible.value = false
      loadCourses()
    } else {
      const err = await res.json()
      ElMessage.error(err.message || '操作失败')
    }
  } catch (e) {
    ElMessage.error('网络错误')
  } finally {
    courseSubmitting.value = false
  }
}

const handleEnroll = (course: any) => {
  currentCourse.value = course
  enrollEmployeeIds.value = []
  enrollDeadline.value = ''
  enrollDialogVisible.value = true
}

const handleEnrollSubmit = async () => {
  if (!enrollEmployeeIds.value.length) {
    ElMessage.warning('请选择员工')
    return
  }
  enrollSubmitting.value = true
  try {
    const res = await fetch(`${API_BASE}/training/enroll`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        courseId: currentCourse.value.id,
        employeeIds: enrollEmployeeIds.value,
        deadline: enrollDeadline.value,
      })
    })
    
    if (res.ok) {
      ElMessage.success('分配成功')
      enrollDialogVisible.value = false
      loadRecords()
      loadStats()
    } else {
      const err = await res.json()
      ElMessage.error(err.message || '操作失败')
    }
  } catch (e) {
    ElMessage.error('网络错误')
  } finally {
    enrollSubmitting.value = false
  }
}

const handleViewRecord = (record: any) => {
  currentRecord.value = record
  recordDetailVisible.value = true
}

const handleExam = (record: any) => {
  currentRecord.value = record
  examForm.value = {
    score: 0,
    comment: '',
  }
  examDialogVisible.value = true
}

const handleExamSubmit = async () => {
  if (examForm.value.score < 0 || examForm.value.score > 100) {
    ElMessage.warning('请输入有效的成绩(0-100)')
    return
  }
  examSubmitting.value = true
  try {
    const res = await fetch(`${API_BASE}/training/records/${currentRecord.value.id}/exam`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(examForm.value)
    })
    
    if (res.ok) {
      ElMessage.success('考核成绩已提交')
      examDialogVisible.value = false
      loadRecords()
      loadStats()
    } else {
      const err = await res.json()
      ElMessage.error(err.message || '操作失败')
    }
  } catch (e) {
    ElMessage.error('网络错误')
  } finally {
    examSubmitting.value = false
  }
}

onMounted(() => {
  loadCourses()
  loadRecords()
  loadEmployees()
  loadStats()
})
</script>

<style scoped>
.training-page {
  padding: 20px;
}

.training-tabs {
  margin-top: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filter-bar {
  display: flex;
  align-items: center;
}

.course-card {
  margin-bottom: 20px;
  cursor: pointer;
  transition: transform 0.3s;
}

.course-card:hover {
  transform: translateY(-5px);
}

.course-cover {
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e7ed 100%);
  border-radius: 4px;
  margin-bottom: 15px;
}

.course-info {
  padding: 0 5px;
}

.course-name {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.course-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.course-duration {
  font-size: 12px;
  color: #909399;
}

.course-desc {
  font-size: 13px;
  color: #606266;
  margin-bottom: 10px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  height: 36px;
}

.course-stats {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  color: #909399;
}

.course-actions {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #EBEEF5;
  display: flex;
  gap: 8px;
}

.stat-card {
  height: 100%;
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 15px;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 5px;
}
</style>
