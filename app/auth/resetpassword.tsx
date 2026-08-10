
import { ArrowLeft, Eye, EyeOff, KeyRound } from "lucide-react-native";
import React, { useState } from "react";
import {router, useLocalSearchParams} from 'expo-router'
import {
    ActivityIndicator,
    SafeAreaView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import { resetPassword } from "@/api/authapi";

const ResetPasswordScreen = () => {
  const navigation = router;
  const params = useLocalSearchParams();

  const emailFromParams: string = (params.email as string) || "";

  const [email, setEmail] = useState(emailFromParams);
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const next: Record<string, string> = {};

    if (!email.trim()) next.email = "Email is required";
    if (!otp.trim()) next.otp = "Enter the code sent to your email";
    if (!password) next.password = "Password is required";
    else if (password.length < 8)
      next.password = "Password must be at least 8 characters";
    if (!confirmPassword) next.confirmPassword = "Please confirm your password";
    else if (password && confirmPassword && password !== confirmPassword)
      next.confirmPassword = "Passwords do not match";

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      await resetPassword({
        email: email.trim(),
        otp: otp.trim(),
        password,
        confirmPassword,
      });
      navigation.push({ pathname: "./ResetSuccessScreen" });
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Something went wrong. Please try again.";
      setErrors({ form: message });
    } finally {
      setLoading(false);
    }
  };

  const updateField =
    (setter: (val: string) => void, key: string) => (val: string) => {
      setter(val);
      if (errors[key] || errors.form) {
        setErrors((prev) => {
          const { [key]: _removed, form: _f, ...rest } = prev;
          return rest;
        });
      }
    };

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <View className="px-5 pt-10">
        <TouchableOpacity
          onPress={() => navigation.back()}
          className="p-1 -ml-1"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowLeft color="#111827" size={22} />
        </TouchableOpacity>
      </View>

      <View className="px-5 pt-6 flex-1">
        <View className="bg-brand/10 self-start p-3 rounded-full mb-5">
          <KeyRound color="#4f46e5" size={26} />
        </View>

        <Text className="text-2xl font-bold text-ink">Reset your password</Text>
        <Text className="text-gray-500 mt-2 text-sm leading-5">
          Enter the code we sent you and choose a new password.
        </Text>

        {errors.form ? (
          <View className="bg-red-50 rounded-xl px-4 py-3 mt-5">
            <Text className="text-red-500 text-xs">{errors.form}</Text>
          </View>
        ) : null}

        {!emailFromParams && (
          <View className="mt-6">
            <Text className="text-gray-600 text-xs uppercase mb-2">
              Email address
            </Text>
            <TextInput
              value={email}
              onChangeText={updateField(setEmail, "email")}
              placeholder="you@example.com"
              placeholderTextColor="#9ca3af"
              keyboardType="email-address"
              autoCapitalize="none"
              className={`border rounded-xl px-4 py-3.5 text-ink text-sm ${
                errors.email ? "border-red-400" : "border-surface-border"
              }`}
            />
            {errors.email ? (
              <Text className="text-red-500 text-xs mt-2">{errors.email}</Text>
            ) : null}
          </View>
        )}

        <View className="mt-6">
          <Text className="text-gray-600 text-xs uppercase mb-2">
            Reset code
          </Text>
          <TextInput
            value={otp}
            onChangeText={updateField(setOtp, "otp")}
            placeholder="6-digit code"
            placeholderTextColor="#9ca3af"
            keyboardType="number-pad"
            maxLength={6}
            className={`border rounded-xl px-4 py-3.5 text-ink text-sm tracking-widest ${
              errors.otp ? "border-red-400" : "border-surface-border"
            }`}
          />
          {errors.otp ? (
            <Text className="text-red-500 text-xs mt-2">{errors.otp}</Text>
          ) : null}
        </View>

        <View className="mt-6">
          <Text className="text-gray-600 text-xs uppercase mb-2">
            New password
          </Text>
          <View className="relative justify-center">
            <TextInput
              value={password}
              onChangeText={updateField(setPassword, "password")}
              placeholder="At least 8 characters"
              placeholderTextColor="#9ca3af"
              secureTextEntry={!showPassword}
              className={`border rounded-xl px-4 py-3.5 pr-11 text-ink text-sm ${
                errors.password ? "border-red-400" : "border-surface-border"
              }`}
            />
            <TouchableOpacity
              onPress={() => setShowPassword((prev) => !prev)}
              className="absolute right-3.5 p-1"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              {showPassword ? (
                <EyeOff size={18} color="#9ca3af" />
              ) : (
                <Eye size={18} color="#9ca3af" />
              )}
            </TouchableOpacity>
          </View>
          {errors.password ? (
            <Text className="text-red-500 text-xs mt-2">{errors.password}</Text>
          ) : null}
        </View>

        <View className="mt-6">
          <Text className="text-gray-600 text-xs uppercase mb-2">
            Confirm new password
          </Text>
          <View className="relative justify-center">
            <TextInput
              value={confirmPassword}
              onChangeText={updateField(setConfirmPassword, "confirmPassword")}
              placeholder="Re-enter your password"
              placeholderTextColor="#9ca3af"
              secureTextEntry={!showConfirm}
              className={`border rounded-xl px-4 py-3.5 pr-11 text-ink text-sm ${
                errors.confirmPassword
                  ? "border-red-400"
                  : "border-surface-border"
              }`}
            />
            <TouchableOpacity
              onPress={() => setShowConfirm((prev) => !prev)}
              className="absolute right-3.5 p-1"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              {showConfirm ? (
                <EyeOff size={18} color="#9ca3af" />
              ) : (
                <Eye size={18} color="#9ca3af" />
              )}
            </TouchableOpacity>
          </View>
          {errors.confirmPassword ? (
            <Text className="text-red-500 text-xs mt-2">
              {errors.confirmPassword}
            </Text>
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
            <Text className="text-white font-semibold">Reset password</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default ResetPasswordScreen;
