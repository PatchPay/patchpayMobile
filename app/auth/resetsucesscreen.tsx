/* eslint-disable @typescript-eslint/no-unused-vars */
import { useNavigation, useRoute } from "@react-navigation/native";
import { ArrowLeft, MailCheck } from "lucide-react-native";
import React, { useState } from "react";
import { SafeAreaView, Text, TouchableOpacity, View } from "react-native";

import { forgotPassword } from "@/api/authapi";

const ResetEmailSentScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const email: string = route.params?.email || "";

  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  const handleResend = async () => {
    if (!email) return;
    setResending(true);
    try {
      await forgotPassword(email);
      setResent(true);
      setTimeout(() => setResent(false), 4000);
    } catch (err) {
      // stay silent here — resend is best-effort, main flow already succeeded once
    } finally {
      setResending(false);
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

      <View className="flex-1 items-center justify-center px-8">
        <View className="bg-success/10 p-5 rounded-full mb-6">
          <MailCheck color="#16a34a" size={40} />
        </View>

        <Text className="text-2xl font-bold text-ink text-center">
          Check your email
        </Text>
        <Text className="text-gray-500 text-sm text-center mt-3 leading-5">
          If an account exists for{" "}
          <Text className="text-ink font-medium">
            {email || "that address"}
          </Text>
          , we&rsquo;ve sent a reset code to it. The code expires in 10 minutes.
        </Text>

        <TouchableOpacity
          onPress={() => navigation.navigate("ResetPasswordScreen", { email })}
          className="bg-brand rounded-2xl py-4 items-center mt-8 w-full"
        >
          <Text className="text-white font-semibold">I have the code</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleResend}
          disabled={resending}
          className="items-center mt-5"
        >
          <Text className="text-gray-500 text-sm">
            Didn&rsquo;t get it?{" "}
            <Text className="text-brand font-semibold">
              {resending ? "Sending…" : resent ? "Sent again ✓" : "Resend code"}
            </Text>
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default ResetEmailSentScreen;
