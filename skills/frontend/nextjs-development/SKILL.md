---
name: nextjs-development
description: Next.js 全栈开发最佳实践
tags: [frontend, nextjs, react, ssr, ssr]
---

# Next.js 开发技能

## 触发条件

- 创建 Next.js 应用
- 页面路由开发
- API Routes
- 数据获取

## 项目结构

```
src/
├── app/                # App Router
│   ├── layout.tsx      # 根布局
│   ├── page.tsx        # 首页
│   └── api/            # API Routes
├── components/         # 组件
├── lib/                # 工具函数
└── styles/             # 样式
```

## App Router

### 页面路由
```typescript
// app/page.tsx
export default function Home() {
  return <h1>Welcome to Next.js</h1>;
}

// app/about/page.tsx
export default function About() {
  return <h1>About Us</h1>;
}

// app/users/[id]/page.tsx
export default function UserPage({ params }: { params: { id: string } }) {
  return <h1>User {params.id}</h1>;
}
```

### 布局
```typescript
// app/layout.tsx
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

### 数据获取
```typescript
// app/posts/page.tsx
async function getPosts() {
  const res = await fetch('https://api.example.com/posts', {
    cache: 'no-store' // 或 'force-cache'
  });
  return res.json();
}

export default async function PostsPage() {
  const posts = await getPosts();
  
  return (
    <ul>
      {posts.map((post: any) => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  );
}
```

## API Routes

```typescript
// app/api/users/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  const users = await getUsers();
  return NextResponse.json(users);
}

export async function POST(request: Request) {
  const body = await request.json();
  const user = await createUser(body);
  return NextResponse.json(user, { status: 201 });
}
```

## Server Components

```typescript
// app/dashboard/page.tsx
import { Suspense } from 'react';

export default function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>
      <Suspense fallback={<div>Loading...</div>}>
        <RecentPosts />
      </Suspense>
    </div>
  );
}

async function RecentPosts() {
  const posts = await fetchRecentPosts();
  return (
    <ul>
      {posts.map((post: any) => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  );
}
```

## 最佳实践

### 性能优化
- 使用 Server Components
- 图片优化（next/image）
- 字体优化（next/font）
- 自动静态优化

### 数据获取
- Server Components 优先
- 使用 revalidation
- 客户端数据使用 SWR/React Query

### 部署
```bash
# Vercel
vercel deploy

# Docker
docker build -t nextjs-app .
docker run -p 3000:3000 nextjs-app
```

---

**技能版本**：v1.0
