import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { FadeInDown, FadeInRight } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GlassCard } from "@/components/GlassCard";
import { SkinScoreChart } from "@/components/SkinScoreChart";
import { useAuth } from "@/context/AuthContext";
import { router } from "expo-router";

const CYCLE_PHASES = ["Menstrual", "Follicular", "Ovulation", "Luteal"];

const MOCK_DASHBOARD = {
  skin_scores: [
    { date: "2026-03-18", score: 62 },
    { date: "2026-03-19", score: 68 },
    { date: "2026-03-20", score: 59 },
    { date: "2026-03-21", score: 71 },
    { date: "2026-03-22", score: 74 },
    { date: "2026-03-23", score: 69 },
    { date: "2026-03-24", score: 77 },
  ],
 
  cycle_phase: "Follicular",
  cycle_day: 9,
  forecast:
    "Your skin is trending positively. Hydration levels appear stable. Watch for increased sensitivity around day 14 due to hormonal fluctuation. Avoid heavy comedogenic products this week.",
  trigger_events: [
    { id: "1", time: "Mar 22 · 8:00 PM", cause: "High sugar intake", severity: "medium" as const },
    { id: "2", time: "Mar 21 · 12:30 PM", cause: "Fragrance exposure", severity: "high" as const },
    { id: "3", time: "Mar 20 · 9:00 AM", cause: "Low sleep quality", severity: "low" as const },
  ],
};

function SeverityDot({ severity }: { severity: "low" | "medium" | "high" }) {
  const colors = { low: "#7CC98A", medium: "#F0C86A", high: "#E87070" };
  return (
    <View style={[styles.severityDot, { backgroundColor: colors[severity] }]} />
  );
}

function TriggerItem({
  item,
  index,
}: {
  item: (typeof MOCK_DASHBOARD.trigger_events)[0];
  index: number;
}) {
  return (
    <Animated.View entering={FadeInRight.delay(index * 100).springify()} style={styles.triggerItem}>
      <View style={styles.triggerDotCol}>
        <SeverityDot severity={item.severity} />
        {index < 2 && <View style={styles.triggerLine} />}
      </View>
      <View style={styles.triggerContent}>
        <Text style={styles.triggerCause}>{item.cause}</Text>
        <Text style={styles.triggerTime}>{item.time}</Text>
      </View>
      <View style={[styles.severityTag, { backgroundColor: getSeverityBg(item.severity) }]}>
        <Text style={[styles.severityTagText, { color: getSeverityColor(item.severity) }]}>
          {item.severity}
        </Text>
      </View>
    </Animated.View>
  );
}

