import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator, Alert, Platform, Pressable,
  RefreshControl, ScrollView, StyleSheet, Text, TextInput, View,
} from "react-native";
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GlassCard } from "@/components/GlassCard";
import API, { BASE_URL } from "@/services/api";

interface FoodLog {
  id: string; ingredients: string[]; risk_score: number;
  trigger: string; timestamp: string; image?: string | null; nutrition?: any;
}

function RiskBar({ score }: { score: number }) {
  const fillAnim = useSharedValue(0);
  useEffect(() => { fillAnim.value = withSpring(score / 100, { damping: 14 }); }, [score]);
  const fillStyle = useAnimatedStyle(() => ({ width: `${fillAnim.value * 100}%` as any }));
  const color = score >= 70 ? "#D4856A" : score >= 40 ? "#C4956A" : "#8BAF9C";
  return (
    <View style={st.riskBarBg}>
      <Animated.View style={[st.riskBarFill, fillStyle, { backgroundColor: color }]} />
    </View>
  );
}

function FoodLogCard({ item, index }: { item: FoodLog; index: number }) {
  const riskColor = item.risk_score >= 70 ? "#D4856A" : item.risk_score >= 40 ? "#C4956A" : "#8BAF9C";
  const riskLabel = item.risk_score >= 70 ? "High" : item.risk_score >= 40 ? "Moderate" : "Low";
  return (
    <Animated.View entering={FadeInDown.delay(index * 80).springify()}>
      <View style={st.logCard}>
        <View style={st.logHeader}>
          <View style={[st.riskCircle, { borderColor: riskColor + "50", backgroundColor: riskColor + "10" }]}>
            <Text style={[st.riskScore, { color: riskColor }]}>{item.risk_score}</Text>
            <Text style={[st.riskLabelText, { color: riskColor + "80" }]}>{riskLabel}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={st.logTime}>{item.timestamp}</Text>
            <Text style={st.logTrigger}>{item.trigger}</Text>
          </View>
        </View>
        <RiskBar score={item.risk_score} />
        {item.nutrition?.nutritional_profile && (
          <View style={st.nutritionRow}>
            {Object.entries(item.nutrition.nutritional_profile)
              .filter(([_, v]) => (v as number) > 0)
              .map(([key]) => (
                <View key={key} style={st.nutritionChip}>
                  <Text style={st.nutritionChipText}>
                    {key.replace(/_content|_score|_match/g, "").replace(/_/g, " ").trim()}
                  </Text>
                </View>
              ))}
          </View>
        )}
        <View style={st.ingredientsRow}>
          {item.ingredients.map((ing) => (
            <View key={ing} style={st.ingChip}>
              <Text style={st.ingChipText}>{ing}</Text>
            </View>
          ))}
        </View>
      </View>
    </Animated.View>
  );
}

