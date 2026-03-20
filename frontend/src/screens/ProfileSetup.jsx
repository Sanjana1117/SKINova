import { useState } from "react";
import { Phone, StatusBar, Btn, ST, Pill } from "../components/UIComponents.jsx";
import { P } from "../constants.js";

// ── HEALTH PROFILE ───────────────────────────────────────────────────
export function HealthProfile({ onNext }) {
  const [sel, setSel] = useState({ al: [], sen: [] });
  const toggle = (c, i) => setSel(p => ({ ...p, [c]: p[c].includes(i) ? p[c].filter(x => x !== i) : [...p[c], i] }));

  return (
    <Phone>
      <StatusBar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "16px 26px 24px", background: P.bg, overflowY: "auto" }}>
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, color: P.brown, fontWeight: 500 }}>Your <em style={{ color: P.tc }}>Health Profile</em></div>
          <div style={{ fontFamily: "Jost,sans-serif", fontSize: 13, color: P.muted, marginTop: 5, fontWeight: 300 }}>Personalises your inflammatory risk engine</div>
        </div>

        {/* step indicator */}
        <div style={{ display: "flex", gap: 6, marginBottom: 22 }}>
          {["Account", "Profile", "Products"].map((l, i) => (
            <div key={l} style={{ flex: 1 }}>
              <div style={{ height: 4, borderRadius: 4, background: i <= 1 ? P.tc : P.sand, marginBottom: 3 }} />
              <span style={{ fontSize: 10, fontFamily: "Jost,sans-serif", color: i <= 1 ? P.tc : P.muted, fontWeight: i === 1 ? 600 : 400 }}>{l}</span>
            </div>
          ))}
        </div>

        {[["Known Allergies", "al", ["Nuts", "Shellfish", "Gluten", "Soy", "Eggs", "Latex"]],
          ["Food Sensitivities", "sen", ["Dairy", "Refined Sugar", "Caffeine", "Alcohol", "Spicy Food", "Processed"]]
        ].map(([title, cat, items]) => (
          <div key={cat} style={{ marginBottom: 20 }}>
            <ST>{title}</ST>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {items.map(item => {
                const on = sel[cat].includes(item);
                return (
                  <button key={item} onClick={() => toggle(cat, item)} style={{
                    padding: "8px 15px", borderRadius: 20, cursor: "pointer",
                    border: `1.5px solid ${on ? P.tc : P.sand}`,
                    background: on ? P.tcPale : P.cream,
                    fontFamily: "Jost,sans-serif", fontSize: 12,
                    color: on ? P.tc : P.muted, fontWeight: on ? 500 : 400, transition: "all .2s",
                  }}>{on ? "✓ " : ""}{item}</button>
                );
              })}
            </div>
          </div>
        ))}

        <div style={{ background: P.card, borderRadius: 18, padding: "16px 18px", marginBottom: 18, boxShadow: "0 2px 10px rgba(46,31,18,.05)" }}>
          <ST>Body Metrics</ST>
          <div style={{ display: "flex", gap: 12 }}>
            {[["Height", "cm", "170"], ["Weight", "kg", "65"]].map(([l, u, ph]) => (
              <div key={l} style={{ flex: 1 }}>
                <div style={{ fontFamily: "Jost,sans-serif", fontSize: 11, color: P.muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: ".06em" }}>{l} ({u})</div>
                <input type="number" style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: `1.5px solid ${P.sand}`, background: P.cream, fontFamily: "Jost,sans-serif", fontSize: 14, color: P.brown, outline: "none" }} placeholder={ph} />
              </div>
            ))}
          </div>
        </div>
        <Btn full onClick={onNext}>Continue →</Btn>
      </div>
    </Phone>
  );
}

// ── PRODUCTS SETUP ───────────────────────────────────────────────────
export function ProductsSetup({ onNext }) {
  const prods = [
    { name: "CeraVe Moisturising Cream", score: 1, c: P.moss, bg: P.mossPale, label: "Low Risk", icon: "🧴" },
    { name: "Neutrogena SPF 50", score: 2, c: P.moss, bg: P.mossPale, label: "Low Risk", icon: "🧴" },
    { name: "The Ordinary Niacinamide", score: 0, c: P.muted, bg: P.sand, label: "No Risk", icon: "🧪" },
  ];
  return (
    <Phone>
      <StatusBar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "16px 26px 24px", background: P.bg, overflowY: "auto" }}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, color: P.brown, fontWeight: 500 }}>Skincare <em style={{ color: P.tc }}>Products</em></div>
          <div style={{ fontFamily: "Jost,sans-serif", fontSize: 13, color: P.muted, marginTop: 5, fontWeight: 300 }}>Photograph once — we decode ingredients automatically</div>
        </div>

        <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
          {["Account", "Profile", "Products"].map((l, i) => (
            <div key={l} style={{ flex: 1 }}>
              <div style={{ height: 4, borderRadius: 4, background: P.tc, marginBottom: 3 }} />
              <span style={{ fontSize: 10, fontFamily: "Jost,sans-serif", color: P.tc, fontWeight: i === 2 ? 600 : 400 }}>{l}</span>
            </div>
          ))}
        </div>

        <div style={{ background: `linear-gradient(135deg,${P.tcPale},${P.goldPale})`, borderRadius: 20, padding: "22px", textAlign: "center", marginBottom: 18, border: `1.5px dashed ${P.tcLight}` }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>📷</div>
          <div style={{ fontFamily: "Jost,sans-serif", fontSize: 14, fontWeight: 500, color: P.brown, marginBottom: 4 }}>Photograph your products</div>
          <div style={{ fontFamily: "Jost,sans-serif", fontSize: 12, color: P.muted, fontWeight: 300 }}>Scan labels, barcodes &amp; get comedogenic scores instantly</div>
          <button style={{ marginTop: 14, padding: "10px 24px", borderRadius: 20, background: P.tc, border: "none", cursor: "pointer", fontFamily: "Jost,sans-serif", fontSize: 13, fontWeight: 500, color: "white" }}>Open Camera</button>
        </div>

        <div style={{ fontFamily: "Jost,sans-serif", fontSize: 11, color: P.muted, fontWeight: 500, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 10 }}>Scanned Products</div>
        {prods.map((p, i) => (
          <div key={i} style={{ background: P.card, borderRadius: 16, padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 2px 8px rgba(46,31,18,.05)", marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: p.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{p.icon}</div>
              <div>
                <div style={{ fontFamily: "Jost,sans-serif", fontSize: 13, fontWeight: 500, color: P.brown }}>{p.name}</div>
                <div style={{ fontSize: 11, color: P.muted, marginTop: 2 }}>Comedogenic: {p.score}/5</div>
              </div>
            </div>
            <Pill label={p.label} color={p.c} bg={p.bg} />
          </div>
        ))}
        <Btn full onClick={onNext}>Start Tracking →</Btn>
      </div>
    </Phone>
  );
}
