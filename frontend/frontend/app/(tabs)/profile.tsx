import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  ActivityIndicator, Alert, Platform, Pressable, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from "react-native";
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import API from "@/services/api";

const SKIN_TYPES   = ["Normal", "Dry", "Oily", "Combination", "Sensitive"];
const ALLERGEN_OPTIONS = [
  "Fragrance", "Parabens", "Sulfates", "Gluten", "Dairy",
  "Nuts", "Soy", "Shellfish", "Latex", "Nickel",
];

const SHADOW = Platform.OS === "web"
  ? ({ boxShadow: "0 4px 20px rgba(196,149,106,0.08)" } as any)
  : { shadowColor: "#C4956A", shadowOpacity: 0.08, shadowRadius: 16, shadowOffset: { width: 0, height: 4 }, elevation: 4 };

function SaveButton({ onPress, loading }: { onPress: () => void; loading: boolean }) {
  const scale = useSharedValue(1);
  const aStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View style={aStyle}>
      <Pressable
        onPressIn={() => { scale.value = withSpring(0.96); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        onPress={onPress}
        style={{ borderRadius: 16, overflow: "hidden" }}
      >
        <LinearGradient colors={["#C4956A", "#E8A598"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={st.saveBtnGrad}>
          {loading ? <ActivityIndicator color="#fff" /> : (
            <>
              <Ionicons name="checkmark" size={18} color="#fff" />
              <Text style={st.saveBtnText}>Save Changes</Text>
            </>
          )}
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

function SectionLabel({ label }: { label: string }) {
  return <Text style={st.sectionLabel}>{label}</Text>;
}

function FieldInput({ icon, placeholder, value, onChangeText, keyboardType, autoCapitalize }: {
  icon: string; placeholder: string; value: string;
  onChangeText: (t: string) => void; keyboardType?: any; autoCapitalize?: any;
}) {
  return (
    <View style={st.inputWrapper}>
      <Ionicons name={icon as any} size={16} color="#C4956A" style={{ marginRight: 10 }} />
      <TextInput
        style={st.input} placeholder={placeholder} placeholderTextColor="#C7BDB5"
        value={value} onChangeText={onChangeText} keyboardType={keyboardType}
        autoCapitalize={autoCapitalize ?? "sentences"}
      />
    </View>
  );
}

function StatBox({ label, value, icon, color }: { label: string; value: string; icon: string; color: string }) {
  return (
    <View style={[st.statBox, { borderColor: color + "30" }]}>
      <Ionicons name={icon as any} size={16} color={color} />
      <Text style={[st.statValue, { color }]}>{value}</Text>
      <Text style={st.statLabel}>{label}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout, updateUser } = useAuth();

  const [name, setName]           = useState(user?.name ?? "");
  const [height, setHeight]       = useState(String(user?.height ?? ""));
  const [weight, setWeight]       = useState(String(user?.weight ?? ""));
  const [skinType, setSkinType]   = useState(user?.skin_type ?? "Normal");
  const [allergens, setAllergens] = useState<string[]>(user?.allergens ?? []);
  const [drugs, setDrugs]         = useState(user?.drugs ?? "");
  const [periodDate, setPeriodDate] = useState(user?.last_period_end_date ?? "");
  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState(false);
  const [error, setError]         = useState("");

  const bmi = height && weight
    ? (parseFloat(weight) / Math.pow(parseFloat(height) / 100, 2)).toFixed(1)
    : user?.bmi?.toFixed(1) ?? "--";

  const toggleAllergen = (a: string) => {
    Haptics.selectionAsync();
    setAllergens((prev) => prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]);
  };

  const handleSave = async () => {
    setSaving(true); setError("");
    try {
      const payload = {
        name: name.trim(),
        height: parseFloat(height) || user?.height || null,
        weight: parseFloat(weight) || user?.weight || null,
        bmi: bmi !== "--" ? parseFloat(bmi) : user?.bmi || null,
        skin_type: skinType, allergens, drugs,
        last_period_end_date: user?.gender === "female" ? (periodDate || null) : null,
      };
      const res = await API.put("/auth/profile", payload);
      await updateUser(res.data);
      setSaved(true); setTimeout(() => setSaved(false), 2500);
    } catch (err: any) {
      const msg = err?.response?.data?.detail || "Could not save changes.";
      setError(msg); Alert.alert("Error", msg);
    } finally { setSaving(false); }
  };

  const handleLogout = async () => {
    if (Platform.OS === "web") {
      const confirm = window.confirm("Are you sure you want to sign out?");
      if (!confirm) return;
      await logout(); router.replace("/(auth)/signin");
    } else {
      Alert.alert("Sign Out", "Are you sure?", [
        { text: "Cancel", style: "cancel" },
        { text: "Sign Out", style: "destructive", onPress: async () => { await logout(); router.replace("/(auth)/signin"); } },
      ]);
    }
  };

  const initials = (user?.name || user?.email || "U").slice(0, 2).toUpperCase();

  return (
    <View style={{ flex: 1, backgroundColor: "#FEFCF9" }}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[st.container, { paddingTop: insets.top + (Platform.OS === "web" ? 28 : 16), paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 100) }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Hero banner */}
        <Animated.View entering={FadeInDown.delay(0).springify()}>
          <LinearGradient colors={["#C4956A", "#E8A598"]} style={st.heroBanner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <View style={st.heroCircle1} />
            <View style={st.heroCircle2} />
            <View style={st.heroAvatarWrap}>
              <View style={st.heroAvatar}>
                <Text style={st.heroAvatarText}>{initials}</Text>
              </View>
            </View>
            <Text style={st.heroName}>{user?.name || user?.email?.split("@")[0] || "User"}</Text>
            <Text style={st.heroEmail}>{user?.email}</Text>
            <View style={st.heroBadge}>
              <Ionicons name={user?.gender === "female" ? "female" : "male"} size={12} color="#C4956A" />
              <Text style={st.heroBadgeText}>{user?.skin_type || "Skin type not set"}</Text>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Stats */}
        <Animated.View entering={FadeInDown.delay(80).springify()}>
          <View style={st.statsRow}>
            <StatBox label="Height" value={height ? `${height} cm` : "--"} icon="resize-outline" color="#C4956A" />
            <StatBox label="Weight" value={weight ? `${weight} kg` : "--"} icon="barbell-outline" color="#8BAF9C" />
            <StatBox label="BMI"    value={bmi}                             icon="analytics-outline" color="#A89ACB" />
          </View>
        </Animated.View>

        {/* Edit form */}
        <Animated.View entering={FadeInDown.delay(120).springify()}>
          <View style={st.editCard}>
            <SectionLabel label="Full Name" />
            <FieldInput icon="person-outline" placeholder="Your full name" value={name} onChangeText={setName} autoCapitalize="words" />

            <SectionLabel label="Body Metrics" />
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}>
                <FieldInput icon="resize-outline" placeholder="Height (cm)" value={height} onChangeText={setHeight} keyboardType="numeric" />
              </View>
              <View style={{ flex: 1 }}>
                <FieldInput icon="barbell-outline" placeholder="Weight (kg)" value={weight} onChangeText={setWeight} keyboardType="numeric" />
              </View>
            </View>

            <SectionLabel label="Skin Type" />
            <View style={st.chipsWrap}>
              {SKIN_TYPES.map((st_) => (
                <Pressable key={st_} onPress={() => { setSkinType(st_); Haptics.selectionAsync(); }} style={[st.chip, skinType === st_ && st.chipActive]}>
                  <Text style={[st.chipText, skinType === st_ && st.chipTextActive]}>{st_}</Text>
                </Pressable>
              ))}
            </View>

            <SectionLabel label="Known Allergens" />
            <View style={st.chipsWrap}>
              {ALLERGEN_OPTIONS.map((a) => (
                <Pressable key={a} onPress={() => toggleAllergen(a)} style={[st.chip, allergens.includes(a) && st.chipDanger]}>
                  <Text style={[st.chipText, allergens.includes(a) && st.chipDangerText]}>{a}</Text>
                </Pressable>
              ))}
            </View>

            <SectionLabel label="Current Medications" />
            <FieldInput icon="medkit-outline" placeholder="Medications or supplements" value={drugs} onChangeText={setDrugs} />

            {user?.gender === "female" && (
              <>
                <SectionLabel label="Last Period End Date" />
                <FieldInput icon="calendar-outline" placeholder="YYYY-MM-DD" value={periodDate} onChangeText={setPeriodDate} />
              </>
            )}

            {saved && (
              <Animated.View entering={FadeInDown.springify()} style={st.savedBanner}>
                <Ionicons name="checkmark-circle" size={16} color="#8BAF9C" />
                <Text style={{ fontSize: 13, color: "#8BAF9C" }}>Changes saved to your profile!</Text>
              </Animated.View>
            )}
            {error ? (
              <View style={st.errorBanner}>
                <Ionicons name="alert-circle-outline" size={16} color="#D4856A" />
                <Text style={{ color: "#D4856A", fontSize: 13, flex: 1 }}>{error}</Text>
              </View>
            ) : null}

            <View style={{ marginTop: 8 }}>
              <SaveButton onPress={handleSave} loading={saving} />
            </View>
          </View>
        </Animated.View>

        {/* Logout */}
        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <TouchableOpacity onPress={handleLogout} activeOpacity={0.7} style={st.logoutBtn}>
            <Ionicons name="log-out-outline" size={18} color="#D4856A" />
            <Text style={st.logoutText}>Sign Out</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  container: { paddingHorizontal: 20 },

  heroBanner: { borderRadius: 24, padding: 28, alignItems: "center", marginBottom: 16, overflow: "hidden" },
  heroCircle1: { position: "absolute", width: 180, height: 180, borderRadius: 90, backgroundColor: "rgba(255,255,255,0.10)", top: -60, right: -40 },
  heroCircle2: { position: "absolute", width: 120, height: 120, borderRadius: 60, backgroundColor: "rgba(255,255,255,0.06)", bottom: -30, left: -30 },
  heroAvatarWrap: { marginBottom: 12 },
  heroAvatar: { width: 72, height: 72, borderRadius: 24, backgroundColor: "rgba(255,255,255,0.25)", justifyContent: "center", alignItems: "center", borderWidth: 2, borderColor: "rgba(255,255,255,0.50)" },
  heroAvatarText: { fontSize: 26, fontWeight: "800", color: "#fff" },
  heroName: { fontSize: 22, fontWeight: "800", color: "#fff", letterSpacing: -0.3, textTransform: "capitalize" },
  heroEmail: { fontSize: 13, color: "rgba(255,255,255,0.80)", marginTop: 4, marginBottom: 10 },
  heroBadge: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(255,255,255,0.95)", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  heroBadgeText: { fontSize: 12, fontWeight: "600", color: "#C4956A" },

  statsRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  statBox: { flex: 1, backgroundColor: "#FFFFFF", borderRadius: 16, padding: 14, alignItems: "center", gap: 5, borderWidth: 1, ...SHADOW },
  statValue: { fontSize: 16, fontWeight: "800" },
  statLabel: { fontSize: 10, color: "#A8A29E" },

  editCard: { backgroundColor: "#FFFFFF", borderRadius: 20, padding: 20, marginBottom: 14, borderWidth: 1, borderColor: "#F0EBE3", ...SHADOW },
  sectionLabel: { fontSize: 10, fontWeight: "700", color: "#C4956A", textTransform: "uppercase", letterSpacing: 1.2, marginTop: 16, marginBottom: 10 },
  inputWrapper: { flexDirection: "row", alignItems: "center", backgroundColor: "#FDF8F3", borderRadius: 14, borderWidth: 1.5, borderColor: "#F0EBE3", paddingHorizontal: 14, height: 52, marginBottom: 10 },
  input: { flex: 1, fontSize: 15, color: "#1C1917" },

  chipsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 4 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: "#FDF8F3", borderWidth: 1.5, borderColor: "#F0EBE3" },
  chipActive: { backgroundColor: "rgba(196,149,106,0.12)", borderColor: "#C4956A" },
  chipText: { fontSize: 13, fontWeight: "500", color: "#78716C" },
  chipTextActive: { color: "#C4956A" },
  chipDanger: { backgroundColor: "rgba(212,133,106,0.10)", borderColor: "#D4856A" },
  chipDangerText: { color: "#D4856A" },

  savedBanner: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "rgba(139,175,156,0.12)", borderRadius: 12, padding: 12, marginBottom: 12, marginTop: 4, borderWidth: 1, borderColor: "rgba(139,175,156,0.25)" },
  errorBanner: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "rgba(212,133,106,0.08)", borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: "rgba(212,133,106,0.20)" },
  saveBtnGrad: { height: 54, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8 },
  saveBtnText: { fontSize: 15, fontWeight: "700", color: "#fff" },

  logoutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 54, borderRadius: 16, backgroundColor: "rgba(212,133,106,0.06)", borderWidth: 1.5, borderColor: "rgba(212,133,106,0.20)", marginBottom: 32 },
  logoutText: { fontSize: 15, fontWeight: "600", color: "#D4856A" },
});