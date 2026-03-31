// app/(tabs)/forecast.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GlassCard } from "@/components/GlassCard";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://10.237.1.60:8000";

async function apiFetch(path: string, body: object) {
  const token = await AsyncStorage.getItem("skinova_token");

  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }

  return res.json();
}

function normalizeScore(value: number) {
  if (!Number.isFinite(value)) return 0;
  return value <= 1 ? Math.round(value * 100) : Math.round(value);
}

function riskColor(score: number) {
  if (score >= 70) return "#E87070";
  if (score >= 40) return "#F0C86A";
  return "#7CC98A";
}

function riskLabel(score: number) {
  if (score >= 70) return "High";
  if (score >= 40) return "Moderate";
  return "Low";
}

function RiskBar({ score, color }: { score: number; color: string }) {
  return (
    <View style={styles.barBg}>
      <View
        style={[
          styles.barFill,
          {
            width: `${Math.max(0, Math.min(score, 100))}%` as any,
            backgroundColor: color,
          },
        ]}
      />
    </View>
  );
}

export default function ForecastScreen() {
  const insets = useSafeAreaInsets();
  const today = new Date();

  const [recentDays, setRecentDays] = useState<any[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(false);

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [monthData, setMonthData] = useState<any[]>([]);
  const [loadingMonth, setLoadingMonth] = useState(false);

  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [dayReport, setDayReport] = useState<any>(null);
  const [loadingReport, setLoadingReport] = useState(false);

  useEffect(() => {
    fetchRecentDays();
  }, []);

  useEffect(() => {
    fetchMonth();
  }, [currentMonth]);

  async function fetchRecentDays() {
    setLoadingRecent(true);
    try {
      const end = today.toISOString();
      const start = new Date(today.getTime() - 6 * 86400000).toISOString();

      const data = await apiFetch("/api/forecast/daily-data", {
        start_date: start,
        end_date: end,
      });

      const sorted = [...(data.daily_data || [])].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      setRecentDays(sorted);
    } catch (e) {
      console.error(e);
      setRecentDays([]);
    } finally {
      setLoadingRecent(false);
    }
  }

  async function fetchMonth() {
    setLoadingMonth(true);
    try {
      const y = currentMonth.getFullYear();
      const m = currentMonth.getMonth();

      const start = new Date(y, m, 1).toISOString();
      const end = new Date(y, m + 1, 0, 23, 59, 59, 999).toISOString();

      const data = await apiFetch("/api/forecast/daily-data", {
        start_date: start,
        end_date: end,
      });

      setMonthData(data.daily_data || []);
    } catch (e) {
      console.error(e);
      setMonthData([]);
    } finally {
      setLoadingMonth(false);
    }
  }

  async function fetchDayReport(date: string) {
    setSelectedDay(date);
    setLoadingReport(true);
    try {
      const data = await apiFetch("/api/forecast/day-report", { date });
      setDayReport(data?.report || null);
    } catch (e) {
      console.error(e);
      setDayReport(null);
    } finally {
      setLoadingReport(false);
    }
  }

  const getMonthData = (date: Date) => {
    const s = date.toISOString().split("T")[0];
    return monthData.find((d) => d.date?.startsWith(s));
  };

  const days = useMemo(() => {
    const y = currentMonth.getFullYear();
    const m = currentMonth.getMonth();
    const result: (Date | null)[] = [];

    const firstDay = new Date(y, m, 1).getDay();
    const totalDays = new Date(y, m + 1, 0).getDate();

    for (let i = 0; i < firstDay; i++) result.push(null);
    for (let d = 1; d <= totalDays; d++) result.push(new Date(y, m, d));

    return result;
  }, [currentMonth]);

  const weeks = useMemo(() => {
    const result: (Date | null)[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      result.push(days.slice(i, i + 7));
    }
    return result;
  }, [days]);

  const formatCardDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

  const formatSelectedDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });

  return (
    <LinearGradient colors={["#1A1825", "#1E1B2E"]} style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={[
          styles.container,
          {
            paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16),
            paddingBottom: 100,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.delay(0).springify()}>
          <Text style={styles.title}>Skin History</Text>
          <Text style={styles.subtitle}>Your most recent logged skin risk</Text>
        </Animated.View>

        {/* Recent 7 Days */}
        <Animated.View entering={FadeInDown.delay(60).springify()}>
          <GlassCard style={styles.card}>
            <View style={styles.sectionHeader}>
              <LinearGradient colors={["#9B8AD4", "#F0A896"]} style={styles.aiDot} />
              <Text style={styles.sectionTitle}>Recent 7 Days</Text>
            </View>

            {loadingRecent ? (
              <ActivityIndicator color="#9B8AD4" />
            ) : recentDays.length === 0 ? (
              <Text style={styles.emptyText}>No recent skin data found.</Text>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.recentRow}
              >
                {recentDays.map((d, i) => {
                  const score = normalizeScore(d?.risk_score ?? 0);
                  const color = riskColor(score);
                  const iso = d?.date?.split("T")[0] || d?.date;
                  const isSel = selectedDay === iso;

                  return (
                    <Pressable
                      key={`${iso}-${i}`}
                      onPress={() => iso && fetchDayReport(iso)}
                      style={[
                        styles.dayChip,
                        isSel && { borderColor: color, borderWidth: 2 },
                      ]}
                    >
                      <Text style={styles.dayChipDate}>{formatCardDate(d.date)}</Text>
                      <Text style={styles.dayChipDay}>
                        {new Date(d.date).toLocaleDateString("en-US", {
                          weekday: "short",
                        })}
                      </Text>

                      <View
                        style={[
                          styles.dayChipScore,
                          { backgroundColor: `${color}22` },
                        ]}
                      >
                        <Text style={[styles.dayChipNum, { color }]}>{score}</Text>
                      </View>

                      <Text style={[styles.dayChipRisk, { color }]}>
                        {riskLabel(score)}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}
          </GlassCard>
        </Animated.View>

        {/* Day Report */}
        {selectedDay && (
          <Animated.View entering={FadeInDown.springify()}>
            <GlassCard style={styles.card}>
              <Text style={styles.sectionTitle}>{formatSelectedDate(selectedDay)}</Text>

              {loadingReport ? (
                <ActivityIndicator color="#9B8AD4" style={{ marginTop: 12 }} />
              ) : dayReport ? (
                <>
                  <View style={styles.reportRow}>
                    <Ionicons name="medical-outline" size={16} color="#B8A9E8" />
                    <Text style={styles.reportLabel}>Skin Condition</Text>
                    <Text style={styles.reportValue}>
                      {dayReport.condition || "Not available"}
                    </Text>
                  </View>

                  <View style={styles.reportRow}>
                    <Ionicons name="warning-outline" size={16} color="#F0C86A" />
                    <Text style={styles.reportLabel}>Triggers</Text>
                    <Text style={styles.reportValue}>
                      {Array.isArray(dayReport.triggers) && dayReport.triggers.length > 0
                        ? dayReport.triggers.join(", ")
                        : "None detected"}
                    </Text>
                  </View>

                  <View style={{ marginVertical: 8 }}>
                    <View style={styles.reportRow}>
                      <Ionicons name="stats-chart-outline" size={16} color="#9B8AD4" />
                      <Text style={styles.reportLabel}>Risk Score</Text>
                      {(() => {
                        const reportScore = normalizeScore(dayReport.risk_score ?? 0);
                        return (
                          <Text
                            style={[
                              styles.reportValue,
                              { color: riskColor(reportScore) },
                            ]}
                          >
                            {reportScore}% · {riskLabel(reportScore)}
                          </Text>
                        );
                      })()}
                    </View>

                    <RiskBar
                      score={normalizeScore(dayReport.risk_score ?? 0)}
                      color={riskColor(normalizeScore(dayReport.risk_score ?? 0))}
                    />
                  </View>

                  <View style={styles.divider} />

                  {dayReport.llm_explanation ? (
                    <View style={{ marginTop: 8 }}>
                      <View style={styles.llmHeader}>
                        <LinearGradient
                          colors={["#9B8AD4", "#F0A896"]}
                          style={styles.llmDot}
                        />
                        <Text style={styles.llmTitle}>LLaMA 4 Analysis</Text>
                      </View>
                      <Text style={styles.llmText}>{dayReport.llm_explanation}</Text>
                    </View>
                  ) : null}

                  {Array.isArray(dayReport.shap_triggers) &&
                  dayReport.shap_triggers.length > 0 ? (
                    <View style={{ marginTop: 12 }}>
                      <Text style={styles.shapTitle}>TOP FLARE TRIGGERS (SHAP)</Text>

                      {dayReport.shap_triggers.map((t: any, i: number) => (
                        <View key={i} style={styles.shapRow}>
                          <Text style={styles.shapIndex}>{i + 1}.</Text>

                          <Text style={styles.shapLabel}>{t.label}</Text>

                          <View style={styles.shapBarBg}>
                            <View
                              style={[
                                styles.shapBarFill,
                                { width: `${Math.min((t.impact || 0) * 100, 100)}%` },
                              ]}
                            />
                          </View>

                          <Text style={styles.shapValue}>
                            {typeof t.impact === "number"
                              ? t.impact.toFixed(3)
                              : "0.000"}
                          </Text>
                        </View>
                      ))}
                    </View>
                  ) : null}

                  {dayReport.recommendations ? (
                    <Text style={styles.recommendation}>{dayReport.recommendations}</Text>
                  ) : null}
                </>
              ) : (
                <Text style={styles.emptyText}>No data logged for this day yet.</Text>
              )}
            </GlassCard>
          </Animated.View>
        )}

        {/* Compact Calendar */}
        <Animated.View entering={FadeInDown.delay(120).springify()}>
          <View style={styles.calendarWrapper}>
            <GlassCard style={styles.compactCalendarCard}>
              <View style={styles.monthNav}>
                <Pressable
                  onPress={() =>
                    setCurrentMonth(
                      new Date(
                        currentMonth.getFullYear(),
                        currentMonth.getMonth() - 1,
                        1
                      )
                    )
                  }
                >
                  <Ionicons name="chevron-back" size={16} color="#B8A9E8" />
                </Pressable>

                <Text style={styles.monthTextSmall}>
                  {currentMonth.toLocaleDateString("en-US", {
                    month: "short",
                    year: "numeric",
                  })}
                </Text>

                <Pressable
                  onPress={() =>
                    setCurrentMonth(
                      new Date(
                        currentMonth.getFullYear(),
                        currentMonth.getMonth() + 1,
                        1
                      )
                    )
                  }
                >
                  <Ionicons name="chevron-forward" size={16} color="#B8A9E8" />
                </Pressable>
              </View>

              <View style={styles.weekHeaderSmall}>
                {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                  <Text key={i} style={styles.weekDaySmall}>
                    {d}
                  </Text>
                ))}
              </View>

              {loadingMonth ? (
                <ActivityIndicator color="#9B8AD4" size="small" style={{ marginVertical: 10 }} />
              ) : (
                <View style={styles.calendarGrid}>
                  {weeks.map((week, wi) => (
                    <View key={wi} style={styles.weekSmall}>
                      {week.map((date, di) => {
                        if (!date) {
                          return <View key={`empty-${wi}-${di}`} style={styles.tinyCell} />;
                        }

                        const data = getMonthData(date);
                        const score =
                          data && data.risk_score !== undefined
                            ? normalizeScore(data.risk_score)
                            : null;
                        const color = score !== null ? riskColor(score) : "#3A3655";
                        const iso = date.toISOString().split("T")[0];
                        const isSel = selectedDay === iso;

                        return (
                          <Pressable
                            key={iso}
                            onPress={() => fetchDayReport(iso)}
                            style={[
                              styles.tinyCell,
                              isSel && {
                                borderColor: "#B8A9E8",
                                borderWidth: 1.2,
                              },
                            ]}
                          >
                            <Text style={styles.tinyNum}>{date.getDate()}</Text>
                            {score !== null ? (
                              <View
                                style={[styles.tinyDot, { backgroundColor: color }]}
                              />
                            ) : null}
                          </Pressable>
                        );
                      })}
                    </View>
                  ))}
                </View>
              )}
            </GlassCard>
          </View>
        </Animated.View>

        {/* What Affects Your Skin */}
        <Animated.View entering={FadeInDown.delay(180).springify()}>
          <GlassCard style={styles.card}>
            <View style={styles.sectionHeader}>
              <Ionicons name="bulb-outline" size={16} color="#F0C86A" />
              <Text style={styles.sectionTitle}>What Affects Your Skin</Text>
            </View>

            {[
              {
                icon: "restaurant-outline",
                label: "Food Triggers",
                desc: "Food patterns from your own logs can affect flare risk over time.",
                color: "#E87070",
              },
              {
                icon: "flower-outline",
                label: "Hormonal Phase",
                desc: "Hormonal changes can increase sensitivity and worsen breakouts.",
                color: "#F0A896",
              },
              {
                icon: "flask-outline",
                label: "Product Safety",
                desc: "Some product ingredients may irritate or clog your skin.",
                color: "#9B8AD4",
              },
              {
                icon: "scan-outline",
                label: "Skin Baseline",
                desc: "Daily skin logging helps track change and improve pattern detection.",
                color: "#7CC98A",
              },
            ].map(({ icon, label, desc, color }) => (
              <View key={label} style={styles.factorRow}>
                <View style={[styles.factorIcon, { backgroundColor: `${color}22` }]}>
                  <Ionicons name={icon as any} size={18} color={color} />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.factorLabel}>{label}</Text>
                  <Text style={styles.factorDesc}>{desc}</Text>
                </View>
              </View>
            ))}
          </GlassCard>
        </Animated.View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
  },

  title: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    color: "#F0EEF8",
    letterSpacing: -0.5,
    marginBottom: 4,
  },

  subtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#8B7AC9",
    marginBottom: 20,
  },

  card: {
    marginBottom: 16,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },

  sectionTitle: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "#D4C8F5",
    flex: 1,
  },

  aiDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  emptyText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#605D72",
    textAlign: "center",
    paddingVertical: 8,
  },

  recentRow: {
    paddingRight: 8,
  },

  dayChip: {
    alignItems: "center",
    marginRight: 8,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 14,
    backgroundColor: "rgba(48,45,68,0.8)",
    borderWidth: 1,
    borderColor: "#3D3A52",
    minWidth: 72,
  },

  dayChipDate: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: "#D4C8F5",
    marginBottom: 2,
  },

  dayChipDay: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    color: "#8B7AC9",
    marginBottom: 8,
  },

  dayChipScore: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },

  dayChipNum: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },

  dayChipRisk: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
  },

  reportRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },

  reportLabel: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#8B7AC9",
  },

  reportValue: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: "#D4C8F5",
    flexShrink: 1,
    textAlign: "right",
  },

  barBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "#302D44",
    overflow: "hidden",
    marginTop: 4,
  },

  barFill: {
    height: "100%",
    borderRadius: 3,
  },

  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
    marginVertical: 12,
  },

  llmHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },

  llmDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  llmTitle: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: "#9B8AD4",
  },

  llmText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#C8C5D0",
    lineHeight: 20,
  },

  shapTitle: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: "#8B7AC9",
    marginBottom: 8,
  },

  shapRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },

  shapIndex: {
    fontSize: 11,
    color: "#605D72",
    width: 14,
  },

  shapLabel: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: "#D4C8F5",
  },

  shapBarBg: {
    width: 80,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#302D44",
    overflow: "hidden",
  },

  shapBarFill: {
    height: "100%",
    backgroundColor: "#9B8AD4",
    borderRadius: 2,
  },

  shapValue: {
    fontSize: 11,
    color: "#9B8AD4",
    width: 36,
    textAlign: "right",
  },

  recommendation: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#C8C5D0",
    lineHeight: 20,
    marginTop: 10,
  },

  calendarWrapper: {
    width: "100%",
    alignItems: "center",
    marginBottom: 16,
  },

  compactCalendarCard: {
    width: "100%",
    maxWidth: 390,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },

  monthNav: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    paddingHorizontal: 4,
  },

  monthTextSmall: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: "#F0EEF8",
  },

  weekHeaderSmall: {
    flexDirection: "row",
    marginBottom: 4,
  },

  weekDaySmall: {
    flex: 1,
    textAlign: "center",
    fontSize: 9,
    fontFamily: "Inter_600SemiBold",
    color: "#8B7AC9",
  },

  calendarGrid: {
    width: "100%",
  },

  weekSmall: {
    flexDirection: "row",
    marginBottom: 4,
  },

  tinyCell: {
    flex: 1,
    height: 32,
    margin: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#3A3655",
    backgroundColor: "#2A273F",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  tinyNum: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
    color: "#D4C8F5",
  },

  tinyDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    position: "absolute",
    bottom: 4,
    right: 4,
  },

  factorRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 14,
  },

  factorIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },

  factorLabel: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: "#D4C8F5",
    marginBottom: 2,
  },

  factorDesc: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#8B7AC9",
    lineHeight: 16,
  },
});
