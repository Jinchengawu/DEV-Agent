---
name: security-testing
description: 安全测试和漏洞扫描最佳实践
tags: [testing, security, owasp, vulnerability]
---

# 安全测试技能

## 触发条件

- 安全审计
- 漏洞扫描
- 渗透测试
- OWASP 检查

## OWASP Top 10

### 1. 注入攻击防护
```python
# SQL 注入防护
# ❌ 不安全
query = f"SELECT * FROM users WHERE id = {user_id}"

# ✅ 安全
query = "SELECT * FROM users WHERE id = %s"
cursor.execute(query, (user_id,))
```

### 2. 身份认证加固
```python
# 密码哈希
import bcrypt

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())
```

### 3. 敏感数据保护
```python
# 环境变量存储密钥
import os

API_KEY = os.getenv('API_KEY')
DB_PASSWORD = os.getenv('DB_PASSWORD')

# 数据加密
from cryptography.fernet import Fernet

key = Fernet.generate_key()
cipher = Fernet(key)

encrypted = cipher.encrypt(b"sensitive data")
decrypted = cipher.decrypt(encrypted)
```

## 扫描工具

### 依赖扫描
```bash
# npm audit
npm audit
npm audit fix

# safety (Python)
pip install safety
safety check

# trivy (容器)
trivy image myapp:latest
```

### 静态分析
```bash
# bandit (Python)
pip install bandit
bandit -r src/

# eslint-plugin-security
npm install --save-dev eslint-plugin-security
```

### 动态扫描
```bash
# OWASP ZAP
docker run -t owasp/zap2docker-stable zap-baseline.py \
  -t http://localhost:3000

# nikto
nikto -h http://localhost:3000
```

## 安全测试用例

```python
# SQL 注入测试
def test_sql_injection():
    response = client.get("/api/users?id=1' OR '1'='1")
    assert response.status_code == 400

# XSS 测试
def test_xss():
    response = client.post("/api/comments", json={
        "content": "<script>alert('xss')</script>"
    })
    assert "<script>" not in response.json()["content"]

# CSRF 测试
def test_csrf():
    response = client.post("/api/transfer", json={
        "amount": 100
    })
    assert response.status_code == 403  # 缺少 CSRF token
```

## 安全清单

- [ ] 输入验证和输出编码
- [ ] 参数化查询
- [ ] 身份认证和授权
- [ ] 敏感数据加密
- [ ] HTTPS 配置
- [ ] 安全头部配置
- [ ] 依赖漏洞扫描
- [ ] 日志和监控

---

**技能版本**：v1.0
