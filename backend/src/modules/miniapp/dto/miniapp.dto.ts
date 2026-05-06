export class WxLoginDto {
  code: string;
}

export class BindPhoneDto {
  openid: string;
  phone: string;
  name?: string;
  encryptedData?: string;
  iv?: string;
}

export class UpdateUserInfoDto {
  nickname?: string;
  avatar?: string;
  gender?: number;
}

export class CreateAppointmentDto {
  memberId: string;
  serviceId: string;
  employeeId: string;
  appointmentDate: string;
  startTime: string;
  remark?: string;
}

export class CancelAppointmentDto {
  memberId: string;
  appointmentId: string;
  reason?: string;
}

export class ReceiveCouponDto {
  memberId: string;
  couponId: string;
}

export class PointsExchangeDto {
  memberId: string;
  goodsId: string;
  quantity: number;
  deliveryInfo?: {
    name: string;
    phone: string;
    province: string;
    city: string;
    district: string;
    address: string;
  };
}
