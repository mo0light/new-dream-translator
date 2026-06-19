# 梦境翻译官

AI 驱动的梦境分析 Web 应用。描述你的梦境，AI 会从弗洛伊德精神分析、荣格分析心理学和现代认知心理学角度进行深度解读。

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-cyan)

## 功能

- 🌙 梦境记录与整理
- 🧠 多维度心理学分析（弗洛伊德 / 荣格 / 认知心理学）
- ⭐ 梦境符号解读
- 📊 心理健康综合评分
- 💡 实用建议指导
- 📄 精美 HTML 报告（可打印为 PDF）
- 📜 历史梦境管理

## 快速开始

### 前置条件

- Node.js 18+ 或 Bun
- 任意 OpenAI 兼容 AI API 密钥

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env.local`，并填写你的 AI API 配置：

```bash
cp .env.example .env.local
```

在 `.env.local` 中设置：

```env
# 数据库（默认 SQLite，无需额外配置）
DATABASE_URL="file:./dev.db"

# AI 模型配置 — 支持任意 OpenAI 兼容 API
AI_API_KEY="your-api-key-here"
AI_BASE_URL="https://open.bigmodel.cn/api/paas/v4"
AI_MODEL="glm-4-flash"
```

**支持的 AI 服务（任选其一）：**

| 服务 | `AI_BASE_URL` | `AI_MODEL` 示例 | 申请地址 |
|------|--------------|----------------|---------|
| 智谱 AI (GLM) | `https://open.bigmodel.cn/api/paas/v4` | `glm-4-flash` | https://open.bigmodel.cn |
| DeepSeek | `https://api.deepseek.com/v1` | `deepseek-chat` | https://platform.deepseek.com |
| OpenAI | `https://api.openai.com/v1` | `gpt-4o-mini` | https://platform.openai.com |
| 本地 Ollama | `http://localhost:11434/v1` | `qwen2.5:7b` | https://ollama.com |

### 3. 初始化数据库

```bash
npm run db:push
```

### 4. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

## 构建与部署

### 本地构建

```bash
npm run build
npm run start
```

### Docker 部署

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run db:generate
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

ENV NODE_ENV=production
ENV DATABASE_URL="file:./prod.db"
EXPOSE 3000
CMD ["node", "server.js"]
```

### Vercel 部署

由于使用了 SQLite，Vercel 部署需要将数据库替换为 Turso 或 PlanetScale。可修改 `prisma/schema.prisma` 中的 `provider` 和 `DATABASE_URL`。

## 项目结构

```
src/
├── app/
│   ├── api/dreams/     # API 路由
│   ├── layout.tsx      # 根布局
│   └── page.tsx        # 主页面
├── components/dream/   # 梦境相关组件
├── lib/
│   ├── ai.ts           # 通用 AI 客户端（OpenAI 兼容）
│   ├── db.ts           # Prisma 数据库客户端
│   └── report-html.ts  # HTML 报告生成
└── types/
    └── dream.ts        # 类型定义
prisma/
└── schema.prisma       # 数据库模型
```

## 技术栈

- **框架**：Next.js 16 + TypeScript
- **样式**：Tailwind CSS 4 + shadcn/ui
- **动画**：Framer Motion
- **数据库**：SQLite + Prisma ORM
- **AI**：任意 OpenAI 兼容 API（通过 `fetch` 调用）

## 注意事项

- 梦境数据存储在本地 SQLite 数据库（`prisma/dev.db`），请定期备份
- AI 分析仅供参考，不构成专业心理诊断
- 报告生成为 HTML 格式，可在浏览器中通过 `Ctrl+P` 打印为 PDF
