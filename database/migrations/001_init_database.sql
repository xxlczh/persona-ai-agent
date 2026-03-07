-- 用户画像语义模型开发 - 数据库初始化脚本
-- 创建数据库和基础表结构

-- 创建数据库
CREATE DATABASE IF NOT EXISTS persona_ai DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE persona_ai;

-- ============================================
-- 1. 用户表 (users)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT COMMENT '用户ID',
    username VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名',
    email VARCHAR(100) NOT NULL UNIQUE COMMENT '邮箱',
    password_hash VARCHAR(255) NOT NULL COMMENT '密码哈希',
    nickname VARCHAR(50) COMMENT '昵称',
    avatar_url VARCHAR(500) COMMENT '头像URL',
    role ENUM('admin', 'user', 'guest') DEFAULT 'user' COMMENT '角色',
    status ENUM('active', 'inactive', 'banned') DEFAULT 'active' COMMENT '状态',
    last_login_at DATETIME COMMENT '最后登录时间',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    deleted_at DATETIME COMMENT '删除时间',
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- ============================================
-- 2. 项目表 (projects)
-- ============================================
CREATE TABLE IF NOT EXISTS projects (
    id INT PRIMARY KEY AUTO_INCREMENT COMMENT '项目ID',
    user_id INT NOT NULL COMMENT '用户ID',
    name VARCHAR(100) NOT NULL COMMENT '项目名称',
    description TEXT COMMENT '项目描述',
    industry VARCHAR(50) COMMENT '行业',
    target_audience TEXT COMMENT '目标受众描述',
    settings JSON COMMENT '项目设置',
    status ENUM('draft', 'active', 'archived') DEFAULT 'draft' COMMENT '状态',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    deleted_at DATETIME COMMENT '删除时间',
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='项目表';

-- ============================================
-- 3. 数据源表 (source_data)
-- ============================================
CREATE TABLE IF NOT EXISTS source_data (
    id INT PRIMARY KEY AUTO_INCREMENT COMMENT '数据源ID',
    project_id INT NOT NULL COMMENT '项目ID',
    name VARCHAR(200) NOT NULL COMMENT '数据源名称',
    type ENUM('demographic', 'behavioral', 'text', 'transaction', 'social', 'other') NOT NULL COMMENT '数据类型',
    source_type ENUM('file', 'api', 'database', 'manual') DEFAULT 'file' COMMENT '来源类型',
    file_path VARCHAR(500) COMMENT '文件路径',
    file_size BIGINT COMMENT '文件大小(字节)',
    mime_type VARCHAR(100) COMMENT 'MIME类型',
    record_count INT COMMENT '记录数',
    data_schema JSON COMMENT '数据模式定义',
    data_preview JSON COMMENT '数据预览',
    processing_status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending' COMMENT '处理状态',
    error_message TEXT COMMENT '错误信息',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    deleted_at DATETIME COMMENT '删除时间',
    INDEX idx_project_id (project_id),
    INDEX idx_type (type),
    INDEX idx_processing_status (processing_status),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='数据源表';

-- ============================================
-- 4. 用户画像表 (personas)
-- ============================================
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

-- ============================================
-- 5. 生成日志表 (generation_logs)
-- ============================================
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

-- ============================================
-- 6. 评估记录表 (evaluations) - 扩展需求
-- ============================================
CREATE TABLE IF NOT EXISTS evaluations (
    id INT PRIMARY KEY AUTO_INCREMENT COMMENT '评估ID',
    persona_id INT NOT NULL COMMENT '画像ID',
    user_id INT NOT NULL COMMENT '用户ID',
    evaluation_type VARCHAR(50) COMMENT '评估类型',
    completeness_score DECIMAL(5,2) COMMENT '完整性评分',
    consistency_score DECIMAL(5,2) COMMENT '一致性评分',
    authenticity_score DECIMAL(5,2) COMMENT '真实性评分',
    actionability_score DECIMAL(5,2) COMMENT '可操作性评分',
    overall_score DECIMAL(5,2) COMMENT '综合评分',
    evaluation_details JSON COMMENT '评估详情',
    feedback TEXT COMMENT '用户反馈',
    model_used VARCHAR(50) COMMENT '评估使用的模型',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_persona_id (persona_id),
    INDEX idx_user_id (user_id),
    INDEX idx_overall_score (overall_score),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (persona_id) REFERENCES personas(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='评估记录表';

-- ============================================
-- 7. Prompt 模板表 (prompt_templates) - 扩展需求
-- ============================================
CREATE TABLE IF NOT EXISTS prompt_templates (
    id INT PRIMARY KEY AUTO_INCREMENT COMMENT '模板ID',
    name VARCHAR(100) NOT NULL COMMENT '模板名称',
    template_type VARCHAR(50) NOT NULL COMMENT '模板类型',
    content TEXT NOT NULL COMMENT '模板内容',
    description TEXT COMMENT '模板描述',
    variables JSON COMMENT '变量定义',
    version VARCHAR(20) DEFAULT '1.0' COMMENT '版本',
    is_active BOOLEAN DEFAULT TRUE COMMENT '是否启用',
    is_default BOOLEAN DEFAULT FALSE COMMENT '是否默认',
    usage_count INT DEFAULT 0 COMMENT '使用次数',
    created_by INT COMMENT '创建者ID',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    deleted_at DATETIME COMMENT '删除时间',
    INDEX idx_template_type (template_type),
    INDEX idx_is_active (is_active),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Prompt模板表';

-- 输出完成信息
SELECT 'Database initialization completed successfully!' AS status;
