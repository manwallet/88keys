<p align="center">
  <img src="public/favicon.svg" width="120" height="120" alt="88Keys Logo">
</p>

<h1 align="center">88Keys</h1>

<p align="center">
  <strong>🎹 Elegantly track your piano learning journey</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#docker">Docker</a> •
  <a href="#tech-stack">Tech Stack</a>
</p>

---

## Why 88Keys?

A standard piano has 88 keys, spanning from A0 to C8 across 7 complete octaves. Each key is a note, each piece is a journey.

**88Keys** helps you manage this journey — from the first note to a complete performance.

## ✨ Features

### 📚 Repertoire Management
- **Hierarchical Structure** - Support parent-child relationships for collections/pieces (e.g., "Chopin Études" → "Op.10 No.1")
- **Progress Tracking** - Track learning progress by page count, watch that progress bar turn green
- **Multi-dimensional Classification** - Organize by composer, era, difficulty, and status
- **Smart Search** - Quickly find any piece in your library

### 🎯 Daily Practice Suggestions
- **AI-Powered Recommendations** - Generate personalized practice plans based on your repertoire
- **Today's Focus** - Automatic recommendations for pieces to prioritize
- **Review Reminders** - Schedule review pieces to combat the forgetting curve
- **Custom Practice List** - Create your own daily practice checklist

### 📊 Learning Statistics
- **Overall Progress** - See your complete learning picture at a glance
- **Composer Distribution** - Discover which composers you favor
- **Era Preferences** - Baroque or Romantic? The data tells the story

### 📝 Lesson Records
- **Class Notes** - Record key points from each lesson
- **Piece Association** - Link pieces discussed in class
- **History Review** - Browse past lesson records anytime

### 🎯 Learning Goals
- **Goal Setting** - Set and track your musical objectives
- **AI-Generated Plans** - Get intelligent learning plans for your goals
- **Progress Monitoring** - Track your journey toward each goal

## 🚀 Quick Start

### Requirements
- Node.js 18+
- npm or pnpm

### Local Development

```bash
# Clone the repository
git clone https://github.com/xwchow/88keys.git
cd 88keys

# Install dependencies
npm install

# Initialize database
npx prisma generate
npx prisma db push

# Start development server
npm run dev
```

Open http://localhost:3000 to get started!

## 🐳 Docker

The easiest deployment method:

```bash
# Using Docker Compose
docker-compose up -d
```

Or build manually:

```bash
# Build image
docker build -t 88keys .

# Run container
docker run -d -p 3000:3000 -v 88keys-data:/app/prisma/db_mount 88keys
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | SQLite database path | `file:/app/prisma/db_mount/dev.db` |
| `OPENAI_API_KEY` | OpenAI API Key (optional, for AI suggestions) | - |
| `OPENAI_BASE_URL` | OpenAI API URL (optional) | - |

## 🛠 Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Database**: [SQLite](https://www.sqlite.org/) + [Prisma](https://www.prisma.io/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/)
- **Icons**: [Lucide](https://lucide.dev/)

## 📁 Project Structure

```
88keys/
├── prisma/           # Database schema & migrations
├── public/           # Static assets
├── src/
│   ├── app/          # Next.js App Router
│   │   ├── api/      # API routes
│   │   ├── lessons/  # Lesson records page
│   │   ├── pieces/   # Piece detail pages
│   │   └── settings/ # Settings page
│   ├── components/   # React components
│   └── lib/          # Utility functions
└── docker-compose.yml
```

## 🎵 Tips

1. **Use Parent-Child Relationships** - Set large collections (études, sonatas) as parent pieces, individual works as children
2. **Set Total Pages** - Set page counts on parent pieces; child progress aggregates automatically
3. **Daily Check-in** - Review AI suggestions daily to maintain practice consistency
4. **Track Your Practice** - Use the daily practice list to check off completed pieces

## 🤝 Contributing

Contributions welcome! Whether it's:
- 🐛 Bug reports
- 💡 Feature suggestions
- 📝 Documentation improvements
- 🔧 Pull requests

## 📄 License

[MIT License](LICENSE) - Use freely and enjoy!

---

<p align="center">
  <sub>Made with ❤️ and mass of ☕</sub>
</p>

<p align="center">
  <sub>May your music flow like poetry 🎶</sub>
</p>
