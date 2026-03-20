import { Phone, StatusBar, BottomNav, Ring, ST, Pill } from "../components/UIComponents.jsx";
import { P, S } from "../constants.js";

// Shared selfie prompt used by both dashboards
function SelfiePrompt() {
  return (
    <div style={{ margin: "0 20px 14px", background: `linear-gradient(135deg,${P.tcPale},${P.goldPale})`, borderRadius: 20, padding: "15px 17px", display: "flex", alignItems: "center", gap: 13 }}>
      <div style={{ width: 50, height: 50, borderRadius: 14, background: `linear-gradient(135deg,${P.tc},${P.clay})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0, animation: "ringPulse 2s ease infinite" }}>📸</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: "Jost,sans-serif", fontSize: 14, fontWeight: 600, color: P.brown }}>Upload today's selfie</div>
        <div style={{ fontFamily: "Jost,sans-serif", fontSize: 11, color: P.muted, marginTop: 2, fontWeight: 300 }}>Post face-wash · natural light</div>
      </div>
      <div style={{ width: 34, height: 34, borderRadius: "50%", background: P.tc, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 20 }}>+</div>
    </div>
  );
}

// Shared shortcuts row
function Shortcuts({ onNav }) {
  return (
    <div style={{ margin: "0 20px 14px", display: "flex", gap: 10 }}>
      {[{ icon: "📊", label: "History", screen: S.HISTORY }, { icon: "🧴", label: "Products", screen: S.PRODMGR }, { icon: "✦", label: "AI Chat", screen: S.CHAT }].map(b => (
        <button key={b.label} onClick={() => onNav(b.screen)} style={{ flex: 1, padding: "13px 8px", borderRadius: 16, border: `1px solid ${P.sand}`, background: P.card, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 5, boxShadow: "0 2px 8px rgba(46,31,18,.04)" }}>
          <span style={{ fontSize: 22 }}>{b.icon}</span>
          <span style={{ fontFamily: "Jost,sans-serif", fontSize: 11, fontWeight: 500, color: P.brownMid }}>{b.label}</span>
        </button>
      ))}
    </div>
  );
}

// ── FEMALE DASHBOARD ─────────────────────────────────────────────────
export function FemaleDashboard({ onNav }) {
  const bars = [60, 55, 63, 58, 70, 68, 73];
  return (
    <Phone>
      <StatusBar />
      <div style={{ flex: 1, overflowY: "auto", background: P.bg }}>
        {/* header */}
        <div style={{ padding: "12px 24px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontFamily: "Jost,sans-serif", fontSize: 12, color: P.muted, fontWeight: 300 }}>Good morning,</div>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, color: P.brown, fontWeight: 500 }}>Priya ✦</div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button onClick={() => onNav(S.NOTIFS)} style={{ width: 38, height: 38, borderRadius: "50%", background: P.card, border: `1px solid ${P.sand}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, position: "relative" }}>
              🔔<div style={{ position: "absolute", top: 6, right: 6, width: 8, height: 8, borderRadius: "50%", background: P.tc }} />
            </button>
            <div onClick={() => onNav(S.SETTINGS)} style={{ width: 44, height: 44, borderRadius: "50%", background: `linear-gradient(135deg,${P.tc},${P.clay})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, color: "white", fontWeight: 600, cursor: "pointer", boxShadow: "0 4px 12px rgba(196,113,74,.4)" }}>P</div>
          </div>
        </div>

        {/* streak banner */}
        <div style={{ margin: "14px 20px", background: `linear-gradient(135deg,${P.brown},${P.brownMid})`, borderRadius: 20, padding: "16px 20px", boxShadow: "0 6px 20px rgba(46,31,18,.2)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontFamily: "Jost,sans-serif", fontSize: 11, color: "rgba(255,255,255,.5)", letterSpacing: ".1em", textTransform: "uppercase" }}>Day 18 of 30</div>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, color: "white", marginTop: 3, fontWeight: 500 }}>Forecast Active 🔮</div>
            </div>
            <Pill label="Luteal Phase" color={P.lavender} bg="rgba(184,170,206,.2)" />
          </div>
          <div style={{ marginTop: 12, height: 5, borderRadius: 4, background: "rgba(255,255,255,.12)", overflow: "hidden" }}>
            <div style={{ height: "100%", width: "60%", borderRadius: 4, background: `linear-gradient(90deg,${P.tcLight},${P.gold})` }} />
          </div>
        </div>

        {/* score + stats */}
        <div style={{ margin: "0 20px 14px", display: "flex", gap: 12 }}>
          <div style={{ flex: 1.2, background: P.card, borderRadius: 20, padding: "17px 14px", display: "flex", flexDirection: "column", alignItems: "center", boxShadow: "0 2px 12px rgba(46,31,18,.06)" }}>
            <div style={{ fontFamily: "Jost,sans-serif", fontSize: 10, color: P.muted, fontWeight: 500, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 11 }}>Skin Score</div>
            <Ring value={73} size={100} stroke={7} color={P.moss} label="Today" />
            <div style={{ marginTop: 9, display: "flex", alignItems: "center", gap: 5 }}><span style={{ fontSize: 12, color: P.moss, fontWeight: 500 }}>↑ +5</span><span style={{ fontSize: 11, color: P.muted }}>vs yesterday</span></div>
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
            {[{ l: "Inflammation", v: "6.2", u: "/10", c: P.tc, i: "🔥" }, { l: "Flare Risk", v: "42%", u: "", c: P.gold, i: "⚡" }, { l: "Hydration", v: "Good", u: "", c: P.moss, i: "💧" }].map(s => (
              <div key={s.l} style={{ background: P.card, borderRadius: 15, padding: "11px 13px", boxShadow: "0 2px 8px rgba(46,31,18,.05)", flex: 1 }}>
                <div style={{ fontFamily: "Jost,sans-serif", fontSize: 9, color: P.muted, fontWeight: 500, letterSpacing: ".07em", textTransform: "uppercase", marginBottom: 3 }}>{s.i} {s.l}</div>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, color: s.c, fontWeight: 500 }}>{s.v}<span style={{ fontSize: 11, fontFamily: "Jost,sans-serif", color: P.muted }}>{s.u}</span></div>
              </div>
            ))}
          </div>
        </div>

        {/* hormonal tracker */}
        <div style={{ margin: "0 20px 14px", background: `linear-gradient(135deg,${P.lavPale},#EEE8F8)`, borderRadius: 20, padding: "15px 17px", border: `1px solid ${P.lavender}30` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 11 }}>
            <div style={{ fontFamily: "Jost,sans-serif", fontSize: 12, fontWeight: 600, color: P.brown }}>🌸 Hormonal Cycle</div>
            <Pill label="Luteal Phase" color="#9070B8" bg="rgba(144,112,184,.15)" />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 5 }}>
            {[["Menstrual", "1–5", false], ["Follicular", "6–13", false], ["Ovulatory", "14", false], ["Luteal", "15–28", true]].map(([ph, d, on]) => (
              <div key={ph} style={{ flex: 1, textAlign: "center", padding: "8px 3px", borderRadius: 11, background: on ? "rgba(144,112,184,.2)" : "transparent", border: `1.5px solid ${on ? "rgba(144,112,184,.4)" : "transparent"}` }}>
                <div style={{ fontFamily: "Jost,sans-serif", fontSize: 9, fontWeight: on ? 600 : 400, color: on ? "#9070B8" : P.muted }}>{ph}</div>
                <div style={{ fontSize: 9, color: P.muted, marginTop: 2 }}>{d}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 9, fontFamily: "Jost,sans-serif", fontSize: 11, color: "#9070B8", fontWeight: 300, fontStyle: "italic" }}>⚠ More reactive to dairy &amp; sugar in this phase</div>
        </div>

        <SelfiePrompt />
        <Shortcuts onNav={onNav} />

        {/* 7-day trend */}
        <div style={{ margin: "0 20px 14px", background: P.card, borderRadius: 20, padding: "16px 17px", boxShadow: "0 2px 12px rgba(46,31,18,.06)" }}>
          <ST>7-Day Skin Trend</ST>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 68 }}>
            {bars.map((v, i) => { const on = i === 6; return (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <div style={{ width: "100%", height: `${(v / 100) * 58}px`, borderRadius: "6px 6px 0 0", background: on ? `linear-gradient(180deg,${P.tc},${P.clay})` : `linear-gradient(180deg,${P.sand},${P.bgDeep})`, boxShadow: on ? "0 -2px 8px rgba(196,113,74,.3)" : "none" }} />
                <span style={{ fontSize: 9, fontFamily: "Jost,sans-serif", color: on ? P.tc : P.muted, fontWeight: on ? 600 : 400 }}>{"MTWTFST"[i]}</span>
              </div>
            ); })}
          </div>
        </div>

        {/* triggers */}
        <div style={{ margin: "0 20px 20px", background: P.card, borderRadius: 20, padding: "16px 17px", boxShadow: "0 2px 12px rgba(46,31,18,.06)" }}>
          <ST>Today's Triggers</ST>
          {[{ l: "Dairy intake (3 days ago)", r: "High", c: P.tc, bg: P.tcPale, p: 78 }, { l: "Sleep < 6hrs last night", r: "Med", c: P.gold, bg: P.goldPale, p: 45 }, { l: "Luteal phase sensitivity", r: "Med", c: "#9070B8", bg: P.lavPale, p: 38 }].map((t, i) => (
            <div key={i} style={{ marginBottom: i < 2 ? 12 : 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                <span style={{ fontFamily: "Jost,sans-serif", fontSize: 12, color: P.brownMid, fontWeight: 300 }}>{t.l}</span>
                <Pill label={t.r} color={t.c} bg={t.bg} />
              </div>
              <div style={{ height: 4, borderRadius: 4, background: P.sand, overflow: "hidden" }}><div style={{ height: "100%", width: `${t.p}%`, borderRadius: 4, background: t.c }} /></div>
            </div>
          ))}
        </div>
      </div>
      <BottomNav active="home" onNav={onNav} gender="female" />
    </Phone>
  );
}

// ── MALE DASHBOARD ───────────────────────────────────────────────────
export function MaleDashboard({ onNav }) {
  const bars = [72, 68, 75, 70, 65, 71, 68];
  return (
    <Phone>
      <StatusBar />
      <div style={{ flex: 1, overflowY: "auto", background: P.bg }}>
        {/* header */}
        <div style={{ padding: "12px 24px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontFamily: "Jost,sans-serif", fontSize: 12, color: P.muted, fontWeight: 300 }}>Good morning,</div>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, color: P.brown, fontWeight: 500 }}>Arjun ✦</div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button onClick={() => onNav(S.NOTIFS)} style={{ width: 38, height: 38, borderRadius: "50%", background: P.card, border: `1px solid ${P.sand}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, position: "relative" }}>
              🔔<div style={{ position: "absolute", top: 6, right: 6, width: 8, height: 8, borderRadius: "50%", background: P.tc }} />
            </button>
            <div onClick={() => onNav(S.SETTINGS)} style={{ width: 44, height: 44, borderRadius: "50%", background: `linear-gradient(135deg,${P.moss},#4A6A30)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, color: "white", fontWeight: 600, cursor: "pointer", boxShadow: "0 4px 12px rgba(107,138,80,.4)" }}>A</div>
          </div>
        </div>

        {/* streak banner */}
        <div style={{ margin: "14px 20px", background: `linear-gradient(135deg,#3A2A1A,${P.brownMid})`, borderRadius: 20, padding: "16px 20px", boxShadow: "0 6px 20px rgba(46,31,18,.2)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontFamily: "Jost,sans-serif", fontSize: 11, color: "rgba(255,255,255,.5)", letterSpacing: ".1em", textTransform: "uppercase" }}>Day 18 of 30</div>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, color: "white", marginTop: 3, fontWeight: 500 }}>Forecast Active 🔮</div>
            </div>
            <Pill label="🔥 18-day streak" color={P.gold} bg="rgba(200,160,80,.2)" />
          </div>
          <div style={{ marginTop: 12, height: 5, borderRadius: 4, background: "rgba(255,255,255,.12)", overflow: "hidden" }}>
            <div style={{ height: "100%", width: "60%", borderRadius: 4, background: `linear-gradient(90deg,${P.mossL},${P.gold})` }} />
          </div>
        </div>

        {/* score + stats */}
        <div style={{ margin: "0 20px 14px", display: "flex", gap: 12 }}>
          <div style={{ flex: 1.2, background: P.card, borderRadius: 20, padding: "17px 14px", display: "flex", flexDirection: "column", alignItems: "center", boxShadow: "0 2px 12px rgba(46,31,18,.06)" }}>
            <div style={{ fontFamily: "Jost,sans-serif", fontSize: 10, color: P.muted, fontWeight: 500, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 11 }}>Skin Score</div>
            <Ring value={68} size={100} stroke={7} color={P.moss} label="Today" />
            <div style={{ marginTop: 9, display: "flex", alignItems: "center", gap: 5 }}><span style={{ fontSize: 12, color: P.tc, fontWeight: 500 }}>↓ -3</span><span style={{ fontSize: 11, color: P.muted }}>vs yesterday</span></div>
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
            {[{ l: "Inflammation", v: "7.4", u: "/10", c: P.tc, i: "🔥" }, { l: "Flare Risk", v: "58%", u: "", c: P.rose, i: "⚡" }, { l: "Sleep", v: "5.5h", u: "", c: P.gold, i: "🌙" }].map(s => (
              <div key={s.l} style={{ background: P.card, borderRadius: 15, padding: "11px 13px", boxShadow: "0 2px 8px rgba(46,31,18,.05)", flex: 1 }}>
                <div style={{ fontFamily: "Jost,sans-serif", fontSize: 9, color: P.muted, fontWeight: 500, letterSpacing: ".07em", textTransform: "uppercase", marginBottom: 3 }}>{s.i} {s.l}</div>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, color: s.c, fontWeight: 500 }}>{s.v}<span style={{ fontSize: 11, fontFamily: "Jost,sans-serif", color: P.muted }}>{s.u}</span></div>
              </div>
            ))}
          </div>
        </div>

        {/* lifestyle signals (replaces hormonal tracker for male) */}
        <div style={{ margin: "0 20px 14px", background: `linear-gradient(135deg,${P.mossPale},#E8F0DC)`, borderRadius: 20, padding: "15px 17px", border: `1px solid ${P.moss}30` }}>
          <div style={{ fontFamily: "Jost,sans-serif", fontSize: 12, fontWeight: 600, color: P.brown, marginBottom: 12 }}>💪 Lifestyle Signals</div>
          <div style={{ display: "flex", gap: 9 }}>
            {[{ i: "🌙", l: "Sleep", s: "Low", c: P.tc }, { i: "🏃", l: "Exercise", s: "Good", c: P.moss }, { i: "💧", l: "Hydration", s: "OK", c: P.gold }, { i: "😤", l: "Stress", s: "High", c: P.rose }].map(x => (
              <div key={x.l} style={{ flex: 1, background: "rgba(255,255,255,.6)", borderRadius: 13, padding: "10px 6px", textAlign: "center" }}>
                <div style={{ fontSize: 18, marginBottom: 3 }}>{x.i}</div>
                <div style={{ fontFamily: "Jost,sans-serif", fontSize: 9, color: P.muted, letterSpacing: ".05em", textTransform: "uppercase" }}>{x.l}</div>
                <div style={{ fontFamily: "Jost,sans-serif", fontSize: 12, fontWeight: 600, color: x.c, marginTop: 2 }}>{x.s}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 9, fontFamily: "Jost,sans-serif", fontSize: 11, color: P.tc, fontWeight: 300, fontStyle: "italic" }}>⚠ High stress + poor sleep elevates cortisol — key breakout driver</div>
        </div>

        <SelfiePrompt />
        <Shortcuts onNav={onNav} />

        {/* 7-day trend */}
        <div style={{ margin: "0 20px 14px", background: P.card, borderRadius: 20, padding: "16px 17px", boxShadow: "0 2px 12px rgba(46,31,18,.06)" }}>
          <ST>7-Day Skin Trend</ST>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 68 }}>
            {bars.map((v, i) => { const on = i === 6; return (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <div style={{ width: "100%", height: `${(v / 100) * 58}px`, borderRadius: "6px 6px 0 0", background: on ? `linear-gradient(180deg,${P.moss},#4A6A30)` : `linear-gradient(180deg,${P.sand},${P.bgDeep})` }} />
                <span style={{ fontSize: 9, fontFamily: "Jost,sans-serif", color: on ? P.moss : P.muted, fontWeight: on ? 600 : 400 }}>{"MTWTFST"[i]}</span>
              </div>
            ); })}
          </div>
        </div>

        {/* triggers */}
        <div style={{ margin: "0 20px 20px", background: P.card, borderRadius: 20, padding: "16px 17px", boxShadow: "0 2px 12px rgba(46,31,18,.06)" }}>
          <ST>Today's Triggers</ST>
          {[{ l: "High sugar meal (2 days ago)", r: "High", c: P.tc, bg: P.tcPale, p: 75 }, { l: "Sleep deprivation (5.5hrs)", r: "High", c: P.rose, bg: P.rosePale, p: 70 }, { l: "Elevated stress signals", r: "Med", c: P.gold, bg: P.goldPale, p: 48 }].map((t, i) => (
            <div key={i} style={{ marginBottom: i < 2 ? 12 : 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                <span style={{ fontFamily: "Jost,sans-serif", fontSize: 12, color: P.brownMid, fontWeight: 300 }}>{t.l}</span>
                <Pill label={t.r} color={t.c} bg={t.bg} />
              </div>
              <div style={{ height: 4, borderRadius: 4, background: P.sand, overflow: "hidden" }}><div style={{ height: "100%", width: `${t.p}%`, borderRadius: 4, background: t.c }} /></div>
            </div>
          ))}
        </div>
      </div>
      <BottomNav active="home" onNav={onNav} gender="male" />
    </Phone>
  );
}
