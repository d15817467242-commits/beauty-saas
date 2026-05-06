import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Req, Headers } from '@nestjs/common';
import { MiniappService } from './miniapp.service';
import { WxLoginDto, BindPhoneDto, UpdateUserInfoDto, CreateAppointmentDto, CancelAppointmentDto, ReceiveCouponDto, PointsExchangeDto } from './dto/miniapp.dto';

// 简单的微信小程序认证守卫
class WxAuthGuard {
  canActivate(context: any): boolean {
    const request = context.switchToHttp().getRequest();
    const openid = request.headers['x-wx-openid'] || request.query.openid;
    if (!openid) {
      return false;
    }
    request.wxOpenid = openid;
    return true;
  }
}

@Controller('api/miniapp')
export class MiniappController {
  constructor(private readonly miniappService: MiniappService) {}

  // ========== 微信登录 ==========

  @Post('login')
  async wxLogin(@Body() body: WxLoginDto) {
    return this.miniappService.wxLogin(body.code);
  }

  @Post('bind-phone')
  async bindPhone(@Body() body: BindPhoneDto) {
    return this.miniappService.bindPhone(body.openid, body.phone, body.name);
  }

  @Post('user/update')
  async updateUserInfo(
    @Headers('x-wx-openid') openid: string,
    @Body() body: UpdateUserInfoDto,
  ) {
    return this.miniappService.updateUserInfo(openid, body);
  }

  @Get('user/info')
  async getCurrentUser(@Headers('x-wx-openid') openid: string) {
    return this.miniappService.getCurrentUser(openid);
  }

  // ========== 会员信息 ==========

  @Get('member/info')
  async getMemberInfo(@Query('memberId') memberId: string) {
    return this.miniappService.getMemberInfo(memberId);
  }

  @Get('member/balance')
  async getBalance(@Query('memberId') memberId: string) {
    return this.miniappService.getBalanceAndCount(memberId);
  }

  @Get('member/consumptions')
  async getConsumptions(
    @Query('memberId') memberId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.miniappService.getConsumptionHistory(memberId, page, limit);
  }

  // ========== 预约接口 ==========

  @Get('appointments')
  async getAppointments(
    @Query('memberId') memberId: string,
    @Query('status') status?: string,
  ) {
    return this.miniappService.getAppointments(memberId, status);
  }

  @Post('appointment')
  async createAppointment(@Body() body: CreateAppointmentDto) {
    return this.miniappService.createAppointment(body.memberId, body);
  }

  @Put('appointment/:id')
  async cancelAppointment(
    @Param('id') appointmentId: string,
    @Body() body: CancelAppointmentDto,
  ) {
    await this.miniappService.cancelAppointment(body.memberId, appointmentId, body.reason);
    return { success: true };
  }

  @Get('available-slots')
  async getAvailableSlots(
    @Query('employeeId') employeeId: string,
    @Query('date') date: string,
  ) {
    return this.miniappService.getAvailableSlots(employeeId, date);
  }

  // ========== 会员卡接口 ==========

  @Get('member-card')
  async getMemberCard(@Query('memberId') memberId: string) {
    return this.miniappService.getMemberCard(memberId);
  }

  @Get('count-cards')
  async getCountCards(@Query('memberId') memberId: string) {
    return this.miniappService.getCountCards(memberId);
  }

  // ========== 优惠券接口 ==========

  @Get('coupons')
  async getCoupons(
    @Query('memberId') memberId: string,
    @Query('status') status?: 'available' | 'used' | 'expired',
  ) {
    return this.miniappService.getCoupons(memberId, status);
  }

  @Get('coupons/available')
  async getAvailableCoupons() {
    return this.miniappService.getAvailableCoupons();
  }

  @Post('coupon/receive')
  async receiveCoupon(@Body() body: ReceiveCouponDto) {
    return this.miniappService.receiveCoupon(body.memberId, body.couponId);
  }

  // ========== 积分接口 ==========

  @Get('points')
  async getPoints(@Query('memberId') memberId: string) {
    return this.miniappService.getPoints(memberId);
  }

  @Get('points/products')
  async getPointsProducts(@Query('category') category?: string) {
    return this.miniappService.getPointsProducts(category);
  }

  @Post('points/exchange')
  async pointsExchange(@Body() body: PointsExchangeDto) {
    return this.miniappService.pointsExchange(body.memberId, body.goodsId, body.quantity, body.deliveryInfo);
  }

  // ========== 订单接口 ==========

  @Get('orders')
  async getOrders(
    @Query('memberId') memberId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.miniappService.getOrders(memberId, page, limit);
  }

  @Get('order/:id')
  async getOrderDetail(
    @Param('id') orderId: string,
    @Query('memberId') memberId: string,
  ) {
    return this.miniappService.getOrderDetail(memberId, orderId);
  }

  // ========== 服务接口 ==========

  @Get('services')
  async getServices(@Query('category') category?: string) {
    return this.miniappService.getServices(category);
  }

  @Get('employees')
  async getEmployees() {
    return this.miniappService.getEmployees();
  }

  // ========== 充值 ==========

  @Post('recharge')
  async recharge(
    @Body('memberId') memberId: string,
    @Body('amount') amount: number,
    @Body('paymentMethod') paymentMethod: string,
  ) {
    return this.miniappService.recharge(memberId, amount, paymentMethod);
  }

  // ========== 办卡 ==========

  @Post('purchase-card')
  async purchaseCard(
    @Body('memberId') memberId: string,
    @Body('packageId') packageId: string,
    @Body('paymentMethod') paymentMethod: string,
  ) {
    return this.miniappService.purchaseCountCard(memberId, packageId, paymentMethod);
  }

  // ========== 商家信息 ==========

  @Get('shop/info')
  async getShopInfo() {
    return this.miniappService.getShopInfo();
  }

  // ========== 团队展示 ==========

  @Get('team')
  async getTeam() {
    return this.miniappService.getTeam();
  }

  // ========== 优惠活动 ==========

  @Get('promotions')
  async getPromotions() {
    return this.miniappService.getPromotions();
  }
}
