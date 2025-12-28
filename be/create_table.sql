-- mysql -h ai_camp.mysql.dev-spatio-inc.com -uai_camp_dev_rw -pGW41v5K8mAJ8B4n4 prompt_admin   < ./be/create_table.sql

-- 创建数据库
CREATE DATABASE IF NOT EXISTS prompt_admin DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE prompt_admin;

-- 用户表
CREATE TABLE `users` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '用户ID',
  `username` varchar(50) NOT NULL COMMENT '用户名',
  `password` varchar(100) NOT NULL COMMENT '密码(加密)',
  `role` varchar(20) NOT NULL DEFAULT 'user' COMMENT '角色(superadmin/user)',
  `email` varchar(100) DEFAULT NULL COMMENT '邮箱',
  `status` tinyint NOT NULL DEFAULT '1' COMMENT '状态(0:禁用,1:启用)',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- 工作空间表
CREATE TABLE `workspaces` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '工作空间ID',
  `name` varchar(50) NOT NULL COMMENT '工作空间名称',
  `description` varchar(200) DEFAULT NULL COMMENT '工作空间描述',
  `admin_id` bigint NOT NULL COMMENT '管理员ID',
  `status` tinyint NOT NULL DEFAULT '1' COMMENT '状态(0:禁用,1:启用)',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_admin_id` (`admin_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='工作空间表';

-- 工作空间成员表
CREATE TABLE `workspace_members` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `workspace_id` bigint NOT NULL COMMENT '工作空间ID',
  `user_id` bigint NOT NULL COMMENT '用户ID',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_workspace_user` (`workspace_id`,`user_id`),
  KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='工作空间成员表';

-- 项目表
CREATE TABLE `projects` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '项目ID',
  `name` varchar(50) NOT NULL COMMENT '项目名称',
  `description` varchar(200) DEFAULT NULL COMMENT '项目描述',
  `workspace_id` bigint NOT NULL COMMENT '所属工作空间ID',
  `status` tinyint NOT NULL DEFAULT '1' COMMENT '状态(0:禁用,1:启用)',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_workspace_id` (`workspace_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='项目表';

-- 提示词表
CREATE TABLE `prompts` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '提示词ID',
  `name` varchar(100) NOT NULL COMMENT '提示词名称',
  `content` mediumtext NOT NULL COMMENT '提示词内容',
  `project_id` bigint NOT NULL COMMENT '所属项目ID',
  `status` tinyint NOT NULL DEFAULT '1' COMMENT '状态(0:禁用,1:启用)',
  `create_user_id` bigint NOT NULL COMMENT '创建用户ID',
  `update_user_id` bigint NOT NULL COMMENT '更新用户ID',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_project_id` (`project_id`),
  KEY `idx_create_user_id` (`create_user_id`),
  KEY `idx_update_user_id` (`update_user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='提示词表';

-- 提示词历史表
CREATE TABLE `prompt_histories` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '历史ID',
  `prompt_id` bigint NOT NULL COMMENT '提示词ID',
  `version` int NOT NULL COMMENT '版本号',
  `content` mediumtext NOT NULL COMMENT '提示词内容',
  `message` varchar(200) DEFAULT NULL COMMENT '变更说明',
  `user_id` bigint NOT NULL COMMENT '操作用户ID',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_prompt_id` (`prompt_id`),
  KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='提示词历史表';

-- 模型表
CREATE TABLE `models` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '模型ID',
  `name` varchar(50) NOT NULL COMMENT '模型名称',
  `description` varchar(200) DEFAULT NULL COMMENT '模型描述',
  `api_url` varchar(200) NOT NULL COMMENT '模型API地址',
  `api_key` varchar(200) DEFAULT NULL COMMENT '模型API密钥',
  `status` tinyint NOT NULL DEFAULT '1' COMMENT '状态(0:禁用,1:启用)',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='模型表';

-- 添加外键约束
ALTER TABLE `workspaces` 
  ADD CONSTRAINT `fk_workspace_admin` FOREIGN KEY (`admin_id`) REFERENCES `users` (`id`);

ALTER TABLE `workspace_members` 
  ADD CONSTRAINT `fk_member_workspace` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces` (`id`),
  ADD CONSTRAINT `fk_member_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

ALTER TABLE `projects` 
  ADD CONSTRAINT `fk_project_workspace` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces` (`id`);

ALTER TABLE `prompts` 
  ADD CONSTRAINT `fk_prompt_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`),
  ADD CONSTRAINT `fk_prompt_create_user` FOREIGN KEY (`create_user_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `fk_prompt_update_user` FOREIGN KEY (`update_user_id`) REFERENCES `users` (`id`);

ALTER TABLE `prompt_histories` 
  ADD CONSTRAINT `fk_history_prompt` FOREIGN KEY (`prompt_id`) REFERENCES `prompts` (`id`),
  ADD CONSTRAINT `fk_history_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`); 
