const sequelize = require('../config/database');
const User = require('./User');
const Project = require('./Project');
const DataSource = require('./DataSource');
const Persona = require('./Persona');
const Evaluation = require('./Evaluation');
const PromptTemplate = require('./PromptTemplate');
const Team = require('./Team');
const TeamMember = require('./TeamMember');
const Survey = require('./Survey');
const MarketingScript = require('./MarketingScript');
const ProductSuggestion = require('./ProductSuggestion');

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

// ========== 团队协作模块 ==========
// Team 关联
User.hasMany(Team, { foreignKey: 'owner_id', as: 'ownedTeams' });
Team.belongsTo(User, { foreignKey: 'owner_id', as: 'owner' });

// TeamMember 关联
Team.hasMany(TeamMember, { foreignKey: 'team_id', as: 'members' });
TeamMember.belongsTo(Team, { foreignKey: 'team_id', as: 'team' });

User.hasMany(TeamMember, { foreignKey: 'user_id', as: 'teamMemberships' });
TeamMember.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Project 与 Team 关联（可选）
Team.hasMany(Project, { foreignKey: 'team_id', as: 'projects' });
Project.belongsTo(Team, { foreignKey: 'team_id', as: 'team' });

// ========== 扩展功能模块 ==========
// Survey 关联
Project.hasMany(Survey, { foreignKey: 'project_id', as: 'surveys' });
Survey.belongsTo(Project, { foreignKey: 'project_id', as: 'project' });
Survey.belongsTo(Persona, { foreignKey: 'persona_id', as: 'persona' });
Survey.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// MarketingScript 关联
Project.hasMany(MarketingScript, { foreignKey: 'project_id', as: 'marketingScripts' });
MarketingScript.belongsTo(Project, { foreignKey: 'project_id', as: 'project' });
MarketingScript.belongsTo(Persona, { foreignKey: 'persona_id', as: 'persona' });
MarketingScript.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// ProductSuggestion 关联
Project.hasMany(ProductSuggestion, { foreignKey: 'project_id', as: 'productSuggestions' });
ProductSuggestion.belongsTo(Project, { foreignKey: 'project_id', as: 'project' });
ProductSuggestion.belongsTo(Persona, { foreignKey: 'persona_id', as: 'persona' });
ProductSuggestion.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

module.exports = {
  sequelize,
  User,
  Project,
  DataSource,
  Persona,
  Evaluation,
  PromptTemplate,
  Team,
  TeamMember,
  Survey,
  MarketingScript,
  ProductSuggestion
};
