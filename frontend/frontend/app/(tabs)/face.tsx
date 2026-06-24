import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import React, { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  ActivityIndicator, Alert, Platform, Pressable,
  RefreshControl, ScrollView, StyleSheet, Text, View,
} from "react-native";
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GlassCard } from "@/components/GlassCard";
import API, { BASE_URL } from "@/services/api";

interface FaceLog {
  id: string; primary_condition: string; skin_score: number;
  severity: string; lesion_count: number; lesion_breakdown: Record<string, number>;
  confidence: number; models_used: string[]; mock: boolean; timestamp: string;
}

const SEVERITY_COLORS: Record<string, string>  = { Mild: "#8BAF9C", Moderate: "#C4956A", Severe: "#D4856A" };
const CONDITION_COLORS: Record<string, string> = {
  Normal: "#8BAF9C", Acne: "#D4856A", Rosacea: "#E8A598",
  Eczema: "#C4956A", Hyperpigmentation: "#A89ACB",
  Dryness: "#C4956A", Oiliness: "#6FA3A0", Pending: "#A8A29E",
};

const SHADOW = Platform.OS === "web"
  ? ({ boxShadow: "0 4px 24px rgba(196,149,106,0.10)" } as any)
  : { shadowColor: "#C4956A", shadowOpacity: 0.10, shadowRadius: 20, shadowOffset: { width: 0, height: 6 }, elevation: 6 };

