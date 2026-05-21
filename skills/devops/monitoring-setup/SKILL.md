---
name: monitoring-setup
description: 监控和告警系统配置最佳实践
tags: [devops, monitoring, prometheus, grafana]
---

# 监控设置技能

## 触发条件

- 配置 Prometheus 监控
- 设置 Grafana 仪表板
- 创建告警规则
- 日志聚合

## Prometheus + Grafana

### Docker Compose 配置
```yaml
# docker-compose.monitoring.yml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
  
  grafana:
    image: grafana/grafana
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana_data:/var/lib/grafana
  
  node-exporter:
    image: prom/node-exporter
    ports:
      - "9100:9100"
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro

volumes:
  prometheus_data:
  grafana_data:
```

### Prometheus 配置
```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']
  
  - job_name: 'app'
    static_configs:
      - targets: ['app:8080']
    metrics_path: '/metrics'
```

### 告警规则
```yaml
# alerts.yml
groups:
  - name: app-alerts
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          
      - alert: HighLatency
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High latency detected"
```

## 应用指标

### Prometheus 指标
```python
# Python 示例
from prometheus_client import Counter, Histogram, Gauge

# 计数器
http_requests_total = Counter(
    'http_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status']
)

# 直方图
http_request_duration = Histogram(
    'http_request_duration_seconds',
    'HTTP request duration',
    ['method', 'endpoint']
)

# 仪表
active_connections = Gauge(
    'active_connections',
    'Number of active connections'
)
```

### 中间件
```python
# FastAPI 中间件
from fastapi import Request
import time

@app.middleware("http")
async def metrics_middleware(request: Request, call_next):
    start_time = time.time()
    
    response = await call_next(request)
    
    duration = time.time() - start_time
    http_request_duration.labels(
        method=request.method,
        endpoint=request.url.path
    ).observe(duration)
    
    http_requests_total.labels(
        method=request.method,
        endpoint=request.url.path,
        status=response.status_code
    ).inc()
    
    return response
```

## Grafana 仪表板

### 关键面板
- 请求速率 (RPS)
- 响应时间分布
- 错误率
- 活跃连接数
- CPU/内存使用率

### 导入仪表板
```bash
# 使用 API 导入
curl -X POST http://localhost:3000/api/dashboards/import \
  -H "Content-Type: application/json" \
  -d @dashboard.json
```

## 日志聚合

### ELK Stack
```yaml
# docker-compose.elk.yml
services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.10.0
    environment:
      - discovery.type=single-node
    ports:
      - "9200:9200"
  
  logstash:
    image: docker.elastic.co/logstash/logstash:8.10.0
    volumes:
      - ./logstash.conf:/usr/share/logstash/pipeline/logstash.conf
  
  kibana:
    image: docker.elastic.co/kibana/kibana:8.10.0
    ports:
      - "5601:5601"
```

---

**技能版本**：v1.0
