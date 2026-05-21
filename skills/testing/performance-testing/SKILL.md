---
name: performance-testing
description: 性能测试和负载测试最佳实践
tags: [testing, performance, load-test, k6]
---

# 性能测试技能

## 触发条件

- 负载测试
- 压力测试
- 性能基准测试
- 容量规划

## K6 负载测试

### 安装
```bash
# macOS
brew install k6

# Docker
docker pull grafana/k6
```

### 基础测试
```javascript
// load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 20 },  // 爬坡
    { duration: '1m', target: 20 },   // 保持
    { duration: '30s', target: 0 },   // 下降
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% 请求 < 500ms
    http_req_failed: ['rate<0.01'],    // 错误率 < 1%
  },
};

export default function () {
  const res = http.get('http://localhost:3000/api/users');
  
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
  
  sleep(1);
}
```

### 场景测试
```javascript
// scenario-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    // 场景 1: 浏览用户
    browsing: {
      executor: 'constant-vus',
      vus: 10,
      duration: '5m',
    },
    // 场景 2: 购买用户
    purchasing: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 5 },
        { duration: '5m', target: 5 },
        { duration: '2m', target: 0 },
      ],
    },
  },
};

export default function () {
  const userType = __ENV.USER_TYPE || 'browsing';
  
  if (userType === 'browsing') {
    browseProducts();
  } else {
    purchaseProduct();
  }
}

function browseProducts() {
  const res = http.get('http://localhost:3000/api/products');
  check(res, { 'status is 200': (r) => r.status === 200 });
  sleep(2);
}

function purchaseProduct() {
  // 添加购物车
  const addRes = http.post('http://localhost:3000/api/cart', JSON.stringify({
    productId: 1,
    quantity: 1,
  }), { headers: { 'Content-Type': 'application/json' } });
  
  check(addRes, { 'added to cart': (r) => r.status === 201 });
  
  // 结账
  const checkoutRes = http.post('http://localhost:3000/api/checkout');
  check(checkoutRes, { 'checkout success': (r) => r.status === 200 });
  
  sleep(1);
}
```

## 运行测试

```bash
# 运行测试
k6 run load-test.js

# 带环境变量
K6_HOSTNAME=api.example.com k6 run load-test.js

# 输出到 InfluxDB
k6 run --out influxdb=http://localhost:8086/k6 load-test.js
```

## 性能指标

### 关键指标
- **响应时间**：P50, P95, P99
- **吞吐量**：RPS (Requests Per Second)
- **错误率**：失败请求百分比
- **并发用户数**：同时在线用户

### 基准目标
- 响应时间 P95 < 500ms
- 错误率 < 1%
- 吞吐量 > 100 RPS
- CPU 使用率 < 70%

## 报告分析

```bash
# 生成 HTML 报告
k6 run --out html=report.html load-test.js

# 使用 Grafana 可视化
k6 run --out influxdb=http://localhost:8086/k6 load-test.js
```

---

**技能版本**：v1.0
