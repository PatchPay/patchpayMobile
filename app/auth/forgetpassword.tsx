import { useNavigation } from "@react-navigation/native";
import { ArrowLeft, Mail } from "lucide-react-native";
import React, { useState } from "react";
import {
    ActivityIndicator,
    SafeAreaView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import { forgotPassword } from "@/api/authapi";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ForgotPasswordScreen = () => {
  const navigation = useNavigation<any>();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isValidEmail = EMAIL_REGEX.test(email.trim());

  const handleSubmit = async () => {
    setError(null);

    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }
    if (!isValidEmail) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      await forgotPassword(email.trim());
      navigation.navigate("ResetEmailSentScreen", { email: email.trim() });
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <View className="px-5 pt-10">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="p-1 -ml-1"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowLeft color="#111827" size={22} />
        </TouchableOpacity>
      </View>

      <View className="px-5 pt-8 flex-1">
        <View className="bg-brand/10 self-start p-3 rounded-full mb-5">
          <Mail color="#4f46e5" size={26} />
        </View>

        <Text className="text-2xl font-bold text-ink">Forgot password?</Text>
        <Text className="text-gray-500 mt-2 text-sm leading-5">
          Enter the email address linked to your account and we&rsquo;ll send
          you a code to reset your password.
        </Text>

        <View className="mt-8">
          <Text className="text-gray-600 text-xs uppercase mb-2">
            Email address
          </Text>
          <TextInput
            value={email}
            onChangeText={(val) => {
              setEmail(val);
              if (error) setError(null);
            }}
            placeholder="you@example.com"
            placeholderTextColor="#9ca3af"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            className={`border rounded-xl px-4 py-3.5 text-ink text-sm ${
              error ? "border-red-400" : "border-surface-border"
            }`}
          />
          {error ? (
            <Text className="text-red-500 text-xs mt-2">{error}</Text>
          ) : null}
        </View>

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={loading}
          className={`rounded-2xl py-4 items-center mt-8 ${
            loading ? "bg-slate-300" : "bg-brand"
          }`}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-semibold">Send reset code</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="items-center mt-5"
        >
          <Text className="text-gray-500 text-sm">
            Remembered your password?{" "}
            <Text className="text-brand font-semibold">Log in</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default ForgotPasswordScreen;
