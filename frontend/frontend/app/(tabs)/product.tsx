// app/(tabs)/product.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator, Alert, Image, Modal, Platform, Pressable,
  RefreshControl, ScrollView, StyleSheet, Switch, Text, TextInput, View,
} from "react-native";
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GlassCard } from "@/components/GlassCard";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8000";

async function apiFetch(path: string, options: RequestInit = {}) {
  const token = await AsyncStorage.getItem("skinova_token");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const res = await fetch(`${BASE_URL}${normalizedPath}`, {
    ...options,
    headers: { Authorization: `Bearer ${token}`, ...(options.headers || {}) },
  });
  if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.detail || `API ${res.status}`); }
  return res.json().catch(() => ({}));
}

function resolveMimeType(uri: string, pickerMime?: string): string {
  if (pickerMime && pickerMime.startsWith("image/")) return pickerMime;
  const ext = uri.split("?")[0].split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", heic: "image/heic", heif: "image/heif", gif: "image/gif", bmp: "image/bmp", tiff: "image/tiff", tif: "image/tiff" };
  return map[ext] ?? "image/jpeg";
}

function scoreColor(s: number) { if (s >= 4) return "#D4856A"; if (s >= 3) return "#C4956A"; if (s >= 2) return "#A89ACB"; return "#8BAF9C"; }
function scoreLabel(s: number) { if (s >= 4) return "High risk"; if (s >= 3) return "Moderate"; if (s >= 2) return "Low-moderate"; return "Safe"; }

const SHADOW = Platform.OS === "web"
  ? ({ boxShadow: "0 4px 20px rgba(196,149,106,0.08)" } as any)
  : { shadowColor: "#C4956A", shadowOpacity: 0.08, shadowRadius: 16, shadowOffset: { width: 0, height: 4 }, elevation: 4 };

function ComedogenicBar({ score }: { score: number }) {
  const fill = useSharedValue(0);
  const color = scoreColor(score);
  useEffect(() => { fill.value = withSpring(score / 5, { damping: 14 }); }, [score]);
  const fillStyle = useAnimatedStyle(() => ({ width: `${fill.value * 100}%` as any, backgroundColor: color }));
  return (
    <View style={st.barWrap}>
      <View style={st.barBg}><Animated.View style={[st.barFill, fillStyle]} /></View>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 5 }}>
        <Text style={st.barEndLabel}>Non-comedogenic</Text>
        <Text style={[st.barScore, { color }]}>{score.toFixed(1)}/5</Text>
        <Text style={st.barEndLabel}>High risk</Text>
      </View>
    </View>
  );
}

