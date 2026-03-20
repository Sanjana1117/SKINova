import { useState } from "react";
import { Phone, StatusBar, Btn } from "../components/UIComponents.jsx";
import { P } from "../constants.js";

export default function Signup({ onNext, setGender }) {
  const [form, setForm] = useState({ name: "", email: "", password: "", gender: "female", age: "" });
  const [step, setStep] = useState(1);
  const up = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const go = () => {
    if (step === 1) setStep(2);
    else { setGender(form.gender); onNext(); }
  };

  const inp = {
    width: "100%", padding: "13px 16px", borderRadius: 13,
    border: `1.5px solid ${P.sand}`, background: P.cream,
    fontFamily: "Jost,sans-serif", fontSize: 14, color: P.brown, outline: "none",
  };
  const lbl = {
    fontFamily: "Jost,sans-serif", fontSize: 11, color: P.muted, fontWeight: 500,
    letterSpacing: ".08em", marginBottom: 6, textTransform: "uppercase", display: "block",
  };

  return (
    <Phone>
      <StatusBar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "16px 26px 28px", background: P.bg, overflowY: "auto" }}>
        <div style={{ marginBottom: 26 }}>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 30, color: P.brown, fontWeight: 500, lineHeight: 1.2 }}>
            {step === 1 ? <>Welcome to<br /><em style={{ color: P.tc }}>Skinova</em></> : <>Tell us about<br /><em style={{ color: P.tc }}>yourself</em></>}
          </div>
          <div style={{ fontFamily: "Jost,sans-serif", fontSize: 13, color: P.muted, marginTop: 7, fontWeight: 300 }}>
            {step === 1 ? "Create your account to begin" : "Helps personalise your AI models"}
          </div>
        </div>

        {step === 1 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[["Full Name", "name", "text"], ["Email Address", "email", "email"], ["Password", "password", "password"]].map(([l, k, t]) => (
              <div key={k}>
                <label style={lbl}>{l}</label>
                <input type={t} value={form[k]} onChange={e => up(k, e.target.value)} style={inp} placeholder={`Enter your ${l.toLowerCase()}`} />
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div>
              <label style={lbl}>I identify as</label>
              <div style={{ display: "flex", gap: 12 }}>
                {["female", "male"].map(g => (
                  <button key={g} onClick={() => up("gender", g)} style={{
                    flex: 1, padding: "14px 0", borderRadius: 13, cursor: "pointer",
                    border: `1.5px solid ${form.gender === g ? P.tc : P.sand}`,
                    background: form.gender === g ? P.tcPale : P.cream,
                    fontFamily: "Jost,sans-serif", fontSize: 14, fontWeight: 500,
                    color: form.gender === g ? P.tc : P.muted, transition: "all .2s",
                  }}>
                    {g === "female" ? "♀  Female" : "♂  Male"}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label style={lbl}>Age</label>
              <input type="number" value={form.age} onChange={e => up("age", e.target.value)} style={inp} placeholder="e.g. 24" />
            </div>
            <div>
              <label style={lbl}>Skin Type</label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {["Oily", "Dry", "Combination", "Normal", "Sensitive"].map(t => (
                  <button key={t} style={{ padding: "8px 16px", borderRadius: 20, border: `1px solid ${P.sand}`, background: P.cream, cursor: "pointer", fontFamily: "Jost,sans-serif", fontSize: 12, color: P.muted }}>{t}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div style={{ marginTop: "auto", paddingTop: 28 }}>
          <Btn full onClick={go}>{step === 1 ? "Continue →" : "Let's Go →"}</Btn>
          {step === 1 && (
            <div style={{ textAlign: "center", marginTop: 14, fontFamily: "Jost,sans-serif", fontSize: 12, color: P.muted }}>
              Already have an account? <span style={{ color: P.tc, fontWeight: 500 }}>Sign In</span>
            </div>
          )}
        </div>
      </div>
    </Phone>
  );
}