function ScanOption({ icon, label, onPress, color }: { icon: string; label: string; onPress: () => void; color: string }) {
  const scale = useSharedValue(1);
  const aStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View style={[aStyle, { flex: 1 }]}>
      <Pressable
        onPressIn={() => { scale.value = withSpring(0.93); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        onPress={onPress}
        style={[st.scanOption, { borderColor: color + "30" }]}
      >
        <View style={[st.scanOptionIcon, { backgroundColor: color + "15" }]}>
          <Ionicons name={icon as any} size={22} color={color} />
        </View>
        <Text style={[st.scanOptionLabel, { color }]}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

export default function FoodScreen() {
  const insets = useSafeAreaInsets();
  const [logs, setLogs]               = useState<FoodLog[]>([]);
  const [analyzing, setAnalyzing]     = useState(false);
  const [manualText, setManualText]   = useState("");
  const [showManual, setShowManual]   = useState(false);
  const [refreshing, setRefreshing]   = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(true);

  const fetchLogs = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("skinova_token");
      const res = await fetch(`${BASE_URL}/api/food/logs?days=3`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) return;
      const data = await res.json();
      const fetched: FoodLog[] = (data.logs ?? []).map((d: any) => ({
        id: d._id ?? d.id ?? String(Math.random()),
        ingredients: d.ingredients ?? (d.food_name ? [d.food_name] : []),
        risk_score: Math.round(typeof d.risk_score === "number" && d.risk_score <= 1 ? d.risk_score * 100 : d.risk_score ?? 0),
        trigger: d.trigger ?? d.food_name ?? "Food logged",
        timestamp: d.timestamp ? new Date(d.timestamp).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "Unknown time",
        nutrition: d,
      }));
      setLogs(fetched);
    } catch (e) { console.error("[FoodScreen] fetchLogs failed:", e); }
    finally { setLoadingLogs(false); }
  }, [BASE_URL]);

  useEffect(() => { fetchLogs(); }, []);
  const onRefresh = useCallback(async () => { setRefreshing(true); await fetchLogs(); setRefreshing(false); }, [fetchLogs]);

  const analyzeFood = async (input: { text?: string; imageUri?: string }) => {
    setAnalyzing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const token = await AsyncStorage.getItem("skinova_token");
      const form = new FormData();
      if (input.imageUri) {
        if (Platform.OS === "web") {
          const r = await fetch(input.imageUri); const blob = await r.blob();
          form.append("image", blob, "food.jpg");
        } else {
          form.append("image", { uri: input.imageUri, name: "food.jpg", type: "image/jpeg" } as any);
        }
      } else if (input.text) { form.append("text", input.text); }
      const res = await fetch(`${BASE_URL}/api/food/analyze`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: form });
      const data = await res.json();
      const newLog: FoodLog = {
        id: Date.now().toString(),
        ingredients: data.ingredients || [data.food_name],
        risk_score: Math.round(typeof data.risk_score === "number" && data.risk_score <= 1 ? data.risk_score * 100 : data.risk_score ?? 0),
        trigger: data.trigger ?? data.food_name ?? "Food logged",
        timestamp: new Date().toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }),
        nutrition: data,
      };
      setLogs((prev) => [newLog, ...prev]);
      setTimeout(() => fetchLogs(), 1500);
    } catch (err: any) { Alert.alert("Error", err.message || "Analysis failed"); }
    setAnalyzing(false);
  };

  const handleCamera = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) { Alert.alert("Permission needed"); return; }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.6 });
    if (!result.canceled) await analyzeFood({ imageUri: result.assets[0].uri });
  };
  const handleGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.6 });
    if (!result.canceled) await analyzeFood({ imageUri: result.assets[0].uri });
  };
  const handleManual = async () => {
    if (!manualText.trim()) return;
    setShowManual(false);
    await analyzeFood({ text: manualText });
    setManualText("");
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#FEFCF9" }}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[st.container, { paddingTop: insets.top + (Platform.OS === "web" ? 28 : 20), paddingBottom: 100 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#C4956A" />}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.delay(0).springify()} style={st.pageHeader}>
          <Text style={st.pageTitle}>Food Log</Text>
          <Text style={st.pageSubtitle}>Track what you eat · AI risk analysis</Text>
        </Animated.View>

        {/* Scan card */}
        <Animated.View entering={FadeInDown.delay(80).springify()}>
          <View style={st.scanCard}>
            <LinearGradient colors={["rgba(196,149,106,0.06)", "rgba(232,165,152,0.04)"]} style={st.scanCardGradient} />
            <View style={st.scanCardHeader}>
              <View style={st.scanCardIconWrap}>
                <LinearGradient colors={["#8BAF9C", "#6FA3A0"]} style={st.scanCardIcon}>
                  <Ionicons name="restaurant" size={18} color="#fff" />
                </LinearGradient>
              </View>
              <View>
                <Text style={st.scanLabel}>Log a Meal</Text>
                <Text style={st.scanSublabel}>AI analyzes skin-trigger risk</Text>
              </View>
            </View>
            <View style={st.scanGrid}>
              <ScanOption icon="camera-outline" label="Camera" onPress={handleCamera} color="#C4956A" />
              <ScanOption icon="images-outline" label="Gallery" onPress={handleGallery} color="#8BAF9C" />
              <ScanOption icon="pencil-outline" label="Manual" onPress={() => { setShowManual(!showManual); Haptics.selectionAsync(); }} color="#D4856A" />
            </View>

            {showManual && (
              <Animated.View entering={FadeInDown.springify()} style={st.manualInput}>
                <View style={st.manualInputRow}>
                  <TextInput
                    style={st.manualTextInput}
                    placeholder="Enter ingredients (comma-separated)"
                    placeholderTextColor="#C7BDB5"
                    value={manualText}
                    onChangeText={setManualText}
                    multiline
                  />
                  <Pressable onPress={handleManual} style={st.manualSendBtn}>
                    <LinearGradient colors={["#C4956A", "#E8A598"]} style={st.manualSendGrad}>
                      <Ionicons name="arrow-forward" size={18} color="#fff" />
                    </LinearGradient>
                  </Pressable>
                </View>
              </Animated.View>
            )}

            {analyzing && (
              <View style={st.analyzingRow}>
                <ActivityIndicator color="#C4956A" size="small" />
                <Text style={st.analyzingText}>Analyzing with AI...</Text>
              </View>
            )}
          </View>
        </Animated.View>

        <Text style={st.logsTitle}>Recent Logs</Text>

        {loadingLogs ? (
          <View style={{ alignItems: "center", paddingVertical: 32 }}>
            <ActivityIndicator color="#C4956A" />
            <Text style={{ color: "#A8A29E", marginTop: 8, fontSize: 13 }}>Loading your food history…</Text>
          </View>
        ) : logs.length === 0 ? (
          <View style={st.emptyCard}>
            <View style={st.emptyIconWrap}>
              <Ionicons name="restaurant-outline" size={28} color="#C7BDB5" />
            </View>
            <Text style={st.emptyTitle}>No food logs yet</Text>
            <Text style={st.emptySub}>Use Camera, Gallery, or Manual above to log your first meal.</Text>
          </View>
        ) : (
          logs.map((log, i) => <FoodLogCard key={log.id} item={log} index={i} />)
        )}
      </ScrollView>
    </View>
  );
}

