-- 产品建议报告表
CREATE TABLE IF NOT EXISTS `product_suggestions` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `project_id` INT NOT NULL COMMENT '关联项目ID',
  `persona_id` INT COMMENT '关联画像ID',
  `name` VARCHAR(200) NOT NULL COMMENT '报告名称',
  `summary` TEXT COMMENT '建议摘要',
  `suggestions` JSON NOT NULL COMMENT '建议内容JSON',
  `priorities` JSON COMMENT '优先级配置',
  `competitor_analysis` JSON COMMENT '竞品分析',
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
