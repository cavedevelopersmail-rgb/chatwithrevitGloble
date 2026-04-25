# Compliance House Chat App

## Overview
A full-stack AI chat application built for UK Healthcare (NHS) professionals. Features the "Compliance House" AI agent — an intelligent assistant for NHS compliance, regulations, DBS checks, Right to Work, and professional communications.

## Tech Stack
- **Frontend**: React 19 + Vite + Material UI 7 + Tailwind CSS 4 + React Router 7
- **Backend**: Node.js + Express on port 8000
- **Database**: MongoDB via Mongoose (external, configured via MONGODB_URI secret)
- **AI**: OpenAI API with `@openai/agents` SDK (gpt-4o model with file search and web search tools)
- **Auth**: JWT-based authentication with bcryptjs password hashing

## Project Structure
```
client/         # React frontend (Vite, port 5000)
  src/
    components/ # Auth and Chat UI components
    services/   # API services (authService, chatService)
    App.jsx     # Main app + routing
server/         # Express backend (port 8000)
  config/       # MongoDB connection
  controllers/  # Route logic (auth, chat, conversations)
  middleware/   # JWT auth middleware
  models/       # Mongoose schemas
  routes/       # API route definitions
```

## Workflows
- **Start application**: `cd client && npm run dev` — Vite frontend on port 5000 (webview)
- **Backend API**: `cd server && npm start` — Express backend on port 8000 (console)

## Environment Variables / Secrets Required
- `MONGODB_URI` — MongoDB Atlas connection string
- `OPENAI_API_KEY` — OpenAI API key for the Compliance House agent
- `JWT_SECRET` — Secret key for signing JWT tokens

## Key Configuration
- Vite proxies `/api/*` requests to `http://localhost:8000` in development
- Frontend uses `VITE_API_URL` env var (defaults to `http://localhost:3010/api` fallback, but proxy handles dev routing)
- `allowedHosts: true` in Vite config for Replit iframe proxy compatibility

## AI Agent
The "Compliance House" agent is configured in `server/controllers/chatController.js`:
- Uses `gpt-4o` model
- Equipped with OpenAI file search (vector store) and web search tools
- Restricted web search to NHS/CQC domains
- Persona: UK NHS compliance expert with a WhatsApp-style communication approach
