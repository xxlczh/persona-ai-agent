const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DataSource = sequelize.define('DataSource', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  project_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'projects',
      key: 'id'
    }
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  type: {
    type: DataTypes.ENUM('csv', 'json', 'txt', 'xlsx', 'xml'),
    allowNull: false
  },
  file_path: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  original_name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  file_size: {
    type: DataTypes.BIGINT,
    allowNull: false,
    defaultValue: 0
  },
  mime_type: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  row_count: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0
  },
  column_count: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {}
  },
  status: {
    type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed'),
    defaultValue: 'pending'
  },
  error_message: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'data_sources',
  timestamps: true,
  underscored: true
});

module.exports = DataSource;
