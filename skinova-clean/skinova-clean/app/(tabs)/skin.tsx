// app/(tabs)/skin.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
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

const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || "http://10.237.1.60:8000";

async function analyzeSkin(imageUri: string) {
  const token = await AsyncStorage.getItem("skinova_token");

  const form = new FormData();

  if (Platform.OS === "web") {
    const imageRes = await fetch(imageUri);
    const blob = await imageRes.blob();
    form.append("image", blob, "face.jpg");
  } else {
    form.append("image", {
      uri: imageUri,
      name: "face.jpg",
      type: "image/jpeg",
    } as any);
  }

  const res = await fetch(`${BASE_URL}/api/face/analyze`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(err.detail || `Error ${res.status}`);
  }
  return res.json();
}

function getScoreColor(score: number) {
  if (score >= 75) return "#7CC98A";
  if (score >= 45) return "#F0C86A";
  return "#E87070";
}

function getSeverityColor(s: string) {
  if (s === "Severe") return "#E87070";
  if (s === "Moderate") return "#F0C86A";
  return "#7CC98A";
}

export default function SkinAnalysisScreen() {
  const insets = useSafeAreaInsets();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  async function pickFromCamera() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") { Alert.alert("Permission needed", "Camera permission is required."); return; }
    const picked = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'], quality: 0.85, allowsEditing: true, aspect: [1, 1],
    });
    if (!picked.canceled) handleImage(picked.assets[0].uri);
  }

  async function pickFromGallery() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") { Alert.alert("Permission needed", "Gallery permission is required."); return; }
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], quality: 0.85, allowsEditing: true, aspect: [1, 1],
    });
    if (!picked.canceled) handleImage(picked.assets[0].uri);
  }

  async function handleImage(uri: string) {
    setImageUri(uri); setResult(null); setError(null); setLoading(true);
    try {
      const data = await analyzeSkin(uri);
      setResult(data);
    } catch (e: any) {
      setError(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function reset() { setImageUri(null); setResult(null); setError(null); }

  return (
    <LinearGradient colors={["#1A1825", "#1E1B2E"]} style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16), paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.delay(0).springify()} style={styles.header}>
          <Text style={styles.title}>Skin Analysis</Text>
          <Text style={styles.subtitle}>Powered by YOLO + CNN</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(80).springify()}>
          <GlassCard style={styles.imageCard}>
            {imageUri ? (
              <View>
                <Image source={{ uri: imageUri }} style={styles.previewImage} />
                {!loading && (
                  <Pressable style={styles.retakeBtn} onPress={reset}>
                    <Ionicons name="refresh" size={16} color="#9B8AD4" />
                    <Text style={styles.retakeText}>Retake</Text>
                  </Pressable>
                )}
              </View>
            ) : (
              <View style={styles.placeholder}>
                <LinearGradient colors={["rgba(155,138,212,0.2)", "rgba(240,168,150,0.1)"]} style={styles.placeholderIcon}>
                  <Ionicons name="scan-outline" size={40} color="#9B8AD4" />
                </LinearGradient>
                <Text style={styles.placeholderText}>Take or upload a face photo</Text>
                <Text style={styles.placeholderSub}>Best results with clear lighting, no filters</Text>
              </View>
            )}
          </GlassCard>
        </Animated.View>

        {!imageUri && (
          <Animated.View entering={FadeInDown.delay(160).springify()} style={styles.btnRow}>
            <Pressable style={styles.btn} onPress={pickFromCamera}>
              <LinearGradient colors={["#9B8AD4", "#7A6BBF"]} style={styles.btnGradient}>
                <Ionicons name="camera" size={20} color="#fff" />
                <Text style={styles.btnText}>Camera</Text>
              </LinearGradient>
            </Pressable>
            <Pressable style={styles.btn} onPress={pickFromGallery}>
              <LinearGradient colors={["#F0A896", "#D4897A"]} style={styles.btnGradient}>
                <Ionicons name="images" size={20} color="#fff" />
                <Text style={styles.btnText}>Gallery</Text>
              </LinearGradient>
            </Pressable>
          </Animated.View>
        )}

        {loading && (
          <Animated.View entering={FadeInDown.springify()}>
            <GlassCard style={styles.loadingCard}>
              <ActivityIndicator size="large" color="#9B8AD4" />
              <Text style={styles.loadingText}>Analyzing your skin...</Text>
              <Text style={styles.loadingSub}>YOLO detecting lesions · CNN classifying condition</Text>
            </GlassCard>
          </Animated.View>
        )}

        {error && (
          <Animated.View entering={FadeInDown.springify()}>
            <GlassCard style={styles.resultCard}>
              <Ionicons name="alert-circle" size={32} color="#E87070" />
              <Text style={styles.errorText}>{error}</Text>
              <Pressable style={styles.retakeBtn} onPress={reset}><Text style={styles.retakeText}>Try again</Text></Pressable>
            </GlassCard>
          </Animated.View>
        )}

        {result && !loading && (
          <>
            <Animated.View entering={FadeInDown.delay(0).springify()}>
              <GlassCard style={styles.resultCard}>
                <View style={styles.scoreRow}>
                  <View>
                    <Text style={styles.cardLabel}>Skin Score</Text>
                    <View style={{ flexDirection: "row", alignItems: "baseline", gap: 4 }}>
                      <Text style={[styles.bigScore, { color: getScoreColor(result.skin_score) }]}>{result.skin_score}</Text>
                      <Text style={styles.scoreMax}>/100</Text>
                    </View>
                  </View>
                  <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(result.severity) + "22" }]}>
                    <Text style={[styles.severityText, { color: getSeverityColor(result.severity) }]}>{result.severity}</Text>
                  </View>
                </View>
                <View style={styles.divider} />
                <View style={styles.detailRow}>
                  <Ionicons name="medical" size={16} color="#B8A9E8" />
                  <Text style={styles.detailLabel}>Primary Condition</Text>
                  <Text style={styles.detailValue}>{result.primary_condition}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="stats-chart" size={16} color="#B8A9E8" />
                  <Text style={styles.detailLabel}>Confidence</Text>
                  <Text style={styles.detailValue}>{(result.confidence * 100).toFixed(1)}%</Text>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="scan" size={16} color="#B8A9E8" />
                  <Text style={styles.detailLabel}>Lesions Detected</Text>
                  <Text style={styles.detailValue}>{result.lesion_count}</Text>
                </View>
                <View style={styles.modelsRow}>
                  {(result.models_used || []).map((m: string) => (
                    <View key={m} style={styles.modelChip}><Text style={styles.modelChipText}>{m.toUpperCase()}</Text></View>
                  ))}
                  {result.mock && (
                    <View style={[styles.modelChip, { backgroundColor: "rgba(240,200,106,0.15)" }]}>
                      <Text style={[styles.modelChipText, { color: "#F0C86A" }]}>MOCK MODE</Text>
                    </View>
                  )}
                </View>
              </GlassCard>
            </Animated.View>

            {result.lesion_breakdown && Object.keys(result.lesion_breakdown).length > 0 && (
              <Animated.View entering={FadeInDown.delay(100).springify()}>
                <GlassCard style={styles.resultCard}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="list" size={16} color="#B8A9E8" />
                    <Text style={styles.sectionTitle}>Lesion Breakdown</Text>
                  </View>
                  {Object.entries(result.lesion_breakdown).map(([type, count]) => (
                    <View key={type} style={styles.detailRow}>
                      <View style={styles.lesionDot} />
                      <Text style={styles.detailLabel}>{type}</Text>
                      <Text style={styles.detailValue}>{count as number}</Text>
                    </View>
                  ))}
                </GlassCard>
              </Animated.View>
            )}

            <Animated.View entering={FadeInDown.delay(200).springify()}>
              <Pressable onPress={reset}>
                <LinearGradient colors={["#9B8AD4", "#7A6BBF"]} style={styles.analyzeAgainBtn}>
                  <Ionicons name="refresh" size={18} color="#fff" />
                  <Text style={styles.analyzeAgainText}>Analyze Another Photo</Text>
                </LinearGradient>
              </Pressable>
            </Animated.View>
          </>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20 },
  header: { marginBottom: 24 },
  title: { fontSize: 26, fontFamily: "Inter_700Bold", color: "#F0EEF8", letterSpacing: -0.5 },
  subtitle: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#8B7AC9", marginTop: 2 },
  imageCard: { marginBottom: 16, padding: 0, overflow: "hidden" },
  previewImage: { width: "100%", height: 300, borderRadius: 16 },
  placeholder: { alignItems: "center", paddingVertical: 40, gap: 12 },
  placeholderIcon: { width: 80, height: 80, borderRadius: 24, justifyContent: "center", alignItems: "center" },
  placeholderText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#D4C8F5" },
  placeholderSub: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#605D72", textAlign: "center" },
  btnRow: { flexDirection: "row", gap: 12, marginBottom: 16 },
  btn: { flex: 1, borderRadius: 14, overflow: "hidden" },
  btnGradient: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 16 },
  btnText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#fff" },
  retakeBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10 },
  retakeText: { fontSize: 14, fontFamily: "Inter_500Medium", color: "#9B8AD4" },
  loadingCard: { alignItems: "center", gap: 12, paddingVertical: 32 },
  loadingText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#D4C8F5" },
  loadingSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#8B7AC9", textAlign: "center" },
  resultCard: { marginBottom: 16 },
  scoreRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardLabel: { fontSize: 12, fontFamily: "Inter_500Medium", color: "#8B7AC9", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
  bigScore: { fontSize: 48, fontFamily: "Inter_700Bold" },
  scoreMax: { fontSize: 18, fontFamily: "Inter_400Regular", color: "#605D72" },
  severityBadge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  severityText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  divider: { height: 1, backgroundColor: "rgba(255,255,255,0.06)", marginVertical: 16 },
  detailRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  detailLabel: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular", color: "#8B7AC9" },
  detailValue: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#D4C8F5" },
  modelsRow: { flexDirection: "row", gap: 8, marginTop: 4, flexWrap: "wrap" },
  modelChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: "rgba(155,138,212,0.15)" },
  modelChipText: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: "#9B8AD4" },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 },
  sectionTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#D4C8F5" },
  lesionDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#9B8AD4" },
  errorText: { fontSize: 14, fontFamily: "Inter_400Regular", color: "#E87070", textAlign: "center", marginVertical: 8 },
  analyzeAgainBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 16, borderRadius: 14, marginBottom: 16 },
  analyzeAgainText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#fff" },
});