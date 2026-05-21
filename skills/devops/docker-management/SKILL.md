---
name: docker-management
description: Docker 容器化最佳实践和技能
tags: [devops, docker, container, deployment]
---

# Docker 管理技能

## 触发条件

- 创建 Dockerfile
- 配置 Docker Compose
- 优化镜像构建
- 容器化部署

## 执行步骤

1. **分析应用**
   - 确定运行时依赖
   - 识别构建步骤
   - 规划多阶段构建

2. **创建 Dockerfile**
   ```dockerfile
   # 多阶段构建
   # 构建阶段
   FROM node:20-slim AS builder
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci
   COPY . .
   RUN npm run build
   
   # 运行阶段
   FROM node:20-slim AS runner
   WORKDIR /app
   COPY --from=builder /app/dist ./dist
   COPY --from=builder /app/node_modules ./node_modules
   EXPOSE 3000
   CMD ["node", "dist/index.js"]
   ```

3. **创建 Docker Compose**
   ```yaml
   # docker-compose.yml
   version: '3.8'
   
   services:
     app:
       build: .
       ports:
         - "3000:3000"
       environment:
         - NODE_ENV=production
       depends_on:
         - db
         - redis
     
     db:
       image: postgres:15
       environment:
         - POSTGRES_DB=myapp
         - POSTGRES_PASSWORD=secret
       volumes:
         - pgdata:/var/lib/postgresql/data
     
     redis:
       image: redis:alpine
   
   volumes:
     pgdata:
   ```

4. **构建和运行**
   ```bash
   # 构建镜像
   docker build -t myapp .
   
   # 运行容器
   docker run -p 3000:3000 myapp
   
   # 使用 Compose
   docker compose up -d
   ```

## 最佳实践

### Dockerfile 优化
- 使用多阶段构建
- 最小化层数
- 使用 .dockerignore
- 固定基础镜像版本
- 使用非 root 用户

### 安全实践
- 扫描漏洞（Trivy）
- 最小权限原则
- 不存储密钥
- 使用健康检查

### 镜像优化
```dockerfile
# 使用 alpine 镜像
FROM node:20-alpine

# 使用 distroless 镜像
FROM gcr.io/distroless/nodejs20-debian12
```

### 构建缓存
```dockerfile
# 先复制依赖文件
COPY package*.json ./
RUN npm ci

# 再复制源代码
COPY . .
```

## 常见陷阱

1. **避免**
   - 使用 latest 标签
   - 镜像过大
   - 明文存储密钥
   - 忽略健康检查

2. .dockerignore 示例
```
node_modules
.git
.env
*.md
tests
```

## 常用命令

### 镜像管理
```bash
# 构建镜像
docker build -t name:tag .

# 列出镜像
docker images

# 删除镜像
docker rmi image_id

# 推送镜像
docker push registry/name:tag
```

### 容器管理
```bash
# 运行容器
docker run -d -p 8080:80 --name mycontainer image

# 查看容器
docker ps -a

# 进入容器
docker exec -it container_id sh

# 查看日志
docker logs container_id
```

### Compose 管理
```bash
# 启动服务
docker compose up -d

# 停止服务
docker compose down

# 查看状态
docker compose ps

# 查看日志
docker compose logs -f
```

## 示例代码

### 生产级 Dockerfile
```dockerfile
# 阶段 1: 构建
FROM node:20-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

# 阶段 2: 运行
FROM node:20-slim AS runner
WORKDIR /app
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 appuser
COPY --from=builder --chown=appuser:nodejs /app/dist ./dist
COPY --from=builder --chown=appuser:nodejs /app/node_modules ./node_modules
USER appuser
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s \
  CMD curl -f http://localhost:3000/health || exit 1
CMD ["node", "dist/index.js"]
```

### 多服务 Compose
```yaml
version: '3.8'

services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./certs:/etc/nginx/certs
    depends_on:
      - app
  
  app:
    build: .
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/mydb
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis
  
  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=mydb
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
    volumes:
      - pgdata:/var/lib/postgresql/data
  
  redis:
    image: redis:alpine-alpine

volumes:
  pgdata:
```

---

**技能版本**：v1.0  
**最后更新**：2026-05-21
