---
name: database-design
description: 数据库设计和优化最佳实践
tags: [backend, database, sql, postgresql, mongodb]
---

# 数据库设计技能

## 触发条件

- 设计数据库 schema
- 优化查询性能
- 数据迁移
- 数据建模

## 关系型数据库

### PostgreSQL Schema 设计

```sql
-- 用户表
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 帖子表
CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content TEXT,
    author_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX idx_posts_author_id ON posts(author_id);
CREATE INDEX idx_users_email ON users(email);
```

### 索引策略

```sql
-- 单列索引
CREATE INDEX idx_users_email ON users(email);

-- 复合索引
CREATE INDEX idx_posts_author_created ON posts(author_id, created_at DESC);

-- 部分索引
CREATE INDEX idx_active_users ON users(email) WHERE active = true;

-- 覆盖索引
CREATE INDEX idx_posts_cover ON posts(author_id, title, created_at);
```

### 查询优化

```sql
-- 使用 EXPLAIN 分析
EXPLAIN ANALYZE SELECT * FROM posts WHERE author_id = 1;

-- 避免 SELECT *
SELECT id, title, created_at FROM posts WHERE author_id = 1;

-- 使用分页
SELECT * FROM posts 
ORDER BY created_at DESC 
LIMIT 20 OFFSET 40;

-- 使用 EXISTS 替代 IN
SELECT * FROM users u 
WHERE EXISTS (
    SELECT 1 FROM posts p WHERE p.author_id = u.id
);
```

## NoSQL (MongoDB)

### Schema 设计

```javascript
// 用户文档
{
  _id: ObjectId(),
  email: "user@example.com",
  name: "John",
  profile: {
    avatar: "url",
    bio: "Hello"
  },
  posts: [ObjectId("post1"), ObjectId("post2")],
  createdAt: ISODate()
}

// 帖子文档
{
  _id: ObjectId(),
  title: "My Post",
  content: "Content here",
  author: {
    _id: ObjectId(),
    name: "John",
    email: "john@example.com"
  },
  tags: ["tech", "programming"],
  createdAt: ISODate()
}
```

### 查询优化

```javascript
// 创建索引
db.users.createIndex({ email: 1 }, { unique: true });
db.posts.createIndex({ authorId: 1, createdAt: -1 });

// 使用投影
db.users.find({}, { email: 1, name: 1 });

// 聚合管道
db.posts.aggregate([
  { $match: { authorId: ObjectId("...") } },
  { $group: { _id: "$tag", count: { $sum: 1 } } },
  { $sort: { count: -1 } }
]);
```

## 最佳实践

### 数据建模
- 遵循第三范式（3NF）
- 适当反范式化提升查询性能
- 使用外键约束
- 合理选择数据类型

### 性能优化
- 分析慢查询
- 优化索引
- 使用连接池
- 读写分离

### 安全
- SQL 注入防护
- 数据加密
- 访问控制
- 审计日志

---

**技能版本**：v1.0
