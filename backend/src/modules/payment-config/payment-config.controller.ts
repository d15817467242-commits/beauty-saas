import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { PaymentConfigService } from './payment-config.service';
import { PaymentStatus } from './payment-config.entity';
import { CreatePaymentConfigDto, UpdatePaymentConfigDto, CreatePaymentChannelDto } from './dto/payment-config.dto';

@Controller('payment-configs')
export class PaymentConfigController {
  constructor(private readonly paymentConfigService: PaymentConfigService) {}

  // ========== 支付配置接口 ==========

  @Post()
  async createConfig(@Body() dto: CreatePaymentConfigDto) {
    return this.paymentConfigService.createConfig(dto);
  }

  @Get()
  async listConfigs(@Query('storeId') storeId?: string) {
    return this.paymentConfigService.listConfigs(storeId);
  }

  @Get('active')
  async getActiveConfigs(@Query('storeId') storeId?: string) {
    return this.paymentConfigService.getActiveConfigs(storeId);
  }

  @Get('stats')
  async getStats() {
    return this.paymentConfigService.getStats();
  }

  @Get(':id')
  async getConfig(@Param('id') id: string) {
    return this.paymentConfigService.getConfig(id);
  }

  @Put(':id')
  async updateConfig(@Param('id') id: string, @Body() dto: UpdatePaymentConfigDto) {
    return this.paymentConfigService.updateConfig(id, dto);
  }

  @Delete(':id')
  async deleteConfig(@Param('id') id: string) {
    await this.paymentConfigService.deleteConfig(id);
    return { success: true };
  }

  @Post('batch/status')
  async batchUpdateStatus(@Body() body: { ids: string[]; status: PaymentStatus }) {
    await this.paymentConfigService.batchUpdateStatus(body.ids, body.status);
    return { success: true };
  }

  @Post(':id/test')
  async testConfig(@Param('id') id: string) {
    return this.paymentConfigService.testConfig(id);
  }

  // ========== 支付渠道接口 ==========

  @Post('channels')
  async createChannel(@Body() dto: CreatePaymentChannelDto) {
    return this.paymentConfigService.createChannel(dto);
  }

  @Get(':id/channels')
  async getChannels(@Param('id') id: string) {
    return this.paymentConfigService.getChannelsByConfigId(id);
  }

  @Get(':id/channels/active')
  async getActiveChannels(@Param('id') id: string) {
    return this.paymentConfigService.getActiveChannels(id);
  }

  @Get('channels/:channelId')
  async getChannel(@Param('channelId') channelId: string) {
    return this.paymentConfigService.getChannel(channelId);
  }

  @Put('channels/:channelId')
  async updateChannel(
    @Param('channelId') channelId: string,
    @Body() dto: Partial<CreatePaymentChannelDto>
  ) {
    return this.paymentConfigService.updateChannel(channelId, dto);
  }

  @Delete('channels/:channelId')
  async deleteChannel(@Param('channelId') channelId: string) {
    await this.paymentConfigService.deleteChannel(channelId);
    return { success: true };
  }
}
