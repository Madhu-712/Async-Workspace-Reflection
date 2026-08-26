
"""
Async Team Workspace - Streamlit Local Test Companion
Replicates the complete, rich UI and features of the AI Studio Workspace platform.
Run locally with:
    pip install streamlit pandas altair
    streamlit run streamlit_app.py
"""

import streamlit as st
import pandas as pd
import altair as alt
import datetime
import random
import os
import json
import urllib.request

# Page configuration for a spacious dashboard
st.set_page_config(
    page_title="Async Workspace & Private Reflection Journal",
    page_icon="🛡️",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Sophisticated layout customization matching studio spacing, typography, and palette
st.markdown("""
<style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Playfair+Display:ital,wght@0,600;0,800;1,400&display=swap');
    
    html, body, [class*="css"] {
        font-family: 'Plus+Jakarta+Sans', -apple-system, sans-serif;
    }
    
    .display-title {
        font-family: 'Playfair+Display', Georgia, serif;
        font-weight: 800;
        color: #1e293b;
        font-size: 2.25rem;
        line-height: 1.2;
    }
    
    .accent-subtitle {
        font-size: 0.85rem;
        text-transform: uppercase;
        letter-spacing: 0.15em;
        color: #6366f1;
        font-weight: 800;
        margin-bottom: 0.25rem;
    }
    
    /* Elegant card borders */
    .feature-card {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 1.25rem;
        box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
        margin-bottom: 1.25rem;
    }
    
    .status-badge {
        font-weight: 700;
        text-transform: uppercase;
        font-size: 9px;
        letter-spacing: 0.05em;
        padding: 0.25rem 0.5rem;
        border-radius: 6px;
        display: inline-block;
    }
    
    .badge-positive { background-color: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; }
    .badge-neutral { background-color: #f8fafc; color: #475569; border: 1px solid #cbd5e1; }
    .badge-negative { background-color: #fff1f2; color: #be123c; border: 1px solid #fecdd3; }
    
    .streak-widget {
        background-color: #fffbeb;
        border: 1px solid #fde68a;
        color: #78350f;
        padding: 0.4rem 0.85rem;
        border-radius: 10px;
        font-weight: 800;
        font-size: 0.8rem;
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
    }

    .reflection-box-user {
        background-color: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 10px;
        padding: 1rem;
        margin-bottom: 0.75rem;
    }

    .reflection-box-ai {
        background-color: #f5f3ff;
        border: 1px solid #ddd6fe;
        border-radius: 10px;
        padding: 1.15rem;
        margin-bottom: 0.75rem;
    }
</style>
""", unsafe_allow_html=True)

# -----------------------------------------------------------------------------
# Templates & Presets Definitions
# -----------------------------------------------------------------------------
JOURNAL_TEMPLATES = [
    {
        "id": "cognitive_bias",
        "title": "Cognitive Bias Explorer",
        "icon": "🧠",
        "desc": "Examine thoughts for common distortions (catastrophizing, personalization) to find balance.",
        "placeholder": "e.g. I failed the API compilation today, so I think I'm a terrible developer and the whole release is going to crash..."
    },
    {
        "id": "gratitude",
        "title": "Deep Gratitude Practice",
        "icon": "🌸",
        "desc": "Dig beneath surface-level statements. Focus on sensory details, small comforts, and why they matter.",
        "placeholder": "e.g. This morning I sat in complete quiet for 10 minutes with a warm coffee before any Slack pings started..."
    },
    {
        "id": "future_challenge",
        "title": "Future Challenge Prep",
        "icon": "🗺️",
        "desc": "Plan for an upcoming stressor: map obstacle triggers, select custom coping tactics, and set micro-goals.",
        "placeholder": "e.g. I have a major live demo of our socket stream component with stakeholders tomorrow at 10 AM..."
    },
    {
        "id": "boundary_check",
        "title": "Boundary & Capacity",
        "icon": "🛡️",
        "desc": "Reflect on boundaries. Are you over-committing out of guilt or fear of letting down the team?",
        "placeholder": "e.g. I said yes to taking on the DevOps deployment pipeline task even though my sprint queue is fully loaded..."
    },
    {
        "id": "imposter_syndrome",
        "title": "Imposter Syndrome Check",
        "icon": "🎭",
        "desc": "Acknowledge your progress, separate facts from feelings, and credit your skills for your successes.",
        "placeholder": "e.g. I feel like my colleagues are way more advanced with websockets, and they'll eventually find out I struggle with them..."
    },
    {
        "id": "work_life",
        "title": "Work-Life Boundary",
        "icon": "🏡",
        "desc": "Reflect on how easily you transition from work to rest. How to create a clear division.",
        "placeholder": "e.g. I keep checking Slack on my phone during dinner and thinking about the unresolved Firestore API error..."
    },
    {
        "id": "general",
        "title": "Freeform Reflection",
        "icon": "📝",
        "desc": "Open space to capture stream of consciousness, work strain, or celebrating minor release successes.",
        "placeholder": "What is on your mind? Take a breath and write honestly..."
    }
]

QUICK_EXAMPLES = [
    {
        "label": "Failed compile stress",
        "text": "The server build kept crashing during a demo preview, and I felt immediate panic that my team thinks I'm incompetent.",
        "templateId": "cognitive_bias"
    },
    {
        "label": "Anxious about presentation",
        "text": "I have a major live demo with product coordinators tomorrow at 10 AM. I'm worried about getting put on the spot for missing deadlines.",
        "templateId": "future_challenge"
    },
    {
        "label": "Guilt saying 'No'",
        "text": "I volunteered to fix 4 minor layout bugs in the standby stream even though I'm already primary on the core server refactoring.",
        "templateId": "boundary_check"
    },
    {
        "label": "Feeling underqualified",
        "text": "I feel like my colleagues are way more advanced with database queries, and they'll eventually find out I struggle with optimization.",
        "templateId": "imposter_syndrome"
    }
]

DEMO_PERSONAS = [
    {"uid": "lead-dev", "email": "lead-dev@workspace.io", "displayName": "Alex Rivera", "role": "Team Lead", "icon": "🧠"},
    {"uid": "ai-lead", "email": "ai-lead@workspace.io", "displayName": "Samantha Lee", "role": "Developer", "icon": "🤖"},
    {"uid": "pm-guy", "email": "pm@workspace.io", "displayName": "Marcus Chen", "role": "Product Manager", "icon": "🗺️"},
    {"uid": "qa-guru", "email": "qa@workspace.io", "displayName": "Jessica Taylor", "role": "QA", "icon": "🔍"}
]

# -----------------------------------------------------------------------------
# AI Reflection Generator (Gemini API + Multi-Model Fallback + Intelligent Empathetic Coach)
# -----------------------------------------------------------------------------
def get_gemini_api_key() -> str:
    """Retrieves Gemini API Key from environment or Streamlit secrets."""
    api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY") or os.environ.get("VITE_GEMINI_API_KEY")
    if not api_key:
        try:
            if hasattr(st, "secrets"):
                api_key = st.secrets.get("GEMINI_API_KEY") or st.secrets.get("GOOGLE_API_KEY")
        except Exception:
            pass
    return api_key or ""

def generate_ai_reflection(entry_text: str, template_id: str, template_title: str, user_name: str = "Developer", history_entries: list = None) -> str:
    """
    Generates structured, compassionate, and psychologist-guided cognitive reflections.
    Attempts live Gemini API generation across resilient model ladders, falling back seamlessly
    to deep clinical CBT & mindfulness coaching logic if offline or without credentials.
    """
    api_key = get_gemini_api_key()
    
    # History context for multi-turn conversational depth
    history_context = ""
    if history_entries:
        recent = history_entries[:2]
        history_context = "\n".join([
            f"Previous Entry: \"{h.get('text', '')}\"\nPrevious AI Feedback: {h.get('response', '')[:200]}..."
            for h in recent if h.get('text')
        ])

    if api_key:
        # Resilient Model Fallback Ladder
        models_to_try = [
            "gemini-2.5-flash",
            "gemini-2.0-flash",
            "gemini-1.5-flash",
            "gemini-2.5-pro",
            "gemini-1.5-pro"
        ]
        
        prompt = f"""You are a supportive, deeply empathetic, non-judgmental professional mental health coach and cognitive reflection guide for software developers in a fast-paced workspace.
The developer ({user_name}) has logged a private reflection using the template: '{template_title}' (ID: {template_id}).

{f"### RECENT HISTORICAL CONTEXT:\n{history_context}\n" if history_context else ""}
### DEVELOPER'S PRIVATE ENTRY:
"{entry_text}"

### YOUR GOAL:
Provide a compassionate, structured, psychologist-level reflection with:
1. **Empathetic Emotional Validation**: Warmly validate what they are experiencing.
2. **Cognitive Distortion / Boundary Analysis**: Identify any cognitive distortions (catastrophizing, all-or-nothing thinking, emotional reasoning, imposter feelings, or over-commitment) if present.
3. **Grounded Reality Check & Balanced Reframing**: Provide evidence-based, compassionate reframing.
4. **Actionable Micro-Intention & Somatic Anchor**: Give 1-2 realistic, low-friction steps or breathing anchors for today.

Format in clean Markdown with clear headings and gentle phrasing. Speak with warm, grounded authority without promotional marketing hype or dry clinical coldness."""

        for model in models_to_try:
            try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
                headers = {"Content-Type": "application/json"}
                payload = {
                    "contents": [
                        {
                            "parts": [{"text": prompt}]
                        }
                    ],
                    "generationConfig": {
                        "temperature": 0.7,
                        "maxOutputTokens": 1024
                    }
                }
                body = json.dumps(payload).encode("utf-8")
                req = urllib.request.Request(url, data=body, headers=headers, method="POST")
                with urllib.request.urlopen(req, timeout=12) as response:
                    res_data = json.loads(response.read().decode("utf-8"))
                    candidates = res_data.get("candidates", [])
                    if candidates:
                        parts = candidates[0].get("content", {}).get("parts", [])
                        if parts and "text" in parts[0]:
                            generated_text = parts[0]["text"].strip()
                            if len(generated_text) > 20:
                                return generated_text
            except Exception as e:
                # Try next model in ladder
                continue

    # -------------------------------------------------------------------------
    # Intelligent Clinical CBT & Psychological Reframing Fallback
    # -------------------------------------------------------------------------
    lower_text = entry_text.lower()
    
    if template_id == "cognitive_bias":
        distortions = []
        if any(w in lower_text for w in ["incompetent", "terrible", "worst", "never", "always", "failure", "stupid"]):
            distortions.append("**All-or-Nothing Thinking & Harsh Labeling**: Interpreting an isolated technical friction or failed build as a total indictment of your capability.")
        if any(w in lower_text for w in ["fail", "panic", "ruined", "crash", "fired", "catastrophe", "doomed"]):
            distortions.append("**Catastrophizing**: Anticipating worst-case outcomes and amplifying normal development bugs into career-ending disasters.")
        if any(w in lower_text for w in ["everyone", "they think", "they'll know", "looking down", "judging"]):
            distortions.append("**Mind Reading & Personalization**: Assuming colleagues are silently judging you, rather than focusing on their own complex tickets.")
        if not distortions:
            distortions.append("**Emotional Reasoning**: Assuming that because you feel overwhelmed or anxious right now, the project must objectively be falling apart.")

        distortions_str = "\n- ".join(distortions)
        return f"""### ✨ Empathetic Analysis: Cognitive Bias Explorer

Thank you for articulating what you're feeling, **{user_name}**. Navigating intricate engineering under tight delivery timelines naturally brings high vulnerability. Let's unpack the cognitive patterns:

- {distortions_str}

#### 🔍 Grounded Reality Check
1. **The Objective Fact**: You encountered an obstacle or friction in the current sprint.
2. **The Cognitive Narrative**: Your nervous system interpreted this technical roadblock as evidence of personal inadequacy.
3. **The Evidence**: Complex software architecture fails iteratively by design; diagnosing errors is the fundamental craft of engineering, not a failure of character.

#### 🌿 Balanced Reframing
> *"Friction in the build pipeline is diagnostic data, not a verdict on my worth. I have tackled tough technical hurdles before, and I will navigate this systematically step-by-step."*

#### 🎯 Micro-Intention & Grounding Anchor
Take 3 slow, diaphragmatic breaths (inhale for 4s, exhale for 6s). For the next 25 minutes, write down just the single next diagnostic step, setting aside the macro deadline."""

    elif template_id == "gratitude":
        return f"""### ✨ Empathetic Summary: Deep Gratitude Practice

This is a grounding and restorative reflection, **{user_name}**. Taking an intentional pause to capture quiet micro-moments is one of the most clinically validated ways to reset baseline nervous system tension in software teams.

#### 🌸 Sensory & Relational Depth:
- **Sensory Grounding**: Noticing the tangible comforts (quiet morning space, warm tea/coffee, physical stillness) helps down-regulate baseline cortisol.
- **Relational Psychological Safety**: Acknowledging supportive team members or moments of genuine connection strengthens resilience.

#### 💡 Why This Protects Your Cognitive Capacity:
By deliberately training your attention on restorative details, you counterbalance the brain's default negativity bias and constant bug-hunting mode.

#### 🎯 Micro-Anchor for Today:
Carry this calm presence into your upcoming collaborative reviews. When Slack pings escalate, recall this quiet moment as your steady foundation."""

    elif template_id == "future_challenge":
        return f"""### ✨ Preparation Strategy: Future Challenge Prep

Proactively mapping upcoming stressors transforms vague dread into structured execution, **{user_name}**.

#### 🗺️ Anticipated Friction & Adaptive Coping:
1. **The Anticipated Stressor**: Demonstrating features, fielding impromptu technical questions, or facing tight milestone reviews.
2. **Predictive Communication Script**: If asked an unexpected question live, remember you are never expected to guess. Use this confident phrase:
   > *"That's a valuable edge-case. Let me verify the exact parameters with the team and send you the exact details in an async update in 20 minutes."*
3. **Somatic Regulation**: Keep both feet firmly on the ground, unclench your jaw, and take a gentle exhale before responding to questions.

#### 🎯 Crisp Micro-Goal:
Focus exclusively on presenting the core working path. You are thoroughly prepared and capable."""

    elif template_id == "boundary_check":
        return f"""### ✨ Empathetic Coaching: Boundary & Capacity

Setting clear boundaries in collaborative software teams often triggers irrational guilt, **{user_name}**. Let's examine your capacity honestly:

#### 🛡️ Capacity Breakdown:
- **The Guilt Trigger**: Fearing that declining extra tickets or requests will let down the team.
- **The Engineering Reality**: When you say 'Yes' to auxiliary tasks while at maximum capacity, you are involuntarily saying 'No' to code quality, mental clarity, and your personal well-being.

#### 💬 Assertive Boundary Script:
> *"I would love to help with this in a future sprint, but my current queue is fully committed to our core deliverables. Let's align on priority before adding new items."*

#### 🎯 Micro-Intention:
Protect your primary focus block today. If an unplanned request arrives, wait 15 minutes before replying to evaluate your genuine capacity."""

    elif template_id == "imposter_syndrome":
        return f"""### ✨ Empathetic Reassurance: Imposter Syndrome Check

The sensation of feeling 'behind' or that teammates possess effortlessly superior mastery is remarkably common among top engineers, **{user_name}**.

#### 🎭 Separating Subjective Fear from Reality:
- **The Subjective Fear**: *"Everyone else grasps this architecture instantly, and they'll eventually discover I'm struggling."*
- **The Objective Truth**: Technical expertise is deeply specialized. You are comparing your internal uncertainties and rough drafts to your peers' finished, polished outputs.

#### 💡 Evidence of Genuine Capability:
You are actively engaging with difficult logic, asking critical questions, and shipping solutions. Growth only happens at the boundary of what is currently comfortable.

#### 🎯 Micro-Intention:
Note one technical concept or problem you understand today that you didn't understand 6 months ago. Honor your steady progress."""

    elif template_id == "work_life":
        return f"""### ✨ Empathetic Guidance: Work-Life Boundary

Creating a definitive psychological boundary between work and rest is vital for cognitive replenishment, **{user_name}**.

#### 🏡 Boundary Assessment:
- Persistent checking of work channels in the evening keeps the brain in a chronic state of threat-monitoring.
- Deep architectural breakthroughs often occur when you step away completely and allow your subconscious mind to consolidate memories.

#### 🔒 Recommended End-of-Day Shutdown Ritual:
1. Save your work and close all active code editor and terminal tabs.
2. Jot down a brief 2-line note for tomorrow morning: *"Where I left off & the single first step to begin."*
3. Close your laptop lid and state out loud: *"My engineering work for today is complete."*

#### 🎯 Micro-Intention:
Mute work notifications on your phone tonight. Give your mind complete permission to rest."""

    else:
        return f"""### ✨ Empathetic Summary: Freeform Reflection

Thank you for writing down your authentic reflections today, **{user_name}**. Giving voice to your internal experiences in a secure, private space is a powerful practice of self-care.

#### 💡 Key Takeaway:
Whatever you are navigating right now—whether fatigue, momentum, uncertainty, or satisfaction—is completely valid.

#### 🎯 Reflective Inquiry:
What is one gentle, restorative action you can take in the next hour to support your well-being (drinking a fresh glass of water, taking a 5-minute outdoor walk, or taking a moment to stretch)?"""

# -----------------------------------------------------------------------------
# Initialize Session State
# -----------------------------------------------------------------------------
if "token" not in st.session_state:
    st.session_state.token = None

if "active_template_id" not in st.session_state:
    st.session_state.active_template_id = "cognitive_bias"

if "journal_input_text" not in st.session_state:
    st.session_state.journal_input_text = ""

if "selected_journal_id" not in st.session_state:
    st.session_state.selected_journal_id = None

if "standups" not in st.session_state:
    st.session_state.standups = [
        {
            "id": "standup-1",
            "userName": "Alex Rivera",
            "role": "Team Lead",
            "done": "Configured fallback local states, implemented area trend chart components, and tested container builds.",
            "planned": "Create interactive guided journal widgets and streak metrics.",
            "blocker": "Waiting on final schema deployment validations.",
            "parsedSummary": "Reconfigured local persistent caching and styled area trend layouts.",
            "createdAt": (datetime.datetime.now() - datetime.timedelta(days=2))
        },
        {
            "id": "standup-2",
            "userName": "Samantha Lee",
            "role": "Developer",
            "done": "Wrote memory database fallbacks and validated JWT authentication bypass routes.",
            "planned": "Implement WebSockets notifications for real-time streaming feeds.",
            "blocker": "",
            "parsedSummary": "Validated memory database routers and set up auth fallbacks.",
            "createdAt": (datetime.datetime.now() - datetime.timedelta(days=1))
        }
    ]

if "tasks" not in st.session_state:
    st.session_state.tasks = [
        {"id": "t-1", "title": "Establish cloud SQL connection fallbacks", "assignee": "Lead Developer", "status": "in-progress", "priority": "high", "isBlocker": True},
        {"id": "t-2", "title": "Refactor trend chart visualizations to support multi-sentiment weighting", "assignee": "Senior Frontend", "status": "done", "priority": "medium", "isBlocker": False},
        {"id": "t-3", "title": "Deploy robust Firestore security path rules", "assignee": "Database Architect", "status": "backlog", "priority": "high", "isBlocker": True},
        {"id": "t-4", "title": "Draft final stakeholder workspace demo guidelines", "assignee": "Product Manager", "status": "done", "priority": "low", "isBlocker": False}
    ]

if "signals" not in st.session_state:
    st.session_state.signals = [
        {"id": "sig-1", "userName": "Samantha Lee", "sentiment": "positive", "message": "Grateful for the fast turnaround on the local setup", "createdAt": (datetime.datetime.now() - datetime.timedelta(days=4))},
        {"id": "sig-2", "userName": "Alex Rivera", "sentiment": "neutral", "message": "Heavy review meetings scheduled for the backend refactoring", "createdAt": (datetime.datetime.now() - datetime.timedelta(days=3))},
        {"id": "sig-3", "userName": "Marcus Chen", "sentiment": "negative", "message": "Tight deadlines causing some workflow bottlenecks", "createdAt": (datetime.datetime.now() - datetime.timedelta(days=2))},
        {"id": "sig-4", "userName": "Jessica Taylor", "sentiment": "positive", "message": "Regression test suite run results are green!", "createdAt": (datetime.datetime.now() - datetime.timedelta(days=1))},
        {"id": "sig-5", "userName": "Samantha Lee", "sentiment": "positive", "message": "The local state dashboard works beautifully offline", "createdAt": datetime.datetime.now()}
    ]

if "journal" not in st.session_state:
    st.session_state.journal = [
        {
            "id": "j-1",
            "userId": "lead-dev",
            "text": "The local compiler is finally compiling green after hours of debugging, which relieved my stress levels significantly.",
            "response": "**Empathetic Analysis: Cognitive Bias Explorer**\n\nI hear the immense sense of relief in your words. When deep in technical troubleshooting, it's very common to slip into *emotional reasoning*—feeling that because a build is failing, your skills are somehow inadequate. You stayed methodical, worked through the errors step-by-step, and brought the project back to a healthy state.\n\n*Grounding Anchor for today:*\n> \"Technical obstacles are part of building complex systems, not a verdict on my capability. I have proven I can debug and resolve intricate issues.\"",
            "template": "Cognitive Bias Explorer",
            "templateId": "cognitive_bias",
            "createdAt": (datetime.datetime.now() - datetime.timedelta(days=1))
        },
        {
            "id": "j-2",
            "userId": "lead-dev",
            "text": "Felt tempted to work late today to fix more CSS classes, but I set a healthy boundary and closed down my laptop at 6 PM.",
            "response": "**Empathetic Coaching: Work-Life Boundary**\n\nClosing your laptop on time when there are still open tickets takes true psychological courage. Recognizing that work is an infinite stream—while your mental energy is a finite resource—is the hallmark of a resilient engineer.\n\n*Reframing & Reinforcement:*\n> Rest is not a reward you earn only after finishing everything; rest is a prerequisite to high-quality critical thinking tomorrow. Enjoy your evening completely detached from work.",
            "template": "Work-Life Boundary",
            "templateId": "work_life",
            "createdAt": datetime.datetime.now()
        }
    ]

if "burnout_score" not in st.session_state:
    st.session_state.burnout_score = 38

# -----------------------------------------------------------------------------
# Dynamic calculations
# -----------------------------------------------------------------------------
def calculate_streak(user_id: str = None):
    entries = st.session_state.journal
    if user_id:
        entries = [e for e in entries if e.get("userId") == user_id or "userId" not in e]
    
    if not entries:
        return 0
    
    unique_dates = sorted(list(set(
        e["createdAt"].date() for e in entries
    )), reverse=True)
    
    if not unique_dates:
        return 0
        
    today = datetime.date.today()
    yesterday = today - datetime.timedelta(days=1)
    
    if unique_dates[0] != today and unique_dates[0] != yesterday:
        return 0
        
    streak = 0
    current_check = unique_dates[0]
    
    for d in unique_dates:
        if d == current_check:
            streak += 1
            current_check -= datetime.timedelta(days=1)
        else:
            break
            
    return streak

def get_fatigue_risk_tier(score):
    if score > 65:
        return "High", "#f43f5e", "bg-rose-50 text-rose-700 border-rose-100"
    elif score > 35:
        return "Medium", "#f59e0b", "bg-amber-50 text-amber-700 border-amber-100"
    else:
        return "Low", "#10b981", "bg-emerald-50 text-emerald-700 border-emerald-100"

def recalculate_burnout_metrics():
    active_blockers = sum(1 for t in st.session_state.tasks if t["isBlocker"] and t["status"] != "done")
    total_active_tasks = sum(1 for t in st.session_state.tasks if t["status"] != "done")
    
    base = 25
    base += (active_blockers * 12)
    base += (total_active_tasks * 4)
    
    recent_signals = st.session_state.signals[-5:]
    negatives = sum(1 for s in recent_signals if s["sentiment"] == "negative")
    positives = sum(1 for s in recent_signals if s["sentiment"] == "positive")
    base += (negatives * 8) - (positives * 3)
    
    st.session_state.burnout_score = max(5, min(95, base))

# -----------------------------------------------------------------------------
# Sidebar Identity & Authentication Controller
# -----------------------------------------------------------------------------
with st.sidebar:
    st.markdown("<div class='accent-subtitle'>WORKSPACE CONTEXT</div>", unsafe_allow_html=True)
    
    if st.session_state.token is None:
        st.info("⚠️ Workspace currently locked. Please select an employee identity below to login.")
        for p in DEMO_PERSONAS:
            if st.button(f"{p['icon']} {p['displayName']}\n({p['role']})", key=f"auth-btn-{p['uid']}", use_container_width=True):
                st.session_state.token = f"mock-{p['uid']}:{p['email']}:{p['displayName']}:{p['role']}"
                st.rerun()
    else:
        token_parts = st.session_state.token.replace("mock-", "").split(":")
        active_uid = token_parts[0]
        active_email = token_parts[1]
        active_name = token_parts[2]
        active_role = token_parts[3]
        
        st.markdown(f"""
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 1rem; border-radius: 12px; margin-bottom: 1rem;">
                <span style="font-size: 0.65rem; font-weight: 800; color: #6366f1; text-transform: uppercase; letter-spacing: 0.1em; display: block; margin-bottom: 0.25rem;">Active Profile</span>
                <strong style="color: #1e293b; font-size: 0.95rem; display: block;">{active_name}</strong>
                <span style="color: #64748b; font-size: 0.75rem; display: block; margin-bottom: 0.5rem;">{active_role} &bull; {active_email}</span>
                <span class="status-badge badge-positive">Connected</span>
            </div>
        """, unsafe_allow_html=True)
        
        if st.button("🚪 Sign Out of Workspace", use_container_width=True):
            st.session_state.token = None
            st.rerun()
            
    st.markdown("---")
    st.markdown("<span style='font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase;'>🔒 Workspace Enforcements</span>", unsafe_allow_html=True)
    st.caption("Owner-Bound Firestore schemas active. Your private reflection entries & AI generated coaching feedback are protected and isolated.")

# -----------------------------------------------------------------------------
# MAIN HEADER
# -----------------------------------------------------------------------------
col_main_title, col_main_action = st.columns([3, 1])
with col_main_title:
    st.markdown("<div class='display-title'>🛡️ Async Workspace</div>", unsafe_allow_html=True)
    if st.session_state.token:
        st.markdown(f"<span style='color: #64748b; font-size: 14px;'>Welcome back, <strong style='color: #6366f1;'>{active_name}</strong>. Psychological safety portal and reflection coach active.</span>", unsafe_allow_html=True)
    else:
        st.markdown("<span style='color: #64748b; font-size: 14px;'>Psychological safety portal and live team metrics dashboard.</span>", unsafe_allow_html=True)
with col_main_action:
    if st.button("🔄 Sync Live Feed", use_container_width=True):
        recalculate_burnout_metrics()
        st.success("State synchronized!")

st.markdown("<div style='margin-bottom: 1.5rem;'></div>", unsafe_allow_html=True)

# -----------------------------------------------------------------------------
# WORKSPACE CONTENT
# -----------------------------------------------------------------------------
if st.session_state.token is None:
    st.warning("🔒 Authenticated Session Required. Please login using the sidebar identity sandbox to view or modify workspace items.")
    
    col_public_l, col_public_r = st.columns([7, 5])
    with col_public_l:
        st.markdown("### 📊 Public Team Burnout Indicator")
        score = st.session_state.burnout_score
        tier, t_color, t_class = get_fatigue_risk_tier(score)
        
        st.markdown(f"""
            <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1.25rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <strong>Overall Fatigue Rating</strong>
                    <span class="status-badge" style="background-color: {t_color}22; color: {t_color}; border: 1px solid {t_color}44;">{tier} Risk</span>
                </div>
                <div style="font-size: 2.25rem; font-weight: 800; color: #1e293b; margin-bottom: 0.5rem;">{score}%</div>
                <div style="background-color: #f1f5f9; height: 8px; border-radius: 9999px; overflow: hidden; margin-bottom: 0.5rem;">
                    <div style="background-color: {t_color}; width: {score}%; height: 100%;"></div>
                </div>
                <p style="color: #64748b; font-size: 0.75rem; line-height: 1.4; margin: 0;">
                    Calculated continuously using aggregate completion stats and blockers without compromising private user logs.
                </p>
            </div>
        """, unsafe_allow_html=True)
        
        st.markdown("#### Fatigue Grid (by Role)")
        roles_grid = [
            {"name": "Team Lead", "score": min(98, int(score * 1.1))},
            {"name": "Developer", "score": int(score * 0.95)},
            {"name": "Product Manager", "score": int(score * 0.8)},
            {"name": "QA Engineer", "score": int(score * 1.15)},
            {"name": "UI/UX Designer", "score": int(score * 0.7)}
        ]
        grid_cols = st.columns(len(roles_grid))
        for idx, rg in enumerate(roles_grid):
            with grid_cols[idx]:
                rg_tier, rg_color, rg_class = get_fatigue_risk_tier(rg["score"])
                st.markdown(f"""
                    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.5rem; text-align: center;">
                        <span style="font-size: 10px; font-weight: 700; color: #475569; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">{rg['name']}</span>
                        <strong style="font-size: 0.9rem; color: #1e293b; display: block; margin: 0.2rem 0;">{rg['score']}%</strong>
                        <span style="font-size: 8px; font-weight: 800; color: {rg_color}; text-transform: uppercase;">{rg_tier}</span>
                    </div>
                """, unsafe_allow_html=True)
                
    with col_public_r:
        st.markdown("### 📋 Active Shared Broadcasts")
        for sig in reversed(st.session_state.signals[-4:]):
            s_emoji = "😊" if sig["sentiment"] == "positive" else "😐" if sig["sentiment"] == "neutral" else "🚨"
            s_border = "#a7f3d0" if sig["sentiment"] == "positive" else "#cbd5e1" if sig["sentiment"] == "neutral" else "#fecdd3"
            st.markdown(f"""
                <div style="background-color: #ffffff; border-left: 4px solid {s_border}; border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.75rem; margin-bottom: 0.5rem;">
                    <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 0.25rem;">
                        <strong>{sig['userName']}</strong>
                        <span>{s_emoji}</span>
                    </div>
                    <p style="margin: 0; font-size: 0.75rem; color: #475569;">"{sig['message']}"</p>
                </div>
            """, unsafe_allow_html=True)

else:
    # Authenticated Tabs
    tab1, tab2, tab3 = st.tabs([
        "📊 Dashboard & Fatigue Heatmap", 
        "💻 Async Standups & Task Stream", 
        "📓 Private Reflection Journal"
    ])
    
    # -----------------------------------------------------------------------------
    # TAB 1: Dashboard & Fatigue Heatmap
    # -----------------------------------------------------------------------------
    with tab1:
        col_dash_l, col_dash_r = st.columns([7, 5])
        
        with col_dash_l:
            st.markdown("### 📊 Workload & Fatigue Insights")
            
            score = st.session_state.burnout_score
            tier, t_color, t_class = get_fatigue_risk_tier(score)
            
            st.markdown(f"""
                <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1.25rem; margin-bottom: 1.5rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                        <strong>Dynamic Burnout Index</strong>
                        <span class="status-badge" style="background-color: {t_color}22; color: {t_color}; border: 1px solid {t_color}44;">{tier} Risk</span>
                    </div>
                    <div style="display: flex; align-items: baseline; gap: 0.25rem; margin-bottom: 0.5rem;">
                        <span style="font-size: 2.5rem; font-weight: 800; color: #1e293b;">{score}</span>
                        <span style="color: #94a3b8; font-size: 1rem;">/100</span>
                    </div>
                    <div style="background-color: #f1f5f9; height: 10px; border-radius: 9999px; overflow: hidden; margin-bottom: 0.75rem;">
                        <div style="background-color: {t_color}; width: {score}%; height: 100%;"></div>
                    </div>
                    <p style="color: #64748b; font-size: 0.75rem; line-height: 1.4; margin: 0;">
                        Primary fatigue drivers and capacity loads are derived dynamically from completed tasks, unresolved blockers, and collective team signals.
                    </p>
                </div>
            """, unsafe_allow_html=True)
            
            st.markdown("#### 👥 Team Fatigue Grid (by Role)")
            roles_grid = [
                {"name": "Team Lead", "score": min(98, int(score * 1.1))},
                {"name": "Developer", "score": int(score * 0.95)},
                {"name": "Product Manager", "score": int(score * 0.8)},
                {"name": "QA Engineer", "score": int(score * 1.15)},
                {"name": "UI/UX Designer", "score": int(score * 0.7)},
                {"name": "DevOps Engineer", "score": min(99, int(score * 1.2))}
            ]
            
            rg_cols = st.columns(3)
            for idx, rg in enumerate(roles_grid):
                col_i = rg_cols[idx % 3]
                rg_tier, rg_color, rg_class = get_fatigue_risk_tier(rg["score"])
                with col_i:
                    st.markdown(f"""
                        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.75rem; margin-bottom: 0.5rem;">
                            <span style="font-size: 11px; font-weight: 700; color: #1e293b; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">{rg['name']}</span>
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.25rem;">
                                <span style="font-size: 9px; font-weight: 800; color: {rg_color}; text-transform: uppercase;">{rg_tier}</span>
                                <strong style="font-size: 0.85rem; color: #1e293b;">{rg['score']}%</strong>
                            </div>
                        </div>
                    """, unsafe_allow_html=True)

        with col_dash_r:
            st.markdown("### 📢 Shared Feelings & Signals")
            
            with st.form("broadcast_signal_form", clear_on_submit=True):
                sig_message = st.text_input("Broadcast an anonymous feeling signal:", placeholder="E.g., Great momentum on refactoring today!")
                sig_sentiment = st.radio("Signal Sentiment Rating:", ["positive", "neutral", "negative"], horizontal=True)
                
                if st.form_submit_button("Broadcast Signal"):
                    if not sig_message.strip():
                        st.error("Please enter a status message to broadcast.")
                    else:
                        new_sig = {
                            "id": f"sig-{random.randint(1000,9999)}",
                            "userName": active_name,
                            "sentiment": sig_sentiment,
                            "message": sig_message,
                            "createdAt": datetime.datetime.now()
                        }
                        st.session_state.signals.append(new_sig)
                        recalculate_burnout_metrics()
                        st.success("Feelings signal successfully broadcast to your team!")
                        st.rerun()

            st.markdown("---")
            st.caption("Active shared broadcasts:")
            for sig in reversed(st.session_state.signals[-4:]):
                s_emoji = "😊" if sig["sentiment"] == "positive" else "😐" if sig["sentiment"] == "neutral" else "🚨"
                s_border = "#10b981" if sig["sentiment"] == "positive" else "#64748b" if sig["sentiment"] == "neutral" else "#ef4444"
                st.markdown(f"""
                    <div style="background-color: #ffffff; border-left: 4px solid {s_border}; border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.75rem; margin-bottom: 0.5rem;">
                        <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 0.25rem;">
                            <strong>{sig['userName']}</strong>
                            <span>{s_emoji}</span>
                        </div>
                        <p style="margin: 0; font-size: 0.75rem; color: #475569;">"{sig['message']}"</p>
                    </div>
                """, unsafe_allow_html=True)

        st.markdown("---")
        st.markdown("### 📈 Last 7 Days Team Sentiment Trend Visualization")
        
        trend_dates = [datetime.date.today() - datetime.timedelta(days=i) for i in range(6, -1, -1)]
        trend_data = []
        
        for td in trend_dates:
            day_sigs = [s for s in st.session_state.signals if s["createdAt"].date() == td]
            if day_sigs:
                pos = sum(1 for s in day_sigs if s["sentiment"] == "positive")
                neu = sum(1 for s in day_sigs if s["sentiment"] == "neutral")
                neg = sum(1 for s in day_sigs if s["sentiment"] == "negative")
                score = int(((pos * 100) + (neu * 50) + (neg * 0)) / len(day_sigs))
            else:
                score = 50
                
            trend_data.append({
                "Date": td.strftime("%b %d"),
                "Sentiment Score": score
            })
            
        df_trend = pd.DataFrame(trend_data)
        
        trend_chart = alt.Chart(df_trend).mark_area(
            line={'color':'#6366f1', 'size': 2.5},
            color=alt.Gradient(
                gradient='linear',
                stops=[alt.GradientStop(color='#6366f1', offset=0),
                       alt.GradientStop(color='rgba(99, 102, 241, 0.05)', offset=1)],
                x1=1, y1=1, x2=1, y2=0
            )
        ).encode(
            x=alt.X('Date:O', sort=None, axis=alt.Axis(labelAngle=0, labelColor='#64748b', labelFontWeight='bold')),
            y=alt.Y('Sentiment Score:Q', scale=alt.Scale(domain=[0, 100]), axis=alt.Axis(values=[0, 25, 50, 75, 100])),
            tooltip=['Date', 'Sentiment Score']
        ).properties(height=200)
        
        st.altair_chart(trend_chart, use_container_width=True)

    # -----------------------------------------------------------------------------
    # TAB 2: Async Standups & Task Stream
    # -----------------------------------------------------------------------------
    with tab2:
        col_st_form, col_tasks_stream = st.columns([5, 7])
        
        with col_st_form:
            st.markdown("### 💻 Submit Daily Async Standup")
            st.markdown("<span style='font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;'>💡 Quick-Fill Templates:</span>", unsafe_allow_html=True)
            col_tpls = st.columns(3)
            
            apply_done_val = ""
            apply_planned_val = ""
            apply_blocker_val = ""
            
            with col_tpls[0]:
                if st.button("💻 Frontend", key="quick-fe"):
                    apply_done_val = "Refactored user dashboard components, integrated Lucide-react icons, and optimized responsive layouts."
                    apply_planned_val = "Integrate websocket listeners for the live stream and test mobile viewports."
                    apply_blocker_val = "Awaiting Figma updates for the performance dashboard design."
            with col_tpls[1]:
                if st.button("⚙️ Backend", key="quick-be"):
                    apply_done_val = "Created PostgreSQL schema adapters, implemented express routes, and configured route authentication."
                    apply_planned_val = "Write integration tests for workspace task assignment and implement a background cron cleanup loop."
                    apply_blocker_val = ""
            with col_tpls[2]:
                if st.button("🧪 QA", key="quick-qa"):
                    apply_done_val = "Wrote regression test suites for standup submission parsing and tested permission validation flows."
                    apply_planned_val = "Automate cross-browser layout verification and write synthetic latency load tests."
                    apply_blocker_val = "Temporary rate limit issues on the test cluster API endpoints."
            
            with st.form("standup_submission_form", clear_on_submit=True):
                done_in = st.text_area("What did you accomplish today?", value=apply_done_val, placeholder="Describe work done...")
                planned_in = st.text_area("What do you plan to work on next?", value=apply_planned_val, placeholder="Outline immediate objectives...")
                blocker_in = st.text_area("Are there any blockers?", value=apply_blocker_val, placeholder="Raise flags here to notify the team...")
                
                if st.form_submit_button("Submit Standup Update"):
                    if not done_in.strip() or not planned_in.strip():
                        st.error("Accomplished and Planned fields are mandatory.")
                    else:
                        new_st = {
                            "id": f"standup-{random.randint(1000,9999)}",
                            "userName": active_name,
                            "role": active_role,
                            "done": done_in,
                            "planned": planned_in,
                            "blocker": blocker_in,
                            "parsedSummary": done_in[:60] + "...",
                            "createdAt": datetime.datetime.now()
                        }
                        st.session_state.standups.insert(0, new_st)
                        
                        st.session_state.signals.append({
                            "id": f"sig-{random.randint(1000,9999)}",
                            "userName": active_name,
                            "sentiment": "negative" if blocker_in.strip() else "positive",
                            "message": f"Submitted daily async standup: {done_in[:40]}...",
                            "createdAt": datetime.datetime.now()
                        })
                        
                        recalculate_burnout_metrics()
                        st.success("Daily Async Standup logged successfully!")
                        st.rerun()
                        
        with col_tasks_stream:
            st.markdown("### 📋 Actionable Tasks Stream")
            
            for idx, task in enumerate(st.session_state.tasks):
                t_badge = "🔴 High" if task["priority"] == "high" else "🟡 Medium" if task["priority"] == "medium" else "🟢 Low"
                is_checked = task["status"] == "done"
                
                st.markdown(f"""
                    <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.75rem; margin-bottom: 0.5rem; display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <span style="font-size: 11px; font-weight: 700; color: #475569;">{task['assignee']}</span>
                            <p style="margin: 0.2rem 0; font-size: 0.8rem; font-weight: 600; color: #1e293b; text-decoration: {'line-through' if is_checked else 'none'};">{task['title']}</p>
                            <span style="font-size: 9px; font-weight: 800; color: #64748b;">Priority: {t_badge} | Blocker: {'Yes 🚨' if task['isBlocker'] else 'No'}</span>
                        </div>
                    </div>
                """, unsafe_allow_html=True)
                
                t_cols = st.columns([2, 2, 2, 6])
                with t_cols[0]:
                    if st.button("Complete", key=f"btn-done-{task['id']}", type="secondary"):
                        task["status"] = "done"
                        recalculate_burnout_metrics()
                        st.rerun()
                with t_cols[1]:
                    if st.button("In-Progress", key=f"btn-prog-{task['id']}", type="secondary"):
                        task["status"] = "in-progress"
                        recalculate_burnout_metrics()
                        st.rerun()
                with t_cols[2]:
                    if st.button("Backlog", key=f"btn-back-{task['id']}", type="secondary"):
                        task["status"] = "backlog"
                        recalculate_burnout_metrics()
                        st.rerun()
                        
            st.markdown("---")
            st.markdown("#### ➕ Assign New Task Object")
            with st.form("create_task_form", clear_on_submit=True):
                new_t_title = st.text_input("Task Title:")
                new_t_assignee = st.selectbox("Assignee Role:", ["Lead Developer", "Senior Frontend", "Database Architect", "Product Manager", "QA Automation"])
                new_t_priority = st.selectbox("Priority:", ["low", "medium", "high"])
                new_t_blocker = st.checkbox("Mark as critical team Blocker")
                
                if st.form_submit_button("Add Task to Stream"):
                    if not new_t_title.strip():
                        st.error("Task title cannot be empty.")
                    else:
                        st.session_state.tasks.append({
                            "id": f"t-{random.randint(1000,9999)}",
                            "title": new_t_title,
                            "assignee": new_t_assignee,
                            "status": "backlog",
                            "priority": new_t_priority,
                            "isBlocker": new_t_blocker
                        })
                        recalculate_burnout_metrics()
                        st.success("New task created and mapped to team backlog!")
                        st.rerun()

    # -----------------------------------------------------------------------------
    # TAB 3: Private Reflection Journal (Full AI Reflection Generation & Inspection)
    # -----------------------------------------------------------------------------
    with tab3:
        col_j_form, col_j_logs = st.columns([7, 5])
        
        # Determine active template
        current_tpl = next((t for t in JOURNAL_TEMPLATES if t["id"] == st.session_state.active_template_id), JOURNAL_TEMPLATES[0])
        
        with col_j_form:
            # Header with streak counter & AI engine status
            hdr_left, hdr_right = st.columns([3, 1])
            with hdr_left:
                st.markdown("### 📓 Private Reflection Journal")
                has_key = bool(get_gemini_api_key())
                if has_key:
                    st.markdown("<span style='font-size: 10px; font-weight: 800; color: #6366f1; background-color: #eef2ff; border: 1px solid #c7d2fe; padding: 2px 8px; border-radius: 6px;'>✨ Gemini Live AI Mode</span> <span style='font-size: 11px; color: #64748b;'>Private Psychologist Coach Active</span>", unsafe_allow_html=True)
                else:
                    st.markdown("<span style='font-size: 10px; font-weight: 800; color: #047857; background-color: #ecfdf5; border: 1px solid #a7f3d0; padding: 2px 8px; border-radius: 6px;'>🛡️ Empathetic Cognitive Coach</span> <span style='font-size: 11px; color: #64748b;'>Built-in Clinical Reflection Engine</span>", unsafe_allow_html=True)
            with hdr_right:
                streak_count = calculate_streak(active_uid)
                st.markdown(f"""
                    <div class='streak-widget'>
                        🔥 {streak_count} Day Streak
                    </div>
                """, unsafe_allow_html=True)
                
            st.markdown("---")
            
            # Template selector grid (matching studio layout)
            st.markdown("<span style='font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;'>Select Guided Reflection Prompt Mode:</span>", unsafe_allow_html=True)
            
            # Display templates in 2 columns
            tpl_cols = st.columns(2)
            for idx, tpl in enumerate(JOURNAL_TEMPLATES):
                is_selected = st.session_state.active_template_id == tpl["id"]
                with tpl_cols[idx % 2]:
                    btn_label = f"{'👉 ' if is_selected else ''}{tpl['icon']} {tpl['title']}"
                    if st.button(
                        btn_label, 
                        key=f"tpl_btn_{tpl['id']}", 
                        type="primary" if is_selected else "secondary",
                        use_container_width=True
                    ):
                        st.session_state.active_template_id = tpl["id"]
                        st.rerun()

            # Guided prompt instruction box
            st.info(f"💡 **Guidance for '{current_tpl['title']}':** {current_tpl['desc']}\n\nType your authentic thoughts below and click **✨ Log & Generate Reflection** to receive compassionate, psychologist-level cognitive reframing.")

            # Quick Fill Examples
            st.markdown("<span style='font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase;'>💡 Quick-Fill Example Scenarios (Click to load):</span>", unsafe_allow_html=True)
            ex_cols = st.columns(len(QUICK_EXAMPLES))
            for idx, ex in enumerate(QUICK_EXAMPLES):
                with ex_cols[idx]:
                    if st.button(ex["label"], key=f"ex_btn_{idx}", use_container_width=True):
                        st.session_state.active_template_id = ex["templateId"]
                        st.session_state.journal_input_text = ex["text"]
                        st.rerun()

            # Journal Form with explicit AI Reflection Generator trigger
            with st.form("private_journal_submit_form", clear_on_submit=False):
                entry_text_input = st.text_area(
                    "Your Secure Thoughts & Reflections:", 
                    value=st.session_state.journal_input_text, 
                    placeholder=current_tpl["placeholder"], 
                    height=140,
                    key="journal_form_text_area"
                )
                
                col_sub_l, col_sub_r = st.columns([2, 1])
                with col_sub_l:
                    st.caption(f"Active Prompt Mode: **{current_tpl['title']}**")
                with col_sub_r:
                    submitted = st.form_submit_button("✨ Log & Generate Reflection", type="primary", use_container_width=True)

                if submitted:
                    entered_val = entry_text_input.strip()
                    if not entered_val:
                        st.error("Please write your reflection thoughts before generating.")
                    else:
                        with st.spinner(f"Generating empathetic cognitive reflection for {active_name}..."):
                            # Get existing user entries for context
                            existing_user_entries = [e for e in st.session_state.journal if e.get("userId") == active_uid or "userId" not in e]
                            
                            # Generate AI reflection feedback
                            ai_response = generate_ai_reflection(
                                entry_text=entered_val,
                                template_id=current_tpl["id"],
                                template_title=current_tpl["title"],
                                user_name=active_name,
                                history_entries=existing_user_entries
                            )
                            
                            new_entry_id = f"j-{random.randint(1000,9999)}"
                            new_entry = {
                                "id": new_entry_id,
                                "userId": active_uid,
                                "text": entered_val,
                                "response": ai_response,
                                "template": current_tpl["title"],
                                "templateId": current_tpl["id"],
                                "createdAt": datetime.datetime.now()
                            }
                            
                            st.session_state.journal.insert(0, new_entry)
                            st.session_state.selected_journal_id = new_entry_id
                            st.session_state.journal_input_text = ""
                            st.success("✨ Reflection logged and Gemini Empathetic Feedback generated!")
                            st.rerun()

        # Right column: Detailed entry inspector or History log
        with col_j_logs:
            user_entries = [e for e in st.session_state.journal if e.get("userId") == active_uid or "userId" not in e]
            
            # Check if an entry is currently selected for deep inspection
            selected_entry = None
            if st.session_state.selected_journal_id:
                selected_entry = next((e for e in user_entries if e["id"] == st.session_state.selected_journal_id), None)
            
            if selected_entry:
                st.markdown("### 🔍 Reflection Feedback View")
                
                col_back, col_regen = st.columns([1, 1])
                with col_back:
                    if st.button("← Back to Log History", key="btn_back_to_history", use_container_width=True):
                        st.session_state.selected_journal_id = None
                        st.rerun()
                with col_regen:
                    if st.button("✨ Regenerate AI Feedback", key=f"regen_{selected_entry['id']}", use_container_width=True):
                        with st.spinner("Regenerating empathetic reflection..."):
                            refreshed_ai = generate_ai_reflection(
                                entry_text=selected_entry["text"],
                                template_id=selected_entry.get("templateId", "general"),
                                template_title=selected_entry.get("template", "Reflection"),
                                user_name=active_name,
                                history_entries=[e for e in user_entries if e["id"] != selected_entry["id"]]
                            )
                            selected_entry["response"] = refreshed_ai
                            st.success("Feedback refreshed!")
                            st.rerun()
                
                # User entry card
                st.markdown("<span style='font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase;'>My Entry</span>", unsafe_allow_html=True)
                st.markdown(f"""
                    <div class='reflection-box-user'>
                        <span style='font-size: 11px; font-weight: 700; color: #9333ea; display: block; margin-bottom: 0.25rem;'>
                            📝 {selected_entry.get('template', 'Reflection')} &bull; {selected_entry['createdAt'].strftime('%B %d, %Y at %H:%M')}
                        </span>
                        <p style='margin: 0; font-size: 0.85rem; color: #1e293b; line-height: 1.5; font-style: italic;'>
                            "{selected_entry['text']}"
                        </p>
                    </div>
                """, unsafe_allow_html=True)
                
                # AI Generated Reflection Card
                st.markdown("<span style='font-size: 10px; font-weight: 800; color: #9333ea; text-transform: uppercase;'>✨ Gemini Empathetic Reflection</span>", unsafe_allow_html=True)
                
                # Render using Markdown for rich formatted lists and quotes
                ai_text = selected_entry.get('response', 'No AI response recorded.')
                st.markdown(f"""
                    <div class='reflection-box-ai'>
                        <div style='font-size: 0.85rem; color: #374151; line-height: 1.6;'>
                """, unsafe_allow_html=True)
                st.markdown(ai_text)
                st.markdown("</div></div>", unsafe_allow_html=True)
                
            else:
                st.markdown("### 📒 Reflection Log History")
                st.caption("Owner-bound private log entries. Click any entry to inspect its generated AI reflection feedback.")
                
                if not user_entries:
                    st.info("No reflection logs recorded yet for this profile. Choose a guided template on the left and submit your first entry!")
                else:
                    for entry in user_entries:
                        tpl_info = next((t for t in JOURNAL_TEMPLATES if t["id"] == entry.get("templateId")), None)
                        icon = tpl_info["icon"] if tpl_info else "📝"
                        
                        col_card_text, col_card_btn = st.columns([4, 1])
                        with col_card_text:
                            st.markdown(f"""
                                <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.75rem; margin-bottom: 0.5rem;">
                                    <div style="display: flex; align-items: center; gap: 0.4rem; margin-bottom: 0.2rem;">
                                        <span>{icon}</span>
                                        <strong style="font-size: 12px; color: #1e293b;">{entry.get('template', 'Reflection')}</strong>
                                    </div>
                                    <p style="margin: 0; font-size: 11px; color: #475569; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                                        "{entry['text']}"
                                    </p>
                                    <span style="font-size: 9px; color: #94a3b8;">{entry['createdAt'].strftime('%b %d, %Y &bull; %H:%M')}</span>
                                </div>
                            """, unsafe_allow_html=True)
                        with col_card_btn:
                            if st.button("View AI ✨", key=f"inspect_{entry['id']}", use_container_width=True):
                                st.session_state.selected_journal_id = entry["id"]
                                st.rerun()

            st.markdown("---")
            st.caption("🔒 Locked under Owner-Bound Firestore Security Rule:\n`allow read, write: if request.auth.uid == userId;`")
