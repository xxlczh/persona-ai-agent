-- 营销脚本表
CREATE TABLE IF NOT EXISTS `marketing_scripts` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `project_id` INT NOT NULL COMMENT '关联项目ID',
  `persona_id` INT COMMENT '关联画像ID',
  `name` VARCHAR(200) NOT NULL COMMENT '脚本名称',
  `type` ENUM('video', 'copy', 'social', 'strategy') DEFAULT 'video' COMMENT '脚本类型',
  `content` JSON NOT NULL COMMENT '脚本内容JSON',
  `target_channels` JSON COMMENT '目标渠道',
  `duration` INT COMMENT '时长（秒），视频脚本用',
  `status` ENUM('draft', 'published', 'archived') DEFAULT 'draft',
  `usage_count` INT DEFAULT 0,
  `created_by` INT NOT NULL COMMENT '创建者ID',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_project_id` (`project_id`),
  INDEX `idx_persona_id` (`persona_id`),
  INDEX `idx_created_by` (`created_by`),
  FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`persona_id`) REFERENCES `personas`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
