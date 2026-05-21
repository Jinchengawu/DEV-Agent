---
name: react-development
description: React 组件开发最佳实践和技能
tags: [frontend, react, component, hooks]
---

# React 开发技能

## 触发条件

- 创建 React 组件
- 修改现有 React 组件
- 优化 React 性能
- 实现 React 状态管理

## 执行步骤

1. **分析需求**
   - 理解组件功能
   - 确定 props 接口
   - 设计组件结构

2. **创建组件**
   ```bash
   # 创建组件目录
   mkdir -p src/components/ComponentName
   
   # 创建组件文件
   touch src/components/ComponentName/index.tsx
   touch src/components/ComponentName/ComponentName.tsx
   touch src/components/ComponentName/ComponentName.module.css
   touch src/components/ComponentName/__tests__/ComponentName.test.tsx
   ```

3. **实现组件**
   ```tsx
   import React from 'react';
   import styles from './ComponentName.module.css';
   
   interface ComponentNameProps {
     // 定义 props
   }
   
   export const ComponentName: React.FC<ComponentNameProps> = ({ ...props }) => {
     return (
       <div className={styles.container}>
         {/* 组件内容 */}
       </div>
     );
   };
   ```

4. **编写测试**
   ```tsx
   import { render, screen } from '@testing-library/react';
   import { ComponentName } from './ComponentName';
   
   describe('ComponentName', () => {
     it('renders correctly', () => {
       render(<ComponentName />);
       expect(screen.getByText('Expected Text')).toBeInTheDocument();
     });
   });
   ```

## 最佳实践

### 组件设计
- 使用函数组件和 Hooks
- 遵循单一职责原则
- 保持组件小而专注
- 使用 TypeScript 类型定义

### 状态管理
- 优先使用 useState/useReducer
- 复杂状态考虑 Zustand/Redux
- 避免 prop drilling
- 使用 Context 共享全局状态

### 性能优化
- 使用 React.memo 避免不必要渲染
- 使用 useMemo/useCallback 优化计算
- 虚拟化长列表
- 代码分割和懒加载

### 样式
- 使用 CSS Modules 或 Styled Components
- 遵循 BEM 命名规范
- 响应式设计
- 暗色模式支持

## 常见陷阱

1. **避免**
   - 在渲染中创建新对象/数组
   - 直接修改 state
   - 忘记清理 useEffect
   - 深层嵌套组件

2. **正确做法**
   - 使用展开运算符创建新对象
   - 使用 setState 函数式更新
   - 返回清理函数
   - 组件拆分和组合

## 示例代码

### 自定义 Hook
```tsx
import { useState, useEffect } from 'react';

export function useFetch<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    fetch(url)
      .then(res => res.json())
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [url]);
  
  return { data, loading, error };
}
```

### 表单组件
```tsx
import React, { useState } from 'react';

interface FormData {
  name: string;
  email: string;
}

export const UserForm: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submitted:', formData);
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={formData.name}
        onChange={e => setFormData({ ...formData, name: e.target.value })}
        placeholder="Name"
      />
      <input
        type="email"
        value={formData.email}
        onChange={e => setFormData({ ...formData, email: e.target.value })}
        placeholder="Email"
      />
      <button type="submit">Submit</button>
    </form>
  );
};
```

---

**技能版本**：v1.0  
**最后更新**：2026-05-21
