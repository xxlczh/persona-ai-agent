/**
 * 批量生成队列服务
 * 管理批量生成任务队列和进度跟踪
 */

const { v4: uuidv4 } = require('uuid');
const { Persona, Project, DataSource } = require('../models');
const PersonaGenerationService = require('./PersonaGenerationService');

// 内存队列存储
const batchQueue = new Map();

class BatchGenerationService {
  /**
   * 创建批量生成任务
   * @param {number} projectId - 项目ID
   * @param {Array<Object>} tasks - 批量生成任务列表
   * @param {Object} config - 生成配置
   * @returns {Promise<Object>} - 批量任务信息
   */
  async createBatch(projectId, tasks, config = {}) {
    // 验证项目
    const project = await Project.findByPk(projectId);
    if (!project) {
      throw new Error('项目不存在');
    }

    // 验证每个任务的数据源
    for (const task of tasks) {
      if (!task.sourceDataIds || !Array.isArray(task.sourceDataIds) || task.sourceDataIds.length === 0) {
        throw new Error(`任务 ${task.name || '未命名'} 缺少数据源`);
      }
    }

    // 创建批次ID
    const batchId = uuidv4();

    // 创建批次记录
    const batch = {
      id: batchId,
      projectId,
      tasks: tasks.map((task, index) => ({
        id: index + 1,
        name: task.name || `画像${index + 1}`,
        sourceDataIds: task.sourceDataIds,
        status: 'pending',
        personaId: null,
        error: null,
        progress: 0
      })),
      config,
      status: 'pending', // pending | running | completed | failed
      total: tasks.length,
      completed: 0,
      failed: 0,
      progress: 0,
      createdAt: new Date(),
      startedAt: null,
      completedAt: null,
      results: []
    };

    // 存储批次
    batchQueue.set(batchId, batch);

    // 异步执行批量生成
    this.executeBatch(batchId).catch(err => {
      console.error('批量生成执行失败:', err);
    });

    return {
      batchId,
      total: batch.total,
      status: batch.status
    };
  }

  /**
   * 执行批量生成任务
   * @param {string} batchId - 批次ID
   */
  async executeBatch(batchId) {
    const batch = batchQueue.get(batchId);
    if (!batch) {
      throw new Error('批次不存在');
    }

    batch.status = 'running';
    batch.startedAt = new Date();

    const personaService = new PersonaGenerationService();

    for (let i = 0; i < batch.tasks.length; i++) {
      const task = batch.tasks[i];

      try {
        task.status = 'running';
        task.progress = 10;
        this.updateBatchProgress(batchId);

        // 生成画像
        const persona = await personaService.generate(
          batch.projectId,
          task.sourceDataIds,
          {
            ...batch.config,
            name: task.name
          }
        );

        task.status = 'completed';
        task.progress = 100;
        task.personaId = persona.id;
        batch.completed++;
        batch.results.push(persona);

      } catch (error) {
        task.status = 'failed';
        task.error = error.message;
        task.progress = 0;
        batch.failed++;
      }

      this.updateBatchProgress(batchId);
    }

    // 更新最终状态
    const completedBatch = batchQueue.get(batchId);
    if (completedBatch.failed === completedBatch.total) {
      completedBatch.status = 'failed';
    } else if (completedBatch.completed === completedBatch.total) {
      completedBatch.status = 'completed';
    } else {
      completedBatch.status = 'partial';
    }
    completedBatch.completedAt = new Date();
  }

  /**
   * 更新批次进度
   * @param {string} batchId - 批次ID
   */
  updateBatchProgress(batchId) {
    const batch = batchQueue.get(batchId);
    if (!batch) return;

    const totalProgress = batch.tasks.reduce((sum, task) => {
      if (task.status === 'completed') return sum + 100;
      if (task.status === 'running') return sum + task.progress;
      if (task.status === 'failed') return sum + 0;
      return sum;
    }, 0);

    batch.progress = Math.round(totalProgress / batch.total);
  }

  /**
   * 获取批次状态
   * @param {string} batchId - 批次ID
   * @returns {Object} - 批次状态
   */
  getBatchStatus(batchId) {
    const batch = batchQueue.get(batchId);
    if (!batch) {
      return null;
    }

    return {
      id: batch.id,
      status: batch.status,
      total: batch.total,
      completed: batch.completed,
      failed: batch.failed,
      progress: batch.progress,
      createdAt: batch.createdAt,
      startedAt: batch.startedAt,
      completedAt: batch.completedAt,
      tasks: batch.tasks.map(task => ({
        id: task.id,
        name: task.name,
        status: task.status,
        progress: task.progress,
        personaId: task.personaId,
        error: task.error
      }))
    };
  }

  /**
   * 获取批次结果
   * @param {string} batchId - 批次ID
   * @returns {Object} - 批次结果
   */
  async getBatchResults(batchId) {
    const batch = batchQueue.get(batchId);
    if (!batch) {
      return null;
    }

    // 获取完整的画像数据
    const results = [];
    for (const task of batch.tasks) {
      if (task.personaId) {
        const persona = await Persona.findByPk(task.personaId, {
          include: [
            { model: Project, as: 'project', attributes: ['id', 'name'] }
          ]
        });
        results.push(persona);
      }
    }

    return {
      id: batch.id,
      status: batch.status,
      total: batch.total,
      completed: batch.completed,
      failed: batch.failed,
      results
    };
  }

  /**
   * 获取项目的所有批次
   * @param {number} projectId - 项目ID
   * @returns {Array} - 批次列表
   */
  getProjectBatches(projectId) {
    const batches = [];
    for (const [id, batch] of batchQueue) {
      if (batch.projectId === projectId) {
        batches.push({
          id: batch.id,
          status: batch.status,
          total: batch.total,
          completed: batch.completed,
          failed: batch.failed,
          progress: batch.progress,
          createdAt: batch.createdAt,
          completedAt: batch.completedAt
        });
      }
    }
    return batches.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  /**
   * 取消批次
   * @param {string} batchId - 批次ID
   * @returns {boolean} - 是否成功
   */
  cancelBatch(batchId) {
    const batch = batchQueue.get(batchId);
    if (!batch) {
      return false;
    }

    if (batch.status === 'running') {
      // 标记为已取消，正在运行的任务会继续完成
      batch.status = 'cancelled';
      return true;
    }

    return false;
  }
}

module.exports = new BatchGenerationService();
