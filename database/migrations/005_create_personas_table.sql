-- 用户画像表 (personas)
-- 用于存储生成的用户画像

CREATE TABLE IF NOT EXISTS personas (
    id INT PRIMARY KEY AUTO_INCREMENT COMMENT '画像ID',
    project_id INT NOT NULL COMMENT '项目ID',
    name VARCHAR(100) NOT NULL COMMENT '画像名称',
    persona_type VARCHAR(50) COMMENT '画像类型',
    demographic_data JSON COMMENT '人口统计数据',
    behavioral_data JSON COMMENT '行为特征数据',
    psychological_data JSON COMMENT '心理特征数据',
    needs_data JSON COMMENT '需求特征数据',
    scenario_data JSON COMMENT '场景特征数据',
    raw_response LONGTEXT COMMENT 'LLM原始响应',
    persona_data JSON NOT NULL COMMENT '完整画像数据',
    quality_score JSON COMMENT '质量评估分数',
    model_used VARCHAR(50) COMMENT '使用的模型',
    prompt_version VARCHAR(20) COMMENT 'Prompt版本',
    source_data_ids JSON COMMENT '关联的数据源IDs',
    status ENUM('draft', 'generated', 'validated', 'archived') DEFAULT 'draft' COMMENT '状态',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    deleted_at DATETIME COMMENT '删除时间',
    INDEX idx_project_id (project_id),
    INDEX idx_status (status),
    INDEX idx_persona_type (persona_type),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户画像表';
