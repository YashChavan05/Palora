# Palora - Empathetic AI Companion

Palora is an advanced, multimodal AI companion platform designed to provide meaningful interactions, emotional support, and personalized connection. 

## Features

- **Voice Calls**: High-fidelity voice interactions using Whisper (STT) and ElevenLabs (TTS).
- **Emotion Recognition**: Custom machine learning models that analyze user sentiment and tone.
- **Multimodal Analysis**: Real-time analysis of speech speed, pitch, and energy.
- **Persistent Memory**: An AI system that extracts and remembers key facts about the user.
- **Secure Authentication**: JWT-based secure login and storage.

## Technology Stack

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: Tailwind CSS & shadcn/ui
- **Animations**: Framer Motion
- **Icons**: Lucide React

### Backend
- **Framework**: FastAPI (Python 3.11)
- **Database**: MongoDB
- **AI Engine**: Llama-3 (Groq API), OpenAI Whisper, ElevenLabs API
- **NLP**: Scikit-learn (Logistic Regression + TF-IDF)

## Getting Started

### Prerequisites

- Node.js & npm
- Python 3.11+
- MongoDB

### Installation

1. **Clone the repository**:
   ```sh
   git clone <YOUR_GIT_URL>
   cd palora-companion
   ```

2. **Setup Frontend**:
   ```sh
   npm install
   npm run dev
   ```

3. **Setup Backend**:
   ```sh
   cd palora-backend
   pip install -r requirements.txt
   uvicorn main:app --reload
   ```

## Architecture

The project follows a decoupled architecture with a React-based SPA communicating with a high-performance FastAPI backend via RESTful APIs and streaming responses for conversational AI.
