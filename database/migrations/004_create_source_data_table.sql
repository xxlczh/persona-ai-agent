-- 数据源表 (source_data)
-- 用于存储用户上传的数据源信息

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
