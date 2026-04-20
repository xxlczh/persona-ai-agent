/**
 * 团队协作路由
 */

const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { success, errorWrapper } = require('../utils/apiResponse');
const TeamService = require('../services/TeamService');

const teamService = new TeamService();

// 创建团队
router.post('/', authMiddleware, errorWrapper(async (req, res) => {
  const { name, description } = req.body;
  const ownerId = req.user.id;

  const team = await teamService.create({ name, description, ownerId });
  success(res, team, '团队创建成功');
}));

// 获取用户的团队列表
router.get('/my', authMiddleware, errorWrapper(async (req, res) => {
  const userId = req.user.id;
  const teams = await teamService.getUserTeams(userId);
  success(res, teams);
}));

// 获取团队详情
router.get('/:id', authMiddleware, errorWrapper(async (req, res) => {
  const { id } = req.params;
  const team = await teamService.getById(parseInt(id));

  if (!team) {
    return res.status(404).json({ success: false, message: '团队不存在' });
  }

  success(res, team);
}));

// 通过邀请码加入团队
router.post('/join', authMiddleware, errorWrapper(async (req, res) => {
  const { inviteCode } = req.body;
  const userId = req.user.id;

  const team = await teamService.joinByInviteCode(inviteCode, userId);
  success(res, team, '成功加入团队');
}));

// 更新团队信息
router.put('/:id', authMiddleware, errorWrapper(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const team = await teamService.update(parseInt(id), req.body, userId);
  success(res, team, '团队信息更新成功');
}));

// 删除团队
router.delete('/:id', authMiddleware, errorWrapper(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  await teamService.delete(parseInt(id), userId);
  success(res, null, '团队删除成功');
}));

// 移除团队成员
router.delete('/:id/members/:userId', authMiddleware, errorWrapper(async (req, res) => {
  const { id, userId } = req.params;
  const operatorId = req.user.id;
  await teamService.removeMember(parseInt(id), parseInt(userId), operatorId);
  success(res, null, '成员移除成功');
}));

// 更新成员角色
router.put('/:id/members/:userId/role', authMiddleware, errorWrapper(async (req, res) => {
  const { id, userId } = req.params;
  const { role } = req.body;
  const operatorId = req.user.id;
  const member = await teamService.updateMemberRole(parseInt(id), parseInt(userId), role, operatorId);
  success(res, member, '成员角色更新成功');
}));

// 离开团队
router.post('/:id/leave', authMiddleware, errorWrapper(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  await teamService.leaveTeam(parseInt(id), userId);
  success(res, null, '已离开团队');
}));

// 检查项目访问权限
router.get('/check-access/:projectId', authMiddleware, errorWrapper(async (req, res) => {
  const { projectId } = req.params;
  const userId = req.user.id;
  const access = await teamService.checkProjectAccess(parseInt(projectId), userId);
  success(res, access);
}));

// 将项目分配给团队
router.post('/assign-project', authMiddleware, errorWrapper(async (req, res) => {
  const { projectId, teamId } = req.body;
  const userId = req.user.id;
  const project = await teamService.assignProjectToTeam(projectId, teamId, userId);
  success(res, project, '项目已分配给团队');
}));

module.exports = router;
