import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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

const { width } = Dimensions.get("window");

interface FoodLog {
  id: string;
  ingredients: string[];
  risk_score: number;
  trigger: string;
  timestamp: string;
  image?: string | null;
  nutrition?: any;
}

function RiskBar({ score }: { score: number }) {
  const fillAnim = useSharedValue(0);

  useEffect(() => {
    fillAnim.value = withSpring(score / 100, { damping: 14 });
  }, [score]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${fillAnim.value * 100}%` as any,
  }));

  const color = score >= 70 ? "#E87070" : score >= 40 ? "#F0C86A" : "#7CC98A";

  return (
    <View style={styles.riskBarBg}>
      <Animated.View style={[styles.riskBarFill, fillStyle, { backgroundColor: color }]} />
    </View>
  );
}

function FoodLogCard({ item, index }: { item: FoodLog; index: number }) {
  const riskColor =
    item.risk_score >= 70 ? "#E87070" : item.risk_score >= 40 ? "#F0C86A" : "#7CC98A";
   

  return (
    <Animated.View entering={FadeInDown.delay(index * 80).springify()}>
      <GlassCard style={styles.logCard}>
        <View style={styles.logHeader}>
          <View style={[styles.riskCircle, { borderColor: riskColor + "44", backgroundColor: riskColor + "11" }]}>
            <Text style={[styles.riskScore, { color: riskColor }]}>{item.risk_score}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.logTime}>{item.timestamp}</Text>
            <Text style={styles.logTrigger}>{item.trigger}</Text>
          </View>
        </View>
        <RiskBar score={item.risk_score} />

        {item.nutrition?.nutritional_profile && (
  <View style={{ marginTop: 10, flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
    {Object.entries(item.nutrition.nutritional_profile)
      .filter(([_, v]) => (v as number) > 0)
      .map(([key]) => (
        <View key={key} style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, backgroundColor: "rgba(232,112,112,0.15)", borderWidth: 1, borderColor: "rgba(232,112,112,0.3)" }}>
          <Text style={{ color: "#E87070", fontSize: 11, fontFamily: "Inter_500Medium" }}>
            {key.replace(/_content|_score|_match/g, "").replace(/_/g, " ").trim()}
          </Text>
        </View>
      ))}
  </View>
)}
        <View style={styles.ingredientsRow}>
          {item.ingredients.map((ing) => (
            <View key={ing} style={styles.ingChip}>
              <Text style={styles.ingChipText}>{ing}</Text>
            </View>
          ))}
        </View>
      </GlassCard>
    </Animated.View>
  );
}

export default function FoodScreen() {
  const insets = useSafeAreaInsets();
  const [logs, setLogs] = useState<FoodLog[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [manualText, setManualText] = useState("");
  const [showManual, setShowManual] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  const BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://10.237.1.60:8000";
 
const analyzeFood = async (input: { text?: string; image?: string; imageUri?: string }) => {
  setAnalyzing(true);
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  try {
    const token = await AsyncStorage.getItem("skinova_token");
    const form = new FormData();
 
    if (input.imageUri) {
      if (Platform.OS === "web") {
        const r = await fetch(input.imageUri);
        const blob = await r.blob();
        form.append("image", blob, "food.jpg");
      } else {
        form.append("image", { uri: input.imageUri, name: "food.jpg", type: "image/jpeg" } as any);
      }
    } else if (input.text) {
      form.append("text", input.text);
    }
 
    const res = await fetch(`${BASE_URL}/api/food/analyze`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
 
    const data = await res.json();
    const newLog: FoodLog = {
      id: Date.now().toString(),
      ingredients: data.ingredients || [data.food_name],
      risk_score: data.risk_score,
      trigger: data.trigger || "None",
      timestamp: "Just now",
      nutrition: data,
    };
    setLogs((prev) => [newLog, ...prev]);
  } catch (err: any) {
    Alert.alert("Error", err.message || "Analysis failed");
  }
  setAnalyzing(false);
};

 const handleCamera = async () => {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) { Alert.alert("Permission needed"); return; }
  const result = await ImagePicker.launchCameraAsync({ quality: 0.6 });
  if (!result.canceled) await analyzeFood({ imageUri: result.assets[0].uri });
};
 
// ALSO replace handleGallery with:
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#B8A9E8" />}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.delay(0).springify()} style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Food Log</Text>
          <Text style={styles.pageSubtitle}>Track what you eat</Text>
        </Animated.View>

        {/* Scan Options */}
        <Animated.View entering={FadeInDown.delay(80).springify()}>
          <GlassCard style={styles.scanCard}>
            <Text style={styles.scanLabel}>Add Food Entry</Text>
            <View style={styles.scanGrid}>
              <ScanOption icon="camera-outline" label="Camera" onPress={handleCamera} color="#9B8AD4" />
              <ScanOption icon="images-outline" label="Gallery" onPress={handleGallery} color="#F0A896" />
              <ScanOption
                icon="pencil-outline"
                label="Manual"
                onPress={() => {
                  setShowManual(!showManual);
                  Haptics.selectionAsync();
                }}
                color="#7CC98A"
              />
            </View>

            {showManual && (
              <Animated.View entering={FadeInDown.springify()} style={styles.manualInput}>
                <View style={styles.manualInputRow}>
                  <TextInput
                    style={styles.manualTextInput}
                    placeholder="Enter ingredients (comma-separated)"
                    placeholderTextColor="#605D72"
                    value={manualText}
                    onChangeText={setManualText}
                    multiline
                  />
                  <Pressable onPress={handleManual} style={styles.manualSendBtn}>
                    <LinearGradient
                      colors={["#9B8AD4", "#B8A9E8"]}
                      style={styles.manualSendGrad}
                    >
                      <Ionicons name="arrow-forward" size={18} color="#fff" />
                    </LinearGradient>
                  </Pressable>
                </View>
              </Animated.View>
            )}

            {analyzing && (
              <View style={styles.analyzingRow}>
                <ActivityIndicator color="#B8A9E8" size="small" />
                <Text style={styles.analyzingText}>Analyzing with AI...</Text>
              </View>
            )}
          </GlassCard>
        </Animated.View>

        {/* Logs */}
        <Text style={styles.logsTitle}>Recent Logs</Text>
        {logs.map((log, i) => (
          <FoodLogCard key={log.id} item={log} index={i} />
        ))}
      </ScrollView>
    </LinearGradient>
  );
}

function ScanOption({
  icon,
  label,
  onPress,
  color,
}: {
  icon: string;
  label: string;
  onPress: () => void;
  color: string;
}) {
  const scale = useSharedValue(1);
  const aStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View style={[aStyle, styles.scanOptionWrap]}>
      <Pressable
        onPressIn={() => {
          scale.value = withSpring(0.93);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }}
        onPressOut={() => { scale.value = withSpring(1); }}
        onPress={onPress}
        style={[styles.scanOption, { borderColor: color + "33" }]}
      >
        <View style={[styles.scanOptionIcon, { backgroundColor: color + "1A" }]}>
          <Ionicons name={icon as any} size={22} color={color} />
        </View>
        <Text style={[styles.scanOptionLabel, { color }]}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20 },
  pageHeader: { marginBottom: 24 },
  pageTitle: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    color: "#F0EEF8",
    letterSpacing: -0.4,
  },
  pageSubtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#8B7AC9",
    marginTop: 2,
  },
  scanCard: { marginBottom: 24 },
  scanLabel: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: "#8B7AC9",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 16,
  },
  scanGrid: {
    flexDirection: "row",
    gap: 12,
  },
  scanOptionWrap: { flex: 1 },
  scanOption: {
    alignItems: "center",
    gap: 10,
    padding: 16,
    borderRadius: 16,
    backgroundColor: "rgba(48, 45, 68, 0.6)",
    borderWidth: 1,
  },
  scanOptionIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  scanOptionLabel: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  manualInput: {
    marginTop: 16,
  },
  manualInputRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-end",
  },
  manualTextInput: {
    flex: 1,
    backgroundColor: "rgba(48, 45, 68, 0.8)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#3D3A52",
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "#F0EEF8",
    minHeight: 52,
  },
  manualSendBtn: {
    borderRadius: 14,
    overflow: "hidden",
  },
  manualSendGrad: {
    width: 52,
    height: 52,
    justifyContent: "center",
    alignItems: "center",
  },
  analyzingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 12,
  },
  analyzingText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#B8A9E8",
  },
  logsTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: "#D4C8F5",
    marginBottom: 12,
  },
  logCard: { marginBottom: 14 },
  logHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 12,
  },
  riskCircle: {
    width: 52,
    height: 52,
    borderRadius: 16,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  riskScore: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  logTime: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "#605D72",
    marginBottom: 3,
  },
  logTrigger: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: "#D4C8F5",
  },
  riskBarBg: {
    height: 5,
    borderRadius: 3,
    backgroundColor: "#302D44",
    marginBottom: 12,
    overflow: "hidden",
  },
  riskBarFill: {
    height: "100%",
    borderRadius: 3,
  },
  ingredientsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  ingChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: "rgba(48, 45, 68, 0.8)",
    borderWidth: 1,
    borderColor: "#3D3A52",
  },
  ingChipText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#A8A5B8",
  },
});
