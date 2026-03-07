-- 生成日志表 (generation_logs)
-- 用于记录画像生成过程

CREATE TABLE IF NOT EXISTS generation_logs (
    id INT PRIMARY KEY AUTO_INCREMENT COMMENT '日志ID',
    project_id INT NOT NULL COMMENT '项目ID',
    persona_id INT COMMENT '画像ID',
    user_id INT NOT NULL COMMENT '用户ID',
    model_used VARCHAR(50) NOT NULL COMMENT '使用的模型',
    prompt_template VARCHAR(100) COMMENT '使用的Prompt模板',
    prompt_version VARCHAR(20) COMMENT 'Prompt版本',
    input_data JSON COMMENT '输入数据',
    output_data LONGTEXT COMMENT '输出数据',
    tokens_used INT COMMENT '消耗的Token数',
    duration_ms INT COMMENT '生成耗时(毫秒)',
    status ENUM('pending', 'processing', 'success', 'failed', 'cancelled') DEFAULT 'pending' COMMENT '状态',
    error_message TEXT COMMENT '错误信息',
    error_code VARCHAR(50) COMMENT '错误码',
    metadata JSON COMMENT '元数据',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_project_id (project_id),
    INDEX idx_persona_id (persona_id),
    INDEX idx_user_id (user_id),
    INDEX idx_model_used (model_used),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (persona_id) REFERENCES personas(id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='生成日志表';
