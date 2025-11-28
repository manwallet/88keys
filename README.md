<p align="center">
  <img src="public/favicon.svg" width="120" height="120" alt="88Keys Logo">
</p>

<h1 align="center">88Keys</h1>

<p align="center">
  <strong>🎹 优雅地追踪你的钢琴学习之旅</strong>
</p>

<p align="center">
  <a href="#features">功能</a> •
  <a href="#quick-start">快速开始</a> •
  <a href="#docker">Docker 部署</a> •
  <a href="#tech-stack">技术栈</a>
</p>

---

## 为什么叫 88Keys？

因为标准钢琴有 88 个键，从 A0 到 C8，跨越 7 个完整的八度。每一个键都是一个音符，每一首曲子都是一段旅程。

**88Keys** 帮助你管理这段旅程——从第一个音符到完整演奏。

## ✨ Features

### 📚 曲库管理
- **层级结构** - 支持曲集/曲目的父子关系（比如「肖邦练习曲集」→「Op.10 No.1」）
- **进度追踪** - 按页数追踪学习进度，看着进度条慢慢变绿的感觉超棒
- **多维度分类** - 按作曲家、时期、难度、状态分类管理
- **智能搜索** - 快速找到任何曲目

### 🎯 每日练习建议
- **AI 智能建议** - 每天根据你的曲库生成个性化练习计划
- **今日重点** - 自动推荐今天应该重点练习的曲目
- **复习提醒** - 帮你安排复习曲目，遗忘曲线什么的交给我们

### 📊 学习统计
- **总体进度** - 一眼看清你的学习全貌
- **作曲家分布** - 看看你最爱哪位作曲家
- **时期偏好** - 巴洛克还是浪漫派？数据告诉你

### 📝 上课记录
- **课堂笔记** - 记录每次课的要点
- **曲目关联** - 关联当堂讲解的曲目
- **历史回顾** - 随时查看过往的课堂记录

## 🚀 Quick Start

### 环境要求
- Node.js 18+
- npm 或 pnpm

### 本地开发

```bash
# 克隆项目
git clone https://github.com/你的用户名/88keys.git
cd 88keys

# 安装依赖
npm install

# 初始化数据库
npx prisma generate
npx prisma db push

# 启动开发服务器
npm run dev
```

打开 http://localhost:3000 开始使用！

## 🐳 Docker

最简单的部署方式：

```bash
# 使用 Docker Compose
docker-compose up -d
```

或者手动构建：

```bash
# 构建镜像
docker build -t 88keys .

# 运行容器
docker run -d -p 3000:3000 -v 88keys-data:/app/data 88keys
```

### 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `DATABASE_URL` | SQLite 数据库路径 | `file:./data/piano.db` |
| `OPENAI_API_KEY` | OpenAI API Key（可选，用于 AI 建议） | - |
| `OPENAI_BASE_URL` | OpenAI API 地址（可选） | - |

## 🛠 Tech Stack

- **框架**: [Next.js 15](https://nextjs.org/) (App Router)
- **数据库**: [SQLite](https://www.sqlite.org/) + [Prisma](https://www.prisma.io/)
- **样式**: [Tailwind CSS](https://tailwindcss.com/)
- **UI 组件**: [shadcn/ui](https://ui.shadcn.com/)
- **图标**: [Lucide](https://lucide.dev/)

## 📁 项目结构

```
88keys/
├── prisma/           # 数据库 schema
├── public/           # 静态资源
├── src/
│   ├── app/          # Next.js App Router
│   │   ├── api/      # API 路由
│   │   ├── lessons/  # 上课记录页面
│   │   └── pieces/   # 曲目详情页面
│   ├── components/   # React 组件
│   └── lib/          # 工具函数
└── docker-compose.yml
```

## 🎵 使用技巧

1. **善用父子关系** - 把大型曲集（如练习曲集、奏鸣曲集）作为父曲目，单曲作为子曲目
2. **设置总页数** - 在父曲目设置总页数，子曲目的进度会自动汇总
3. **每日打卡** - 每天看看 AI 建议，保持练习规律

## 🤝 Contributing

欢迎贡献！无论是：
- 🐛 报告 Bug
- 💡 提出新功能建议
- 📝 改进文档
- 🔧 提交 PR

## 📄 License

[MIT License](LICENSE) - 随便用，开心就好！

---

<p align="center">
  <sub>Made with ❤️ and mass of ☕</sub>
</p>

<p align="center">
  <sub>愿你的琴声，如诗如歌 🎶</sub>
</p>
