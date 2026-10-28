# 🚀 InsightGen AI — Enterprise SaaS Analytics Experience

---

## 1. What Makes This Experience Enterprise-Grade?

Traditional prototypes display static, disconnected cards. **InsightGen AI** has been overhauled into an **interactive AI Data Scientist workspace** inspired by products like Julius AI, Hex, and Tableau AI.

```
┌────────────────────────────────────────────────────────────────────────┐
│  InsightGen AI Top Navbar  [Live Ping: 46ms] [API Settings] [Upload New]│
└────────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌────────────────────────────────────────────────────────────────────────┐
│  Instant AI Dataset Briefing (Automated on Upload)                     │
│  - Data Quality Health Score: 100/100                                  │
│  - Primary Metric: total_revenue (Mean: $3,360.97 | Max: $7,380.00)     │
│  - Completeness: 100% (0 missing values, 0 duplicate rows)             │
│  - Recommended Exploratory Questions (Click to Ask)                    │
└────────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌────────────────────────────────────────────────────────────────────────┐
│  Workspace Studio Tabs:                                                │
│  [💬 AI Analyst Chat]   [📊 Data Quality Matrix]   [📋 Tabular Preview]│
└────────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌────────────────────────────────────────────────────────────────────────┐
│  Multi-Turn Conversational Stream (ChatGPT for Data Science)           │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ User: "Which region generated the highest revenue?"              │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ 🤖 AI Data Scientist:                                            │  │
│  │  - Verified Finding: North generated top revenue ($19,968.50)     │  │
│  │  - KPI Strip: Top Leader | Top Value | Total Sum | Mean/Cat      │  │
│  │  - Interactive Chart Studio: [Bar] [Trend] [Share] [Data Table]  │  │
│  │  - Inspect Python / Pandas Code Drawer (df.groupby... in 1.39ms) │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Key Enterprise Capabilities

### 1. Interactive Visual Chart Studio
Users can switch between 4 different analytical visual representations in one click:
- **Bar Chart**: Gradient-filled horizontal bars showing exact values and relative percentage shares.
- **Trend Line**: Continuous distribution with highlighted node markers.
- **Donut Share**: Segmented proportional breakdown showing market/revenue share.
- **Data Grid**: Formatted numerical table with decimal accuracy.

### 2. Multi-Turn Conversational Stream
- Conversational timeline preserving queries and verified findings.
- Suggested query chips tailored to the active dataset.
- Clear Thread and follow-up support.

### 3. Execution Provenance & Audit Drawer
Every finding can be expanded to inspect:
- The exact deterministic Pandas expression executed: `df.groupby(['region'])['total_revenue'].sum()`
- Source rows evaluated: `20 records`
- Execution latency: `1.39ms`
- Deterministic engine tag: `Pandas v2.2 (Deterministic Engine)`

### 4. In-App API Key & Model Configuration
- An in-app modal allows users to configure their **Google Gemini API Key** and model selection (`gemini-3.8-flash`, `gemini-1.5-pro`) directly in the UI without editing files.
- Resilient fallback to the built-in deterministic semantic engine if no API key is provided.

---

## 3. How to Obtain a Free Google Gemini API Key

If you wish to connect your personal Google Gemini API key:
1. Visit **Google AI Studio**: [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey).
2. Sign in with your Google account and click **"Create API Key"**.
3. Copy your key (starts with `AIzaSy...`).
4. In InsightGen AI, click the top-right **"API Settings"** button, paste your key, and click **Save**.