function ProductCard({ item, index, onEdit, onDelete, onToggleActive }: { item: any; index: number; onEdit: (item: any) => void; onDelete: (id: string) => void; onToggleActive: (id: string, val: boolean) => void }) {
  const [expanded, setExpanded] = useState(false);
  const color = scoreColor(item.comedogenic_score);
  const sourceBadge =
    item.source === "vision" ? "📷 Read from photo" :
    item.source === "vision+llm" ? "📷 Photo + AI lookup" :
    item.source === "llm" ? "✨ AI identified" :
    item.source === "manual" ? "✏️ Manual entry" :
    item.source === "open_beauty_facts" ? "🔍 Database" : null;
  return (
    <Animated.View entering={FadeInDown.delay(index * 60).springify()}>
      <View style={[st.card, !item.is_active && { opacity: 0.65 }]}>
        <Pressable onPress={() => { setExpanded(!expanded); Haptics.selectionAsync(); }}>
          <View style={st.cardHeader}>
            <View style={[st.scoreBadge, { backgroundColor: color + "15", borderColor: color + "40" }]}>
              <Text style={[st.scoreBadgeNum, { color }]}>{item.comedogenic_score.toFixed(1)}</Text>
              <Text style={st.scoreBadgeLabel}>C-Score</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Text style={[st.productName, !item.is_active && { color: "#A8A29E" }]} numberOfLines={1}>{item.product_name}</Text>
                {!item.is_active && <View style={st.inactivePill}><Text style={st.inactivePillText}>Inactive</Text></View>}
              </View>
              {item.brand ? <Text style={st.brand}>{item.brand}</Text> : null}
              <Text style={[st.riskLabel, { color }]}>{scoreLabel(item.comedogenic_score)}</Text>
            </View>
            <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={16} color="#C7BDB5" />
          </View>
          <ComedogenicBar score={item.comedogenic_score} />
        </Pressable>
        {expanded && (
          <Animated.View entering={FadeInDown.springify()} style={{ marginTop: 14 }}>
            {(sourceBadge || item.llm_confidence) && (
              <View style={st.confidenceBadge}>
                <Ionicons name="sparkles-outline" size={11} color="#C4956A" />
                <Text style={st.confidenceText}>{sourceBadge}{item.llm_confidence ? ` · ${item.llm_confidence} confidence` : ""}</Text>
                {item.llm_notes ? <Text style={st.llmNotes}>{item.llm_notes}</Text> : null}
              </View>
            )}
            {item.personalized_triggers?.length > 0 && (
              <>
                <Text style={st.ingSection}>🎯 Your Personal Triggers</Text>
                {item.personalized_triggers.map((t: any, i: number) => (
                  <View key={i} style={st.triggerRow}>
                    <View style={[st.triggerSeverityDot, { backgroundColor: t.severity === "high" ? "#D4856A" : t.severity === "medium" ? "#C4956A" : "#8BAF9C" }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={st.triggerIngredient}>{t.ingredient}</Text>
                      <Text style={st.triggerReason}>{t.reason}</Text>
                    </View>
                  </View>
                ))}
                <View style={st.divider} />
              </>
            )}
            <View style={st.actionRow}>
              <Pressable style={st.actionBtn} onPress={() => onEdit(item)}>
                <Ionicons name="pencil-outline" size={14} color="#C4956A" />
                <Text style={st.actionBtnText}>Edit</Text>
              </Pressable>
              <View style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 8 }}>
                <Text style={{ fontSize: 11, color: "#A8A29E" }}>{item.is_active ? "In use" : "Not in use"}</Text>
                <Switch value={item.is_active} onValueChange={(v) => onToggleActive(item.id, v)} trackColor={{ false: "#F0EBE3", true: "rgba(196,149,106,0.35)" }} thumbColor={item.is_active ? "#C4956A" : "#C7BDB5"} />
              </View>
              <Pressable style={[st.actionBtn, { backgroundColor: "rgba(212,133,106,0.08)" }]} onPress={() => onDelete(item.id)}>
                <Ionicons name="trash-outline" size={14} color="#D4856A" />
                <Text style={[st.actionBtnText, { color: "#D4856A" }]}>Delete</Text>
              </Pressable>
            </View>
            <View style={st.divider} />
            {item.flagged_ingredients?.length > 0 && (
              <>
                <Text style={st.ingSection}>⚠ Flagged Ingredients</Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                  {item.flagged_ingredients.map((ing: string) => (
                    <View key={ing} style={st.flagChip}>
                      <Ionicons name="warning-outline" size={10} color="#D4856A" />
                      <Text style={st.flagChipText}>{ing}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}
            {item.ingredients?.length > 0 && (
              <>
                <Text style={st.ingSection}>All Ingredients</Text>
                <Text style={st.ingText}>{item.ingredients.slice(0, 30).join(" · ")}{item.ingredients.length > 30 ? ` +${item.ingredients.length - 30} more` : ""}</Text>
              </>
            )}
            {item.barcode ? <Text style={st.barcodeText}>Barcode: {item.barcode}</Text> : null}
          </Animated.View>
        )}
      </View>
    </Animated.View>
  );
}

type AddMode = "name" | "barcode" | "photo" | "manual";

function AddProductModal({ visible, onClose, onAdded }: { visible: boolean; onClose: () => void; onAdded: () => void }) {
  const [mode, setMode] = useState<AddMode>("name");
  const [barcode, setBarcode] = useState("");
  const [name, setName] = useState("");
  const [ingText, setIngText] = useState("");
  const [pickedImage, setPickedImage] = useState<{ uri: string; mimeType: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function reset() { setBarcode(""); setName(""); setIngText(""); setPickedImage(null); setError(""); setMode("name"); }

  async function handleCamera() {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) { Alert.alert("Permission needed", "Camera access is required."); return; }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.85, base64: false });
    if (!result.canceled && result.assets[0]) { const asset = result.assets[0]; setPickedImage({ uri: asset.uri, mimeType: resolveMimeType(asset.uri, asset.mimeType ?? undefined) }); setError(""); }
  }
  async function handleGallery() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert("Permission needed", "Photo library access is required."); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.85, base64: false });
    if (!result.canceled && result.assets[0]) { const asset = result.assets[0]; setPickedImage({ uri: asset.uri, mimeType: resolveMimeType(asset.uri, asset.mimeType ?? undefined) }); setError(""); }
  }

  async function submit() {
    setLoading(true); setError("");
    try {
      const fd = new FormData();
      if (mode === "barcode") {
        if (!barcode.trim()) { setError("Please enter a barcode number."); setLoading(false); return; }
        fd.append("barcode", barcode.trim());
      } else if (mode === "name") {
        if (!name.trim()) { setError("Please enter a product name."); setLoading(false); return; }
        fd.append("text", name.trim());
      } else if (mode === "photo") {
        if (!pickedImage) { setError("Please select or take a photo first."); setLoading(false); return; }
        const mimeType = resolveMimeType(pickedImage.uri, pickedImage.mimeType);
        const ext = pickedImage.uri.split("?")[0].split(".").pop()?.toLowerCase() ?? "jpg";
        fd.append("image", { uri: pickedImage.uri, name: `product_label.${ext}`, type: mimeType } as any);
        if (name.trim()) fd.append("text", name.trim());
      } else if (mode === "manual") {
        if (!ingText.trim()) { setError("Please enter at least one ingredient."); setLoading(false); return; }
        fd.append("text", name.trim() || "Manual Product");
        fd.append("manual_ingredients", ingText.trim());
      }
      await apiFetch("/api/product/add", { method: "POST", body: fd });
      reset(); onClose(); onAdded();
    } catch (e: any) { setError(e.message || "Failed to add product."); }
    finally { setLoading(false); }
  }

  const tabs: { key: AddMode; label: string; icon: string }[] = [
    { key: "name", label: "By Name", icon: "search-outline" },
    { key: "barcode", label: "Barcode", icon: "barcode-outline" },
    { key: "photo", label: "Photo", icon: "camera-outline" },
    { key: "manual", label: "Manual", icon: "list-outline" },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={st.modalOverlay} onPress={onClose}>
        <Pressable style={st.modalSheet} onPress={() => {}}>
          <View style={st.modalHandle} />
          <Text style={st.modalTitle}>Add Product</Text>
          <View style={{ flexDirection: "row", gap: 6, marginBottom: 16 }}>
            {tabs.map((t) => (
              <Pressable key={t.key} style={[st.modeTab, mode === t.key && st.modeTabActive]} onPress={() => { setMode(t.key); setError(""); setPickedImage(null); }}>
                <Ionicons name={t.icon as any} size={13} color={mode === t.key ? "#C4956A" : "#A8A29E"} />
                <Text style={[{ fontSize: 11, color: "#A8A29E", fontWeight: "500" }, mode === t.key && { color: "#C4956A" }]}>{t.label}</Text>
              </Pressable>
            ))}
          </View>

          {mode === "name" && <TextInput style={st.input} placeholder="e.g. Cetaphil moisturiser..." placeholderTextColor="#C7BDB5" value={name} onChangeText={setName} />}
          {mode === "barcode" && <TextInput style={st.input} placeholder="Enter barcode number..." placeholderTextColor="#C7BDB5" value={barcode} onChangeText={setBarcode} keyboardType="numeric" />}
          {mode === "photo" && (
            <View>
              <Text style={{ fontSize: 12, color: "#A8A29E", lineHeight: 17, marginBottom: 12 }}>Take or pick a photo of the product label. Supports JPG, PNG, WEBP, HEIC and more.</Text>
              {pickedImage ? (
                <View style={{ position: "relative", marginBottom: 4 }}>
                  <Image source={{ uri: pickedImage.uri }} style={{ width: "100%", height: 180, borderRadius: 14, backgroundColor: "#FDF8F3" }} resizeMode="contain" />
                  <Pressable style={{ position: "absolute", top: 6, right: 6 }} onPress={() => setPickedImage(null)}>
                    <Ionicons name="close-circle" size={24} color="#D4856A" />
                  </Pressable>
                </View>
              ) : (
                <View style={{ flexDirection: "row", gap: 10 }}>
                  {Platform.OS !== "web" && (
                    <Pressable style={st.photoBtn} onPress={handleCamera}>
                      <Ionicons name="camera-outline" size={22} color="#C4956A" />
                      <Text style={{ fontSize: 14, color: "#C4956A", fontWeight: "500" }}>Camera</Text>
                    </Pressable>
                  )}
                  <Pressable style={st.photoBtn} onPress={handleGallery}>
                    <Ionicons name="images-outline" size={22} color="#C4956A" />
                    <Text style={{ fontSize: 14, color: "#C4956A", fontWeight: "500" }}>Gallery</Text>
                  </Pressable>
                </View>
              )}
              <TextInput style={[st.input, { marginTop: 12 }]} placeholder="Product name hint (optional)" placeholderTextColor="#C7BDB5" value={name} onChangeText={setName} />
            </View>
          )}
          {mode === "manual" && (
            <>
              <TextInput style={st.input} placeholder="Product name..." placeholderTextColor="#C7BDB5" value={name} onChangeText={setName} />
              <TextInput style={[st.input, { height: 100, textAlignVertical: "top" }]} placeholder="Paste ingredient list, comma separated..." placeholderTextColor="#C7BDB5" value={ingText} onChangeText={setIngText} multiline numberOfLines={4} />
            </>
          )}

          {error ? <Text style={{ color: "#D4856A", fontSize: 12, marginBottom: 10 }}>{error}</Text> : null}
          <Pressable style={[{ borderRadius: 14, overflow: "hidden" }, loading && { opacity: 0.7 }]} onPress={submit} disabled={loading}>
            <LinearGradient colors={["#C4956A", "#E8A598"]} style={{ padding: 15, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8 }} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              {loading ? <ActivityIndicator color="#fff" size="small" /> : null}
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 14 }}>{loading ? (mode === "photo" ? "Analysing image..." : "Adding product...") : "Add Product"}</Text>
            </LinearGradient>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function EditProductModal({ item, onClose, onSaved }: { item: any; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(item?.product_name || "");
  const [ingText, setIngText] = useState(item?.ingredients?.join(", ") || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  async function save() {
    setLoading(true); setError("");
    try {
      await apiFetch(`/api/product/update/${item.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ product_name: name.trim() || undefined, ingredients: ingText.trim() || undefined }) });
      onClose(); onSaved();
    } catch (e: any) { setError(e.message || "Failed to save."); }
    finally { setLoading(false); }
  }
  return (
    <Modal visible={!!item} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={st.modalOverlay} onPress={onClose}>
        <Pressable style={st.modalSheet} onPress={() => {}}>
          <View style={st.modalHandle} />
          <Text style={st.modalTitle}>Edit Product</Text>
          <Text style={{ fontSize: 11, color: "#A8A29E", fontWeight: "600", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>Product name</Text>
          <TextInput style={st.input} value={name} onChangeText={setName} placeholderTextColor="#C7BDB5" />
          <Text style={{ fontSize: 11, color: "#A8A29E", fontWeight: "600", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>Ingredients (comma separated)</Text>
          <TextInput style={[st.input, { height: 120, textAlignVertical: "top" }]} value={ingText} onChangeText={setIngText} multiline numberOfLines={5} placeholderTextColor="#C7BDB5" />
          {error ? <Text style={{ color: "#D4856A", fontSize: 12, marginBottom: 10 }}>{error}</Text> : null}
          <Pressable style={{ borderRadius: 14, overflow: "hidden" }} onPress={save} disabled={loading}>
            <LinearGradient colors={["#C4956A", "#E8A598"]} style={{ padding: 15, alignItems: "center" }} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: "#fff", fontWeight: "700", fontSize: 14 }}>Save Changes</Text>}
            </LinearGradient>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default function ProductScreen() {
  const insets = useSafeAreaInsets();
  const [products, setProducts]   = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAdd, setShowAdd]     = useState(false);
  const [editItem, setEditItem]   = useState<any>(null);

  const fetchProducts = async () => {
    try { const data = await apiFetch("/api/product/list"); setProducts(Array.isArray(data) ? data : []); }
    catch (e) { console.error("[Products] fetch failed:", e); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchProducts(); }, []);
  const onRefresh = useCallback(async () => { setRefreshing(true); await fetchProducts(); setRefreshing(false); }, []);

  async function handleDelete(id: string) {
    Alert.alert("Remove Product", "Remove this product from your registry?", [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: async () => {
        try { await apiFetch(`/api/product/delete/${id}`, { method: "DELETE" }); setProducts((prev) => prev.filter((p) => p.id !== id)); }
        catch (e: any) { Alert.alert("Error", e.message || "Failed to delete product."); await fetchProducts(); }
      }},
    ]);
  }
  async function handleToggleActive(id: string, val: boolean) {
    try {
      await apiFetch(`/api/product/update/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ is_active: val }) });
      setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, is_active: val } : p)));
    } catch (e: any) { Alert.alert("Error", e.message || "Failed to update product."); }
  }

  const activeProducts = products.filter((p) => p.is_active);
  const inactiveProducts = products.filter((p) => !p.is_active);
  const maxScore = activeProducts.reduce((m, p) => Math.max(m, p.comedogenic_score), 0);
  const overallRisk = activeProducts.length > 0 ? Math.round((maxScore / 5) * 100) : null;

  return (
    <View style={{ flex: 1, backgroundColor: "#FEFCF9" }}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: insets.top + (Platform.OS === "web" ? 28 : 16), paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#C4956A" />}
      >
        <Animated.View entering={FadeInDown.delay(0).springify()}>
          <View style={st.pageHeader}>
            <View>
              <Text style={st.pageTitle}>My Products</Text>
              <Text style={st.pageSubtitle}>Registered skincare products</Text>
            </View>
            <Pressable style={st.addBtn} onPress={() => setShowAdd(true)}>
              <LinearGradient colors={["#C4956A", "#E8A598"]} style={st.addBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Ionicons name="add" size={18} color="#fff" />
                <Text style={{ color: "#fff", fontWeight: "700", fontSize: 13 }}>Add</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </Animated.View>

        {products.length > 0 && (
          <Animated.View entering={FadeInDown.delay(40).springify()}>
            <View style={[st.card, { marginBottom: 16 }]}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-around" }}>
                {[
                  [String(activeProducts.length), "Active"],
                  [maxScore.toFixed(1), "Highest C-Score"],
                  [overallRisk !== null ? String(overallRisk) : "–", "Risk Score"],
                ].map(([v, l], i) => (
                  <React.Fragment key={l}>
                    {i > 0 && <View style={{ width: 1, height: 36, backgroundColor: "#F0EBE3" }} />}
                    <View style={{ alignItems: "center" }}>
                      <Text style={[{ fontSize: 22, fontWeight: "800" }, i === 1 && { color: scoreColor(maxScore) }, i === 2 && overallRisk !== null && { color: scoreColor(overallRisk / 20) }]}>{v}</Text>
                      <Text style={{ fontSize: 10, color: "#A8A29E", marginTop: 2 }}>{l}</Text>
                    </View>
                  </React.Fragment>
                ))}
              </View>
              {maxScore >= 3 && (
                <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 8, marginTop: 12, padding: 10, backgroundColor: "rgba(196,149,106,0.08)", borderRadius: 10 }}>
                  <Ionicons name="warning-outline" size={13} color="#C4956A" />
                  <Text style={{ flex: 1, fontSize: 12, color: "#C4956A", lineHeight: 17 }}>One or more active products may be clogging pores. The AI forecast includes this.</Text>
                </View>
              )}
            </View>
          </Animated.View>
        )}

        {loading ? <ActivityIndicator color="#C4956A" style={{ marginTop: 40 }} /> :
          products.length === 0 ? (
            <Animated.View entering={FadeInDown.delay(60).springify()}>
              <View style={{ alignItems: "center", paddingVertical: 48, gap: 12 }}>
                <View style={{ width: 80, height: 80, borderRadius: 24, backgroundColor: "#FDF8F3", justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "#F0EBE3" }}>
                  <Ionicons name="flask-outline" size={32} color="#C4956A" />
                </View>
                <Text style={{ fontSize: 16, fontWeight: "700", color: "#1C1917" }}>No products yet</Text>
                <Text style={{ fontSize: 13, color: "#A8A29E", textAlign: "center", lineHeight: 20, paddingHorizontal: 32 }}>Add your skincare products and Skinova will factor their ingredients into your daily forecast.</Text>
                <Pressable onPress={() => setShowAdd(true)} style={{ borderRadius: 14, overflow: "hidden", marginTop: 4 }}>
                  <LinearGradient colors={["#C4956A","#E8A598"]} style={{ paddingHorizontal: 24, paddingVertical: 12 }} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                    <Text style={{ color: "#fff", fontWeight: "700", fontSize: 14 }}>Add your first product</Text>
                  </LinearGradient>
                </Pressable>
              </View>
            </Animated.View>
          ) : (
            <>
              {activeProducts.length > 0 && (
                <>
                  <Text style={st.sectionLabel}>Currently Using</Text>
                  {activeProducts.map((p, i) => <ProductCard key={p.id} item={p} index={i} onEdit={setEditItem} onDelete={handleDelete} onToggleActive={handleToggleActive} />)}
                </>
              )}
              {inactiveProducts.length > 0 && (
                <>
                  <Text style={[st.sectionLabel, { marginTop: 8 }]}>Not in Use</Text>
                  {inactiveProducts.map((p, i) => <ProductCard key={p.id} item={p} index={i} onEdit={setEditItem} onDelete={handleDelete} onToggleActive={handleToggleActive} />)}
                </>
              )}
            </>
          )}
      </ScrollView>

      <AddProductModal visible={showAdd} onClose={() => setShowAdd(false)} onAdded={fetchProducts} />
      {editItem && <EditProductModal item={editItem} onClose={() => setEditItem(null)} onSaved={async () => { setEditItem(null); await fetchProducts(); }} />}
    </View>
  );
}

