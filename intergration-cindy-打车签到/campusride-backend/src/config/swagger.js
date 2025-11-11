import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'CampusRide API',
      version: '1.0.0',
      description: 'CampusRide 校园拼车平台后端API文档',
      contact: {
        name: 'CampusRide Team',
        email: 'dev@campusride.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: process.env.BACKEND_URL || 'http://localhost:3000',
        description: '开发环境'
      },
      {
        url: 'https://api.campusride.com',
        description: '生产环境'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT认证令牌'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: '用户ID'
            },
            student_id: {
              type: 'string',
              description: '学号'
            },
            email: {
              type: 'string',
              format: 'email',
              description: '邮箱'
            },
            first_name: {
              type: 'string',
              description: '名'
            },
            last_name: {
              type: 'string',
              description: '姓'
            },
            university: {
              type: 'string',
              description: '大学'
            },
            major: {
              type: 'string',
              description: '专业'
            },
            points: {
              type: 'integer',
              description: '积分'
            },
            role: {
              type: 'string',
              enum: ['user', 'moderator', 'admin'],
              description: '用户角色'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: '创建时间'
            }
          }
        },
        Ride: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: '拼车ID'
            },
            driver_id: {
              type: 'string',
              format: 'uuid',
              description: '司机ID'
            },
            title: {
              type: 'string',
              description: '拼车标题'
            },
            description: {
              type: 'string',
              description: '拼车描述'
            },
            departure_location: {
              type: 'object',
              properties: {
                address: { type: 'string' },
                latitude: { type: 'number' },
                longitude: { type: 'number' }
              },
              description: '出发地点'
            },
            destination_location: {
              type: 'object',
              properties: {
                address: { type: 'string' },
                latitude: { type: 'number' },
                longitude: { type: 'number' }
              },
              description: '目的地点'
            },
            departure_time: {
              type: 'string',
              format: 'date-time',
              description: '出发时间'
            },
            available_seats: {
              type: 'integer',
              description: '可用座位数'
            },
            price_per_seat: {
              type: 'number',
              description: '每座位价格'
            },
            status: {
              type: 'string',
              enum: ['active', 'full', 'completed', 'cancelled'],
              description: '拼车状态'
            }
          }
        },
        MarketplaceItem: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: '商品ID'
            },
            seller_id: {
              type: 'string',
              format: 'uuid',
              description: '卖家ID'
            },
            title: {
              type: 'string',
              description: '商品标题'
            },
            description: {
              type: 'string',
              description: '商品描述'
            },
            category: {
              type: 'string',
              description: '商品分类'
            },
            price: {
              type: 'number',
              description: '价格'
            },
            condition: {
              type: 'string',
              enum: ['new', 'like_new', 'good', 'fair', 'poor'],
              description: '商品状况'
            },
            status: {
              type: 'string',
              enum: ['active', 'sold', 'reserved', 'removed'],
              description: '商品状态'
            }
          }
        },
        Activity: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: '活动ID'
            },
            organizer_id: {
              type: 'string',
              format: 'uuid',
              description: '组织者ID'
            },
            title: {
              type: 'string',
              description: '活动标题'
            },
            description: {
              type: 'string',
              description: '活动描述'
            },
            category: {
              type: 'string',
              description: '活动分类'
            },
            location: {
              type: 'object',
              description: '活动地点'
            },
            start_time: {
              type: 'string',
              format: 'date-time',
              description: '开始时间'
            },
            end_time: {
              type: 'string',
              format: 'date-time',
              description: '结束时间'
            },
            max_participants: {
              type: 'integer',
              description: '最大参与人数'
            },
            status: {
              type: 'string',
              enum: ['draft', 'published', 'ongoing', 'completed', 'cancelled'],
              description: '活动状态'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            error: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  description: '错误代码'
                },
                message: {
                  type: 'string',
                  description: '错误信息'
                }
              }
            }
          }
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            data: {
              type: 'object',
              description: '响应数据'
            },
            message: {
              type: 'string',
              description: '成功信息'
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: [
    './src/routes/*.js',
    './src/controllers/*.js'
  ]
};

const specs = swaggerJsdoc(options);

export { swaggerUi, specs }; 