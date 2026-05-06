# 小程序接口API文档

## 基础路径
所有接口前缀: `/api/miniapp`

## 认证方式
- 通过请求头 `x-wx-openid` 传递微信用户openid
- 部分接口需要 `memberId` 参数

---

## 1. 用户系统接口

### 1.1 微信登录
- **POST** `/login`
- **请求体**:
  ```json
  { "code": "微信登录code" }
  ```
- **响应**:
  ```json
  {
    "token": "用户token",
    "openid": "微信openid",
    "isNew": true,
    "userInfo": { ... }
  }
  ```

### 1.2 绑定手机号
- **POST** `/bind-phone`
- **请求体**:
  ```json
  {
    "openid": "微信openid",
    "phone": "手机号",
    "name": "姓名(可选)"
  }
  ```

### 1.3 更新用户信息
- **POST** `/user/update`
- **请求头**: `x-wx-openid`
- **请求体**:
  ```json
  {
    "nickname": "昵称",
    "avatar": "头像URL",
    "gender": 1
  }
  ```

### 1.4 获取当前用户信息
- **GET** `/user/info`
- **请求头**: `x-wx-openid`

---

## 2. 预约接口

### 2.1 获取我的预约列表
- **GET** `/appointments?memberId=xxx&status=pending`
- **参数**:
  - `memberId`: 会员ID (必填)
  - `status`: 状态筛选 (可选: pending, confirmed, completed, cancelled)

### 2.2 创建预约
- **POST** `/appointment`
- **请求体**:
  ```json
  {
    "memberId": "会员ID",
    "serviceId": "服务ID",
    "employeeId": "员工ID",
    "appointmentDate": "2024-01-15",
    "startTime": "10:00",
    "remark": "备注"
  }
  ```

### 2.3 取消预约
- **PUT** `/appointment/:id`
- **请求体**:
  ```json
  {
    "memberId": "会员ID",
    "reason": "取消原因"
  }
  ```

### 2.4 获取可预约时段
- **GET** `/available-slots?employeeId=xxx&date=2024-01-15`

---

## 3. 会员卡接口

### 3.1 获取会员卡信息
- **GET** `/member-card?memberId=xxx`

### 3.2 获取我的次卡列表
- **GET** `/count-cards?memberId=xxx`

---

## 4. 优惠券接口

### 4.1 获取我的优惠券
- **GET** `/coupons?memberId=xxx&status=available`
- **参数**:
  - `memberId`: 会员ID (必填)
  - `status`: 状态 (可选: available, used, expired)

### 4.2 获取可领取的优惠券
- **GET** `/coupons/available`

### 4.3 领取优惠券
- **POST** `/coupon/receive`
- **请求体**:
  ```json
  {
    "memberId": "会员ID",
    "couponId": "优惠券ID"
  }
  ```

---

## 5. 积分接口

### 5.1 获取我的积分
- **GET** `/points?memberId=xxx`

### 5.2 获取积分商品列表
- **GET** `/points/products?category=xxx`

### 5.3 积分兑换
- **POST** `/points/exchange`
- **请求体**:
  ```json
  {
    "memberId": "会员ID",
    "goodsId": "商品ID",
    "quantity": 1,
    "deliveryInfo": {
      "name": "收货人",
      "phone": "手机号",
      "province": "省",
      "city": "市",
      "district": "区",
      "address": "详细地址"
    }
  }
  ```

---

## 6. 订单接口

### 6.1 获取我的订单列表
- **GET** `/orders?memberId=xxx&page=1&limit=20`

### 6.2 获取订单详情
- **GET** `/order/:id?memberId=xxx`

---

## 7. 服务接口

### 7.1 获取服务列表
- **GET** `/services?category=hair`

### 7.2 获取员工列表
- **GET** `/employees`

---

## 8. 其他接口

### 8.1 获取商家信息
- **GET** `/shop/info`

### 8.2 获取团队展示
- **GET** `/team`

### 8.3 获取优惠活动
- **GET** `/promotions`

### 8.4 在线充值
- **POST** `/recharge`
- **请求体**:
  ```json
  {
    "memberId": "会员ID",
    "amount": 100,
    "paymentMethod": "wechat"
  }
  ```

### 8.5 在线办卡
- **POST** `/purchase-card`
- **请求体**:
  ```json
  {
    "memberId": "会员ID",
    "packageId": "次卡套餐ID",
    "paymentMethod": "wechat"
  }
  ```

---

## 数据实体

### MiniappUser (小程序用户)
```typescript
{
  id: string;
  openid: string;          // 微信openid
  unionid: string;         // 微信unionid
  phone: string;           // 手机号
  nickname: string;        // 昵称
  avatar: string;          // 头像
  gender: number;          // 性别
  memberId: string;        // 关联会员ID
  status: 'active' | 'banned';
  lastLoginAt: Date;
  loginCount: number;
}
```

---

## 错误码
- `401`: 未授权/用户不存在
- `400`: 请求参数错误
- `404`: 资源不存在
- `500`: 服务器错误
