# MGX Demo - AI Collaborative Development Platform

<div align="center">

**A Multi-Agent AI Collaboration Platform for Automated Software Development**

*Powered by 6 AI agents working together like a real software team*

[Features](#-features) • [Tech Stack](#-tech-stack) • [Quick Start](#-quick-start) • [Architecture](#-architecture) • [Documentation](#-documentation)

</div>

---

## 🚀 Overview

**MGX Demo** is an AI-driven collaborative development platform that demonstrates how multiple AI agents can work together to complete complex software development tasks through natural language instructions.

Inspired by products like [Devin](https://www.cognition-labs.com/devin), [MetaGPT](https://github.com/geekan/MetaGPT), and [v0.dev](https://v0.dev), this project showcases:

- ✨ **Multi-Agent Collaboration** - 6 specialized AI agents working as a team
- 🎯 **Full Development Lifecycle** - From requirements to deployment
- 🔄 **Real-time Streaming** - Watch agents think and execute in real-time
- 🏗️ **Master-Worker Pattern** - Intelligent task decomposition and parallel execution
- 🔗 **GitHub Integration** - Automatic code commits and branch management
- 💬 **Natural Language Interface** - Just chat with your AI team

---

## 👥 Meet Your AI Team

<table>
<tr>
<td align="center" width="120">
<img src="./frontend/public/images/Mike-TeamLeader-Avatar.BVQZLCeX.png" width="80" height="80" /><br />
<b>Mike</b><br />
<sub>Team Leader</sub>
</td>
<td align="center" width="120">
<img src="./frontend/public/images/Emma-ProductManager-Avatar.DAgh_sAa.png" width="80" height="80" /><br />
<b>Emma</b><br />
<sub>Product Manager</sub>
</td>
<td align="center" width="120">
<img src="./frontend/public/images/Bob-Architect-Avatar.Dwg49-6j.png" width="80" height="80" /><br />
<b>Bob</b><br />
<sub>Architect</sub>
</td>
<td align="center" width="120">
<img src="./frontend/public/images/Alex-Engineer-Avatar.DMF78Ta0.png" width="80" height="80" /><br />
<b>Alex</b><br />
<sub>Engineer</sub>
</td>
<td align="center" width="120">
<img src="./frontend/public/images/David-DataAnalyst-Avatar.JI1m4RZ8.png" width="80" height="80" /><br />
<b>David</b><br />
<sub>Data Analyst</sub>
</td>
</tr>
<tr>
<td align="center"><sub>Coordinates tasks<br/>and manages team</sub></td>
<td align="center"><sub>Analyzes requirements<br/>and writes PRDs</sub></td>
<td align="center"><sub>Designs system<br/>architecture</sub></td>
<td align="center"><sub>Develops and<br/>deploys apps</sub></td>
<td align="center"><sub>Processes and<br/>analyzes data</sub></td>
<td align="center"><sub>Conducts research<br/>and gathers info</sub></td>
</tr>
</table>

---

## ✨ Features

### 🎭 Two Collaboration Modes

- **Team Mode**: All 6 agents collaborate following software development SOP (Standard Operating Procedure)
- **Engineer Mode**: Direct interaction with Alex for quick prototyping

### 🧠 AI Capabilities

- **Multi-LLM Support**: OpenAI GPT-4, Claude, Gemini, DeepSeek
- **Streaming Responses**: Real-time token-by-token output
- **Context Management**: Long-term memory and conversation history
- **Tool Integration**: File operations, web search, code execution

### 🏗️ Project Management

- **GitHub Integration**: Automatic repository creation and code commits
- **Branch Management**: Feature branches with Pull Request workflow
- **Task Decomposition**: Master-Worker pattern for parallel execution
- **Progress Tracking**: Real-time status updates for each agent

### 💻 Developer Experience

- **Monaco Editor**: Built-in code editor with syntax highlighting
- **Markdown Rendering**: Beautiful documentation display
- **Real-time Sync**: Supabase Realtime for instant updates
- **Responsive UI**: Modern interface built with shadcn/ui

---

## 🛠 Tech Stack

### Frontend
- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: Zustand + React Context
- **Code Editor**: Monaco Editor
- **Markdown**: react-markdown + rehype plugins

### Backend
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Real-time**: Supabase Realtime
- **Storage**: Supabase Storage

### AI & Integrations
- **LLM Provider**: OpenRouter (multi-model support)
- **Version Control**: GitHub API (@octokit/rest)
- **Streaming**: Server-Sent Events (SSE)

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm/pnpm
- Supabase account (for backend)
- OpenRouter API key (for AI models)
- GitHub account (for code integration)

### 1. Clone the Repository

```bash
git clone https://github.com/max1874/mgx-demo.git
cd mgx-demo
```

### 2. Install Dependencies

```bash
cd frontend
npm install
# or
pnpm install
```

### 3. Configure Environment Variables

Create a `.env` file in the `frontend` directory:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenRouter API
VITE_OPENROUTER_API_KEY=your_openrouter_api_key

# GitHub Integration (optional)
VITE_GITHUB_TOKEN=your_github_personal_access_token
```

### 4. Set Up Supabase Database

Run the SQL migrations in the `supabase` directory to create necessary tables:

- `users` - User authentication
- `projects` - Project metadata
- `conversations` - Chat conversations
- `messages` - Chat messages
- `agents` - Agent status tracking

### 5. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:5173` to see the app in action!

---

## 🏛 Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        User Interface                        │
│              (React + TypeScript + Tailwind)                 │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                   Frontend Services                          │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   Agent     │  │     LLM      │  │   GitHub     │       │
│  │ Orchestrator│  │   Provider   │  │ Integration  │       │
│  └─────────────┘  └──────────────┘  └──────────────┘       │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                  Supabase Backend                            │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ PostgreSQL  │  │   Realtime   │  │     Auth     │       │
│  │  Database   │  │   Channels   │  │   Service    │       │
│  └─────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

### Master-Worker Pattern

```
User Request
     ↓
Master Conversation (Mike)
     ├─→ Task Analysis
     ├─→ Task Decomposition
     └─→ Worker Creation
          ├─→ Worker 1: Frontend (Emma → Bob → Alex)
          ├─→ Worker 2: Backend (Bob → Alex)
          └─→ Worker 3: Data Analysis (David)
               ↓
          Result Integration
               ↓
          Final Delivery
```

### Agent Collaboration Workflow

1. **User Input** → Natural language instruction
2. **Mike (Leader)** → Analyzes and decomposes tasks
3. **Emma (PM)** → Creates PRD and requirements
4. **Bob (Architect)** → Designs technical architecture
5. **Alex (Engineer)** → Implements code
6. **David (Analyst)** → Processes data if needed
7. **Iris (Researcher)** → Gathers external information
8. **Integration** → Combines results and delivers

---

## 📚 Documentation

This repository contains comprehensive documentation:

- **[PRD.md](./prd.md)** (309 lines) - Product Requirements Document
  - Product positioning and vision
  - Target users and user stories
  - Competitive analysis
  - Feature specifications

- **[PROJECT_DESIGN.md](./project_design.md)** (2004 lines) - Project Concept Design
  - Core architecture
  - Master-Worker pattern
  - GitHub integration strategy
  - Database schema

- **[SYSTEM_DESIGN.md](./system_design.md)** (789 lines) - System Architecture
  - Implementation approach
  - User interaction patterns
  - Component architecture
  - Error handling

- **[PLAN.md](./plan.md)** (879 lines) - Development Roadmap
  - Milestone breakdown
  - Task prioritization
  - Testing strategy
  - Deployment plan

- **[MGX_DOCUMENT.md](./mgx_document.md)** (1314 lines) - Product Documentation
  - Feature guides
  - User manual
  - Best practices

**Total**: 5,295 lines of detailed documentation

---

## 🎯 Use Cases

### 1. Web Development
Create and deploy personal portfolios, blogs, e-commerce sites, or landing pages through natural language.

### 2. Backend Integration
Automatically generate serverless backend architecture with Supabase integration.

### 3. Data Science
Perform data analysis and generate visualizations.

### 4. Version Control
Commit clean, modular code directly to GitHub or GitLab.

### 5. Learning & Research
Observe how AI agents collaborate and apply software engineering best practices.

---

## 🎨 Screenshots

> 💡 **Note**: Add screenshots of your application here to showcase the UI

```
[Main Chat Interface]
[Agent Status Panel]
[Code Editor View]
[Project Dashboard]
```

---

## 🗺 Roadmap

- [x] Multi-agent collaboration system
- [x] Real-time streaming responses
- [x] GitHub integration
- [x] Supabase backend
- [ ] Python, Go, Java language support
- [ ] Advanced code review features
- [ ] Deployment automation
- [ ] Plugin system for custom agents

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Inspired by [MGX](https://mgx.dev), [Devin](https://www.cognition-labs.com/devin), [MetaGPT](https://github.com/geekan/MetaGPT), and [v0.dev](https://v0.dev)
- Built with [Supabase](https://supabase.com), [OpenRouter](https://openrouter.ai), and [shadcn/ui](https://ui.shadcn.com)
- Agent avatars and UI design inspired by modern development tools

---

## 📧 Contact

**Max Lin** - [@max1874](https://github.com/max1874)

Project Link: [https://github.com/max1874/mgx-demo](https://github.com/max1874/mgx-demo)

---

<div align="center">

**⭐ Star this repo if you find it helpful!**

Made with ❤️ by AI enthusiasts

</div>