function getSeverityBg(s: string) {
  if (s === "high") return "rgba(232,112,112,0.12)";
  if (s === "medium") return "rgba(240,200,106,0.12)";
  return "rgba(124,201,138,0.12)";
}
function getSeverityColor(s: string) {
  if (s === "high") return "#E87070";
  if (s === "medium") return "#F0C86A";
  return "#7CC98A";
}

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(MOCK_DASHBOARD);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const lastScore = dashboard.skin_scores[dashboard.skin_scores.length - 1]?.score ?? 0;

  const loadDashboard = useCallback(async () => {
    try {
      const res = await fetch(
        `https://${process.env.EXPO_PUBLIC_DOMAIN}/api/dashboard`,
        { headers: { Authorization: `Bearer token` } }
      );
      if (res.ok) {
        const data = await res.json();
        setDashboard(data);
      }
    } catch {
      // use mock data
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await loadDashboard();
    setRefreshing(false);
  }, [loadDashboard]);

  const scoreColor =
    lastScore >= 75 ? "#7CC98A" : lastScore >= 50 ? "#F0C86A" : "#E87070";

  const cyclePhaseIndex = dashboard.cycle_phase
    ? CYCLE_PHASES.indexOf(dashboard.cycle_phase)
    : -1;

  return (
    <LinearGradient colors={["#1A1825", "#1E1B2E"]} style={{ flex: 1 }}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[
          styles.container,
          {
            paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16),
            paddingBottom: 100,
          },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#B8A9E8"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.delay(0).springify()} style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good morning</Text>
            <Text style={styles.userName}>{user?.email?.split("@")[0] ?? "User"}</Text>
          </View>
          <LinearGradient
            colors={["#B8A9E8", "#F0A896"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.avatarCircle}
          >
            <Ionicons name="sparkles" size={20} color="#fff" />
          </LinearGradient>
        </Animated.View>

        {/* Skin Score Card */}
        <Animated.View entering={FadeInDown.delay(80).springify()}>
          <GlassCard style={styles.scoreCard}>
            <View style={styles.scoreHeader}>
              <View>
                <Text style={styles.cardLabel}>Skin Score · 7 Days</Text>
                <View style={styles.scoreRow}>
                  <Text style={[styles.bigScore, { color: scoreColor }]}>{lastScore}</Text>
                  <Text style={styles.scoreMax}>/100</Text>
                </View>
              </View>
              <View style={[styles.scoreBadge, { backgroundColor: scoreColor + "22" }]}>
                <Ionicons
                  name={lastScore >= 75 ? "trending-up" : "trending-down"}
                  size={20}
                  color={scoreColor}
                />
              </View>
            </View>
            <SkinScoreChart data={dashboard.skin_scores} />
          </GlassCard>
        </Animated.View>

       
        {/* Cycle Phase (female only) */}
        {user?.gender === "female" && (
          <Animated.View entering={FadeInDown.delay(220).springify()}>
            <Pressable onPress={() => router.push("/cycle")}>
            <GlassCard style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Ionicons name="ellipse-outline" size={16} color="#F0A896" />
                <Text style={styles.sectionTitle}>Cycle Phase</Text>
                {dashboard.cycle_day && (
                  <View style={styles.cycleDayTag}>
                    <Text style={styles.cycleDayText}>Day {dashboard.cycle_day}</Text>
                  </View>
                )}
              </View>
              <View style={styles.cycleTrack}>
                {CYCLE_PHASES.map((phase, i) => (
                  <View key={phase} style={styles.cyclePhaseItem}>
                    <View
                      style={[
                        styles.cycleDot,
                        i === cyclePhaseIndex && styles.cycleDotActive,
                        i < cyclePhaseIndex && styles.cycleDotPast,
                      ]}
                    />
                    <Text
                      style={[
                        styles.cyclePhaseLabel,
                        i === cyclePhaseIndex && styles.cyclePhaseLabelActive,
                      ]}
                    >
                      {phase}
                    </Text>
                  </View>
                ))}
              </View>
            </GlassCard>
            </Pressable>
          </Animated.View>
        )}

        {/* AI Forecast */}
        <Animated.View entering={FadeInDown.delay(280).springify()}>
          <GlassCard style={styles.sectionCard}>
           <View style={styles.sectionHeader}>
  <LinearGradient
    colors={["#9B8AD4", "#F0A896"]}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 0 }}
    style={styles.aiDot}
  />
  <Text style={styles.sectionTitle}>AI Forecast</Text>

  {/* 🔥 SHOW MORE BUTTON */}
  
    

 <Pressable onPress={() => router.push("/forecast")}>
  <View style={styles.showMoreBadge}>
    <Text style={styles.showMoreText}>Show More</Text>
  </View>
</Pressable>
</View>
            <Text style={styles.forecastText}>{dashboard.forecast}</Text>
          </GlassCard>
        </Animated.View>

        {/* Trigger Timeline */}
        <Animated.View entering={FadeInDown.delay(340).springify()}>
          <GlassCard style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="time-outline" size={16} color="#B8A9E8" />
              <Text style={styles.sectionTitle}>Trigger Timeline</Text>
            </View>
            {dashboard.trigger_events.map((event, i) => (
              <TriggerItem key={event.id} item={event} index={i} />
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  greeting: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#8B7AC9",
  },
  userName: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: "#F0EEF8",
    letterSpacing: -0.3,
    textTransform: "capitalize",
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  scoreCard: {
    marginBottom: 16,
  },
  sectionCard: {
    marginBottom: 16,
  },
  scoreHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  cardLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: "#8B7AC9",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  bigScore: {
    fontSize: 40,
    fontFamily: "Inter_700Bold",
    lineHeight: 44,
  },
  scoreMax: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    color: "#605D72",
  },
  scoreBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
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
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  allergenChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "rgba(232, 112, 112, 0.14)",
    borderWidth: 1,
    borderColor: "rgba(232, 112, 112, 0.3)",
  },
  allergenChipText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: "#E87070",
  },

  showMoreBadge: {
  paddingHorizontal: 12,
  paddingVertical: 5,
  borderRadius: 20,
  backgroundColor: "rgba(155, 138, 212, 0.15)", // same vibe as AI badge
  borderWidth: 1,
  borderColor: "rgba(155, 138, 212, 0.3)",
},

showMoreText: {
  fontSize: 11,
  fontFamily: "Inter_600SemiBold",
  color: "#9B8AD4",
},

  showMore: {
  fontSize: 12,
  color: "#9B8AD4",
  fontFamily: "Inter_600SemiBold",
},

  emptyChip: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#605D72",
  },
  cycleDayTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: "rgba(240, 168, 150, 0.15)",
  },
  cycleDayText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: "#F0A896",
  },
  cycleTrack: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cyclePhaseItem: {
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  cycleDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#3D3A52",
    borderWidth: 2,
    borderColor: "#605D72",
  },
  cycleDotPast: {
    backgroundColor: "#605D72",
    borderColor: "#605D72",
  },
  cycleDotActive: {
    backgroundColor: "#F0A896",
    borderColor: "#F0A896",
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  cyclePhaseLabel: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    color: "#605D72",
    textAlign: "center",
  },
  cyclePhaseLabelActive: {
    color: "#F0A896",
    fontFamily: "Inter_600SemiBold",
  },
  aiDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  aiBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: "rgba(155, 138, 212, 0.15)",
  },
  aiBadgeText: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
    color: "#9B8AD4",
  },
  forecastText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "#C8C5D0",
    lineHeight: 22,
  },
  triggerItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 16,
  },
  triggerDotCol: {
    alignItems: "center",
    width: 16,
  },
  triggerLine: {
    width: 1,
    flex: 1,
    backgroundColor: "#302D44",
    marginTop: 4,
    minHeight: 24,
  },
  triggerContent: {
    flex: 1,
  },
  triggerCause: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: "#D4C8F5",
    marginBottom: 2,
  },
  triggerTime: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#605D72",
  },
  severityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
  },
  severityTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  severityTagText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    textTransform: "capitalize",
  },
});
