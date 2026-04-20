-- 团队成员表
CREATE TABLE IF NOT EXISTS `team_members` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `team_id` INT NOT NULL COMMENT '团队ID',
  `user_id` INT NOT NULL COMMENT '用户ID',
  `role` ENUM('admin', 'member') DEFAULT 'member' COMMENT '团队角色',
  `joined_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_team_user` (`team_id`, `user_id`),
  INDEX `idx_user_id` (`user_id`),
  FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
