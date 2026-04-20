const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TeamMember = sequelize.define('TeamMember', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  team_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'team_id'
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id'
  },
  role: {
    type: DataTypes.ENUM('admin', 'member'),
    defaultValue: 'member'
  }
}, {
  tableName: 'team_members',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['team_id', 'user_id'], unique: true },
    { fields: ['user_id'] }
  ]
});

module.exports = TeamMember;
