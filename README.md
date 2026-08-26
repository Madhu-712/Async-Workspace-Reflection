# 🛡️ Async Team Workspace & Private Reflection Journal

> An intelligent, asynchronous collaboration and psychological safety platform for engineering teams. Features automated standup processing, dynamic workload & burnout risk heatmaps, sentiment trend analytics, and AI-powered cognitive reflection journals powered by Google Gemini.

---

## ✨ Key Features

### 1. 📊 Workload & Fatigue Insights (Burnout Index)
- **Dynamic Burnout Metric (0–100%)**: Continuously calculated using aggregate task completion status, active critical blockers, and team emotional signals.
- **Role-Based Fatigue Heatmap**: Real-time risk distribution across engineering personas (Team Lead, Developer, PM, QA, UI/UX, DevOps).
- **Sentiment Trend Visualizations**: 7-day multi-sentiment area trend tracking with high-contrast visual metrics.
- **Anonymous Signal Broadcast**: Real-time public emotional pulses without compromising private logs.

### 2. 💻 Async Standups & Task Stream
- **Smart Standup Submissions**: Structured updates for accomplished work, planned priorities, and blockers.
- **Role Quick-Fill Templates**: One-click presets for Frontend, Backend, and QA workflows.
- **Actionable Task Stream**: Kanban-style status tracking (Backlog, In-Progress, Complete) with priority tags and blocker alerts.

### 3. 📓 Private Reflection Journal (Gemini AI Cognitive Coach)
- **7 Guided Psychological Frameworks**:
  - 🧠 **Cognitive Bias Explorer**: Analyzes thoughts for catastrophizing, all-or-nothing thinking, mind reading, and emotional reasoning with grounded reality checks.
  - 🌸 **Deep Gratitude Practice**: Unpacks sensory micro-moments to down-regulate nervous system tension.
  - 🗺️ **Future Challenge Prep**: Maps anxiety triggers, predictive communication scripts, and somatic anchors.
  - 🛡️ **Boundary & Capacity**: Analyzes guilt triggers with assertive communication scripts.
  - 🎭 **Imposter Syndrome Check**: Separates subjective anxiety from objective capability.
  - 🏡 **Work-Life Boundary**: Provides concrete end-of-day shutdown rituals.
  - 📝 **Freeform Reflection**: Empathetic emotional validation and restorative inquiry.
- **Resilient AI Engine**: Automatically connects to Google Gemini (`gemini-2.5-flash`, `gemini-2.0-flash`, etc.) with built-in CBT psychological coaching fallbacks when offline.
- **Streak & Isolation**: Per-profile data isolation with continuous daily reflection streak tracking.

---

## 🏗️ Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide Icons, Motion
- **Backend / API**: Node.js, Express, Google GenAI SDK (`@google/genai`)
- **Python / Streamlit Companion**: Streamlit, Pandas, Altair
- **Database & Auth**: Google Firestore & Firebase Authentication (with robust in-memory fallbacks)

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Python (3.9+) *(Optional, for running the Streamlit app)*
- A [Google Gemini API Key](https://aistudio.google.com/) *(Optional, fallback cognitive engine included)*

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/async-workspace-reflection.git
   cd async-workspace-reflection
   ```

2. **Install Node.js dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file from `.env.example`:
   ```bash
   cp .env.example .env
   ```
   Add your Gemini API key (optional):
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Run the Full-Stack Web App:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🐍 Running the Streamlit Companion

You can also run the Python Streamlit companion dashboard:

1. **Install Python dependencies:**
   ```bash
   pip install streamlit pandas altair
   ```

2. **Run Streamlit:**
   ```bash
   streamlit run streamlit.py
   # or
   streamlit run streamlit_app.py
   ```

---

## 🔒 Privacy & Architecture

- **Owner-Bound Journal Isolation**: Private reflection entries and AI-generated cognitive feedback are strictly isolated per user profile.
- **Aggregate Telemetry**: Team burnout metrics and sentiment trends compute aggregate data points without exposing private journal entries.
- **Graceful Degradation**: Full offline support with built-in local persistence and intelligent cognitive coach fallbacks.

---

## 📄 License

This project is licensed under the MIT License.
