/**
 * 团队协作服务
 * 管理团队创建、成员邀请、权限控制
 */

const { Team, TeamMember, Project, User } = require('../models');
const { Op } = require('sequelize');
const crypto = require('crypto');

class TeamService {
  /**
   * 创建团队
   */
  async create({ name, description, ownerId, projectId }) {
    let inviteCode;

    // 如果有项目，先获取或生成邀请码
    if (projectId) {
      // 检查项目是否已有团队
      const existing = await Team.findOne({ where: { project_id: projectId } });
      if (existing) {
        throw new Error('该项目已有一个团队');
      }

      // 获取项目信息
      const project = await Project.findByPk(projectId);

      if (project && project.invite_code) {
        // 项目已有邀请码，使用项目的
        inviteCode = project.invite_code;
      } else {
        // 项目没有邀请码，生成新的并更新项目
        inviteCode = crypto.randomBytes(4).toString('hex').toUpperCase();
        if (project) {
          project.invite_code = inviteCode;
          await project.save();
        }
      }
    } else {
      // 没有项目，生成新的邀请码
      inviteCode = crypto.randomBytes(4).toString('hex').toUpperCase();
    }

    const team = await Team.create({
      name,
      description,
      owner_id: ownerId,
      project_id: projectId || null,
      invite_code: inviteCode
    });

    // 创建者自动成为团队管理员
    await TeamMember.create({
      team_id: team.id,
      user_id: ownerId,
      role: 'admin'
    });

    // 转换为普通对象并确保 projectId 字段正确
    const plainTeam = team.toJSON();
    return {
      ...plainTeam,
      projectId: plainTeam.project_id
    };
  }

  /**
   * 获取用户的团队列表
   */
  async getUserTeams(userId) {
    // 作为团队所有者
    const ownedTeams = await Team.findAll({
      where: { owner_id: userId },
      include: [
        { model: TeamMember, as: 'members' }
      ]
    });

    // 作为团队成员
    const memberships = await TeamMember.findAll({
      where: { user_id: userId },
      include: [
        { model: Team, as: 'team', include: [{ model: User, as: 'owner', attributes: ['id', 'username', 'avatar'] }] }
      ]
    });

    const memberTeams = memberships.map(m => m.team);

    // 合并并去重
    const allTeams = [...ownedTeams];
    memberTeams.forEach(team => {
      if (!allTeams.find(t => t.id === team.id)) {
        allTeams.push(team);
      }
    });

    // 转换为普通对象并确保 projectId 字段正确
    return allTeams.map(team => {
      const plainTeam = team.toJSON ? team.toJSON() : team;
      return {
        ...plainTeam,
        projectId: plainTeam.project_id
      };
    });
  }

  /**
   * 获取团队详情
   */
  async getById(teamId) {
    const team = await Team.findByPk(teamId, {
      include: [
        { model: User, as: 'owner', attributes: ['id', 'username', 'email', 'avatar'] },
        { model: TeamMember, as: 'members', include: [{ model: User, as: 'user', attributes: ['id', 'username', 'email', 'avatar'] }] },
        { model: Project, as: 'project' }
      ]
    });

    if (!team) return null;

    // 转换并确保 projectId 字段正确
    const plainTeam = team.toJSON ? team.toJSON() : team;
    return {
      ...plainTeam,
      projectId: plainTeam.project_id
    };
  }

  /**
   * 通过邀请码加入团队
   */
  async joinByInviteCode(inviteCode, userId) {
    const team = await Team.findOne({
      where: { invite_code: inviteCode }
    });

    if (!team) {
      throw new Error('邀请码无效');
    }

    // 检查是否已是成员
    const existingMember = await TeamMember.findOne({
      where: { team_id: team.id, user_id: userId }
    });

    if (existingMember) {
      throw new Error('您已经是团队成员');
    }

    // 检查是否是团队所有者
    if (team.owner_id === userId) {
      throw new Error('您是团队所有者，无需加入');
    }

    // 添加为成员
    await TeamMember.create({
      team_id: team.id,
      user_id: userId,
      role: 'member'
    });

    return team;
  }

