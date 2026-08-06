import { router } from "expo-router";
import { Bell } from "lucide-react-native";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

import { useNotifications } from "@/context/notificationcontext";

interface NotificationBellProps {
  color?: string;
  size?: number;
}

const NotificationBell = ({
  color = "white",
  size = 22,
}: NotificationBellProps) => {
  const { unreadCount } = useNotifications();

  const displayCount = unreadCount > 9 ? "9+" : String(unreadCount);

  return (
    <TouchableOpacity
      onPress={() => router.push("/(components)/notificationscreen")}
      className="relative p-2"
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Bell color={color} size={size} />
      {unreadCount > 0 && (
        <View className="absolute -top-0.5 -right-0.5 bg-red-500 rounded-full min-w-[16px] h-[16px] items-center justify-center px-1">
          <Text className="text-white text-[10px] font-bold">
            {displayCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

export default NotificationBell;
