---
name: go-development
description: Go 语言后端开发最佳实践
tags: [backend, go, golang, api]
---

# Go 开发技能

## 触发条件

- 创建 Go API
- 并发编程
- 微服务开发
- 性能优化

## 项目结构

```
cmd/
├── server/
│   └── main.go
internal/
├── handler/
├── service/
├── repository/
├── model/
pkg/
├── config/
├── logger/
go.mod
go.sum
```

## Gin 框架

```go
// cmd/server/main.go
package main

import (
    "github.com/gin-gonic/gin"
    "your-app/internal/handler"
    "your-app/internal/service"
)

func main() {
    r := gin.Default()
    
    // 依赖注入
    svc := service.NewUserService()
    h := handler.NewUserHandler(svc)
    
    // 路由
    r.GET("/users", h.List)
    r.GET("/users/:id", h.Get)
    r.POST("/users", h.Create)
    
    r.Run(":8080")
}
```

## Handler

```go
// internal/handler/user_handler.go
package handler

import (
    "net/http"
    "github.com/gin-gonic/gin"
    "your-app/internal/service"
)

type UserHandler struct {
    svc *service.UserService
}

func NewUserHandler(svc *service.UserService) *UserHandler {
    return &UserHandler{svc: svc}
}

func (h *UserHandler) List(c *gin.Context) {
    users, err := h.svc.ListUsers()
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    c.JSON(http.StatusOK, users)
}

func (h *UserHandler) Create(c *gin.Context) {
    var req CreateUserRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    
    user, err := h.svc.CreateUser(req)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    
    c.JSON(http.StatusCreated, user)
}
```

## 并发编程

```go
// Goroutine 和 Channel
func processItems(items []Item) []Result {
    results := make(chan Result, len(items))
    
    for _, item := range items {
        go func(i Item) {
            result := process(i)
            results <- result
        }(item)
    }
    
    var output []Result
    for i := 0; i < len(items); i++ {
        output = append(output, <-results)
    }
    
    return output
}

// WaitGroup
func parallelProcess(items []Item) {
    var wg sync.WaitGroup
    
    for _, item := range items {
        wg.Add(1)
        go func(i Item) {
            defer wg.Done()
            process(i)
        }(item)
    }
    
    wg.Wait()
}
```

## 最佳实践

### 错误处理
```go
// 自定义错误
type AppError struct {
    Code    int    `json:"code"`
    Message string `json:"message"`
}

func (e *AppError) Error() string {
    return e.Message
}

// 错误处理中间件
func ErrorHandler() gin.HandlerFunc {
    return func(c *gin.Context) {
        c.Next()
        
        if len(c.Errors) > 0 {
            err := c.Errors.Last().Err
            if appErr, ok := err.(*AppError); ok {
                c.JSON(appErr.Code, appErr)
            }
        }
    }
}
```

### 配置管理
```go
// pkg/config/config.go
package config

import "os"

type Config struct {
    Port string
    DBUrl string
}

func Load() *Config {
    return &Config{
        Port: getEnv("PORT", "8080"),
        DBUrl: getEnv("DATABASE_URL", ""),
    }
}

func getEnv(key, fallback string) string {
    if value, ok := os.LookupEnv(key); ok {
        return value
    }
    return fallback
}
```

### 测试
```go
// internal/handler/user_handler_test.go
package handler

import (
    "testing"
    "net/http/httptest"
    "github.com/gin-gonic/gin"
)

func TestListUsers(t *testing.T) {
    svc := NewMockUserService()
    h := NewUserHandler(svc)
    
    router := gin.New()
    router.GET("/users", h.List)
    
    req := httptest.NewRequest("GET", "/users", nil)
    w := httptest.NewRecorder()
    
    router.ServeHTTP(w, req)
    
    if w.Code != http.StatusOK {
        t.Errorf("expected 200, got %d", w.Code)
    }
}
```

---

**技能版本**：v1.0
