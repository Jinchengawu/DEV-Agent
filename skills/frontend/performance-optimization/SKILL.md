---
name: performance-optimization
description: 前端性能优化最佳实践
tags: [frontend, performance, optimization, web-vitals]
---

# 前端性能优化技能

## 触发条件

- 优化页面加载速度
- 减少 Bundle 大小
- 提升运行时性能
- Core Web Vitals 优化

## 核心指标

### Core Web Vitals
- **LCP** (Largest Contentful Paint)：< 2.5s
- **FID** (First Input Delay)：< 100ms
- **CLS** (Cumulative Layout Shift)：< 0.1

## 优化策略

### 1. 代码分割
```typescript
// 动态导入
const LazyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <p>Loading...</p>,
  ssr: false
});

// 路由级分割
const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));
```

### 2. 图片优化
```html
<!-- 使用 next/image 或类似组件 -->
<img
  src="/image.jpg"
  alt="Description"
  width={800}
  height={600}
  loading="lazy"
  placeholder="blur"
/>

<!-- 使用 WebP 格式 -->
<picture>
  <source srcSet="/image.webp" type="image/webp" />
  <img src="/image.jpg" alt="Description" />
</picture>
```

### 3. 缓存策略
```typescript
// React Query / SWR
const { data } = useQuery({
  queryKey: ['posts'],
  queryFn: fetchPosts,
  staleTime: 5 * 60 * 1000, // 5 分钟
  cacheTime: 30 * 60 * 1000 // 30 分钟
});

// Service Worker
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
```

### 4. 虚拟化长列表
```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

function VirtualList({ items }) {
  const parentRef = useRef(null);
  
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
  });
  
  return (
    <div ref={parentRef} style={{ height: '400px', overflow: 'auto' }}>
      <div style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map((item) => (
          <div key={item.key} style={{ height: item.size }}>
            {items[item.index].name}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 5. 防抖和节流
```typescript
// 防抖
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// 节流
function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}
```

## Bundle 分析

```bash
# Next.js
ANALYZE=true npm run build

# webpack-bundle-analyzer
npx webpack-bundle-analyzer stats.json
```

## 监控工具

- Lighthouse
- Web Vitals Chrome Extension
- React DevTools Profiler
- Chrome DevTools Performance

---

**技能版本**：v1.0
