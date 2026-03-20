import { useState } from "react";
import { S, P, GLOBAL_CSS } from "./constants.js";

// ── SCREENS ──────────────────────────────────────────────────────────
import Splash from "./screens/Splash.jsx";
import { Onboard1, Onboard2 } from "./screens/Onboarding.jsx";
import Signup from "./screens/Signup.jsx";
import { HealthProfile, ProductsSetup } from "./screens/ProfileSetup.jsx";
import Calibration from "./screens/Calibration.jsx";
import { FemaleDashboard, MaleDashboard } from "./screens/Dashboards.jsx";
import FoodLog from "./screens/FoodLog.jsx";
import Forecast from "./screens/Forecast.jsx";
import Chat from "./screens/Chat.jsx";
import SkinHistory from "./screens/SkinHistory.jsx";
import { Notifications, ProductManager, Settings } from "./screens/Misc.jsx";

export default function App() {
  const [screen, setScreen] = useState(S.SPLASH);
  const [gender, setGender] = useState("female");

  const nav = (s) => setScreen(s);

  // Linear onboarding flow
  const next = {
    [S.SPLASH]:    () => nav(S.OB1),
    [S.OB1]:       () => nav(S.OB2),
    [S.OB2]:       () => nav(S.SIGNUP),
    [S.SIGNUP]:    () => nav(S.PROFILE),
    [S.PROFILE]:   () => nav(S.PRODUCTS),
    [S.PRODUCTS]:  () => nav(gender === "female" ? S.FDASH : S.MDASH),
  };

  const renderScreen = () => {
    switch (screen) {
      case S.SPLASH:   return <Splash onNext={next[S.SPLASH]} />;
      case S.OB1:      return <Onboard1 onNext={next[S.OB1]} />;
      case S.OB2:      return <Onboard2 onNext={next[S.OB2]} />;
      case S.SIGNUP:   return <Signup onNext={next[S.SIGNUP]} setGender={setGender} />;
      case S.PROFILE:  return <HealthProfile onNext={next[S.PROFILE]} />;
      case S.PRODUCTS: return <ProductsSetup onNext={next[S.PRODUCTS]} />;
      case S.FDASH:    return <FemaleDashboard onNav={nav} />;
      case S.MDASH:    return <MaleDashboard onNav={nav} />;
      case S.FOOD:     return <FoodLog onNav={nav} gender={gender} />;
      case S.FORECAST: return <Forecast onNav={nav} gender={gender} />;
      case S.CALIB:    return <Calibration onNav={nav} gender={gender} />;
      case S.HISTORY:  return <SkinHistory onNav={nav} gender={gender} />;
      case S.CHAT:     return <Chat onNav={nav} gender={gender} />;
      case S.NOTIFS:   return <Notifications onNav={nav} gender={gender} />;
      case S.PRODMGR:  return <ProductManager onNav={nav} gender={gender} />;
      case S.SETTINGS: return <Settings onNav={nav} gender={gender} />;
      default:         return <Splash onNext={next[S.SPLASH]} />;
    }
  };

  const allScreens = [
    { id: S.SPLASH, l: "Splash" }, { id: S.OB1, l: "Onboard 1" }, { id: S.OB2, l: "Onboard 2" },
    { id: S.SIGNUP, l: "Sign Up" }, { id: S.PROFILE, l: "Profile" }, { id: S.PRODUCTS, l: "Products" },
    { id: S.CALIB, l: "Calibration" },
    { id: S.FDASH, l: "Dashboard ♀" }, { id: S.MDASH, l: "Dashboard ♂" },
    { id: S.FOOD, l: "Food Log" }, { id: S.FORECAST, l: "Forecast" },
    { id: S.CHAT, l: "✦ AI Chat" }, { id: S.HISTORY, l: "Skin History" },
    { id: S.NOTIFS, l: "Notifications" }, { id: S.PRODMGR, l: "Products Mgr" },
    { id: S.SETTINGS, l: "Settings" },
  ];

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div style={{ minHeight: "100vh", background: "#1C1208", display: "flex", flexDirection: "column", alignItems: "center", padding: "36px 20px", gap: 24 }}>

        {/* logo */}
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 30, color: "#F5EDDF", fontWeight: 500, letterSpacing: ".12em" }}>✦ skinova</div>
          <div style={{ fontFamily: "Jost,sans-serif", fontSize: 11, color: "rgba(245,237,223,.3)", letterSpacing: ".22em", marginTop: 4, fontWeight: 300 }}>COMPLETE UI PROTOTYPE · v2.0</div>
        </div>

        {/* screen picker */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7, justifyContent: "center", maxWidth: 720 }}>
          {allScreens.map(s => (
            <button key={s.id} onClick={() => nav(s.id)} style={{
              padding: "7px 15px", borderRadius: 20, cursor: "pointer",
              fontFamily: "Jost,sans-serif", fontSize: 12, fontWeight: 500,
              border: `1px solid ${screen === s.id ? P.tc : "rgba(245,237,223,.12)"}`,
              background: screen === s.id ? `linear-gradient(135deg,${P.tc},${P.clay})` : "rgba(245,237,223,.04)",
              color: screen === s.id ? "white" : "rgba(245,237,223,.5)",
              transition: "all .2s",
            }}>
              {s.l}
            </button>
          ))}
        </div>

        {/* gender demo toggle */}
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <span style={{ fontFamily: "Jost,sans-serif", fontSize: 11, color: "rgba(245,237,223,.4)" }}>Demo as:</span>
          {["female", "male"].map(g => (
            <button key={g} onClick={() => setGender(g)} style={{
              padding: "6px 18px", borderRadius: 20, cursor: "pointer",
              fontFamily: "Jost,sans-serif", fontSize: 12, fontWeight: 500,
              border: `1px solid ${gender === g ? P.tc : "rgba(245,237,223,.15)"}`,
              background: gender === g ? `linear-gradient(135deg,${P.tc},${P.clay})` : "rgba(245,237,223,.04)",
              color: gender === g ? "white" : "rgba(245,237,223,.45)",
              transition: "all .2s",
            }}>
              {g === "female" ? "♀ Female" : "♂ Male"}
            </button>
          ))}
        </div>

        {/* phone */}
        {renderScreen()}

        <div style={{ fontFamily: "Jost,sans-serif", fontSize: 11, color: "rgba(245,237,223,.18)", letterSpacing: ".08em", textAlign: "center", paddingBottom: 16 }}>
          16 SCREENS · AI CHAT POWERED BY CLAUDE API (LLAMA 4 IN PRODUCTION) · TAP INSIDE PHONE TO NAVIGATE
        </div>
      </div>
    </>
  );
}
