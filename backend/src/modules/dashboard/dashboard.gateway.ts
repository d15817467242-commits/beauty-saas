import { 
  WebSocketGateway, 
  WebSocketServer, 
  SubscribeMessage, 
  OnGatewayConnection, 
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Consumption } from '../cashier/consumption.entity';
import { Appointment, AppointmentStatus } from '../appointment/appointment.entity';

@WebSocketGateway({
  cors: {
    origin: '*', // 生产环境应该配置具体的域名
  },
  namespace: '/dashboard',
})
@Injectable()
export class DashboardGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(DashboardGateway.name);
  private connectedClients: Map<string, Set<string>> = new Map(); // storeId -> clientIds

  constructor(
    @InjectRepository(Consumption)
    private consumptionRepository: Repository<Consumption>,
    @InjectRepository(Appointment)
    private appointmentRepository: Repository<Appointment>,
  ) {}

  afterInit(server: Server) {
    this.logger.log('Dashboard WebSocket Gateway initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    
    // 获取storeId参数
    const storeId = client.handshake.query.storeId as string || 'default';
    
    // 添加到连接列表
    if (!this.connectedClients.has(storeId)) {
      this.connectedClients.set(storeId, new Set());
    }
    this.connectedClients.get(storeId)!.add(client.id);
    
    // 加入房间
    client.join(`store:${storeId}`);
    
    // 发送连接成功消息
    client.emit('connected', {
      message: 'Connected to dashboard',
      storeId,
      timestamp: new Date().toISOString(),
    });
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    
    // 从所有房间移除
    this.connectedClients.forEach((clients, storeId) => {
      clients.delete(client.id);
      if (clients.size === 0) {
        this.connectedClients.delete(storeId);
      }
    });
  }

  // ========== 订阅消息 ==========

  @SubscribeMessage('subscribe')
  handleSubscribe(client: Socket, payload: { storeId?: string; channels?: string[] }) {
    const storeId = payload.storeId || 'default';
    const channels = payload.channels || ['orders', 'appointments', 'realtime'];
    
    // 加入指定的频道房间
    channels.forEach(channel => {
      client.join(`${channel}:${storeId}`);
      this.logger.log(`Client ${client.id} subscribed to ${channel}:${storeId}`);
    });
    
    return {
      success: true,
      message: 'Subscribed successfully',
      channels,
      storeId,
    };
  }

  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(client: Socket, payload: { storeId?: string; channels?: string[] }) {
    const storeId = payload.storeId || 'default';
    const channels = payload.channels || [];
    
    channels.forEach(channel => {
      client.leave(`${channel}:${storeId}`);
    });
    
    return {
      success: true,
      message: 'Unsubscribed successfully',
      channels,
    };
  }

  // ========== 推送方法 ==========

  /**
   * 推送新订单通知
   */
  async pushNewOrder(order: Consumption, storeId?: string) {
    const targetStoreId = storeId || 'default';
    const room = `orders:${targetStoreId}`;
    
    const orderData = {
      id: order.id,
      orderNo: order.orderNo,
      amount: Number(order.actualAmount),
      paymentMethod: order.paymentMethod,
      consumptionType: order.consumptionType,
      createdAt: order.createdAt,
    };
    
    this.server.to(room).emit('new-order', {
      type: 'new_order',
      data: orderData,
      timestamp: new Date().toISOString(),
    });
    
    this.logger.log(`Pushed new order: ${order.orderNo} to ${room}`);
  }

  /**
   * 推送订单更新
   */
  async pushOrderUpdate(order: Consumption, storeId?: string) {
    const targetStoreId = storeId || 'default';
    const room = `orders:${targetStoreId}`;
    
    this.server.to(room).emit('order-update', {
      type: 'order_update',
      data: {
        id: order.id,
        orderNo: order.orderNo,
        amount: Number(order.actualAmount),
        status: 'completed',
      },
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * 推送新预约通知
   */
  async pushNewAppointment(appointment: Appointment, storeId?: string) {
    const targetStoreId = storeId || 'default';
    const room = `appointments:${targetStoreId}`;
    
    const appointmentData = {
      id: appointment.id,
      memberName: appointment.member?.name || appointment.guestName || '散客',
      serviceName: appointment.service?.name,
      employeeName: appointment.employee?.name,
      date: appointment.appointmentDate,
      time: appointment.startTime,
      status: appointment.status,
    };
    
    this.server.to(room).emit('new-appointment', {
      type: 'new_appointment',
      data: appointmentData,
      timestamp: new Date().toISOString(),
    });
    
    this.logger.log(`Pushed new appointment to ${room}`);
  }

  /**
   * 推送预约状态更新
   */
  async pushAppointmentUpdate(appointment: Appointment, storeId?: string) {
    const targetStoreId = storeId || 'default';
    const room = `appointments:${targetStoreId}`;
    
    this.server.to(room).emit('appointment-update', {
      type: 'appointment_update',
      data: {
        id: appointment.id,
        status: appointment.status,
      },
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * 推送实时数据更新
   */
  async pushRealtimeUpdate(data: any, storeId?: string) {
    const targetStoreId = storeId || 'default';
    const room = `realtime:${targetStoreId}`;
    
    this.server.to(room).emit('realtime-update', {
      type: 'realtime_update',
      data,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * 推送排队更新
   */
  async pushQueueUpdate(queueData: any, storeId?: string) {
    const targetStoreId = storeId || 'default';
    const room = `realtime:${targetStoreId}`;
    
    this.server.to(room).emit('queue-update', {
      type: 'queue_update',
      data: queueData,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * 广播系统通知
   */
  broadcastNotification(message: string, type: string = 'info', storeId?: string) {
    const targetStoreId = storeId || 'default';
    
    this.server.emit('notification', {
      type,
      message,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * 获取连接统计
   */
  getConnectionStats() {
    const stats: Record<string, number> = {};
    this.connectedClients.forEach((clients, storeId) => {
      stats[storeId] = clients.size;
    });
    return {
      totalConnections: Array.from(this.connectedClients.values())
        .reduce((sum, clients) => sum + clients.size, 0),
      byStore: stats,
    };
  }

  // ========== 定时推送任务 ==========

  /**
   * 定时推送实时数据（可由外部定时器调用）
   */
  async pushScheduledRealtime(storeId?: string) {
    const targetStoreId = storeId || 'default';
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    // 获取今日消费统计
    const consumptions = await this.consumptionRepository.find({
      where: { createdAt: Between(todayStart, now) },
    });

    const totalRevenue = consumptions.reduce((sum, c) => sum + Number(c.actualAmount), 0);
    const customerCount = consumptions.length;

    // 获取今日预约统计
    const appointments = await this.appointmentRepository.find({
      where: { appointmentDate: todayStart },
    });

    const pendingCount = appointments.filter(a => a.status === AppointmentStatus.PENDING).length;
    const completedCount = appointments.filter(a => a.status === AppointmentStatus.COMPLETED).length;

    await this.pushRealtimeUpdate({
      revenue: Number(totalRevenue.toFixed(2)),
      customerCount,
      appointments: {
        pending: pendingCount,
        completed: completedCount,
      },
    }, targetStoreId);
  }
}
