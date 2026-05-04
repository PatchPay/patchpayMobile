import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  TouchableOpacity,
} from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons"; // Eye icon
import { loginUser } from "@/api/authapi";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    if (loading) return;

    setLoading(true);
    setError("");

    try {
      const payload = { email, password };

      const response = await loginUser(payload);

      console.log("✅ Login successful:", response);

      // 🔥 Save token
      await AsyncStorage.setItem("token", response.token);

      // Optional: save user too
      await AsyncStorage.setItem("user", JSON.stringify(response.user));

      router.replace("/(tabs)/home");
    } catch (err: any) {
      console.log("❌ Login failed:", err.response?.data || err.message);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Login failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-white px-6 pt-32">
      {/* Back Button */}
      <Pressable
        onPress={() => router.back()}
        className="absolute top-14 left-6 w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
      >
        <Text className="text-gray-700 text-lg">←</Text>
      </Pressable>

      {/* Header */}
      <View className="mb-10">
        <Text className="text-gray-900 text-3xl font-extrabold mb-2">
          Welcome Back
        </Text>
        <Text className="text-gray-500 text-sm">
          Login to continue to PatchPay
        </Text>
      </View>

      {/* Email Input */}
      <View className="mb-5">
        <Text className="text-gray-600 mb-2 text-sm font-medium">Email</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Enter your email"
          placeholderTextColor="#9CA3AF"
          keyboardType="email-address"
          autoCapitalize="none"
          className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 text-gray-800"
        />
      </View>

      {/* Password Input */}
      <View className="mb-3 relative">
        <Text className="text-gray-600 mb-2 text-sm font-medium">Password</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Enter your password"
          placeholderTextColor="#9CA3AF"
          secureTextEntry={!showPassword}
          className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 text-gray-800"
        />

        {/* Eye icon */}
        <TouchableOpacity
          onPress={() => setShowPassword(!showPassword)}
          className="absolute right-4 top-12"
        >
          <Ionicons
            name={showPassword ? "eye" : "eye-off"}
            size={20}
            color="#6B7280"
          />
        </TouchableOpacity>
      </View>

      {/* Forgot Password */}
      <Pressable
        onPress={() => router.push("/auth/register/stepone")}
        className="items-end mb-8"
      >
        <Text className="text-blue-600 text-sm font-medium">
          Forgot Password?
        </Text>
      </Pressable>

      {/* ✅ ERROR GOES HERE */}
      {error ? (
        <View className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <Text className="text-red-600 text-sm font-medium text-center">
            {error}
          </Text>
        </View>
      ) : null}

      {/* login buuton  */}
      <Pressable
        disabled={!email || !password || loading}
        onPress={handleLogin}
        className="rounded-xl overflow-hidden mb-6"
      >
        <LinearGradient
          colors={["#1a6ecc", "#0d4fa8"]}
          start={[0, 0]}
          end={[1, 1]}
          className="py-4 items-center justify-center rounded-xl"
        >
          <Text className="text-white font-bold text-base">
            {loading ? "Logging in..." : "Login"}
          </Text>
        </LinearGradient>
      </Pressable>

      {/* Spacer */}
      <View className="flex-1 " />

      {/* Register Link */}
      <View className="flex-row justify-center pb-12">
        <Text className="text-gray-500 text-sm">Are you a new user?</Text>
        <Pressable onPress={() => router.push("/auth/selectuser")}>
          <Text className="text-blue-600 text-sm font-semibold ml-1">
            Create your account
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
