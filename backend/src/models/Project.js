const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Project = sequelize.define('Project', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 100]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  owner_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id'
  },
  owner_name: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('active', 'archived', 'deleted'),
    defaultValue: 'active'
  },
  invite_code: {
    type: DataTypes.STRING(32),
    allowNull: true,
    unique: true
  },
  settings: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {}
  },
  tags: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  team_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'team_id'
  }
}, {
  tableName: 'projects',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['owner_id'] },
    { fields: ['status'] },
    { fields: ['created_at'] },
    { fields: ['owner_id', 'status'] },
    { fields: ['invite_code'] }
  ]
});

module.exports = Project;
