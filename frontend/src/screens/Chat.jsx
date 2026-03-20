import { useState, useEffect, useRef } from "react";
import { Phone, StatusBar, BottomNav } from "../components/UIComponents.jsx";
import { P, S, SYSTEM_PROMPT } from "../constants.js";

export default function Chat({ onNav, gender }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: `Hi${gender === "female" ? " Priya" : " Arjun"}! 👋 I'm Nova, your AI skin coach. I can see your skin score is **73** today — up 5 points from yesterday, great progress!\n\nYour flare risk is high tomorrow (72%) mainly due to that dairy meal 3 days ago. Want me to explain what you can do right now to lower that risk? 🌿`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const suggestions = [
    "Why is my flare risk so high?",
    "Is dairy really affecting my skin?",
    "What should I eat today?",
    "Explain my skin score",
  ];

  const send = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput("");
    const newMessages = [...messages, { role: "user", content: msg }];
    setMessages(newMessages);
    setLoading(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      const reply = data.content?.[0]?.text || "Sorry, I couldn't get a response. Please try again.";
      setMessages(p => [...p, { role: "assistant", content: reply }]);
    } catch (e) {
      setMessages(p => [...p, { role: "assistant", content: "Sorry, I'm having trouble connecting right now. Please try again in a moment." }]);
    }
    setLoading(false);
  };

  // Render markdown bold (**text**) and line breaks
  const renderText = (text) => {
    return text.split("\n").map((line, i) => {
      const bold = line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
      return <div key={i} style={{ marginBottom: line === "" ? 6 : 0 }} dangerouslySetInnerHTML={{ __html: bold || "&nbsp;" }} />;
    });
  };

  return (
    <Phone>
      <StatusBar />

      {/* header */}
      <div style={{ flexShrink: 0, background: P.card, borderBottom: `1px solid ${P.sand}`, padding: "10px 20px 12px", display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={() => onNav(gender === "female" ? S.FDASH : S.MDASH)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: P.brownMid }}>←</button>
        <div style={{ width: 42, height: 42, borderRadius: "50%", background: `linear-gradient(135deg,${P.tc},${P.clay})`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: `0 3px 10px rgba(196,113,74,.4)` }}>
          <span style={{ fontSize: 18 }}>✦</span>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "Jost,sans-serif", fontSize: 14, fontWeight: 600, color: P.brown }}>Nova — AI Skin Coach</div>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: P.moss, animation: "pulse 2s ease infinite" }} />
            <span style={{ fontFamily: "Jost,sans-serif", fontSize: 10, color: P.moss }}>Llama 4 · Online</span>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: "Jost,sans-serif", fontSize: 10, color: P.muted }}>Skin Score</div>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 16, color: P.moss, fontWeight: 600 }}>73 ↑</div>
        </div>
      </div>

      {/* messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 8px", display: "flex", flexDirection: "column", gap: 12, background: P.bg }}>
        {messages.map((m, i) => {
          const isAI = m.role === "assistant";
          return (
            <div key={i} style={{ display: "flex", flexDirection: isAI ? "row" : "row-reverse", gap: 8, alignItems: "flex-end", animation: "msgIn .3s ease" }}>
              {isAI && (
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: `linear-gradient(135deg,${P.tc},${P.clay})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0, marginBottom: 2 }}>✦</div>
              )}
              <div style={{
                maxWidth: "78%", padding: "12px 14px",
                borderRadius: isAI ? "4px 18px 18px 18px" : "18px 4px 18px 18px",
                background: isAI ? P.card : `linear-gradient(135deg,${P.tc},${P.clay})`,
                boxShadow: isAI ? "0 2px 10px rgba(46,31,18,.07)" : "0 3px 12px rgba(196,113,74,.3)",
                fontFamily: "Jost,sans-serif", fontSize: 13, color: isAI ? P.brown : "white",
                lineHeight: 1.6, fontWeight: 300,
              }}>
                {renderText(m.content)}
              </div>
            </div>
          );
        })}

        {/* typing indicator */}
        {loading && (
          <div style={{ display: "flex", gap: 8, alignItems: "flex-end", animation: "msgIn .3s ease" }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: `linear-gradient(135deg,${P.tc},${P.clay})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>✦</div>
            <div style={{ padding: "12px 16px", borderRadius: "4px 18px 18px 18px", background: P.card, boxShadow: "0 2px 10px rgba(46,31,18,.07)", display: "flex", gap: 5, alignItems: "center" }}>
              {[0, 1, 2].map(i => <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: P.tc, animation: `pulse 1.2s ease infinite`, animationDelay: `${i * .2}s` }} />)}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* quick suggestions — only show at start */}
      {messages.length <= 2 && (
        <div style={{ flexShrink: 0, padding: "8px 16px", background: P.bg, display: "flex", gap: 7, overflowX: "auto" }}>
          {suggestions.map((s, i) => (
            <button key={i} onClick={() => send(s)} style={{ padding: "7px 14px", borderRadius: 20, border: `1.5px solid ${P.tc}44`, background: P.tcPale, cursor: "pointer", fontFamily: "Jost,sans-serif", fontSize: 11, color: P.tc, fontWeight: 500, whiteSpace: "nowrap", flexShrink: 0 }}>
              {s}
            </button>
          ))}
        </div>
      )}

      {/* input bar */}
      <div style={{ flexShrink: 0, padding: "10px 16px 24px", background: P.card, borderTop: `1px solid ${P.sand}`, display: "flex", gap: 10, alignItems: "flex-end" }}>
        <div style={{ flex: 1, background: P.bg, borderRadius: 20, border: `1.5px solid ${P.sand}`, padding: "10px 16px", display: "flex", alignItems: "center" }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && send()}
            placeholder="Ask about your skin..."
            style={{ flex: 1, background: "none", border: "none", outline: "none", fontFamily: "Jost,sans-serif", fontSize: 13, color: P.brown }}
          />
        </div>
        <button onClick={() => send()} disabled={!input.trim() || loading} style={{
          width: 44, height: 44, borderRadius: "50%",
          background: input.trim() && !loading ? `linear-gradient(135deg,${P.tc},${P.clay})` : P.sand,
          border: "none", cursor: input.trim() && !loading ? "pointer" : "default",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          transition: "background .2s",
          boxShadow: input.trim() && !loading ? "0 3px 10px rgba(196,113,74,.4)" : "none",
        }}>
          <span style={{ fontSize: 18, color: input.trim() && !loading ? "white" : P.muted }}>↑</span>
        </button>
      </div>
    </Phone>
  );
}
