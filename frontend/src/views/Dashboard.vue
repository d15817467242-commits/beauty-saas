<template>
  <div class="dashboard">
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card shadow="hover">
          <el-statistic title="今日营业额" :value="todayRevenue" prefix="¥" />
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <el-statistic title="今日订单" :value="todayOrders" suffix="单" />
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <el-statistic title="会员总数" :value="totalMembers" suffix="人" />
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <el-statistic title="员工总数" :value="totalEmployees" suffix="人" />
        </el-card>
      </el-col>
    </el-row>
    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>快捷操作</span>
          </template>
          <el-row :gutter="10">
            <el-col :span="8">
              <el-button type="primary" size="large" style="width: 100%" @click="$router.push('/cashier')">
                <el-icon><ShoppingCart /></el-icon> 收银开单
              </el-button>
            </el-col>
            <el-col :span="8">
              <el-button type="success" size="large" style="width: 100%" @click="$router.push('/member')">
                <el-icon><User /></el-icon> 会员管理
              </el-button>
            </el-col>
            <el-col :span="8">
              <el-button type="warning" size="large" style="width: 100%" @click="$router.push('/report')">
                <el-icon><DataLine /></el-icon> 查看报表
              </el-button>
            </el-col>
          </el-row>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>今日待办</span>
          </template>
          <el-empty description="暂无待办事项" :image-size="80" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const todayRevenue = ref(0)
const todayOrders = ref(0)
const totalMembers = ref(0)
const totalEmployees = ref(0)
</script>

<style scoped>
.dashboard {
  padding: 20px;
}
</style>
