import { getCurrentUserId, getUser } from "@/api/authapi"; // adjust path to your file
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";

type User = {
  _id: string;
  email?: string;
  firstName?: string;
  middleName?: string;
  surname?: string;
  accountType?: string;
  country?: string;
  countryCode?: string;
  phoneNumber?: string;
  emailVerified?: boolean;
  [key: string]: any;
};

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadUser = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const id = await getCurrentUserId();
      setUserId(id);

      if (!id) {
        setUser(null);
        setLoading(false);
        return;
      }

      const profile = await getUser();
      // adjust this line if getUser() response is wrapped, e.g. profile.user
      setUser(profile?.user || profile);
    } catch (err: any) {
      console.log("useAuth error:", err);
      setError(err?.message || "Failed to load user");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("authToken");
    setUser(null);
    setUserId(null);
  }, []);

  const isAuthenticated = !!user;

  return {
    user,
    userId,
    loading,
    error,
    isAuthenticated,
    refreshUser: loadUser,
    logout,
  };
};
