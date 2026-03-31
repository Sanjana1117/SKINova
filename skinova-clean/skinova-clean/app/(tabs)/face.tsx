import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GlassCard } from "@/components/GlassCard";
import { useAuth } from "@/context/AuthContext";
import API from "@/services/api";

// ── Types ─────────────────────────────────────────────────────────
interface FaceLog {
  id:                string;
  primary_condition: string;
  skin_score:        number;
  severity:          string;
  lesion_count:      number;
  lesion_breakdown:  Record<string, number>;
  confidence:        number;
  models_used:       string[];
  mock:              boolean;
  timestamp:         string;
}

// ── Severity → color ──────────────────────────────────────────────
const SEVERITY_COLORS: Record<string, string> = {
  Mild:     "#7CC98A",
  Moderate: "#F0C86A",
  Severe:   "#E87070",
};

const CONDITION_COLORS: Record<string, string> = {
  Normal:            "#7CC98A",
  Acne:              "#E87070",
  Rosacea:           "#F0A896",
  Eczema:            "#F0C86A",
  Hyperpigmentation: "#B8A9E8",
  Dryness:           "#F0C86A",
  Oiliness:          "#9B8AD4",
  Pending:           "#605D72",
};

// ── Scan button component ─────────────────────────────────────────
function ScanBtn({
  icon, label, onPress, primary,
}: {
  icon: string; label: string; onPress: () => void; primary: boolean;
}) {
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
          <LinearGradient colors={["#9B8AD4", "#B8A9E8"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.primaryBtn}>
            <Ionicons name={icon as any} size={18} color="#fff" />
            <Text style={styles.primaryBtnText}>{label}</Text>
          </LinearGradient>
        ) : (
          <View style={styles.secondaryBtn}>
            <Ionicons name={icon as any} size={18} color="#B8A9E8" />
            <Text style={styles.secondaryBtnText}>{label}</Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

// ── Log card component ────────────────────────────────────────────
function FaceLogCard({ item, index }: { item: FaceLog; index: number }) {
  const scoreColor    = SEVERITY_COLORS[item.severity]   ?? "#A8A5B8";
  const conditionColor = CONDITION_COLORS[item.primary_condition] ?? "#A8A5B8";

  return (
    <Animated.View entering={FadeInDown.delay(index * 80).springify()}>
      <GlassCard style={styles.logCard}>
        <View style={styles.logHeader}>

          {/* Score circle */}
          <View style={[styles.scoreCircle, { borderColor: scoreColor + "55" }]}>
            <Text style={[styles.scoreNum, { color: scoreColor }]}>
              {Math.round(item.skin_score)}
            </Text>
            <Text style={styles.scoreLabel}>score</Text>
          </View>

          {/* Details */}
          <View style={{ flex: 1 }}>
            <Text style={styles.logTime}>{item.timestamp}</Text>

            {/* Primary condition badge */}
            <View style={[styles.conditionBadge, { backgroundColor: conditionColor + "20", borderColor: conditionColor + "50" }]}>
              <Text style={[styles.conditionText, { color: conditionColor }]}>
                {item.primary_condition}
              </Text>
            </View>

            {/* Severity + lesion count */}
            <View style={styles.metaRow}>
              <View style={[styles.severityTag, { backgroundColor: scoreColor + "18" }]}>
                <Text style={[styles.severityText, { color: scoreColor }]}>
                  {item.severity}
                </Text>
              </View>
              {item.lesion_count > 0 && (
                <Text style={styles.lesionText}>
                  {item.lesion_count} lesion{item.lesion_count !== 1 ? "s" : ""}
                </Text>
              )}
              {item.mock && (
                <View style={styles.mockBadge}>
                  <Text style={styles.mockText}>Mock</Text>
                </View>
              )}
            </View>

            {/* Lesion breakdown */}
            {Object.keys(item.lesion_breakdown ?? {}).length > 0 && (
              <View style={styles.breakdownRow}>
                {Object.entries(item.lesion_breakdown).map(([k, v]) => (
                  <View key={k} style={styles.breakdownChip}>
                    <Text style={styles.breakdownText}>{k}: {v}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </GlassCard>
    </Animated.View>
  );
}

// ── Main screen ───────────────────────────────────────────────────
export default function FaceScreen() {
  const insets       = useSafeAreaInsets();
  const { token }    = useAuth();

  const [logs, setLogs]           = useState<FaceLog[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]         = useState("");

  // ── Fetch logs from backend ───────────────────────────────────
  const fetchLogs = async () => {
    try {
      const res = await API.get("/face/logs");
      setLogs(res.data.logs);
    } catch (err) {
      console.log("Failed to fetch face logs:", err);
    }
  };

  useEffect(() => { fetchLogs(); }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchLogs();
    setRefreshing(false);
  }, []);

  // ── Core analyze function — sends image to backend ────────────
  const analyzeFace = async (imageUri: string) => {
    setAnalyzing(true);
    setError("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      // Build multipart form — backend expects UploadFile named "image"
      // const formData = new FormData();
      // formData.append("image", {
      //   uri:  imageUri,
      //   name: "face.jpg",
      //   type: "image/jpeg",
      // } as any);

      const formData = new FormData();

// 🔥 Convert URI → Blob (REQUIRED for web)
      const response = await fetch(imageUri);
      const blob = await response.blob();

      formData.append("image", blob, "face.jpg");

      const res = await API.post("/face/analyze", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const data: FaceLog = res.data;

      // Add to top of logs list
      setLogs(prev => [{
        ...data,
        timestamp: "Just now",
      }, ...prev]);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    } catch (err: any) {
      const msg =
  typeof err?.response?.data?.detail === "string"
    ? err.response.data.detail
    : JSON.stringify(err.response.data.detail);

setError(msg);
      Alert.alert("Error", msg);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setAnalyzing(false);
    }
  };

  // ── Camera ────────────────────────────────────────────────────
  console.log("ImagePicker:", ImagePicker);
  const handleCamera = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission needed", "Camera access is required.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality:           0.7,
      allowsEditing:     true,
      aspect:            [1, 1],   // square crop for face
      mediaTypes:        ['images'],
    });
    if (!result.canceled && result.assets[0]) {
      await analyzeFace(result.assets[0].uri);
    }
  };

  // ── Gallery ───────────────────────────────────────────────────
  const handleGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      quality:       0.7,
      allowsEditing: true,
      aspect:        [1, 1],
      mediaTypes:    ['images'],
    });
    if (!result.canceled && result.assets[0]) {
      await analyzeFace(result.assets[0].uri);
    }
  };

  return (
    <LinearGradient colors={["#1A1825", "#1E1B2E"]} style={{ flex: 1 }}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[
          styles.container,
          {
            paddingTop:    insets.top + (Platform.OS === "web" ? 67 : 16),
            paddingBottom: 100,
          },
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#B8A9E8" />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Page header */}
        <Animated.View entering={FadeInDown.delay(0).springify()} style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Face Scan</Text>
          <Text style={styles.pageSubtitle}>AI skin analysis · YOLOv8 + CNN</Text>
        </Animated.View>

        {/* ── Hero scan card ── */}
        <Animated.View entering={FadeInDown.delay(80).springify()}>
          <LinearGradient
            colors={["rgba(155,138,212,0.25)", "rgba(240,168,150,0.15)"]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            {/* Scan icon */}
            <View style={styles.heroIconWrap}>
              <Ionicons name="scan" size={44} color="#B8A9E8" />
            </View>

            <Text style={styles.heroTitle}>Scan Your Skin</Text>
            <Text style={styles.heroSub}>
              Our AI detects lesions, classifies conditions and gives you a skin score
            </Text>

            {/* Buttons */}
            <View style={styles.heroBtnRow}>
              <ScanBtn icon="camera"    label="Camera"  onPress={handleCamera}  primary />
              <ScanBtn icon="images-outline" label="Gallery" onPress={handleGallery} primary={false} />
            </View>

            {/* Analyzing indicator */}
            {analyzing && (
              <View style={styles.analyzingRow}>
                <ActivityIndicator color="#B8A9E8" size="small" />
                <Text style={styles.analyzingText}>
                  Running YOLOv8 + CNN analysis...
                </Text>
              </View>
            )}

            {/* Error */}
            {error ? (
              <View style={styles.errorRow}>
                <Ionicons name="alert-circle-outline" size={14} color="#E87070" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Model status hint */}
            {logs.length > 0 && logs[0].mock && (
              <View style={styles.mockHint}>
                <Ionicons name="information-circle-outline" size={14} color="#F0C86A" />
                <Text style={styles.mockHintText}>
                  Models not loaded yet — showing mock results
                </Text>
              </View>
            )}
          </LinearGradient>
        </Animated.View>

        {/* ── Scan history ── */}
        {logs.length > 0 && (
          <Text style={styles.historyTitle}>Scan History</Text>
        )}

        {logs.length === 0 && !analyzing && (
          <View style={styles.emptyState}>
            <Ionicons name="scan-outline" size={40} color="#3D3A52" />
            <Text style={styles.emptyText}>No scans yet</Text>
            <Text style={styles.emptySubText}>Take your first face scan above</Text>
          </View>
        )}

        {logs.map((log, i) => (
          <FaceLogCard key={log.id ?? i} item={log} index={i} />
        ))}

      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container:       { paddingHorizontal: 20 },
  pageHeader:      { marginBottom: 20 },
  pageTitle:       { fontSize: 26, fontFamily: "Inter_700Bold", color: "#F0EEF8", letterSpacing: -0.4 },
  pageSubtitle:    { fontSize: 12, fontFamily: "Inter_400Regular", color: "#8B7AC9", marginTop: 3 },

  // Hero
  heroCard:        { borderRadius: 24, padding: 24, borderWidth: 1, borderColor: "rgba(184,169,232,0.2)", alignItems: "center", marginBottom: 28 },
  heroIconWrap:    { width: 80, height: 80, borderRadius: 40, backgroundColor: "rgba(139,122,201,0.15)", justifyContent: "center", alignItems: "center", marginBottom: 14 },
  heroTitle:       { fontSize: 20, fontFamily: "Inter_700Bold", color: "#F0EEF8", marginBottom: 8 },
  heroSub:         { fontSize: 13, fontFamily: "Inter_400Regular", color: "#A8A5B8", textAlign: "center", lineHeight: 20, marginBottom: 20 },
  heroBtnRow:      { flexDirection: "row", gap: 12, width: "100%" },
  primaryBtn:      { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 48, borderRadius: 14 },
  primaryBtnText:  { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#fff" },
  secondaryBtn:    { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 48, borderRadius: 14, backgroundColor: "rgba(48,45,68,0.8)", borderWidth: 1, borderColor: "#3D3A52" },
  secondaryBtnText:{ fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#B8A9E8" },

  analyzingRow:    { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 14 },
  analyzingText:   { fontSize: 13, fontFamily: "Inter_400Regular", color: "#B8A9E8" },
  errorRow:        { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 12, backgroundColor: "rgba(232,112,112,0.1)", borderRadius: 10, padding: 10, width: "100%" },
  errorText:       { fontSize: 12, fontFamily: "Inter_400Regular", color: "#E87070", flex: 1 },
  mockHint:        { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 12, backgroundColor: "rgba(240,200,106,0.1)", borderRadius: 10, padding: 10, width: "100%" },
  mockHintText:    { fontSize: 12, fontFamily: "Inter_400Regular", color: "#F0C86A", flex: 1 },

  // History
  historyTitle:    { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#D4C8F5", marginBottom: 12 },

  // Empty state
  emptyState:      { alignItems: "center", paddingVertical: 48, gap: 8 },
  emptyText:       { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#3D3A52" },
  emptySubText:    { fontSize: 13, fontFamily: "Inter_400Regular", color: "#2D2A3E" },

  // Log card
  logCard:         { marginBottom: 14 },
  logHeader:       { flexDirection: "row", alignItems: "flex-start", gap: 14 },
  scoreCircle:     { width: 62, height: 62, borderRadius: 18, borderWidth: 2, backgroundColor: "rgba(48,45,68,0.6)", justifyContent: "center", alignItems: "center" },
  scoreNum:        { fontSize: 20, fontFamily: "Inter_700Bold", lineHeight: 24 },
  scoreLabel:      { fontSize: 10, fontFamily: "Inter_400Regular", color: "#605D72" },
  logTime:         { fontSize: 11, fontFamily: "Inter_400Regular", color: "#605D72", marginBottom: 6 },

  conditionBadge:  { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1, marginBottom: 6 },
  conditionText:   { fontSize: 13, fontFamily: "Inter_600SemiBold" },

  metaRow:         { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  severityTag:     { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  severityText:    { fontSize: 11, fontFamily: "Inter_500Medium" },
  lesionText:      { fontSize: 11, fontFamily: "Inter_400Regular", color: "#605D72" },
  mockBadge:       { backgroundColor: "rgba(96,93,114,0.2)", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  mockText:        { fontSize: 11, fontFamily: "Inter_400Regular", color: "#605D72" },

  breakdownRow:    { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 6 },
  breakdownChip:   { backgroundColor: "rgba(48,45,68,0.6)", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  breakdownText:   { fontSize: 11, fontFamily: "Inter_400Regular", color: "#A8A5B8" },
});