// context/AuthContext.tsx
// Uses ONLY AsyncStorage — works on web, iOS, Android

import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  height: number | null;
  weight: number | null;
  bmi: number | null;
  gender: "male" | "female";
  last_period_end_date?: string | null;
  skin_type: string;
  drugs?: string;
  allergens: string[];
}

interface AuthContextValue {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: UserProfile) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: UserProfile) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = "skinova_token";
const USER_KEY  = "skinova_user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]           = useState<UserProfile | null>(null);
  const [token, setToken]         = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [storedToken, storedUser] = await Promise.all([
          AsyncStorage.getItem(TOKEN_KEY),
          AsyncStorage.getItem(USER_KEY),
        ]);
        if (storedToken) setToken(storedToken);
        if (storedUser)  setUser(JSON.parse(storedUser));
      } catch (e) {
        console.log("Auth load error:", e);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const login = useCallback(async (newToken: string, newUser: UserProfile) => {
    await AsyncStorage.setItem(TOKEN_KEY, newToken);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  }, []);

  const logout = useCallback(async () => {
  await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
  setToken(null);
  setUser(null);
}, []);

  const updateUser = useCallback(async (updatedUser: UserProfile) => {
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
    setUser(updatedUser);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}