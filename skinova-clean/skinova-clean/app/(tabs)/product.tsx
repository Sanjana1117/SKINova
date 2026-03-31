import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import API from "../../services/api"; 
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
import axios from "axios";

import { GlassCard } from "@/components/GlassCard";



interface ProductLog {
  id: string;
  product_name: string;
  comedogenic_score: number;
  flagged_ingredients: string[];
  ingredients: string[];
  timestamp: string;
}

/* ---------------- COMPONENTS ---------------- */

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

  const aStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[aStyle, { flex: 1 }]}>
      <Pressable
        onPressIn={() => {
          scale.value = withSpring(0.93);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }}
        onPressOut={() => {
          scale.value = withSpring(1);
        }}
        onPress={onPress}
        style={[styles.scanOption, { borderColor: color + "33" }]}
      >
        <View
          style={[styles.scanOptionIcon, { backgroundColor: color + "1A" }]}
        >
          <Ionicons name={icon as any} size={22} color={color} />
        </View>

        <Text style={[styles.scanOptionLabel, { color }]}>
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

function ComedogenicBar({ score }: { score: number }) {
  const fill = useSharedValue(0);

  React.useEffect(() => {
    fill.value = withSpring(score / 5, { damping: 14 });
  }, [score]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${fill.value * 100}%` as any,
  }));

  const color =
    score >= 4 ? "#E87070" : score >= 3 ? "#F0C86A" : "#7CC98A";

  return (
    <View>
      <View style={styles.barBg}>
        <Animated.View
          style={[styles.barFill, fillStyle, { backgroundColor: color }]}
        />
      </View>

      <View style={styles.barLabels}>
        <Text style={styles.barLabelText}>Non-comedogenic</Text>
        <Text style={[styles.barScore, { color }]}>{score}/5</Text>
        <Text style={styles.barLabelText}>High risk</Text>
      </View>
    </View>
  );
}

function ProductCard({ item, index }: { item: ProductLog; index: number }) {
  const [expanded, setExpanded] = useState(false);

  const scoreColor =
    item.comedogenic_score >= 4
      ? "#E87070"
      : item.comedogenic_score >= 3
      ? "#F0C86A"
      : "#7CC98A";

  return (
    <Animated.View entering={FadeInDown.delay(index * 80).springify()}>
      <GlassCard style={styles.productCard}>
        <Pressable
          onPress={() => {
            setExpanded(!expanded);
            Haptics.selectionAsync();
          }}
        >
          <View style={styles.productHeader}>
            <View
              style={[
                styles.scoreBox,
                {
                  backgroundColor: scoreColor + "18",
                  borderColor: scoreColor + "44",
                },
              ]}
            >
              <Text style={[styles.scoreBoxNum, { color: scoreColor }]}>
                {item.comedogenic_score}
              </Text>
              <Text style={styles.scoreBoxLabel}>C-Score</Text>
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.productName}>{item.product_name}</Text>
              <Text style={styles.productTime}>{item.timestamp}</Text>
            </View>

            <Ionicons
              name={expanded ? "chevron-up" : "chevron-down"}
              size={18}
              color="#605D72"
            />
          </View>

          <ComedogenicBar score={item.comedogenic_score} />
        </Pressable>

        {expanded && (
          <Animated.View
            entering={FadeInDown.springify()}
            style={styles.expandedSection}
          >
            {item.flagged_ingredients.length > 0 && (
              <>
                <Text style={styles.ingTitle}>Flagged Ingredients</Text>
                <View style={styles.chipsRow}>
                  {item.flagged_ingredients.map((ing) => (
                    <View key={ing} style={styles.flaggedChip}>
                      <Ionicons
                        name="warning-outline"
                        size={12}
                        color="#E87070"
                      />
                      <Text style={styles.flaggedChipText}>{ing}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}

            <Text style={styles.ingTitle}>All Ingredients</Text>
            <View style={styles.chipsRow}>
              {item.ingredients.map((ing) => (
                <View
                  key={ing}
                  style={[
                    styles.ingChip,
                    item.flagged_ingredients.includes(ing) &&
                      styles.ingChipFlagged,
                  ]}
                >
                  <Text
                    style={[
                      styles.ingChipText,
                      item.flagged_ingredients.includes(ing) &&
                        styles.ingChipTextFlagged,
                    ]}
                  >
                    {ing}
                  </Text>
                </View>
              ))}
            </View>
          </Animated.View>
        )}
      </GlassCard>
    </Animated.View>
  );
}

/* ---------------- MAIN SCREEN ---------------- */

export default function ProductScreen() {
  const insets = useSafeAreaInsets();

  const [logs, setLogs] = useState<ProductLog[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [productName, setProductName] = useState("");
  const [showManual, setShowManual] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLogs = async () => {
    try {
      const token = await AsyncStorage.getItem("skinova_token");

      const res = await API.get("/product/logs");


      const formatted = res.data.map((item: any) => ({
        ...item,
        timestamp: new Date(item.timestamp).toLocaleString(),
      }));

      setLogs(formatted);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchLogs();
    setRefreshing(false);
  }, []);

 const analyzeProduct = async (input: {
  imageUri?: string;
  text?: string;
  barcode?: string;
}) => {
  setAnalyzing(true);

  try {
    console.log("INPUT SENT:", input);

    const formData = new FormData();

    // ✅ TEXT
    if (input.text) {
      formData.append("text", input.text);
    }

    // ✅ IMAGE (CRITICAL FIX)
    if (input.imageUri) {
      formData.append("image", {
        uri: input.imageUri,
        name: "photo.jpg",
        type: "image/jpeg",
      } as any);
    }

    // ✅ BARCODE
    if (input.barcode) {
      formData.append("barcode", input.barcode);
    }

    // 🔥 IMPORTANT DEBUG
    console.log("FORM DATA:", formData);

    const res = await API.post("/product/analyze", formData);

    console.log("API RESPONSE:", res.data);

    setLogs((prev) => [
      {
        ...res.data,
        timestamp: "Just now",
      },
      ...prev,
    ]);
  } catch (err: any) {
    console.error("ERROR:", err?.response?.data || err);
    Alert.alert("Error", err?.response?.data?.detail || "Failed");
  }

  setAnalyzing(false);
};

  const handleCamera = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();

    if (!perm.granted) {
      Alert.alert("Permission needed");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({ quality: 0.6 });

    if (!result.canceled && result.assets[0]) {
      await analyzeProduct({ imageUri: result.assets[0].uri });
    }
  };

  const handleManual = async () => {
    if (!productName.trim()) return;

    setShowManual(false);

    await analyzeProduct({ text: productName });

    setProductName("");
  };

  return (
    <LinearGradient colors={["#1A1825", "#1E1B2E"]} style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16),
          paddingBottom: 100,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#B8A9E8"
          />
        }
      >
        <Animated.View entering={FadeInDown.springify()}>
          <Text style={styles.pageTitle}>Product Scanner</Text>
          <Text style={styles.pageSubtitle}>
            Check comedogenic score
          </Text>
        </Animated.View>

        {/* 🔥 SCAN UI BACK */}
        <GlassCard style={styles.scanCard}>
          <Text style={styles.scanLabel}>Scan a Product</Text>

          <View style={styles.scanGrid}>
            <ScanOption
              icon="camera-outline"
              label="Camera"
              onPress={handleCamera}
              color="#9B8AD4"
            />

            <ScanOption
              icon="barcode-outline"
              label="Barcode"
              onPress={() =>
                Alert.alert("Coming soon", "Barcode scanner soon")
              }
              color="#F0A896"
            />

            <ScanOption
              icon="search-outline"
              label="By Name"
              onPress={() => setShowManual(!showManual)}
              color="#7CC98A"
            />
          </View>

          {showManual && (
            <View style={styles.manualRow}>
              <View style={styles.manualInputRow}>
                <TextInput
                  style={styles.manualInput}
                  placeholder="Product name..."
                  placeholderTextColor="#605D72"
                  value={productName}
                  onChangeText={setProductName}
                />

                <Pressable onPress={handleManual} style={styles.sendBtn}>
                  <LinearGradient
                    colors={["#9B8AD4", "#B8A9E8"]}
                    style={styles.sendBtnGrad}
                  >
                    <Ionicons
                      name="arrow-forward"
                      size={18}
                      color="#fff"
                    />
                  </LinearGradient>
                </Pressable>
              </View>
            </View>
          )}

          {analyzing && (
            <View style={styles.analyzingRow}>
              <ActivityIndicator color="#B8A9E8" />
              <Text style={styles.analyzingText}>
                Analyzing ingredients...
              </Text>
            </View>
          )}
        </GlassCard>

        <Text style={styles.logsTitle}>Scan History</Text>

        {logs.map((log, i) => (
          <ProductCard key={log.id} item={log} index={i} />
        ))}
      </ScrollView>
    </LinearGradient>
  );
}

/* KEEP YOUR STYLES SAME (UNCHANGED) */
const styles = StyleSheet.create({
  scanCard: { marginBottom: 16 },
  scanLabel: { color: "#8B7AC9", marginBottom: 10 },
  scanGrid: { flexDirection: "row", gap: 12 },
  scanOption: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: "#2A273B",
    borderWidth: 1,
    alignItems: "center",
  },
  scanOptionIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  scanOptionLabel: { marginTop: 6 },
  manualRow: { marginTop: 16 },
  manualInputRow: { flexDirection: "row", gap: 10 },
  manualInput: {
    flex: 1,
    backgroundColor: "#2A273B",
    padding: 10,
    borderRadius: 10,
    color: "#fff",
  },
  sendBtn: { borderRadius: 10 },
  sendBtnGrad: { padding: 12 },
  analyzingRow: { flexDirection: "row", gap: 10, marginTop: 10 },
  analyzingText: { color: "#B8A9E8" },
  logsTitle: { color: "#fff", marginTop: 20 },
  pageTitle: { color: "#fff", fontSize: 24 },
  pageSubtitle: { color: "#aaa", marginBottom: 20 },
});