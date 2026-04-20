const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MarketingScript = sequelize.define('MarketingScript', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  project_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'project_id'
  },
  persona_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'persona_id'
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('video', 'copy', 'social', 'strategy'),
    defaultValue: 'video'
  },
  content: {
    type: DataTypes.JSON,
    allowNull: false
  },
  target_channels: {
    type: DataTypes.JSON,
    allowNull: true
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('draft', 'published', 'archived'),
    defaultValue: 'draft'
  },
  usage_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'created_by'
  }
}, {
  tableName: 'marketing_scripts',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['project_id'] },
    { fields: ['persona_id'] },
    { fields: ['created_by'] }
  ]
});

module.exports = MarketingScript;
