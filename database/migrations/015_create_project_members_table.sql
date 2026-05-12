-- 项目成员表（用于记录加入的项目）
CREATE TABLE IF NOT EXISTS `project_members` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `project_id` INT NOT NULL COMMENT '项目ID',
  `user_id` INT NOT NULL COMMENT '用户ID',
  `joined_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '加入时间',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_project_user` (`project_id`, `user_id`),
  INDEX `idx_user_id` (`user_id`),
  FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;