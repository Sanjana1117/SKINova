import { Phone, StatusBar, Ring, ST, Pill } from "../components/UIComponents.jsx";
import { P, S } from "../constants.js";

export default function SkinHistory({ onNav, gender }) {
  const months = ["Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];
  const scores = [58, 62, 55, 67, 70, 65, 72, 73];
  const conditions = [
    { label: "Acne", current: 3, prev: 5, color: P.tc },
    { label: "Redness", current: 2, prev: 4, color: P.rose },
    { label: "Dullness", current: 4, prev: 6, color: P.gold },
    { label: "Oiliness", current: 5, prev: 5, color: P.moss },
  ];

  return (
    <Phone>
      <StatusBar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", background: P.bg, overflowY: "auto" }}>
        <div style={{ padding: "12px 24px 4px", display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => onNav(gender === "female" ? S.FDASH : S.MDASH)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: P.brownMid }}>←</button>
          <div>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 24, color: P.brown, fontWeight: 500 }}>Skin <em style={{ color: P.tc }}>History</em></div>
            <div style={{ fontFamily: "Jost,sans-serif", fontSize: 12, color: P.muted, fontWeight: 300 }}>Your skin's journey over time</div>
          </div>
        </div>

        {/* 8-month trend */}
        <div style={{ margin: "14px 20px", background: P.card, borderRadius: 22, padding: "18px", boxShadow: "0 2px 14px rgba(46,31,18,.07)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <div style={{ fontFamily: "Jost,sans-serif", fontSize: 11, color: P.muted, fontWeight: 500, letterSpacing: ".08em", textTransform: "uppercase" }}>8-Month Average</div>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 32, color: P.brown, fontWeight: 500 }}>65.1 <span style={{ fontSize: 14, color: P.moss, fontFamily: "Jost,sans-serif" }}>↑ +15.1</span></div>
            </div>
            <Pill label="Improving ✓" color={P.moss} bg={P.mossPale} />
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 90 }}>
            {scores.map((v, i) => {
              const isLast = i === scores.length - 1;
              return (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <div style={{
                    width: "100%", height: `${(v / 100) * 78}px`, borderRadius: "6px 6px 0 0",
                    background: isLast ? `linear-gradient(180deg,${P.tc},${P.clay})` : `linear-gradient(180deg,${P.sand},${P.bgDeep})`,
                    position: "relative",
                  }}>
                    {isLast && <div style={{ position: "absolute", top: -18, left: "50%", transform: "translateX(-50%)", fontFamily: "'Playfair Display',serif", fontSize: 11, color: P.tc, fontWeight: 600, whiteSpace: "nowrap" }}>{v}</div>}
                  </div>
                  <span style={{ fontSize: 9, fontFamily: "Jost,sans-serif", color: isLast ? P.tc : P.muted, fontWeight: isLast ? 600 : 400 }}>{months[i]}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* condition breakdown */}
        <div style={{ margin: "0 20px 14px", background: P.card, borderRadius: 20, padding: "16px 18px", boxShadow: "0 2px 12px rgba(46,31,18,.06)" }}>
          <ST>Condition Breakdown</ST>
          {conditions.map((c, i) => (
            <div key={i} style={{ marginBottom: i < conditions.length - 1 ? 14 : 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontFamily: "Jost,sans-serif", fontSize: 13, fontWeight: 500, color: P.brown }}>{c.label}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontFamily: "Jost,sans-serif", fontSize: 11, color: P.muted, textDecoration: "line-through" }}>{c.prev}/10</span>
                  <span style={{ fontFamily: "Jost,sans-serif", fontSize: 13, fontWeight: 600, color: c.color }}>{c.current}/10</span>
                  {c.current < c.prev && <span style={{ fontSize: 11, color: P.moss }}>↓ better</span>}
                </div>
              </div>
              <div style={{ height: 6, borderRadius: 4, background: P.sand, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${(c.current / 10) * 100}%`, borderRadius: 4, background: `linear-gradient(90deg,${c.color}88,${c.color})` }} />
              </div>
            </div>
          ))}
        </div>

        {/* before / after */}
        <div style={{ margin: "0 20px 14px", background: P.card, borderRadius: 20, padding: "16px 18px", boxShadow: "0 2px 12px rgba(46,31,18,.06)" }}>
          <ST>Before / After Snapshot</ST>
          <div style={{ display: "flex", gap: 12 }}>
            {[{ label: "Aug 2024", score: 58, sub: "Before Skinova", c: P.muted, bg: P.bgDeep }, { label: "Mar 2025", score: 73, sub: "Today", c: P.tc, bg: P.tcPale }].map((p, i) => (
              <div key={i} style={{ flex: 1, background: p.bg, borderRadius: 16, padding: "16px 14px", textAlign: "center", border: i === 1 ? `2px solid ${P.tc}22` : "none" }}>
                <div style={{ fontFamily: "Jost,sans-serif", fontSize: 11, color: P.muted, letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 10 }}>{p.label}</div>
                <Ring value={p.score} size={80} stroke={7} color={p.c} />
                <div style={{ fontFamily: "Jost,sans-serif", fontSize: 11, color: p.c, fontWeight: 500, marginTop: 8 }}>{p.sub}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 14, padding: "10px 14px", borderRadius: 12, background: P.mossPale, fontFamily: "Jost,sans-serif", fontSize: 12, color: P.moss, fontWeight: 400, textAlign: "center" }}>
            🌿 +15 point improvement since you started Skinova
          </div>
        </div>

        {/* export teaser */}
        <div style={{ margin: "0 20px 20px", background: `linear-gradient(135deg,${P.goldPale},#FDF5E0)`, borderRadius: 20, padding: "16px 18px", border: `1px solid ${P.gold}40` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <span style={{ fontSize: 22 }}>📋</span>
            <div style={{ fontFamily: "Jost,sans-serif", fontSize: 13, fontWeight: 600, color: P.brown }}>Dermatologist Export</div>
            <span style={{ marginLeft: "auto", padding: "3px 10px", borderRadius: 20, background: P.gold, fontFamily: "Jost,sans-serif", fontSize: 10, color: "white", fontWeight: 500 }}>Phase 2</span>
          </div>
          <div style={{ fontFamily: "Jost,sans-serif", fontSize: 12, color: P.muted, fontWeight: 300 }}>Export a structured skin history report for clinical use.</div>
        </div>
      </div>
    </Phone>
  );
}
