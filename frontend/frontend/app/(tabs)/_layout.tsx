import { Slot, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";

const SIDEBAR_WIDTH = 272;

const BASE_ITEMS = [
  { label: "Home",     icon: "home-outline",        route: "/(tabs)/"        },
  { label: "Food",     icon: "restaurant-outline",  route: "/(tabs)/food"    },
  { label: "Scan",     icon: "camera-outline",      route: "/(tabs)/face"    },
  { label: "Products", icon: "flask-outline",       route: "/(tabs)/product" },
  { label: "Forecast", icon: "trending-up-outline", route: "/(tabs)/forecast"},
  { label: "Profile",  icon: "person-outline",      route: "/(tabs)/profile" },
];

const FEMALE_ITEM = { label: "Cycle", icon: "flower-outline", route: "/(tabs)/cycle" };

const NAV_COLORS: Record<string, { icon: string; bg: string; label: string }> = {
  Home:     { icon: "#C4956A", bg: "rgba(196,149,106,0.10)", label: "#C4956A" },
  Food:     { icon: "#8BAF9C", bg: "rgba(139,175,156,0.10)", label: "#8BAF9C" },
  Scan:     { icon: "#D4856A", bg: "rgba(212,133,106,0.10)", label: "#D4856A" },
  Products: { icon: "#A89ACB", bg: "rgba(168,154,203,0.10)", label: "#A89ACB" },
  Forecast: { icon: "#6FA3A0", bg: "rgba(111,163,160,0.10)", label: "#6FA3A0" },
  Profile:  { icon: "#C4956A", bg: "rgba(196,149,106,0.10)", label: "#C4956A" },
  Cycle:    { icon: "#E8A598", bg: "rgba(232,165,152,0.10)", label: "#E8A598" },
};

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const isFemale = user?.gender === "female";

  const navItems = [...BASE_ITEMS];
  if (isFemale) {
    const forecastIdx = navItems.findIndex((i) => i.label === "Forecast");
    navItems.splice(forecastIdx, 0, FEMALE_ITEM);
  }

  const navigateTo = (route: string) => router.push(route as any);
  const initials = (user?.name || user?.email || "U").slice(0, 2).toUpperCase();

  return (
    <View style={{ flex: 1, flexDirection: "row", backgroundColor: "#FEFCF9" }}>
      {/* ── SIDEBAR ── */}
      <View style={[styles.sidebar, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 24 }]}>

        {/* Brand header */}
        <View style={styles.brand}>
          <LinearGradient colors={["#C4956A", "#E8A598"]} style={styles.brandIcon}>
            <Ionicons name="leaf" size={20} color="#fff" />
          </LinearGradient>
          <View>
            <Text style={styles.brandName}>SKINOVA</Text>
            <Text style={styles.brandTagline}>AI Skin Intelligence</Text>
          </View>
        </View>

        {/* User card */}
        <View style={styles.userCard}>
          <LinearGradient colors={["#E8C4A8", "#F0D4C0"]} style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </LinearGradient>
          <View style={{ flex: 1 }}>
            <Text style={styles.userName} numberOfLines={1}>
              {user?.name || user?.email?.split("@")[0] || "User"}
            </Text>
            <View style={styles.planBadge}>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Nav items */}
        <View style={styles.navList}>
          <Text style={styles.navSection}>NAVIGATION</Text>
          {navItems.map((item) => {
            const c = NAV_COLORS[item.label] ?? NAV_COLORS.Home;
            return (
              <TouchableOpacity
                key={item.label}
                style={styles.navItem}
                onPress={() => navigateTo(item.route)}
                activeOpacity={0.7}
              >
                <View style={[styles.navIconWrap, { backgroundColor: c.bg }]}>
                  <Ionicons name={item.icon as any} size={17} color={c.icon} />
                </View>
                <Text style={[styles.navLabel, { color: c.label !== "#C4956A" || item.label === "Home" || item.label === "Profile" ? "#3C2A1E" : "#3C2A1E" }]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Footer */}
        <View style={styles.sidebarFooter}>
          <View style={styles.divider} />
          <View style={styles.footerInner}>
            <View style={styles.footerDot} />
            <Text style={styles.footerText}>Skinova v1.0  ·  Powered by AI</Text>
          </View>
        </View>
      </View>

      {/* ── MAIN CONTENT ── */}
      <View style={{ flex: 1 }}>
        <Slot />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: SIDEBAR_WIDTH,
    backgroundColor: "#FFFFFF",
    borderRightWidth: 1,
    borderRightColor: "#F0EBE3",
    paddingHorizontal: 18,
    ...(Platform.OS === "web"
      ? { boxShadow: "4px 0 24px rgba(196,149,106,0.08)" }
      : { shadowColor: "#C4956A", shadowOffset: { width: 4, height: 0 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 12 }),
  },

  brand: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 20 },
  brandIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  brandName: { fontSize: 16, fontWeight: "800", color: "#1C1917", letterSpacing: 2 },
  brandTagline: { fontSize: 10, color: "#A8A29E", letterSpacing: 0.5, marginTop: 1 },

  userCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: "#FDF8F3", borderRadius: 16, padding: 14,
    marginBottom: 4, borderWidth: 1, borderColor: "#F0EBE3",
  },
  avatar: { width: 42, height: 42, borderRadius: 13, justifyContent: "center", alignItems: "center" },
  avatarText: { fontSize: 16, fontWeight: "700", color: "#7C4A2A" },
  userName: { fontSize: 14, fontWeight: "700", color: "#1C1917" },
  planBadge: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 3 },
  planDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: "#C4956A" },
  planText: { fontSize: 10, color: "#C4956A", fontWeight: "600", letterSpacing: 0.4 },

  divider: { height: 1, backgroundColor: "#F0EBE3", marginVertical: 12 },

  navList: { gap: 2, flex: 1 },
  navSection: { fontSize: 9, fontWeight: "700", color: "#C4956A", letterSpacing: 1.5, marginBottom: 8, marginLeft: 4 },
  navItem: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingVertical: 11, paddingHorizontal: 10, borderRadius: 13,
  },
  navIconWrap: { width: 34, height: 34, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  navLabel: { fontSize: 14, fontWeight: "500", color: "#1C1917" },

  sidebarFooter: { marginTop: "auto" },
  footerInner: { flexDirection: "row", alignItems: "center", gap: 6, paddingTop: 4 },
  footerDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#8BAF9C" },
  footerText: { fontSize: 10, color: "#A8A29E" },
});