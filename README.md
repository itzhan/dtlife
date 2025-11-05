This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## 功能概览

- 管理端：`/admin` 登录（ADMIN_USER / ADMIN_PASS），管理套餐、库存（核销码）、登录码
- 用户端：`/` 输入登录码，跳转到 `/order/[code]` 查看绑定套餐信息
- 数据库：PostgreSQL，Prisma 模型见 `prisma/schema.prisma`
- 认证：基于 Cookie 的轻量签名会话（`ADMIN_SESSION_SECRET`）

## Docker 启动

在仓库根目录执行：

```bash
docker compose up -d --build
```

默认端口：Web `http://localhost:3100`，Postgres `localhost:5432`。

环境变量（可在 `docker-compose.yml` 覆盖）：

- `ADMIN_USER`（默认 `admin`）
- `ADMIN_PASS`（默认 `changeme`）
- `ADMIN_SESSION_SECRET`（默认示例值，请修改为足够随机的字符串）

数据库连接：`DATABASE_URL=postgresql://postgres:postgres@db:5432/dtlife`

容器启动时会执行 `prisma db push` 同步表结构。

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
