import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
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

const SKIN_TYPES   = ["Normal", "Dry", "Oily", "Combination", "Sensitive"];
const ALLERGEN_OPTIONS = [
  "Fragrance", "Parabens", "Sulfates", "Gluten", "Dairy",
  "Nuts", "Soy", "Shellfish", "Latex", "Nickel",
];

function SaveButton({ onPress, loading }: { onPress: () => void; loading: boolean }) {
  const scale = useSharedValue(1);
  const aStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View style={aStyle}>
      <Pressable
        onPressIn={() => { scale.value = withSpring(0.96); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        onPress={onPress}
        style={styles.saveBtn}
      >
        <LinearGradient colors={["#9B8AD4", "#B8A9E8"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.saveBtnGrad}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark" size={18} color="#fff" />
              <Text style={styles.saveBtnText}>Save Changes</Text>
            </>
          )}
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout, updateUser } = useAuth();

  // ── Editable state, pre-filled from user object ──────────────
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

  const bmi =
    height && weight
      ? (parseFloat(weight) / Math.pow(parseFloat(height) / 100, 2)).toFixed(1)
      : user?.bmi?.toFixed(1) ?? "--";

  const toggleAllergen = (a: string) => {
    Haptics.selectionAsync();
    setAllergens((prev) => prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]);
  };

  // ── Save to backend → MongoDB ─────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const payload = {
        name:                 name.trim(),
        height:               parseFloat(height) || user?.height || null,
        weight:               parseFloat(weight) || user?.weight || null,
        bmi:                  bmi !== "--" ? parseFloat(bmi) : user?.bmi || null,
        skin_type:            skinType,
        allergens,
        drugs,
        last_period_end_date: user?.gender === "female" ? (periodDate || null) : null,
      };

      // PUT /auth/profile — updates MongoDB
      const res = await API.put("/auth/profile", payload);
      await updateUser(res.data);   // update context so UI refreshes

      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err: any) {
      const msg = err?.response?.data?.detail || "Could not save changes.";
      setError(msg);
      Alert.alert("Error", msg);
    } finally {
      setSaving(false);
    }
  };

 const handleLogout = async () => {
  if (Platform.OS === "web") {
    const confirm = window.confirm("Are you sure you want to sign out?");
    if (!confirm) return;
    await logout();
    router.replace("/(auth)/signin");
  } else {
    Alert.alert("Sign Out", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/(auth)/signin");
        },
      },
    ]);
  }
};

  return (
    <LinearGradient colors={["#1A1825", "#1E1B2E"]} style={{ flex: 1 }}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[
          styles.container,
          {
            paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16),
            paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 100),
          },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Profile header — shows NAME from MongoDB ── */}
        <Animated.View entering={FadeInDown.delay(0).springify()} style={styles.profileHeader}>
          <LinearGradient
            colors={["#B8A9E8", "#F0A896"]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.avatarCircle}
          >
            <Ionicons name="person" size={28} color="#fff" />
          </LinearGradient>
          <View style={{ flex: 1 }}>
            {/* NAME shown here — pulled from MongoDB via AuthContext */}
            <Text style={styles.userName}>{user?.name || user?.email?.split("@")[0] || "User"}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
          </View>
          <View style={styles.genderBadge}>
            <Ionicons
              name={user?.gender === "female" ? "female" : "male"}
              size={14}
              color={user?.gender === "female" ? "#F0A896" : "#9B8AD4"}
            />
          </View>
        </Animated.View>

        {/* ── BMI Stats row ── */}
        <Animated.View entering={FadeInDown.delay(80).springify()}>
          <View style={styles.statsRow}>
            <StatBox label="Height" value={height ? `${height} cm` : "--"} icon="resize-outline"    color="#9B8AD4" />
            <StatBox label="Weight" value={weight ? `${weight} kg` : "--"} icon="barbell-outline"   color="#F0A896" />
            <StatBox label="BMI"    value={bmi}                             icon="analytics-outline" color="#7CC98A" />
          </View>
        </Animated.View>

        {/* ── Edit card ── */}
        <Animated.View entering={FadeInDown.delay(120).springify()}>
          <GlassCard style={styles.editCard}>

            {/* NAME field — editable */}
            <SectionLabel label="Full Name" />
            <FieldInput
              icon="person-outline"
              placeholder="Your full name"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />

            <SectionLabel label="Body Metrics" />
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <FieldInput icon="resize-outline" placeholder="Height (cm)" value={height} onChangeText={setHeight} keyboardType="numeric" />
              </View>
              <View style={{ width: 10 }} />
              <View style={{ flex: 1 }}>
                <FieldInput icon="barbell-outline" placeholder="Weight (kg)" value={weight} onChangeText={setWeight} keyboardType="numeric" />
              </View>
            </View>

            <SectionLabel label="Skin Type" />
            <View style={styles.chipsWrap}>
              {SKIN_TYPES.map((st) => (
                <Pressable
                  key={st}
                  onPress={() => { setSkinType(st); Haptics.selectionAsync(); }}
                  style={[styles.chip, skinType === st && styles.chipActive]}
                >
                  <Text style={[styles.chipText, skinType === st && styles.chipTextActive]}>{st}</Text>
                </Pressable>
              ))}
            </View>

            <SectionLabel label="Known Allergens" />
            <View style={styles.chipsWrap}>
              {ALLERGEN_OPTIONS.map((a) => (
                <Pressable
                  key={a}
                  onPress={() => toggleAllergen(a)}
                  style={[styles.chip, allergens.includes(a) && styles.chipDanger]}
                >
                  <Text style={[styles.chipText, allergens.includes(a) && styles.chipDangerText]}>{a}</Text>
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

            {/* Success banner */}
            {saved && (
              <Animated.View entering={FadeInDown.springify()} style={styles.savedBanner}>
                <Ionicons name="checkmark-circle" size={16} color="#7CC98A" />
                <Text style={styles.savedText}>Changes saved to your profile!</Text>
              </Animated.View>
            )}

            {/* Error banner */}
            {error ? (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle-outline" size={16} color="#E87070" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={{ marginTop: 8 }}>
              <SaveButton onPress={handleSave} loading={saving} />
            </View>
          </GlassCard>
        </Animated.View>

        {/* Logout */}
        <Animated.View entering={FadeInDown.delay(200).springify()}>
         <TouchableOpacity onPress={handleLogout} activeOpacity={0.7} style={styles.logoutBtn}>
            <Ionicons name="log-out-outline" size={18} color="#E87070" />
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>
        </Animated.View>

      </ScrollView>
    </LinearGradient>
  );
}

function SectionLabel({ label }: { label: string }) {
  return <Text style={styles.sectionLabel}>{label}</Text>;
}

function FieldInput({
  icon, placeholder, value, onChangeText, keyboardType, autoCapitalize,
}: {
  icon: string; placeholder: string; value: string;
  onChangeText: (t: string) => void; keyboardType?: any; autoCapitalize?: any;
}) {
  return (
    <View style={styles.inputWrapper}>
      <Ionicons name={icon as any} size={18} color="#8B7AC9" style={{ marginRight: 10 }} />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#605D72"
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize ?? "sentences"}
      />
    </View>
  );
}

function StatBox({ label, value, icon, color }: { label: string; value: string; icon: string; color: string }) {
  return (
    <View style={[styles.statBox, { borderColor: color + "30" }]}>
      <Ionicons name={icon as any} size={16} color={color} />
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container:        { paddingHorizontal: 20 },
  profileHeader:    { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 20 },
  avatarCircle:     { width: 60, height: 60, borderRadius: 20, justifyContent: "center", alignItems: "center" },
  userName:         { fontSize: 20, fontFamily: "Inter_700Bold", color: "#F0EEF8", textTransform: "capitalize", letterSpacing: -0.3 },
  userEmail:        { fontSize: 13, fontFamily: "Inter_400Regular", color: "#8B7AC9" },
  genderBadge:      { width: 36, height: 36, borderRadius: 12, backgroundColor: "rgba(48, 45, 68, 0.8)", justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "#3D3A52" },
  statsRow:         { flexDirection: "row", gap: 10, marginBottom: 20 },
  statBox:          { flex: 1, backgroundColor: "rgba(37, 34, 53, 0.9)", borderRadius: 16, padding: 14, alignItems: "center", gap: 6, borderWidth: 1 },
  statValue:        { fontSize: 15, fontFamily: "Inter_700Bold" },
  statLabel:        { fontSize: 11, fontFamily: "Inter_400Regular", color: "#605D72" },
  editCard:         { marginBottom: 16 },
  sectionLabel:     { fontSize: 11, fontFamily: "Inter_600SemiBold", color: "#8B7AC9", textTransform: "uppercase", letterSpacing: 1, marginTop: 16, marginBottom: 10 },
  row:              { flexDirection: "row" },
  inputWrapper:     { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(48, 45, 68, 0.8)", borderRadius: 14, borderWidth: 1, borderColor: "#3D3A52", paddingHorizontal: 14, height: 52, marginBottom: 8 },
  input:            { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular", color: "#F0EEF8" },
  chipsWrap:        { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 4 },
  chip:             { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: "rgba(48, 45, 68, 0.8)", borderWidth: 1, borderColor: "#3D3A52" },
  chipActive:       { backgroundColor: "rgba(139, 122, 201, 0.25)", borderColor: "#8B7AC9" },
  chipText:         { fontSize: 13, fontFamily: "Inter_500Medium", color: "#A8A5B8" },
  chipTextActive:   { color: "#B8A9E8" },
  chipDanger:       { backgroundColor: "rgba(232, 112, 112, 0.15)", borderColor: "#E87070" },
  chipDangerText:   { color: "#E87070" },
  savedBanner:      { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "rgba(124, 201, 138, 0.12)", borderRadius: 12, padding: 12, marginBottom: 12, marginTop: 4 },
  savedText:        { fontSize: 13, fontFamily: "Inter_400Regular", color: "#7CC98A" },
  errorBanner:      { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "rgba(232, 112, 112, 0.12)", borderRadius: 12, padding: 12, marginBottom: 12 },
  errorText:        { color: "#E87070", fontSize: 13, fontFamily: "Inter_400Regular", flex: 1 },
  saveBtn:          { borderRadius: 16, overflow: "hidden" },
  saveBtnGrad:      { height: 52, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8 },
  saveBtnText:      { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#fff" },
  logoutBtn:        { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 52, borderRadius: 16, backgroundColor: "rgba(232, 112, 112, 0.08)", borderWidth: 1, borderColor: "rgba(232, 112, 112, 0.2)", marginBottom: 32, pointerEvents: "auto",},
  logoutText:       { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#E87070" },
});