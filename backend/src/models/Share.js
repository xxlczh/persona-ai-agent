const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Share = sequelize.define('Share', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  resource_type: {
    type: DataTypes.ENUM('persona', 'survey', 'script', 'suggestion'),
    allowNull: false
  },
  resource_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('shared', 'hidden'),
    defaultValue: 'shared'
  }
}, {
  tableName: 'shares',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['user_id'] },
    { fields: ['resource_type'] },
    { fields: ['resource_id'] },
    { fields: ['status'] },
    { fields: ['user_id', 'resource_type', 'resource_id'], unique: true }
  ]
});

module.exports = Share;