import {
  View, Text, StyleSheet, Pressable,
  ScrollView, TextInput, ActivityIndicator, Platform,
} from "react-native";
import { useState, useEffect, useCallback, useMemo } from "react";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ── Config ────────────────────────────────────────────────────────
const BACKEND_URL: string =
  (process.env.EXPO_PUBLIC_API_URL as string) ||
  (Platform.OS === "web" ? "http://localhost:8000" : "http://10.237.1.60:8000");

const STORAGE_KEY = "skinova_cycle_v2";

const PC: Record<string, string> = {
  Menstrual: "#E87070", Follicular: "#7CC98A",
  Ovulatory: "#F0A896", Luteal:     "#9B8AD4",
};
const PG: Record<string, readonly [string, string]> = {
  Menstrual: ["#E87070","#C85A5A"] as const,
  Follicular:["#7CC98A","#5aaa6a"] as const,
  Ovulatory: ["#F0A896","#d4836e"] as const,
  Luteal:    ["#9B8AD4","#7a68b8"] as const,
};
const PE: Record<string, string> = {
  Menstrual:"🌑", Follicular:"🌱", Ovulatory:"✨", Luteal:"🌕",
};

// ── Helpers ───────────────────────────────────────────────────────
function fmtDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}
function validDate(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(Date.parse(s));
}
function daysDiff(a: string, b: string): number {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86400000);
}
function calcCycle(s: string, e: string): number {
  const d = daysDiff(s, e);
  return Math.max(21, Math.min(45, d > 0 ? d : 28));
}
function calcPeriod(s: string, e: string): number {
  const d = daysDiff(s, e);
  return Math.max(2, Math.min(10, d > 0 ? d : 5));
}

// ── Types ─────────────────────────────────────────────────────────
interface Pred {
  date: string;
  phase: string;
  day_of_cycle: number;
  days_left_in_phase: number;
  skin_condition: string;
  phase_description: string;
  tft_weight_multiplier: number;
  dietary_adjustment: string;
}
interface Cfg { start: string; end: string; }

const DEFAULT_CFG: Cfg = {
  start: fmtDate(new Date()),
  end:   fmtDate(new Date(Date.now() + 5 * 86400000)),
};