const SHADOW = Platform.OS === "web"
  ? ({ boxShadow: "0 4px 20px rgba(196,149,106,0.08)" } as any)
  : { shadowColor: "#C4956A", shadowOpacity: 0.08, shadowRadius: 16, shadowOffset: { width: 0, height: 4 }, elevation: 4 };

const st = StyleSheet.create({
  container: { paddingHorizontal: 20 },
  pageHeader: { marginBottom: 20 },
  pageTitle: { fontSize: 28, fontWeight: "800", color: "#1C1917", letterSpacing: -0.5 },
  pageSubtitle: { fontSize: 12, color: "#A8A29E", marginTop: 3 },

  scanCard: { backgroundColor: "#FFFFFF", borderRadius: 24, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: "#F0EBE3", overflow: "hidden", ...SHADOW },
  scanCardGradient: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  scanCardHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 18 },
  scanCardIconWrap: {},
  scanCardIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: "center", alignItems: "center" },
  scanLabel: { fontSize: 16, fontWeight: "700", color: "#1C1917" },
  scanSublabel: { fontSize: 11, color: "#A8A29E", marginTop: 2 },
  scanGrid: { flexDirection: "row", gap: 10 },
  scanOption: { alignItems: "center", gap: 8, padding: 14, borderRadius: 16, backgroundColor: "#FEFCF9", borderWidth: 1.5 },
  scanOptionIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: "center", alignItems: "center" },
  scanOptionLabel: { fontSize: 12, fontWeight: "600" },
  manualInput: { marginTop: 14 },
  manualInputRow: { flexDirection: "row", gap: 10, alignItems: "flex-end" },
  manualTextInput: { flex: 1, backgroundColor: "#FDF8F3", borderRadius: 14, borderWidth: 1.5, borderColor: "#F0EBE3", paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: "#1C1917", minHeight: 52 },
  manualSendBtn: { borderRadius: 14, overflow: "hidden" },
  manualSendGrad: { width: 52, height: 52, justifyContent: "center", alignItems: "center" },
  analyzingRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 14 },
  analyzingText: { fontSize: 13, color: "#78716C" },

  logsTitle: { fontSize: 16, fontWeight: "700", color: "#1C1917", marginBottom: 12 },
  emptyCard: { alignItems: "center", paddingVertical: 40, gap: 10 },
  emptyIconWrap: { width: 72, height: 72, borderRadius: 24, backgroundColor: "#FDF8F3", justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "#F0EBE3" },
  emptyTitle: { fontSize: 16, fontWeight: "600", color: "#78716C" },
  emptySub: { fontSize: 12, color: "#A8A29E", textAlign: "center", lineHeight: 18 },

  logCard: { backgroundColor: "#FFFFFF", borderRadius: 20, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: "#F0EBE3", ...SHADOW },
  logHeader: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 12 },
  riskCircle: { width: 58, height: 58, borderRadius: 18, borderWidth: 2, justifyContent: "center", alignItems: "center" },
  riskScore: { fontSize: 20, fontWeight: "800", lineHeight: 22 },
  riskLabelText: { fontSize: 9, fontWeight: "600" },
  logTime: { fontSize: 11, color: "#A8A29E", marginBottom: 3 },
  logTrigger: { fontSize: 14, fontWeight: "600", color: "#1C1917" },
  riskBarBg: { height: 5, borderRadius: 3, backgroundColor: "#F0EBE3", marginBottom: 12, overflow: "hidden" },
  riskBarFill: { height: "100%", borderRadius: 3 },
  nutritionRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 10 },
  nutritionChip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, backgroundColor: "rgba(212,133,106,0.10)", borderWidth: 1, borderColor: "rgba(212,133,106,0.20)" },
  nutritionChipText: { color: "#D4856A", fontSize: 10, fontWeight: "500" },
  ingredientsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  ingChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, backgroundColor: "#FDF8F3", borderWidth: 1, borderColor: "#F0EBE3" },
  ingChipText: { fontSize: 12, color: "#78716C" },
});