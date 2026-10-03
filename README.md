# Kuri AI 🚀

A powerful AI-driven Task Manager app for breaking down and organizing complex tasks.

## Features
- **AI Task Breakdown**: Automatically decomposes complex tasks into subtasks.
- **Voice Input**: Add tasks using your voice.
- **Smart Organization**: Categorizes tasks using LLMs.

## Getting Started

### Prerequisites
- Node.js 18+ installed on your machine.
- A PostgreSQL database (Supabase or another PostgreSQL provider).
- A Gemini API Key (for AI features).

### 1. Clone the Repository
```bash
git clone https://github.com/Naveenkumar0105/kuri-ai.git
cd note-ai
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup (Critical!)
Create a file named `.env` in the root folder (`note-ai/`) and add the following keys:

```env
# PostgreSQL database (use a development project locally, never production data)
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require"

# Authentication Secret (can be any random string)
NEXTAUTH_SECRET="secret123"

# Google Gemini API Key (for AI features)
GEMINI_API_KEY="your-gemini-api-key-here"

```

### 4. Initialize Database
```bash
npx prisma generate
npx prisma db push
```

### 5. Run the App
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.