// ── Component ─────────────────────────────────────────────────────
export default function CycleScreen() {
  const [cfg,     setCfg]     = useState<Cfg>(DEFAULT_CFG);
  const [ready,   setReady]   = useState(false);
  const [preds,   setPreds]   = useState<Pred[]>([]);
  const [busy,    setBusy]    = useState(false);
  const [apiErr,  setApiErr]  = useState("");
  const [editing, setEditing] = useState(false);
  const [ds,      setDs]      = useState("");
  const [de,      setDe]      = useState("");
  const [month,   setMonth]   = useState(() => new Date());
  const [loggingPeriod, setLoggingPeriod] = useState(false);
  const [newPeriodStart, setNewPeriodStart] = useState(fmtDate(new Date()));
  const [newPeriodEnd, setNewPeriodEnd] = useState("");

  // Load persisted settings
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(v => { if (v) setCfg(JSON.parse(v) as Cfg); })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  const persist = async (c: Cfg) => {
    setCfg(c);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(c)).catch(() => {});
  };

  // Fetch predictions
  const fetchPreds = useCallback(async () => {
    if (!ready || !validDate(cfg.start)) return;
    setApiErr(""); setBusy(true);
    try {
      const y = month.getFullYear(), m = month.getMonth();
      const token = await AsyncStorage.getItem("skinova_token");
      
      // First get cycle stats
      const statsRes = await fetch(`${BACKEND_URL}/api/cycle/stats`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!statsRes.ok) throw new Error(`Stats: ${statsRes.status}`);
      const stats = await statsRes.json();
      
      const cycleLength = stats.average_cycle_length || 28;
      const periodDuration = calcPeriod(cfg.start, cfg.end || fmtDate(new Date(Date.parse(cfg.start) + cycleLength * 86400000)));
      
      const res = await fetch(`${BACKEND_URL}/api/cycle/predict`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          last_period_start: cfg.start,
          start_date:        fmtDate(new Date(y, m - 1, 1)),
          end_date:          fmtDate(new Date(y, m + 2, 0)),
          cycle_length:      cycleLength,
          period_duration:   periodDuration,
        }),
      });
      if (!res.ok) throw new Error(`Server ${res.status}`);
      const data = await res.json();
      const list: Pred[] = Array.isArray(data.predictions) ? data.predictions : [];
      setPreds(list);
    } catch (e: any) {
      setApiErr(e.message ?? "Error");
    } finally {
      setBusy(false);
    }
  }, [ready, cfg, month]);

  // Log new period
  const logPeriod = useCallback(async () => {
    if (!validDate(newPeriodStart)) return;
    setBusy(true);
    try {
      const token = await AsyncStorage.getItem("skinova_token");
      const res = await fetch(`${BACKEND_URL}/api/cycle/log-period`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          user_id: "current", // Will be overridden by auth
          period_start: newPeriodStart,
          period_end: newPeriodEnd || null,
        }),
      });
      if (!res.ok) throw new Error(`Server ${res.status}`);
      // Update cfg with new period
      const newCfg = { start: newPeriodStart, end: newPeriodEnd || fmtDate(new Date(Date.parse(newPeriodStart) + 5 * 86400000)) };
      await persist(newCfg);
      setLoggingPeriod(false);
      setNewPeriodStart(fmtDate(new Date()));
      setNewPeriodEnd("");
      // Refresh predictions
      await fetchPreds();
    } catch (e: any) {
      setApiErr(e.message ?? "Error logging period");
    } finally {
      setBusy(false);
    }
  }, [newPeriodStart, newPeriodEnd, persist, fetchPreds]);

  useEffect(() => { fetchPreds(); }, [fetchPreds]);

  // Lookup helper
  const getPred = useCallback((d: Date): Pred | undefined => {
    const f = fmtDate(d);
    return preds.find(p => p.date.startsWith(f));
  }, [preds]);

  // Today
  const todayStr = useMemo(() => fmtDate(new Date()), []);
  const tp       = useMemo(() => preds.find(p => p.date.startsWith(todayStr)), [preds, todayStr]);
  const phase    = tp?.phase ?? "";
  const heroBg   = (PG[phase] ?? PG.Luteal) as [string, string];

  // Week (Mon–Sun) — useMemo so React Compiler doesn't break it
  const weekDates = useMemo((): Date[] => {
    const today = new Date();
    const dow   = today.getDay(); // 0=Sun
    const mon   = new Date(today);
    mon.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1));
    const arr: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const x = new Date(mon);
      x.setDate(mon.getDate() + i);
      arr.push(x);
    }
    return arr;
  }, [todayStr]);

  // Calendar rows — useMemo, explicit typing, no IIFE
  const calRows = useMemo((): Array<Array<Date | null>> => {
    const y   = month.getFullYear();
    const m   = month.getMonth();
    const firstDow   = new Date(y, m, 1).getDay();          // 0=Sun
    const daysInMo   = new Date(y, m + 1, 0).getDate();
    const cells: Array<Date | null> = [];

    // leading nulls
    for (let i = 0; i < firstDow; i++) cells.push(null);
    // actual days
    for (let d = 1; d <= daysInMo; d++) cells.push(new Date(y, m, d));
    // trailing nulls to complete last week
    while (cells.length % 7 !== 0) cells.push(null);

    // chunk into rows of 7
    const rows: Array<Array<Date | null>> = [];
    for (let i = 0; i < cells.length; i += 7) {
      rows.push(cells.slice(i, i + 7));
    }
    return rows;
  }, [month]);

  const monthLabel = month.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <LinearGradient colors={["#FFF0F3", "#F5F0FF"]} style={{ flex: 1 }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* ── Hero ─────────────────────────────────────── */}
        <LinearGradient colors={heroBg} style={st.hero}>
          <Text style={st.heroDate}>
            {new Date().toLocaleDateString("en-US", { day: "numeric", month: "long" })}
          </Text>

          {busy ? (
            <ActivityIndicator color="#fff" size="large" style={{ marginVertical: 20 }} />
          ) : tp ? (
            <>
              <Text style={st.heroEmoji}>{PE[phase] ?? "🌙"}</Text>
              <Text style={st.heroPhase}>{phase} Phase</Text>
              <Text style={st.heroDay}>Day {tp.day_of_cycle}</Text>
              <Text style={st.heroDesc}>{tp.phase_description}</Text>
              <View style={st.badges}>
                <View style={st.badge}>
                  <Text style={st.badgeTxt}>Skin: {tp.skin_condition}</Text>
                </View>
                {tp.days_left_in_phase > 0 && (
                  <View style={st.badge}>
                    <Text style={st.badgeTxt}>{tp.days_left_in_phase}d left</Text>
                  </View>
                )}
              </View>
            </>
          ) : (
            <Text style={st.heroEmpty}>Set your period dates below</Text>
          )}
        </LinearGradient>

        {/* ── Log New Period ───────────────────────────────── */}
        <View style={st.panel}>
          <Text style={st.panelTitle}>Log New Period</Text>
          <Text style={st.panelNote}>Track your cycle history for better predictions</Text>

          <Text style={st.lbl}>Period Start</Text>
          <TextInput
            style={[st.inp, !validDate(newPeriodStart) && newPeriodStart.length > 0 && st.inpErr]}
            value={newPeriodStart}
            onChangeText={setNewPeriodStart}
            placeholder="YYYY-MM-DD"
          />

          <Text style={st.lbl}>Period End (optional)</Text>
          <TextInput
            style={[st.inp, !validDate(newPeriodEnd) && newPeriodEnd.length > 0 && st.inpErr]}
            value={newPeriodEnd}
            onChangeText={setNewPeriodEnd}
            placeholder="YYYY-MM-DD (leave empty if ongoing)"
          />

          <Pressable style={st.btn} onPress={logPeriod} disabled={busy}>
            <Text style={st.btnTxt}>{busy ? "Logging..." : "Log Period"}</Text>
          </Pressable>
        </View>

        {/* ── Week strip ───────────────────────────────── */}
        <View style={st.card}>
          <View style={st.row}>
            {["M","T","W","T","F","S","S"].map((l, i) => (
              <Text key={i} style={st.weekLbl}>{l}</Text>
            ))}
          </View>
          <View style={st.row}>
            {weekDates.map((d, i) => {
              const p    = getPred(d);
              const isT  = fmtDate(d) === todayStr;
              const bg   = isT ? (p ? PC[p.phase] : "#E87070") : "transparent";
              return (
                <View key={i} style={[st.weekCell, { backgroundColor: bg, borderRadius: 14 }]}>
                  <Text style={[st.weekNum, isT && { color: "#fff", fontWeight: "700" }]}>
                    {d.getDate()}
                  </Text>
                  <View style={[st.weekDot, { backgroundColor: p ? PC[p.phase] : "transparent" }]} />
                </View>
              );
            })}
          </View>
        </View>

        {/* ── Stats ────────────────────────────────────── */}
        {validDate(cfg.start) && validDate(cfg.end) && (
          <View style={st.statsRow}>
            {([
              [String(calcCycle(cfg.start, cfg.end)),  "Cycle length"],
              [String(calcPeriod(cfg.start, cfg.end)), "Period length"],
              [tp ? String(tp.day_of_cycle) : "—",     "Today"],
            ] as [string, string][]).map(([v, l], i) => (
              <View key={i} style={st.statCard}>
                <Text style={st.statVal}>{v}</Text>
                <Text style={st.statLbl}>{l}</Text>
              </View>
            ))}
          </View>
        )}

        {/* ── Mini calendar ────────────────────────────── */}
        <View style={[st.card, { marginTop: 12 }]}>
          {/* Header */}
          <View style={st.calHead}>
            <Pressable onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1))}>
              <Text style={st.calNav}>‹</Text>
            </Pressable>
            <Text style={st.calTitle}>{monthLabel}</Text>
            <Pressable onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1))}>
              <Text style={st.calNav}>›</Text>
            </Pressable>
          </View>

          {/* Day-of-week headers */}
          <View style={st.row}>
            {["S","M","T","W","T","F","S"].map((d, i) => (
              <Text key={i} style={st.calHdr}>{d}</Text>
            ))}
          </View>

          {/* Weeks — calRows is built by useMemo, always a proper array */}
          {calRows.map((rowArr, ri) => (
            <View key={ri} style={st.row}>
              {rowArr.map((date, di) => {
                if (!date) {
                  return <View key={di} style={st.calCell} />;
                }
                const p    = getPred(date);
                const isT  = fmtDate(date) === todayStr;
                const bg   = p ? PC[p.phase] + "30" : "transparent";
                const bord = isT ? PC[p?.phase ?? "Luteal"] : "transparent";
                return (
                  <View key={di} style={[st.calCell, { backgroundColor: bg, borderColor: bord, borderWidth: isT ? 2 : 0, borderRadius: 14 }]}>
                    <Text style={[st.calNum, isT && { fontWeight: "800" }]}>{date.getDate()}</Text>
                    {p && <View style={[st.calDot, { backgroundColor: PC[p.phase] }]} />}
                  </View>
                );
              })}
            </View>
          ))}

          {/* Legend */}
          <View style={st.legend}>
            {Object.entries(PC).map(([p, c]) => (
              <View key={p} style={st.legItem}>
                <View style={[st.legDot, { backgroundColor: c }]} />
                <Text style={st.legTxt}>{p}</Text>
              </View>
            ))}
          </View>
        </View>

        {!!apiErr && <Text style={st.errTxt}>{apiErr}</Text>}
      </ScrollView>
    </LinearGradient>
  );
}

