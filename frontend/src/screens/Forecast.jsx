import { useState } from "react";
import { Phone, StatusBar, BottomNav, Pill } from "../components/UIComponents.jsx";
import { P } from "../constants.js";

export default function Forecast({ onNav, gender }) {
  const [exp, setExp] = useState(0);

  const days = [
    {
      l: "Tomorrow", date: "Mon, 9 Mar", risk: 72, level: "High", c: P.tc, bg: P.tcPale,
      drivers: [
        { n: "High dairy intake", lag: "3 days ago", w: 71, i: "🥛" },
        { n: "Poor sleep (5.5h)", lag: "2 days ago", w: 19, i: "🌙" },
        { n: gender === "female" ? "Luteal phase" : "Stress signals", lag: "Current", w: 10, i: gender === "female" ? "🌸" : "😤" },
      ],
      tip: "Avoid dairy for 48h. Prioritise 7–8h sleep tonight. Stay hydrated.",
    },
    {
      l: "Day 2", date: "Tue, 10 Mar", risk: 55, level: "Moderate", c: P.gold, bg: P.goldPale,
      drivers: [
        { n: "Residual dairy effect", lag: "Ongoing", w: 55, i: "🥛" },
        { n: "Refined sugar", lag: "2 days ago", w: 30, i: "🍬" },
        { n: "Stress signals", lag: "Yesterday", w: 15, i: "😤" },
      ],
      tip: "Avoid triggers today and Day 2 risk drops significantly.",
    },
    {
      l: "Day 3", date: "Wed, 11 Mar", risk: 30, level: "Low", c: P.moss, bg: P.mossPale,
      drivers: [
        { n: "Reduced inflammation", lag: "Projected", w: 60, i: "📉" },
        { n: "Sleep recovery", lag: "Projected", w: 40, i: "🌙" },
      ],
      tip: "Skin should recover well by Day 3 if you act on today's advice.",
    },
  ];

  return (
    <Phone>
      <StatusBar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", background: P.bg, overflowY: "auto" }}>
        <div style={{ padding: "12px 24px 14px" }}>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 24, color: P.brown, fontWeight: 500 }}>3-Day <em style={{ color: P.tc }}>Forecast</em></div>
          <div style={{ fontFamily: "Jost,sans-serif", fontSize: 12, color: P.muted, marginTop: 4, fontWeight: 300 }}>Powered by your personal trigger history</div>
        </div>

        {/* Llama 4 AI explanation card */}
        <div style={{ margin: "0 20px 14px", background: `linear-gradient(135deg,${P.brown},#4A2E1A)`, borderRadius: 22, padding: "17px 19px", boxShadow: "0 6px 24px rgba(46,31,18,.25)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 11 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(196,113,74,.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>✦</div>
            <div>
              <div style={{ fontFamily: "Jost,sans-serif", fontSize: 12, fontWeight: 600, color: "white" }}>Skinova AI · Llama 4</div>
              <div style={{ fontFamily: "Jost,sans-serif", fontSize: 10, color: "rgba(255,255,255,.45)" }}>Grounded in your trigger data</div>
            </div>
          </div>
          <div style={{ fontFamily: "Jost,sans-serif", fontSize: 13, color: "rgba(255,255,255,.82)", lineHeight: 1.65, fontWeight: 300, fontStyle: "italic" }}>
            "Your skin is likely to flare tomorrow. The biggest factor is the high-dairy meal 3 days ago — your history shows your skin responds to dairy within 72 hours{gender === "female" ? " during your luteal phase" : ""}. Poor sleep last night added to the risk."
          </div>
          <div style={{ marginTop: 11, padding: "8px 12px", borderRadius: 10, background: "rgba(255,255,255,.06)", fontFamily: "Jost,sans-serif", fontSize: 10, color: "rgba(255,255,255,.35)", fontStyle: "italic" }}>
            Not a medical diagnosis. Consult a dermatologist for clinical assessment.
          </div>
        </div>

        {/* expandable day cards */}
        <div style={{ padding: "0 20px" }}>
          {days.map((d, i) => {
            const circ = 2 * Math.PI * 26, off = circ - (d.risk / 100) * circ;
            return (
              <div key={i} style={{ background: P.card, borderRadius: 20, marginBottom: 11, overflow: "hidden", boxShadow: "0 2px 12px rgba(46,31,18,.06)" }}>
                <div onClick={() => setExp(exp === i ? -1 : i)} style={{ padding: "15px 17px", cursor: "pointer", display: "flex", alignItems: "center", gap: 13 }}>
                  <div style={{ position: "relative", width: 66, height: 66, flexShrink: 0 }}>
                    <svg width={66} height={66} style={{ transform: "rotate(-90deg)" }}>
                      <circle cx={33} cy={33} r={26} fill="none" stroke={P.sand} strokeWidth={7} />
                      <circle cx={33} cy={33} r={26} fill="none" stroke={d.c} strokeWidth={7} strokeDasharray={circ} strokeDashoffset={off} strokeLinecap="round" />
                    </svg>
                    <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", textAlign: "center" }}>
                      <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 17, color: d.c, fontWeight: 600, lineHeight: 1 }}>{d.risk}%</div>
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                      <div style={{ fontFamily: "Jost,sans-serif", fontSize: 15, fontWeight: 600, color: P.brown }}>{d.l}</div>
                      <Pill label={d.level} color={d.c} bg={d.bg} />
                    </div>
                    <div style={{ fontFamily: "Jost,sans-serif", fontSize: 12, color: P.muted, fontWeight: 300 }}>{d.date}</div>
                    <div style={{ height: 4, borderRadius: 4, background: P.sand, overflow: "hidden", marginTop: 8 }}>
                      <div style={{ height: "100%", width: `${d.risk}%`, borderRadius: 4, background: d.c }} />
                    </div>
                  </div>
                  <div style={{ fontSize: 13, color: P.muted, transform: exp === i ? "rotate(180deg)" : "rotate(0deg)", transition: "transform .3s" }}>▾</div>
                </div>

                {exp === i && (
                  <div style={{ padding: "0 17px 15px", borderTop: `1px solid ${P.sand}` }}>
                    <div style={{ fontFamily: "Jost,sans-serif", fontSize: 10, fontWeight: 600, color: P.muted, letterSpacing: ".08em", textTransform: "uppercase", margin: "11px 0 9px" }}>TFT Attention Weights</div>
                    {d.drivers.map((dr, j) => (
                      <div key={j} style={{ marginBottom: 9 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ fontSize: 14 }}>{dr.i}</span>
                            <span style={{ fontFamily: "Jost,sans-serif", fontSize: 12, color: P.brown }}>{dr.n}</span>
                          </div>
                          <div style={{ display: "flex", gap: 8 }}>
                            <span style={{ fontFamily: "Jost,sans-serif", fontSize: 10, color: P.muted }}>{dr.lag}</span>
                            <span style={{ fontFamily: "Jost,sans-serif", fontSize: 12, fontWeight: 600, color: d.c }}>{dr.w}%</span>
                          </div>
                        </div>
                        <div style={{ height: 5, borderRadius: 4, background: P.sand, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${dr.w}%`, borderRadius: 4, background: `linear-gradient(90deg,${d.c}88,${d.c})` }} />
                        </div>
                      </div>
                    ))}
                    <div style={{ marginTop: 11, padding: "10px 13px", borderRadius: 12, background: d.bg, fontFamily: "Jost,sans-serif", fontSize: 12, color: d.c, lineHeight: 1.55 }}>💡 {d.tip}</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* what-if teaser */}
        <div style={{ margin: "0 20px 22px", background: `linear-gradient(135deg,${P.goldPale},#FDF5E0)`, borderRadius: 20, padding: "15px 17px", border: `1px solid ${P.gold}40` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 5 }}>
            <span style={{ fontSize: 20 }}>🔮</span>
            <div style={{ fontFamily: "Jost,sans-serif", fontSize: 13, fontWeight: 600, color: P.brown }}>What-If Simulator</div>
            <span style={{ marginLeft: "auto", padding: "3px 10px", borderRadius: 20, background: P.gold, fontFamily: "Jost,sans-serif", fontSize: 10, color: "white", fontWeight: 500 }}>Soon</span>
          </div>
          <div style={{ fontFamily: "Jost,sans-serif", fontSize: 12, color: P.muted, fontWeight: 300 }}>See how your forecast shifts if you cut dairy or sleep 8 hours.</div>
        </div>
      </div>
      <BottomNav active="fore" onNav={onNav} gender={gender} />
    </Phone>
  );
}
