const sequelize = require('../config/database');
const User = require('./User');
const Project = require('./Project');
const DataSource = require('./DataSource');
const Persona = require('./Persona');
const Evaluation = require('./Evaluation');
const PromptTemplate = require('./PromptTemplate');

// 建立关联关系
User.hasMany(Project, { foreignKey: 'owner_id', as: 'projects' });
Project.belongsTo(User, { foreignKey: 'owner_id', as: 'owner' });

// Project 与 DataSource 关联
Project.hasMany(DataSource, { foreignKey: 'project_id', as: 'dataSources' });
DataSource.belongsTo(Project, { foreignKey: 'project_id', as: 'project' });

// Project 与 Persona 关联
Project.hasMany(Persona, { foreignKey: 'project_id', as: 'personas' });
Persona.belongsTo(Project, { foreignKey: 'project_id', as: 'project' });

// Persona 与 Evaluation 关联
Persona.hasMany(Evaluation, { foreignKey: 'persona_id', as: 'evaluations' });
Evaluation.belongsTo(Persona, { foreignKey: 'persona_id', as: 'persona' });

// Project 与 Evaluation 关联
Project.hasMany(Evaluation, { foreignKey: 'project_id', as: 'evaluations' });
Evaluation.belongsTo(Project, { foreignKey: 'project_id', as: 'project' });

// Project 与 PromptTemplate 关联
Project.hasMany(PromptTemplate, { foreignKey: 'project_id', as: 'promptTemplates' });
PromptTemplate.belongsTo(Project, { foreignKey: 'project_id', as: 'project' });

// User 与 PromptTemplate 关联
User.hasMany(PromptTemplate, { foreignKey: 'created_by', as: 'createdTemplates' });
PromptTemplate.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

module.exports = {
  sequelize,
  User,
  Project,
  DataSource,
  Persona,
  Evaluation,
  PromptTemplate
};
