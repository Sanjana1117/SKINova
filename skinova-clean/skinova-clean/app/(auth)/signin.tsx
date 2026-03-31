import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import { loginUser } from "@/services/authService";
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

function LoginButton({
  onPress,
  loading,
}: {
  onPress: () => void;
  loading: boolean;
}) {
  const scale = useSharedValue(1);
  const aStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={aStyle}>
      <Pressable
        onPressIn={() => {
          scale.value = withSpring(0.96);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }}
        onPressOut={() => {
          scale.value = withSpring(1);
        }}
        onPress={onPress}
        style={styles.loginBtn}
      >
        <LinearGradient
          colors={["#9B8AD4", "#B8A9E8"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.loginBtnGradient}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.loginBtnText}>Sign In</Text>
          )}
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

export default function SignInScreen() {
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");



const handleSignIn = async () => {
  if (!email.trim() || !password.trim()) {
    setError("Please fill in all fields");
    return;
  }

  setError("");
  setLoading(true);

  try {
    const res = await loginUser({
      email,
      password,
    });

    const token = res.access_token; // ✅ FIXED
    const user = res.user;

    if (!token || !user) {
      throw new Error("Invalid response from backend");
    }

    // 🔥 THIS syncs everything
    await login(token, user);

    router.replace("/(tabs)");

  } catch (err: any) {
    console.log("Login error:", err);
    setError(
      err?.response?.data?.detail || "Invalid email or password"
    );
  } finally {
    setLoading(false);
  }
};

  return (
    <LinearGradient
      colors={["#1A1825", "#252235", "#1A1825"]}
      style={{ flex: 1 }}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={[
            styles.container,
            { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 32 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.logoSection}>
            <LinearGradient
              colors={["#B8A9E8", "#F0A896"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logoCircle}
            >
              <Ionicons name="sparkles" size={32} color="#fff" />
            </LinearGradient>
            <Text style={styles.appName}>Skinova</Text>
            <Text style={styles.tagline}>Your AI Skin Intelligence</Text>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(200).springify()} style={styles.card}>
            <Text style={styles.cardTitle}>Welcome back</Text>
            <Text style={styles.cardSubtitle}>Sign in to your account</Text>

            {error ? (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle-outline" size={16} color="#E87070" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={18} color="#8B7AC9" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="you@example.com"
                  placeholderTextColor="#605D72"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={18} color="#8B7AC9" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Your password"
                  placeholderTextColor="#605D72"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                  <Ionicons
                    name={showPassword ? "eye-outline" : "eye-off-outline"}
                    size={18}
                    color="#605D72"
                  />
                </Pressable>
              </View>
            </View>

            <LoginButton onPress={handleSignIn} loading={loading} />

            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <Pressable onPress={() => router.push("/(auth)/signup")}>
                <Text style={styles.footerLink}>Sign Up</Text>
              </Pressable>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  logoSection: {
    alignItems: "center",
    marginBottom: 48,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  appName: {
    fontSize: 32,
    fontFamily: "Inter_700Bold",
    color: "#F0EEF8",
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "#8B7AC9",
    marginTop: 4,
  },
  card: {
    width: "100%",
    backgroundColor: "rgba(37, 34, 53, 0.9)",
    borderRadius: 28,
    padding: 28,
    borderWidth: 1,
    borderColor: "rgba(184, 169, 232, 0.15)",
  },
  cardTitle: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    color: "#F0EEF8",
    marginBottom: 6,
  },
  cardSubtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "#A8A5B8",
    marginBottom: 28,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(232, 112, 112, 0.12)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  errorText: {
    color: "#E87070",
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    flex: 1,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: "#A8A5B8",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(48, 45, 68, 0.8)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#3D3A52",
    paddingHorizontal: 14,
    height: 52,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: "#F0EEF8",
  },
  eyeBtn: {
    padding: 4,
  },
  loginBtn: {
    borderRadius: 16,
    overflow: "hidden",
    marginTop: 8,
    marginBottom: 24,
  },
  loginBtnGradient: {
    height: 54,
    justifyContent: "center",
    alignItems: "center",
  },
  loginBtnText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
    letterSpacing: 0.3,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  footerText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "#605D72",
  },
  footerLink: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "#B8A9E8",
  },
});
