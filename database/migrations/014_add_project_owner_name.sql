-- 项目表添加所有者名称字段（冗余存储，避免频繁关联查询）
ALTER TABLE `projects` ADD COLUMN `owner_name` VARCHAR(100) COMMENT '所有者名称' AFTER `owner_id`;