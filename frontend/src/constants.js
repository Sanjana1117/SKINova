// ── COLOUR PALETTE ──────────────────────────────────────────────────
export const P = {
  bg: "#F7F2EA", bgDeep: "#EDE5D8", card: "#FFFFFF", cardWarm: "#FBF7F1",
  tc: "#C4714A", tcLight: "#D98B68", tcPale: "#F2DACE", clay: "#9A5535",
  moss: "#6B8A50", mossL: "#8FAE6A", mossPale: "#DCE8D0",
  dusk: "#7A6050", sand: "#E8DECE", cream: "#FAF6EE",
  brown: "#2E1F12", brownMid: "#5A3E2C", muted: "#9A856E",
  lavender: "#B8AACE", lavPale: "#EDE8F5",
  gold: "#C8A050", goldPale: "#F5ECD8",
  peach: "#EEBFA0", rose: "#D4848A", rosePale: "#F5E2E4",
};

// ── SCREEN NAMES ────────────────────────────────────────────────────
export const S = {
  SPLASH: "splash", OB1: "ob1", OB2: "ob2", SIGNUP: "signup",
  PROFILE: "profile", PRODUCTS: "products",
  FDASH: "fdash", MDASH: "mdash", FOOD: "food", FORECAST: "forecast",
  CALIB: "calib", HISTORY: "history", CHAT: "chat",
  NOTIFS: "notifs", PRODMGR: "prodmgr", SETTINGS: "settings",
};

// ── GLOBAL CSS (inject once in App.jsx) ─────────────────────────────
export const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Jost:wght@300;400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  ::-webkit-scrollbar { width: 0; height: 0; }
  @keyframes fadeUp { from{opacity:0;transform:translateY(16px);}to{opacity:1;transform:translateY(0);} }
  @keyframes fadeIn { from{opacity:0;}to{opacity:1;} }
  @keyframes pulse { 0%,100%{transform:scale(1);}50%{transform:scale(1.08);} }
  @keyframes float { 0%,100%{transform:translateY(0);}50%{transform:translateY(-7px);} }
  @keyframes ringPulse { 0%{box-shadow:0 0 0 0 rgba(196,113,74,.45);}100%{box-shadow:0 0 0 16px rgba(196,113,74,0);} }
  @keyframes spin { from{transform:rotate(0deg);}to{transform:rotate(360deg);} }
  @keyframes blink { 0%,100%{opacity:1;}50%{opacity:0;} }
  @keyframes slideUp { from{opacity:0;transform:translateY(24px);}to{opacity:1;transform:translateY(0);} }
  @keyframes msgIn { from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);} }
`;

// ── AI CHAT SYSTEM PROMPT ────────────────────────────────────────────
export const SYSTEM_PROMPT = `You are Nova, Skinova's AI skin health coach powered by Llama 4 (via Groq). You are warm, empathetic, and knowledgeable about skin health.

The user's skin data context:
- Current skin score: 73/100 (improved +5 from yesterday)
- Inflammatory Risk Score today: 5.8/10 (moderate, dairy flagged)
- 3-day flare risk: 72% tomorrow (high)
- Top triggers identified: dairy intake 3 days ago (71% weight), poor sleep (19% weight)
- Hormonal phase (if female): Luteal phase (days 15-28) — elevated skin sensitivity
- Recent meals: Masala oats, Paneer tikka, Chai with biscuits
- Skincare products: CeraVe, Neutrogena SPF50, The Ordinary Niacinamide
- Streak: 18 days logged

Your role:
- Answer skin health questions using their personal data when relevant
- Explain what their scores and forecasts mean in plain language
- Give actionable, personalised advice based on their trigger history
- Explain Skinova features when asked
- Be encouraging and supportive
- Keep responses concise — 2-4 sentences for simple questions, slightly longer for complex ones
- Always add a disclaimer for anything medical: "This is not medical advice — consult a dermatologist for clinical concerns."
- You are NOT a doctor. Never diagnose conditions.`;
