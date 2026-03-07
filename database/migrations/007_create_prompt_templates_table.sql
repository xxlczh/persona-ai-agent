-- Prompt 模板表 (prompt_templates)
-- 用于存储用户画像生成的Prompt模板

CREATE TABLE IF NOT EXISTS prompt_templates (
    id INT PRIMARY KEY AUTO_INCREMENT COMMENT '模板ID',
    name VARCHAR(255) NOT NULL COMMENT '模板名称',
    description TEXT COMMENT '模板描述',
    category ENUM('demographic', 'behavioral', 'psychological', 'needs', 'scenario', 'comprehensive', 'custom') DEFAULT 'custom' COMMENT '模板分类',
    template_content TEXT NOT NULL COMMENT '模板内容',
    variables JSON COMMENT '模板变量列表',
    model_config JSON COMMENT '模型配置',
    is_active BOOLEAN DEFAULT TRUE COMMENT '是否启用',
    is_default BOOLEAN DEFAULT FALSE COMMENT '是否为默认模板',
    usage_count INT DEFAULT 0 COMMENT '使用次数',
    last_used_at DATETIME COMMENT '最后使用时间',
    created_by INT COMMENT '创建者ID',
    project_id INT COMMENT '项目ID（null表示全局模板）',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_project_id (project_id),
    INDEX idx_category (category),
    INDEX idx_is_default (is_default),
    INDEX idx_is_active (is_active),
    INDEX idx_created_by (created_by),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Prompt模板表';
