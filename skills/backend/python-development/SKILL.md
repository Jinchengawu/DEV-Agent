---
name: python-development
description: Python 后端开发最佳实践和技能
tags: [backend, python, api, fastapi, sqlalchemy]
---

# Python 后端开发技能

## 触发条件

- 创建 Python API
- 设计数据库模型
- 实现业务逻辑
- 优化 Python 性能

## 执行步骤

1. **分析需求**
   - 理解 API 接口
   - 设计数据模型
   - 规划业务逻辑

2. **创建项目结构**
   ```bash
   # 创建项目目录
   mkdir -p src/{api,models,services,utils}
   touch src/__init__.py
   touch src/main.py
   
   # 创建依赖文件
   touch requirements.txt
   touch pyproject.toml
   ```

3. **实现 API**
   ```python
   # src/main.py
   from fastapi import FastAPI
   from src.api import auth, users
   
   app = FastAPI(title="API", version="1.0.0")
   
   app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
   app.include_router(users.router, prefix="/api/users", tags=["users"])
   ```

4. **实现数据模型**
   ```python
   # src/models/user.py
   from sqlalchemy import Column, String, Integer
   from src.database import Base
   
   class User(Base):
       __tablename__ = "users"
       
       id = Column(Integer, primary_key=True)
       name = Column(String(100), nullable=False)
       email = Column(String(255), unique=True, nullable=False)
   ```

## 最佳实践

### 项目结构
```
src/
├── api/              # API 路由
│   ├── __init__.py
│   ├── auth.py
│   └── users.py
├── models/           # 数据模型
│   ├── __init__.py
│   └── user.py
├── services/         # 业务逻辑
│   ├── __init__.py
│   └── user_service.py
├── utils/            # 工具函数
│   ├── __init__.py
│   └── helpers.py
├── database.py       # 数据库连接
└── main.py           # 应用入口
```

### 代码规范
- 使用 Type Hints
- 遵循 PEP 8
- 编写 docstrings
- 使用 Black 格式化

### 错误处理
```python
from fastapi import HTTPException

async def get_user(user_id: int):
    user = await db.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
```

### 安全实践
- 使用环境变量
- 输入验证
- SQL 注入防护
- CORS 配置

## 常见陷阱

1. **避免**
   - 同步阻塞操作
   - 硬编码配置
   - 忽略异常处理
   - 缺少日志记录

2. **正确做法**
   - 使用异步操作
   - 配置外部化
   - 完善错误处理
   - 结构化日志

## 示例代码

### FastAPI 路由
```python
from fastapi import APIRouter, Depends
from pydantic import BaseModel

router = APIRouter()

class UserCreate(BaseModel):
    name: str
    email: str

@router.post("/users")
async def create_user(user: UserCreate):
    # 创建用户逻辑
    return {"id": 1, "name": user.name, "email": user.email}
```

### SQLAlchemy 模型
```python
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True)
    created_at = Column(DateTime, default=datetime.utcnow)
```

---

**技能版本**：v1.0  
**最后更新**：2026-05-21
