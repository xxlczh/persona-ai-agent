const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ProductSuggestion = sequelize.define('ProductSuggestion', {
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
  summary: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  suggestions: {
    type: DataTypes.JSON,
    allowNull: false
  },
  priorities: {
    type: DataTypes.JSON,
    allowNull: true
  },
  competitor_analysis: {
    type: DataTypes.JSON,
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
  tableName: 'product_suggestions',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['project_id'] },
    { fields: ['persona_id'] },
    { fields: ['created_by'] }
  ]
});

module.exports = ProductSuggestion;
