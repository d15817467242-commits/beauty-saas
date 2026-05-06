<template>
  <div class="marketing-page">
    <el-tabs v-model="activeTab" type="border-card">
      <!-- 活动管理 -->
      <el-tab-pane label="活动管理" name="activities">
        <div class="toolbar">
          <el-button type="primary" @click="showActivityDialog()">创建活动</el-button>
          <el-button @click="showActivityStats">活动效果</el-button>
        </div>
        
        <!-- 活动筛选 -->
        <el-form :inline="true" class="search-form">
          <el-form-item label="活动类型">
            <el-select v-model="activitySearchType" clearable placeholder="全部" style="width: 120px;">
              <el-option label="拼团" value="groupBuy" />
              <el-option label="秒杀" value="flashSale" />
              <el-option label="新人礼包" value="newbieGift" />
              <el-option label="转介绍" value="referral" />
            </el-select>
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="activitySearchStatus" clearable placeholder="全部" style="width: 100px;">
              <el-option label="进行中" value="active" />
              <el-option label="即将开始" value="upcoming" />
              <el-option label="已结束" value="ended" />
              <el-option label="草稿" value="draft" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="loadActivities">查询</el-button>
          </el-form-item>
        </el-form>

        <el-table :data="activities" stripe>
          <el-table-column prop="name" label="活动名称" min-width="150" />
          <el-table-column prop="type" label="类型" width="100">
            <template #default="{ row }">
              <el-tag size="small">{{ activityTypeMap[row.type] || row.type }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="活动时间" width="200">
            <template #default="{ row }">
              {{ formatDate(row.startTime) }} ~ {{ formatDate(row.endTime) }}
            </template>
          </el-table-column>
          <el-table-column prop="participants" label="参与人数" width="100" />
          <el-table-column prop="conversions" label="转化人数" width="100" />
          <el-table-column prop="revenue" label="产生收入" width="100">
            <template #default="{ row }">¥{{ row.revenue || 0 }}</template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.status)" size="small">
                {{ statusMap[row.status] || row.status }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200">
            <template #default="{ row }">
              <el-button link @click="showActivityDialog(row)">编辑</el-button>
              <el-button link type="primary" @click="showActivityEffect(row)">效果</el-button>
              <el-button link type="danger" @click="deleteActivity(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- 优惠券管理（增强版） -->
      <el-tab-pane label="优惠券" name="coupons">
        <el-row :gutter="20">
          <!-- 左侧：优惠券列表 -->
          <el-col :span="16">
            <div class="toolbar">
              <el-button type="primary" @click="showCouponDialog()">新增优惠券</el-button>
              <el-button @click="showCouponVerifyDialog">核销验券</el-button>
            </div>
            <el-table :data="coupons" stripe>
              <el-table-column prop="name" label="名称" min-width="120" />
              <el-table-column prop="type" label="类型" width="90">
                <template #default="{ row }">
                  <el-tag :type="row.type === 'cash' ? 'success' : 'warning'" size="small">
                    {{ row.type === 'cash' ? '代金券' : row.type === 'discount' ? '折扣券' : '赠品券' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="discount" label="优惠" width="80">
                <template #default="{ row }">
                  {{ row.type === 'discount' ? row.discount + '折' : '¥' + row.discount }}
                </template>
              </el-table-column>
              <el-table-column prop="minAmount" label="门槛" width="100">
                <template #default="{ row }">满¥{{ row.minAmount }}可用</template>
              </el-table-column>
              <el-table-column prop="usedCount" label="已领/总量" width="100">
                <template #default="{ row }">
                  {{ row.usedCount }}/{{ row.totalCount === -1 ? '不限' : row.totalCount }}
                </template>
              </el-table-column>
              <el-table-column prop="verifyCount" label="已核销" width="80">
                <template #default="{ row }">
                  <span style="color: #67C23A;">{{ row.verifyCount || 0 }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="status" label="状态" width="80">
                <template #default="{ row }">
                  <el-switch v-model="row.isActive" @change="toggleCouponStatus(row)" />
                </template>
              </el-table-column>
              <el-table-column label="操作" width="180">
                <template #default="{ row }">
                  <el-button link @click="showCouponDialog(row)">编辑</el-button>
                  <el-button link type="primary" @click="showCouponStats(row)">统计</el-button>
                  <el-button link type="danger" @click="deleteCoupon(row.id)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-col>

          <!-- 右侧：优惠券统计 -->
          <el-col :span="8">
            <el-card class="stats-card">
              <template #header>
                <span>优惠券概览</span>
              </template>
              <div class="stats-content">
                <div class="stats-item">
                  <div class="stats-label">总发放数</div>
                  <div class="stats-value">{{ couponStats.totalIssued || 0 }}</div>
                </div>
                <div class="stats-item">
                  <div class="stats-label">已领取</div>
                  <div class="stats-value warning">{{ couponStats.totalClaimed || 0 }}</div>
                </div>
                <div class="stats-item">
                  <div class="stats-label">已核销</div>
                  <div class="stats-value success">{{ couponStats.totalVerified || 0 }}</div>
                </div>
                <div class="stats-item">
                  <div class="stats-label">核销率</div>
                  <div class="stats-value">{{ couponStats.verifyRate || 0 }}%</div>
                </div>
              </div>
            </el-card>

            <!-- 核销记录 -->
            <el-card style="margin-top: 20px;">
              <template #header>
                <div class="card-header">
                  <span>最近核销</span>
                  <el-button link type="primary" @click="showAllVerifyRecords">查看全部</el-button>
                </div>
              </template>
              <div v-for="record in recentVerifyRecords" :key="record.id" class="verify-record">
                <div class="verify-info">
                  <div class="verify-code">{{ record.code }}</div>
                  <div class="verify-time">{{ formatDateTime(record.verifiedAt) }}</div>
                </div>
                <div class="verify-amount">¥{{ record.discount }}</div>
              </div>
              <el-empty v-if="!recentVerifyRecords.length" description="暂无核销记录" :image-size="60" />
            </el-card>
          </el-col>
        </el-row>
      </el-tab-pane>

      <!-- 拼团活动 -->
      <el-tab-pane label="拼团" name="groupBuy">
        <div class="toolbar">
          <el-button type="primary" @click="showGroupBuyDialog()">新增拼团</el-button>
        </div>
        <el-table :data="groupBuys" stripe>
          <el-table-column prop="name" label="活动名称" />
          <el-table-column prop="service.name" label="服务项目" />
          <el-table-column label="价格">
            <template #default="{ row }">
              <span style="text-decoration: line-through; color: #999;">¥{{ row.originalPrice }}</span>
              <span style="color: #f56c6c; margin-left: 8px;">¥{{ row.groupPrice }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="minPeople" label="成团人数" />
          <el-table-column prop="soldCount" label="已售" />
          <el-table-column prop="status" label="状态">
            <template #default="{ row }">
              <el-tag :type="row.status === 'active' ? 'success' : 'info'">
                {{ row.status === 'active' ? '进行中' : row.status === 'draft' ? '草稿' : '已结束' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200">
            <template #default="{ row }">
              <el-button link @click="showGroupBuyDialog(row)">编辑</el-button>
              <el-button link type="primary" @click="showGroupBuyGroups(row)">团详情</el-button>
              <el-button link type="danger" @click="deleteGroupBuy(row.id)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- 秒杀活动 -->
      <el-tab-pane label="秒杀" name="flashSale">
        <div class="toolbar">
          <el-button type="primary" @click="showFlashSaleDialog()">新增秒杀</el-button>
        </div>
        <el-table :data="flashSales" stripe>
          <el-table-column prop="name" label="活动名称" />
          <el-table-column prop="service.name" label="服务项目" />
          <el-table-column label="价格">
            <template #default="{ row }">
              <span style="text-decoration: line-through; color: #999;">¥{{ row.originalPrice }}</span>
              <span style="color: #f56c6c; margin-left: 8px;">¥{{ row.flashPrice }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="soldCount" label="已售/库存">
            <template #default="{ row }">{{ row.soldCount }}/{{ row.totalStock }}</template>
          </el-table-column>
          <el-table-column prop="status" label="状态">
            <template #default="{ row }">
              <el-tag :type="row.status === 'active' ? 'success' : row.status === 'upcoming' ? 'warning' : 'info'">
                {{ row.status === 'active' ? '进行中' : row.status === 'upcoming' ? '即将开始' : '已结束' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150">
            <template #default="{ row }">
              <el-button link @click="showFlashSaleDialog(row)">编辑</el-button>
              <el-button link type="danger" @click="deleteFlashSale(row.id)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- 新人礼包 -->
      <el-tab-pane label="新人礼包" name="newbieGift">
        <div class="toolbar">
          <el-button type="primary" @click="showNewbieGiftDialog()">新增礼包</el-button>
        </div>
        <el-table :data="newbieGifts" stripe>
          <el-table-column prop="name" label="礼包名称" />
          <el-table-column prop="pointsReward" label="赠送积分" />
          <el-table-column prop="balanceReward" label="赠送余额">
            <template #default="{ row }">¥{{ row.balanceReward }}</template>
          </el-table-column>
          <el-table-column prop="validDays" label="有效期(天)" />
          <el-table-column prop="claimedCount" label="已领取" />
          <el-table-column prop="isActive" label="状态">
            <template #default="{ row }">
              <el-tag :type="row.isActive ? 'success' : 'info'">
                {{ row.isActive ? '启用' : '停用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150">
            <template #default="{ row }">
              <el-button link @click="showNewbieGiftDialog(row)">编辑</el-button>
              <el-button link type="danger" @click="deleteNewbieGift(row.id)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- 转介绍 -->
      <el-tab-pane label="转介绍" name="referral">
        <div class="toolbar">
          <el-button type="primary" @click="showReferralConfigDialog()">配置规则</el-button>
        </div>
        <el-descriptions v-if="referralConfig" title="转介绍规则" :column="3" border>
          <el-descriptions-item label="推荐人奖励">¥{{ referralConfig.referrerReward }}</el-descriptions-item>
          <el-descriptions-item label="被推荐人奖励">¥{{ referralConfig.refereeReward }}</el-descriptions-item>
          <el-descriptions-item label="最低消费">¥{{ referralConfig.minSpend }}</el-descriptions-item>
          <el-descriptions-item label="有效期">{{ referralConfig.validDays }}天</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="referralConfig.isActive ? 'success' : 'info'">
              {{ referralConfig.isActive ? '启用' : '停用' }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>
        <el-divider />
        <el-table :data="referrals" stripe>
          <el-table-column prop="referrer.name" label="推荐人" />
          <el-table-column prop="referee.name" label="被推荐人" />
          <el-table-column prop="refereeFirstSpend" label="首消费">
            <template #default="{ row }">¥{{ row.refereeFirstSpend || 0 }}</template>
          </el-table-column>
          <el-table-column prop="status" label="状态">
            <template #default="{ row }">
              <el-tag :type="row.status === 'rewarded' ? 'success' : 'warning'">
                {{ row.status === 'pending' ? '待完成' : row.status === 'completed' ? '待发奖' : '已发奖' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100">
            <template #default="{ row }">
              <el-button 
                v-if="row.status === 'completed'" 
                link 
                type="primary" 
                @click="grantReferralReward(row.id)"
              >发放奖励</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <!-- 活动对话框 -->
    <el-dialog v-model="activityDialogVisible" :title="isEditActivity ? '编辑活动' : '创建活动'" width="600px">
      <el-form :model="activityForm" label-width="100px" :rules="activityRules" ref="activityFormRef">
        <el-form-item label="活动名称" prop="name">
          <el-input v-model="activityForm.name" placeholder="请输入活动名称" />
        </el-form-item>
        <el-form-item label="活动类型" prop="type">
          <el-select v-model="activityForm.type" placeholder="请选择类型" style="width: 100%;">
            <el-option label="拼团活动" value="groupBuy" />
            <el-option label="秒杀活动" value="flashSale" />
            <el-option label="新人礼包" value="newbieGift" />
            <el-option label="转介绍" value="referral" />
          </el-select>
        </el-form-item>
        <el-form-item label="活动时间" prop="dateRange">
          <el-date-picker 
            v-model="activityForm.dateRange" 
            type="datetimerange" 
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            style="width: 100%;"
          />
        </el-form-item>
        <el-form-item label="活动描述">
          <el-input v-model="activityForm.description" type="textarea" :rows="3" placeholder="请输入活动描述" />
        </el-form-item>
        <el-form-item label="活动预算">
          <el-input-number v-model="activityForm.budget" :min="0" :precision="2" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="目标人数">
          <el-input-number v-model="activityForm.targetParticipants" :min="0" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="activityForm.status">
            <el-radio value="draft">草稿</el-radio>
            <el-radio value="active">立即发布</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="activityDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="activitySubmitting" @click="saveActivity">保存</el-button>
      </template>
    </el-dialog>

    <!-- 活动效果对话框 -->
    <el-dialog v-model="activityEffectVisible" title="活动效果" width="800px">
      <el-descriptions :column="4" border v-if="selectedActivity">
        <el-descriptions-item label="活动名称">{{ selectedActivity.name }}</el-descriptions-item>
        <el-descriptions-item label="活动类型">{{ activityTypeMap[selectedActivity.type] }}</el-descriptions-item>
        <el-descriptions-item label="活动状态">
          <el-tag :type="getStatusType(selectedActivity.status)">{{ statusMap[selectedActivity.status] }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="活动预算">¥{{ selectedActivity.budget || 0 }}</el-descriptions-item>
        <el-descriptions-item label="参与人数">{{ selectedActivity.participants || 0 }}</el-descriptions-item>
        <el-descriptions-item label="转化人数">{{ selectedActivity.conversions || 0 }}</el-descriptions-item>
        <el-descriptions-item label="转化率">{{ ((selectedActivity.conversions || 0) / (selectedActivity.participants || 1) * 100).toFixed(1) }}%</el-descriptions-item>
        <el-descriptions-item label="产生收入">¥{{ selectedActivity.revenue || 0 }}</el-descriptions-item>
        <el-descriptions-item label="ROI">{{ selectedActivity.budget ? ((selectedActivity.revenue || 0) / selectedActivity.budget * 100).toFixed(1) : 0 }}%</el-descriptions-item>
        <el-descriptions-item label="人均消费">¥{{ (selectedActivity.revenue || 0) / (selectedActivity.conversions || 1) | 0 }}</el-descriptions-item>
      </el-descriptions>
      
      <el-divider content-position="left">效果趋势</el-divider>
      <div ref="activityChartRef" style="height: 300px;"></div>
    </el-dialog>

    <!-- 优惠券对话框 -->
    <el-dialog v-model="couponDialogVisible" title="优惠券" width="500px">
      <el-form :model="couponForm" label-width="100px">
        <el-form-item label="名称">
          <el-input v-model="couponForm.name" />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="couponForm.type">
            <el-option label="代金券" value="cash" />
            <el-option label="折扣券" value="discount" />
            <el-option label="赠品券" value="gift" />
          </el-select>
        </el-form-item>
        <el-form-item label="优惠值">
          <el-input-number v-model="couponForm.discount" :min="0" />
        </el-form-item>
        <el-form-item label="最低消费">
          <el-input-number v-model="couponForm.minAmount" :min="0" />
        </el-form-item>
        <el-form-item label="发放总量">
          <el-input-number v-model="couponForm.totalCount" :min="-1" />
        </el-form-item>
        <el-form-item label="每人限领">
          <el-input-number v-model="couponForm.perLimit" :min="1" />
        </el-form-item>
        <el-form-item label="有效期">
          <el-date-picker v-model="couponForm.dateRange" type="datetimerange" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="couponDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveCoupon">保存</el-button>
      </template>
    </el-dialog>

    <!-- 优惠券核销对话框 -->
    <el-dialog v-model="couponVerifyDialogVisible" title="核销验券" width="500px">
      <el-form :model="couponVerifyForm" label-width="100px">
        <el-form-item label="券码">
          <el-input v-model="couponVerifyForm.code" placeholder="请输入或扫描优惠券码" />
        </el-form-item>
      </el-form>
      <div v-if="couponVerifyResult" class="verify-result">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="优惠券">{{ couponVerifyResult.couponName }}</el-descriptions-item>
          <el-descriptions-item label="持有人">{{ couponVerifyResult.memberName }}</el-descriptions-item>
          <el-descriptions-item label="优惠金额">
            <span style="color: #F56C6C; font-size: 18px; font-weight: bold;">
              ¥{{ couponVerifyResult.discount }}
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="couponVerifyResult.status === 'valid' ? 'success' : 'danger'">
              {{ couponVerifyResult.status === 'valid' ? '可使用' : '已使用/已过期' }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <el-button @click="couponVerifyDialogVisible = false">取消</el-button>
        <el-button 
          type="primary" 
          :disabled="!couponVerifyResult || couponVerifyResult.status !== 'valid'"
          @click="verifyCoupon"
        >确认核销</el-button>
      </template>
    </el-dialog>

    <!-- 优惠券统计对话框 -->
    <el-dialog v-model="couponStatsDialogVisible" title="优惠券使用统计" width="700px">
      <el-row :gutter="20">
        <el-col :span="8">
          <div class="stat-box">
            <div class="stat-value">{{ selectedCouponStats.issued || 0 }}</div>
            <div class="stat-label">发放数量</div>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="stat-box">
            <div class="stat-value warning">{{ selectedCouponStats.claimed || 0 }}</div>
            <div class="stat-label">已领取</div>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="stat-box">
            <div class="stat-value success">{{ selectedCouponStats.verified || 0 }}</div>
            <div class="stat-label">已核销</div>
          </div>
        </el-col>
      </el-row>
      <el-divider />
      <el-table :data="selectedCouponStats.records || []" max-height="300">
        <el-table-column prop="memberName" label="领取人" />
        <el-table-column prop="claimedAt" label="领取时间" width="160">
          <template #default="{ row }">{{ formatDateTime(row.claimedAt) }}</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'verified' ? 'success' : row.status === 'claimed' ? 'warning' : 'info'" size="small">
              {{ row.status === 'verified' ? '已核销' : row.status === 'claimed' ? '未使用' : '已过期' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="verifiedAt" label="核销时间" width="160">
          <template #default="{ row }">{{ row.verifiedAt ? formatDateTime(row.verifiedAt) : '-' }}</template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <!-- 拼团对话框 -->
    <el-dialog v-model="groupBuyDialogVisible" title="拼团活动" width="500px">
      <el-form :model="groupBuyForm" label-width="100px">
        <el-form-item label="活动名称">
          <el-input v-model="groupBuyForm.name" />
        </el-form-item>
        <el-form-item label="服务项目">
          <el-select v-model="groupBuyForm.serviceId">
            <el-option v-for="s in services" :key="s.id" :label="s.name" :value="s.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="原价">
          <el-input-number v-model="groupBuyForm.originalPrice" :min="0" />
        </el-form-item>
        <el-form-item label="拼团价">
          <el-input-number v-model="groupBuyForm.groupPrice" :min="0" />
        </el-form-item>
        <el-form-item label="成团人数">
          <el-input-number v-model="groupBuyForm.minPeople" :min="2" />
        </el-form-item>
        <el-form-item label="时限(小时)">
          <el-input-number v-model="groupBuyForm.timeLimit" :min="1" />
        </el-form-item>
        <el-form-item label="活动时间">
          <el-date-picker v-model="groupBuyForm.dateRange" type="datetimerange" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="groupBuyDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveGroupBuy">保存</el-button>
      </template>
    </el-dialog>

    <!-- 秒杀对话框 -->
    <el-dialog v-model="flashSaleDialogVisible" title="秒杀活动" width="500px">
      <el-form :model="flashSaleForm" label-width="100px">
        <el-form-item label="活动名称">
          <el-input v-model="flashSaleForm.name" />
        </el-form-item>
        <el-form-item label="服务项目">
          <el-select v-model="flashSaleForm.serviceId">
            <el-option v-for="s in services" :key="s.id" :label="s.name" :value="s.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="原价">
          <el-input-number v-model="flashSaleForm.originalPrice" :min="0" />
        </el-form-item>
        <el-form-item label="秒杀价">
          <el-input-number v-model="flashSaleForm.flashPrice" :min="0" />
        </el-form-item>
        <el-form-item label="库存">
          <el-input-number v-model="flashSaleForm.totalStock" :min="1" />
        </el-form-item>
        <el-form-item label="活动时间">
          <el-date-picker v-model="flashSaleForm.dateRange" type="datetimerange" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="flashSaleDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveFlashSale">保存</el-button>
      </template>
    </el-dialog>

    <!-- 新人礼包对话框 -->
    <el-dialog v-model="newbieGiftDialogVisible" title="新人礼包" width="500px">
      <el-form :model="newbieGiftForm" label-width="100px">
        <el-form-item label="礼包名称">
          <el-input v-model="newbieGiftForm.name" />
        </el-form-item>
        <el-form-item label="赠送积分">
          <el-input-number v-model="newbieGiftForm.pointsReward" :min="0" />
        </el-form-item>
        <el-form-item label="赠送余额">
          <el-input-number v-model="newbieGiftForm.balanceReward" :min="0" />
        </el-form-item>
        <el-form-item label="有效期(天)">
          <el-input-number v-model="newbieGiftForm.validDays" :min="1" />
        </el-form-item>
        <el-form-item label="启用">
          <el-switch v-model="newbieGiftForm.isActive" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="newbieGiftDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveNewbieGift">保存</el-button>
      </template>
    </el-dialog>

    <!-- 转介绍配置对话框 -->
    <el-dialog v-model="referralConfigDialogVisible" title="转介绍配置" width="400px">
      <el-form :model="referralConfigForm" label-width="120px">
        <el-form-item label="推荐人奖励">
          <el-input-number v-model="referralConfigForm.referrerReward" :min="0" />
        </el-form-item>
        <el-form-item label="被推荐人奖励">
          <el-input-number v-model="referralConfigForm.refereeReward" :min="0" />
        </el-form-item>
        <el-form-item label="最低消费要求">
          <el-input-number v-model="referralConfigForm.minSpend" :min="0" />
        </el-form-item>
        <el-form-item label="有效期(天)">
          <el-input-number v-model="referralConfigForm.validDays" :min="1" />
        </el-form-item>
        <el-form-item label="启用">
          <el-switch v-model="referralConfigForm.isActive" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="referralConfigDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveReferralConfig">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import * as echarts from 'echarts'

const API_BASE = 'http://localhost:3000/api'
const token = localStorage.getItem('token') || ''

const activeTab = ref('activities')
const activities = ref<any[]>([])
const coupons = ref<any[]>([])
const groupBuys = ref<any[]>([])
const flashSales = ref<any[]>([])
const newbieGifts = ref<any[]>([])
const referrals = ref<any[]>([])
const referralConfig = ref<any>(null)
const services = ref<any[]>([])

const activityTypeMap: Record<string, string> = {
  groupBuy: '拼团',
  flashSale: '秒杀',
  newbieGift: '新人礼包',
  referral: '转介绍'
}

const statusMap: Record<string, string> = {
  active: '进行中',
  upcoming: '即将开始',
  ended: '已结束',
  draft: '草稿'
}

const getStatusType = (status: string) => {
  const map: Record<string, string> = {
    active: 'success',
    upcoming: 'warning',
    ended: 'info',
    draft: 'info'
  }
  return map[status] || 'info'
}

// 活动搜索
const activitySearchType = ref('')
const activitySearchStatus = ref('')

// 对话框
const activityDialogVisible = ref(false)
const activityEffectVisible = ref(false)
const couponDialogVisible = ref(false)
const couponVerifyDialogVisible = ref(false)
const couponStatsDialogVisible = ref(false)
const groupBuyDialogVisible = ref(false)
const flashSaleDialogVisible = ref(false)
const newbieGiftDialogVisible = ref(false)
const referralConfigDialogVisible = ref(false)

const isEditActivity = ref(false)
const editActivityId = ref('')
const activitySubmitting = ref(false)

// 表单
const activityFormRef = ref<FormInstance>()
const activityForm = ref({
  name: '',
  type: 'groupBuy',
  dateRange: null as [Date, Date] | null,
  description: '',
  budget: 0,
  targetParticipants: 0,
  status: 'draft'
})

const activityRules: FormRules = {
  name: [{ required: true, message: '请输入活动名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择活动类型', trigger: 'change' }]
}

const couponForm = ref<any>({ type: 'cash', discount: 10, minAmount: 0, totalCount: -1, perLimit: 1 })
const groupBuyForm = ref<any>({ minPeople: 2, timeLimit: 24 })
const flashSaleForm = ref<any>({})
const newbieGiftForm = ref<any>({ pointsReward: 0, balanceReward: 0, validDays: 30, isActive: true })
const referralConfigForm = ref<any>({ referrerReward: 0, refereeReward: 0, minSpend: 0, validDays: 30, isActive: true })

// 优惠券核销
const couponVerifyForm = ref({ code: '' })
const couponVerifyResult = ref<any>(null)

// 优惠券统计
const couponStats = ref({
  totalIssued: 0,
  totalClaimed: 0,
  totalVerified: 0,
  verifyRate: 0
})
const recentVerifyRecords = ref<any[]>([])
const selectedCouponStats = ref<any>({
  issued: 0,
  claimed: 0,
  verified: 0,
  records: []
})

const selectedActivity = ref<any>(null)
const activityChartRef = ref<HTMLElement>()

const formatDate = (date: string) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString()
}

const formatDateTime = (date: string) => {
  if (!date) return '-'
  return new Date(date).toLocaleString()
}

const loadData = async () => {
  try {
    const headers = { Authorization: `Bearer ${token}` }
    const [couponsRes, groupBuysRes, flashSalesRes, newbieGiftsRes, referralsRes, configRes, servicesRes] = await Promise.all([
      fetch(`${API_BASE}/marketing/coupons`, { headers }).then(r => r.json()),
      fetch(`${API_BASE}/marketing/group-buys`, { headers }).then(r => r.json()),
      fetch(`${API_BASE}/marketing/flash-sales`, { headers }).then(r => r.json()),
      fetch(`${API_BASE}/marketing/newbie-gifts`, { headers }).then(r => r.json()),
      fetch(`${API_BASE}/marketing/referrals`, { headers }).then(r => r.json()),
      fetch(`${API_BASE}/marketing/referrals/config`, { headers }).then(r => r.json()),
      fetch(`${API_BASE}/services`, { headers }).then(r => r.json()),
    ])
    coupons.value = couponsRes
    groupBuys.value = groupBuysRes
    flashSales.value = flashSalesRes
    newbieGifts.value = newbieGiftsRes
    referrals.value = referralsRes
    referralConfig.value = configRes
    services.value = servicesRes
    
    loadActivities()
    loadCouponStats()
  } catch (e) {
    ElMessage.error('加载数据失败')
  }
}

// 加载活动列表
const loadActivities = async () => {
  try {
    const params = new URLSearchParams()
    if (activitySearchType.value) params.append('type', activitySearchType.value)
    if (activitySearchStatus.value) params.append('status', activitySearchStatus.value)
    
    const res = await fetch(`${API_BASE}/marketing/activities?${params}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    activities.value = await res.json()
  } catch (e) {
    console.error('加载活动失败')
  }
}

// 加载优惠券统计
const loadCouponStats = async () => {
  try {
    const res = await fetch(`${API_BASE}/marketing/coupons/stats`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    couponStats.value = await res.json()
    
    const recordsRes = await fetch(`${API_BASE}/marketing/coupons/verify-records?limit=5`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    recentVerifyRecords.value = await recordsRes.json()
  } catch (e) {
    console.error('加载优惠券统计失败')
  }
}

// 活动管理
const showActivityDialog = (row?: any) => {
  isEditActivity.value = !!row
  editActivityId.value = row?.id || ''
  activityForm.value = row ? {
    name: row.name,
    type: row.type,
    dateRange: row.startTime && row.endTime ? [new Date(row.startTime), new Date(row.endTime)] : null,
    description: row.description || '',
    budget: row.budget || 0,
    targetParticipants: row.targetParticipants || 0,
    status: row.status || 'draft'
  } : {
    name: '',
    type: 'groupBuy',
    dateRange: null,
    description: '',
    budget: 0,
    targetParticipants: 0,
    status: 'draft'
  }
  activityDialogVisible.value = true
}

const saveActivity = async () => {
  if (!activityFormRef.value) return
  await activityFormRef.value.validate(async (valid) => {
    if (!valid) return
    
    activitySubmitting.value = true
    try {
      const data: any = {
        name: activityForm.value.name,
        type: activityForm.value.type,
        description: activityForm.value.description,
        budget: activityForm.value.budget,
        targetParticipants: activityForm.value.targetParticipants,
        status: activityForm.value.status
      }
      if (activityForm.value.dateRange) {
        data.startTime = activityForm.value.dateRange[0]
        data.endTime = activityForm.value.dateRange[1]
      }
      
      const url = isEditActivity.value 
        ? `${API_BASE}/marketing/activities/${editActivityId.value}` 
        : `${API_BASE}/marketing/activities`
      const method = isEditActivity.value ? 'PUT' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(data)
      })
      
      if (res.ok) {
        ElMessage.success('保存成功')
        activityDialogVisible.value = false
        loadActivities()
      } else {
        ElMessage.error('保存失败')
      }
    } catch (e) {
      ElMessage.error('网络错误')
    } finally {
      activitySubmitting.value = false
    }
  })
}

const deleteActivity = async (row: any) => {
  try {
    await ElMessageBox.confirm('确定删除该活动？', '提示', { type: 'warning' })
    await fetch(`${API_BASE}/marketing/activities/${row.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    })
    ElMessage.success('删除成功')
    loadActivities()
  } catch (e) {}
}

const showActivityEffect = async (row: any) => {
  selectedActivity.value = row
  activityEffectVisible.value = true
  
  // 渲染图表
  setTimeout(() => {
    if (activityChartRef.value) {
      const chart = echarts.init(activityChartRef.value)
      chart.setOption({
        tooltip: { trigger: 'axis' },
        legend: { data: ['参与人数', '转化人数', '收入'] },
        xAxis: { type: 'category', data: ['第1天', '第2天', '第3天', '第4天', '第5天', '第6天', '第7天'] },
        yAxis: [
          { type: 'value', name: '人数' },
          { type: 'value', name: '收入(元)' }
        ],
        series: [
          { name: '参与人数', type: 'line', data: [10, 25, 35, 50, 45, 60, 75] },
          { name: '转化人数', type: 'line', data: [5, 12, 18, 25, 22, 30, 38] },
          { name: '收入', type: 'bar', yAxisIndex: 1, data: [500, 1200, 1800, 2500, 2200, 3000, 3800] }
        ]
      })
    }
  }, 100)
}

const showActivityStats = () => {
  // 跳转到营销分析页面
  window.location.href = '/marketing-analysis'
}

// 优惠券
const showCouponDialog = (row?: any) => {
  if (row) {
    couponForm.value = { ...row, dateRange: [new Date(row.startTime), new Date(row.endTime)] }
  } else {
    couponForm.value = { type: 'cash', discount: 10, minAmount: 0, totalCount: -1, perLimit: 1 }
  }
  couponDialogVisible.value = true
}

const saveCoupon = async () => {
  try {
    const data = {
      ...couponForm.value,
      startTime: couponForm.value.dateRange[0],
      endTime: couponForm.value.dateRange[1],
    }
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    }
    if (couponForm.value.id) {
      await fetch(`${API_BASE}/marketing/coupons/${couponForm.value.id}`, { method: 'PUT', headers, body: JSON.stringify(data) })
    } else {
      await fetch(`${API_BASE}/marketing/coupons`, { method: 'POST', headers, body: JSON.stringify(data) })
    }
    couponDialogVisible.value = false
    loadData()
    ElMessage.success('保存成功')
  } catch (e) {
    ElMessage.error('保存失败')
  }
}

const toggleCouponStatus = async (row: any) => {
  try {
    await fetch(`${API_BASE}/marketing/coupons/${row.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ isActive: row.isActive })
    })
    ElMessage.success(row.isActive ? '已启用' : '已停用')
  } catch (e) {
    row.isActive = !row.isActive
    ElMessage.error('操作失败')
  }
}

const deleteCoupon = async (id: string) => {
  await ElMessageBox.confirm('确定删除？')
  await fetch(`${API_BASE}/marketing/coupons/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  })
  loadData()
  ElMessage.success('删除成功')
}

// 优惠券核销
const showCouponVerifyDialog = () => {
  couponVerifyForm.value = { code: '' }
  couponVerifyResult.value = null
  couponVerifyDialogVisible.value = true
}

const verifyCoupon = async () => {
  try {
    const res = await fetch(`${API_BASE}/marketing/coupons/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ code: couponVerifyForm.value.code })
    })
    const data = await res.json()
    if (data.success) {
      ElMessage.success('核销成功')
      couponVerifyDialogVisible.value = false
      loadCouponStats()
    } else {
      ElMessage.error(data.message || '核销失败')
    }
  } catch (e) {
    ElMessage.error('核销失败')
  }
}

// 优惠券统计
const showCouponStats = async (row: any) => {
  try {
    const res = await fetch(`${API_BASE}/marketing/coupons/${row.id}/stats`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    selectedCouponStats.value = await res.json()
    couponStatsDialogVisible.value = true
  } catch (e) {
    ElMessage.error('加载统计失败')
  }
}

const showAllVerifyRecords = () => {
  // 跳转到核销验券页面
  window.location.href = '/coupon-verify'
}

// 拼团
const showGroupBuyDialog = (row?: any) => {
  if (row) {
    groupBuyForm.value = { ...row, dateRange: [new Date(row.startTime), new Date(row.endTime)] }
  } else {
    groupBuyForm.value = { minPeople: 2, timeLimit: 24 }
  }
  groupBuyDialogVisible.value = true
}

const saveGroupBuy = async () => {
  try {
    const data = {
      ...groupBuyForm.value,
      startTime: groupBuyForm.value.dateRange[0],
      endTime: groupBuyForm.value.dateRange[1],
    }
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    }
    if (groupBuyForm.value.id) {
      await fetch(`${API_BASE}/marketing/group-buys/${groupBuyForm.value.id}`, { method: 'PUT', headers, body: JSON.stringify(data) })
    } else {
      await fetch(`${API_BASE}/marketing/group-buys`, { method: 'POST', headers, body: JSON.stringify(data) })
    }
    groupBuyDialogVisible.value = false
    loadData()
    ElMessage.success('保存成功')
  } catch (e) {
    ElMessage.error('保存失败')
  }
}

const deleteGroupBuy = async (id: string) => {
  await ElMessageBox.confirm('确定删除？')
  await fetch(`${API_BASE}/marketing/group-buys/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  })
  loadData()
  ElMessage.success('删除成功')
}

const showGroupBuyGroups = (row: any) => {
  ElMessage.info(`查看拼团详情: ${row.name}`)
}

// 秒杀
const showFlashSaleDialog = (row?: any) => {
  if (row) {
    flashSaleForm.value = { ...row, dateRange: [new Date(row.startTime), new Date(row.endTime)] }
  } else {
    flashSaleForm.value = {}
  }
  flashSaleDialogVisible.value = true
}

const saveFlashSale = async () => {
  try {
    const data = {
      ...flashSaleForm.value,
      startTime: flashSaleForm.value.dateRange[0],
      endTime: flashSaleForm.value.dateRange[1],
    }
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    }
    if (flashSaleForm.value.id) {
      await fetch(`${API_BASE}/marketing/flash-sales/${flashSaleForm.value.id}`, { method: 'PUT', headers, body: JSON.stringify(data) })
    } else {
      await fetch(`${API_BASE}/marketing/flash-sales`, { method: 'POST', headers, body: JSON.stringify(data) })
    }
    flashSaleDialogVisible.value = false
    loadData()
    ElMessage.success('保存成功')
  } catch (e) {
    ElMessage.error('保存失败')
  }
}

const deleteFlashSale = async (id: string) => {
  await ElMessageBox.confirm('确定删除？')
  await fetch(`${API_BASE}/marketing/flash-sales/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  })
  loadData()
  ElMessage.success('删除成功')
}

// 新人礼包
const showNewbieGiftDialog = (row?: any) => {
  if (row) {
    newbieGiftForm.value = { ...row }
  } else {
    newbieGiftForm.value = { pointsReward: 0, balanceReward: 0, validDays: 30, isActive: true }
  }
  newbieGiftDialogVisible.value = true
}

const saveNewbieGift = async () => {
  try {
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    }
    if (newbieGiftForm.value.id) {
      await fetch(`${API_BASE}/marketing/newbie-gifts/${newbieGiftForm.value.id}`, { method: 'PUT', headers, body: JSON.stringify(newbieGiftForm.value) })
    } else {
      await fetch(`${API_BASE}/marketing/newbie-gifts`, { method: 'POST', headers, body: JSON.stringify(newbieGiftForm.value) })
    }
    newbieGiftDialogVisible.value = false
    loadData()
    ElMessage.success('保存成功')
  } catch (e) {
    ElMessage.error('保存失败')
  }
}

const deleteNewbieGift = async (id: string) => {
  await ElMessageBox.confirm('确定删除？')
  await fetch(`${API_BASE}/marketing/newbie-gifts/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  })
  loadData()
  ElMessage.success('删除成功')
}

// 转介绍
const showReferralConfigDialog = () => {
  referralConfigForm.value = referralConfig.value ? { ...referralConfig.value } : { referrerReward: 0, refereeReward: 0, minSpend: 0, validDays: 30, isActive: true }
  referralConfigDialogVisible.value = true
}

const saveReferralConfig = async () => {
  try {
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    }
    if (referralConfigForm.value.id) {
      await fetch(`${API_BASE}/marketing/referrals/config/${referralConfigForm.value.id}`, { method: 'PUT', headers, body: JSON.stringify(referralConfigForm.value) })
    } else {
      await fetch(`${API_BASE}/marketing/referrals/config`, { method: 'POST', headers, body: JSON.stringify(referralConfigForm.value) })
    }
    referralConfigDialogVisible.value = false
    loadData()
    ElMessage.success('保存成功')
  } catch (e) {
    ElMessage.error('保存失败')
  }
}

const grantReferralReward = async (id: string) => {
  await fetch(`${API_BASE}/marketing/referrals/${id}/grant`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  })
  loadData()
  ElMessage.success('奖励已发放')
}

onMounted(loadData)
</script>

<style scoped>
.marketing-page {
  padding: 20px;
}

.toolbar {
  margin-bottom: 16px;
}

.search-form {
  margin-bottom: 16px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stats-card .stats-content {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.stats-item {
  text-align: center;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
}

.stats-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.stats-value {
  font-size: 24px;
  font-weight: bold;
  color: #409EFF;
}

.stats-value.success {
  color: #67C23A;
}

.stats-value.warning {
  color: #E6A23C;
}

.verify-record {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 6px;
  margin-bottom: 8px;
}

.verify-code {
  font-weight: bold;
  font-family: monospace;
}

.verify-time {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.verify-amount {
  color: #F56C6C;
  font-weight: bold;
}

.verify-result {
  margin-top: 16px;
}

.stat-box {
  text-align: center;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 8px;
}

.stat-box .stat-value {
  font-size: 32px;
  font-weight: bold;
  color: #409EFF;
}

.stat-box .stat-value.warning {
  color: #E6A23C;
}

.stat-box .stat-value.success {
  color: #67C23A;
}

.stat-box .stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 8px;
}
</style>
