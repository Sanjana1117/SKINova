import { P } from "../constants.js";
import { S } from "../constants.js";

// ── PHONE SHELL ──────────────────────────────────────────────────────
export function Phone({ children, bg }) {
  return (
    <div style={{
      width: 393, height: 852, borderRadius: 52,
      background: bg || P.bg,
      boxShadow: "0 0 0 11px #120A04,0 0 0 13px #7A5038,0 0 0 14px #120A04,0 35px 100px rgba(0,0,0,.7)",
      overflow: "hidden", position: "relative",
      display: "flex", flexDirection: "column", flexShrink: 0,
    }}>
      {children}
    </div>
  );
}

// ── STATUS BAR ───────────────────────────────────────────────────────
export function StatusBar({ light }) {
  const c = light ? "rgba(255,255,255,.9)" : P.brown;
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "14px 30px 0", fontSize: 13, fontFamily: "Jost,sans-serif",
      fontWeight: 500, color: c, flexShrink: 0, zIndex: 20, position: "relative",
    }}>
      <span>9:41</span>
      <div style={{
        width: 120, height: 30,
        background: light ? "rgba(255,255,255,.15)" : "rgba(20,10,4,.8)",
        borderRadius: 20, position: "absolute", left: "50%",
        transform: "translateX(-50%)", top: 10,
      }} />
      <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
        {[10, 14, 18].map(h => (
          <div key={h} style={{ width: 3, height: h, borderRadius: 2, background: c, opacity: h === 10 ? .35 : h === 14 ? .65 : 1 }} />
        ))}
        <div style={{ width: 22, height: 12, border: `1.5px solid ${c}`, borderRadius: 3, marginLeft: 3, position: "relative" }}>
          <div style={{ width: "70%", height: "100%", background: c, borderRadius: 1, position: "absolute", left: 0 }} />
        </div>
      </div>
    </div>
  );
}

// ── BOTTOM NAV ───────────────────────────────────────────────────────
export function BottomNav({ active, onNav, gender }) {
  const tabs = [
    { id: "home", icon: "⌂", label: "Home", screen: gender === "female" ? S.FDASH : S.MDASH },
    { id: "food", icon: "◎", label: "Log", screen: S.FOOD },
    { id: "fore", icon: "◇", label: "Forecast", screen: S.FORECAST },
    { id: "chat", icon: "✦", label: "AI Chat", screen: S.CHAT },
    { id: "me", icon: "○", label: "Profile", screen: S.SETTINGS },
  ];
  return (
    <div style={{
      flexShrink: 0, background: P.card, borderTop: `1px solid ${P.sand}`,
      display: "flex", alignItems: "center", justifyContent: "space-around",
      padding: "10px 0 22px", boxShadow: "0 -4px 20px rgba(46,31,18,.07)",
    }}>
      {tabs.map(t => {
        const on = active === t.id;
        return (
          <button key={t.id} onClick={() => t.screen && onNav(t.screen)}
            style={{ background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "4px 10px" }}>
            <div style={{ fontSize: 20, color: on ? P.tc : P.muted, transition: "all .2s", transform: on ? "scale(1.2)" : "scale(1)" }}>{t.icon}</div>
            <span style={{ fontSize: 10, fontFamily: "Jost,sans-serif", fontWeight: on ? 600 : 400, color: on ? P.tc : P.muted, letterSpacing: ".04em" }}>{t.label}</span>
            {on && <div style={{ width: 4, height: 4, borderRadius: "50%", background: P.tc }} />}
          </button>
        );
      })}
    </div>
  );
}

// ── RING (circular score) ────────────────────────────────────────────
export function Ring({ value, max = 100, size = 110, stroke = 8, color, label }) {
  const r = (size - stroke * 2) / 2, circ = 2 * Math.PI * r, off = circ - (value / max) * circ;
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={P.sand} strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color || P.tc} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={off} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s ease" }} />
      </svg>
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", textAlign: "center" }}>
        <div style={{ fontSize: size > 100 ? 26 : 20, fontFamily: "'Playfair Display',serif", fontWeight: 600, color: P.brown, lineHeight: 1 }}>{value}</div>
        {label && <div style={{ fontSize: 9, color: P.muted, fontFamily: "Jost,sans-serif", marginTop: 2, letterSpacing: ".05em" }}>{label}</div>}
      </div>
    </div>
  );
}

// ── PILL (tag/badge) ─────────────────────────────────────────────────
export function Pill({ label, color, bg }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", padding: "3px 10px",
      borderRadius: 20, background: bg || P.tcPale, color: color || P.tc,
      fontSize: 10, fontFamily: "Jost,sans-serif", fontWeight: 500,
      letterSpacing: ".03em", whiteSpace: "nowrap",
    }}>{label}</span>
  );
}

// ── SECTION TITLE ────────────────────────────────────────────────────
export function ST({ children, action, onAction }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 3, height: 16, borderRadius: 2, background: P.tc }} />
        <span style={{ fontFamily: "Jost,sans-serif", fontSize: 13, fontWeight: 600, color: P.brown }}>{children}</span>
      </div>
      {action && <span onClick={onAction} style={{ fontFamily: "Jost,sans-serif", fontSize: 11, color: P.tc, fontWeight: 400, cursor: "pointer" }}>{action}</span>}
    </div>
  );
}

// ── BUTTON ───────────────────────────────────────────────────────────
export function Btn({ children, onClick, full, variant = "primary", small }) {
  const bg = variant === "primary" ? `linear-gradient(135deg,${P.tc},${P.clay})` : P.card;
  const col = variant === "primary" ? "white" : P.brown;
  const border = variant === "primary" ? "none" : `1.5px solid ${P.sand}`;
  return (
    <button onClick={onClick} style={{
      width: full ? "100%" : "auto",
      padding: small ? "10px 20px" : "16px 24px",
      borderRadius: 16, background: bg, border, cursor: "pointer",
      color: col, fontFamily: "Jost,sans-serif", fontSize: small ? 13 : 15,
      fontWeight: 500, letterSpacing: ".05em",
      boxShadow: variant === "primary" ? "0 8px 24px rgba(196,113,74,.35)" : "none",
      transition: "all .2s",
    }}>
      {children}
    </button>
  );
}
