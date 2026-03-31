import { BlurView } from "expo-blur";
import { Tabs, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState, useRef } from "react";
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SIDEBAR_WIDTH = 260;

const BASE_ITEMS = [
  { label: "Home",      icon: "home-outline",        route: "/(tabs)/"        },
  { label: "Skin",      icon: "scan-outline",        route: "/(tabs)/skin"    },  // ← NEW
  { label: "Food",      icon: "restaurant-outline",  route: "/(tabs)/food"    },
  { label: "Scan",      icon: "camera-outline",      route: "/(tabs)/face"    },
  { label: "Products",  icon: "flask-outline",       route: "/(tabs)/product" },
  { label: "Forecast",  icon: "trending-up-outline", route: "/(tabs)/forecast"},
  { label: "Profile",   icon: "person-outline",      route: "/(tabs)/profile" },
];

const FEMALE_ITEM = {
  label: "Cycle",
  icon: "flower-outline",
  route: "/(tabs)/cycle",
};

export default function TabLayout() {
  const colorScheme  = useColorScheme();
  const isDark       = colorScheme === "dark";
  const insets       = useSafeAreaInsets();
  const { user }     = useAuth();
  const isFemale     = user?.gender === "female";
  const isWeb        = Platform.OS === "web";

  const navItems = [...BASE_ITEMS];
  if (isFemale) {
    const forecastIdx = navItems.findIndex((i) => i.label === "Forecast");
    navItems.splice(forecastIdx, 0, FEMALE_ITEM);
  }

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const slideAnim   = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;

  const openSidebar = () => {
    setSidebarOpen(true);
    Animated.parallel([
      Animated.spring(slideAnim,   { toValue: 0,            useNativeDriver: true, tension: 65, friction: 11 }),
      Animated.timing(overlayAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();
  };

  const closeSidebar = () => {
    Animated.parallel([
      Animated.spring(slideAnim,   { toValue: -SIDEBAR_WIDTH, useNativeDriver: true, tension: 65, friction: 11 }),
      Animated.timing(overlayAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => setSidebarOpen(false));
  };

  const navigateTo = (route: string) => {
    closeSidebar();
    setTimeout(() => router.push(route as any), 150);
  };

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: "#B8A9E8",
          tabBarInactiveTintColor: isDark ? "#605D72" : "#9A97AA",
          tabBarStyle: {
            display: "none",
            position: "absolute",
            backgroundColor: isDark ? "#1A1825" : "#fff",
            borderTopWidth: isWeb ? 1 : 0,
            borderTopColor: isDark ? "#302D44" : "#ECEAF2",
            elevation: 0,
            ...(isWeb ? { height: 84 } : {}),
          },
          header: () => (
            <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: isDark ? "#1A1825" : "#fff", borderBottomColor: isDark ? "#302D44" : "#ECEAF2" }]}>
              <TouchableOpacity onPress={openSidebar} style={styles.hamburger}>
                <View style={[styles.bar,    { backgroundColor: "#B8A9E8" }]} />
                <View style={[styles.bar, styles.barMid, { backgroundColor: "#B8A9E8" }]} />
                <View style={[styles.bar,    { backgroundColor: "#B8A9E8" }]} />
              </TouchableOpacity>
              <Text style={[styles.headerTitle, { color: isDark ? "#F0EEF8" : "#1A1825" }]}>Skinova</Text>
              <View style={styles.headerRight}>
                <TouchableOpacity style={styles.avatarBtn} onPress={() => router.push("/(tabs)/profile" as any)}>
                  <LinearGradient colors={["#B8A9E8", "#F0A896"]} style={styles.avatarGrad}>
                    <Ionicons name="person" size={14} color="#fff" />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          ),
          headerShown: true,
        }}
      >
        <Tabs.Screen name="index"   options={{ title: "Home",     tabBarIcon: ({ color }) => <Ionicons name="home"               size={22} color={color} /> }} />
        <Tabs.Screen name="skin"    options={{ title: "Skin",     tabBarIcon: ({ color }) => <Ionicons name="scan-outline"       size={22} color={color} /> }} />  {/* ← NEW */}
        <Tabs.Screen name="food"    options={{ title: "Food",     tabBarIcon: ({ color }) => <Ionicons name="restaurant-outline" size={22} color={color} /> }} />
        <Tabs.Screen name="face"    options={{ title: "Scan",     tabBarIcon: ({ color }) => <Ionicons name="camera-outline"     size={22} color={color} /> }} />
        <Tabs.Screen name="product" options={{ title: "Products", tabBarIcon: ({ color }) => <Ionicons name="flask-outline"      size={22} color={color} /> }} />
        {isFemale && (
          <Tabs.Screen name="cycle" options={{ title: "Cycle",    tabBarIcon: ({ color }) => <Ionicons name="flower-outline"     size={22} color={color} /> }} />
        )}
        <Tabs.Screen name="forecast" options={{ title: "Forecast", tabBarIcon: ({ color }) => <Ionicons name="trending-up-outline" size={22} color={color} /> }} />
        <Tabs.Screen name="profile"  options={{ title: "Profile",  tabBarIcon: ({ color }) => <Ionicons name="person-outline"      size={22} color={color} /> }} />
      </Tabs>

      {sidebarOpen && (
        <Animated.View style={[styles.overlay, { opacity: overlayAnim }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeSidebar} />
        </Animated.View>
      )}

      <Animated.View
        style={[styles.sidebar, { transform: [{ translateX: slideAnim }], paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24, backgroundColor: isDark ? "#1A1825" : "#F7F5FF" }]}
        pointerEvents={sidebarOpen ? "auto" : "none"}
      >
        <View style={styles.sidebarHeader}>
          <LinearGradient colors={["#B8A9E8", "#F0A896"]} style={styles.sidebarAvatar}>
            <Ionicons name="person" size={22} color="#fff" />
          </LinearGradient>
          <View style={{ flex: 1 }}>
            <Text style={[styles.sidebarName, { color: isDark ? "#F0EEF8" : "#1A1825" }]}>
              {user?.name || user?.email?.split("@")[0] || "User"}
            </Text>
            <Text style={styles.sidebarEmail} numberOfLines={1}>{user?.email}</Text>
          </View>
          <TouchableOpacity onPress={closeSidebar} style={styles.closeBtn}>
            <Ionicons name="close" size={20} color="#8B7AC9" />
          </TouchableOpacity>
        </View>

        <View style={[styles.divider, { backgroundColor: isDark ? "#302D44" : "#E8E4F0" }]} />

        <View style={styles.navList}>
          {navItems.map((item) => {
            const isCycle    = item.label === "Cycle";
            const isForecast = item.label === "Forecast";
            const isSkin     = item.label === "Skin";
            return (
              <TouchableOpacity key={item.label} style={styles.navItem} onPress={() => navigateTo(item.route)} activeOpacity={0.7}>
                <View style={[styles.navIconWrap, {
                  backgroundColor: isCycle    ? "rgba(240,168,150,0.15)"
                                 : isForecast ? "rgba(124,201,138,0.15)"
                                 : isSkin     ? "rgba(184,169,232,0.18)"
                                 : "rgba(139,122,201,0.12)",
                }]}>
                  <Ionicons
                    name={item.icon as any}
                    size={18}
                    color={isCycle ? "#F0A896" : isForecast ? "#7CC98A" : isSkin ? "#B8A9E8" : "#B8A9E8"}
                  />
                </View>
                <Text style={[styles.navLabel, { color: isDark ? "#E0DCF0" : "#2D2845", fontWeight: isCycle || isForecast || isSkin ? "600" : "400" }]}>
                  {item.label}
                </Text>
                {isCycle && (
                  <View style={styles.cycleBadge}><Text style={styles.cycleBadgeText}>♀</Text></View>
                )}
                {isSkin && (
                  <View style={styles.skinBadge}><Text style={styles.skinBadgeText}>AI</Text></View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={[styles.divider, { backgroundColor: isDark ? "#302D44" : "#E8E4F0", marginTop: "auto" }]} />
        <Text style={styles.versionText}>Skinova v1.0</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, gap: 12 },
  hamburger: { width: 36, height: 36, justifyContent: "center", gap: 5, padding: 4 },
  bar: { height: 2, borderRadius: 2, width: 22 },
  barMid: { width: 16 },
  headerTitle: { fontSize: 18, fontFamily: "Inter_700Bold", letterSpacing: -0.3, flex: 1 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  avatarBtn: { borderRadius: 10, overflow: "hidden" },
  avatarGrad: { width: 32, height: 32, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.45)", zIndex: 10 },
  sidebar: { position: "absolute", top: 0, left: 0, bottom: 0, width: SIDEBAR_WIDTH, zIndex: 20, shadowColor: "#000", shadowOffset: { width: 4, height: 0 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 20 },
  sidebarHeader: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingBottom: 16 },
  sidebarAvatar: { width: 44, height: 44, borderRadius: 14, justifyContent: "center", alignItems: "center" },
  sidebarName: { fontSize: 15, fontFamily: "Inter_700Bold", textTransform: "capitalize" },
  sidebarEmail: { fontSize: 11, color: "#8B7AC9", fontFamily: "Inter_400Regular" },
  closeBtn: { width: 32, height: 32, borderRadius: 10, backgroundColor: "rgba(139,122,201,0.1)", justifyContent: "center", alignItems: "center" },
  divider: { height: 1, marginHorizontal: 20, marginVertical: 8 },
  navList: { paddingHorizontal: 12, paddingTop: 8, gap: 2 },
  navItem: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 11, paddingHorizontal: 10, borderRadius: 12 },
  navIconWrap: { width: 34, height: 34, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  navLabel: { fontSize: 14, fontFamily: "Inter_400Regular", flex: 1 },
  cycleBadge: { backgroundColor: "rgba(240,168,150,0.2)", borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  cycleBadgeText: { fontSize: 11, color: "#F0A896" },
  skinBadge: { backgroundColor: "rgba(184,169,232,0.2)", borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  skinBadgeText: { fontSize: 11, color: "#B8A9E8", fontFamily: "Inter_600SemiBold" },
  versionText: { textAlign: "center", fontSize: 11, color: "#605D72", fontFamily: "Inter_400Regular", paddingTop: 12, paddingHorizontal: 20 },
});

