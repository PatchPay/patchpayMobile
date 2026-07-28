import { useEffect, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { loginUser } from "@/api/authapi";
import { Button, Input, UI } from "@/app/(components)/ui";

const SAVED_EMAIL_KEY = "patchpay.savedEmail";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [useSavedAccount, setUseSavedAccount] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(SAVED_EMAIL_KEY).then((savedEmail) => {
      if (savedEmail) {
        setEmail(savedEmail);
        setUseSavedAccount(true);
      }
    });
  }, []);

  const useAnotherAccount = async () => {
    await AsyncStorage.removeItem(SAVED_EMAIL_KEY);
    setEmail("");
    setPassword("");
    setUseSavedAccount(false);
    setError(null);
  };

  const handleLogin = async () => {
    if (!email || !password || loading) {
      if (!email || !password) setError("Enter your email and password to continue.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await loginUser({ email, password });
      await AsyncStorage.multiSet([
        ["token", response.token],
        ["user", JSON.stringify(response.user)],
        [SAVED_EMAIL_KEY, email.trim().toLowerCase()],
      ]);
      router.replace("/(tabs)/home");
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return <View className={`${UI.screen} px-5 pt-16`}>
    <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} className="mb-10 h-11 w-11 items-center justify-center rounded-sm border border-surface-border bg-surface-card">
      <Feather name="arrow-left" size={20} color="#0F172A" />
    </Pressable>
    <View className="mb-8">
      <View className="mb-4 h-12 w-12 items-center justify-center rounded-md bg-blue-100"><Feather name="shield" size={24} color="#1D4ED8" /></View>
      <Text className="text-3xl font-bold tracking-tight text-ink">Welcome back</Text>
      <Text className="mt-2 text-base text-ink-muted">Securely access your PatchPay account.</Text>
    </View>
    {useSavedAccount ? <View className="mb-6 rounded-md border border-blue-200 bg-blue-50 p-4">
      <Text className="text-xs font-semibold uppercase tracking-wide text-brand-light">Continue as</Text>
      <Text className="mt-1 text-base font-bold text-ink">{email}</Text>
      <Pressable onPress={useAnotherAccount} className="mt-3 self-start" accessibilityRole="button"><Text className="font-semibold text-brand-light">Use another account</Text></Pressable>
    </View> : <Input label="Email address" icon="mail" value={email} onChangeText={setEmail} placeholder="you@example.com" autoCapitalize="none" autoComplete="email" keyboardType="email-address" />}
    <Input label="Password" icon="lock" value={password} onChangeText={setPassword} placeholder="Enter your password" secureTextEntry={!showPassword} autoComplete="password" error={error} right={<Pressable onPress={() => setShowPassword((value) => !value)} accessibilityRole="button" accessibilityLabel={showPassword ? "Hide password" : "Show password"}><Feather name={showPassword ? "eye-off" : "eye"} size={19} color="#64748B" /></Pressable>} />
    <Pressable onPress={() => router.push("/auth/register/stepone")} className="mb-6 self-end" accessibilityRole="button"><Text className="font-semibold text-brand-light">Forgot password?</Text></Pressable>
    <Button label="Continue securely" loading={loading} onPress={handleLogin} />
    <View className="mt-auto flex-row justify-center pb-10"><Text className="text-ink-muted">New to PatchPay? </Text><Pressable onPress={() => router.push("/auth/selectuser")}><Text className="font-bold text-brand-light">Create an account</Text></Pressable></View>
  </View>;
}
