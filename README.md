# Prompt Admin - 提示词管理平台

一个功能完善的企业级大模型提示词管理平台，支持提示词的版本控制、权限管理、工作空间协作和大模型API调用。

## ✨ 核心功能

### 1. 用户管理
- 🔐 用户注册、登录和认证
- 🏢 集成企业内部 LDAP 认证，实现单点登录
- 👥 用户角色管理（超级管理员、空间管理员、普通用户）
- 🎯 灵活的项目权限分配机制

### 2. 工作空间管理
- 📁 创建、编辑和删除工作空间
- 👨‍💼 设置工作空间管理员和成员
- 🗂️ 每个工作空间可包含多个项目
- 🔒 基于工作空间的权限隔离

### 3. 项目管理
- 📋 项目列表展示与管理
- ➕ 支持创建、编辑和删除项目
- 📊 每个项目包含多个提示词
- 🏗️ 项目归属于工作空间

### 4. 提示词管理
- 📝 支持最多 10 万个字符的提示词
- ✏️ 完整的 CRUD 操作（增加、修改、删除、查看）
- 📜 版本历史管理
  - 查看所有历史版本
  - 版本对比功能
  - 一键回滚到历史版本
- 🚀 基于提示词发起大模型 API 调用
- 📊 API 调用结果展示

### 5. 大模型管理
- 🤖 大模型列表管理
- ⚙️ 配置模型参数
  - 模型名称
  - 模型描述
  - API 地址
  - API 密钥
- 🔧 支持新增、编辑、删除模型配置

### 6. 权限管理
- 👑 **超级管理员**：系统全局管理权限
- 🏆 **空间管理员**：管理空间内的项目和用户权限
- 👤 **普通用户**：基础使用权限

## 🛠️ 技术栈

### 前端
- **框架**: React 18.2
- **UI 组件库**: Ant Design 5.4
- **路由**: React Router DOM 6.10
- **状态管理**: Zustand 4.3
- **HTTP 客户端**: Axios 1.3
- **代码编辑器**: Monaco Editor 4.6
- **构建工具**: React Scripts 5.0

### 后端
- **框架**: Spring Boot 2.7.5
- **数据库**: MySQL 8.0
- **ORM**: MyBatis-Plus 3.5.2
- **安全认证**: 
  - Spring Security
  - JWT (JJWT 0.9.1)
  - LDAP 集成
- **API 文档**: Swagger (Springfox 3.0.0)
- **工具库**: 
  - Lombok
  - Jackson 2.13.4

### 开发环境
- **Java**: 1.8
- **Node.js**: 推荐 14.x 或更高版本
- **数据库**: MySQL 8.0+

## 📁 项目结构

```
prompt-admin/
├── fe/                      # 前端项目
│   ├── public/             # 静态资源
│   ├── src/
│   │   ├── components/     # 公共组件
│   │   ├── pages/          # 页面组件
│   │   ├── services/       # API 服务
│   │   ├── stores/         # 状态管理
│   │   ├── hooks/          # 自定义 Hooks
│   │   ├── utils/          # 工具函数
│   │   ├── App.js          # 应用入口
│   │   └── index.js        # 入口文件
│   ├── package.json
│   └── vite.config.js
│
├── be/                      # 后端项目
│   ├── src/main/
│   │   ├── java/com/promptadmin/
│   │   │   ├── controller/ # 控制器
│   │   │   ├── service/    # 业务逻辑
│   │   │   ├── mapper/     # 数据访问
│   │   │   ├── entity/     # 实体类
│   │   │   ├── config/     # 配置类
│   │   │   └── security/   # 安全配置
│   │   └── resources/
│   │       └── application.yml
│   ├── pom.xml
│   ├── create_table.sql    # 数据库建表脚本
│   └── api.curl            # API 测试脚本
│
└── README.md               # 项目说明文档
```

## 🚀 快速开始

### 前置要求

- JDK 1.8+
- Node.js 14.x+
- MySQL 8.0+
- Maven 3.x

### 数据库初始化

```bash
# 连接到 MySQL 并创建数据库
mysql -u root -p

# 执行建表脚本
mysql -u root -p prompt_admin < ./be/create_table.sql
```

### 后端启动

```bash
# 进入后端目录
cd be

# 配置数据库连接
# 编辑 src/main/resources/application.yml
# 设置数据库连接信息、LDAP 配置等

# 使用 Maven 构建并启动
mvn clean install
mvn spring-boot:run

# 或者使用 IDE（如 IntelliJ IDEA）直接运行 Application 主类
```

后端服务默认运行在 `http://localhost:8086`

### 前端启动

```bash
# 进入前端目录
cd fe

# 安装依赖
npm install

# 启动开发服务器
npm start

# 构建生产版本
npm run build
```

前端服务默认运行在 `http://localhost:3000`

## 🔧 配置说明

### 后端配置 (application.yml)

```yaml
# 数据库配置
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/prompt_admin?useUnicode=true&characterEncoding=utf8mb4
    username: your_username
    password: your_password

# LDAP 配置
spring:
  ldap:
    urls: ldap://your-ldap-server:389
    base: dc=example,dc=com
    username: cn=admin,dc=example,dc=com
    password: admin_password

# JWT 配置
jwt:
  secret: your-secret-key
  expiration: 86400000
```

### 前端配置

前端代理配置已在 `package.json` 中设置：

```json
"proxy": "http://localhost:8086"
```

## 📊 数据库设计

主要数据表：

- **users**: 用户表
- **workspaces**: 工作空间表
- **workspace_members**: 工作空间成员关系表
- **projects**: 项目表
- **prompts**: 提示词表
- **prompt_histories**: 提示词历史版本表
- **models**: 大模型配置表

详细的表结构请查看 `be/create_table.sql`

## 🧪 API 测试

项目提供了 `be/api.curl` 文件，包含了常用的 API 测试用例，可以使用 curl 命令或 Postman 等工具进行测试。

## 📝 API 文档

启动后端服务后，可以访问 Swagger UI 查看完整的 API 文档：

```
http://localhost:8086/swagger-ui/index.html
```

## 🔐 安全性

- 使用 Spring Security 进行权限控制
- JWT Token 认证机制
- 密码加密存储
- LDAP 集成支持企业单点登录
- 细粒度的权限管理体系

## 📄 许可证

本项目采用 MIT 许可证

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📧 联系方式

如有问题或建议，请提交 Issue 或联系项目维护者。

---

**Made with ❤️ by Prompt Admin Team**
