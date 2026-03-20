import { useEffect } from "react";
import { Phone } from "../components/UIComponents.jsx";
import { P } from "../constants.js";

export default function Splash({ onNext }) {
  useEffect(() => { const t = setTimeout(onNext, 2600); return () => clearTimeout(t); }, []);
  return (
    <Phone bg={P.brown}>
      <div style={{
        flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center",
        background: "radial-gradient(ellipse at 50% 38%,#7A4E32 0%,#2E1F12 58%,#180E06 100%)",
        position: "relative", overflow: "hidden",
      }}>
        {[170, 220, 275].map((s, i) => (
          <div key={s} style={{
            position: "absolute", width: s, height: s,
            border: `1px solid rgba(196,113,74,${0.14 - i * 0.04})`,
            borderRadius: "50%",
            animation: `pulse ${2.2 + i * .5}s ease infinite`,
            animationDelay: `${i * .3}s`,
          }} />
        ))}
        <div style={{ textAlign: "center", zIndex: 2, animation: "float 3.5s ease infinite" }}>
          <div style={{ fontSize: 50, color: "#C4714A", marginBottom: 10 }}>✦</div>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 46, fontWeight: 500, color: "#F5EDDF", letterSpacing: ".1em", lineHeight: 1 }}>skinova</div>
          <div style={{ fontFamily: "Jost,sans-serif", fontSize: 12, color: "rgba(245,237,223,.4)", letterSpacing: ".22em", marginTop: 12, fontWeight: 300 }}>KNOW YOUR SKIN</div>
        </div>
        <div style={{ position: "absolute", bottom: 56, display: "flex", gap: 7 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: 6, height: 6, borderRadius: "50%",
              background: `rgba(196,113,74,${.5 - i * .12})`,
              animation: `pulse ${1.2 + i * .3}s ease infinite`,
              animationDelay: `${i * .2}s`,
            }} />
          ))}
        </div>
      </div>
    </Phone>
  );
}
