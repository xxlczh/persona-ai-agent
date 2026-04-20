-- 用研问卷表
CREATE TABLE IF NOT EXISTS `surveys` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `project_id` INT NOT NULL COMMENT '关联项目ID',
  `persona_id` INT COMMENT '关联画像ID',
  `name` VARCHAR(200) NOT NULL COMMENT '问卷名称',
  `description` TEXT COMMENT '问卷描述',
  `target_audience` VARCHAR(500) COMMENT '目标受众描述',
  `questions` JSON NOT NULL COMMENT '问卷问题JSON',
  `settings` JSON COMMENT '问卷设置（长度、题型等）',
  `status` ENUM('draft', 'published', 'archived') DEFAULT 'draft',
  `usage_count` INT DEFAULT 0 COMMENT '使用次数',
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
