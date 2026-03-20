# Skinova UI Prototype — v2.0

A complete 16-screen mobile app prototype for Skinova, built in React JSX.

## File Structure

```
src/
├── App.jsx                    ← Root component + screen router
├── constants.js               ← Colours (P), screen names (S), CSS, AI prompt
├── components/
│   └── UIComponents.jsx       ← Phone, StatusBar, BottomNav, Ring, Pill, ST, Btn
└── screens/
    ├── Splash.jsx             ← Animated splash screen
    ├── Onboarding.jsx         ← Onboard1 + Onboard2
    ├── Signup.jsx             ← 2-step signup + gender selection
    ├── ProfileSetup.jsx       ← HealthProfile + ProductsSetup
    ├── Calibration.jsx        ← Days 1–14 cold start period
    ├── Dashboards.jsx         ← FemaleDashboard + MaleDashboard
    ├── FoodLog.jsx            ← Daily food journal with IRS scoring
    ├── Forecast.jsx           ← 3-day TFT forecast + Llama 4 explanation
    ├── Chat.jsx               ← AI chat with Nova (live API)
    ├── SkinHistory.jsx        ← 8-month trend + before/after
    └── Misc.jsx               ← Notifications + ProductManager + Settings
```

## How to Run

### Option A — Claude.ai Artifact
Paste `skinova_app_v2.jsx` (single-file version) into a Claude.ai chat as a React artifact.

### Option B — Local Vite project
```bash
npm create vite@latest skinova-demo -- --template react
cd skinova-demo
# Copy src/ folder into the project
npm install
npm run dev
```

## AI Chat in Production
The Chat screen uses Claude API for the prototype. To switch to Groq + Llama 4 in production:
```javascript
const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
  headers: { "Authorization": `Bearer ${GROQ_API_KEY}`, "Content-Type": "application/json" },
  body: JSON.stringify({
    model: "llama-4-scout-17b-16e-instruct",
    messages: [{ role: "system", content: SYSTEM_PROMPT }, ...conversationHistory],
  })
});
```
