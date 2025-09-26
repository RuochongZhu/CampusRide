# 校园拼车后端开发文档 - 模块 2 (Cursor AI 负责)

## 🎯 模块概述

**负责人**: Cursor AI  
**模块范围**: 拼车系统、市场系统、通知系统、文件管理系统  
**开发周期**: 2-3 周  
**优先级**: 高

### Sprint 计划与交付目标

- **第一阶段 (Sprint 1 - 第 1 周)**:

  - 完成项目基础架构搭建（Express、数据库连接、中间件配置）
  - 完成用户认证/管理模块的全部 API
  - 提供稳定的、可供其他模块依赖的用户系统
  - 为 Claude Code 提供 `authMiddleware` 和用户数据访问接口

- **第二阶段 (Sprint 2 - 第 2 周)**:

  - 完成拼车系统的全部功能开发
  - 实现智能匹配算法和路线优化
  - 集成地图服务 API
  - 完成拼车相关的单元测试和集成测试

- **第三阶段 (Sprint 3 - 第 3 周)**:
  - 完成二手市场系统
  - 实现文件上传和管理功能
  - 完成评价系统并与拼车系统集成
  - 集成支付功能（如需要）
  - 系统集成测试和性能优化

### 核心职责

1. **项目基础架构与核心服务**: 搭建整个后端项目的骨架，为所有模块提供基础支撑
2. **用户认证与管理**: 实现完整、安全的用户系统，这是所有其他功能的基础
3. **拼车系统**: 开发完整的行程发布、搜索、预订和管理功能
4. **二手市场**: 开发商品发布、搜索、交易功能
5. **评价系统**: 建立通用的评价体系，可扩展至各个模块

### 协作要点

- **基础优先**: 第一周必须完成基础架构和用户系统，确保不阻塞 Claude Code
- **接口文档**: 每完成一个 API 立即更新文档，方便对方调用
- **Mock 服务**: 初期可为 `notificationService` 和 `pointsService` 创建 Mock 调用
- **数据一致性**: 与 Claude Code 协商 `item_categories` 和 `activity_categories` 的预置数据
- **代码规范**: 严格遵循 `api-standards-specification.md` 中的规范

## 📋 目录

