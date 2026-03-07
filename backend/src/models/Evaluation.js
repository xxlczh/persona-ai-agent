const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Evaluation = sequelize.define('Evaluation', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  persona_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'personas',
      key: 'id'
    }
  },
  project_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'projects',
      key: 'id'
    }
  },
  overall_score: {
    type: DataTypes.FLOAT,
    allowNull: false,
    validate: {
      min: 0,
      max: 100
    }
  },
  overall_level: {
    type: DataTypes.ENUM('excellent', 'good', 'fair', 'poor'),
    allowNull: false
  },
  completeness_score: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  consistency_score: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  authenticity_score: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  actionability_score: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  details: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {}
  },
  evaluated_by: {
    type: DataTypes.STRING(50),
    allowNull: true,
    defaultValue: 'system'
  }
}, {
  tableName: 'evaluations',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['persona_id'] },
    { fields: ['project_id'] },
    { fields: ['overall_score'] },
    { fields: ['persona_id', 'project_id'] }
  ]
});

module.exports = Evaluation;