function ScanBtn({ icon, label, onPress, primary }: { icon: string; label: string; onPress: () => void; primary: boolean }) {
  const scale = useSharedValue(1);
  const aStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View style={[aStyle, { flex: 1 }]}>
      <Pressable
        onPressIn={() => { scale.value = withSpring(0.94); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        onPress={onPress}
      >
        {primary ? (
          <LinearGradient colors={["#C4956A", "#E8A598"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={st.primaryBtn}>
            <Ionicons name={icon as any} size={18} color="#fff" />
            <Text style={st.primaryBtnText}>{label}</Text>
          </LinearGradient>
        ) : (
          <View style={st.secondaryBtn}>
            <Ionicons name={icon as any} size={18} color="#C4956A" />
            <Text style={st.secondaryBtnText}>{label}</Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

function FaceLogCard({ item, index }: { item: FaceLog; index: number }) {
  const sc = SEVERITY_COLORS[item.severity] ?? "#A8A29E";
  const cc = CONDITION_COLORS[item.primary_condition] ?? "#A8A29E";
  return (
    <Animated.View entering={FadeInDown.delay(index * 80).springify()}>
      <View style={st.logCard}>
        <View style={st.logHeader}>
          <View style={[st.scoreCircle, { borderColor: sc + "60", backgroundColor: sc + "12" }]}>
            <Text style={[st.scoreNum, { color: sc }]}>{Math.round(item.skin_score)}</Text>
            <Text style={st.scoreLabel}>score</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={st.logTime}>{item.timestamp}</Text>
            <View style={[st.conditionBadge, { backgroundColor: cc + "18", borderColor: cc + "50" }]}>
              <Text style={[st.conditionText, { color: cc }]}>{item.primary_condition}</Text>
            </View>
            <View style={st.metaRow}>
              <View style={[st.severityTag, { backgroundColor: sc + "15" }]}>
                <Text style={[st.severityText, { color: sc }]}>{item.severity}</Text>
              </View>
              {item.lesion_count > 0 && <Text style={st.lesionText}>{item.lesion_count} lesion{item.lesion_count !== 1 ? "s" : ""}</Text>}
              {item.mock && <View style={st.mockBadge}><Text style={st.mockText}>Mock</Text></View>}
            </View>
            {Object.keys(item.lesion_breakdown ?? {}).length > 0 && (
              <View style={st.breakdownRow}>
                {Object.entries(item.lesion_breakdown).map(([k, v]) => (
                  <View key={k} style={st.breakdownChip}><Text style={st.breakdownText}>{k}: {v}</Text></View>
                ))}
              </View>
            )}
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

export default function FaceScreen() {
  const insets = useSafeAreaInsets();
  const [logs, setLogs]               = useState<FaceLog[]>([]);
  const [analyzing, setAnalyzing]     = useState(false);
  const [refreshing, setRefreshing]   = useState(false);
  const [error, setError]             = useState("");

  const fetchLogs = async () => {
    try {
      const res  = await API.get("/face/logs");
      const data = res.data;
      setLogs(Array.isArray(data) ? data : (data.logs ?? []));
    } catch (e) { console.log("fetch logs:", e); }
  };

  useEffect(() => { fetchLogs(); }, []);
  const onRefresh = useCallback(async () => { setRefreshing(true); await fetchLogs(); setRefreshing(false); }, []);

  const analyzeFace = async (imageUri: string) => {
    setAnalyzing(true); setError("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const token = await AsyncStorage.getItem("skinova_token");
      if (!token) throw new Error("Not logged in — please sign in again.");
      const formData = new FormData();
      const blob = await fetch(imageUri).then((r) => r.blob());
      formData.append("image", blob, "face.jpg");
      const res = await fetch(`${BASE_URL}/api/face/analyze`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(typeof err.detail === "string" ? err.detail : JSON.stringify(err.detail) || `${res.status}`);
      }
      const data: FaceLog = await res.json();
      setLogs((prev) => [{ ...data, timestamp: "Just now" }, ...prev]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      setError(err.message);
      Alert.alert("Error", err.message);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally { setAnalyzing(false); }
  };

  const handleCamera = async () => {
    // Camera is not supported on web - show helpful message
    if (Platform.OS === "web") {
      Alert.alert(
        "Camera Not Available", 
        "Camera access is only available on mobile devices. Please use the Gallery option to upload a photo.",
        [{ text: "OK" }]
      );
      return;
    }
    
    // Mobile: Use native camera
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) { 
      Alert.alert("Permission needed", "Camera access is required to take photos."); 
      return; 
    }
    
    const r = await ImagePicker.launchCameraAsync({ 
      quality: 0.7, 
      allowsEditing: true, 
      aspect: [1, 1], 
      mediaTypes: ["images"] as any,
      // These options ensure camera opens (not gallery)
      cameraType: ImagePicker.CameraType.front, // Front camera for selfies
      allowsMultipleSelection: false,
    });
    
    if (!r.canceled) await analyzeFace(r.assets[0].uri);
  };

  const handleGallery = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({ 
      quality: 0.7, 
      allowsEditing: true, 
      aspect: [1, 1], 
      mediaTypes: ["images"] as any 
    });
    if (!r.canceled) await analyzeFace(r.assets[0].uri);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#FEFCF9" }}>
      <ScrollView
        contentContainerStyle={[st.container, { paddingTop: insets.top + (Platform.OS === "web" ? 28 : 20), paddingBottom: 100 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#C4956A" />}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.delay(0).springify()} style={st.pageHeader}>
          <Text style={st.pageTitle}>Face Scan</Text>
          <Text style={st.pageSubtitle}>AI skin analysis · YOLOv8 + CNN</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(80).springify()}>
          <View style={st.heroCard}>
            {/* Decorative gradient blob */}
            <LinearGradient
              colors={["rgba(196,149,106,0.08)", "rgba(232,165,152,0.06)"]}
              style={st.heroGradient}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            />
            <View style={st.heroIconWrap}>
              <LinearGradient colors={["#C4956A", "#E8A598"]} style={st.heroIconGrad}>
                <Ionicons name="scan" size={28} color="#fff" />
              </LinearGradient>
            </View>
            <Text style={st.heroTitle}>Scan Your Skin</Text>
            <Text style={st.heroSub}>Our AI detects lesions, classifies conditions and gives you a skin score</Text>

            <View style={st.heroBtnRow}>
              <ScanBtn icon="camera" label="Camera" onPress={handleCamera} primary />
              <ScanBtn icon="images-outline" label="Gallery" onPress={handleGallery} primary={false} />
            </View>

            {/* Platform hint for web users */}
            {Platform.OS === "web" && (
              <View style={st.webHint}>
                <Ionicons name="information-circle-outline" size={14} color="#78716C" />
                <Text style={st.webHintText}>Camera only works on mobile · Use Gallery on web</Text>
              </View>
            )}

            {/* Accuracy pills */}
            <View style={st.accuracyRow}>
              {[["YOLOv8","Detection"],["CNN","Classification"],["AI","Scoring"]].map(([t, d]) => (
                <View key={t} style={st.accuracyPill}>
                  <Text style={st.accuracyTitle}>{t}</Text>
                  <Text style={st.accuracyDesc}>{d}</Text>
                </View>
              ))}
            </View>

            {analyzing && (
              <View style={st.analyzingRow}>
                <ActivityIndicator color="#C4956A" size="small" />
                <Text style={st.analyzingText}>Running YOLOv8 + CNN analysis...</Text>
              </View>
            )}
            {!!error && (
              <View style={st.errorRow}>
                <Ionicons name="alert-circle-outline" size={14} color="#D4856A" />
                <Text style={st.errorText}>{error}</Text>
              </View>
            )}
            {logs.length > 0 && logs[0].mock && (
              <View style={st.mockHint}>
                <Ionicons name="information-circle-outline" size={14} color="#C4956A" />
                <Text style={st.mockHintText}>Models not loaded yet — showing mock results</Text>
              </View>
            )}
          </View>
        </Animated.View>

        {logs.length > 0 && <Text style={st.historyTitle}>Scan History</Text>}
        {logs.length === 0 && !analyzing && (
          <View style={st.emptyState}>
            <View style={st.emptyIconWrap}>
              <Ionicons name="scan-outline" size={32} color="#C7BDB5" />
            </View>
            <Text style={st.emptyText}>No scans yet</Text>
            <Text style={st.emptySubText}>Take your first face scan above</Text>
          </View>
        )}
        {logs.map((log, i) => <FaceLogCard key={log.id ?? i} item={log} index={i} />)}
      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  container: { paddingHorizontal: 20 },
  pageHeader: { marginBottom: 20 },
  pageTitle: { fontSize: 28, fontWeight: "800", color: "#1C1917", letterSpacing: -0.5 },
  pageSubtitle: { fontSize: 12, color: "#A8A29E", marginTop: 3 },

  heroCard: {
    backgroundColor: "#FFFFFF", borderRadius: 24, padding: 24,
    borderWidth: 1, borderColor: "#F0EBE3", alignItems: "center",
    marginBottom: 28, overflow: "hidden", ...SHADOW,
  },
  heroGradient: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  heroIconWrap: { marginBottom: 14 },
  heroIconGrad: { width: 72, height: 72, borderRadius: 24, justifyContent: "center", alignItems: "center" },
  heroTitle: { fontSize: 22, fontWeight: "700", color: "#1C1917", marginBottom: 8 },
  heroSub: { fontSize: 13, color: "#78716C", textAlign: "center", lineHeight: 20, marginBottom: 20 },
  heroBtnRow: { flexDirection: "row", gap: 12, width: "100%", marginBottom: 16 },
  primaryBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 52, borderRadius: 16 },
  primaryBtnText: { fontSize: 15, fontWeight: "700", color: "#fff" },
  secondaryBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 52, borderRadius: 16, backgroundColor: "rgba(196,149,106,0.08)", borderWidth: 1.5, borderColor: "rgba(196,149,106,0.25)" },
  secondaryBtnText: { fontSize: 15, fontWeight: "600", color: "#C4956A" },

  webHint: { 
    flexDirection: "row", alignItems: "center", gap: 8, 
    backgroundColor: "rgba(120,113,108,0.08)", borderRadius: 12, 
    padding: 10, width: "100%", marginBottom: 12 
  },
  webHintText: { fontSize: 11, color: "#78716C", flex: 1 },

  accuracyRow: { flexDirection: "row", gap: 8, width: "100%" },
  accuracyPill: { flex: 1, alignItems: "center", backgroundColor: "#FDF8F3", borderRadius: 12, padding: 10, borderWidth: 1, borderColor: "#F0EBE3" },
  accuracyTitle: { fontSize: 12, fontWeight: "700", color: "#C4956A" },
  accuracyDesc: { fontSize: 9, color: "#A8A29E", marginTop: 1 },

  analyzingRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 14 },
  analyzingText: { fontSize: 13, color: "#78716C" },
  errorRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 12, backgroundColor: "rgba(212,133,106,0.08)", borderRadius: 12, padding: 12, width: "100%" },
  errorText: { fontSize: 12, color: "#D4856A", flex: 1 },
  mockHint: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 12, backgroundColor: "rgba(196,149,106,0.08)", borderRadius: 12, padding: 12, width: "100%" },
  mockHintText: { fontSize: 12, color: "#C4956A", flex: 1 },

  historyTitle: { fontSize: 16, fontWeight: "700", color: "#1C1917", marginBottom: 12 },
  emptyState: { alignItems: "center", paddingVertical: 48, gap: 10 },
  emptyIconWrap: { width: 72, height: 72, borderRadius: 24, backgroundColor: "#FDF8F3", justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "#F0EBE3" },
  emptyText: { fontSize: 16, fontWeight: "600", color: "#78716C" },
  emptySubText: { fontSize: 13, color: "#A8A29E" },

  logCard: { backgroundColor: "#FFFFFF", borderRadius: 18, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: "#F0EBE3", ...SHADOW },
  logHeader: { flexDirection: "row", alignItems: "flex-start", gap: 14 },
  scoreCircle: { width: 62, height: 62, borderRadius: 18, borderWidth: 2, justifyContent: "center", alignItems: "center" },
  scoreNum: { fontSize: 20, fontWeight: "800", lineHeight: 24 },
  scoreLabel: { fontSize: 9, color: "#A8A29E" },
  logTime: { fontSize: 11, color: "#A8A29E", marginBottom: 6 },
  conditionBadge: { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1, marginBottom: 6 },
  conditionText: { fontSize: 13, fontWeight: "600" },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  severityTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  severityText: { fontSize: 11, fontWeight: "500" },
  lesionText: { fontSize: 11, color: "#A8A29E" },
  mockBadge: { backgroundColor: "rgba(168,162,158,0.15)", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  mockText: { fontSize: 11, color: "#A8A29E" },
  breakdownRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 6 },
  breakdownChip: { backgroundColor: "#FDF8F3", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, borderWidth: 1, borderColor: "#F0EBE3" },
  breakdownText: { fontSize: 11, color: "#78716C" },
});