// app/(tabs)/index.tsx  (Dashboard)
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator, Platform, Pressable, RefreshControl,
  ScrollView, StyleSheet, Text, View,
} from "react-native";
import Animated, { FadeInDown, FadeInRight } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GlassCard } from "@/components/GlassCard";
import { SkinScoreChart } from "@/components/SkinScoreChart";
import { useAuth } from "@/context/AuthContext";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8000";
const CYCLE_PHASES = ["Menstrual", "Follicular", "Ovulation", "Luteal"];

async function apiFetch(path: string) {
  const token = await AsyncStorage.getItem("skinova_token");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const res = await fetch(`${BASE_URL}${normalizedPath}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

function riskColor(score: number) {
  if (score >= 70) return "#D4856A";
  if (score >= 40) return "#C4956A";
  return "#8BAF9C";
}
function scoreColor(score: number) {
  if (score >= 75) return "#8BAF9C";
  if (score >= 50) return "#C4956A";
  return "#D4856A";
}
function getSeverityBg(s: string) {
  if (s === "high")   return "rgba(212,133,106,0.10)";
  if (s === "medium") return "rgba(196,149,106,0.10)";
  return "rgba(139,175,156,0.10)";
}
function getSeverityColor(s: string) {
  if (s === "high")   return "#D4856A";
  if (s === "medium") return "#C4956A";
  return "#8BAF9C";
}
function getSourceIcon(source?: string): string {
  if (source === "product") return "flask-outline";
  if (source === "skin")    return "scan-outline";
  return "restaurant-outline";
}
function deduplicateTriggers(events: any[]): any[] {
  const seen = new Set<string>();
  return events.filter((e) => {
    const dayKey = (e.time || "").split("·")[0].trim();
    const key = `${e.cause}__${e.severity}__${dayKey}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function RiskScoreWidget({ score, loading }: { score: number | null; loading: boolean }) {
  if (loading) return <ActivityIndicator size="small" color="#C4956A" />;
  if (score === null || score === undefined) {
    return (
      <View>
        <Text style={[st.riskNum, { color: "#C7BDB5" }]}>–</Text>
        <Text style={st.riskSub}>No data</Text>
      </View>
    );
  }
  const color = riskColor(score);
  return (
    <View style={{ alignItems: "flex-end" }}>
      <Text style={[st.riskNum, { color }]}>{score}</Text>
      <Text style={st.riskSub}>/ 100</Text>
      <View style={st.riskBarBg}>
        <View style={[st.riskBarFill, { width: `${score}%` as any, backgroundColor: color }]} />
      </View>
    </View>
  );
}

function TriggerItem({ item, index, isLast }: { item: any; index: number; isLast: boolean }) {
  const color  = getSeverityColor(item.severity);
  const bg     = getSeverityBg(item.severity);
  const srcIcon = getSourceIcon(item.source);

  return (
    <Animated.View entering={FadeInRight.delay(index * 70).springify()} style={[st.triggerItem, isLast && { marginBottom: 0 }]}>
      <View style={st.triggerTimeline}>
        <View style={[st.triggerDot, { backgroundColor: color }]} />
        {!isLast && <View style={st.triggerConnector} />}
      </View>
      <View style={[st.triggerCard, { borderLeftColor: color + "80" }]}>
        <View style={st.triggerCardTop}>
          <View style={[st.triggerIconWrap, { backgroundColor: bg }]}>
            <Ionicons name={srcIcon as any} size={12} color={color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={st.triggerCause} numberOfLines={2}>{item.cause}</Text>
            <Text style={st.triggerTime}>{item.time}</Text>
          </View>
          <View style={[st.severityPill, { backgroundColor: bg, borderColor: color + "50" }]}>
            <View style={[st.severityDot, { backgroundColor: color }]} />
            <Text style={[st.severityText, { color }]}>
              {item.severity.charAt(0).toUpperCase() + item.severity.slice(1)}
            </Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [data,       setData]       = useState<any>(null);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboard = useCallback(async () => {
    try { const res = await apiFetch("/api/dashboard"); setData(res); }
    catch (e) { console.error("[Dashboard] fetch failed:", e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadDashboard(); }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await loadDashboard();
    setRefreshing(false);
  }, [loadDashboard]);

  const skinScores: any[]    = data?.skin_scores ?? [];
  const forecastText: string = data?.forecast ?? "";
  const rawTriggers: any[]   = data?.trigger_events ?? [];
  const triggerEvents        = deduplicateTriggers(rawTriggers);
  const cyclePhase: string   = data?.cycle_phase ?? "";
  const cycleDay: number     = data?.cycle_day ?? 0;
  const cycleStats: any      = data?.cycle_stats ?? {};
  const riskScore: number | null = (data?.risk_score !== undefined && data?.risk_score !== null)
    ? Number(data.risk_score) : null;
  const lastScore = skinScores.length > 0 ? skinScores[skinScores.length - 1].score : null;
  const cyclePhaseIndex = cyclePhase ? CYCLE_PHASES.indexOf(cyclePhase) : -1;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <View style={{ flex: 1, backgroundColor: "#FEFCF9" }}>
      <ScrollView
        contentContainerStyle={[st.container, { paddingTop: insets.top + (Platform.OS === "web" ? 28 : 20), paddingBottom: 110 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#C4956A" />}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <Animated.View entering={FadeInDown.delay(0).springify()} style={st.header}>
          <View>
            <Text style={st.greeting}>{greeting},</Text>
            <Text style={st.userName}>{user?.email?.split("@")[0] ?? "User"}</Text>
          </View>
          <LinearGradient colors={["#C4956A", "#E8A598"]} style={st.avatarCircle}>
            <Text style={st.avatarInitial}>{(user?.email?.[0] ?? "U").toUpperCase()}</Text>
          </LinearGradient>
        </Animated.View>

        {/* ── Skin Score Card ── */}
        <Animated.View entering={FadeInDown.delay(60).springify()}>
          <View style={st.card}>
            <View style={st.scoreHeader}>
              <View>
                <Text style={st.cardLabel}>SKIN SCORE · 7 DAYS</Text>
                {loading ? (
                  <ActivityIndicator color="#C4956A" style={{ marginTop: 10 }} />
                ) : lastScore !== null ? (
                  <View style={{ flexDirection: "row", alignItems: "baseline", gap: 4 }}>
                    <Text style={[st.bigScore, { color: scoreColor(lastScore) }]}>{lastScore}</Text>
                    <Text style={st.scoreMax}>/100</Text>
                  </View>
                ) : (
                  <Text style={st.noDataText}>No scans yet</Text>
                )}
              </View>
              {lastScore !== null && (
                <View style={[st.trendBadge, { backgroundColor: scoreColor(lastScore) + "18", borderColor: scoreColor(lastScore) + "40" }]}>
                  <Ionicons name={lastScore >= 75 ? "trending-up" : "trending-down"} size={16} color={scoreColor(lastScore)} />
                  <Text style={[st.trendText, { color: scoreColor(lastScore) }]}>
                    {lastScore >= 75 ? "Good" : lastScore >= 50 ? "Fair" : "Poor"}
                  </Text>
                </View>
              )}
            </View>

            {skinScores.length > 0 && <SkinScoreChart data={skinScores} />}

            <View style={st.riskDivider} />
            <View style={st.riskRow}>
              <View style={st.riskLabelGroup}>
                <View style={st.riskIcon}>
                  <Ionicons name="pulse-outline" size={13} color="#C4956A" />
                </View>
                <View>
                  <Text style={st.riskLabelMain}>Today's Flare Risk</Text>
                  <Text style={st.riskLabelSub}>AI-computed from your data</Text>
                </View>
              </View>
              <RiskScoreWidget score={riskScore} loading={loading} />
            </View>
          </View>
        </Animated.View>

        {/* ── Cycle Phase ── */}
        {user?.gender === "female" && (
          <Animated.View entering={FadeInDown.delay(120).springify()}>
            <Pressable onPress={() => router.push("/cycle")}>
              <View style={st.card}>
                <View style={st.sectionHeader}>
                  <View style={[st.sectionIcon, { backgroundColor: "rgba(232,165,152,0.15)" }]}>
                    <Ionicons name="flower-outline" size={14} color="#E8A598" />
                  </View>
                  <Text style={st.sectionTitle}>Cycle Phase</Text>
                  {cycleDay > 0 && (
                    <View style={st.cycleDayPill}>
                      <Text style={st.cycleDayText}>Day {cycleDay}</Text>
                    </View>
                  )}
                  {cycleStats.average_cycle_length && (
                    <View style={[st.cycleDayPill, { backgroundColor: cycleStats.is_irregular ? "#D4856A" : "#8BAF9C" }]}>
                      <Text style={st.cycleDayText}>
                        {cycleStats.average_cycle_length}d {cycleStats.is_irregular ? "Irregular" : ""}
                      </Text>
                    </View>
                  )}
                  <Ionicons name="chevron-forward" size={14} color="#C7BDB5" />
                </View>
                {loading ? <ActivityIndicator color="#C4956A" size="small" style={{ marginTop: 4 }} /> : (
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    {CYCLE_PHASES.map((phase, i) => (
                      <View key={phase} style={{ alignItems: "center", gap: 6, flex: 1 }}>
                        <View style={[
                          st.cycleDot,
                          i === cyclePhaseIndex && st.cycleDotActive,
                          i < cyclePhaseIndex && st.cycleDotPast,
                        ]} />
                        <Text style={[st.cyclePhaseLabel, i === cyclePhaseIndex && st.cyclePhaseLabelActive]}>
                          {phase}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
                {!loading && !cyclePhase && <Text style={st.noDataText}>Set up your cycle in the Cycle tab</Text>}
              </View>
            </Pressable>
          </Animated.View>
        )}

        {/* ── AI Forecast ── */}
        <Animated.View entering={FadeInDown.delay(160).springify()}>
          <View style={st.card}>
            <View style={st.sectionHeader}>
              <LinearGradient colors={["#C4956A", "#E8A598"]} style={st.aiBadge}>
                <Text style={st.aiBadgeText}>AI</Text>
              </LinearGradient>
              <Text style={st.sectionTitle}>Skin Forecast</Text>
              <Pressable onPress={() => router.push("/forecast")} style={st.showMoreBtn}>
                <Text style={st.showMoreText}>Full report</Text>
                <Ionicons name="arrow-forward" size={11} color="#C4956A" />
              </Pressable>
            </View>
            {loading ? <ActivityIndicator color="#C4956A" size="small" /> :
              forecastText ? <Text style={st.forecastText} numberOfLines={4}>{forecastText}</Text> : (
                <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }}>
                  <Ionicons name="cloud-outline" size={16} color="#C7BDB5" />
                  <Text style={st.noDataText}>Log a face scan and meals to unlock your AI forecast.</Text>
                </View>
              )}
          </View>
        </Animated.View>

        {/* ── Trigger Timeline ── */}
        <Animated.View entering={FadeInDown.delay(210).springify()}>
          <View style={st.card}>
            <View style={st.sectionHeader}>
              <View style={[st.sectionIcon, { backgroundColor: "rgba(196,149,106,0.12)" }]}>
                <Ionicons name="git-branch-outline" size={14} color="#C4956A" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={st.sectionTitle}>Trigger Timeline</Text>
                <Text style={st.sectionSubtitle}>This week · learned from your data</Text>
              </View>
            </View>

            {loading ? <ActivityIndicator color="#C4956A" size="small" style={{ marginTop: 8 }} /> :
              triggerEvents.length > 0 ? (
                <View>
                  {triggerEvents.map((event, i) => (
                    <TriggerItem key={event.id ?? i} item={event} index={i} isLast={i === triggerEvents.length - 1} />
                  ))}
                </View>
              ) : (
                <View style={{ alignItems: "center", paddingVertical: 28, gap: 10 }}>
                  <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: "rgba(139,175,156,0.12)", justifyContent: "center", alignItems: "center" }}>
                    <Ionicons name="checkmark-circle-outline" size={28} color="#8BAF9C" />
                  </View>
                  <Text style={{ fontSize: 14, fontWeight: "600", color: "#78716C" }}>No triggers this week</Text>
                  <Text style={{ fontSize: 12, color: "#A8A29E", textAlign: "center", lineHeight: 18 }}>
                    Keep logging meals and daily scans.{"\n"}Patterns will surface automatically.
                  </Text>
                </View>
              )}

            {triggerEvents.length > 0 && (
              <View style={{ flexDirection: "row", gap: 16, marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#F0EBE3" }}>
                {(["high","medium","low"] as const).map((s) => (
                  <View key={s} style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: getSeverityColor(s) }} />
                    <Text style={{ fontSize: 10, color: "#A8A29E" }}>{s.charAt(0).toUpperCase() + s.slice(1)}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const SHADOW = Platform.OS === "web"
  ? ({ boxShadow: "0 2px 20px rgba(196,149,106,0.08)" } as any)
  : { shadowColor: "#C4956A", shadowOpacity: 0.08, shadowRadius: 16, shadowOffset: { width: 0, height: 4 }, elevation: 4 };

const st = StyleSheet.create({
  container: { paddingHorizontal: 20 },

  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  greeting: { fontSize: 13, color: "#A8A29E", fontWeight: "400", letterSpacing: 0.2, marginBottom: 2 },
  userName: { fontSize: 26, fontWeight: "800", color: "#1C1917", letterSpacing: -0.5, textTransform: "capitalize" },
  avatarCircle: { width: 46, height: 46, borderRadius: 16, justifyContent: "center", alignItems: "center" },
  avatarInitial: { fontSize: 18, fontWeight: "700", color: "#fff" },

  card: {
    backgroundColor: "#FFFFFF", borderRadius: 20, padding: 18, overflow: "hidden",
    marginBottom: 14, borderWidth: 1, borderColor: "#F0EBE3", ...SHADOW,
  },
  scoreHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 },
  cardLabel: { fontSize: 10, fontWeight: "700", color: "#C7BDB5", letterSpacing: 1.5, marginBottom: 6 },
  bigScore: { fontSize: 48, fontWeight: "800", lineHeight: 52 },
  scoreMax: { fontSize: 16, color: "#C7BDB5" },
  noDataText: { fontSize: 13, color: "#A8A29E", lineHeight: 20, flex: 1 },
  trendBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, borderWidth: 1 },
  trendText: { fontSize: 12, fontWeight: "600" },

  riskDivider: { height: 1, backgroundColor: "#F0EBE3", marginVertical: 14 },
  riskRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  riskLabelGroup: { flexDirection: "row", alignItems: "center", gap: 10 },
  riskIcon: { width: 30, height: 30, borderRadius: 9, backgroundColor: "rgba(196,149,106,0.12)", justifyContent: "center", alignItems: "center" },
  riskLabelMain: { fontSize: 13, fontWeight: "500", color: "#3C2A1E" },
  riskLabelSub: { fontSize: 10, color: "#A8A29E", marginTop: 1 },
  riskNum: { fontSize: 26, fontWeight: "800", lineHeight: 30 },
  riskSub: { fontSize: 10, color: "#A8A29E", textAlign: "right", marginTop: 1 },
  riskBarBg: { width: 64, height: 3, borderRadius: 2, backgroundColor: "#F0EBE3", marginTop: 5, overflow: "hidden" },
  riskBarFill: { height: "100%", borderRadius: 2 },

  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 },
  sectionIcon: { width: 30, height: 30, borderRadius: 9, justifyContent: "center", alignItems: "center" },
  sectionTitle: { fontSize: 14, fontWeight: "600", color: "#1C1917", flex: 1 },
  sectionSubtitle: { fontSize: 11, color: "#A8A29E", marginTop: 1 },

  cycleDayPill: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 20, backgroundColor: "rgba(232,165,152,0.15)", borderWidth: 1, borderColor: "rgba(232,165,152,0.30)" },
  cycleDayText: { fontSize: 10, fontWeight: "600", color: "#E8A598" },
  cycleDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: "#F0EBE3", borderWidth: 1.5, borderColor: "#C7BDB5" },
  cycleDotPast: { backgroundColor: "#C7BDB5", borderColor: "#C7BDB5" },
  cycleDotActive: { backgroundColor: "#E8A598", borderColor: "#E8A598", width: 13, height: 13, borderRadius: 7 },
  cyclePhaseLabel: { fontSize: 9, color: "#A8A29E", textAlign: "center" },
  cyclePhaseLabelActive: { color: "#E8A598", fontWeight: "600" },

  aiBadge: { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  aiBadgeText: { fontSize: 9, fontWeight: "700", color: "#fff", letterSpacing: 0.5 },
  showMoreBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, backgroundColor: "rgba(196,149,106,0.08)", borderWidth: 1, borderColor: "rgba(196,149,106,0.25)" },
  showMoreText: { fontSize: 11, fontWeight: "500", color: "#C4956A" },
  forecastText: { fontSize: 13, color: "#78716C", lineHeight: 21 },

  triggerItem: { flexDirection: "row", gap: 12, marginBottom: 10 },
  triggerTimeline: { alignItems: "center", width: 16, paddingTop: 3 },
  triggerDot: { width: 10, height: 10, borderRadius: 5 },
  triggerConnector: { flex: 1, width: 1, backgroundColor: "#F0EBE3", marginTop: 4, minHeight: 20 },
  triggerCard: { flex: 1, backgroundColor: "#FEFCF9", borderRadius: 14, borderWidth: 1, borderColor: "#F0EBE3", borderLeftWidth: 2, padding: 12, marginBottom: 2 },
  triggerCardTop: { flexDirection: "row", alignItems: "center", gap: 10 },
  triggerIconWrap: { width: 26, height: 26, borderRadius: 8, justifyContent: "center", alignItems: "center", flexShrink: 0 },
  triggerCause: { fontSize: 13, fontWeight: "500", color: "#1C1917", marginBottom: 2, lineHeight: 18 },
  triggerTime: { fontSize: 11, color: "#A8A29E" },
  severityPill: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, borderWidth: 1, flexShrink: 0 },
  severityDot: { width: 5, height: 5, borderRadius: 3 },
  severityText: { fontSize: 10, fontWeight: "600" },
});