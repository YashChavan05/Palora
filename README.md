<div align="center">

# 🌸 Palora — AI Companion Platform

### *Build emotional connections with personalized AI companions powered by real-time voice, memory, and empathy*

<br/>

[![Live Demo](https://img.shields.io/badge/🚀%20Live%20Demo-paloracom.vercel.app-6366f1?style=for-the-badge&logo=vercel&logoColor=white)](https://paloracom.vercel.app)
[![API Docs](https://img.shields.io/badge/📖%20API%20Docs-Swagger%20UI-10b981?style=for-the-badge&logo=fastapi&logoColor=white)](https://palora-i44h.onrender.com/docs)
[![Backend Status](https://img.shields.io/badge/Backend-Live%20on%20Render-0ea5e9?style=for-the-badge&logo=render&logoColor=white)](https://palora-i44h.onrender.com)

<br/>

![Python](https://img.shields.io/badge/Python-3.11.9-3776AB?style=flat-square&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.110-009688?style=flat-square&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-18.3-61DAFB?style=flat-square&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat-square&logo=typescript&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)

<br/>

> **Palora** is a full-stack AI companion platform that lets users create deeply personalized companions with custom personalities, persistent memory, real-time voice conversations, and emotion-aware responses — all running on a production-grade FastAPI + React architecture.

</div>

---

## 📸 Overview

Palora bridges the gap between generic chatbots and emotionally intelligent digital companions. Each companion remembers your conversations, adapts to your emotional state via a custom ML pipeline, responds in a cloned voice via ElevenLabs, and proactively reminds you of events you mention — making it feel genuinely present.

---

## ✨ Key Features

- 🧠 **Persistent Memory Engine** — LLM-powered memory extraction automatically identifies personal facts from conversations and stores them per-companion in MongoDB
- 🎙️ **Real-Time Voice Conversations** — OpenAI Whisper (tiny, CPU-optimized) transcribes voice input; ElevenLabs `eleven_turbo_v2` synthesizes responses in the companion's cloned voice
- 💬 **Streaming Text Chat** — Server-Sent token streaming via FastAPI `StreamingResponse` for zero-latency chat feel powered by `llama-3.3-70b-versatile` on Groq
- 🎭 **Emotion-Aware Responses** — Custom ML pipeline classifies user emotional state from text in real time and conditions the companion's reply tone accordingly
- 📅 **Proactive Event Reminders** — Background event worker parses natural language mentions of future events, schedules them, and triggers companion-initiated reminders
- 🕵️ **Anonymous Guest Chat** — Zero-auth entry point lets unauthenticated users experience the AI before signing up, lowering conversion friction
- 🔐 **JWT Authentication** — Stateless auth with `python-jose`, bcrypt password hashing, and secure token lifecycle management
- 📱 **Responsive UI** — Mobile-first React + Tailwind design system built on Radix UI primitives with Framer Motion animations

---

## 🏗️ Key Architectural Features

### Custom ML Pipeline — Emotion Detection

> Built entirely from scratch without any paid sentiment API.

- **TF-IDF Vectorization** — Text is transformed into a 5,000-feature sparse matrix using `TfidfVectorizer` with English stopword removal, capturing term importance relative to the entire training corpus
- **Logistic Regression Classifier** — Trained on a labeled emotion dataset (`datasets/text.csv`) with `max_iter=200`, serialized via `joblib` into `ml/emotion_model.pkl` and `ml/vectorizer.pkl`
- **Lazy Model Loading** — Both the vectorizer and classifier are loaded into memory only on the first prediction request, using a module-level singleton pattern with `warnings.catch_warnings()` to suppress sklearn version noise — critical for surviving Render's 512 MB RAM ceiling

### Digital Signal Processing — Voice Analysis

- **Librosa DSP Pipeline** — Incoming audio is analyzed for **tempo** (via `librosa.beat.beat_track`), **energy** (RMS loudness via `librosa.feature.rms`), and **pitch** (via `librosa.piptrack` filtered by magnitude median)
- **Human Trait Mapping** — Raw signal values are bucketed into human-readable traits (`slow/normal/fast`, `calm/energetic`, `deep/high`) and injected directly into the LLM prompt to modulate response tone
- **Bundled FFmpeg Patching** — Whisper's internal `load_audio` is monkey-patched at runtime to use `imageio-ffmpeg`'s bundled binary, eliminating the system-level `ffmpeg` dependency entirely

### Client-Side Voice Activity Detection

- **Browser MediaRecorder API** — Voice input is captured using the Web Audio API's `MediaRecorder` with `audio/webm;codecs=opus` MIME type, chunked, and streamed as a `Blob` to the backend
- **Adaptive MIME Negotiation** — The frontend detects browser codec support and negotiates the best available format; the backend maps MIME types to file extensions and converts all formats to 16 kHz mono WAV before transcription
- **Lazy Whisper Initialization** — The Whisper `tiny` model is loaded in-process only on the first voice endpoint call, keeping server cold-start RAM under 100 MB

### Event Intelligence Engine

- **LLM-Powered Temporal Extraction** — The event service sends conversation messages through `llama-3.3-70b-versatile` with a structured prompt that extracts event type, relative time in minutes, and reminder message as a validated JSON payload
- **Background Worker Thread** — A daemon thread started via `@app.on_event("startup")` polls the MongoDB `events` collection and dispatches companion-initiated reminder messages when `event_time` is reached, without blocking the main ASGI loop

---

## 🛠️ Tech Stack

### Frontend

| Technology | Version | Purpose |
|---|---|---|
| React | 18.3 | UI component framework |
| TypeScript | 5.8 | Static typing across the entire frontend |
| Vite + SWC | 5.4 | Sub-second HMR dev server and optimized production builds |
| React Router DOM | 6.30 | Client-side SPA routing |
| TanStack Query | 5.83 | Server state management, caching, and background refetching |
| Tailwind CSS | 3.4 | Utility-first styling with custom design tokens |
| Radix UI | Latest | Accessible, unstyled headless component primitives |
| Framer Motion | 12.36 | Declarative animation and gesture system |
| React Hook Form + Zod | 7.61 / 3.25 | Type-safe form state management with schema validation |
| Recharts | 2.15 | Composable charting for analytics views |
| Lucide React | 0.462 | Consistent icon system |

### Backend & AI Infrastructure

| Technology | Version | Purpose |
|---|---|---|
| FastAPI | 0.110 | Async Python web framework with OpenAPI auto-generation |
| Uvicorn | 0.29 | ASGI server with dynamic `$PORT` binding for Render |
| MongoDB Atlas | — | Document store for users, companions, chats, memories, events |
| PyMongo | 4.17 | Synchronous MongoDB driver |
| Groq API | 0.37 | Ultra-low latency inference for `llama-3.3-70b-versatile` |
| OpenAI Whisper | 20250625 | On-device speech-to-text (CPU, `tiny` model) |
| ElevenLabs | 2.39 | Voice cloning and TTS via `eleven_turbo_v2` |
| scikit-learn | Latest | Logistic Regression emotion classifier |
| TF-IDF Vectorizer | — | 5,000-feature text vectorization (custom-trained) |
| Librosa | Latest | Audio DSP — tempo, pitch, and energy extraction |
| python-jose + bcrypt | 3.5 / 4.0 | JWT token signing and password hashing |
| Pydantic v2 | 2.13 | Request/response schema validation and serialization |
| imageio-ffmpeg | 0.6 | Bundled FFmpeg binary — zero system dependency |
| PyTorch (CPU) | 2.10+cpu | Whisper inference runtime, CPU-only wheel (~200 MB) |

---

## 🗂️ Project Structure

```
palora-companion/
├── src/                          # React + TypeScript frontend
│   ├── components/
│   │   ├── landing/              # Hero, Features, DemoChat, FloatingOrbs
│   │   ├── layout/               # DashboardLayout, Sidebar
│   │   └── ui/                   # Full Radix UI component library
│   ├── pages/                    # Auth, Dashboard, Chat, VoiceCall, Memories
│   └── services/
│       └── api.js                # Centralized fetch client (VITE_API_URL)
│
├── palora-backend/               # FastAPI Python backend
│   ├── main.py                   # App factory, CORS, router registration
│   ├── database.py               # MongoDB connection factory
│   ├── auth.py                   # JWT decode + current_user dependency
│   ├── routes/
│   │   ├── auth.py               # Signup, login, profile, settings
│   │   ├── companion.py          # Companion CRUD + voice upload
│   │   ├── chat.py               # Chat sessions + streaming messages
│   │   ├── memory.py             # Memory CRUD
│   │   ├── voice_chat.py         # Whisper STT + ElevenLabs TTS pipeline
│   │   └── anonymous_chat.py     # Unauthenticated guest chat
│   ├── services/
│   │   ├── ai_service.py         # Groq LLM + ElevenLabs TTS wrappers
│   │   ├── emotion_model_service.py  # Lazy sklearn emotion classifier
│   │   ├── memory_service.py     # LLM-powered memory extraction
│   │   ├── voice_analysis.py     # Librosa DSP pipeline
│   │   ├── event_service.py      # LLM temporal event extraction
│   │   └── event_worker.py       # Background reminder daemon thread
│   ├── models/
│   │   └── schemas.py            # Pydantic v2 request/response schemas
│   └── ml/
│       ├── train_emotion_model.py  # TF-IDF + Logistic Regression trainer
│       ├── emotion_model.pkl       # Serialized trained classifier
│       └── vectorizer.pkl          # Serialized TF-IDF vectorizer
│
├── .env.production               # VITE_API_URL for production builds
├── .env.development              # VITE_API_URL for local development
├── render.yaml                   # One-click Render deployment config
└── .python-version               # Pins Python 3.11.9 for Render builds
```

---

## 🚀 Local Installation

### Prerequisites

- Node.js ≥ 18 and npm
- Python 3.11.x
- A running MongoDB Atlas cluster (or local MongoDB)

### 1. Clone the repository

```bash
git clone https://github.com/YashChavan05/Palora.git
cd Palora
```

### 2. Frontend setup

```bash
npm install
```

Create a `.env.development` file at the project root:

```env
VITE_API_URL=http://localhost:8000
```

Start the dev server:

```bash
npm run dev
# Vite will serve the app at http://localhost:8080
```

### 3. Backend setup

```bash
cd palora-backend
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate

pip install -r requirements.txt
```

Create a `.env` file inside `palora-backend/`:

```env
SECRET_KEY=your-super-secret-jwt-key
MONGO_URI=mongodb+srv://<user>:<pass>@cluster0.xxxxx.mongodb.net/
GROQ_API_KEY=your-groq-api-key
ELEVENLABS_API_KEY=your-elevenlabs-api-key
CUDA_VISIBLE_DEVICES=-1
```

### 4. Train the emotion model (first-time only)

```bash
cd palora-backend
python ml/train_emotion_model.py
# Generates: ml/emotion_model.pkl and ml/vectorizer.pkl
```

### 5. Start the backend

```bash
uvicorn main:app --reload --port 8000
# API available at http://localhost:8000
# Swagger UI at  http://localhost:8000/docs
```

---

## 🌐 Deployment

The project ships with a `render.yaml` at the repo root for one-click deployment on [Render](https://render.com).

| Service | Platform | URL |
|---|---|---|
| Frontend | Vercel | https://paloracom.vercel.app |
| Backend API | Render (Free tier) | https://palora-i44h.onrender.com |
| Database | MongoDB Atlas | Cluster0 |

**Required environment variables on Render:**

| Key | Description |
|---|---|
| `SECRET_KEY` | Long random string for JWT signing |
| `MONGO_URI` | MongoDB Atlas connection string |
| `GROQ_API_KEY` | Groq Console API key |
| `ELEVENLABS_API_KEY` | ElevenLabs API key |

> ⚠️ **Free tier cold start:** Render spins down idle services after 15 minutes. The first request after inactivity takes ~30–60 seconds to wake the instance and lazy-load Whisper.

---

## 🔭 Future Roadmap

### Phase 1 — Long-Term Memory with Vector Search
Replace the current keyword-based memory lookup with **FAISS (Facebook AI Similarity Search)** vector embeddings. Each stored memory will be encoded into a dense 768-dimensional vector using a sentence transformer model. At query time, approximate nearest-neighbor search will surface the top-k semantically relevant memories rather than exact string matches — giving companions a more nuanced, contextually aware recall.

### Phase 2 — Context Window Token Optimization
Implement a **sliding context window manager** that tracks token counts across the conversation history using `tiktoken`. When the context approaches the model's limit, older messages will be summarized via a dedicated compression prompt and replaced with a compact summary chunk — preserving conversational coherence without truncating important context or incurring unnecessary API cost.

### Phase 3 — RAG Architecture for Companion Knowledge
Integrate a **Retrieval-Augmented Generation (RAG)** pipeline where each companion can be given a custom knowledge base (documents, notes, shared experiences). At inference time, a retriever will query a vector store (FAISS or Pinecone) for relevant passages, inject them into the prompt context window, and ground the companion's responses in verified personal knowledge rather than pure parametric LLM memory.

### Phase 4 — Multi-Modal Companion Presence
- **Real-time avatar lip-sync** using viseme generation from TTS audio output
- **Sentiment-driven visual expressions** mapped from the emotion classifier output
- **WebRTC peer connection** for sub-200ms full-duplex voice conversations replacing the current HTTP upload/download cycle

### Phase 5 — Companion Marketplace
- User-exportable companion profiles with shareable personality templates
- Community rating system and discovery feed
- **Companion fine-tuning** via LoRA adapters on user-specific conversation datasets

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome.

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m 'feat: add some feature'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

Built with ❤️ by [Yash Chavan](https://github.com/YashChavan05)

*If Palora resonated with you, drop a ⭐ — it helps more than you think.*

</div>