1. [技术栈与架构](#技术栈与架构)
2. [数据库设计](#数据库设计)
3. [拼车系统](#拼车系统)
4. [市场系统](#市场系统)
5. [通知系统](#通知系统)
6. [文件管理系统](#文件管理系统)
7. [API 接口详细设计](#api接口详细设计)
8. [实时通信](#实时通信)
9. [地理定位服务](#地理定位服务)
10. [支付集成](#支付集成)
11. [性能优化](#性能优化)
12. [测试策略](#测试策略)
13. [部署与运维](#部署与运维)
14. [安全考虑](#安全考虑)

---

## 🏗️ 技术栈与架构

### 核心技术栈

```yaml
后端框架: Node.js + Express.js / Fastify
数据库:
  - 主数据库: PostgreSQL 15+
  - 时序数据库: InfluxDB (位置追踪)
  - 文档数据库: MongoDB (聊天记录)
实时通信: Socket.IO / WebSocket
消息队列: Redis Pub/Sub + Bull Queue
地图服务: 高德地图API / 百度地图API
文件存储: AWS S3 / 阿里云OSS / 本地存储
推送服务: Firebase Cloud Messages / 极光推送
图片处理: Sharp / ImageMagick
支付: 微信支付 / 支付宝
搜索引擎: Elasticsearch
监控: Prometheus + Grafana
```

### 项目结构

```
src/
├── config/          # 配置文件
│   ├── socket.js
│   ├── storage.js
│   ├── payment.js
│   └── maps.js
├── controllers/     # 控制器
│   ├── rideshare.controller.js
│   ├── marketplace.controller.js
│   ├── notification.controller.js
│   ├── upload.controller.js
│   └── chat.controller.js
├── middleware/      # 中间件
│   ├── upload.middleware.js
│   ├── geolocation.middleware.js
│   ├── payment.middleware.js
│   └── socket.middleware.js
├── models/          # 数据模型
│   ├── Ride.js
│   ├── RideRequest.js
│   ├── Product.js
│   ├── Transaction.js
│   ├── Notification.js
│   ├── ChatMessage.js
│   └── FileUpload.js
├── routes/          # 路由
│   ├── rideshare.routes.js
│   ├── marketplace.routes.js
│   ├── notification.routes.js
│   └── upload.routes.js
├── services/        # 业务逻辑
│   ├── rideshare.service.js
│   ├── marketplace.service.js
│   ├── notification.service.js
│   ├── socket.service.js
│   ├── maps.service.js
│   ├── payment.service.js
│   └── storage.service.js
├── utils/          # 工具函数
│   ├── distance.util.js
│   ├── image.util.js
│   ├── notification.util.js
│   └── payment.util.js
├── validators/     # 输入验证
│   ├── rideshare.validator.js
│   ├── marketplace.validator.js
│   └── upload.validator.js
├── sockets/        # WebSocket处理
│   ├── ride.socket.js
│   ├── chat.socket.js
│   └── notification.socket.js
└── workers/        # 后台任务
    ├── notification.worker.js
    ├── matching.worker.js
    └── cleanup.worker.js
```

---

## 🗄️ 数据库设计

### 拼车表 (rides)

```sql
CREATE TABLE rides (
  id SERIAL PRIMARY KEY,
  driver_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  departure_location JSON NOT NULL, -- {address, latitude, longitude, poi_id}
  destination_location JSON NOT NULL,
  departure_time TIMESTAMP NOT NULL,
  estimated_arrival_time TIMESTAMP,
  seats_available INTEGER NOT NULL CHECK (seats_available > 0),
  seats_taken INTEGER DEFAULT 0,
  price_per_seat DECIMAL(10,2) NOT NULL,
  vehicle_info JSON, -- {make, model, color, license_plate}
  route_info JSON, -- {waypoints, distance, duration}
  restrictions JSON, -- {gender_preference, smoke_free, etc}
  contact_info JSON,
  status ENUM('pending', 'confirmed', 'ongoing', 'completed', 'cancelled') DEFAULT 'pending',
  payment_method ENUM('cash', 'alipay', 'wechat', 'points') DEFAULT 'cash',
  auto_accept BOOLEAN DEFAULT false,
  recurring_pattern JSON, -- for recurring rides
  weather_dependent BOOLEAN DEFAULT false,
  tags JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- 索引
  INDEX idx_driver_id (driver_id),
  INDEX idx_departure_time (departure_time),
  INDEX idx_status (status),
  INDEX idx_location (((departure_location->>'latitude')::float), ((departure_location->>'longitude')::float)),
  INDEX idx_destination (((destination_location->>'latitude')::float), ((destination_location->>'longitude')::float)),
  INDEX idx_price (price_per_seat),
  FULLTEXT idx_description (title, description)
);
```

### 拼车请求表 (ride_requests)

```sql
CREATE TABLE ride_requests (
  id SERIAL PRIMARY KEY,
  ride_id INTEGER REFERENCES rides(id) ON DELETE CASCADE,
  passenger_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  pickup_location JSON, -- optional custom pickup location
  seats_requested INTEGER NOT NULL DEFAULT 1,
  message TEXT,
  status ENUM('pending', 'accepted', 'rejected', 'cancelled', 'completed') DEFAULT 'pending',
  payment_status ENUM('unpaid', 'paid', 'refunded') DEFAULT 'unpaid',
  payment_amount DECIMAL(10,2),
  pickup_time TIMESTAMP,
  dropoff_time TIMESTAMP,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  emergency_contact JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY unique_user_ride (ride_id, passenger_id),
  INDEX idx_passenger_id (passenger_id),
  INDEX idx_ride_id (ride_id),
  INDEX idx_status (status),
  INDEX idx_payment_status (payment_status)
);
```

### 商品表 (products)

```sql
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  seller_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category ENUM('textbooks', 'electronics', 'furniture', 'clothing', 'sports', 'other') NOT NULL,
  condition_type ENUM('new', 'like_new', 'good', 'fair', 'poor') NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  original_price DECIMAL(10,2),
  currency VARCHAR(3) DEFAULT 'CNY',
  images JSON, -- array of image URLs
  tags JSON,
  brand VARCHAR(100),
  specifications JSON,
  location JSON, -- pickup location
  availability_status ENUM('available', 'reserved', 'sold', 'hidden') DEFAULT 'available',
  delivery_options JSON, -- {pickup, delivery, shipping}
  payment_methods JSON, -- accepted payment methods
  negotiable BOOLEAN DEFAULT true,
  view_count INTEGER DEFAULT 0,
  favorite_count INTEGER DEFAULT 0,
  report_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- 索引
  INDEX idx_seller_id (seller_id),
  INDEX idx_category (category),
  INDEX idx_price (price),
  INDEX idx_status (availability_status),
  INDEX idx_created_at (created_at DESC),
  INDEX idx_location (((location->>'latitude')::float), ((location->>'longitude')::float)),
  FULLTEXT idx_search (title, description, brand)
);
```

### 交易表 (transactions)

```sql
CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
  ride_id INTEGER REFERENCES rides(id) ON DELETE SET NULL,
  buyer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  seller_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  transaction_type ENUM('product_sale', 'ride_payment', 'points_transfer') NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'CNY',
  payment_method ENUM('alipay', 'wechat', 'cash', 'points', 'bank_transfer') NOT NULL,
  payment_gateway_id VARCHAR(255), -- third-party payment ID
  status ENUM('pending', 'paid', 'completed', 'refunded', 'cancelled', 'disputed') DEFAULT 'pending',
  metadata JSON,
  notes TEXT,
  escrow_until TIMESTAMP, -- for escrow payments
  dispute_reason TEXT,
  refund_amount DECIMAL(10,2),
  refund_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_buyer_id (buyer_id),
  INDEX idx_seller_id (seller_id),
  INDEX idx_product_id (product_id),
  INDEX idx_ride_id (ride_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at DESC)
);
```

### 通知表 (notifications)

```sql
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  type ENUM('ride_request', 'ride_accepted', 'ride_cancelled', 'message', 'product_inquiry', 'transaction', 'system', 'promotion') NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  data JSON, -- additional notification data
  priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
  status ENUM('unread', 'read', 'dismissed') DEFAULT 'unread',
  delivery_method JSON, -- {push, email, sms, in_app}
  scheduled_for TIMESTAMP,
  sent_at TIMESTAMP,
  read_at TIMESTAMP,
  action_url TEXT,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_user_id (user_id),
  INDEX idx_type (type),
  INDEX idx_status (status),
  INDEX idx_priority (priority),
  INDEX idx_created_at (created_at DESC),
  INDEX idx_scheduled_for (scheduled_for)
);
```

### 聊天消息表 (chat_messages)

```sql
CREATE TABLE chat_messages (
  id SERIAL PRIMARY KEY,
  conversation_id VARCHAR(255) NOT NULL, -- ride_id or product_id based conversation
  conversation_type ENUM('ride', 'product', 'support') NOT NULL,
  sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  recipient_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  message_type ENUM('text', 'image', 'location', 'system') DEFAULT 'text',
  content TEXT,
  media_url TEXT,
  metadata JSON,
  status ENUM('sent', 'delivered', 'read') DEFAULT 'sent',
  reply_to_id INTEGER REFERENCES chat_messages(id) ON DELETE SET NULL,
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  delivered_at TIMESTAMP,
  read_at TIMESTAMP,

  INDEX idx_conversation (conversation_id, conversation_type),
  INDEX idx_sender_id (sender_id),
  INDEX idx_recipient_id (recipient_id),
  INDEX idx_sent_at (sent_at DESC)
);
```

### 文件上传表 (file_uploads)

```sql
CREATE TABLE file_uploads (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  file_type VARCHAR(100) NOT NULL,
  file_size INTEGER NOT NULL,
  storage_path TEXT NOT NULL,
  public_url TEXT,
  thumbnail_url TEXT,
  purpose ENUM('avatar', 'product_image', 'chat_media', 'document', 'other') NOT NULL,
  related_id INTEGER, -- related entity ID (product_id, ride_id, etc.)
  related_type VARCHAR(50), -- related entity type
  processing_status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_user_id (user_id),
  INDEX idx_purpose (purpose),
  INDEX idx_related (related_type, related_id),
  INDEX idx_created_at (created_at DESC)
);
```

---

## 🚗 拼车系统

### 拼车匹配算法

```javascript
// 智能拼车匹配服务
class RideMatchingService {
  constructor() {
    this.MATCHING_RADIUS = 5000; // 5公里范围内匹配
    this.TIME_TOLERANCE = 3600; // 1小时时间容差
    this.MAX_DETOUR_DISTANCE = 2000; // 最大绕行距离2公里
  }

  async findMatchingRides(searchCriteria) {
    const {
      departureLocation,
      destinationLocation,
      departureTime,
      seatsNeeded = 1,
      maxPrice,
      preferences = {},
    } = searchCriteria;

    try {
      // 1. 基于地理位置的初步筛选
      const nearbyRides = await this.findRidesInRadius(
        departureLocation,
        destinationLocation,
        this.MATCHING_RADIUS
      );

      // 2. 时间筛选
      const timeMatchedRides = this.filterByTime(nearbyRides, departureTime);

      // 3. 座位和价格筛选
      const availableRides = this.filterByAvailabilityAndPrice(
        timeMatchedRides,
        seatsNeeded,
        maxPrice
      );

      // 4. 路线优化匹配
      const routeOptimizedRides = await this.optimizeRouteMatching(
        availableRides,
        departureLocation,
        destinationLocation
      );

      // 5. 个人偏好匹配
      const personalizedRides = this.applyPersonalPreferences(
        routeOptimizedRides,
        preferences
      );

      // 6. 智能排序
      const sortedRides = this.sortByMatchingScore(
        personalizedRides,
        searchCriteria
      );

      return sortedRides;
    } catch (error) {
      logger.error("Ride matching error:", error);
      throw new Error("Failed to find matching rides");
    }
  }

  async findRidesInRadius(departure, destination, radius) {
    const query = `
      SELECT r.*, u.first_name, u.last_name, u.avatar_url, u.rating,
             (6371 * acos(cos(radians($1)) * cos(radians((departure_location->>'latitude')::float)) 
             * cos(radians((departure_location->>'longitude')::float) - radians($2)) 
             + sin(radians($1)) * sin(radians((departure_location->>'latitude')::float)))) AS departure_distance,
             (6371 * acos(cos(radians($3)) * cos(radians((destination_location->>'latitude')::float)) 
             * cos(radians((destination_location->>'longitude')::float) - radians($4)) 
             + sin(radians($3)) * sin(radians((destination_location->>'latitude')::float)))) AS destination_distance
      FROM rides r
      JOIN users u ON r.driver_id = u.id
      WHERE r.status = 'confirmed'
        AND r.seats_available > r.seats_taken
        AND r.departure_time > NOW()
      HAVING departure_distance < $5 AND destination_distance < $5
      ORDER BY departure_distance + destination_distance ASC
    `;

    const result = await db.query(query, [
      departure.latitude,
      departure.longitude,
      destination.latitude,
      destination.longitude,
      radius / 1000, // Convert to kilometers
    ]);

    return result.rows;
  }

  filterByTime(rides, targetTime) {
    const targetTimestamp = new Date(targetTime).getTime();

    return rides.filter((ride) => {
      const rideTimestamp = new Date(ride.departure_time).getTime();
      const timeDiff = Math.abs(rideTimestamp - targetTimestamp);
      return timeDiff <= this.TIME_TOLERANCE * 1000;
    });
  }

  async optimizeRouteMatching(rides, pickupLocation, dropoffLocation) {
    const optimizedRides = [];

    for (const ride of rides) {
      try {
        // 计算原始路线
        const originalRoute = await this.mapsService.calculateRoute(
          ride.departure_location,
          ride.destination_location
        );

        // 计算包含接送点的新路线
        const newRoute = await this.mapsService.calculateRoute(
          ride.departure_location,
          ride.destination_location,
          [pickupLocation, dropoffLocation]
        );

        // 计算绕行距离和时间
        const extraDistance = newRoute.distance - originalRoute.distance;
        const extraTime = newRoute.duration - originalRoute.duration;

        // 检查是否在可接受范围内
        if (extraDistance <= this.MAX_DETOUR_DISTANCE && extraTime <= 900) {
          // 15分钟
          optimizedRides.push({
            ...ride,
            routeOptimization: {
              originalDistance: originalRoute.distance,
              newDistance: newRoute.distance,
              extraDistance,
              extraTime,
              optimizedRoute: newRoute.waypoints,
            },
          });
        }
      } catch (error) {
        logger.warn(`Route optimization failed for ride ${ride.id}:`, error);
        // 如果路线优化失败，仍然包含该拼车，但标记为未优化
        optimizedRides.push({
          ...ride,
          routeOptimization: { optimized: false },
        });
      }
    }

    return optimizedRides;
  }

  sortByMatchingScore(rides, searchCriteria) {
    return rides
      .map((ride) => {
        let score = 0;

        // 距离得分 (权重: 30%)
        const avgDistance =
          (ride.departure_distance + ride.destination_distance) / 2;
        score += (1 - avgDistance / this.MATCHING_RADIUS) * 30;

        // 时间匹配得分 (权重: 25%)
        const timeDiff = Math.abs(
          new Date(ride.departure_time).getTime() -
            new Date(searchCriteria.departureTime).getTime()
        );
        score += (1 - timeDiff / (this.TIME_TOLERANCE * 1000)) * 25;

        // 价格得分 (权重: 20%)
        if (searchCriteria.maxPrice) {
          score += (1 - ride.price_per_seat / searchCriteria.maxPrice) * 20;
        }

        // 司机评分 (权重: 15%)
        score += (ride.rating / 5) * 15;

        // 路线优化得分 (权重: 10%)
        if (ride.routeOptimization?.optimized !== false) {
          const detourRatio =
            ride.routeOptimization?.extraDistance /
              ride.routeOptimization?.originalDistance || 0;
          score += (1 - Math.min(detourRatio, 1)) * 10;
        }

        return { ...ride, matchingScore: Math.round(score) };
      })
      .sort((a, b) => b.matchingScore - a.matchingScore);
  }
}
```

### 拼车 API 设计

#### 1. 发布拼车

```javascript
// POST /api/rideshare/rides
const createRide = async (req, res) => {
  try {
    const {
      title,
      description,
      departureLocation,
      destinationLocation,
      departureTime,
      seatsAvailable,
      pricePerSeat,
      vehicleInfo,
      restrictions,
      paymentMethod,
      autoAccept,
      recurringPattern,
    } = req.body;

    const driverId = req.user.userId;

    // 1. 输入验证
    const validation = validateRideCreation(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid input data",
        errors: validation.errors,
      });
    }

    // 2. 验证司机资格
    const driver = await User.findById(driverId);
    if (!driver.drivingLicense || !driver.drivingLicense.verified) {
      return res.status(403).json({
        success: false,
        message: "Valid driving license required to create rides",
      });
    }

    // 3. 检查时间冲突
    const conflicts = await Ride.find({
      driverId,
      status: { $in: ["pending", "confirmed", "ongoing"] },
      departureTime: {
        $gte: new Date(departureTime - 3600000), // 1小时前
        $lte: new Date(departureTime + 3600000), // 1小时后
      },
    });

    if (conflicts.length > 0) {
      return res.status(409).json({
        success: false,
        message: "You have conflicting rides at this time",
      });
    }

    // 4. 路线规划和预估
    const routeInfo = await mapsService.calculateRoute(
      departureLocation,
      destinationLocation
    );

    const estimatedArrival = new Date(
      new Date(departureTime).getTime() + routeInfo.duration * 1000
    );

    // 5. 创建拼车记录
    const ride = await Ride.create({
      driverId,
      title,
      description,
      departureLocation,
      destinationLocation,
      departureTime: new Date(departureTime),
      estimatedArrivalTime: estimatedArrival,
      seatsAvailable,
      pricePerSeat,
      vehicleInfo,
      routeInfo,
      restrictions,
      paymentMethod,
      autoAccept,
      recurringPattern,
      status: "pending",
    });

    // 6. 自动匹配通知
    await this.notifyPotentialPassengers(ride);

    // 7. 记录日志
    logger.info("Ride created successfully", {
      rideId: ride.id,
      driverId,
      departure: departureLocation.address,
      destination: destinationLocation.address,
      departureTime,
    });

    res.status(201).json({
      success: true,
      message: "Ride created successfully",
      data: {
        ride: {
          id: ride.id,
          title: ride.title,
          departureLocation: ride.departureLocation,
          destinationLocation: ride.destinationLocation,
          departureTime: ride.departureTime,
          estimatedArrivalTime: ride.estimatedArrivalTime,
          seatsAvailable: ride.seatsAvailable,
          pricePerSeat: ride.pricePerSeat,
          status: ride.status,
        },
      },
    });
  } catch (error) {
    logger.error("Create ride error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during ride creation",
    });
  }
};
```

#### 2. 搜索拼车

```javascript
// GET /api/rideshare/search
const searchRides = async (req, res) => {
  try {
    const {
      from_lat,
      from_lng,
      to_lat,
      to_lng,
      departure_time,
      seats = 1,
      max_price,
      sort_by = "relevance",
      page = 1,
      limit = 20,
    } = req.query;

    // 1. 参数验证
    if (!from_lat || !from_lng || !to_lat || !to_lng || !departure_time) {
      return res.status(400).json({
        success: false,
        message: "Missing required search parameters",
      });
    }

    // 2. 构建搜索条件
    const searchCriteria = {
      departureLocation: {
        latitude: parseFloat(from_lat),
        longitude: parseFloat(from_lng),
      },
      destinationLocation: {
        latitude: parseFloat(to_lat),
        longitude: parseFloat(to_lng),
      },
      departureTime: new Date(departure_time),
      seatsNeeded: parseInt(seats),
      maxPrice: max_price ? parseFloat(max_price) : null,
    };

    // 3. 执行智能匹配
    const matchingService = new RideMatchingService();
    const matchedRides = await matchingService.findMatchingRides(
      searchCriteria
    );

    // 4. 分页处理
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    const paginatedRides = matchedRides.slice(startIndex, endIndex);

    // 5. 格式化响应数据
    const formattedRides = paginatedRides.map((ride) => ({
      id: ride.id,
      title: ride.title,
      driver: {
        id: ride.driver_id,
        firstName: ride.first_name,
        lastName: ride.last_name,
        avatarUrl: ride.avatar_url,
        rating: ride.rating,
      },
      departure: ride.departure_location,
      destination: ride.destination_location,
      departureTime: ride.departure_time,
      estimatedArrival: ride.estimated_arrival_time,
      seatsAvailable: ride.seats_available - ride.seats_taken,
      pricePerSeat: ride.price_per_seat,
      vehicleInfo: ride.vehicle_info,
      matchingScore: ride.matchingScore,
      routeOptimization: ride.routeOptimization,
      paymentMethod: ride.payment_method,
    }));

    res.status(200).json({
      success: true,
      data: {
        rides: formattedRides,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(matchedRides.length / parseInt(limit)),
          totalItems: matchedRides.length,
          itemsPerPage: parseInt(limit),
        },
        searchCriteria,
        executionTime: Date.now() - req.startTime,
      },
    });
  } catch (error) {
    logger.error("Search rides error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during ride search",
    });
  }
};
```

#### 3. 申请加入拼车

```javascript
// POST /api/rideshare/rides/:rideId/join
const joinRide = async (req, res) => {
  try {
    const { rideId } = req.params;
    const {
      seatsRequested = 1,
      pickupLocation,
      message,
      emergencyContact,
    } = req.body;
    const passengerId = req.user.userId;

    // 1. 获取拼车信息
    const ride = await Ride.findById(rideId).populate("driverId");
    if (!ride) {
      return res.status(404).json({
        success: false,
        message: "Ride not found",
      });
    }

    // 2. 检查拼车状态
    if (ride.status !== "confirmed") {
      return res.status(400).json({
        success: false,
        message: "Ride is not available for booking",
      });
    }

    // 3. 检查是否为司机自己
    if (ride.driverId._id.toString() === passengerId) {
      return res.status(400).json({
        success: false,
        message: "You cannot join your own ride",
      });
    }

    // 4. 检查座位可用性
    const availableSeats = ride.seatsAvailable - ride.seatsTaken;
    if (seatsRequested > availableSeats) {
      return res.status(400).json({
        success: false,
        message: `Only ${availableSeats} seats available`,
      });
    }

    // 5. 检查是否已经申请
    const existingRequest = await RideRequest.findOne({
      rideId,
      passengerId,
    });

    if (existingRequest) {
      return res.status(409).json({
        success: false,
        message: "You have already requested to join this ride",
      });
    }

    // 6. 创建拼车请求
    const rideRequest = await RideRequest.create({
      rideId,
      passengerId,
      seatsRequested,
      pickupLocation,
      message,
      emergencyContact,
      paymentAmount: ride.pricePerSeat * seatsRequested,
      status: ride.autoAccept ? "accepted" : "pending",
    });

    // 7. 如果自动接受，更新拼车座位
    if (ride.autoAccept) {
      await Ride.updateOne(
        { _id: rideId },
        { $inc: { seatsTaken: seatsRequested } }
      );

      // 发送确认通知
      await notificationService.sendRideConfirmation({
        recipientId: passengerId,
        rideId,
        driverName: `${ride.driverId.firstName} ${ride.driverId.lastName}`,
      });
    } else {
      // 发送请求通知给司机
      await notificationService.sendRideRequest({
        recipientId: ride.driverId._id,
        requestId: rideRequest.id,
        passengerName: `${req.user.firstName} ${req.user.lastName}`,
        rideTitle: ride.title,
      });
    }

    // 8. 实时通知
    const io = req.app.get("io");
    io.to(`user_${ride.driverId._id}`).emit("new_ride_request", {
      requestId: rideRequest.id,
      rideId,
      passenger: {
        id: passengerId,
        name: `${req.user.firstName} ${req.user.lastName}`,
        avatar: req.user.avatarUrl,
      },
      seatsRequested,
      message,
    });

    res.status(201).json({
      success: true,
      message: ride.autoAccept
        ? "Successfully joined the ride"
        : "Join request sent to the driver",
      data: {
        requestId: rideRequest.id,
        status: rideRequest.status,
        paymentAmount: rideRequest.paymentAmount,
        autoAccepted: ride.autoAccept,
      },
    });
  } catch (error) {
    logger.error("Join ride error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while joining ride",
    });
  }
};
```

---

## 🛒 市场系统

### 商品搜索与推荐引擎

```javascript
// 基于Elasticsearch的商品搜索服务
class ProductSearchService {
  constructor() {
    this.elasticClient = new Client({ node: process.env.ELASTICSEARCH_URL });
    this.index = "campus_marketplace";
  }

  async searchProducts(query) {
    const {
      keyword,
      category,
      minPrice,
      maxPrice,
      condition,
      location,
      radius = 10,
      sortBy = "relevance",
      page = 1,
      limit = 20,
      userId,
    } = query;

    try {
      // 构建Elasticsearch查询
      const searchQuery = {
        index: this.index,
        body: {
          query: {
            bool: {
              must: [],
              filter: [],
              should: [],
              must_not: [
                { term: { availability_status: "sold" } },
                { term: { availability_status: "hidden" } },
              ],
            },
          },
          sort: [],
          from: (page - 1) * limit,
          size: limit,
          highlight: {
            fields: {
              title: {},
              description: {},
            },
          },
          aggs: {
            categories: {
              terms: { field: "category.keyword" },
            },
            price_ranges: {
              range: {
                field: "price",
                ranges: [
                  { to: 50 },
                  { from: 50, to: 200 },
                  { from: 200, to: 500 },
                  { from: 500 },
                ],
              },
            },
            conditions: {
              terms: { field: "condition_type.keyword" },
            },
          },
        },
      };

      // 关键词搜索
      if (keyword) {
        searchQuery.body.query.bool.must.push({
          multi_match: {
            query: keyword,
            fields: ["title^3", "description^2", "brand^2", "tags"],
            type: "best_fields",
            fuzziness: "AUTO",
          },
        });
      } else {
        searchQuery.body.query.bool.must.push({ match_all: {} });
      }

      // 分类筛选
      if (category) {
        searchQuery.body.query.bool.filter.push({
          term: { "category.keyword": category },
        });
      }

      // 价格筛选
      if (minPrice || maxPrice) {
        const priceRange = {};
        if (minPrice) priceRange.gte = minPrice;
        if (maxPrice) priceRange.lte = maxPrice;
        searchQuery.body.query.bool.filter.push({
          range: { price: priceRange },
        });
      }

      // 商品状况筛选
      if (condition) {
        searchQuery.body.query.bool.filter.push({
          term: { "condition_type.keyword": condition },
        });
      }

      // 地理位置筛选
      if (location && location.latitude && location.longitude) {
        searchQuery.body.query.bool.filter.push({
          geo_distance: {
            distance: `${radius}km`,
            "location.coordinates": {
              lat: location.latitude,
              lon: location.longitude,
            },
          },
        });

        // 添加距离排序
        searchQuery.body.sort.push({
          _geo_distance: {
            "location.coordinates": {
              lat: location.latitude,
              lon: location.longitude,
            },
            order: "asc",
            unit: "km",
          },
        });
      }

      // 个性化推荐（基于用户历史行为）
      if (userId) {
        const userPreferences = await this.getUserPreferences(userId);
        if (userPreferences.length > 0) {
          searchQuery.body.query.bool.should.push({
            terms: {
              "category.keyword": userPreferences,
              boost: 1.2,
            },
          });
        }
      }

      // 排序逻辑
      this.applySorting(searchQuery, sortBy);

      // 执行搜索
      const response = await this.elasticClient.search(searchQuery);

      // 格式化结果
      return this.formatSearchResults(response);
    } catch (error) {
      logger.error("Product search error:", error);
      throw new Error("Search service temporarily unavailable");
    }
  }

  applySorting(searchQuery, sortBy) {
    switch (sortBy) {
      case "price_low":
        searchQuery.body.sort.unshift({ price: { order: "asc" } });
        break;
      case "price_high":
        searchQuery.body.sort.unshift({ price: { order: "desc" } });
        break;
      case "newest":
        searchQuery.body.sort.unshift({ created_at: { order: "desc" } });
        break;
      case "popular":
        searchQuery.body.sort.unshift({
          _script: {
            type: "number",
            script: {
              source:
                'doc["view_count"].value + doc["favorite_count"].value * 2',
            },
            order: "desc",
          },
        });
        break;
      default: // relevance
        searchQuery.body.sort.unshift({ _score: { order: "desc" } });
    }
  }

  async getUserPreferences(userId) {
    // 分析用户历史浏览和购买记录
    const userBehavior = await ProductView.aggregate([
      { $match: { userId: new ObjectId(userId) } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 3 },
    ]);

    return userBehavior.map((item) => item._id);
  }

  formatSearchResults(response) {
    return {
      products: response.body.hits.hits.map((hit) => ({
        id: hit._source.id,
        title: hit._source.title,
        description: hit._source.description,
        price: hit._source.price,
        originalPrice: hit._source.original_price,
        category: hit._source.category,
        condition: hit._source.condition_type,
        images: hit._source.images,
        location: hit._source.location,
        seller: hit._source.seller,
        createdAt: hit._source.created_at,
        distance: hit.sort ? hit.sort[hit.sort.length - 1] : null,
        highlights: hit.highlight,
        score: hit._score,
      })),
      total: response.body.hits.total.value,
      aggregations: {
        categories: response.body.aggregations.categories.buckets,
        priceRanges: response.body.aggregations.price_ranges.buckets,
        conditions: response.body.aggregations.conditions.buckets,
      },
      took: response.body.took,
    };
  }
}
```

### 市场 API 设计

#### 1. 发布商品

```javascript
// POST /api/marketplace/products
const createProduct = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      condition,
      price,
      originalPrice,
      brand,
      specifications,
      tags,
      deliveryOptions,
      paymentMethods,
      negotiable,
      expiresAt,
    } = req.body;

    const sellerId = req.user.userId;

    // 1. 输入验证
    const validation = validateProductCreation(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid input data",
        errors: validation.errors,
      });
    }

    // 2. 检查用户发布限制
    const userProductCount = await Product.countDocuments({
      sellerId,
      availabilityStatus: { $in: ["available", "reserved"] },
    });

    if (userProductCount >= 20) {
      return res.status(400).json({
        success: false,
        message: "Maximum 20 active products allowed per user",
      });
    }

    // 3. 处理上传的图片
    let imageUrls = [];
    if (req.files && req.files.length > 0) {
      imageUrls = await Promise.all(
        req.files.map((file) =>
          storageService.uploadProductImage(file, sellerId)
        )
      );
    }

    // 4. 获取用户位置（默认使用用户设置的位置）
    const user = await User.findById(sellerId).select("location university");
    const productLocation = user.location || {
      address: user.university,
      latitude: null,
      longitude: null,
    };

    // 5. 创建商品记录
    const product = await Product.create({
      sellerId,
      title,
      description,
      category,
      conditionType: condition,
      price,
      originalPrice,
      brand,
      specifications,
      images: imageUrls,
      tags: tags || [],
      location: productLocation,
      deliveryOptions: deliveryOptions || { pickup: true },
      paymentMethods: paymentMethods || ["cash"],
      negotiable: negotiable !== false,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      availabilityStatus: "available",
    });

    // 6. 索引到Elasticsearch
    await searchService.indexProduct(product);

    // 7. 发送推荐通知给潜在买家
    await this.notifyInterestedUsers(product);

    // 8. 记录日志
    logger.info("Product created successfully", {
      productId: product.id,
      sellerId,
      title: product.title,
      category: product.category,
      price: product.price,
    });

    res.status(201).json({
      success: true,
      message: "Product listed successfully",
      data: {
        product: {
          id: product.id,
          title: product.title,
          description: product.description,
          category: product.category,
          condition: product.conditionType,
          price: product.price,
          images: product.images,
          createdAt: product.createdAt,
        },
      },
    });
  } catch (error) {
    logger.error("Create product error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during product creation",
    });
  }
};
```

#### 2. 商品交易流程

```javascript
// POST /api/marketplace/products/:productId/purchase
const purchaseProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const { paymentMethod, deliveryOption, message } = req.body;
    const buyerId = req.user.userId;

    // 1. 获取商品信息
    const product = await Product.findById(productId).populate("sellerId");
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // 2. 检查商品状态
    if (product.availabilityStatus !== "available") {
      return res.status(400).json({
        success: false,
        message: "Product is no longer available",
      });
    }

    // 3. 检查是否为自己的商品
    if (product.sellerId._id.toString() === buyerId) {
      return res.status(400).json({
        success: false,
        message: "You cannot purchase your own product",
      });
    }

    // 4. 验证支付方式
    if (!product.paymentMethods.includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: "Selected payment method not accepted by seller",
      });
    }

    // 5. 开始事务处理
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 更新商品状态为已保留
      await Product.updateOne(
        { _id: productId, availabilityStatus: "available" },
        {
          availabilityStatus: "reserved",
          reservedFor: buyerId,
          reservedAt: new Date(),
        },
        { session }
      );

      // 创建交易记录
      const transaction = await Transaction.create(
        [
          {
            productId,
            buyerId,
            sellerId: product.sellerId._id,
            transactionType: "product_sale",
            amount: product.price,
            paymentMethod,
            status: paymentMethod === "cash" ? "pending" : "processing",
            metadata: {
              deliveryOption,
              buyerMessage: message,
            },
          },
        ],
        { session }
      );

      // 如果是在线支付，创建支付订单
      let paymentOrderId = null;
      if (paymentMethod !== "cash") {
        paymentOrderId = await paymentService.createPaymentOrder({
          transactionId: transaction[0].id,
          amount: product.price,
          paymentMethod,
          description: `Purchase: ${product.title}`,
          buyerId,
          sellerId: product.sellerId._id,
        });

        await Transaction.updateOne(
          { _id: transaction[0]._id },
          { paymentGatewayId: paymentOrderId },
          { session }
        );
      }

      await session.commitTransaction();

      // 6. 发送通知给卖家
      await notificationService.sendPurchaseNotification({
        recipientId: product.sellerId._id,
        productTitle: product.title,
        buyerName: `${req.user.firstName} ${req.user.lastName}`,
        transactionId: transaction[0].id,
        paymentMethod,
        deliveryOption,
      });

      // 7. 实时通知
      const io = req.app.get("io");
      io.to(`user_${product.sellerId._id}`).emit("product_purchase", {
        productId,
        productTitle: product.title,
        buyer: {
          id: buyerId,
          name: `${req.user.firstName} ${req.user.lastName}`,
          avatar: req.user.avatarUrl,
        },
        transactionId: transaction[0].id,
        amount: product.price,
        paymentMethod,
      });

      res.status(200).json({
        success: true,
        message: "Purchase initiated successfully",
        data: {
          transactionId: transaction[0].id,
          paymentOrderId,
          amount: product.price,
          paymentMethod,
          status: transaction[0].status,
          nextStep:
            paymentMethod === "cash"
              ? "Contact seller to arrange payment and delivery"
              : "Complete payment to confirm purchase",
        },
      });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error) {
    logger.error("Purchase product error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during purchase",
    });
  }
};
```

---

## 🔔 通知系统

### 多渠道通知服务

```javascript
// 通知服务主类
class NotificationService {
  constructor() {
    this.channels = {
      push: new PushNotificationChannel(),
      email: new EmailNotificationChannel(),
      sms: new SMSNotificationChannel(),
      inApp: new InAppNotificationChannel(),
    };
    this.queue = new Bull("notification-queue", {
      redis: { host: process.env.REDIS_HOST, port: process.env.REDIS_PORT },
    });
    this.setupWorkers();
  }

  async sendNotification(notification) {
    const {
      userId,
      type,
      title,
      content,
      data = {},
      priority = "medium",
      deliveryMethods = ["in_app"],
      scheduledFor = null,
    } = notification;

    try {
      // 1. 创建通知记录
      const notificationRecord = await Notification.create({
        userId,
        type,
        title,
        content,
        data,
        priority,
        deliveryMethod: deliveryMethods,
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
        status: "unread",
      });

      // 2. 根据用户偏好过滤发送渠道
      const userPreferences = await this.getUserNotificationPreferences(userId);
      const enabledMethods = deliveryMethods.filter(
        (method) => userPreferences[method] !== false
      );

      // 3. 立即发送或加入队列
      if (scheduledFor) {
        await this.scheduleNotification(notificationRecord, enabledMethods);
      } else {
        await this.deliverNotification(notificationRecord, enabledMethods);
      }

      return notificationRecord;
    } catch (error) {
      logger.error("Send notification error:", error);
      throw error;
    }
  }

  async deliverNotification(notification, methods) {
    const deliveryPromises = methods.map((method) => {
      const channel = this.channels[method];
      if (channel) {
        return channel.send(notification).catch((error) => {
          logger.error(`${method} notification delivery failed:`, error);
          return { method, success: false, error: error.message };
        });
      }
    });

    const results = await Promise.allSettled(deliveryPromises);

    // 更新发送状态
    await Notification.updateOne(
      { _id: notification._id },
      {
        sentAt: new Date(),
        deliveryResults: results,
      }
    );

    return results;
  }

  async getUserNotificationPreferences(userId) {
    // 从用户设置中获取通知偏好
    const user = await User.findById(userId).select("notificationPreferences");
    return (
      user.notificationPreferences || {
        push: true,
        email: true,
        sms: false,
        in_app: true,
      }
    );
  }

  // 预定义的通知模板
  async sendRideRequest(data) {
    return this.sendNotification({
      userId: data.recipientId,
      type: "ride_request",
      title: "新的拼车申请",
      content: `${data.passengerName} 申请加入您的拼车「${data.rideTitle}」`,
      data: {
        requestId: data.requestId,
        passengerName: data.passengerName,
        rideTitle: data.rideTitle,
      },
      priority: "high",
      deliveryMethods: ["push", "in_app"],
      actionUrl: `/rideshare/requests/${data.requestId}`,
    });
  }

  async sendPurchaseNotification(data) {
    return this.sendNotification({
      userId: data.recipientId,
      type: "product_inquiry",
      title: "商品购买通知",
      content: `${data.buyerName} 想要购买您的商品「${data.productTitle}」`,
      data: {
        productTitle: data.productTitle,
        buyerName: data.buyerName,
        transactionId: data.transactionId,
        paymentMethod: data.paymentMethod,
      },
      priority: "high",
      deliveryMethods: ["push", "email", "in_app"],
      actionUrl: `/marketplace/transactions/${data.transactionId}`,
    });
  }
}

// 推送通知渠道
class PushNotificationChannel {
  constructor() {
    this.fcm = admin.messaging();
  }

  async send(notification) {
    try {
      // 获取用户设备tokens
      const user = await User.findById(notification.userId);
      const deviceTokens = user.deviceTokens || [];

      if (deviceTokens.length === 0) {
        return { success: false, reason: "No device tokens" };
      }

      const message = {
        notification: {
          title: notification.title,
          body: notification.content,
        },
        data: {
          type: notification.type,
          ...notification.data,
        },
        tokens: deviceTokens,
      };

      const response = await this.fcm.sendMulticast(message);

      // 清理无效的tokens
      if (response.failureCount > 0) {
        await this.cleanupInvalidTokens(
          notification.userId,
          response.responses,
          deviceTokens
        );
      }

      return {
        success: true,
        successCount: response.successCount,
        failureCount: response.failureCount,
      };
    } catch (error) {
      logger.error("Push notification error:", error);
      throw error;
    }
  }

  async cleanupInvalidTokens(userId, responses, tokens) {
    const invalidTokens = [];
    responses.forEach((response, index) => {
      if (
        !response.success &&
        (response.error.code === "messaging/invalid-registration-token" ||
          response.error.code === "messaging/registration-token-not-registered")
      ) {
        invalidTokens.push(tokens[index]);
      }
    });

    if (invalidTokens.length > 0) {
      await User.updateOne(
        { _id: userId },
        { $pullAll: { deviceTokens: invalidTokens } }
      );
    }
  }
}
```

### 实时通知 API

```javascript
// WebSocket 通知处理
class SocketNotificationHandler {
  constructor(io) {
    this.io = io;
    this.userSockets = new Map(); // userId -> Set of socket IDs
  }

  handleConnection(socket) {
    socket.on("authenticate", async (data) => {
      try {
        const { accessToken } = data;
        const decoded = jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET);
        const userId = decoded.userId;

        // 将socket加入用户房间
        socket.join(`user_${userId}`);
        socket.userId = userId;

        // 记录用户socket连接
        if (!this.userSockets.has(userId)) {
          this.userSockets.set(userId, new Set());
        }
        this.userSockets.get(userId).add(socket.id);

        // 更新用户在线状态
        await User.updateOne(
          { _id: userId },
          {
            lastActive: new Date(),
            isOnline: true,
          }
        );

        // 发送未读通知
        await this.sendUnreadNotifications(userId);

        socket.emit("authenticated", { success: true });
      } catch (error) {
        socket.emit("auth_error", { message: "Invalid token" });
        socket.disconnect();
      }
    });

    socket.on("mark_notification_read", async (data) => {
      try {
        const { notificationId } = data;
        await Notification.updateOne(
          { _id: notificationId, userId: socket.userId },
          {
            status: "read",
            readAt: new Date(),
          }
        );

        socket.emit("notification_marked_read", { notificationId });
      } catch (error) {
        socket.emit("error", {
          message: "Failed to mark notification as read",
        });
      }
    });

    socket.on("disconnect", async () => {
      if (socket.userId) {
        const userSockets = this.userSockets.get(socket.userId);
        if (userSockets) {
          userSockets.delete(socket.id);

          // 如果用户没有其他连接，标记为离线
          if (userSockets.size === 0) {
            this.userSockets.delete(socket.userId);
            await User.updateOne(
              { _id: socket.userId },
              {
                isOnline: false,
                lastActive: new Date(),
              }
            );
          }
        }
      }
    });
  }

  async sendUnreadNotifications(userId) {
    const unreadNotifications = await Notification.find({
      userId,
      status: "unread",
    })
      .sort({ createdAt: -1 })
      .limit(50);

    if (unreadNotifications.length > 0) {
      this.io.to(`user_${userId}`).emit("unread_notifications", {
        notifications: unreadNotifications,
        count: unreadNotifications.length,
      });
    }
  }

  // 向特定用户发送实时通知
  async sendRealTimeNotification(userId, notification) {
    this.io.to(`user_${userId}`).emit("new_notification", {
      id: notification._id,
      type: notification.type,
      title: notification.title,
      content: notification.content,
      data: notification.data,
      priority: notification.priority,
      createdAt: notification.createdAt,
    });
  }
}
```

---

## 📁 文件管理系统

### 文件上传服务

```javascript
// 文件上传和处理服务
class FileUploadService {
  constructor() {
    this.storage = this.initializeStorage();
    this.imageProcessor = sharp;
    this.allowedTypes = {
      image: ["jpg", "jpeg", "png", "gif", "webp"],
      document: ["pdf", "doc", "docx", "txt"],
      video: ["mp4", "avi", "mov", "wmv"],
    };
    this.maxFileSizes = {
      image: 10 * 1024 * 1024, // 10MB
      document: 20 * 1024 * 1024, // 20MB
      video: 100 * 1024 * 1024, // 100MB
    };
  }

  initializeStorage() {
    if (process.env.STORAGE_TYPE === "s3") {
      return new S3Storage({
        bucket: process.env.AWS_S3_BUCKET,
        region: process.env.AWS_REGION,
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      });
    } else {
      return new LocalStorage({
        basePath: process.env.UPLOAD_PATH || "./uploads",
      });
    }
  }

  async uploadFile(file, options = {}) {
    const {
      userId,
      purpose,
      relatedId,
      relatedType,
      generateThumbnail = false,
      allowedTypes,
      maxSize,
    } = options;

    try {
      // 1. 文件验证
      const validation = await this.validateFile(file, {
        allowedTypes,
        maxSize,
      });
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // 2. 生成唯一文件名
      const fileExtension = path.extname(file.originalname).toLowerCase();
      const fileName = `${uuid.v4()}${fileExtension}`;
      const filePath = this.generateFilePath(userId, purpose, fileName);

      // 3. 处理图片（如果需要）
      let processedFile = file;
      let thumbnailPath = null;

      if (this.isImage(fileExtension)) {
        processedFile = await this.processImage(file);

        if (generateThumbnail) {
          thumbnailPath = await this.generateThumbnail(processedFile, filePath);
        }
      }

      // 4. 上传文件
      const uploadResult = await this.storage.upload(processedFile, filePath);

      // 5. 保存文件记录
      const fileRecord = await FileUpload.create({
        userId,
        filename: fileName,
        originalFilename: file.originalname,
        fileType: file.mimetype,
        fileSize: processedFile.size,
        storagePath: filePath,
        publicUrl: uploadResult.url,
        thumbnailUrl: thumbnailPath,
        purpose,
        relatedId,
        relatedType,
        processingStatus: "completed",
        metadata: {
          dimensions: processedFile.dimensions,
          uploadMethod: "direct",
        },
      });

      return {
        success: true,
        file: {
          id: fileRecord.id,
          filename: fileRecord.filename,
          url: fileRecord.publicUrl,
          thumbnailUrl: fileRecord.thumbnailUrl,
          size: fileRecord.fileSize,
          type: fileRecord.fileType,
        },
      };
    } catch (error) {
      logger.error("File upload error:", error);
      throw error;
    }
  }

  async validateFile(file, options = {}) {
    const { allowedTypes, maxSize } = options;

    // 检查文件大小
    const fileSizeLimit = maxSize || this.maxFileSizes.image;
    if (file.size > fileSizeLimit) {
      return {
        valid: false,
        error: `File size exceeds limit of ${fileSizeLimit / 1024 / 1024}MB`,
      };
    }

    // 检查文件类型
    const fileExtension = path
      .extname(file.originalname)
      .toLowerCase()
      .slice(1);
    const allowedExtensions = allowedTypes || this.allowedTypes.image;

    if (!allowedExtensions.includes(fileExtension)) {
      return {
        valid: false,
        error: `File type not allowed. Allowed types: ${allowedExtensions.join(
          ", "
        )}`,
      };
    }

    // 检查文件内容（防止恶意文件）
    const contentValidation = await this.validateFileContent(file);
    if (!contentValidation.valid) {
      return contentValidation;
    }

    return { valid: true };
  }

  async processImage(file) {
    try {
      const image = this.imageProcessor(file.buffer);
      const metadata = await image.metadata();

      // 图片压缩和优化
      let processed = image;

      // 限制最大尺寸
      if (metadata.width > 2048 || metadata.height > 2048) {
        processed = processed.resize(2048, 2048, {
          fit: "inside",
          withoutEnlargement: true,
        });
      }

      // 压缩质量
      if (file.mimetype === "image/jpeg") {
        processed = processed.jpeg({ quality: 85, progressive: true });
      } else if (file.mimetype === "image/png") {
        processed = processed.png({ compressionLevel: 9 });
      } else if (file.mimetype === "image/webp") {
        processed = processed.webp({ quality: 85 });
      }

      const buffer = await processed.toBuffer();
      const processedMetadata = await this.imageProcessor(buffer).metadata();

      return {
        ...file,
        buffer,
        size: buffer.length,
        dimensions: {
          width: processedMetadata.width,
          height: processedMetadata.height,
        },
      };
    } catch (error) {
      logger.error("Image processing error:", error);
      throw new Error("Failed to process image");
    }
  }

  async generateThumbnail(file, originalPath) {
    try {
      const thumbnailBuffer = await this.imageProcessor(file.buffer)
        .resize(300, 300, {
          fit: "cover",
          position: "center",
        })
        .jpeg({ quality: 80 })
        .toBuffer();

      const thumbnailPath = originalPath.replace(/(\.[^.]+)$/, "_thumb$1");
      const uploadResult = await this.storage.upload(
        {
          buffer: thumbnailBuffer,
          mimetype: "image/jpeg",
        },
        thumbnailPath
      );

      return uploadResult.url;
    } catch (error) {
      logger.error("Thumbnail generation error:", error);
      return null;
    }
  }

  generateFilePath(userId, purpose, filename) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");

    return `${purpose}/${userId}/${year}/${month}/${filename}`;
  }

  isImage(extension) {
    return this.allowedTypes.image.includes(extension.slice(1));
  }

  async validateFileContent(file) {
    // 简单的文件头验证
    const fileSignatures = {
      jpg: [0xff, 0xd8, 0xff],
      jpeg: [0xff, 0xd8, 0xff],
      png: [0x89, 0x50, 0x4e, 0x47],
      gif: [0x47, 0x49, 0x46, 0x38],
      pdf: [0x25, 0x50, 0x44, 0x46],
    };

    const extension = path.extname(file.originalname).toLowerCase().slice(1);
    const expectedSignature = fileSignatures[extension];

    if (expectedSignature) {
      const fileHeader = Array.from(
        file.buffer.slice(0, expectedSignature.length)
      );
      const signatureMatch = expectedSignature.every(
        (byte, index) => byte === fileHeader[index]
      );

      if (!signatureMatch) {
        return {
          valid: false,
          error: "File content does not match file extension",
        };
      }
    }

    return { valid: true };
  }
}
```

### 文件管理 API

```javascript
// POST /api/upload/image
const uploadImage = async (req, res) => {
  try {
    const { purpose, relatedId, relatedType } = req.body;
    const userId = req.user.userId;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    // 验证用途
    const validPurposes = ["avatar", "product_image", "chat_media", "document"];
    if (!validPurposes.includes(purpose)) {
      return res.status(400).json({
        success: false,
        message: "Invalid file purpose",
      });
    }

    // 权限检查
    if (relatedId && relatedType) {
      const hasPermission = await checkFileUploadPermission(
        userId,
        relatedType,
        relatedId
      );
      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: "Permission denied",
        });
      }
    }

    const uploadService = new FileUploadService();
    const result = await uploadService.uploadFile(req.file, {
      userId,
      purpose,
      relatedId,
      relatedType,
      generateThumbnail: purpose === "product_image" || purpose === "avatar",
      allowedTypes: ["jpg", "jpeg", "png", "gif", "webp"],
      maxSize: 10 * 1024 * 1024, // 10MB
    });

    // 如果是头像更新，同步更新用户记录
    if (purpose === "avatar") {
      await User.updateOne({ _id: userId }, { avatarUrl: result.file.url });
    }

    res.status(200).json({
      success: true,
      message: "File uploaded successfully",
      data: result.file,
    });
  } catch (error) {
    logger.error("Upload image error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "File upload failed",
    });
  }
};

// GET /api/upload/files/:fileId
const getFile = async (req, res) => {
  try {
    const { fileId } = req.params;
    const userId = req.user.userId;

    const file = await FileUpload.findById(fileId);
    if (!file) {
      return res.status(404).json({
        success: false,
        message: "File not found",
      });
    }

    // 权限检查
    const hasAccess = await checkFileAccess(userId, file);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // 记录文件访问
    await FileUpload.updateOne({ _id: fileId }, { $inc: { accessCount: 1 } });

    res.status(200).json({
      success: true,
      data: {
        id: file.id,
        filename: file.filename,
        originalFilename: file.originalFilename,
        url: file.publicUrl,
        thumbnailUrl: file.thumbnailUrl,
        fileSize: file.fileSize,
        fileType: file.fileType,
        createdAt: file.createdAt,
      },
    });
  } catch (error) {
    logger.error("Get file error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve file",
    });
  }
};

// DELETE /api/upload/files/:fileId
const deleteFile = async (req, res) => {
  try {
    const { fileId } = req.params;
    const userId = req.user.userId;

    const file = await FileUpload.findById(fileId);
    if (!file) {
      return res.status(404).json({
        success: false,
        message: "File not found",
      });
    }

    // 权限检查 - 只有文件所有者或管理员可以删除
    if (file.userId.toString() !== userId && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Permission denied",
      });
    }

    // 从存储服务删除文件
    const storage = new FileUploadService().storage;
    await storage.delete(file.storagePath);

    // 如果有缩略图也删除
    if (file.thumbnailUrl) {
      const thumbnailPath = file.storagePath.replace(/(\.[^.]+)$/, "_thumb$1");
      await storage.delete(thumbnailPath);
    }

    // 从数据库删除记录
    await FileUpload.deleteOne({ _id: fileId });

    res.status(200).json({
      success: true,
      message: "File deleted successfully",
    });
  } catch (error) {
    logger.error("Delete file error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete file",
    });
  }
};
```

---

## ⚡ 性能优化

### 数据库优化策略

```javascript
// 数据库连接池配置
const dbConfig = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  pool: {
    min: 5,
    max: 20,
    acquire: 60000,
    idle: 10000,
  },
  dialectOptions: {
    options: {
      requestTimeout: 30000,
      enableArithAbort: true,
    },
  },
};

// 查询优化示例
class OptimizedQueries {
  // 拼车搜索优化 - 使用空间索引
  static async searchRidesOptimized(criteria) {
    const {
      departureLocation,
      destinationLocation,
      departureTime,
      radius = 5000,
    } = criteria;

    // 使用 PostGIS 的空间查询
    const query = `
      WITH nearby_departures AS (
        SELECT r.*, 
               ST_Distance(
                 ST_Point($1, $2)::geography,
                 ST_Point((departure_location->>'longitude')::float, 
                         (departure_location->>'latitude')::float)::geography
               ) as departure_distance
        FROM rides r
        WHERE ST_DWithin(
          ST_Point($1, $2)::geography,
          ST_Point((departure_location->>'longitude')::float, 
                  (departure_location->>'latitude')::float)::geography,
          $5
        )
        AND r.status = 'confirmed'
        AND r.seats_available > r.seats_taken
        AND r.departure_time BETWEEN $6 AND $7
      ),
      nearby_destinations AS (
        SELECT nd.*,
               ST_Distance(
                 ST_Point($3, $4)::geography,
                 ST_Point((destination_location->>'longitude')::float, 
                         (destination_location->>'latitude')::float)::geography
               ) as destination_distance
        FROM nearby_departures nd
        WHERE ST_DWithin(
          ST_Point($3, $4)::geography,
          ST_Point((destination_location->>'longitude')::float, 
                  (destination_location->>'latitude')::float)::geography,
          $5
        )
      )
      SELECT * FROM nearby_destinations
      ORDER BY departure_distance + destination_distance
      LIMIT 50;
    `;

    const timeStart = new Date(departureTime - 3600000); // 1小时前
    const timeEnd = new Date(departureTime + 3600000); // 1小时后

    return await db.query(query, [
      departureLocation.longitude,
      departureLocation.latitude,
      destinationLocation.longitude,
      destinationLocation.latitude,
      radius,
      timeStart,
      timeEnd,
    ]);
  }

  // 商品搜索优化 - 全文搜索 + 地理位置
  static async searchProductsOptimized(criteria) {
    const {
      keyword,
      category,
      location,
      radius = 10000,
      minPrice,
      maxPrice,
      limit = 20,
      offset = 0,
    } = criteria;

    let query = `
      SELECT p.*, u.first_name, u.last_name, u.avatar_url,
             ts_rank(search_vector, plainto_tsquery($1)) as relevance_score
    `;

    if (location) {
      query += `,
             ST_Distance(
               ST_Point($${paramCount}, $${paramCount + 1})::geography,
               ST_Point((location->>'longitude')::float, 
                       (location->>'latitude')::float)::geography
             ) as distance`;
    }

    query += `
      FROM products p
      JOIN users u ON p.seller_id = u.id
      WHERE p.availability_status = 'available'
    `;

    const queryParams = [];
    let paramCount = 1;

    // 全文搜索
    if (keyword) {
      queryParams.push(keyword);
    } else {
      queryParams.push("");
    }

    // 地理位置筛选
    if (location) {
      query += ` AND ST_DWithin(
        ST_Point($${++paramCount}, $${++paramCount})::geography,
        ST_Point((location->>'longitude')::float, 
                (location->>'latitude')::float)::geography,
        $${++paramCount}
      )`;
      queryParams.push(location.longitude, location.latitude, radius);
    }

    // 分类筛选
    if (category) {
      query += ` AND p.category = $${++paramCount}`;
      queryParams.push(category);
    }

    // 价格筛选
    if (minPrice) {
      query += ` AND p.price >= $${++paramCount}`;
      queryParams.push(minPrice);
    }
    if (maxPrice) {
      query += ` AND p.price <= $${++paramCount}`;
      queryParams.push(maxPrice);
    }

    // 排序
    if (keyword) {
      query += " ORDER BY relevance_score DESC";
    } else if (location) {
      query += " ORDER BY distance ASC";
    } else {
      query += " ORDER BY p.created_at DESC";
    }

    // 分页
    query += ` LIMIT $${++paramCount} OFFSET $${++paramCount}`;
    queryParams.push(limit, offset);

    return await db.query(query, queryParams);
  }
}
```

### 缓存策略

```javascript
// Redis缓存管理
class CacheManager {
  constructor() {
    this.redis = new Redis(process.env.REDIS_URL);
    this.defaultTTL = 3600; // 1小时
  }

  // 拼车搜索结果缓存
  async getCachedRideSearch(searchKey) {
    const cacheKey = `ride_search:${searchKey}`;
    const cached = await this.redis.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }
    return null;
  }

  async setCachedRideSearch(searchKey, results, ttl = 300) {
    // 5分钟
    const cacheKey = `ride_search:${searchKey}`;
    await this.redis.setex(cacheKey, ttl, JSON.stringify(results));
  }

  // 商品详情缓存
  async getCachedProduct(productId) {
    const cacheKey = `product:${productId}`;
    const cached = await this.redis.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }
    return null;
  }

  async setCachedProduct(productId, product, ttl = 1800) {
    // 30分钟
    const cacheKey = `product:${productId}`;
    await this.redis.setex(cacheKey, ttl, JSON.stringify(product));
  }

  // 清除相关缓存
  async invalidateProductCache(productId) {
    const patterns = [
      `product:${productId}`,
      `product_search:*`,
      `user_products:*`,
    ];

    for (const pattern of patterns) {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    }
  }

  // 用户会话缓存
  async getUserSession(userId) {
    const cacheKey = `user_session:${userId}`;
    const session = await this.redis.get(cacheKey);
    return session ? JSON.parse(session) : null;
  }

  async setUserSession(userId, sessionData, ttl = 7200) {
    // 2小时
    const cacheKey = `user_session:${userId}`;
    await this.redis.setex(cacheKey, ttl, JSON.stringify(sessionData));
  }

  // 热门商品缓存
  async getHotProducts() {
    const cacheKey = "hot_products";
    const cached = await this.redis.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    // 如果缓存不存在，从数据库查询
    const hotProducts = await Product.find({
      availabilityStatus: "available",
    })
      .sort({ viewCount: -1, favoriteCount: -1 })
      .limit(20)
      .populate("sellerId", "firstName lastName avatarUrl")
      .lean();

    await this.redis.setex(cacheKey, 1800, JSON.stringify(hotProducts)); // 30分钟
    return hotProducts;
  }
}
```

---

## 🧪 测试策略

### 单元测试示例

```javascript
// tests/unit/rideshare.service.test.js
describe("RideMatchingService", () => {
  let matchingService;
  let mockMapsService;

  beforeEach(() => {
    mockMapsService = {
      calculateRoute: jest.fn(),
    };
    matchingService = new RideMatchingService();
    matchingService.mapsService = mockMapsService;
  });

  describe("findMatchingRides", () => {
    it("should find matching rides within radius", async () => {
      const searchCriteria = {
        departureLocation: { latitude: 39.9042, longitude: 116.4074 },
        destinationLocation: { latitude: 39.9388, longitude: 116.3974 },
        departureTime: new Date("2024-07-01T08:00:00Z"),
        seatsNeeded: 1,
      };

      const mockRides = [
        {
          id: 1,
          departure_location: { latitude: 39.905, longitude: 116.408 },
          destination_location: { latitude: 39.938, longitude: 116.398 },
          departure_time: new Date("2024-07-01T08:15:00Z"),
          seats_available: 3,
          seats_taken: 1,
          price_per_seat: 15,
        },
      ];

      // Mock database query
      jest
        .spyOn(matchingService, "findRidesInRadius")
        .mockResolvedValue(mockRides);

      mockMapsService.calculateRoute.mockResolvedValue({
        distance: 5000,
        duration: 1800,
        waypoints: [],
      });

      const results = await matchingService.findMatchingRides(searchCriteria);

      expect(results).toHaveLength(1);
      expect(results[0].matchingScore).toBeGreaterThan(0);
    });

    it("should filter rides by time tolerance", async () => {
      const searchCriteria = {
        departureLocation: { latitude: 39.9042, longitude: 116.4074 },
        destinationLocation: { latitude: 39.9388, longitude: 116.3974 },
        departureTime: new Date("2024-07-01T08:00:00Z"),
        seatsNeeded: 1,
      };

      const mockRides = [
        {
          id: 1,
          departure_time: new Date("2024-07-01T08:15:00Z"), // 15分钟差距，应该匹配
          seats_available: 3,
          seats_taken: 1,
        },
        {
          id: 2,
          departure_time: new Date("2024-07-01T10:30:00Z"), // 2.5小时差距，不应该匹配
          seats_available: 2,
          seats_taken: 0,
        },
      ];

      jest
        .spyOn(matchingService, "findRidesInRadius")
        .mockResolvedValue(mockRides);

      const timeFiltered = matchingService.filterByTime(
        mockRides,
        searchCriteria.departureTime
      );

      expect(timeFiltered).toHaveLength(1);
      expect(timeFiltered[0].id).toBe(1);
    });
  });
});

// tests/unit/notification.service.test.js
describe("NotificationService", () => {
  let notificationService;
  let mockChannels;

  beforeEach(() => {
    mockChannels = {
      push: { send: jest.fn() },
      email: { send: jest.fn() },
      inApp: { send: jest.fn() },
    };

    notificationService = new NotificationService();
    notificationService.channels = mockChannels;
  });

  describe("sendNotification", () => {
    it("should send notification through specified channels", async () => {
      const notification = {
        userId: "user123",
        type: "ride_request",
        title: "New Ride Request",
        content: "Someone wants to join your ride",
        deliveryMethods: ["push", "inApp"],
      };

      mockChannels.push.send.mockResolvedValue({ success: true });
      mockChannels.inApp.send.mockResolvedValue({ success: true });

      // Mock user preferences
      jest
        .spyOn(notificationService, "getUserNotificationPreferences")
        .mockResolvedValue({
          push: true,
          email: false,
          inApp: true,
        });

      await notificationService.sendNotification(notification);

      expect(mockChannels.push.send).toHaveBeenCalled();
      expect(mockChannels.inApp.send).toHaveBeenCalled();
      expect(mockChannels.email.send).not.toHaveBeenCalled();
    });
  });
});
```

### 集成测试

```javascript
// tests/integration/marketplace.test.js
describe("Marketplace API Integration", () => {
  let server;
  let authToken;
  let testUser;
  let testProduct;

  beforeAll(async () => {
    server = require("../../src/app");
    testUser = await createTestUser();
    authToken = await loginTestUser(testUser.email, "password");
  });

  afterAll(async () => {
    await cleanupTestData();
    server.close();
  });

  describe("POST /api/marketplace/products", () => {
    it("should create a new product listing", async () => {
      const productData = {
        title: "Test Product",
        description: "This is a test product for sale",
        category: "electronics",
        condition: "like_new",
        price: 299.99,
        brand: "Test Brand",
        negotiable: true,
      };

      const response = await request(server)
        .post("/api/marketplace/products")
        .set("Authorization", `Bearer ${authToken}`)
        .send(productData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.product.title).toBe(productData.title);
      testProduct = response.body.data.product;
    });
  });

  describe("POST /api/marketplace/products/:id/purchase", () => {
    it("should initiate product purchase", async () => {
      const buyerUser = await createTestUser({ email: "buyer@test.com" });
      const buyerToken = await loginTestUser("buyer@test.com", "password");

      const purchaseData = {
        paymentMethod: "alipay",
        deliveryOption: "pickup",
        message: "I would like to buy this item",
      };

      const response = await request(server)
        .post(`/api/marketplace/products/${testProduct.id}/purchase`)
        .set("Authorization", `Bearer ${buyerToken}`)
        .send(purchaseData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.transactionId).toBeDefined();
      expect(response.body.data.status).toBe("processing");
    });

    it("should prevent self-purchase", async () => {
      const purchaseData = {
        paymentMethod: "cash",
        deliveryOption: "pickup",
      };

      const response = await request(server)
        .post(`/api/marketplace/products/${testProduct.id}/purchase`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(purchaseData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("cannot purchase your own");
    });
  });
});
```

---

## 🚀 部署与运维

### Docker 配置

```dockerfile
# Multi-stage build for production
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

FROM node:18-alpine AS production

# Install system dependencies
RUN apk add --no-cache \
    imagemagick \
    graphicsmagick \
    && rm -rf /var/cache/apk/*

WORKDIR /app

# Create app user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodeuser -u 1001

# Copy node_modules from builder stage
COPY --from=builder --chown=nodeuser:nodejs /app/node_modules ./node_modules

# Copy application code
COPY --chown=nodeuser:nodejs . .

# Create uploads directory
RUN mkdir -p uploads && chown nodeuser:nodejs uploads

USER nodeuser

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node healthcheck.js

CMD ["npm", "start"]
```

### Kubernetes 配置

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: campusride-backend-module2
  labels:
    app: campusride-backend-module2
spec:
  replicas: 3
  selector:
    matchLabels:
      app: campusride-backend-module2
  template:
    metadata:
      labels:
        app: campusride-backend-module2
    spec:
      containers:
        - name: app
          image: campusride/backend-module2:latest
          ports:
            - containerPort: 3000
          env:
            - name: NODE_ENV
              value: "production"
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: database-secret
                  key: url
            - name: REDIS_URL
              valueFrom:
                secretKeyRef:
                  name: redis-secret
                  key: url
          resources:
            requests:
              memory: "256Mi"
              cpu: "250m"
            limits:
              memory: "512Mi"
              cpu: "500m"
          livenessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /ready
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 5
          volumeMounts:
            - name: upload-storage
              mountPath: /app/uploads
      volumes:
        - name: upload-storage
          persistentVolumeClaim:
            claimName: upload-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: campusride-backend-module2-service
spec:
  selector:
    app: campusride-backend-module2
  ports:
    - protocol: TCP
      port: 80
      targetPort: 3000
  type: ClusterIP
```

### 监控配置

```javascript
// monitoring/metrics.js
const prometheus = require("prom-client");

// 创建指标
const httpRequestDurations = new prometheus.Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
});

const activeRides = new prometheus.Gauge({
  name: "active_rides_total",
  help: "Total number of active rides",
});

const productSearchRequests = new prometheus.Counter({
  name: "product_search_requests_total",
  help: "Total number of product search requests",
  labelNames: ["category"],
});

const notificationsSent = new prometheus.Counter({
  name: "notifications_sent_total",
  help: "Total number of notifications sent",
  labelNames: ["type", "channel", "status"],
});

// 中间件
const metricsMiddleware = (req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = (Date.now() - start) / 1000;
    httpRequestDurations
      .labels(req.method, req.route?.path || req.url, res.statusCode)
      .observe(duration);
  });

  next();
};

// 业务指标收集
const updateActiveRidesCount = async () => {
  const count = await Ride.countDocuments({
    status: { $in: ["confirmed", "ongoing"] },
  });
  activeRides.set(count);
};

// 定期更新指标
setInterval(updateActiveRidesCount, 30000); // 每30秒更新一次

module.exports = {
  httpRequestDurations,
  activeRides,
  productSearchRequests,
  notificationsSent,
  metricsMiddleware,
};
```

---

## 🔒 安全考虑

### 安全中间件

```javascript
// security/middleware.js
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const validator = require("validator");

// 速率限制
const createRateLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: { success: false, message },
    standardHeaders: true,
    legacyHeaders: false,
    store: new RedisStore({
      client: redisClient,
      prefix: "rl:",
    }),
  });
};

// API速率限制
const apiLimiter = createRateLimiter(
  15 * 60 * 1000, // 15分钟
  100, // 100个请求
  "Too many requests from this IP, please try again later"
);

// 搜索API限制
const searchLimiter = createRateLimiter(
  60 * 1000, // 1分钟
  20, // 20个搜索请求
  "Search rate limit exceeded"
);

// 文件上传限制
const uploadLimiter = createRateLimiter(
  60 * 60 * 1000, // 1小时
  50, // 50个文件
  "Upload rate limit exceeded"
);

// 输入清理中间件
const sanitizeInput = (req, res, next) => {
  const sanitizeValue = (value) => {
    if (typeof value === "string") {
      return validator.escape(value.trim());
    }
    if (Array.isArray(value)) {
      return value.map(sanitizeValue);
    }
    if (value && typeof value === "object") {
      const sanitized = {};
      for (const [key, val] of Object.entries(value)) {
        sanitized[key] = sanitizeValue(val);
      }
      return sanitized;
    }
    return value;
  };

  // 清理请求体
  if (req.body) {
    req.body = sanitizeValue(req.body);
  }

  // 清理查询参数
  if (req.query) {
    req.query = sanitizeValue(req.query);
  }

  next();
};

// SQL注入防护
const preventSQLInjection = (req, res, next) => {
  const checkForSQLInjection = (str) => {
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/gi,
      /(;|\||&|'|"|<|>)/g,
      /(--)|(\/\*)|(\*\/)/g,
    ];

    return sqlPatterns.some((pattern) => pattern.test(str));
  };

  const checkObject = (obj) => {
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === "string" && checkForSQLInjection(value)) {
        return true;
      }
      if (typeof value === "object" && value !== null) {
        if (checkObject(value)) return true;
      }
    }
    return false;
  };

  if (req.body && checkObject(req.body)) {
    return res.status(400).json({
      success: false,
      message: "Invalid input detected",
    });
  }

  if (req.query && checkObject(req.query)) {
    return res.status(400).json({
      success: false,
      message: "Invalid query parameters",
    });
  }

  next();
};

// 安全头部配置
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "wss:", "https:"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
});

module.exports = {
  apiLimiter,
  searchLimiter,
  uploadLimiter,
  sanitizeInput,
  preventSQLInjection,
  securityHeaders,
};
```

---

## 📋 开发检查清单

### 开发前准备

- [ ] 环境变量配置完成
- [ ] 数据库连接测试通过
- [ ] Redis 连接测试通过
- [ ] 第三方服务 API 密钥配置
- [ ] WebSocket 服务器配置
- [ ] 文件存储服务配置

### 功能开发检查

- [ ] 所有 API 接口实现认证鉴权
- [ ] 输入验证和清理中间件
- [ ] 错误处理和日志记录
- [ ] 实时通知功能测试
- [ ] 文件上传安全检查
- [ ] 地理位置服务集成

### 性能优化检查

- [ ] 数据库查询优化
- [ ] 缓存策略实现
- [ ] 接口响应时间监控
- [ ] 并发处理能力测试
- [ ] 内存使用监控

### 安全检查

- [ ] SQL 注入防护
- [ ] XSS 攻击防护
- [ ] 文件上传安全验证
- [ ] 敏感信息加密存储
- [ ] API 速率限制

### 测试覆盖

- [ ] 单元测试覆盖率 > 80%
- [ ] 集成测试完成
- [ ] WebSocket 连接测试
- [ ] 文件上传功能测试
- [ ] 支付流程测试

---

**文档版本**: v1.0  
**最后更新**: 2024-06-30  
**负责人**: Cursor AI  
**审核人**: 待定

---

_本文档包含模块 2 的完整开发规范，请严格按照文档进行开发，确保与模块 1 的良好集成。_
