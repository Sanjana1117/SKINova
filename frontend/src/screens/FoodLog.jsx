import { Phone, StatusBar, BottomNav, Ring, ST, Pill } from "../components/UIComponents.jsx";
import { P } from "../constants.js";

export default function FoodLog({ onNav, gender }) {
  const meals = [
    { t: "08:15", n: "Masala Oats + Banana", s: 3.2, f: "low", items: ["Oats", "Banana", "Milk", "Spices"], i: "🥣" },
    { t: "13:00", n: "Paneer Tikka + Rice", s: 6.8, f: "med", items: ["Paneer", "Basmati Rice", "Yoghurt", "Spices"], i: "🍛" },
    { t: "16:30", n: "Chai + Biscuits", s: 5.5, f: "med", items: ["Milk", "Sugar", "Tea", "Maida"], i: "☕" },
  ];
  const sc = f => f === "low" ? P.moss : f === "med" ? P.gold : P.tc;
  const sl = f => f === "low" ? "Low Risk" : f === "med" ? "Med Risk" : "High Risk";

  return (
    <Phone>
      <StatusBar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", background: P.bg, overflowY: "auto" }}>
        <div style={{ padding: "12px 24px 14px" }}>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 24, color: P.brown, fontWeight: 500 }}>Food <em style={{ color: P.tc }}>Journal</em></div>
          <div style={{ fontFamily: "Jost,sans-serif", fontSize: 12, color: P.muted, marginTop: 4, fontWeight: 300 }}>Track what you eat. Predict what happens next.</div>
        </div>

        {/* IRS summary card */}
        <div style={{ margin: "0 20px 14px", background: `linear-gradient(135deg,${P.brown},${P.clay})`, borderRadius: 22, padding: "17px 20px", boxShadow: "0 6px 20px rgba(46,31,18,.2)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontFamily: "Jost,sans-serif", fontSize: 11, color: "rgba(255,255,255,.5)", letterSpacing: ".1em", textTransform: "uppercase" }}>Today's IRS</div>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 38, color: "white", fontWeight: 500, lineHeight: 1 }}>5.8<span style={{ fontSize: 16, fontFamily: "Jost,sans-serif", fontWeight: 300, opacity: .6 }}> /10</span></div>
              <div style={{ fontFamily: "Jost,sans-serif", fontSize: 12, color: "rgba(255,255,255,.6)", marginTop: 4 }}>Moderate — dairy flagged</div>
            </div>
            <Ring value={58} size={88} stroke={7} color={P.gold} label="IRS" />
          </div>
          <div style={{ marginTop: 13, display: "flex", gap: 8 }}>
            {[["Meals", "3"], ["Allergens", "1"], ["Anti-inflam", "2"]].map(([l, v]) => (
              <div key={l} style={{ flex: 1, background: "rgba(255,255,255,.1)", borderRadius: 12, padding: "8px", textAlign: "center" }}>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, color: "white", fontWeight: 500 }}>{v}</div>
                <div style={{ fontFamily: "Jost,sans-serif", fontSize: 9, color: "rgba(255,255,255,.5)", marginTop: 1, letterSpacing: ".04em" }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* add buttons */}
        <div style={{ margin: "0 20px 14px", display: "flex", gap: 10 }}>
          {[{ i: "📷", l: "Photo", bg: P.tc, fg: "white" }, { i: "▤", l: "Barcode", bg: P.card, fg: P.brown }, { i: "✎", l: "Manual", bg: P.card, fg: P.brown }].map(b => (
            <button key={b.l} style={{ flex: 1, padding: "14px 8px", borderRadius: 15, border: `1.5px solid ${b.bg === P.card ? P.sand : "transparent"}`, background: b.bg, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 20 }}>{b.i}</span>
              <span style={{ fontFamily: "Jost,sans-serif", fontSize: 11, fontWeight: 500, color: b.fg, letterSpacing: ".04em" }}>{b.l}</span>
            </button>
          ))}
        </div>

        {/* meals */}
        <div style={{ padding: "0 20px" }}>
          <ST>Today's Meals</ST>
          {meals.map((m, i) => (
            <div key={i} style={{ background: P.card, borderRadius: 18, padding: "13px 15px", marginBottom: 10, boxShadow: "0 2px 10px rgba(46,31,18,.05)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: P.bgDeep, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>{m.i}</div>
                  <div>
                    <div style={{ fontFamily: "Jost,sans-serif", fontSize: 13, fontWeight: 500, color: P.brown }}>{m.n}</div>
                    <div style={{ fontFamily: "Jost,sans-serif", fontSize: 11, color: P.muted, marginTop: 2 }}>{m.t}</div>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, color: sc(m.f), fontWeight: 500 }}>{m.s}</div>
                  <Pill label={sl(m.f)} color={sc(m.f)} bg={m.f === "low" ? P.mossPale : m.f === "med" ? P.goldPale : P.tcPale} />
                </div>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {m.items.map(it => <span key={it} style={{ padding: "3px 10px", borderRadius: 20, background: P.bgDeep, fontFamily: "Jost,sans-serif", fontSize: 10, color: P.muted }}>{it}</span>)}
              </div>
            </div>
          ))}
        </div>

        {/* ingredient flags */}
        <div style={{ margin: "4px 20px 20px", background: P.card, borderRadius: 18, padding: "14px 16px", boxShadow: "0 2px 10px rgba(46,31,18,.05)" }}>
          <ST>Ingredient Flags</ST>
          {[{ ing: "Dairy (Paneer, Milk, Yoghurt)", imp: "Pro-inflammatory · IGF-1 elevation", c: P.tc }, { ing: "Refined sugar (Biscuits)", imp: "Insulin spike · sebum trigger", c: P.rose }, { ing: "Turmeric (in spices)", imp: "Anti-inflammatory ✓", c: P.moss }].map((f, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 9, marginBottom: i < 2 ? 10 : 0 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: f.c, marginTop: 5, flexShrink: 0 }} />
              <div>
                <div style={{ fontFamily: "Jost,sans-serif", fontSize: 12, fontWeight: 500, color: P.brown }}>{f.ing}</div>
                <div style={{ fontFamily: "Jost,sans-serif", fontSize: 11, color: P.muted, fontWeight: 300 }}>{f.imp}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <BottomNav active="food" onNav={onNav} gender={gender} />
    </Phone>
  );
}
