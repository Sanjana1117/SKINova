import { Phone, StatusBar, Btn } from "../components/UIComponents.jsx";
import { P } from "../constants.js";

// ── ONBOARD SCREEN 1 ─────────────────────────────────────────────────
export function Onboard1({ onNext }) {
  return (
    <Phone>
      <StatusBar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", background: `linear-gradient(160deg,${P.bg},${P.bgDeep})` }}>
        <div style={{ height: 370, position: "relative", overflow: "hidden", background: "linear-gradient(170deg,#C4714A,#9A5535 40%,#5A3020 100%)", flexShrink: 0 }}>
          {[{ w: 250, h: 250, t: -30, l: -50 }, { w: 170, h: 170, t: 90, r: -50 }, { w: 110, h: 110, t: 210, l: 110 }].map((c, i) => (
            <div key={i} style={{ position: "absolute", width: c.w, height: c.h, borderRadius: "50%", border: "1px solid rgba(255,255,255,.12)", top: c.t, left: c.l, right: c.r }} />
          ))}
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 30px 0" }}>
            <div style={{
              width: 155, height: 185, background: "rgba(255,255,255,.11)", borderRadius: "50% 50% 46% 46%",
              backdropFilter: "blur(4px)", border: "1.5px solid rgba(255,255,255,.22)",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexDirection: "column", gap: 14, position: "relative",
              animation: "float 4s ease infinite",
            }}>
              <div style={{ display: "flex", gap: 26 }}>
                {[0, 1].map(i => <div key={i} style={{ width: 22, height: 7, background: "rgba(255,255,255,.5)", borderRadius: 8 }} />)}
              </div>
              <div style={{ width: 26, height: 26, borderRadius: "50%", border: "2px solid rgba(255,255,255,.4)" }} />
              {[{ t: 35, l: 20 }, { t: 58, l: 118 }, { t: 80, l: 42 }].map((d, i) => (
                <div key={i} style={{
                  position: "absolute", width: 9, height: 9, borderRadius: "50%",
                  background: "rgba(255,220,200,.6)", top: d.t, left: d.l,
                  animation: `pulse ${1.6 + i * .4}s ease infinite`,
                }} />
              ))}
            </div>
            <div style={{ marginTop: 22, textAlign: "center" }}>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 30, color: "white", fontWeight: 500, lineHeight: 1.2 }}>
                Predict.<br />Prevent.<br />Glow.
              </div>
            </div>
          </div>
        </div>
        <div style={{ flex: 1, padding: "28px 28px 24px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 24, color: P.brown, fontWeight: 500, lineHeight: 1.35, marginBottom: 10 }}>
              Your skin has a story.<br /><em style={{ color: P.tc }}>Read it 3 days early.</em>
            </div>
            <div style={{ fontFamily: "Jost,sans-serif", fontSize: 13, color: P.muted, lineHeight: 1.7, fontWeight: 300 }}>
              Skinova learns your personal triggers — food, hormones, products — and forecasts breakouts before they happen.
            </div>
          </div>
          <div>
            <div style={{ display: "flex", gap: 7, marginBottom: 22, justifyContent: "center" }}>
              {[P.tc, P.sand, P.sand].map((c, i) => <div key={i} style={{ width: i === 0 ? 24 : 8, height: 8, borderRadius: 4, background: c }} />)}
            </div>
            <Btn full onClick={onNext}>Get Started</Btn>
          </div>
        </div>
      </div>
    </Phone>
  );
}

// ── ONBOARD SCREEN 2 ─────────────────────────────────────────────────
export function Onboard2({ onNext }) {
  const features = [
    { icon: "◎", c: P.tc, bg: P.tcPale, t: "AI Skin Scan", d: "Daily selfie tracks your personal skin score" },
    { icon: "◈", c: P.moss, bg: P.mossPale, t: "Food Intelligence", d: "Discover your inflammatory food triggers" },
    { icon: "◇", c: P.lavender, bg: P.lavPale, t: "3-Day Forecast", d: "Know what's coming before your skin does" },
    { icon: "✦", c: P.gold, bg: P.goldPale, t: "AI Skin Coach", d: "Chat with Llama 4 about your skin anytime" },
  ];
  return (
    <Phone>
      <StatusBar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "20px 24px 24px", background: P.bg, overflowY: "auto" }}>
        <div style={{ textAlign: "center", marginBottom: 26, animation: "fadeUp .6s ease" }}>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, color: P.brown, fontWeight: 500 }}>How Skinova works</div>
          <div style={{ fontFamily: "Jost,sans-serif", fontSize: 13, color: P.muted, marginTop: 5, fontWeight: 300 }}>Four pillars of skin intelligence</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 13, flex: 1 }}>
          {features.map((f, i) => (
            <div key={i} style={{
              background: P.card, borderRadius: 20, padding: "17px 18px",
              display: "flex", alignItems: "center", gap: 16,
              boxShadow: "0 2px 12px rgba(46,31,18,.06)",
              animation: `fadeUp .5s ease ${i * .1 + .1}s both`,
            }}>
              <div style={{ width: 52, height: 52, borderRadius: 15, background: f.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, color: f.c, flexShrink: 0 }}>{f.icon}</div>
              <div>
                <div style={{ fontFamily: "Jost,sans-serif", fontSize: 14, fontWeight: 600, color: P.brown }}>{f.t}</div>
                <div style={{ fontFamily: "Jost,sans-serif", fontSize: 12, color: P.muted, marginTop: 2, fontWeight: 300 }}>{f.d}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 24 }}>
          <div style={{ display: "flex", gap: 7, marginBottom: 18, justifyContent: "center" }}>
            {[P.sand, P.tc, P.sand].map((c, i) => <div key={i} style={{ width: i === 1 ? 24 : 8, height: 8, borderRadius: 4, background: c }} />)}
          </div>
          <Btn full onClick={onNext}>Create My Account</Btn>
        </div>
      </div>
    </Phone>
  );
}
