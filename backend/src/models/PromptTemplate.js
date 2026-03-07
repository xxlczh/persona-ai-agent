const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PromptTemplate = sequelize.define('PromptTemplate', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  category: {
    type: DataTypes.ENUM('demographic', 'behavioral', 'psychological', 'needs', 'scenario', 'comprehensive', 'custom'),
    defaultValue: 'custom'
  },
  template_content: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  variables: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    comment: '模板变量列表，如 [{name: "userName", description: "用户名称"}]'
  },
  model_config: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {},
    comment: '模型配置，如 {temperature: 0.7, max_tokens: 2000}'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  is_default: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '是否为默认模板'
  },
  usage_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '使用次数'
  },
  last_used_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  project_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'projects',
      key: 'id'
    },
    comment: '如果为null，则为全局模板'
  }
}, {
  tableName: 'prompt_templates',
  timestamps: true,
  underscored: true
});

module.exports = PromptTemplate;
