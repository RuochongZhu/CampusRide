# 模块间测试与集成规范文档

## 🎯 文档概述

**目标**: 确保Claude Code和Cursor AI开发的后端模块能够无缝集成并协同工作  
**适用范围**: 模块1（用户认证、活动管理、排行榜）+ 模块2（拼车、市场、通知、文件管理）  
**测试策略**: 接口契约测试、集成测试、端到端测试、性能测试  

## 📋 目录

1. [集成架构概览](#集成架构概览)
2. [API接口契约](#api接口契约)
3. [数据库集成测试](#数据库集成测试)
4. [模块间通信测试](#模块间通信测试)
5. [共享服务测试](#共享服务测试)
6. [端到端测试流程](#端到端测试流程)
7. [性能集成测试](#性能集成测试)
8. [错误处理测试](#错误处理测试)
9. [安全集成测试](#安全集成测试)
10. [测试自动化](#测试自动化)

---

## 🏗️ 集成架构概览

### 模块依赖关系
```mermaid
graph TD
    A[前端应用] --> B[API网关]
    B --> C[模块1: Claude Code]
    B --> D[模块2: Cursor AI]
    
    C --> E[用户认证服务]
    C --> F[活动管理服务]
    C --> G[排行榜服务]
    
    D --> H[拼车服务]
    D --> I[市场服务]
    D --> J[通知服务]
    D --> K[文件管理服务]
    
    C --> L[共享数据库]
    D --> L
    C --> M[Redis缓存]
    D --> M
    
    D --> N[WebSocket服务]
    D --> O[消息队列]
    
    H --> E[需要用户信息]
    I --> E[需要用户信息]
    F --> J[发送活动通知]
    G --> J[发送排行榜通知]
```

### 集成点识别
```yaml
关键集成点:
  用户数据共享:
    - 用户认证状态
    - 用户基本信息
    - 用户权限验证
    
  跨模块通信:
    - 活动参与 → 积分更新 → 排行榜更新
    - 拼车完成 → 积分奖励 → 用户积分更新
    - 商品交易 → 用户信誉更新
    - 各种操作 → 通知发送
    
  共享资源:
    - 数据库连接池
    - Redis缓存
    - 文件存储
    - 日志系统
    
  外部服务:
    - 地图服务API
    - 支付服务API
    - 邮件服务API
    - 推送服务API
```

---

## 📝 API接口契约

### 契约测试框架
```javascript
// contract-tests/user-auth.contract.js
const pact = require('@pact-foundation/pact');
const { Matchers } = pact;

describe('User Authentication Contract', () => {
  const provider = new pact.Pact({
    consumer: 'rideshare-service',
    provider: 'auth-service',
    port: 1234,
    log: path.resolve(process.cwd(), 'logs', 'pact.log'),
    dir: path.resolve(process.cwd(), 'pacts'),
    logLevel: 'INFO'
  });

  beforeAll(() => provider.setup());
  afterAll(() => provider.finalize());
  afterEach(() => provider.verify());

  describe('GET /api/auth/user/:id', () => {
    beforeEach(() => {
      return provider
        .given('user exists')
        .uponReceiving('a request for user details')
        .withRequest({
          method: 'GET',
          path: '/api/auth/user/123',
          headers: {
            'Authorization': Matchers.like('Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'),
            'Accept': 'application/json'
          }
        })
        .willRespondWith({
          status: 200,
          headers: {
            'Content-Type': 'application/json'
          },
          body: {
            success: true,
            data: {
              user: {
                id: Matchers.like(123),
                email: Matchers.like('user@university.edu'),
                firstName: Matchers.like('John'),
                lastName: Matchers.like('Doe'),
                university: Matchers.like('Test University'),
                points: Matchers.like(150),
                isActive: true,
                verificationStatus: 'verified'
              }
            }
          }
        });
    });

    it('should return user details', async () => {
      const response = await request('http://localhost:1234')
        .get('/api/auth/user/123')
        .set('Authorization', 'Bearer valid-token')
        .set('Accept', 'application/json');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.id).toBe(123);
    });
  });
});
```

### 接口规范验证
```javascript
// tests/integration/api-contracts.test.js
describe('API Contract Validation', () => {
  
  describe('User Service Contracts', () => {
    test('GET /api/users/:id should match expected schema', async () => {
      const response = await request(app)
        .get('/api/users/1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const userSchema = {
        type: 'object',
        required: ['success', 'data'],
        properties: {
          success: { type: 'boolean' },
          data: {
            type: 'object',
            required: ['user'],
            properties: {
              user: {
                type: 'object',
                required: ['id', 'email', 'firstName', 'lastName', 'points'],
                properties: {
                  id: { type: 'integer' },
                  email: { type: 'string', format: 'email' },
                  firstName: { type: 'string' },
                  lastName: { type: 'string' },
                  points: { type: 'integer', minimum: 0 }
                }
              }
            }
          }
        }
      };

      expect(response.body).toMatchSchema(userSchema);
    });

    test('POST /api/auth/login should return consistent token format', async () => {
      const loginData = {
        email: 'test@university.edu',
        password: 'SecurePass123!'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.tokens.accessToken).toMatch(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/);
    });
  });

  describe('Cross-Module Data Consistency', () => {
    test('User points should be consistent across modules', async () => {
      const userId = 1;

      // 从认证模块获取用户信息
      const authResponse = await request(app)
        .get(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // 从排行榜模块获取用户积分
      const leaderboardResponse = await request(app)
        .get(`/api/leaderboard/user/${userId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(authResponse.body.data.user.points)
        .toBe(leaderboardResponse.body.data.userRanking.points);
    });
  });
});
```

---

## 🗄️ 数据库集成测试

### 数据一致性测试
```javascript
// tests/integration/database-consistency.test.js
describe('Database Integration and Consistency', () => {
  let testUser, testActivity, testRide;

  beforeEach(async () => {
    // 创建测试数据
    testUser = await createTestUser();
    testActivity = await createTestActivity(testUser.id);
    testRide = await createTestRide(testUser.id);
  });

  afterEach(async () => {
    await cleanupTestData();
  });

  describe('Cross-Module Transactions', () => {
    test('Activity participation should update points and leaderboard', async () => {
      const participationData = {
        activityId: testActivity.id,
        userId: testUser.id
      };

      // 参与活动
      await request(app)
        .post(`/api/activities/${testActivity.id}/register`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // 签到活动
      await request(app)
        .post(`/api/activities/${testActivity.id}/checkin`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ checkinCode: testActivity.checkinCode })
        .expect(200);

      // 验证用户积分更新
      const updatedUser = await User.findById(testUser.id);
      expect(updatedUser.points).toBe(testUser.points + testActivity.rewardPoints);

      // 验证排行榜更新
      const leaderboardEntry = await LeaderboardEntry.findOne({
        userId: testUser.id,
        category: 'overall',
        periodType: 'weekly'
      });
      expect(leaderboardEntry.points).toBeGreaterThanOrEqual(testActivity.rewardPoints);
    });

    test('Ride completion should award points correctly', async () => {
      const passenger = await createTestUser({ email: 'passenger@test.com' });
      
      // 乘客加入拼车
      await request(app)
        .post(`/api/rideshare/rides/${testRide.id}/join`)
        .set('Authorization', `Bearer ${passengerToken}`)
        .send({ seatsRequested: 1 })
        .expect(201);

      // 司机接受请求
      const rideRequest = await RideRequest.findOne({
        rideId: testRide.id,
        passengerId: passenger.id
      });

      await request(app)
        .put(`/api/rideshare/requests/${rideRequest.id}/accept`)
        .set('Authorization', `Bearer ${driverToken}`)
        .expect(200);

      // 完成拼车
      await request(app)
        .put(`/api/rideshare/rides/${testRide.id}/complete`)
        .set('Authorization', `Bearer ${driverToken}`)
        .expect(200);

      // 验证积分奖励
      const updatedDriver = await User.findById(testUser.id);
      const updatedPassenger = await User.findById(passenger.id);

      expect(updatedDriver.points).toBeGreaterThan(testUser.points);
      expect(updatedPassenger.points).toBeGreaterThan(passenger.points);
    });
  });

  describe('Data Integrity Constraints', () => {
    test('User deletion should handle foreign key constraints', async () => {
      // 创建相关数据
      await Activity.create({
        title: 'Test Activity',
        organizerId: testUser.id,
        // ... other fields
      });

      await Product.create({
        title: 'Test Product',
        sellerId: testUser.id,
        // ... other fields
      });

      // 尝试删除用户（应该失败或正确处理级联删除）
      const deleteResult = await User.deleteOne({ _id: testUser.id });
      
      // 验证相关数据的处理
      const orphanedActivities = await Activity.find({ organizerId: testUser.id });
      const orphanedProducts = await Product.find({ sellerId: testUser.id });

      // 根据业务规则验证数据完整性
      expect(orphanedActivities.length).toBe(0); // 应该级联删除或转移
      expect(orphanedProducts.length).toBe(0);   // 应该级联删除或转移
    });
  });
});
```

### 并发访问测试
```javascript
// tests/integration/concurrency.test.js
describe('Concurrent Access Testing', () => {
  test('Concurrent ride joining should handle seat limits correctly', async () => {
    const ride = await createTestRide({ seatsAvailable: 2 });
    const passengers = await Promise.all([
      createTestUser({ email: 'p1@test.com' }),
      createTestUser({ email: 'p2@test.com' }),
      createTestUser({ email: 'p3@test.com' })
    ]);

    const tokens = await Promise.all(
      passengers.map(p => loginTestUser(p.email, 'password'))
    );

    // 三个用户同时尝试加入只有2个座位的拼车
    const joinPromises = tokens.map(token =>
      request(app)
        .post(`/api/rideshare/rides/${ride.id}/join`)
        .set('Authorization', `Bearer ${token}`)
        .send({ seatsRequested: 1 })
    );

    const results = await Promise.allSettled(joinPromises);

    // 应该只有2个成功，1个失败
    const successes = results.filter(r => r.status === 'fulfilled' && r.value.status === 201);
    const failures = results.filter(r => r.status === 'fulfilled' && r.value.status >= 400);

    expect(successes.length).toBe(2);
    expect(failures.length).toBe(1);

    // 验证最终座位数
    const updatedRide = await Ride.findById(ride.id);
    expect(updatedRide.seatsTaken).toBe(2);
  });

  test('Concurrent product purchases should prevent overselling', async () => {
    const product = await createTestProduct();
    const buyers = await Promise.all([
      createTestUser({ email: 'b1@test.com' }),
      createTestUser({ email: 'b2@test.com' })
    ]);

    const tokens = await Promise.all(
      buyers.map(b => loginTestUser(b.email, 'password'))
    );

    // 两个用户同时尝试购买同一商品
    const purchasePromises = tokens.map(token =>
      request(app)
        .post(`/api/marketplace/products/${product.id}/purchase`)
        .set('Authorization', `Bearer ${token}`)
        .send({ paymentMethod: 'alipay' })
    );

    const results = await Promise.allSettled(purchasePromises);

    // 应该只有1个成功，1个失败
    const successes = results.filter(r => r.status === 'fulfilled' && r.value.status === 200);
    const failures = results.filter(r => r.status === 'fulfilled' && r.value.status >= 400);

    expect(successes.length).toBe(1);
    expect(failures.length).toBe(1);

    // 验证商品状态
    const updatedProduct = await Product.findById(product.id);
    expect(updatedProduct.availabilityStatus).toBe('reserved');
  });
});
```

---

## 🔄 模块间通信测试

### 事件驱动通信测试
```javascript
// tests/integration/event-communication.test.js
describe('Inter-Module Event Communication', () => {
  let eventBus;

  beforeEach(() => {
    eventBus = require('../../src/utils/event-bus');
  });

  describe('Activity Events', () => {
    test('Activity completion should trigger point award and leaderboard update', async () => {
      const activityCompletionSpy = jest.fn();
      const pointUpdateSpy = jest.fn();
      const leaderboardUpdateSpy = jest.fn();

      // 注册事件监听器
      eventBus.on('activity.completed', activityCompletionSpy);
      eventBus.on('user.points.updated', pointUpdateSpy);
      eventBus.on('leaderboard.updated', leaderboardUpdateSpy);

      const testUser = await createTestUser();
      const testActivity = await createTestActivity();

      // 模拟活动完成
      eventBus.emit('activity.completed', {
        activityId: testActivity.id,
        userId: testUser.id,
        pointsEarned: testActivity.rewardPoints
      });

      // 等待异步处理完成
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(activityCompletionSpy).toHaveBeenCalledWith({
        activityId: testActivity.id,
        userId: testUser.id,
        pointsEarned: testActivity.rewardPoints
      });

      expect(pointUpdateSpy).toHaveBeenCalled();
      expect(leaderboardUpdateSpy).toHaveBeenCalled();
    });
  });

  describe('Ride Events', () => {
    test('Ride completion should trigger notifications and point awards', async () => {
      const notificationSpy = jest.fn();
      const pointAwardSpy = jest.fn();

      eventBus.on('notification.send', notificationSpy);
      eventBus.on('points.award', pointAwardSpy);

      const driver = await createTestUser();
      const passenger = await createTestUser({ email: 'passenger@test.com' });
      const ride = await createTestRide(driver.id);

      // 模拟拼车完成
      eventBus.emit('ride.completed', {
        rideId: ride.id,
        driverId: driver.id,
        passengerIds: [passenger.id],
        earnings: ride.pricePerSeat
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(notificationSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'ride_completed',
          recipientIds: expect.arrayContaining([driver.id, passenger.id])
        })
      );

      expect(pointAwardSpy).toHaveBeenCalledTimes(2); // 司机和乘客都应该获得积分
    });
  });
});
```

### WebSocket通信测试
```javascript
// tests/integration/websocket.test.js
const io = require('socket.io-client');

describe('WebSocket Integration', () => {
  let clientSocket;
  let serverSocket;

  beforeAll((done) => {
    const server = require('../../src/app');
    server.listen(() => {
      const port = server.address().port;
      clientSocket = io(`http://localhost:${port}`);
      
      server.on('connection', (socket) => {
        serverSocket = socket;
      });
      
      clientSocket.on('connect', done);
    });
  });

  afterAll(() => {
    server.close();
    clientSocket.close();
  });

  test('Real-time notification delivery', (done) => {
    const testNotification = {
      type: 'ride_request',
      title: 'New Ride Request',
      content: 'Someone wants to join your ride',
      data: { rideId: 123 }
    };

    clientSocket.on('new_notification', (notification) => {
      expect(notification.type).toBe(testNotification.type);
      expect(notification.title).toBe(testNotification.title);
      done();
    });

    // 模拟服务器发送通知
    serverSocket.emit('new_notification', testNotification);
  });

  test('Chat message broadcasting', (done) => {
    const testMessage = {
      conversationId: 'ride_123',
      senderId: 1,
      content: 'Hello, I will be there soon!',
      timestamp: new Date()
    };

    clientSocket.on('new_message', (message) => {
      expect(message.conversationId).toBe(testMessage.conversationId);
      expect(message.content).toBe(testMessage.content);
      done();
    });

    serverSocket.emit('new_message', testMessage);
  });
});
```

---

## 🛠️ 共享服务测试

### 缓存一致性测试
```javascript
// tests/integration/cache-consistency.test.js
describe('Cache Consistency Across Modules', () => {
  let cacheService;

  beforeEach(() => {
    cacheService = require('../../src/services/cache.service');
  });

  test('User data cache invalidation', async () => {
    const testUser = await createTestUser();
    const userId = testUser.id;

    // 从模块1缓存用户数据
    await cacheService.setUserProfile(userId, testUser);
    
    // 验证缓存存在
    const cachedUser = await cacheService.getUserProfile(userId);
    expect(cachedUser.email).toBe(testUser.email);

    // 从模块2更新用户积分
    await User.updateOne({ _id: userId }, { $inc: { points: 50 } });
    
    // 验证缓存失效机制
    await cacheService.invalidateUserCache(userId);
    
    const updatedCachedUser = await cacheService.getUserProfile(userId);
    expect(updatedCachedUser).toBeNull(); // 缓存应该被清除
  });

  test('Product search cache consistency', async () => {
    const product = await createTestProduct();
    const searchKey = 'electronics_beijing_100';

    // 缓存搜索结果
    const initialResults = [product];
    await cacheService.setCachedProductSearch(searchKey, initialResults);

    // 更新商品状态
    await Product.updateOne(
      { _id: product.id },
      { availabilityStatus: 'sold' }
    );

    // 清除相关缓存
    await cacheService.invalidateProductCache(product.id);

    // 验证搜索缓存被清除
    const cachedResults = await cacheService.getCachedProductSearch(searchKey);
    expect(cachedResults).toBeNull();
  });
});
```

### 文件存储集成测试
```javascript
// tests/integration/file-storage.test.js
describe('File Storage Integration', () => {
  let storageService;

  beforeEach(() => {
    storageService = require('../../src/services/storage.service');
  });

  test('Cross-module file access permissions', async () => {
    const user1 = await createTestUser();
    const user2 = await createTestUser({ email: 'user2@test.com' });

    // 用户1上传文件
    const file = {
      buffer: Buffer.from('test file content'),
      originalname: 'test.jpg',
      mimetype: 'image/jpeg'
    };

    const uploadResult = await storageService.uploadFile(file, {
      userId: user1.id,
      purpose: 'product_image'
    });

    // 验证用户1可以访问
    const fileAccess1 = await checkFileAccess(user1.id, uploadResult.file);
    expect(fileAccess1).toBe(true);

    // 验证用户2无法访问私有文件
    const fileAccess2 = await checkFileAccess(user2.id, uploadResult.file);
    expect(fileAccess2).toBe(false);
  });

  test('File cleanup on entity deletion', async () => {
    const user = await createTestUser();
    const product = await createTestProduct(user.id);

    // 上传商品图片
    const imageFile = await uploadTestImage(product.id, 'product_image');

    // 删除商品
    await Product.deleteOne({ _id: product.id });

    // 验证关联文件被清理
    const fileExists = await storageService.fileExists(imageFile.storagePath);
    expect(fileExists).toBe(false);
  });
});
```

---

## 🔄 端到端测试流程

### 完整用户流程测试
```javascript
// tests/e2e/user-journey.test.js
describe('End-to-End User Journey', () => {
  
  test('Complete ride sharing flow', async () => {
    // 1. 用户注册
    const driverData = {
      studentId: 'DR001',
      email: 'driver@university.edu',
      password: 'SecurePass123!',
      firstName: 'John',
      lastName: 'Driver',
      university: 'Test University'
    };

    const passengerData = {
      studentId: 'PA001',
      email: 'passenger@university.edu',
      password: 'SecurePass123!',
      firstName: 'Jane',
      lastName: 'Passenger',
      university: 'Test University'
    };

    // 注册司机和乘客
    await request(app).post('/api/auth/register').send(driverData).expect(201);
    await request(app).post('/api/auth/register').send(passengerData).expect(201);

    // 2. 邮箱验证（模拟）
    const driver = await User.findOne({ email: driverData.email });
    const passenger = await User.findOne({ email: passengerData.email });
    
    await User.updateMany(
      { _id: { $in: [driver._id, passenger._id] } },
      { verificationStatus: 'verified', isActive: true }
    );

    // 3. 用户登录
    const driverLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: driverData.email, password: driverData.password })
      .expect(200);

    const passengerLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: passengerData.email, password: passengerData.password })
      .expect(200);

    const driverToken = driverLogin.body.data.tokens.accessToken;
    const passengerToken = passengerLogin.body.data.tokens.accessToken;

    // 4. 司机发布拼车
    const rideData = {
      title: 'Campus to Airport',
      departureLocation: {
        address: 'University Campus',
        latitude: 39.9042,
        longitude: 116.4074
      },
      destinationLocation: {
        address: 'Beijing Capital Airport',
        latitude: 40.0799,
        longitude: 116.6031
      },
      departureTime: new Date(Date.now() + 86400000), // 明天
      seatsAvailable: 3,
      pricePerSeat: 50,
      vehicleInfo: {
        make: 'Toyota',
        model: 'Camry',
        color: 'White',
        licensePlate: 'ABC123'
      }
    };

    const rideResponse = await request(app)
      .post('/api/rideshare/rides')
      .set('Authorization', `Bearer ${driverToken}`)
      .send(rideData)
      .expect(201);

    const rideId = rideResponse.body.data.ride.id;

    // 5. 乘客搜索拼车
    const searchResponse = await request(app)
      .get('/api/rideshare/search')
      .query({
        from_lat: 39.9040,
        from_lng: 116.4070,
        to_lat: 40.0800,
        to_lng: 116.6030,
        departure_time: rideData.departureTime.toISOString(),
        seats: 1
      })
      .set('Authorization', `Bearer ${passengerToken}`)
      .expect(200);

    expect(searchResponse.body.data.rides.length).toBeGreaterThan(0);
    const foundRide = searchResponse.body.data.rides.find(r => r.id === rideId);
    expect(foundRide).toBeDefined();

    // 6. 乘客申请加入拼车
    const joinResponse = await request(app)
      .post(`/api/rideshare/rides/${rideId}/join`)
      .set('Authorization', `Bearer ${passengerToken}`)
      .send({
        seatsRequested: 1,
        message: 'I would like to join your ride'
      })
      .expect(201);

    const requestId = joinResponse.body.data.requestId;

    // 7. 司机接受申请
    await request(app)
      .put(`/api/rideshare/requests/${requestId}/accept`)
      .set('Authorization', `Bearer ${driverToken}`)
      .expect(200);

    // 8. 验证通知发送
    const driverNotifications = await Notification.find({
      userId: driver._id,
      type: 'ride_request'
    });
    expect(driverNotifications.length).toBeGreaterThan(0);

    const passengerNotifications = await Notification.find({
      userId: passenger._id,
      type: 'ride_accepted'
    });
    expect(passengerNotifications.length).toBeGreaterThan(0);

    // 9. 完成拼车并验证积分奖励
    await request(app)
      .put(`/api/rideshare/rides/${rideId}/complete`)
      .set('Authorization', `Bearer ${driverToken}`)
      .expect(200);

    // 验证积分更新
    const updatedDriver = await User.findById(driver._id);
    const updatedPassenger = await User.findById(passenger._id);

    expect(updatedDriver.points).toBeGreaterThan(driver.points);
    expect(updatedPassenger.points).toBeGreaterThan(passenger.points);

    // 10. 验证排行榜更新
    const leaderboardResponse = await request(app)
      .get('/api/leaderboard')
      .query({ category: 'overall', period: 'weekly' })
      .set('Authorization', `Bearer ${driverToken}`)
      .expect(200);

    const leaderboard = leaderboardResponse.body.data.leaderboard;
    const driverRank = leaderboard.find(entry => entry.user.id === driver._id.toString());
    const passengerRank = leaderboard.find(entry => entry.user.id === passenger._id.toString());

    expect(driverRank).toBeDefined();
    expect(passengerRank).toBeDefined();
  });

  test('Complete marketplace transaction flow', async () => {
    // 1. 创建卖家和买家
    const seller = await createTestUser();
    const buyer = await createTestUser({ email: 'buyer@test.com' });

    const sellerToken = await loginTestUser(seller.email, 'password');
    const buyerToken = await loginTestUser('buyer@test.com', 'password');

    // 2. 卖家发布商品
    const productData = {
      title: 'MacBook Pro 2023',
      description: 'Excellent condition laptop for sale',
      category: 'electronics',
      condition: 'like_new',
      price: 1299.99,
      brand: 'Apple',
      negotiable: true
    };

    const productResponse = await request(app)
      .post('/api/marketplace/products')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send(productData)
      .expect(201);

    const productId = productResponse.body.data.product.id;

    // 3. 买家搜索商品
    const searchResponse = await request(app)
      .get('/api/marketplace/search')
      .query({ keyword: 'MacBook', category: 'electronics' })
      .set('Authorization', `Bearer ${buyerToken}`)
      .expect(200);

    expect(searchResponse.body.data.products.length).toBeGreaterThan(0);

    // 4. 买家购买商品
    const purchaseResponse = await request(app)
      .post(`/api/marketplace/products/${productId}/purchase`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({
        paymentMethod: 'alipay',
        deliveryOption: 'pickup'
      })
      .expect(200);

    const transactionId = purchaseResponse.body.data.transactionId;

    // 5. 验证交易记录
    const transaction = await Transaction.findById(transactionId);
    expect(transaction.buyerId.toString()).toBe(buyer._id.toString());
    expect(transaction.sellerId.toString()).toBe(seller._id.toString());
    expect(transaction.amount).toBe(productData.price);

    // 6. 验证通知发送
    const sellerNotifications = await Notification.find({
      userId: seller._id,
      type: 'product_inquiry'
    });
    expect(sellerNotifications.length).toBeGreaterThan(0);
  });
});
```

---

## ⚡ 性能集成测试

### 负载测试
```javascript
// tests/performance/load-test.js
const autocannon = require('autocannon');

describe('Performance Integration Tests', () => {
  
  test('API Gateway load handling', async () => {
    const result = await autocannon({
      url: 'http://localhost:3000',
      connections: 100,
      pipelining: 1,
      duration: 30,
      requests: [
        {
          method: 'GET',
          path: '/api/rideshare/search?from_lat=39.9042&from_lng=116.4074&to_lat=40.0799&to_lng=116.6031&departure_time=2024-07-01T08:00:00Z',
          headers: {
            'Authorization': 'Bearer valid-token'
          }
        },
        {
          method: 'GET',
          path: '/api/marketplace/search?keyword=laptop&category=electronics',
          headers: {
            'Authorization': 'Bearer valid-token'
          }
        }
      ]
    });

    expect(result.requests.average).toBeGreaterThan(50); // 平均每秒50个请求
    expect(result.latency.p99).toBeLessThan(2000); // 99%请求在2秒内响应
    expect(result.errors).toBe(0); // 无错误
  });

  test('Database connection pool performance', async () => {
    const concurrentQueries = Array(50).fill().map(async () => {
      return Promise.all([
        User.findOne({ email: 'test@university.edu' }),
        Ride.find({ status: 'confirmed' }).limit(10),
        Product.find({ availabilityStatus: 'available' }).limit(10)
      ]);
    });

    const startTime = Date.now();
    await Promise.all(concurrentQueries);
    const endTime = Date.now();

    const duration = endTime - startTime;
    expect(duration).toBeLessThan(5000); // 所有查询在5秒内完成
  });

  test('WebSocket connection scalability', async () => {
    const connections = [];
    const messageCount = 100;
    let receivedMessages = 0;

    // 创建多个WebSocket连接
    for (let i = 0; i < 50; i++) {
      const socket = io('http://localhost:3000');
      socket.on('test_message', () => {
        receivedMessages++;
      });
      connections.push(socket);
    }

    // 等待连接建立
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 发送大量消息
    const startTime = Date.now();
    for (let i = 0; i < messageCount; i++) {
      io.emit('test_message', { id: i, timestamp: Date.now() });
    }

    // 等待消息传递完成
    await new Promise(resolve => setTimeout(resolve, 5000));

    const endTime = Date.now();
    const duration = endTime - startTime;

    expect(receivedMessages).toBeGreaterThan(messageCount * 0.95); // 95%消息成功传递
    expect(duration).toBeLessThan(10000); // 10秒内完成

    // 清理连接
    connections.forEach(socket => socket.disconnect());
  });
});
```

### 内存和资源监控
```javascript
// tests/performance/memory-monitoring.test.js
describe('Memory and Resource Monitoring', () => {
  
  test('Memory usage stability under load', async () => {
    const initialMemory = process.memoryUsage();
    
    // 执行大量操作
    const operations = Array(1000).fill().map(async (_, index) => {
      const user = await createTestUser({ email: `user${index}@test.com` });
      const product = await createTestProduct(user.id);
      await Product.deleteOne({ _id: product.id });
      await User.deleteOne({ _id: user.id });
    });

    await Promise.all(operations);

    // 强制垃圾回收
    if (global.gc) {
      global.gc();
    }

    const finalMemory = process.memoryUsage();
    
    // 内存增长不应超过50MB
    const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
    expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
  });

  test('Database connection pool health', async () => {
    const poolStats = await db.pool.getPoolSize();
    
    expect(poolStats.totalConnections).toBeLessThanOrEqual(20); // 最大连接数
    expect(poolStats.idleConnections).toBeGreaterThanOrEqual(5); // 最小空闲连接
    expect(poolStats.waitingClients).toBe(0); // 无等待客户端
  });
});
```

---

## 🚨 错误处理测试

### 异常场景测试
```javascript
// tests/integration/error-handling.test.js
describe('Error Handling Integration', () => {
  
  test('Database connection failure handling', async () => {
    // 模拟数据库连接失败
    jest.spyOn(db, 'query').mockRejectedValueOnce(new Error('Connection lost'));

    const response = await request(app)
      .get('/api/users/1')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(503);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('temporarily unavailable');
  });

  test('External service failure graceful degradation', async () => {
    // 模拟地图服务失败
    jest.spyOn(mapsService, 'calculateRoute').mockRejectedValueOnce(new Error('Maps API unavailable'));

    const rideData = {
      title: 'Test Ride',
      departureLocation: { latitude: 39.9042, longitude: 116.4074 },
      destinationLocation: { latitude: 40.0799, longitude: 116.6031 },
      departureTime: new Date(Date.now() + 86400000),
      seatsAvailable: 3,
      pricePerSeat: 50
    };

    const response = await request(app)
      .post('/api/rideshare/rides')
      .set('Authorization', `Bearer ${authToken}`)
      .send(rideData)
      .expect(201); // 应该仍然成功创建，但没有路线信息

    expect(response.body.data.ride.routeInfo).toBeUndefined();
  });

  test('Payment service failure handling', async () => {
    const product = await createTestProduct();
    
    // 模拟支付服务失败
    jest.spyOn(paymentService, 'createPaymentOrder').mockRejectedValueOnce(new Error('Payment gateway error'));

    const response = await request(app)
      .post(`/api/marketplace/products/${product.id}/purchase`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ paymentMethod: 'alipay' })
      .expect(503);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('payment service');

    // 验证商品状态未改变
    const updatedProduct = await Product.findById(product.id);
    expect(updatedProduct.availabilityStatus).toBe('available');
  });

  test('Notification service failure handling', async () => {
    // 模拟通知服务失败
    jest.spyOn(notificationService, 'sendNotification').mockRejectedValueOnce(new Error('Notification service down'));

    const ride = await createTestRide();
    
    const response = await request(app)
      .post(`/api/rideshare/rides/${ride.id}/join`)
      .set('Authorization', `Bearer ${passengerToken}`)
      .send({ seatsRequested: 1 })
      .expect(201); // 主要操作应该成功

    // 验证拼车请求创建成功，即使通知失败
    const rideRequest = await RideRequest.findOne({
      rideId: ride.id,
      passengerId: passenger.id
    });
    expect(rideRequest).toBeDefined();
  });
});
```

### 数据一致性错误恢复
```javascript
// tests/integration/consistency-recovery.test.js
describe('Data Consistency Recovery', () => {
  
  test('Partial transaction failure recovery', async () => {
    const user = await createTestUser();
    const activity = await createTestActivity();

    // 模拟积分更新失败但参与记录成功的情况
    jest.spyOn(User, 'updateOne').mockRejectedValueOnce(new Error('Points update failed'));

    const response = await request(app)
      .post(`/api/activities/${activity.id}/checkin`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ checkinCode: activity.checkinCode })
      .expect(500);

    // 验证事务回滚 - 参与记录应该也被回滚
    const participation = await ActivityParticipation.findOne({
      activityId: activity.id,
      userId: user.id
    });
    expect(participation.attendanceStatus).not.toBe('attended');
  });

  test('Cache invalidation failure handling', async () => {
    const user = await createTestUser();
    
    // 模拟缓存清除失败
    jest.spyOn(cacheService, 'invalidateUserCache').mockRejectedValueOnce(new Error('Cache service error'));

    // 更新用户信息
    const response = await request(app)
      .put(`/api/users/${user.id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ firstName: 'UpdatedName' })
      .expect(200); // 主要操作应该成功

    // 验证数据库更新成功
    const updatedUser = await User.findById(user.id);
    expect(updatedUser.firstName).toBe('UpdatedName');

    // 验证有错误日志记录缓存失败
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('Cache invalidation failed'),
      expect.any(Error)
    );
  });
});
```

---

## 🔒 安全集成测试

### 跨模块权限验证
```javascript
// tests/integration/security.test.js
describe('Security Integration Tests', () => {
  
  test('Cross-module authorization consistency', async () => {
    const user1 = await createTestUser();
    const user2 = await createTestUser({ email: 'user2@test.com' });
    
    const user1Token = await loginTestUser(user1.email, 'password');
    const user2Token = await loginTestUser('user2@test.com', 'password');

    // 用户1创建拼车
    const ride = await createTestRide(user1.id);

    // 用户2尝试修改用户1的拼车 - 应该被拒绝
    const response = await request(app)
      .put(`/api/rideshare/rides/${ride.id}`)
      .set('Authorization', `Bearer ${user2Token}`)
      .send({ title: 'Modified title' })
      .expect(403);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('Permission denied');
  });

  test('Token validation across modules', async () => {
    const user = await createTestUser();
    const validToken = await loginTestUser(user.email, 'password');

    // 生成无效token
    const invalidToken = 'invalid.jwt.token';

    // 测试模块1的接口
    await request(app)
      .get('/api/users/profile')
      .set('Authorization', `Bearer ${invalidToken}`)
      .expect(401);

    // 测试模块2的接口
    await request(app)
      .get('/api/rideshare/my-rides')
      .set('Authorization', `Bearer ${invalidToken}`)
      .expect(401);

    // 测试有效token在两个模块都工作
    await request(app)
      .get('/api/users/profile')
      .set('Authorization', `Bearer ${validToken}`)
      .expect(200);

    await request(app)
      .get('/api/rideshare/my-rides')
      .set('Authorization', `Bearer ${validToken}`)
      .expect(200);
  });

  test('Rate limiting across modules', async () => {
    const user = await createTestUser();
    const token = await loginTestUser(user.email, 'password');

    // 快速发送大量请求
    const requests = Array(120).fill().map(() =>
      request(app)
        .get('/api/marketplace/search?keyword=test')
        .set('Authorization', `Bearer ${token}`)
    );

    const responses = await Promise.allSettled(requests);
    
    // 应该有一些请求被限制
    const rateLimitedResponses = responses.filter(r => 
      r.status === 'fulfilled' && r.value.status === 429
    );

    expect(rateLimitedResponses.length).toBeGreaterThan(0);
  });

  test('Input sanitization across modules', async () => {
    const user = await createTestUser();
    const token = await loginTestUser(user.email, 'password');

    const maliciousInput = '<script>alert("xss")</script>';

    // 测试模块1
    const activityResponse = await request(app)
      .post('/api/activities')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: maliciousInput,
        description: 'Normal description',
        category: 'academic',
        type: 'individual',
        location: 'Test Location',
        startTime: new Date(Date.now() + 86400000),
        endTime: new Date(Date.now() + 90000000)
      })
      .expect(201);

    expect(activityResponse.body.data.activity.title).not.toContain('<script>');

    // 测试模块2
    const productResponse = await request(app)
      .post('/api/marketplace/products')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: maliciousInput,
        description: 'Normal description',
        category: 'electronics',
        condition: 'new',
        price: 100
      })
      .expect(201);

    expect(productResponse.body.data.product.title).not.toContain('<script>');
  });
});
```

---

## 🤖 测试自动化

### CI/CD集成测试管道
```yaml
# .github/workflows/integration-tests.yml
name: Integration Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  integration-tests:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: testpass
          POSTGRES_DB: campusride_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: |
        npm ci
        npm run build
    
    - name: Setup test database
      run: |
        npm run db:migrate:test
        npm run db:seed:test
      env:
        DATABASE_URL: postgresql://postgres:testpass@localhost:5432/campusride_test
        REDIS_URL: redis://localhost:6379
    
    - name: Run unit tests
      run: npm run test:unit
    
    - name: Run integration tests
      run: npm run test:integration
      env:
        NODE_ENV: test
        DATABASE_URL: postgresql://postgres:testpass@localhost:5432/campusride_test
        REDIS_URL: redis://localhost:6379
        JWT_ACCESS_SECRET: test-secret
        JWT_REFRESH_SECRET: test-refresh-secret
    
    - name: Run contract tests
      run: npm run test:contract
    
    - name: Run E2E tests
      run: npm run test:e2e
    
    - name: Generate test report
      run: npm run test:report
    
    - name: Upload test coverage
      uses: codecov/codecov-action@v3
      with:
        files: ./coverage/lcov.info
    
    - name: Performance benchmarks
      run: npm run test:performance
      
    - name: Security scan
      run: npm audit --audit-level moderate
```

### 测试数据管理
```javascript
// tests/helpers/test-data-manager.js
class TestDataManager {
  constructor() {
    this.createdEntities = {
      users: [],
      activities: [],
      rides: [],
      products: [],
      transactions: []
    };
  }

  async createTestUser(overrides = {}) {
    const userData = {
      studentId: `ST${Date.now()}`,
      email: `test${Date.now()}@university.edu`,
      password: 'TestPass123!',
      firstName: 'Test',
      lastName: 'User',
      university: 'Test University',
      verificationStatus: 'verified',
      isActive: true,
      ...overrides
    };

    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const user = await User.create({
      ...userData,
      passwordHash: hashedPassword
    });

    this.createdEntities.users.push(user._id);
    return user;
  }

  async createTestActivity(organizerId, overrides = {}) {
    const activityData = {
      title: `Test Activity ${Date.now()}`,
      description: 'This is a test activity for integration testing',
      category: 'academic',
      type: 'individual',
      organizerId,
      location: 'Test Location',
      startTime: new Date(Date.now() + 86400000), // Tomorrow
      endTime: new Date(Date.now() + 90000000),   // Day after tomorrow
      maxParticipants: 50,
      rewardPoints: 10,
      status: 'published',
      ...overrides
    };

    const activity = await Activity.create(activityData);
    this.createdEntities.activities.push(activity._id);
    return activity;
  }

  async createTestRide(driverId, overrides = {}) {
    const rideData = {
      driverId,
      title: `Test Ride ${Date.now()}`,
      departureLocation: {
        address: 'Test Campus',
        latitude: 39.9042,
        longitude: 116.4074
      },
      destinationLocation: {
        address: 'Test Airport',
        latitude: 40.0799,
        longitude: 116.6031
      },
      departureTime: new Date(Date.now() + 86400000),
      seatsAvailable: 3,
      pricePerSeat: 50,
      status: 'confirmed',
      ...overrides
    };

    const ride = await Ride.create(rideData);
    this.createdEntities.rides.push(ride._id);
    return ride;
  }

  async createTestProduct(sellerId, overrides = {}) {
    const productData = {
      sellerId,
      title: `Test Product ${Date.now()}`,
      description: 'This is a test product for integration testing',
      category: 'electronics',
      conditionType: 'good',
      price: 299.99,
      availabilityStatus: 'available',
      ...overrides
    };

    const product = await Product.create(productData);
    this.createdEntities.products.push(product._id);
    return product;
  }

  async cleanup() {
    try {
      // 删除所有测试数据，按依赖关系逆序删除
      await Transaction.deleteMany({ _id: { $in: this.createdEntities.transactions } });
      await Product.deleteMany({ _id: { $in: this.createdEntities.products } });
      await Ride.deleteMany({ _id: { $in: this.createdEntities.rides } });
      await Activity.deleteMany({ _id: { $in: this.createdEntities.activities } });
      await User.deleteMany({ _id: { $in: this.createdEntities.users } });

      // 清空记录
      Object.keys(this.createdEntities).forEach(key => {
        this.createdEntities[key] = [];
      });

      // 清除缓存
      const redis = require('../../src/config/redis');
      await redis.flushdb();

    } catch (error) {
      console.error('Test cleanup error:', error);
    }
  }
}

module.exports = TestDataManager;
```

### 测试报告生成
```javascript
// scripts/generate-test-report.js
const fs = require('fs');
const path = require('path');

class TestReportGenerator {
  constructor() {
    this.report = {
      timestamp: new Date().toISOString(),
      summary: {},
      modules: {},
      integration: {},
      performance: {},
      coverage: {}
    };
  }

  async generateReport() {
    // 收集测试结果
    await this.collectUnitTestResults();
    await this.collectIntegrationTestResults();
    await this.collectPerformanceResults();
    await this.collectCoverageResults();

    // 生成HTML报告
    const htmlReport = this.generateHTMLReport();
    
    // 保存报告
    const reportPath = path.join(__dirname, '../reports');
    if (!fs.existsSync(reportPath)) {
      fs.mkdirSync(reportPath, { recursive: true });
    }

    fs.writeFileSync(
      path.join(reportPath, `integration-test-report-${Date.now()}.html`),
      htmlReport
    );

    // 生成JSON报告用于CI/CD
    fs.writeFileSync(
      path.join(reportPath, 'latest-test-results.json'),
      JSON.stringify(this.report, null, 2)
    );

    console.log('Test report generated successfully');
    return this.report;
  }

  generateHTMLReport() {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Integration Test Report</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { background: #f0f0f0; padding: 20px; margin-bottom: 20px; }
            .section { margin-bottom: 30px; }
            .success { color: green; }
            .failure { color: red; }
            .warning { color: orange; }
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Integration Test Report</h1>
            <p>Generated: ${this.report.timestamp}</p>
        </div>
        
        <div class="section">
            <h2>Test Summary</h2>
            <table>
                <tr><th>Category</th><th>Total</th><th>Passed</th><th>Failed</th><th>Success Rate</th></tr>
                <tr>
                    <td>Unit Tests</td>
                    <td>${this.report.summary.unit?.total || 0}</td>
                    <td class="success">${this.report.summary.unit?.passed || 0}</td>
                    <td class="failure">${this.report.summary.unit?.failed || 0}</td>
                    <td>${this.calculateSuccessRate(this.report.summary.unit)}%</td>
                </tr>
                <tr>
                    <td>Integration Tests</td>
                    <td>${this.report.summary.integration?.total || 0}</td>
                    <td class="success">${this.report.summary.integration?.passed || 0}</td>
                    <td class="failure">${this.report.summary.integration?.failed || 0}</td>
                    <td>${this.calculateSuccessRate(this.report.summary.integration)}%</td>
                </tr>
                <tr>
                    <td>E2E Tests</td>
                    <td>${this.report.summary.e2e?.total || 0}</td>
                    <td class="success">${this.report.summary.e2e?.passed || 0}</td>
                    <td class="failure">${this.report.summary.e2e?.failed || 0}</td>
                    <td>${this.calculateSuccessRate(this.report.summary.e2e)}%</td>
                </tr>
            </table>
        </div>

        <div class="section">
            <h2>Coverage Report</h2>
            <p>Overall Coverage: <strong>${this.report.coverage.overall || 0}%</strong></p>
            <p>Module 1 Coverage: <strong>${this.report.coverage.module1 || 0}%</strong></p>
            <p>Module 2 Coverage: <strong>${this.report.coverage.module2 || 0}%</strong></p>
        </div>

        <div class="section">
            <h2>Performance Metrics</h2>
            <table>
                <tr><th>Metric</th><th>Value</th><th>Threshold</th><th>Status</th></tr>
                <tr>
                    <td>Average Response Time</td>
                    <td>${this.report.performance.avgResponseTime || 0}ms</td>
                    <td>&lt; 500ms</td>
                    <td class="${this.getStatusClass(this.report.performance.avgResponseTime, 500)}">${this.getStatus(this.report.performance.avgResponseTime, 500)}</td>
                </tr>
                <tr>
                    <td>P99 Response Time</td>
                    <td>${this.report.performance.p99ResponseTime || 0}ms</td>
                    <td>&lt; 2000ms</td>
                    <td class="${this.getStatusClass(this.report.performance.p99ResponseTime, 2000)}">${this.getStatus(this.report.performance.p99ResponseTime, 2000)}</td>
                </tr>
            </table>
        </div>
    </body>
    </html>
    `;
  }

  calculateSuccessRate(stats) {
    if (!stats || !stats.total) return 0;
    return Math.round((stats.passed / stats.total) * 100);
  }

  getStatusClass(value, threshold) {
    return value <= threshold ? 'success' : 'failure';
  }

  getStatus(value, threshold) {
    return value <= threshold ? 'PASS' : 'FAIL';
  }
}

module.exports = TestReportGenerator;
```

---

## 📋 集成测试检查清单

### 开发阶段检查
- [ ] API契约测试通过
- [ ] 数据库事务一致性验证
- [ ] 缓存同步机制测试
- [ ] 跨模块权限验证
- [ ] 错误处理链路测试

### 集成阶段检查
- [ ] 端到端用户流程测试
- [ ] 并发访问安全性测试
- [ ] 性能基准测试通过
- [ ] 故障恢复机制验证
- [ ] 监控告警配置验证

### 部署前检查
- [ ] 生产环境集成测试
- [ ] 负载测试通过
- [ ] 安全渗透测试完成
- [ ] 数据迁移验证
- [ ] 回滚流程测试

### 持续监控
- [ ] 集成测试自动化运行
- [ ] 性能指标持续监控
- [ ] 错误率趋势分析
- [ ] 用户体验监控
- [ ] 系统健康度检查

---

**文档版本**: v1.0  
**最后更新**: 2024-06-30  
**维护人**: Claude Code & Cursor AI  
**审核状态**: 待审核  

---

*本文档确保两个后端模块能够可靠集成，为系统的稳定运行提供保障。所有集成测试应在开发过程中持续执行。*