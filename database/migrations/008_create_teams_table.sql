-- 团队管理表
CREATE TABLE IF NOT EXISTS `teams` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL COMMENT '团队名称',
  `description` TEXT COMMENT '团队描述',
  `owner_id` INT NOT NULL COMMENT '创建者ID',
  `invite_code` VARCHAR(32) UNIQUE COMMENT '邀请码',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_owner_id` (`owner_id`),
  INDEX `idx_invite_code` (`invite_code`),
  FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
