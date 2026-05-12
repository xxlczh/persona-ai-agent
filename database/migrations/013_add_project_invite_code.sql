-- 项目表添加邀请码字段
ALTER TABLE `projects` ADD COLUMN `invite_code` VARCHAR(32) UNIQUE COMMENT '邀请码' AFTER `status`;