---
name: pytest-development
description: Python pytest 测试开发最佳实践
tags: [testing, python, pytest, unit-test, tdd]
---

# pytest 测试开发技能

## 触发条件

- 编写单元测试
- 编写集成测试
- 测试覆盖率分析
- TDD 开发流程

## 执行步骤

1. **分析被测代码**
   - 理解函数/类功能
   - 识别输入输出
   - 确定边界条件

2. **创建测试结构**
   ```bash
   # 创建测试目录
   mkdir -p tests/{unit,integration}
   
   # 创建测试文件
   touch tests/unit/test_user_service.py
   touch tests/integration/test_api.py
   touch tests/conftest.py
   ```

3. **编写测试用例**
   ```python
   # tests/unit/test_user_service.py
   import pytest
   from src.services.user_service import UserService
   
   class TestUserService:
       def test_create_user(self):
           service = UserService()
           user = service.create_user(name="Test", email="test@example.com")
           assert user.name == "Test"
           assert user.email == "test@example.com"
       
       def test_create_user_invalid_email(self):
           service = UserService()
           with pytest.raises(ValueError):
               service.create_user(name="Test", email="invalid")
   ```

4. **运行测试**
   ```bash
   # 运行所有测试
   pytest
   
   # 运行特定文件
   pytest tests/unit/test_user_service.py
   
   # 运行并显示覆盖率
   pytest --cov=src --cov-report=html
   ```

## 最佳实践

### 测试组织
```
tests/
├── unit/               # 单元测试
│   ├── test_models.py
│   └── test_services.py
├── integration/        # 集成测试
│   └── test_api.py
├── conftest.py         # 共享 fixtures
└── pytest.ini          # pytest 配置
```

### 命名规范
- 测试文件：`test_<module>.py`
- 测试类：`Test<ClassName>`
- 测试函数：`test_<function_name>_<scenario>`

### Fixture 使用
```python
import pytest

@pytest.fixture
def user():
    return {"name": "Test User", "email": "test@example.com"}

@pytest.fixture
def client():
    from fastapi.testclient import TestClient
    from src.main import app
    return TestClient(app)

def test_get_user(client, user):
    response = client.get("/api/users/1")
    assert response.status_code == 200
```

### 参数化测试
```python
@pytest.mark.parametrize("input,expected", [
    ("test@example.com", True),
    ("invalid-email", False),
    ("", False),
])
def test_validate_email(input, expected):
    assert validate_email(input) == expected
```

## 常见陷阱

1. **避免**
   - 测试依赖外部服务
   - 测试之间有依赖
   - 忽略边界条件
   - 测试实现细节

2. **正确做法**
   - 使用 mock/patch
   - 每个测试独立
   - 测试边界和异常
   - 测试行为而非实现

## 测试覆盖率

### 配置
```ini
# pytest.ini
[pytest]
addopts = --cov=src --cov-report=html --cov-report=term
testpaths = tests
```

### 目标
- 行覆盖率：> 80%
- 分支覆盖率：> 70%
- 函数覆盖率：> 90%

## 示例代码

### Mock 外部依赖
```python
from unittest.mock import patch, MagicMock

def test_send_email():
    with patch('src.services.email_service.send') as mock_send:
        mock_send.return_value = True
        result = send_welcome_email(user_email="test@example.com")
        assert result == True
        mock_send.assert_called_once()
```

### 异步测试
```python
import pytest

@pytest.mark.asyncio
async def test_async_function():
    result = await async_function()
    assert result is not None
```

---

**技能版本**：v1.0  
**最后更新**：2026-05-21
