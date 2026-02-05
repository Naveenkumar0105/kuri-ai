# Kuri AI 🚀

A powerful AI-driven Task Manager app capable of breaking down complex tasks, organizing them, and syncing with Google Calendar.

## Features
- **AI Task Breakdown**: Automatically decomposes complex tasks into subtasks.
- **Voice Input**: Add tasks using your voice.
- **Smart Organization**: Categorizes tasks using LLMs.
- **Calendar Sync**: Sync tasks to Google Calendar manually or continuously.

## Getting Started

### Prerequisites
- Node.js 18+ installed on your machine.
- A Google Cloud Project with Calendar API enabled (for Calendar Sync).
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
# Database (Local SQLite for development)
DATABASE_URL="file:./dev.db"

# Authentication Secret (can be any random string)
NEXTAUTH_SECRET="secret123"

# Google Gemini API Key (for AI features)
GEMINI_API_KEY="your-gemini-api-key-here"

# Google Calendar Integration (Optional but recommended)
# Get these by creating a Service Account in Google Cloud Console
GOOGLE_SERVICE_ACCOUNT_EMAIL="your-service-account-email@..."
GOOGLE_CALENDAR_ID="primary"
GOOGLE_SERVICE_ACCOUNT_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
```

> **Note**: For the `GOOGLE_SERVICE_ACCOUNT_KEY`, make sure to include the full private key including the "BEGIN" and "END" lines. If you paste it into the .env file, ensure newlines are handled correctly (e.g., using `\n` if required or pasting inside quotes).

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
