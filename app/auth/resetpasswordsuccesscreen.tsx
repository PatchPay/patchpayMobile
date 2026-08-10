import { CheckCircle2 } from "lucide-react-native";
import React from "react";
import { SafeAreaView, Text, TouchableOpacity, View } from "react-native";
import {router} from 'expo-router'

const ResetSuccessScreen = () => {
const navigation = router;

  const goToLogin = () => {
    navigation.replace("/auth/login");
  };

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <View className="flex-1 items-center justify-center px-8">
        <View className="bg-success/10 p-5 rounded-full mb-6">
          <CheckCircle2 color="#16a34a" size={44} />
        </View>

        <Text className="text-2xl font-bold text-ink text-center">
          Password reset
        </Text>
        <Text className="text-gray-500 text-sm text-center mt-3 leading-5">
          Your password has been updated successfully. You can now log in with
          your new password.
        </Text>

        <TouchableOpacity
          onPress={goToLogin}
          className="bg-brand rounded-2xl py-4 items-center mt-8 w-full"
        >
          <Text className="text-white font-semibold">Back to log in</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default ResetSuccessScreen;
