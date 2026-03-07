const { Sequelize } = require('sequelize');
require('dotenv').config();

// 创建 Sequelize 实例
const sequelize = new Sequelize(
  process.env.DB_NAME || 'persona_ai',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 20, // 增加最大连接数
      min: 5, // 增加最小连接数
      acquire: 30000,
      idle: 10000,
      evict: 1000 // 定期清理空闲连接
    },
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: false
    },
    timezone: '+08:00',
    // 性能优化选项
    benchmark: true,
    retry: {
      max: 3
    }
  }
);

module.exports = sequelize;
