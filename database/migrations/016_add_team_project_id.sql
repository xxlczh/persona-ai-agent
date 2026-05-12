-- 团队表添加项目ID字段
ALTER TABLE `teams` ADD COLUMN `project_id` INT COMMENT '关联项目ID' AFTER `description`;