// ── Styles — NO shadow* props (boxShadow only for web-safe) ───────
const SHADOW = Platform.OS === "web"
  ? ({ boxShadow: "0 2px 10px rgba(0,0,0,0.07)" } as any)
  : { shadowColor: "#000", shadowOpacity: 0.07, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 3 };

const st = StyleSheet.create({
  hero:      { borderBottomLeftRadius: 28, borderBottomRightRadius: 28, padding: 24, paddingTop: Platform.OS === "web" ? 68 : 48, alignItems: "center", minHeight: 240 },
  heroDate:  { fontSize: 13, color: "rgba(255,255,255,0.8)", fontWeight: "500", marginBottom: 6 },
  heroEmoji: { fontSize: 34, marginBottom: 4 },
  heroPhase: { fontSize: 26, fontWeight: "800", color: "#fff" },
  heroDay:   { fontSize: 13, color: "rgba(255,255,255,0.85)", marginTop: 2, marginBottom: 8 },
  heroDesc:  { fontSize: 11, color: "rgba(255,255,255,0.8)", textAlign: "center", lineHeight: 17, marginHorizontal: 20, marginBottom: 10 },
  heroEmpty: { fontSize: 13, color: "rgba(255,255,255,0.7)", marginVertical: 18 },
  badges:    { flexDirection: "row", gap: 8, marginBottom: 14 },
  badge:     { backgroundColor: "rgba(255,255,255,0.25)", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  badgeTxt:  { color: "#fff", fontSize: 10, fontWeight: "600" },
  editBtn:   { backgroundColor: "rgba(255,255,255,0.92)", borderRadius: 22, paddingHorizontal: 22, paddingVertical: 8 },
  editBtnTxt:{ color: "#E87070", fontWeight: "700", fontSize: 13 },

  panel:     { margin: 16, backgroundColor: "#fff", borderRadius: 18, padding: 18, ...SHADOW },
  panelTitle:{ fontSize: 16, fontWeight: "800", color: "#2D2845", marginBottom: 2 },
  panelNote: { fontSize: 10, color: "#aaa", marginBottom: 14 },
  lbl:       { fontSize: 10, fontWeight: "700", color: "#888", textTransform: "uppercase", marginBottom: 4 },
  inp:       { backgroundColor: "#F7F5FF", borderRadius: 10, padding: 11, fontSize: 14, color: "#2D2845", marginBottom: 12, borderWidth: 1, borderColor: "#E8E4F0" },
  inpErr:    { borderColor: "#E87070" },
  preview:   { fontSize: 12, color: "#7a68b8", fontWeight: "600", marginBottom: 12, textAlign: "center" },
  saveBtn:   { backgroundColor: "#E87070", borderRadius: 12, padding: 12, alignItems: "center" },
  saveTxt:   { color: "#fff", fontWeight: "700", fontSize: 14 },

  card:      { marginHorizontal: 16, marginTop: 14, backgroundColor: "#fff", borderRadius: 16, padding: 12, ...SHADOW },
  row:       { flexDirection: "row" },
  weekLbl:   { flex: 1, textAlign: "center", fontSize: 9, fontWeight: "700", color: "#bbb", marginBottom: 3 },
  weekCell:  { flex: 1, alignItems: "center", paddingVertical: 5 },
  weekNum:   { fontSize: 13, color: "#2D2845" },
  weekDot:   { width: 4, height: 4, borderRadius: 2, marginTop: 2 },

  statsRow:  { flexDirection: "row", gap: 10, marginHorizontal: 16, marginTop: 12 },
  statCard:  { flex: 1, backgroundColor: "#fff", borderRadius: 14, padding: 12, alignItems: "center", ...SHADOW },
  statVal:   { fontSize: 22, fontWeight: "800", color: "#2D2845" },
  statLbl:   { fontSize: 9, color: "#aaa", marginTop: 1, textAlign: "center" },

  calHead:   { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  calTitle:  { fontSize: 13, fontWeight: "700", color: "#2D2845" },
  calNav:    { fontSize: 20, color: "#9B8AD4", paddingHorizontal: 6 },
  calHdr:    { flex: 1, textAlign: "center", fontSize: 9, fontWeight: "700", color: "#bbb", paddingVertical: 3 },
  calCell:   { flex: 1, aspectRatio: 1, alignItems: "center", justifyContent: "center" },
  calNum:    { fontSize: 11, color: "#2D2845" },
  calDot:    { width: 3, height: 3, borderRadius: 2, marginTop: 1 },

  legend:    { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10, justifyContent: "center" },
  legItem:   { flexDirection: "row", alignItems: "center", gap: 3 },
  legDot:    { width: 7, height: 7, borderRadius: 4 },
  legTxt:    { fontSize: 9, color: "#999" },
  errTxt:    { color: "#E87070", textAlign: "center", fontSize: 11, margin: 12 },
});