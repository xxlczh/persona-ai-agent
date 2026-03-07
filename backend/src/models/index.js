const sequelize = require('../config/database');
const User = require('./User');
const Project = require('./Project');

// 建立关联关系
User.hasMany(Project, { foreignKey: 'owner_id', as: 'projects' });
Project.belongsTo(User, { foreignKey: 'owner_id', as: 'owner' });

module.exports = {
  sequelize,
  User,
  Project
};
