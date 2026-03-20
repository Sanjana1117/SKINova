import { useState } from "react";
import { Phone, StatusBar, Pill } from "../components/UIComponents.jsx";
import { P, S } from "../constants.js";

// ── NOTIFICATIONS ────────────────────────────────────────────────────
export function Notifications({ onNav, gender }) {
  const notifs = [
    { icon: "⚠️", title: "High Flare Risk Tomorrow", body: "72% flare probability detected. Dairy and sleep are key factors.", time: "Just now", color: P.tc, bg: P.tcPale, unread: true },
    { icon: "🥛", title: "Dairy Pattern Identified", body: "Your skin consistently reacts to dairy within 68 hours. Consider reducing intake.", time: "2h ago", color: P.gold, bg: P.goldPale, unread: true },
    { icon: "📸", title: "Time for your morning selfie", body: "Upload your post-wash selfie to keep your streak going.", time: "8:00 AM", color: P.moss, bg: P.mossPale, unread: false },
    { icon: "🧴", title: "New Product Alert", body: "You used a new moisturiser yesterday. TFT will track it as a potential trigger.", time: "Yesterday", color: P.lavender, bg: P.lavPale, unread: false },
    { icon: "🎉", title: "18-Day Streak!", body: "You've logged your skin and food for 18 consecutive days. Forecast accuracy improving.", time: "Yesterday", color: P.gold, bg: P.goldPale, unread: false },
    { icon: "🌸", title: "Luteal Phase Started", body: "Skin sensitivity elevated. Dairy and sugar weights increased in your risk model.", time: "3 days ago", color: "#9070B8", bg: P.lavPale, unread: false },
  ];

  return (
    <Phone>
      <StatusBar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", background: P.bg, overflowY: "auto" }}>
        <div style={{ padding: "12px 24px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button onClick={() => onNav(gender === "female" ? S.FDASH : S.MDASH)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: P.brownMid }}>←</button>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 24, color: P.brown, fontWeight: 500 }}>Notifications</div>
          </div>
          <span style={{ fontFamily: "Jost,sans-serif", fontSize: 12, color: P.tc, fontWeight: 500, cursor: "pointer" }}>Mark all read</span>
        </div>

        <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 10, paddingBottom: 24 }}>
          {notifs.map((n, i) => (
            <div key={i} style={{
              background: n.unread ? P.card : P.cardWarm,
              borderRadius: 18, padding: "14px 16px",
              boxShadow: "0 2px 10px rgba(46,31,18,.05)",
              borderLeft: `3px solid ${n.unread ? n.color : "transparent"}`,
              animation: `fadeUp .4s ease ${i * .07}s both`,
            }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 13, background: n.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{n.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                    <div style={{ fontFamily: "Jost,sans-serif", fontSize: 13, fontWeight: n.unread ? 600 : 500, color: P.brown }}>{n.title}</div>
                    {n.unread && <div style={{ width: 8, height: 8, borderRadius: "50%", background: n.color, flexShrink: 0, marginTop: 3 }} />}
                  </div>
                  <div style={{ fontFamily: "Jost,sans-serif", fontSize: 12, color: P.muted, fontWeight: 300, lineHeight: 1.5, marginBottom: 5 }}>{n.body}</div>
                  <div style={{ fontFamily: "Jost,sans-serif", fontSize: 10, color: P.muted, fontWeight: 400, letterSpacing: ".04em" }}>{n.time}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Phone>
  );
}

// ── PRODUCT MANAGER ──────────────────────────────────────────────────
export function ProductManager({ onNav, gender }) {
  const prods = [
    { name: "CeraVe Moisturising Cream", score: 1, label: "Low Risk", c: P.moss, bg: P.mossPale, icon: "🧴", days: 120, trigger: false },
    { name: "Neutrogena SPF 50", score: 2, label: "Low Risk", c: P.moss, bg: P.mossPale, icon: "☀️", days: 90, trigger: false },
    { name: "The Ordinary Niacinamide", score: 0, label: "No Risk", c: P.muted, bg: P.sand, icon: "🧪", days: 60, trigger: false },
    { name: "Paula's Choice BHA", score: 3, label: "Med Risk", c: P.gold, bg: P.goldPale, icon: "⚗️", days: 14, trigger: true },
  ];

  return (
    <Phone>
      <StatusBar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", background: P.bg, overflowY: "auto" }}>
        <div style={{ padding: "12px 24px 14px", display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => onNav(gender === "female" ? S.FDASH : S.MDASH)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: P.brownMid }}>←</button>
          <div>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 24, color: P.brown, fontWeight: 500 }}>Product <em style={{ color: P.tc }}>Manager</em></div>
            <div style={{ fontFamily: "Jost,sans-serif", fontSize: 12, color: P.muted, fontWeight: 300 }}>Your registered skincare products</div>
          </div>
        </div>

        {/* add new */}
        <div style={{ margin: "0 20px 16px", background: `linear-gradient(135deg,${P.tcPale},${P.goldPale})`, borderRadius: 20, padding: "16px 18px", display: "flex", alignItems: "center", gap: 14, border: `1.5px dashed ${P.tcLight}` }}>
          <div style={{ width: 48, height: 48, borderRadius: 13, background: P.tc, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0, color: "white" }}>+</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "Jost,sans-serif", fontSize: 14, fontWeight: 600, color: P.brown }}>Add new product</div>
            <div style={{ fontFamily: "Jost,sans-serif", fontSize: 11, color: P.muted, marginTop: 2, fontWeight: 300 }}>Photo, barcode, or search by name</div>
          </div>
          <div style={{ fontFamily: "Jost,sans-serif", fontSize: 12, color: P.tc, fontWeight: 500 }}>Scan →</div>
        </div>

        {/* summary stats */}
        <div style={{ margin: "0 20px 16px", display: "flex", gap: 10 }}>
          {[{ l: "Products", v: 4, c: P.brown }, { l: "Low Risk", v: 3, c: P.moss }, { l: "Potential Trigger", v: 1, c: P.tc }].map(s => (
            <div key={s.l} style={{ flex: 1, background: P.card, borderRadius: 16, padding: "13px 10px", textAlign: "center", boxShadow: "0 2px 8px rgba(46,31,18,.05)" }}>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 24, color: s.c, fontWeight: 500 }}>{s.v}</div>
              <div style={{ fontFamily: "Jost,sans-serif", fontSize: 10, color: P.muted, marginTop: 3, letterSpacing: ".04em" }}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* products list */}
        <div style={{ padding: "0 20px", paddingBottom: 24 }}>
          {prods.map((p, i) => (
            <div key={i} style={{ background: P.card, borderRadius: 18, padding: "14px 16px", marginBottom: 12, boxShadow: "0 2px 10px rgba(46,31,18,.05)", border: p.trigger ? `1.5px solid ${P.gold}44` : "none" }}>
              {p.trigger && <div style={{ fontFamily: "Jost,sans-serif", fontSize: 10, color: P.gold, fontWeight: 600, letterSpacing: ".06em", marginBottom: 6 }}>⚠ POTENTIAL TRIGGER DETECTED</div>}
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                <div style={{ width: 48, height: 48, borderRadius: 13, background: p.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>{p.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "Jost,sans-serif", fontSize: 13, fontWeight: 600, color: P.brown }}>{p.name}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                    <Pill label={p.label} color={p.c} bg={p.bg} />
                    <span style={{ fontFamily: "Jost,sans-serif", fontSize: 10, color: P.muted }}>Used {p.days} days</span>
                  </div>
                </div>
              </div>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontFamily: "Jost,sans-serif", fontSize: 10, color: P.muted, letterSpacing: ".06em", textTransform: "uppercase" }}>Comedogenic Score</span>
                  <span style={{ fontFamily: "Jost,sans-serif", fontSize: 11, fontWeight: 600, color: p.c }}>{p.score}/5</span>
                </div>
                <div style={{ height: 5, borderRadius: 4, background: P.sand, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${(p.score / 5) * 100}%`, borderRadius: 4, background: `linear-gradient(90deg,${p.c}88,${p.c})` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Phone>
  );
}

// ── SETTINGS ─────────────────────────────────────────────────────────
export function Settings({ onNav, gender }) {
  const [notifOn, setNotifOn] = useState(true);
  const [darkOn, setDarkOn] = useState(false);
  const [bioOn, setBioOn] = useState(true);

  const Toggle = ({ on, set }) => (
    <div onClick={() => set(!on)} style={{ width: 44, height: 24, borderRadius: 12, background: on ? P.tc : P.sand, cursor: "pointer", position: "relative", transition: "background .2s", flexShrink: 0 }}>
      <div style={{ position: "absolute", top: 2, left: on ? 22 : 2, width: 20, height: 20, borderRadius: "50%", background: "white", transition: "left .2s", boxShadow: "0 1px 4px rgba(0,0,0,.2)" }} />
    </div>
  );

  const sections = [
    {
      title: "Account", items: [
        { icon: "👤", label: "Edit Profile", sub: "Name, age, skin type" },
        { icon: "🧬", label: "Health Profile", sub: "Allergies, sensitivities, body metrics" },
        { icon: "🔒", label: "Privacy & Security", sub: "Password, data permissions" },
      ]
    },
    {
      title: "Preferences", items: [
        { icon: "🔔", label: "Notifications", sub: "Alerts and reminders", toggle: true, on: notifOn, set: setNotifOn },
        { icon: "🌙", label: "Dark Mode", sub: "Easy on the eyes at night", toggle: true, on: darkOn, set: setDarkOn },
        { icon: "🫁", label: "Biometric Data", sub: "Allow facial analysis storage", toggle: true, on: bioOn, set: setBioOn },
      ]
    },
    {
      title: "Data", items: [
        { icon: "📊", label: "Skin History", sub: "View full 30-day logs", action: () => onNav(S.HISTORY) },
        { icon: "📋", label: "Export Report", sub: "PDF for dermatologist" },
        { icon: "🗑", label: "Delete Account", sub: "Permanently remove all data", danger: true },
      ]
    },
  ];

  return (
    <Phone>
      <StatusBar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", background: P.bg, overflowY: "auto" }}>
        <div style={{ padding: "12px 24px 16px", display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => onNav(gender === "female" ? S.FDASH : S.MDASH)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: P.brownMid }}>←</button>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 24, color: P.brown, fontWeight: 500 }}>Settings</div>
        </div>

        {/* profile card */}
        <div style={{ margin: "0 20px 20px", background: `linear-gradient(135deg,${P.brown},${P.clay})`, borderRadius: 22, padding: "20px", display: "flex", alignItems: "center", gap: 16, boxShadow: "0 6px 20px rgba(46,31,18,.22)" }}>
          <div style={{ width: 60, height: 60, borderRadius: "50%", background: gender === "female" ? `linear-gradient(135deg,${P.tc},${P.clay})` : `linear-gradient(135deg,${P.moss},#4A6A30)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, color: "white", fontWeight: 700, flexShrink: 0 }}>
            {gender === "female" ? "P" : "A"}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, color: "white", fontWeight: 500 }}>{gender === "female" ? "Priya S." : "Arjun M."}</div>
            <div style={{ fontFamily: "Jost,sans-serif", fontSize: 12, color: "rgba(255,255,255,.6)", marginTop: 3 }}>{gender === "female" ? "priya@email.com" : "arjun@email.com"}</div>
            <div style={{ marginTop: 6 }}>
              <Pill label={gender === "female" ? "Oily Skin · Female" : "Combination · Male"} color="rgba(255,255,255,.8)" bg="rgba(255,255,255,.12)" />
            </div>
          </div>
        </div>

        {sections.map((sec, si) => (
          <div key={si} style={{ padding: "0 20px", marginBottom: 16 }}>
            <div style={{ fontFamily: "Jost,sans-serif", fontSize: 11, color: P.muted, fontWeight: 500, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 10 }}>{sec.title}</div>
            <div style={{ background: P.card, borderRadius: 20, overflow: "hidden", boxShadow: "0 2px 10px rgba(46,31,18,.05)" }}>
              {sec.items.map((item, ii) => (
                <div key={ii} onClick={item.action} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderBottom: ii < sec.items.length - 1 ? `1px solid ${P.sand}` : "none", cursor: item.action || item.toggle ? "pointer" : "default" }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: item.danger ? P.rosePale : P.bgDeep, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{item.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "Jost,sans-serif", fontSize: 13, fontWeight: 500, color: item.danger ? P.rose : P.brown }}>{item.label}</div>
                    <div style={{ fontFamily: "Jost,sans-serif", fontSize: 11, color: P.muted, fontWeight: 300, marginTop: 2 }}>{item.sub}</div>
                  </div>
                  {item.toggle ? <Toggle on={item.on} set={item.set} /> : <div style={{ color: P.muted, fontSize: 14 }}>›</div>}
                </div>
              ))}
            </div>
          </div>
        ))}

        <div style={{ padding: "0 20px 28px" }}>
          <button style={{ width: "100%", padding: "14px", borderRadius: 16, border: `1.5px solid ${P.sand}`, background: "transparent", cursor: "pointer", fontFamily: "Jost,sans-serif", fontSize: 14, fontWeight: 500, color: P.muted }}>Sign Out</button>
        </div>
      </div>
    </Phone>
  );
}