  /**
   * 更新团队信息
   */
  async update(teamId, data, userId) {
    const team = await Team.findByPk(teamId);
    if (!team) {
      throw new Error('团队不存在');
    }

    // 只有所有者可以更新
    if (team.owner_id !== userId) {
      throw new Error('只有团队所有者可以更新团队信息');
    }

    const allowedFields = ['name', 'description'];
    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        team[field] = data[field];
      }
    }

    await team.save();
    return team;
  }

  /**
   * 删除团队
   */
  async delete(teamId, userId) {
    const team = await Team.findByPk(teamId);
    if (!team) {
      throw new Error('团队不存在');
    }

    if (team.owner_id !== userId) {
      throw new Error('只有团队所有者可以删除团队');
    }

    await team.destroy();
    return { success: true };
  }

  /**
   * 移除团队成员
   */
  async removeMember(teamId, memberUserId, operatorId) {
    const team = await Team.findByPk(teamId);
    if (!team) {
      throw new Error('团队不存在');
    }

    if (team.owner_id !== operatorId) {
      throw new Error('只有团队所有者可以移除成员');
    }

    if (memberUserId === team.owner_id) {
      throw new Error('无法移除团队所有者');
    }

    const member = await TeamMember.findOne({
      where: { team_id: teamId, user_id: memberUserId }
    });

    if (!member) {
      throw new Error('该成员不在团队中');
    }

    await member.destroy();
    return { success: true };
  }

  /**
   * 更新成员角色
   */
  async updateMemberRole(teamId, memberUserId, newRole, operatorId) {
    const team = await Team.findByPk(teamId);
    if (!team) {
      throw new Error('团队不存在');
    }

    if (team.owner_id !== operatorId) {
      throw new Error('只有团队所有者可以更新成员角色');
    }

    if (memberUserId === team.owner_id) {
      throw new Error('无法修改团队所有者的角色');
    }

    const member = await TeamMember.findOne({
      where: { team_id: teamId, user_id: memberUserId }
    });

    if (!member) {
      throw new Error('该成员不在团队中');
    }

    member.role = newRole;
    await member.save();
    return member;
  }

  /**
   * 离开团队
   */
  async leaveTeam(teamId, userId) {
    const team = await Team.findByPk(teamId);
    if (!team) {
      throw new Error('团队不存在');
    }

    if (team.owner_id === userId) {
      throw new Error('团队所有者无法离开，请使用删除团队功能');
    }

    const member = await TeamMember.findOne({
      where: { team_id: teamId, user_id: userId }
    });

    if (!member) {
      throw new Error('您不是团队成员');
    }

    await member.destroy();
    return { success: true };
  }

  /**
   * 检查用户是否有团队项目的访问权限
   */
  async checkProjectAccess(projectId, userId) {
    const project = await Project.findByPk(projectId, {
      include: [{ model: Team, as: 'team' }]
    });

    if (!project) {
      return { hasAccess: false, reason: '项目不存在' };
    }

    // 项目创建者总有权限
    if (project.owner_id === userId) {
      return { hasAccess: true };
    }

    // 如果项目没有团队关联，检查设置
    if (!project.team_id) {
      // 如果设置为"仅自己可见"，则只有创建者有权限
      if (project.settings?.visibility === 'private') {
        return { hasAccess: false, reason: '项目仅创建者可见' };
      }
      return { hasAccess: true };
    }

    // 检查用户是否是团队成员
    const membership = await TeamMember.findOne({
      where: { team_id: project.team_id, user_id: userId }
    });

    if (!membership) {
      return { hasAccess: false, reason: '您不是该团队成员' };
    }

    return { hasAccess: true, role: membership.role };
  }

  /**
   * 将项目分配给团队
   */
  async assignProjectToTeam(projectId, teamId, userId) {
    const team = await Team.findByPk(teamId);
    if (!team) {
      throw new Error('团队不存在');
    }

    // 检查用户是否是团队成员
    const membership = await TeamMember.findOne({
      where: { team_id: teamId, user_id: userId }
    });

    if (!membership) {
      throw new Error('您不是该团队成员');
    }

    const project = await Project.findByPk(projectId);
    if (!project) {
      throw new Error('项目不存在');
    }

    project.team_id = teamId;
    await project.save();
    return project;
  }
}

module.exports = TeamService;
