/**
 * 团队协作路由
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { success } = require('../utils/apiResponse');
const TeamService = require('../services/TeamService');

const teamService = new TeamService();

// 创建团队
router.post('/', authenticate, async (req, res) => {
  try {
    const { name, description } = req.body;
    const ownerId = req.user.id;

    const team = await teamService.create({ name, description, ownerId });
    success(res, team, '团队创建成功');
  } catch (error) {
    console.error('创建团队失败:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 获取用户的团队列表
router.get('/my', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const teams = await teamService.getUserTeams(userId);
    success(res, teams);
  } catch (error) {
    console.error('获取团队列表失败:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 获取团队详情
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const team = await teamService.getById(parseInt(id));

    if (!team) {
      return res.status(404).json({ success: false, message: '团队不存在' });
    }

    success(res, team);
  } catch (error) {
    console.error('获取团队详情失败:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 通过邀请码加入团队
router.post('/join', authenticate, async (req, res) => {
  try {
    const { inviteCode } = req.body;
    const userId = req.user.id;

    const team = await teamService.joinByInviteCode(inviteCode, userId);
    success(res, team, '成功加入团队');
  } catch (error) {
    console.error('加入团队失败:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 更新团队信息
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const team = await teamService.update(parseInt(id), req.body, userId);
    success(res, team, '团队信息更新成功');
  } catch (error) {
    console.error('更新团队失败:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 删除团队
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    await teamService.delete(parseInt(id), userId);
    success(res, null, '团队删除成功');
  } catch (error) {
    console.error('删除团队失败:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 移除团队成员
router.delete('/:id/members/:userId', authenticate, async (req, res) => {
  try {
    const { id, userId } = req.params;
    const operatorId = req.user.id;
    await teamService.removeMember(parseInt(id), parseInt(userId), operatorId);
    success(res, null, '成员移除成功');
  } catch (error) {
    console.error('移除成员失败:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 更新成员角色
router.put('/:id/members/:userId/role', authenticate, async (req, res) => {
  try {
    const { id, userId } = req.params;
    const { role } = req.body;
    const operatorId = req.user.id;
    const member = await teamService.updateMemberRole(parseInt(id), parseInt(userId), role, operatorId);
    success(res, member, '成员角色更新成功');
  } catch (error) {
    console.error('更新成员角色失败:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 离开团队
router.post('/:id/leave', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    await teamService.leaveTeam(parseInt(id), userId);
    success(res, null, '已离开团队');
  } catch (error) {
    console.error('离开团队失败:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 检查项目访问权限
router.get('/check-access/:projectId', authenticate, async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;
    const access = await teamService.checkProjectAccess(parseInt(projectId), userId);
    success(res, access);
  } catch (error) {
    console.error('检查访问权限失败:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 将项目分配给团队
router.post('/assign-project', authenticate, async (req, res) => {
  try {
    const { projectId, teamId } = req.body;
    const userId = req.user.id;
    const project = await teamService.assignProjectToTeam(projectId, teamId, userId);
    success(res, project, '项目已分配给团队');
  } catch (error) {
    console.error('分配项目失败:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
