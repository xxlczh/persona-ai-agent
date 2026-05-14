/**
 * 项目访问权限检查辅助函数
 */
const { Project, Team, TeamMember } = require('../../models');

/**
 * 检查用户是否有项目访问权限
 * @param {number} projectId - 项目ID
 * @param {number} userId - 用户ID
 * @returns {Promise<{hasAccess: boolean, reason?: string}>}
 */
async function checkProjectAccess(projectId, userId) {
  const project = await Project.findByPk(projectId);

  if (!project) {
    return { hasAccess: false, reason: '项目不存在' };
  }

  // 项目所有者有权限
  if (project.owner_id === userId) {
    return { hasAccess: true };
  }

  // 管理员有权限
  // (管理员检查由调用方处理)

  // 检查团队成员权限 - 方式1: Project.team_id
  if (project.team_id) {
    const membership = await TeamMember.findOne({
      where: { team_id: project.team_id, user_id: userId }
    });
    if (membership) {
      return { hasAccess: true, role: membership.role };
    }
  }

  // 检查团队成员权限 - 方式2: Team.project_id (旧方式)
  const team = await Team.findOne({ where: { project_id: projectId } });
  if (team) {
    const membership = await TeamMember.findOne({
      where: { team_id: team.id, user_id: userId }
    });
    if (membership) {
      return { hasAccess: true, role: membership.role };
    }
  }

  return { hasAccess: false, reason: '没有权限访问此项目' };
}

module.exports = { checkProjectAccess };
