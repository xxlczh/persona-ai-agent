const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Persona = sequelize.define('Persona', {
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
  summary: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  demographic: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {}
  },
  behavioral: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {}
  },
  psychological: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {}
  },
  needs: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {}
  },
  scenario: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {}
  },
  personality_tags: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  communication_style: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  marketing_suggestions: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  quality_score: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {}
  },
  source_data_ids: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  generation_config: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {}
  },
  status: {
    type: DataTypes.ENUM('pending', 'generating', 'completed', 'failed'),
    defaultValue: 'pending'
  },
  error_message: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  generated_by: {
    type: DataTypes.STRING(50),
    allowNull: true,
    defaultValue: 'auto'
  }
}, {
  tableName: 'personas',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['project_id'] },
    { fields: ['status'] },
    { fields: ['created_at'] },
    { fields: ['project_id', 'status'] },
    { fields: ['project_id', 'created_at'] }
  ]
});

module.exports = Persona;
