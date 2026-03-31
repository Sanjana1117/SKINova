import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { signupUser } from "../../services/authService";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";

const SKIN_TYPES = ["Normal", "Dry", "Oily", "Combination", "Sensitive"];
const ALLERGEN_OPTIONS = [
  "Fragrance", "Parabens", "Sulfates", "Gluten", "Dairy",
  "Nuts", "Soy", "Shellfish", "Latex", "Nickel",
];

function ActionButton({
  onPress, loading, label,
}: {
  onPress: () => void; loading: boolean; label: string;
}) {
  const scale = useSharedValue(1);
  const aStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View style={aStyle}>
      <Pressable
        onPressIn={() => { scale.value = withSpring(0.96); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        onPress={onPress}
        style={styles.actionBtn}
      >
        <LinearGradient colors={["#9B8AD4", "#B8A9E8"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.actionBtnGradient}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.actionBtnText}>{label}</Text>}
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

export default function SignUpScreen() {
  const insets = useSafeAreaInsets();
  const { login } = useAuth();

  // ── Form state ──────────────────────────────────────────────
  const [name, setName]                   = useState("");   // ← NEW
  const [email, setEmail]                 = useState("");
  const [password, setPassword]           = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [height, setHeight]               = useState("");
  const [weight, setWeight]               = useState("");
  const [gender, setGender]               = useState<"male" | "female">("female");
  const [periodDate, setPeriodDate]       = useState("");
  const [skinType, setSkinType]           = useState("Normal");
  const [drugs, setDrugs]                 = useState("");
  const [allergens, setAllergens]         = useState<string[]>([]);
  const [showPassword, setShowPassword]   = useState(false);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState("");

  const bmi =
    height && weight
      ? (parseFloat(weight) / Math.pow(parseFloat(height) / 100, 2)).toFixed(1)
      : null;

  const getBmiLabel = (bmiVal: number) => {
    if (bmiVal < 18.5) return { label: "Underweight", color: "#F0C86A" };
    if (bmiVal < 25)   return { label: "Normal",      color: "#7CC98A" };
    if (bmiVal < 30)   return { label: "Overweight",  color: "#F0C86A" };
    return               { label: "Obese",        color: "#E87070" };
  };

  const toggleAllergen = (a: string) => {
    Haptics.selectionAsync();
    setAllergens((prev) => prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]);
  };

  const validate = () => {
    if (!name.trim())                          return "Full name is required";
    if (!email.trim())                         return "Email is required";
    if (!password.trim() || password.length < 6) return "Password must be at least 6 characters";
    if (password !== confirmPassword)          return "Passwords do not match";
    if (!height.trim() || !weight.trim())      return "Height and weight are required";
    return null;
  };

  const handleSignUp = async () => {
    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setError("");
    setLoading(true);

    const userData = {
      name:                 name.trim(),          // ← NEW
      email:                email.trim(),
      password:             password,
      height:               height ? parseFloat(height) : null,
      weight:               weight ? parseFloat(weight) : null,
      bmi:                  bmi ? parseFloat(bmi) : null,
      gender:               gender || null,
      last_period_end_date: gender === "female" ? (periodDate || null) : null,
      skin_type:            skinType || null,
      drugs:                drugs ? drugs.trim() : "",
      allergens:            Array.isArray(allergens) ? allergens : [],
    };

    try {
      console.log("Sending to backend:", userData);
      const res = await signupUser(userData);
      console.log("Signup success:", res);

      if (res?.access_token) {
        await login(res.access_token, res.user);
      }

      router.replace("/(tabs)");
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.message || "Signup failed. Check backend connection.";
      setError(msg);
      console.log("BACKEND ERROR:", err?.response?.data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={["#1A1825", "#252235", "#1A1825"]} style={{ flex: 1 }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView
          contentContainerStyle={[
            styles.container,
            { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 20), paddingBottom: insets.bottom + 40 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Animated.View entering={FadeInDown.delay(50).springify()} style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={22} color="#B8A9E8" />
            </Pressable>
            <View style={styles.titleBlock}>
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>Start your skin journey</Text>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(100).springify()} style={styles.card}>

            {/* Error banner */}
            {error ? (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle-outline" size={16} color="#E87070" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* ── ACCOUNT SECTION ── */}
            <SectionLabel label="Account" />

            {/* NAME FIELD — NEW */}
            <InputField
              icon="person-outline"
              placeholder="Full name"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />

            <InputField
              icon="mail-outline"
              placeholder="Email address"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <InputField
              icon="lock-closed-outline"
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              rightIcon={
                <Pressable onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={18} color="#605D72" />
                </Pressable>
              }
            />
            <InputField
              icon="lock-closed-outline"
              placeholder="Confirm password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />

            {/* ── BODY METRICS ── */}
            <SectionLabel label="Body Metrics" />
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <InputField icon="resize-outline" placeholder="Height (cm)" value={height} onChangeText={setHeight} keyboardType="numeric" />
              </View>
              <View style={{ width: 12 }} />
              <View style={{ flex: 1 }}>
                <InputField icon="barbell-outline" placeholder="Weight (kg)" value={weight} onChangeText={setWeight} keyboardType="numeric" />
              </View>
            </View>

            {bmi ? (
              <Animated.View entering={FadeInDown.springify()} style={styles.bmiCard}>
                <View style={styles.bmiRow}>
                  <Text style={styles.bmiLabel}>BMI</Text>
                  <View style={styles.bmiValueRow}>
                    <Text style={styles.bmiValue}>{bmi}</Text>
                    <View style={[styles.bmiTag, { backgroundColor: getBmiLabel(parseFloat(bmi)).color + "22" }]}>
                      <Text style={[styles.bmiTagText, { color: getBmiLabel(parseFloat(bmi)).color }]}>
                        {getBmiLabel(parseFloat(bmi)).label}
                      </Text>
                    </View>
                  </View>
                </View>
              </Animated.View>
            ) : null}

            {/* ── GENDER ── */}
            <SectionLabel label="Gender" />
            <View style={styles.toggleRow}>
              {(["male", "female"] as const).map((g) => (
                <Pressable
                  key={g}
                  onPress={() => { setGender(g); Haptics.selectionAsync(); }}
                  style={[styles.toggleBtn, gender === g && styles.toggleBtnActive]}
                >
                  <Ionicons name={g === "male" ? "male-outline" : "female-outline"} size={16} color={gender === g ? "#fff" : "#A8A5B8"} />
                  <Text style={[styles.toggleBtnText, gender === g && styles.toggleBtnTextActive]}>
                    {g.charAt(0).toUpperCase() + g.slice(1)}
                  </Text>
                </Pressable>
              ))}
            </View>

            {gender === "female" && (
              <Animated.View entering={FadeInDown.springify()}>
                <SectionLabel label="Last Period End Date" />
                <InputField icon="calendar-outline" placeholder="YYYY-MM-DD" value={periodDate} onChangeText={setPeriodDate} />
              </Animated.View>
            )}

            {/* ── SKIN TYPE ── */}
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

            {/* ── ALLERGENS ── */}
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

            {/* ── MEDICATIONS ── */}
            <SectionLabel label="Current Medications" />
            <InputField icon="medkit-outline" placeholder="List any medications or supplements" value={drugs} onChangeText={setDrugs} />

            <View style={{ height: 8 }} />
            <ActionButton onPress={handleSignUp} loading={loading} label="Create Account" />

            <View style={styles.signinRow}>
              <Text style={styles.signinText}>Already have an account? </Text>
              <Pressable onPress={() => router.back()}>
                <Text style={styles.signinLink}>Sign In</Text>
              </Pressable>
            </View>

          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

function SectionLabel({ label }: { label: string }) {
  return <Text style={styles.sectionLabel}>{label}</Text>;
}

function InputField({
  icon, placeholder, value, onChangeText,
  secureTextEntry, keyboardType, autoCapitalize, rightIcon,
}: {
  icon: string; placeholder: string; value: string;
  onChangeText: (t: string) => void; secureTextEntry?: boolean;
  keyboardType?: any; autoCapitalize?: any; rightIcon?: React.ReactNode;
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
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize ?? "sentences"}
      />
      {rightIcon}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, paddingHorizontal: 20 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 24, gap: 16 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: "rgba(139, 122, 201, 0.15)", justifyContent: "center", alignItems: "center" },
  titleBlock: {},
  title: { fontSize: 26, fontFamily: "Inter_700Bold", color: "#F0EEF8", letterSpacing: -0.5 },
  subtitle: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#8B7AC9" },
  card: { backgroundColor: "rgba(37, 34, 53, 0.95)", borderRadius: 28, padding: 24, borderWidth: 1, borderColor: "rgba(184, 169, 232, 0.12)" },
  errorBanner: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "rgba(232, 112, 112, 0.12)", borderRadius: 12, padding: 12, marginBottom: 20 },
  errorText: { color: "#E87070", fontSize: 13, fontFamily: "Inter_400Regular", flex: 1 },
  sectionLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: "#8B7AC9", textTransform: "uppercase", letterSpacing: 1, marginTop: 20, marginBottom: 10 },
  row: { flexDirection: "row" },
  inputWrapper: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(48, 45, 68, 0.8)", borderRadius: 14, borderWidth: 1, borderColor: "#3D3A52", paddingHorizontal: 14, height: 52, marginBottom: 12 },
  input: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular", color: "#F0EEF8" },
  bmiCard: { backgroundColor: "rgba(139, 122, 201, 0.1)", borderRadius: 14, padding: 14, marginBottom: 4, borderWidth: 1, borderColor: "rgba(184, 169, 232, 0.15)" },
  bmiRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  bmiLabel: { fontSize: 13, fontFamily: "Inter_500Medium", color: "#A8A5B8" },
  bmiValueRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  bmiValue: { fontSize: 20, fontFamily: "Inter_700Bold", color: "#B8A9E8" },
  bmiTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  bmiTagText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  toggleRow: { flexDirection: "row", gap: 12, marginBottom: 4 },
  toggleBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 48, borderRadius: 14, backgroundColor: "rgba(48, 45, 68, 0.8)", borderWidth: 1, borderColor: "#3D3A52" },
  toggleBtnActive: { backgroundColor: "rgba(139, 122, 201, 0.3)", borderColor: "#8B7AC9" },
  toggleBtnText: { fontSize: 14, fontFamily: "Inter_500Medium", color: "#A8A5B8" },
  toggleBtnTextActive: { color: "#B8A9E8" },
  chipsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 4 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: "rgba(48, 45, 68, 0.8)", borderWidth: 1, borderColor: "#3D3A52" },
  chipActive: { backgroundColor: "rgba(139, 122, 201, 0.25)", borderColor: "#8B7AC9" },
  chipText: { fontSize: 13, fontFamily: "Inter_500Medium", color: "#A8A5B8" },
  chipTextActive: { color: "#B8A9E8" },
  chipDanger: { backgroundColor: "rgba(232, 112, 112, 0.15)", borderColor: "#E87070" },
  chipDangerText: { color: "#E87070" },
  actionBtn: { borderRadius: 16, overflow: "hidden" },
  actionBtnGradient: { height: 54, justifyContent: "center", alignItems: "center" },
  actionBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff", letterSpacing: 0.3 },
  signinRow: { flexDirection: "row", justifyContent: "center", marginTop: 20 },
  signinText: { fontSize: 14, fontFamily: "Inter_400Regular", color: "#605D72" },
  signinLink: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#B8A9E8" },
});