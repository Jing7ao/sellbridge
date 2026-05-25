# 跨境电商 SaaS

东南亚多平台电商统一管理系统，支持 Shopify、Lazada、Shopee、TikTok Shop。

## ✨ 功能特性

- 📦 **商品上架**：一键同步上架到多个平台
- 🌍 **AI 翻译**：DeepSeek / Claude 智能翻译 + SEO 优化
- 📊 **价格监控**：竞品价格追踪 + 智能调价建议
- 💬 **AI 客服**：自动回复多语言咨询
- 📈 **数据统计**：实时数据看板 + 历史记录

## 🛠️ 支持平台

| 平台 | 市场 | 状态 |
|------|------|------|
| Shopify | 全球 | ✅ |
| Lazada | 泰国、越南、印尼、马来西亚、菲律宾、新加坡 | ✅ |
| Shopee | 泰国、越南、印尼、马来西亚、菲律宾、新加坡 | ✅ |
| TikTok Shop | 泰国、越南、印尼、马来西亚、菲律宾、新加坡 | ✅ |

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制模板文件：

```bash
cp .env.example .env.local
```

编辑 `.env.local`，填入你的 API 配置。

### 3. 启动开发服务器

```bash
npm run dev
```

打开浏览器访问：`http://localhost:3000`

## 📁 项目结构

```
cross-border-saas/
├── app/                  # Next.js App Router
│   ├── page.tsx         # 主页
│   └── api/             # API 路由
├── src/
│   ├── adapters/        # 各平台 API 适配器
│   │   ├── lazada/
│   │   ├── shopee/
│   │   ├── tiktok/
│   │   └── shopify/
│   └── engine/          # 核心引擎
│       ├── listing.ts   # 上架编排引擎
│       ├── translate.ts # AI 翻译引擎
│       └── price-monitor.ts # 价格监控引擎
├── package.json
└── README.md
```

## 🔧 配置说明

### AI 翻译配置

**使用 DeepSeek（推荐）：**

```env
ANTHROPIC_API_KEY=sk-xxxxxxxx
ANTHROPIC_BASE_URL=https://api.deepseek.com
```

**使用 Anthropic Claude：**

```env
ANTHROPIC_API_KEY=sk-ant-xxxxxxxx
ANTHROPIC_BASE_URL=https://api.anthropic.com
```

### 平台配置

每个平台支持多市场配置，按需填入对应的密钥即可。

## 📝 开发指南

### Mock 模式

即使没有配置真实的平台 API，系统也会自动使用模拟数据运行，方便开发和演示。

### 添加新市场

在 `src/adapters/{platform}/client.ts` 中添加新市场配置即可。

## 📄 License

MIT