const st = StyleSheet.create({
  pageHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  pageTitle: { fontSize: 26, fontWeight: "800", color: "#1C1917", letterSpacing: -0.5 },
  pageSubtitle: { fontSize: 13, color: "#A8A29E", marginTop: 2 },
  addBtn: { borderRadius: 12, overflow: "hidden" },
  addBtnGrad: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 14, paddingVertical: 10 },

  card: { backgroundColor: "#FFFFFF", borderRadius: 20, padding: 16, borderWidth: 1, borderColor: "#F0EBE3", ...SHADOW },
  sectionLabel: { fontSize: 10, fontWeight: "700", color: "#C4956A", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1.2, marginTop: 4 },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 10 },
  scoreBadge: { width: 56, height: 56, borderRadius: 16, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  scoreBadgeNum: { fontSize: 18, fontWeight: "800" },
  scoreBadgeLabel: { fontSize: 9, color: "#A8A29E" },
  productName: { fontSize: 14, fontWeight: "700", color: "#1C1917", flex: 1 },
  brand: { fontSize: 11, color: "#A8A29E", marginTop: 1 },
  riskLabel: { fontSize: 11, fontWeight: "600", marginTop: 3 },
  inactivePill: { backgroundColor: "#F0EBE3", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  inactivePillText: { fontSize: 9, color: "#A8A29E", fontWeight: "600" },
  barWrap: { marginTop: 4 },
  barBg: { height: 6, borderRadius: 3, backgroundColor: "#F0EBE3", overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 3 },
  barEndLabel: { fontSize: 9, color: "#C7BDB5" },
  barScore: { fontSize: 11, fontWeight: "600" },
  confidenceBadge: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(196,149,106,0.08)", borderRadius: 10, padding: 10, marginBottom: 12, flexWrap: "wrap" },
  confidenceText: { fontSize: 11, color: "#C4956A", fontWeight: "500" },
  llmNotes: { fontSize: 10, color: "#A8A29E", width: "100%", marginTop: 2 },
  triggerRow: { flexDirection: "row", alignItems: "flex-start", gap: 8, marginBottom: 8 },
  triggerSeverityDot: { width: 8, height: 8, borderRadius: 4, marginTop: 3 },
  triggerIngredient: { fontSize: 12, fontWeight: "700", color: "#1C1917" },
  triggerReason: { fontSize: 11, color: "#A8A29E", lineHeight: 16 },
  actionRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10, backgroundColor: "rgba(196,149,106,0.08)" },
  actionBtnText: { fontSize: 12, fontWeight: "500", color: "#C4956A" },
  divider: { height: 1, backgroundColor: "#F0EBE3", marginVertical: 12 },
  ingSection: { fontSize: 11, fontWeight: "700", color: "#C4956A", marginBottom: 6 },
  flagChip: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(212,133,106,0.08)", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  flagChipText: { fontSize: 11, color: "#D4856A" },
  ingText: { fontSize: 11, color: "#78716C", lineHeight: 17 },
  barcodeText: { fontSize: 10, color: "#C7BDB5", marginTop: 6 },

  modalOverlay: { flex: 1, backgroundColor: "rgba(28,25,23,0.40)", justifyContent: "flex-end" },
  modalSheet: { backgroundColor: "#FFFFFF", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 22, paddingBottom: 40 },
  modalHandle: { width: 36, height: 4, backgroundColor: "#F0EBE3", borderRadius: 2, alignSelf: "center", marginBottom: 18 },
  modalTitle: { fontSize: 18, fontWeight: "800", color: "#1C1917", marginBottom: 16 },
  modeTab: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, paddingVertical: 9, borderRadius: 10, backgroundColor: "#FDF8F3", borderWidth: 1.5, borderColor: "#F0EBE3" },
  modeTabActive: { backgroundColor: "rgba(196,149,106,0.08)", borderColor: "#C4956A" },
  photoBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderWidth: 1.5, borderColor: "rgba(196,149,106,0.30)", borderRadius: 12, paddingVertical: 16, backgroundColor: "rgba(196,149,106,0.04)" },
  input: { backgroundColor: "#FDF8F3", borderRadius: 12, padding: 13, color: "#1C1917", fontSize: 14, marginBottom: 12, borderWidth: 1.5, borderColor: "#F0EBE3" },
});