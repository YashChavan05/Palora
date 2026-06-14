# Palora — Complete Technical System Report

> Generated: May 2026  
> Codebase: `palora-companion-main`

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [System Architecture](#2-system-architecture)
3. [Technology Stack](#3-technology-stack)
4. [Frontend — Detailed Breakdown](#4-frontend--detailed-breakdown)
5. [Backend — Detailed Breakdown](#5-backend--detailed-breakdown)
6. [Machine Learning — Emotion Detection](#6-machine-learning--emotion-detection)
7. [AI Models & External APIs](#7-ai-models--external-apis)
8. [Voice Pipeline — End to End](#8-voice-pipeline--end-to-end)
9. [Data Flow Diagrams](#9-data-flow-diagrams)
10. [Database Design](#10-database-design)
11. [Authentication & Security](#11-authentication--security)
12. [Background Worker & Event System](#12-background-worker--event-system)
13. [Known Issues & Fixes Applied](#13-known-issues--fixes-applied)

---

## 1. Project Overview

Palora is an **empathetic AI companion platform**. Its core premise is allowing users to
recreate meaningful people — deceased relatives, old friends, romantic partners — as
persistent AI personas. Each persona has a custom name, relationship type, personality
traits, speech style, shared memories, and optionally a cloned voice.

The platform has three distinct interaction modes:

| Mode | Auth Required | Description |
|---|---|---|
| Text Chat | Yes | Streaming LLM conversation with persona prompt |
| Voice Call | Yes | Full-duplex mic → STT → LLM → TTS loop |
| Anonymous Emotion Chat | No | Emotion-classified chat without account |

---

## 2. System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT (Browser)                      │
│  React 18 SPA  ·  Vite 5  ·  TypeScript 5               │
│  React Router v6  ·  Tailwind CSS  ·  Framer Motion      │
│  Web Audio API  ·  MediaRecorder API  ·  Fetch API       │
└────────────────────────┬────────────────────────────────┘
                         │  HTTP/REST  (localhost:8000)
                         │  Streaming: text/plain chunks
                         │  Multipart: audio upload
┌────────────────────────▼────────────────────────────────┐
│                  BACKEND (FastAPI)                       │
│  Python 3.11  ·  Uvicorn ASGI  ·  Pydantic v2           │
│                                                          │
│  Routes: /auth  /companions  /chat  /memories            │
│          /anonymous-chat  /voice-chat                    │
│                                                          │
│  Services:                                               │
│    ai_service        → Groq API (Llama-3.3-70B)         │
│    emotion_model     → sklearn LogisticRegression        │
│    voice_analysis    → librosa acoustic features         │
│    memory_service    → LLM-based fact extraction         │
│    event_service     → LLM-based event extraction        │
│    event_worker      → background polling thread         │
└──────┬──────────────────────────┬───────────────────────┘
       │                          │
┌──────▼──────┐          ┌────────▼────────────────────┐
│  MongoDB    │          │  External APIs               │
│  Atlas      │          │  Groq  (Llama-3.3-70B)      │
│  Database:  │          │  ElevenLabs  (TTS + Clone)  │
│  palora     │          │  OpenAI Whisper  (local STT) │
└─────────────┘          └─────────────────────────────┘
```

**Communication patterns:**
- Standard JSON REST for all CRUD operations
- `StreamingResponse` (FastAPI) + `ReadableStream` (Fetch API) for chat messages
- `multipart/form-data` for audio uploads
- No WebSockets — streaming is HTTP chunked transfer encoding

---

## 3. Technology Stack

### Frontend
| Category | Library | Version |
|---|---|---|
| Framework | React | 18.3.1 |
| Language | TypeScript | 5.8.3 |
| Build tool | Vite + @vitejs/plugin-react-swc | 5.4.19 |
| Routing | React Router DOM | 6.30.1 |
| Styling | Tailwind CSS | 3.4.17 |
| UI Components | shadcn/ui (Radix UI) | latest |
| Animations | Framer Motion | 12.36.0 |
| Icons | Lucide React | 0.462.0 |
| Forms | React Hook Form + Zod | 7.61 / 3.25 |
| Charts | Recharts | 2.15.4 |
| Notifications | Sonner + Radix Toast | 1.7.4 |
| Testing | Vitest + Playwright | 3.2.4 / 1.57 |
| Package manager | Bun (primary) + npm | — |

### Backend
| Category | Library | Version |
|---|---|---|
| Framework | FastAPI | latest |
| ASGI server | Uvicorn | latest |
| Language | Python | 3.11+ |
| Database driver | pymongo | latest |
| Auth — JWT | python-jose[cryptography] | latest |
| Auth — hashing | passlib[bcrypt] | latest |
| Validation | Pydantic v2 | latest |
| LLM client | groq (Python SDK) | latest |
| STT | openai-whisper (local) | latest |
| TTS + Voice clone | ElevenLabs REST API | v1 |
| Audio conversion | imageio[ffmpeg] (bundled ffmpeg) | latest |
| Audio analysis | librosa | latest |
| Audio I/O | soundfile | latest |
| Numerical | numpy | latest |
| ML training | scikit-learn | 1.4.2 |
| ML serialization | joblib | latest |
| Data processing | pandas | latest |
| Deep learning | PyTorch (Whisper dependency) | latest |
| Config | python-dotenv | latest |

---

## 4. Frontend — Detailed Breakdown

### 4.1 Application Entry & Routing

`src/main.tsx` mounts the React app.  
`src/App.tsx` wraps everything in `QueryClientProvider`, `TooltipProvider`, and `BrowserRouter`.

**Route table:**

| Path | Component | Auth | Purpose |
|---|---|---|---|
| `/` | `Index` | No | Marketing landing page |
| `/auth` | `Auth` | No | Login / Signup |
| `/dashboard` | `Dashboard` | Yes | Main hub |
| `/companions` | `Dashboard` | Yes | Alias |
| `/create-companion` | `CreateCompanion` | Yes | 4-step wizard |
| `/chat` | `Chat` | Yes | Streaming text chat |
| `/anonymous-chat` | `AnonymousChat` | No | Emotion chat |
| `/voice-call` | `VoiceCall` | Yes | Full-duplex voice |
| `/memories` | `Memories` | Yes | Memory timeline |
| `/settings` | `Settings` | Yes | Profile & prefs |
| `*` | `NotFound` | — | 404 |

### 4.2 State Management

No global state library is used. All state is local `useState` / `useEffect` per page.  
TanStack Query v5 is installed as a dependency but **never used** — all data fetching  
is manual `fetch` calls inside `useEffect` hooks.

Auth state: JWT stored in `localStorage` under key `"token"`.  
Theme state: `"palora-theme"` key in `localStorage` (`"dark"` or `"light"`).

### 4.3 Page-by-Page Technical Details

#### Index (Landing Page)
Composed of 9 section components rendered in sequence:
`FloatingOrbs → Navbar → Hero → HowItWorks → Features → DemoChat → EmotionalSection → FinalCTA → Footer`

All sections use Framer Motion `useInView` for scroll-triggered entrance animations.
`FloatingOrbs` renders absolutely-positioned blurred radial gradient divs that animate
with `animate-float` (CSS keyframe, 6s ease-in-out infinite).

#### Auth Page
Single page with animated tab switching (Login / Signup).  
- Login calls `POST /auth/login` with `application/x-www-form-urlencoded` (OAuth2 form format).  
- Signup calls `POST /auth/signup` with JSON body.  
- On success, JWT is stored in `localStorage` and user is redirected to `/dashboard`.  
- Supports `?tab=signup` URL param for direct deep-linking to signup tab.

#### Dashboard
Fetches 4 data sources in parallel using `Promise.all`:
```
[getMe(), getCompanions(), getChats(), getMemories()]
```
Renders: stat cards (companions count, chats count, memories count, voice calls),
companion grid with Chat/Call/Memories action buttons, recent activity feed sorted
by `updated_at || created_at` descending.

#### CreateCompanion (4-Step Wizard)

**Step 0 — Basic Info:**  
Fields: name, relationship, age, personality traits (multi-select from 8 presets:
Warm, Funny, Sarcastic, Calm, Energetic, Thoughtful, Adventurous, Caring).

**Step 1 — Speech Style:**  
4 preset styles: Casual, Funny, Supportive, Calm. Single-select.

**Step 2 — Memory Builder:**  
User adds structured memories (title, description, event/date).
Stored as array of objects locally, then serialized to strings on submit:
`"${title}: ${desc} (${event})"`.

**Step 3 — Voice Upload:**  
Drag-and-drop UI. Currently UI-only — the file is not wired to the API call.
The `createCompanion` API call sends `multipart/form-data` with name, description,
personality, and memories. Voice cloning is not triggered from this wizard.

**On finish:**  
1. `POST /companions` → creates companion, returns `companion_id`
2. `POST /chat` with `companion_id` → creates chat session, returns `chat_id`
3. Navigate to `/chat?id={chat_id}`

#### Chat Page

The most technically complex page. Three-panel layout:
- Left: companion list sidebar
- Center: message stream
- Right: collapsible companion info panel

**Streaming message flow:**
1. User submits message → `POST /chat/{id}/message`
2. Response is a `StreamingResponse` (HTTP chunked, `text/plain`)
3. Frontend reads via `response.body.getReader()` + `TextDecoder`
4. Each decoded chunk is appended character by character with a 15ms delay
   (simulates typewriter effect)
5. After stream ends → `GET /chat/{id}/voice` → ElevenLabs TTS audio blob
6. Audio played via `new Audio(URL.createObjectURL(blob))`

**Audio controls in header:**
- Mute toggle (suppresses TTS fetch)
- Play/Pause for current audio
- "Speaking..." animated indicator

#### VoiceCall Page

Full-duplex voice loop using browser APIs:

```
getUserMedia() → MediaRecorder → AudioContext/AnalyserNode
     ↓ (silence detected after 1500ms below threshold 8)
Stop recording → Blob (audio/webm or audio/ogg)
     ↓
POST /voice-chat/ (multipart)
     ↓
Backend: ffmpeg decode → WAV → librosa analysis → Whisper STT → Llama → ElevenLabs TTS
     ↓
Response: { user_text, ai_text, analysis, audio: hex-encoded MP3 }
     ↓
Frontend: hex → Uint8Array → Blob → URL.createObjectURL → Audio.play()
     ↓ (audio.onended)
Restart recording loop
```

**Silence detection algorithm:**
- `AnalyserNode.fftSize = 256` → 128 frequency bins
- Each animation frame: compute mean of `getByteFrequencyData()` array
- If mean < 8 (threshold) for > 1500ms continuously → stop recording
- Uses `requestAnimationFrame` loop, cancelled on stop

**Stale closure fix (critical):**  
All callbacks use mirror refs (`callStateRef`, `mutedRef`, `isSpeakingRef`, `speakerOnRef`)
kept in sync via `useEffect`, because `onended`, `onstop`, and `monitorSilence` are
created once and would otherwise capture stale initial state values.

#### AnonymousChat Page

Simple stateless chat. No auth token sent.  
Each response from `POST /anonymous-chat` includes:
- `response`: AI-generated reply text
- `emotion`: label from the sklearn emotion classifier

Emotion label is displayed as a badge below each AI message.

#### Memories Page

Fetches companions and memories in parallel.  
Memory `content` field is stored as a JSON string:
`{"title": "...", "desc": "...", "event": "...", "tag": "..."}`.  
The page parses this JSON on load; falls back to raw string if not valid JSON.

Operations:
- **Add**: `POST /memories/` with `companion_id` and JSON-stringified content
- **Edit**: `PUT /memories/{id}` with updated JSON-stringified content
- **Delete**: `DELETE /memories/{id}`

#### Settings Page

Loads user profile (`GET /auth/me`) and saved settings (`GET /auth/settings`) in parallel.  
Toggle changes call `PUT /auth/settings` immediately on each flip with optimistic update
and revert on failure.  
Profile name edit calls `PUT /auth/me`.

**Theme system:**  
Toggle adds/removes `.light` class on `<html>`. Persisted to `localStorage["palora-theme"]`.  
A blocking inline `<script>` in `index.html` reads this before React mounts to prevent
flash of wrong theme.

### 4.4 API Service Layer (`src/services/api.js`)

All HTTP calls are plain `fetch`. Base URL: `http://localhost:8000`.

Auth header injected from `localStorage.getItem("token")` as `Bearer {token}`.

| Function | Method | Endpoint | Purpose |
|---|---|---|---|
| `signup` | POST | `/auth/signup` | Create account |
| `login` | POST | `/auth/login` | Get JWT |
| `getMe` | GET | `/auth/me` | Current user |
| `updateProfile` | PUT | `/auth/me` | Update name |
| `getSettings` | GET | `/auth/settings` | Load preferences |
| `updateSettings` | PUT | `/auth/settings` | Save preferences |
| `getCompanions` | GET | `/companions` | List companions |
| `createCompanion` | POST | `/companions` | Create companion |
| `createChat` | POST | `/chat` | New chat session |
| `getChats` | GET | `/chat/` | List chats |
| `getChatHistory` | GET | `/chat/{id}` | Chat + messages |
| `sendMessage` | POST | `/chat/{id}/message` | Stream AI reply |
| `getVoice` | GET | `/chat/{id}/voice` | TTS of last message |
| `getMemories` | GET | `/memories/` | All memories |
| `createMemory` | POST | `/memories/` | Add memory |
| `updateMemory` | PUT | `/memories/{id}` | Edit memory |
| `deleteMemory` | DELETE | `/memories/{id}` | Remove memory |
| `sendAnonymousMessage` | POST | `/anonymous-chat` | Emotion chat |
| `sendVoiceChat` | POST | `/voice-chat/` | Voice round-trip |

---

## 5. Backend — Detailed Breakdown

### 5.1 Application Entry (`main.py`)

```python
app = FastAPI(title="Palora Backend")

# 1. CORS middleware (added FIRST — before all routers)
app.add_middleware(CORSMiddleware, allow_origins=["*"], ...)

# 2. All routers registered
app.include_router(voice_chat.router, prefix="/voice-chat")
app.include_router(auth.router,       prefix="/auth")
app.include_router(companion.router,  prefix="/companions")
app.include_router(chat.router,       prefix="/chat")
app.include_router(memory.router,     prefix="/memories")
app.include_router(anonymous_chat.router)

# 3. Background event worker started as daemon thread on startup
@app.on_event("startup")
def start_background_worker():
    threading.Thread(target=start_event_worker, daemon=True).start()
```

Environment loaded via `python-dotenv` from `palora-backend/.env`.  
`CUDA_VISIBLE_DEVICES=-1` set to force CPU-only mode for Whisper/PyTorch.

### 5.2 Authentication (`auth.py` + `routes/auth.py`)

**Algorithm: HS256 JWT**

```
Password storage:  bcrypt (via passlib)
Token algorithm:   HMAC-SHA256 (HS256)
Token expiry:      7 days (60 * 24 * 7 minutes)
Token payload:     { "sub": user_id, "exp": timestamp }
Secret key:        from env SECRET_KEY
```

**Endpoints:**

`POST /auth/signup`
- Validates email format (Pydantic `EmailStr`)
- Checks for duplicate email in MongoDB
- Hashes password with bcrypt (`pwd_context.hash`)
- Generates UUID string as `_id`
- Inserts user document

`POST /auth/login`
- Accepts `application/x-www-form-urlencoded` (OAuth2PasswordRequestForm)
- `username` field = email address
- Verifies bcrypt hash with `pwd_context.verify`
- Returns `{ access_token, token_type: "bearer" }`

`GET /auth/me`
- Decodes JWT, extracts `sub` (user_id)
- Fetches user from MongoDB by `_id`

`PUT /auth/me` — updates `name` field  
`PUT /auth/settings` — merges settings into `user.settings` sub-document  
`GET /auth/settings` — returns `user.settings` object

**Dependency injection:**  
`get_current_user` is a FastAPI dependency used by all protected routes.
It decodes the Bearer token from the `Authorization` header.

### 5.3 Companion Route (`routes/companion.py`)

`POST /companions/` — `multipart/form-data`
- Fields: `name` (str), `description` (str), `file` (UploadFile)
- Saves uploaded file temporarily as `temp_{filename}`
- Calls `analyze_voice(file_path)` → librosa acoustic profile
- Stores `voice_profile` dict on companion document
- Deletes temp file
- Note: `clone_voice()` function exists but is **not called** — voice cloning
  to ElevenLabs is not wired in the current create flow

`GET /companions/` — returns all companions for current user  
`GET /companions/{id}` — single companion  
`DELETE /companions/{id}` — cascade deletes companion + all its chats + memories  
`POST /companions/{id}/memory` — appends string to `companion.memories[]` array

### 5.4 Chat Route (`routes/chat.py`) — Core Logic

`POST /chat/{id}/message` is the most complex endpoint in the system.

**Full execution sequence:**

```
1. Verify chat ownership (MongoDB lookup)
2. Fetch last 6 messages for conversation history
3. Save user message to chat.messages[]
4. MEMORY EXTRACTION (async LLM call):
   - Calls memory_service.extract_memory(user_text)
   - If a fact is found AND it doesn't already exist → insert into memories collection
5. EVENT EXTRACTION (async LLM call):
   - Calls event_service.extract_event(user_text)
   - If event found → insert into events collection with calculated trigger time
6. Fetch companion document (name, relationship, personality, memories[])
7. Build persona prompt (see below)
8. Stream Llama-3.3-70B response via generate_ai_response_stream()
9. After stream completes → save full AI reply to chat.messages[]
10. Return StreamingResponse(stream_ai(), media_type="text/plain")
```

**Persona prompt template:**
```
You are {name}.
You are the user's {relationship}.
Your personality is: {personality}.

Shared memories:
{memory_text}

Conversation history:
{last_6_messages}

Rules:
- Speak casually
- Be emotional
- Be human-like

User: {message}
Reply as {name}.
```

`GET /chat/{id}/voice`
- Fetches last AI message from chat
- Calls `text_to_speech(content, voice_id)` → ElevenLabs API
- Returns `StreamingResponse(io.BytesIO(audio_bytes), media_type="audio/mpeg")`

### 5.5 Memory Route (`routes/memory.py`)

| Endpoint | Action |
|---|---|
| `POST /memories/` | Create memory, verify companion ownership |
| `GET /memories/` | All memories for current user |
| `GET /memories/companion/{id}` | Memories for specific companion |
| `PUT /memories/{id}` | Update `content` field, ownership check |
| `DELETE /memories/{id}` | Delete document, ownership check |

### 5.6 Anonymous Chat Route (`routes/anonymous_chat.py`)

No authentication. Single endpoint: `POST /anonymous-chat`.

```python
conversation_history = []  # module-level global — shared across ALL users
```

**Execution:**
1. `predict_emotion(message)` → sklearn model → emotion label string
2. Append `"User: {message}"` to `conversation_history`
3. Trim to last 6 entries
4. Build prompt with emotion context + history
5. `generate_ai_response(prompt)` → Groq API
6. Append `"AI: {reply}"` to history
7. Return `{ emotion, response }`

**Known issue:** The global `conversation_history` is shared across all anonymous
users simultaneously. In a multi-user scenario, conversations bleed into each other.

---

## 6. Machine Learning — Emotion Detection

### 6.1 Dataset

**File:** `palora-backend/datasets/text.csv`

| Property | Value |
|---|---|
| Total samples | 416,809 rows |
| Columns | `text` (string), `label` (integer 0–5) |
| Source | Emotion-labeled text dataset (GoEmotions-style) |

**Label distribution:**

| Label ID | Emotion | Count | % of dataset |
|---|---|---|---|
| 0 | Sadness / Negative | 121,187 | 29.1% |
| 1 | Joy / Positive | 141,067 | 33.8% |
| 2 | Love / Affection | 34,554 | 8.3% |
| 3 | Anger / Frustration | 57,317 | 13.7% |
| 4 | Fear / Anxiety | 47,712 | 11.4% |
| 5 | Surprise / Shock | 14,972 | 3.6% |

The dataset is **imbalanced** — Joy (label 1) has ~9.4× more samples than Surprise (label 5).
No class balancing (oversampling/undersampling/class weights) is applied in the current
training script.

### 6.2 Feature Extraction — TF-IDF Vectorizer

**Algorithm: Term Frequency–Inverse Document Frequency (TF-IDF)**

```python
TfidfVectorizer(stop_words="english", max_features=5000)
```

**How it works:**

For each word `t` in document `d` from corpus `D`:

```
TF(t, d)  = count(t in d) / total_words(d)
IDF(t, D) = log( (1 + |D|) / (1 + df(t)) ) + 1
TF-IDF(t, d, D) = TF(t, d) × IDF(t, D)
```

Where `df(t)` = number of documents containing term `t`.

**Parameters:**
- `stop_words="english"` — removes 318 common English words (the, is, at, etc.)
- `max_features=5000` — keeps only the 5000 highest TF-IDF scoring terms across corpus
- Output: sparse matrix of shape `(n_samples, 5000)`

**Result:** Each text sentence becomes a 5000-dimensional sparse vector where each
dimension represents the TF-IDF weight of one vocabulary term.

### 6.3 Classification Model — Logistic Regression

**Algorithm: Multinomial Logistic Regression (Softmax)**

```python
LogisticRegression(max_iter=200)
```

**How it works:**

For K classes (K=6 emotions), logistic regression learns a weight matrix
`W` of shape `(K, 5000)` and bias vector `b` of shape `(K,)`.

For input vector `x` (5000-dim TF-IDF):
```
z_k = W_k · x + b_k          (linear score for class k)
P(y=k | x) = exp(z_k) / Σ exp(z_j)   (softmax probability)
ŷ = argmax_k P(y=k | x)      (predicted class)
```

**Training:**
- Solver: `lbfgs` (default for multi-class) — Limited-memory BFGS quasi-Newton method
- Regularization: L2 (Ridge), `C=1.0` (default)
- `max_iter=200` — maximum optimization iterations
- Convergence criterion: gradient norm < `tol=1e-4`

**Why Logistic Regression for text:**
- Fast to train on large sparse matrices
- Interpretable (weights show which words drive each emotion)
- Works well with TF-IDF features
- Low memory footprint compared to neural approaches

### 6.4 Training Script (`ml/train_emotion_model.py`)

```python
df = pd.read_csv("datasets/text.csv")
X = df["text"]
y = df["label"]

vectorizer = TfidfVectorizer(stop_words="english", max_features=5000)
X_vec = vectorizer.fit_transform(X)          # sparse (416809, 5000)

model = LogisticRegression(max_iter=200)
model.fit(X_vec, y)

joblib.dump(model,      "ml/emotion_model.pkl")
joblib.dump(vectorizer, "ml/vectorizer.pkl")
```

Note: No train/test split is performed. The entire dataset is used for training.
No evaluation metrics (accuracy, F1, confusion matrix) are computed or logged.

### 6.5 Inference (`services/emotion_model_service.py`)

```python
# Loaded once at module import time
model      = joblib.load("ml/emotion_model.pkl")
vectorizer = joblib.load("ml/vectorizer.pkl")

def predict_emotion(text: str) -> str:
    text_vector = vectorizer.transform([text])   # (1, 5000) sparse
    emotion     = model.predict(text_vector)[0]  # integer 0–5
    return str(emotion)                          # returns "0"–"5"
```

**Where it is used:**  
Only in `routes/anonymous_chat.py` → `POST /anonymous-chat`.  
The returned label (e.g. `"1"`) is sent to the frontend as `emotion` field and
displayed as a badge: `"Emotion detected: 1"`.

**Note:** The labels are returned as raw integers (0–5), not human-readable strings.
The frontend displays them as-is. A label-to-name mapping is not implemented.

### 6.6 Model Artifacts

| File | Contents | Size (approx) |
|---|---|---|
| `ml/emotion_model.pkl` | Serialized LogisticRegression (W matrix 6×5000 + bias) | ~240 KB |
| `ml/vectorizer.pkl` | Serialized TfidfVectorizer (vocabulary of 5000 terms) | ~180 KB |

Serialized with `joblib` (more efficient than `pickle` for numpy arrays).  
**Version sensitivity:** Pickles must be retrained if sklearn version changes.
The current environment uses sklearn 1.4.2.

---

## 7. AI Models & External APIs

### 7.1 Groq API — Llama-3.3-70B-Versatile

**Provider:** Groq Cloud  
**Model:** `llama-3.3-70b-versatile`  
**Architecture:** LLaMA 3.3, 70 billion parameters, transformer decoder  
**Inference:** Groq's custom LPU (Language Processing Unit) hardware — extremely fast

**Used in 4 places:**

| Location | Function | Purpose |
|---|---|---|
| `routes/chat.py` | `generate_ai_response_stream()` | Main persona chat (streaming) |
| `services/memory_service.py` | `generate_ai_response()` | Extract personal facts from messages |
| `services/event_service.py` | `generate_ai_response()` | Extract scheduled events from messages |
| `routes/anonymous_chat.py` | `generate_ai_response()` | Anonymous emotion-aware chat |
| `services/event_worker.py` | `generate_ai_response()` | Generate proactive event messages |
| `routes/voice_chat.py` | `generate_ai_response()` | Voice call AI response |

**Streaming implementation:**
```python
def generate_ai_response_stream(prompt):
    stream = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        stream=True
    )
    for chunk in stream:
        if chunk.choices[0].delta.content:
            yield chunk.choices[0].delta.content
```

The generator is consumed by FastAPI's `StreamingResponse`, which sends each
yielded chunk immediately to the client as HTTP chunked transfer encoding.

**Memory extraction prompt:**
```
Determine if the following message contains an important personal fact.
Examples: birthday, hobbies, important events, preferences.
If it contains a fact, rewrite it as a short memory.
If not, return: NONE
Message: {user_message}
```

**Event extraction prompt:**
```
Extract event details from the message.
Return ONLY JSON: { "event_type": "...", "event_time_in_minutes": number, "message": "..." }
If no event, return null.
```
JSON is extracted from the response using regex: `re.search(r'\{.*\}', response, re.DOTALL)`

### 7.2 ElevenLabs API — Text-to-Speech

**Provider:** ElevenLabs  
**Model:** `eleven_turbo_v2`  
**Endpoint:** `POST https://api.elevenlabs.io/v1/text-to-speech/{voice_id}`

**Used in 2 places:**
1. `GET /chat/{id}/voice` — TTS of last AI message in text chat
2. `POST /voice-chat/` — TTS of AI response in voice call

**Request payload:**
```json
{
  "text": "...",
  "model_id": "eleven_turbo_v2",
  "voice_settings": {
    "stability": 0.5,
    "similarity_boost": 0.7
  }
}
```

**Default voice ID:** `EXAVITQu4vr4xnSDxMaL` (hardcoded fallback)

**Voice cloning:**  
`clone_voice()` function in `routes/companion.py` calls
`POST https://api.elevenlabs.io/v1/voices/add` with the uploaded audio file.
This function exists but is **not called** in the current companion creation flow.

**Response:** Raw MP3 bytes returned directly.  
In text chat: streamed as `audio/mpeg`.  
In voice chat: hex-encoded and returned in JSON, decoded on frontend.

### 7.3 OpenAI Whisper — Speech-to-Text (Local)

**Type:** Local model, runs on CPU  
**Model size:** `base` (74M parameters)  
**Architecture:** Transformer encoder-decoder  
**Input:** 16kHz mono WAV audio  
**Output:** Transcribed text string

**Model sizes available (base is used):**

| Size | Parameters | VRAM | Speed |
|---|---|---|---|
| tiny | 39M | ~1 GB | fastest |
| **base** | **74M** | **~1 GB** | **fast** |
| small | 244M | ~2 GB | moderate |
| medium | 769M | ~5 GB | slow |
| large | 1550M | ~10 GB | slowest |

**Loaded once at startup:**
```python
model = whisper.load_model("base")
```

**Inference:**
```python
result = model.transcribe(wav_path, fp16=False)  # fp16=False for CPU
user_text = result["text"].strip()
```

`fp16=False` is required because FP16 (half-precision) is only supported on CUDA GPUs.
On CPU, FP32 is used automatically.

**ffmpeg dependency:**  
Whisper requires ffmpeg to decode audio files. Since ffmpeg is not installed system-wide,
the `imageio_ffmpeg` package provides a bundled binary. Whisper's `load_audio` function
is monkey-patched at module load time to use the full path to this binary:

```python
FFMPEG_EXE = imageio_ffmpeg.get_ffmpeg_exe()

def _patched_load_audio(file, sr=16000):
    cmd = [FFMPEG_EXE, "-nostdin", "-threads", "0", "-i", file,
           "-f", "s16le", "-ac", "1", "-acodec", "pcm_s16le", "-ar", str(sr), "-"]
    out = subprocess.run(cmd, capture_output=True, check=True).stdout
    return np.frombuffer(out, np.int16).flatten().astype(np.float32) / 32768.0

whisper.audio.load_audio = _patched_load_audio
```

---

## 8. Voice Pipeline — End to End

### 8.1 Audio Conversion Pipeline

Browser records audio as `audio/webm;codecs=opus` (Chrome) or `audio/ogg;codecs=opus`
(Firefox). Neither format can be read directly by librosa (which needs WAV/FLAC).

**Conversion chain:**
```
Browser MediaRecorder (webm/ogg)
    ↓  multipart/form-data upload
Backend saves raw file with correct extension (.webm or .ogg)
    ↓  to_wav() using bundled ffmpeg
ffmpeg -i input.webm -ar 16000 -ac 1 -f wav output.wav
    ↓
Clean 16kHz mono WAV
    ↓  ──────────────────────────────────────────
    ├→ librosa.load(wav_path)   → voice analysis
    └→ model.transcribe(wav_path) → Whisper STT
```

### 8.2 Voice Analysis (`services/voice_analysis.py`)

**Library:** librosa  
**Input:** 16kHz mono WAV file  
**Output:** dict with `speed`, `tone`, `style`

**Feature 1 — Tempo (Speed)**
```python
tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
tempo = float(np.atleast_1d(tempo)[0])  # handle numpy array return
```
- Algorithm: Dynamic programming beat tracker on onset strength envelope
- Maps to: `slow` (<90 BPM), `normal` (90–140 BPM), `fast` (>140 BPM)

**Feature 2 — RMS Energy (Tone)**
```python
energy = float(np.mean(librosa.feature.rms(y=y)))
```
- Root Mean Square energy across all frames
- Maps to: `calm` (energy < 0.02), `energetic` (energy ≥ 0.02)

**Feature 3 — Pitch (Style)**
```python
pitches, magnitudes = librosa.piptrack(y=y, sr=sr)
pitch_vals = pitches[magnitudes > np.median(magnitudes)]
pitch = float(np.mean(pitch_vals)) if pitch_vals.size > 0 else 0.0
```
- `piptrack`: Pitch estimation via parabolic interpolation on STFT
- Filters to pitches with above-median magnitude (removes noise)
- Maps to: `deep` (pitch < 150 Hz), `high` (pitch ≥ 150 Hz)

**Usage:** The resulting dict is injected into the Llama prompt:
```
User's voice metadata:
- Speed: normal
- Tone: calm
- Pitch: deep
Respond naturally as a warm companion. Match their energy level.
```

### 8.3 Complete Voice Call Sequence

```
1. User clicks "Call" button
   → AudioContext initialized (must be on user gesture for browser policy)
   → callState = "calling" for 2 seconds (simulated ring)
   → callState = "active"

2. startRecording() called
   → navigator.mediaDevices.getUserMedia({ audio: true })
   → AudioContext.createMediaStreamSource(stream)
   → AnalyserNode connected (fftSize=256)
   → MediaRecorder started with audio/webm;codecs=opus
   → monitorSilence() loop begins via requestAnimationFrame

3. Silence detection loop (every animation frame ~16ms)
   → analyser.getByteFrequencyData(dataArray)  [128 values, 0-255]
   → volume = mean(dataArray)
   → if volume < 8 for > 1500ms → stopRecording()

4. stopRecording()
   → cancelAnimationFrame()
   → mediaRecorder.stop() → triggers onstop event
   → stream.getTracks().forEach(t => t.stop())

5. onstop handler
   → Blob assembled from audioChunks[]
   → if blob.size > 3000 bytes → processVoice(blob, mimeType)
   → else → restart recording (too short, likely silence)

6. processVoice(blob, mimeType)
   → sendVoiceChat(blob, mimeType) → POST /voice-chat/
   → Response: { user_text, ai_text, analysis, audio: hexString }

7. Backend processing (see Section 8.2 + 7.1 + 7.2)

8. playHexAudio(hexString)
   → hex.match(/.{1,2}/g).map(b => parseInt(b, 16))
   → new Uint8Array(bytes)
   → new Blob([bytes], { type: "audio/mpeg" })
   → URL.createObjectURL(blob)
   → audio.src = url; audio.play()

9. audio.onended
   → isSpeaking = false
   → if not muted and call active → startRecording() after 500ms delay
   → Loop continues
```

---

## 9. Data Flow Diagrams

### 9.1 Text Chat Flow

```
User types message
    │
    ▼
POST /chat/{id}/message
    │
    ├─→ Save user message to MongoDB chat.messages[]
    │
    ├─→ memory_service.extract_memory(text)
    │       └─→ Groq API (Llama-3.3-70B)
    │               └─→ if fact found → INSERT memories collection
    │                   (dedup check: same user+companion+content)
    │
    ├─→ event_service.extract_event(text)
    │       └─→ Groq API (Llama-3.3-70B)
    │               └─→ if event found → INSERT events collection
    │                   (event_time = utcnow + timedelta(minutes=N))
    │
    ├─→ Fetch companion (name, relationship, personality, memories[])
    │
    ├─→ Build persona prompt
    │
    └─→ generate_ai_response_stream(prompt)
            └─→ Groq API streaming
                    └─→ StreamingResponse chunks → Frontend
                            └─→ ReadableStream reader
                                    └─→ Character-by-character animation (15ms)
                                            └─→ Stream ends
                                                    └─→ GET /chat/{id}/voice
                                                            └─→ ElevenLabs TTS
                                                                    └─→ Audio playback
```

### 9.2 Anonymous Chat Flow

```
User types message (no auth)
    │
    ▼
POST /anonymous-chat
    │
    ├─→ predict_emotion(text)
    │       └─→ vectorizer.transform([text])  → (1, 5000) sparse TF-IDF
    │               └─→ model.predict(vector) → label integer 0-5
    │
    ├─→ Append to global conversation_history (last 6 kept)
    │
    ├─→ Build prompt with emotion + history
    │
    └─→ generate_ai_response(prompt)
            └─→ Groq API (blocking)
                    └─→ Return { emotion: "1", response: "..." }
                            └─→ Frontend shows emotion badge
```

---

## 10. Database Design

**Database:** MongoDB  
**Database name:** `palora`  
**Connection:** MongoDB Atlas (cloud) with fallback to `localhost:27017`  
**ID strategy:** UUID v4 strings (not MongoDB ObjectId)

### Collections

#### `users`
```json
{
  "_id":      "uuid-string",
  "email":    "user@example.com",
  "password": "$2b$12$bcrypt_hash",
  "name":     "John",
  "settings": {
    "notifications": true,
    "emailNotifs": false,
    "callSounds": true,
    "privateMode": false,
    "dataCollection": true
  }
}
```

#### `companions`
```json
{
  "_id":          "uuid-string",
  "user_id":      "uuid-string",
  "name":         "Maya",
  "description":  "Relationship: Best friend. Age: 25. Style: casual",
  "personality":  "Warm, Funny, Caring",
  "memories":     ["Summer trip 2019: We drove to Goa (June 2019)"],
  "voice_profile": {
    "speed": "normal",
    "tone":  "calm",
    "style": "high"
  },
  "voice_id":    null,
  "created_at":  "2026-01-01T00:00:00Z"
}
```

#### `chats`
```json
{
  "_id":          "uuid-string",
  "user_id":      "uuid-string",
  "companion_id": "uuid-string",
  "messages": [
    {
      "role":      "user",
      "content":   "Hey, how are you?",
      "timestamp": "2026-01-01T10:00:00Z"
    },
    {
      "role":      "assistant",
      "content":   "I'm doing great! Miss you so much.",
      "timestamp": "2026-01-01T10:00:02Z"
    }
  ],
  "created_at":  "2026-01-01T00:00:00Z",
  "updated_at":  "2026-01-01T10:00:02Z"
}
```

#### `memories`
```json
{
  "_id":          "uuid-string",
  "user_id":      "uuid-string",
  "companion_id": "uuid-string",
  "content":      "{\"title\":\"Road trip\",\"desc\":\"We drove to Goa\",\"event\":\"June 2019\",\"tag\":\"Adventure\"}",
  "created_at":   "2026-01-01T00:00:00Z"
}
```
Note: `content` is stored as a JSON string, parsed by the frontend.

#### `events`
```json
{
  "_id":          "uuid-string",
  "user_id":      "uuid-string",
  "companion_id": "uuid-string",
  "event_type":   "birthday reminder",
  "event_time":   "2026-01-02T10:00:00Z",
  "message":      "Don't forget your sister's birthday tomorrow!",
  "triggered":    false
}
```

### Indexes (not explicitly created — relies on MongoDB defaults)
- `users.email` — should be unique indexed (not enforced in code, only checked manually)
- `chats.user_id` — queried frequently
- `events.event_time + triggered` — queried by background worker every 30s

---

## 11. Authentication & Security

### JWT Flow
```
Client                          Server
  │                               │
  │── POST /auth/login ──────────→│
  │   (email + password)          │ verify bcrypt hash
  │                               │ create JWT (HS256, 7 days)
  │←── { access_token } ─────────│
  │                               │
  │ store in localStorage         │
  │                               │
  │── GET /auth/me ──────────────→│
  │   Authorization: Bearer {jwt} │ decode JWT → user_id
  │                               │ fetch user from MongoDB
  │←── { user object } ──────────│
```

### Security Notes
- CORS: `allow_origins=["*"]` — accepts requests from any origin (dev setting)
- Passwords: bcrypt with default cost factor 12
- JWT secret: from `SECRET_KEY` env var (defaults to weak dev string if not set)
- API keys: moved to `.env` file (Groq, ElevenLabs)
- No rate limiting on any endpoint
- No input sanitization beyond Pydantic type validation
- MongoDB queries use exact `_id` + `user_id` matching (ownership enforced)

---

## 12. Background Worker & Event System

### Event Extraction (at chat time)

When a user sends a message containing a time reference (e.g. "remind me in 30 minutes",
"my birthday is tomorrow"), the LLM extracts:

```json
{
  "event_type": "birthday reminder",
  "event_time_in_minutes": 1440,
  "message": "Happy birthday! Hope your day is amazing."
}
```

`event_time` is calculated as: `datetime.utcnow() + timedelta(minutes=1440)`

### Event Worker (`services/event_worker.py`)

Runs as a **daemon thread** started at application startup.

```python
def start_event_worker():
    db = get_db()
    while True:
        now = datetime.utcnow()
        events = db.events.find({
            "event_time": {"$lte": now},
            "triggered": False
        })
        for event in events:
            ai_message = generate_ai_response(prompt)
            db.chats.update_one(
                {"companion_id": event["companion_id"]},
                {"$push": {"messages": { "role": "assistant", "content": ai_message }}}
            )
            db.events.update_one({"_id": event["_id"]}, {"$set": {"triggered": True}})
        time.sleep(30)  # poll every 30 seconds
```

**Limitations:**
- Single-threaded — one event processed at a time
- No distributed locking — would cause duplicate triggers if multiple server instances run
- No retry logic — if LLM call fails, event is not retried
- No error handling — an exception kills the worker thread silently
- Pushes to the first chat found for that companion (not necessarily the active one)

---

## 13. Known Issues & Fixes Applied

| Issue | Status | Fix Applied |
|---|---|---|
| API keys hardcoded in source | ✅ Fixed | Moved to `.env`, loaded via `os.getenv()` |
| CORS middleware registered after voice_chat router | ✅ Fixed | Moved `add_middleware` before all `include_router` calls |
| Settings/Memories not persisted | ✅ Fixed | Added `PUT /memories/{id}`, `DELETE /memories/{id}`, `PUT /auth/me`, `PUT /auth/settings` endpoints |
| sklearn version mismatch on pickle load | ✅ Fixed | Retrained model with installed sklearn 1.4.2 |
| `librosa.beat.beat_track` returns numpy array | ✅ Fixed | `float(np.atleast_1d(tempo)[0])` |
| Browser records webm, backend expected wav | ✅ Fixed | MIME detection + ffmpeg conversion to WAV |
| ffmpeg not installed system-wide | ✅ Fixed | `imageio[ffmpeg]` bundled binary + Whisper monkey-patch |
| Stale closures in VoiceCall.tsx | ✅ Fixed | Mirror refs for all mutable state used in callbacks |
| Global anonymous chat history shared across users | ⚠️ Known | Not fixed — needs per-session storage |
| Voice cloning not wired in CreateCompanion | ⚠️ Known | `clone_voice()` exists but not called |
| No train/test split in emotion model | ⚠️ Known | No evaluation metrics computed |
| Emotion labels returned as integers (0–5) | ⚠️ Known | No human-readable label mapping |
| No rate limiting on any endpoint | ⚠️ Known | Not implemented |
| Event worker has no error handling | ⚠️ Known | Thread dies silently on exception |
| TanStack Query installed but unused | ℹ️ Info | All fetching is manual useEffect |

---

*End of Technical Report — Palora AI Companion System*
