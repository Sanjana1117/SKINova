import { Phone, StatusBar, BottomNav, Ring, ST, Pill } from "../components/UIComponents.jsx";
import { P } from "../constants.js";

export default function Calibration({ onNav, gender }) {
  const day = 8;
  const deltas = [
    { d: "Day 6", skin: "+4", food: "6.2", note: "Skin clearer — inflammatory score dropped after cutting dairy", good: true },
    { d: "Day 7", skin: "-2", food: "7.8", note: "Dip after high-dairy lunch — pattern noted by AI", good: false },
    { d: "Day 8", skin: "+3", food: "5.1", note: "Recovery — oats + banana breakfast kept IRS low", good: true },
  ];

  return (
    <Phone>
      <StatusBar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", background: P.bg, overflowY: "auto" }}>
        <div style={{ padding: "12px 24px 14px" }}>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 24, color: P.brown, fontWeight: 500 }}>Calibration <em style={{ color: P.tc }}>Period</em></div>
          <div style={{ fontFamily: "Jost,sans-serif", fontSize: 12, color: P.muted, marginTop: 4, fontWeight: 300 }}>AI is learning your personal trigger patterns</div>
        </div>

        {/* unlock progress card */}
        <div style={{ margin: "0 20px 16px", background: `linear-gradient(135deg,${P.brown},${P.clay})`, borderRadius: 22, padding: "18px 20px", boxShadow: "0 6px 20px rgba(46,31,18,.22)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div>
              <div style={{ fontFamily: "Jost,sans-serif", fontSize: 11, color: "rgba(255,255,255,.5)", letterSpacing: ".1em", textTransform: "uppercase" }}>Day {day} of 15</div>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, color: "white", fontWeight: 500, marginTop: 3 }}>Forecast unlocks in {15 - day} days 🔮</div>
            </div>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(255,255,255,.12)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, color: P.gold, fontWeight: 600 }}>{day}</div>
              <div style={{ fontFamily: "Jost,sans-serif", fontSize: 9, color: "rgba(255,255,255,.5)" }}>days</div>
            </div>
          </div>
          <div style={{ height: 8, borderRadius: 4, background: "rgba(255,255,255,.12)", overflow: "hidden", marginBottom: 8 }}>
            <div style={{ height: "100%", width: `${(day / 15) * 100}%`, borderRadius: 4, background: `linear-gradient(90deg,${P.tcLight},${P.gold})`, transition: "width 1s ease" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            {Array.from({ length: 15 }, (_, i) => (
              <div key={i} style={{
                width: 16, height: 16, borderRadius: "50%",
                background: i < day ? P.tc : "rgba(255,255,255,.15)",
                border: i === day - 1 ? `2px solid ${P.gold}` : "none",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {i < day && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "rgba(255,255,255,.8)" }} />}
              </div>
            ))}
          </div>
        </div>

        {/* today snapshot */}
        <div style={{ margin: "0 20px 14px", display: "flex", gap: 12 }}>
          {[{ label: "Skin", val: 68, color: P.moss, delta: "+3", dcolor: P.moss }, { label: "Food IRS", val: 51, color: P.gold, delta: "-1.4", dcolor: P.tc }].map((s, i) => (
            <div key={i} style={{ flex: 1, background: P.card, borderRadius: 18, padding: "16px 14px", display: "flex", flexDirection: "column", alignItems: "center", boxShadow: "0 2px 10px rgba(46,31,18,.06)" }}>
              <div style={{ fontFamily: "Jost,sans-serif", fontSize: 10, color: P.muted, fontWeight: 500, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 10 }}>Today {s.label}</div>
              <Ring value={s.val} size={90} stroke={7} color={s.color} label="Score" />
              <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ fontSize: 13, color: s.dcolor, fontWeight: 600 }}>↑ {s.delta}</span>
                <span style={{ fontSize: 11, color: P.muted }}>vs yesterday</span>
              </div>
            </div>
          ))}
        </div>

        {/* selfie prompt */}
        <div style={{ margin: "0 20px 14px", background: `linear-gradient(135deg,${P.tcPale},${P.goldPale})`, borderRadius: 20, padding: "15px 17px", display: "flex", alignItems: "center", gap: 13 }}>
          <div style={{ width: 50, height: 50, borderRadius: 14, background: `linear-gradient(135deg,${P.tc},${P.clay})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0, animation: "ringPulse 2s ease infinite" }}>📸</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "Jost,sans-serif", fontSize: 14, fontWeight: 600, color: P.brown }}>Upload today's selfie</div>
            <div style={{ fontFamily: "Jost,sans-serif", fontSize: 11, color: P.muted, marginTop: 2, fontWeight: 300 }}>Post face-wash · natural light · front-facing</div>
          </div>
          <div style={{ width: 34, height: 34, borderRadius: "50%", background: P.tc, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 20 }}>+</div>
        </div>

        {/* delta history */}
        <div style={{ padding: "0 20px" }}>
          <ST action="View all">Recent Deltas</ST>
          {deltas.map((d, i) => (
            <div key={i} style={{ background: P.card, borderRadius: 16, padding: "13px 15px", marginBottom: 10, boxShadow: "0 2px 8px rgba(46,31,18,.05)", borderLeft: `3px solid ${d.good ? P.moss : P.tc}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                <span style={{ fontFamily: "Jost,sans-serif", fontSize: 12, fontWeight: 600, color: P.brown }}>{d.d}</span>
                <div style={{ display: "flex", gap: 8 }}>
                  <Pill label={`Skin ${d.skin}`} color={d.good ? P.moss : P.tc} bg={d.good ? P.mossPale : P.tcPale} />
                  <Pill label={`IRS ${d.food}`} color={P.gold} bg={P.goldPale} />
                </div>
              </div>
              <div style={{ fontFamily: "Jost,sans-serif", fontSize: 11, color: P.muted, fontWeight: 300, lineHeight: 1.5 }}>{d.note}</div>
            </div>
          ))}
        </div>

        {/* ingredient alerts */}
        <div style={{ margin: "4px 20px 20px", background: `linear-gradient(135deg,${P.tcPale},#FDE8DC)`, borderRadius: 18, padding: "14px 16px", border: `1px solid ${P.tc}22` }}>
          <div style={{ fontFamily: "Jost,sans-serif", fontSize: 12, fontWeight: 600, color: P.brown, marginBottom: 8 }}>⚠ Ingredient Alerts Today</div>
          {["Dairy detected in lunch — IRS elevated +2.1", "Refined sugar in evening snack — flag raised"].map((a, i) => (
            <div key={i} style={{ fontFamily: "Jost,sans-serif", fontSize: 11, color: P.tc, fontWeight: 300, marginBottom: i === 0 ? 5 : 0, lineHeight: 1.5 }}>• {a}</div>
          ))}
        </div>
      </div>
      <BottomNav active="home" onNav={onNav} gender={gender} />
    </Phone>
  );
}
