import { router } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import React from "react";
import { SafeAreaView, Text, TouchableOpacity, View } from "react-native";

const NotificationDetails = () => {
  const navigation = router;

  const { notification } = router as any;

  const getButton = () => {
    switch (notification.type) {
      case "PAYMENT":
        return {
          title: "View Payment",
          action: () => navigation.push("/payments"),
        };

      case "RFQ":
        return {
          title: "View RFQ",
          action: () => navigation.push("/rfq"),
        };

      case "ESCROW":
        return {
          title: "View Escrow",
          action: () => navigation.push("/escrow"),
        };

      default:
        return null;
    }
  };

  const button = getButton();

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="bg-brand px-5 pt-10 pb-5 flex-row items-center">
        <TouchableOpacity onPress={() => navigation.back()} className="mr-3">
          <ArrowLeft color="white" size={22} />
        </TouchableOpacity>

        <Text className="text-white text-lg font-semibold">Notification</Text>
      </View>

      <View className="p-5">
        <Text className="text-xl font-semibold">{notification.title}</Text>

        <Text className="text-gray-500 mt-2">{notification.createdAt}</Text>

        <Text className="text-base mt-6 leading-6">{notification.message}</Text>

        {button && (
          <TouchableOpacity
            onPress={button.action}
            className="bg-brand mt-10 rounded-xl py-4 items-center"
          >
            <Text className="text-white font-semibold">{button.title}</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

export default NotificationDetails;
