// app/(tabs)/forecast.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8000";

async function apiFetch(path: string, body: object) {
  const token = await AsyncStorage.getItem("skinova_token");
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}
async function apiGet(path: string) {
  const token = await AsyncStorage.getItem("skinova_token");
  const res = await fetch(`${BASE_URL}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

function normalizeScore(value: number) { if (!Number.isFinite(value)) return 0; return value <= 1 ? Math.round(value * 100) : Math.round(value); }
function riskColor(score: number) { if (score >= 70) return "#D4856A"; if (score >= 40) return "#C4956A"; return "#8BAF9C"; }
function riskLabel(score: number) { if (score >= 70) return "High"; if (score >= 40) return "Moderate"; return "Low"; }
function getSeverityColor(s: string) { if (s === "high") return "#D4856A"; if (s === "medium") return "#C4956A"; return "#8BAF9C"; }
function getSeverityBg(s: string) { if (s === "high") return "rgba(212,133,106,0.10)"; if (s === "medium") return "rgba(196,149,106,0.10)"; return "rgba(139,175,156,0.10)"; }
function getWindowLabel(hrs: number) { if (hrs <= 24) return "24 h delay"; if (hrs <= 48) return "48 h delay"; return "72 h delay"; }
function localISO(date: Date): string { return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`; }
function todayISO() { return localISO(new Date()); }

const SHADOW = Platform.OS === "web"
  ? ({ boxShadow: "0 4px 20px rgba(196,149,106,0.08)" } as any)
  : { shadowColor: "#C4956A", shadowOpacity: 0.08, shadowRadius: 16, shadowOffset: { width: 0, height: 4 }, elevation: 4 };

function RiskBar({ score, color }: { score: number; color: string }) {
  return (
    <View style={st.barBg}>
      <View style={[st.barFill, { width: `${Math.max(0, Math.min(score, 100))}%` as any, backgroundColor: color }]} />
    </View>
  );
}

function LearnedTriggerRow({ trigger, index, isLast }: { trigger: any; index: number; isLast: boolean }) {
  const color = getSeverityColor(trigger.severity);
  const bg = getSeverityBg(trigger.severity);
  return (
    <View style={[st.learnedRow, isLast && { borderBottomWidth: 0, marginBottom: 0 }]}>
      <View style={st.learnedRank}><Text style={st.learnedRankText}>{index + 1}</Text></View>
      <View style={{ flex: 1 }}>
        <Text style={st.learnedName}>{trigger.food_name}</Text>
        <View style={st.learnedMetaRow}>
          {[
            { icon: "repeat-outline", label: `${trigger.count}× detected` },
            { icon: "time-outline", label: getWindowLabel(trigger.window_hrs) },
            { icon: "trending-down-outline", label: `−${trigger.avg_skin_drop} pts` },
          ].map(({ icon, label }) => (
            <View key={label} style={st.metaChip}>
              <Ionicons name={icon as any} size={9} color="#A8A29E" />
              <Text style={st.metaChipText}>{label}</Text>
            </View>
          ))}
        </View>
      </View>
      <View style={[st.severityTag, { backgroundColor: bg, borderColor: color + "40" }]}>
        <View style={[st.severityDot, { backgroundColor: color }]} />
        <Text style={[st.severityTagText, { color }]}>{trigger.severity.charAt(0).toUpperCase() + trigger.severity.slice(1)}</Text>
      </View>
    </View>
  );
}

export default function ForecastScreen() {
  const insets = useSafeAreaInsets();
  const today = new Date();
  const [recentDays,      setRecentDays]      = useState<any[]>([]);
  const [loadingRecent,   setLoadingRecent]   = useState(false);
  const [currentMonth,    setCurrentMonth]    = useState(new Date());
  const [monthData,       setMonthData]       = useState<any[]>([]);
  const [loadingMonth,    setLoadingMonth]    = useState(false);
  const [selectedDay,     setSelectedDay]     = useState<string | null>(null);
  const [dayReport,       setDayReport]       = useState<any>(null);
  const [loadingReport,   setLoadingReport]   = useState(false);
  const [learnedTriggers, setLearnedTriggers] = useState<any[]>([]);
  const [loadingTriggers, setLoadingTriggers] = useState(false);

  useEffect(() => {
    fetchRecentDays().then(() => { const iso = todayISO(); setSelectedDay(iso); fetchDayReport(iso); });
    fetchLearnedTriggers();
  }, []);
  useEffect(() => { fetchMonth(); }, [currentMonth]);

  async function fetchRecentDays() {
    setLoadingRecent(true);
    try {
      const end = today.toISOString();
      const start = new Date(today.getTime() - 6 * 86400000).toISOString();
      const data = await apiFetch("/api/forecast/daily-data", { start_date: start, end_date: end });
      setRecentDays([...(data.daily_data || [])].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    } catch (e) { setRecentDays([]); }
    finally { setLoadingRecent(false); }
  }
  async function fetchMonth() {
    setLoadingMonth(true);
    try {
      const y = currentMonth.getFullYear(); const m = currentMonth.getMonth();
      const data = await apiFetch("/api/forecast/daily-data", { start_date: new Date(y, m, 1).toISOString(), end_date: new Date(y, m + 1, 0, 23, 59, 59, 999).toISOString() });
      setMonthData(data.daily_data || []);
    } catch (e) { setMonthData([]); }
    finally { setLoadingMonth(false); }
  }
  async function fetchDayReport(date: string) {
    setSelectedDay(date); setLoadingReport(true);
    try { const data = await apiFetch("/api/forecast/day-report", { date }); setDayReport(data?.report || null); }
    catch (e) { setDayReport(null); }
    finally { setLoadingReport(false); }
  }
  async function fetchLearnedTriggers() {
    setLoadingTriggers(true);
    try { const data = await apiGet("/api/triggers/learned"); setLearnedTriggers(data.triggers ?? []); }
    catch (e) { setLearnedTriggers([]); }
    finally { setLoadingTriggers(false); }
  }

  const getMonthData = (date: Date) => { const s = localISO(date); return monthData.find((d) => d.date?.startsWith(s)); };
  const days = useMemo(() => {
    const y = currentMonth.getFullYear(); const m = currentMonth.getMonth();
    const result: (Date | null)[] = [];
    const firstDay = new Date(y, m, 1).getDay(); const totalDays = new Date(y, m + 1, 0).getDate();
    for (let i = 0; i < firstDay; i++) result.push(null);
    for (let d = 1; d <= totalDays; d++) result.push(new Date(y, m, d));
    return result;
  }, [currentMonth]);
  const weeks = useMemo(() => { const r: (Date | null)[][] = []; for (let i = 0; i < days.length; i += 7) r.push(days.slice(i, i+7)); return r; }, [days]);
  const formatShort = (iso: string) => new Date(iso + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const formatFull = (iso: string) => new Date(iso + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  const isToday = (iso: string) => iso === todayISO();

  return (
    <View style={{ flex: 1, backgroundColor: "#FEFCF9" }}>
      <ScrollView
        contentContainerStyle={[st.container, { paddingTop: insets.top + (Platform.OS === "web" ? 28 : 20), paddingBottom: 110 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.delay(0).springify()} style={st.pageHeader}>
          <Text style={st.pageTitle}>Skin Forecast</Text>
          <Text style={st.pageSubtitle}>Tap any day to see your report</Text>
        </Animated.View>

        {/* Recent 7 days */}
        <Animated.View entering={FadeInDown.delay(50).springify()}>
          <View style={st.card}>
            <View style={st.sectionHeader}>
              <LinearGradient colors={["#C4956A", "#E8A598"]} style={st.aiDot} />
              <Text style={st.sectionTitle}>Recent 7 Days</Text>
            </View>
            {loadingRecent ? <ActivityIndicator color="#C4956A" /> : recentDays.length === 0 ? (
              <Text style={st.emptyText}>No recent skin data found.</Text>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 4 }}>
                {recentDays.map((d, i) => {
                  const hasData = d?.risk_score !== null && d?.risk_score !== undefined;
                  const score = hasData ? normalizeScore(d.risk_score) : 0;
                  const color = hasData ? riskColor(score) : "#C7BDB5";
                  const iso = (d?.date || "").split("T")[0];
                  const isSel = selectedDay === iso;
                  const todayChip = isToday(iso);
                  return (
                    <Pressable
                      key={`${iso}-${i}`}
                      onPress={() => iso && fetchDayReport(iso)}
                      style={[
                        st.dayChip,
                        isSel && { borderColor: color, borderWidth: 2, backgroundColor: color + "10" },
                        todayChip && !isSel && { backgroundColor: "rgba(196,149,106,0.08)" },
                      ]}
                    >
                      <Text style={[st.dayChipDate, todayChip && { color: "#C4956A", fontWeight: "700" }]}>
                        {todayChip ? "Today" : formatShort(iso)}
                      </Text>
                      <Text style={st.dayChipDay}>{new Date(iso + "T12:00:00").toLocaleDateString("en-US", { weekday: "short" })}</Text>
                      <View style={[st.dayChipScore, { backgroundColor: hasData ? color + "15" : "#FDF8F3" }]}>
                        {hasData ? <Text style={[st.dayChipNum, { color }]}>{score}</Text> : <Ionicons name="ellipsis-horizontal" size={12} color="#C7BDB5" />}
                      </View>
                      <Text style={[st.dayChipRisk, { color: hasData ? color : "#C7BDB5" }]}>{hasData ? riskLabel(score) : "—"}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}
          </View>
        </Animated.View>

        {/* Day report */}
        {selectedDay && (
          <Animated.View entering={FadeInDown.springify()}>
            <View style={st.card}>
              <View style={st.sectionHeader}>
                <Text style={st.sectionTitle}>{isToday(selectedDay) ? "Today's Report" : formatFull(selectedDay)}</Text>
                {isToday(selectedDay) && (
                  <View style={st.todayBadge}>
                    <View style={st.todayBadgeDot} />
                    <Text style={st.todayBadgeText}>TODAY</Text>
                  </View>
                )}
              </View>
              {loadingReport ? <ActivityIndicator color="#C4956A" style={{ marginTop: 12 }} /> : dayReport ? (
                <>
                  {[
                    { icon: "medical-outline", label: "Skin Condition", value: dayReport.condition && dayReport.condition !== "No scan" ? dayReport.condition : "No scan yet", color: "#C4956A" },
                  ].map(({ icon, label, value, color }) => (
                    <View key={label} style={st.reportRow}>
                      <View style={[st.reportIcon, { backgroundColor: color + "15" }]}>
                        <Ionicons name={icon as any} size={13} color={color} />
                      </View>
                      <Text style={st.reportLabel}>{label}</Text>
                      <Text style={st.reportValue}>{value}</Text>
                    </View>
                  ))}
                  {dayReport.triggers && !(dayReport.triggers.length === 1 && dayReport.triggers[0] === "No triggers detected") && (
                    <View style={st.reportRow}>
                      <View style={[st.reportIcon, { backgroundColor: "rgba(196,149,106,0.12)" }]}>
                        <Ionicons name="warning-outline" size={13} color="#C4956A" />
                      </View>
                      <Text style={st.reportLabel}>Triggers</Text>
                      <Text style={[st.reportValue, { color: "#C4956A" }]}>{dayReport.triggers.join(", ")}</Text>
                    </View>
                  )}
                  {(() => {
                    const rawScore = dayReport.risk_score;
                    const hasR = rawScore !== null && rawScore !== undefined;
                    const s = hasR ? normalizeScore(rawScore) : 0;
                    return (
                      <View style={{ marginBottom: 4 }}>
                        <View style={st.reportRow}>
                          <View style={[st.reportIcon, { backgroundColor: "rgba(196,149,106,0.12)" }]}>
                            <Ionicons name="stats-chart-outline" size={13} color="#C4956A" />
                          </View>
                          <Text style={st.reportLabel}>Risk Score</Text>
                          {hasR ? <Text style={[st.reportValue, { color: riskColor(s) }]}>{s}% · {riskLabel(s)}</Text>
                            : <Text style={[st.reportValue, { color: "#C7BDB5" }]}>Log a scan to calculate</Text>}
                        </View>
                        {hasR && <RiskBar score={s} color={riskColor(s)} />}
                      </View>
                    );
                  })()}
                  <View style={st.divider} />
                  {dayReport.llm_explanation ? (
                    <View style={st.llmBox}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
                        <LinearGradient colors={["#C4956A", "#E8A598"]} style={{ width: 7, height: 7, borderRadius: 4 }} />
                        <Text style={st.llmTitle}>AI Analysis</Text>
                      </View>
                      <Text style={st.llmText}>{dayReport.llm_explanation}</Text>
                    </View>
                  ) : null}
                  {Array.isArray(dayReport.shap_triggers) && dayReport.shap_triggers.some((t: any) => (t.impact || 0) > 0) ? (
                    <View style={st.shapBox}>
                      <Text style={st.shapTitle}>Top Flare Factors</Text>
                      {dayReport.shap_triggers.filter((t: any) => (t.impact || 0) > 0).map((t: any, i: number) => (
                        <View key={i} style={st.shapRow}>
                          <Text style={st.shapIndex}>{i + 1}</Text>
                          <Text style={st.shapLabel}>{t.label}</Text>
                          <View style={st.shapBarBg}><View style={[st.shapBarFill, { width: `${Math.min((t.impact || 0) * 250, 100)}%` }]} /></View>
                          <Text style={st.shapValue}>{t.impact.toFixed(3)}</Text>
                        </View>
                      ))}
                    </View>
                  ) : null}
                </>
              ) : (
                <View style={{ alignItems: "center", paddingVertical: 24, gap: 8 }}>
                  <View style={st.noDataIcon}><Ionicons name="camera-outline" size={24} color="#C7BDB5" /></View>
                  <Text style={st.noDataTitle}>No data logged</Text>
                  <Text style={st.noDataSub}>Upload a face scan and log your meals to see your personalized forecast.</Text>
                </View>
              )}
            </View>
          </Animated.View>
        )}

        {/* Learned Triggers */}
        <Animated.View entering={FadeInDown.delay(120).springify()}>
          <View style={st.card}>
            <View style={st.sectionHeader}>
              <View style={st.triggersIcon}><Ionicons name="analytics-outline" size={14} color="#C4956A" /></View>
              <View style={{ flex: 1 }}>
                <Text style={st.sectionTitle}>Your Personal Triggers</Text>
                <Text style={st.sectionSubtitle}>Learned from your own data · no assumptions</Text>
              </View>
            </View>
            {loadingTriggers ? <ActivityIndicator color="#C4956A" size="small" /> :
              learnedTriggers.length === 0 ? (
                <View style={{ alignItems: "center", paddingVertical: 16 }}>
                  <View style={st.noDataIcon}><Ionicons name="time-outline" size={24} color="#C7BDB5" /></View>
                  <Text style={[st.noDataTitle, { marginTop: 10 }]}>No triggers identified yet</Text>
                  <Text style={st.noDataSub}>
                    Skinova correlates your food logs with skin changes over time.{"\n"}
                    Once a food causes skin worsening, it will appear here.
                  </Text>
                </View>
              ) : (
                <>
                  <View style={{ flexDirection: "row", gap: 8, marginBottom: 14 }}>
                    {(["high","medium","low"] as const).map((sev) => {
                      const count = learnedTriggers.filter((t) => t.severity === sev).length;
                      if (!count) return null;
                      return (
                        <View key={sev} style={[st.summaryPill, { backgroundColor: getSeverityBg(sev), borderColor: getSeverityColor(sev) + "35" }]}>
                          <Text style={[st.summaryNum, { color: getSeverityColor(sev) }]}>{count}</Text>
                          <Text style={[st.summaryLabel, { color: getSeverityColor(sev) }]}>{sev.charAt(0).toUpperCase() + sev.slice(1)}</Text>
                        </View>
                      );
                    })}
                  </View>
                  {learnedTriggers.map((t, i) => <LearnedTriggerRow key={t.food_name} trigger={t} index={i} isLast={i === learnedTriggers.length - 1} />)}
                  <Text style={st.footnote}>Updates automatically as you log more data</Text>
                </>
              )}
          </View>
        </Animated.View>

        {/* Calendar */}
        <Animated.View entering={FadeInDown.delay(160).springify()}>
          <View style={[st.card, { paddingHorizontal: 14, paddingVertical: 14 }]}>
            <View style={st.monthNav}>
              <Pressable onPress={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))} style={st.monthNavBtn}>
                <Ionicons name="chevron-back" size={14} color="#C4956A" />
              </Pressable>
              <Text style={st.monthText}>{currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</Text>
              <Pressable onPress={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))} style={st.monthNavBtn}>
                <Ionicons name="chevron-forward" size={14} color="#C4956A" />
              </Pressable>
            </View>
            <View style={{ flexDirection: "row", marginBottom: 4 }}>
              {["S","M","T","W","T","F","S"].map((d, i) => (
                <Text key={i} style={st.weekDay}>{d}</Text>
              ))}
            </View>
            {loadingMonth ? <ActivityIndicator color="#C4956A" size="small" style={{ marginVertical: 14 }} /> : (
              <View>
                {weeks.map((week, wi) => (
                  <View key={wi} style={{ flexDirection: "row", marginBottom: 2 }}>
                    {week.map((date, di) => {
                      if (!date) return <View key={`e-${wi}-${di}`} style={st.calCell} />;
                      const data = getMonthData(date);
                      const score = data?.risk_score !== undefined ? normalizeScore(data.risk_score) : null;
                      const hasScore = score !== null && score > 0;
                      const dotColor = hasScore ? riskColor(score!) : null;
                      const iso = localISO(date);
                      const isSel = selectedDay === iso;
                      const isT = isToday(iso);
                      return (
                        <Pressable
                          key={iso} onPress={() => fetchDayReport(iso)}
                          style={[st.calCell, isT && { backgroundColor: "rgba(196,149,106,0.12)", borderRadius: 10 }, isSel && { borderWidth: 1.5, borderColor: "#C4956A", borderRadius: 10 }]}
                        >
                          <Text style={[st.calNum, isT && { fontWeight: "800", color: "#C4956A" }, isSel && !isT && { color: "#1C1917" }]}>{date.getDate()}</Text>
                          {dotColor && <View style={[st.calDot, { backgroundColor: dotColor }]} />}
                        </Pressable>
                      );
                    })}
                  </View>
                ))}
              </View>
            )}
          </View>
        </Animated.View>

        {/* What Affects Skin */}
        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <View style={st.card}>
            <View style={st.sectionHeader}>
              <View style={[st.triggersIcon, { backgroundColor: "rgba(196,149,106,0.12)" }]}>
                <Ionicons name="bulb-outline" size={13} color="#C4956A" />
              </View>
              <Text style={st.sectionTitle}>What Affects Your Skin</Text>
            </View>
            {[
              { icon: "restaurant-outline", label: "Food Triggers",  desc: "Food logs build a picture of what spikes inflammation over time.", color: "#D4856A" },
              { icon: "flower-outline",      label: "Hormonal Phase", desc: "Cycle phases shift oil production and skin sensitivity.",          color: "#E8A598" },
              { icon: "flask-outline",       label: "Product Safety", desc: "Comedogenic ingredients accumulate — tracked automatically.",       color: "#A89ACB" },
              { icon: "scan-outline",        label: "Skin Baseline",  desc: "Daily scans let the model track trends, not just snapshots.",       color: "#8BAF9C" },
            ].map(({ icon, label, desc, color }, i, arr) => (
              <View key={label} style={[st.factorRow, i === arr.length - 1 && { marginBottom: 0 }]}>
                <View style={[st.factorIcon, { backgroundColor: color + "18" }]}>
                  <Ionicons name={icon as any} size={16} color={color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={st.factorLabel}>{label}</Text>
                  <Text style={st.factorDesc}>{desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  container: { paddingHorizontal: 18 },
  pageHeader: { marginBottom: 22 },
  pageTitle: { fontSize: 28, fontWeight: "800", color: "#1C1917", letterSpacing: -0.5, marginBottom: 3 },
  pageSubtitle: { fontSize: 13, color: "#A8A29E" },

  card: { backgroundColor: "#FFFFFF", borderRadius: 20, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: "#F0EBE3", ...SHADOW },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: "#1C1917" },
  sectionSubtitle: { fontSize: 10, color: "#A8A29E", marginTop: 1 },
  aiDot: { width: 8, height: 8, borderRadius: 4 },
  emptyText: { fontSize: 13, color: "#A8A29E", textAlign: "center", paddingVertical: 8 },

  todayBadge: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(196,149,106,0.12)", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1, borderColor: "rgba(196,149,106,0.30)" },
  todayBadgeDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: "#C4956A" },
  todayBadgeText: { fontSize: 9, fontWeight: "700", color: "#C4956A", letterSpacing: 0.8 },

  dayChip: { alignItems: "center", paddingVertical: 10, paddingHorizontal: 10, borderRadius: 14, backgroundColor: "#FDF8F3", borderWidth: 1, borderColor: "#F0EBE3", minWidth: 72 },
  dayChipDate: { fontSize: 10, fontWeight: "600", color: "#78716C", marginBottom: 2 },
  dayChipDay: { fontSize: 9, color: "#A8A29E", marginBottom: 8 },
  dayChipScore: { width: 36, height: 36, borderRadius: 18, justifyContent: "center", alignItems: "center", marginBottom: 5 },
  dayChipNum: { fontSize: 15, fontWeight: "800" },
  dayChipRisk: { fontSize: 9, fontWeight: "600" },

  reportRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  reportIcon: { width: 28, height: 28, borderRadius: 8, justifyContent: "center", alignItems: "center", flexShrink: 0 },
  reportLabel: { flex: 1, fontSize: 13, color: "#78716C" },
  reportValue: { fontSize: 13, fontWeight: "600", color: "#1C1917", flexShrink: 1, textAlign: "right", maxWidth: "55%" },
  divider: { height: 1, backgroundColor: "#F0EBE3", marginVertical: 12 },
  barBg: { height: 4, borderRadius: 2, backgroundColor: "#F0EBE3", overflow: "hidden", marginTop: 2, marginLeft: 38 },
  barFill: { height: "100%", borderRadius: 2 },

  llmBox: { backgroundColor: "rgba(196,149,106,0.06)", borderRadius: 12, padding: 14, marginBottom: 4 },
  llmTitle: { fontSize: 11, fontWeight: "700", color: "#C4956A" },
  llmText: { fontSize: 13, color: "#78716C", lineHeight: 21 },

  shapBox: { marginTop: 12, backgroundColor: "#FDF8F3", borderRadius: 12, padding: 12, borderWidth: 1, borderColor: "#F0EBE3" },
  shapTitle: { fontSize: 10, fontWeight: "700", color: "#A8A29E", textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 10 },
  shapRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  shapIndex: { fontSize: 10, color: "#A8A29E", width: 12 },
  shapLabel: { flex: 1, fontSize: 12, fontWeight: "500", color: "#1C1917" },
  shapBarBg: { width: 56, height: 3, borderRadius: 2, backgroundColor: "#F0EBE3", overflow: "hidden" },
  shapBarFill: { height: "100%", backgroundColor: "#C4956A", borderRadius: 2 },
  shapValue: { fontSize: 10, color: "#C4956A", width: 34, textAlign: "right" },

  noDataIcon: { width: 52, height: 52, borderRadius: 26, backgroundColor: "#FDF8F3", justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "#F0EBE3" },
  noDataTitle: { fontSize: 14, fontWeight: "600", color: "#78716C" },
  noDataSub: { fontSize: 12, color: "#A8A29E", textAlign: "center", lineHeight: 18, paddingHorizontal: 16, marginTop: 4 },

  triggersIcon: { width: 30, height: 30, borderRadius: 9, backgroundColor: "rgba(196,149,106,0.12)", justifyContent: "center", alignItems: "center" },
  summaryPill: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  summaryNum: { fontSize: 14, fontWeight: "800" },
  summaryLabel: { fontSize: 10, fontWeight: "500" },

  learnedRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#F0EBE3", marginBottom: 2 },
  learnedRank: { width: 22, height: 22, borderRadius: 11, backgroundColor: "#FDF8F3", borderWidth: 1, borderColor: "#F0EBE3", justifyContent: "center", alignItems: "center" },
  learnedRankText: { fontSize: 10, fontWeight: "700", color: "#A8A29E" },
  learnedName: { fontSize: 13, fontWeight: "600", color: "#1C1917", textTransform: "capitalize", marginBottom: 4 },
  learnedMetaRow: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  metaChip: { flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: "#FDF8F3", paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6 },
  metaChipText: { fontSize: 9, color: "#A8A29E" },
  severityTag: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  severityDot: { width: 5, height: 5, borderRadius: 3 },
  severityTagText: { fontSize: 10, fontWeight: "600" },
  footnote: { fontSize: 10, color: "#C7BDB5", textAlign: "center", marginTop: 10 },

  monthNav: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  monthNavBtn: { width: 28, height: 28, borderRadius: 8, backgroundColor: "#FDF8F3", borderWidth: 1, borderColor: "#F0EBE3", justifyContent: "center", alignItems: "center" },
  monthText: { fontSize: 13, fontWeight: "700", color: "#1C1917" },
  weekDay: { flex: 1, textAlign: "center", fontSize: 9, fontWeight: "700", color: "#C7BDB5", paddingVertical: 4, letterSpacing: 0.5 },
  calCell: { flex: 1, height: 32, margin: 1.5, alignItems: "center", justifyContent: "center" },
  calNum: { fontSize: 11, color: "#78716C" },
  calDot: { width: 3, height: 3, borderRadius: 2, marginTop: 1 },

  factorRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 14 },
  factorIcon: { width: 36, height: 36, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  factorLabel: { fontSize: 13, fontWeight: "600", color: "#1C1917", marginBottom: 3 },
  factorDesc: { fontSize: 11, color: "#78716C", lineHeight: 17 },
});