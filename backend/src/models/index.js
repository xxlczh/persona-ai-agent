const sequelize = require('../config/database');
const User = require('./User');
const Project = require('./Project');
const DataSource = require('./DataSource');

// 建立关联关系
User.hasMany(Project, { foreignKey: 'owner_id', as: 'projects' });
Project.belongsTo(User, { foreignKey: 'owner_id', as: 'owner' });

// Project 与 DataSource 关联
Project.hasMany(DataSource, { foreignKey: 'project_id', as: 'dataSources' });
DataSource.belongsTo(Project, { foreignKey: 'project_id', as: 'project' });

module.exports = {
  sequelize,
  User,
  Project,
  DataSource
};
