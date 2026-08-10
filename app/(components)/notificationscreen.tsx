import { useFocusEffect } from "@react-navigation/native";
import {
  ArrowLeft,
  Bell,
  BellOff,
  CheckCheck,
  Trash2,
} from "lucide-react-native";
import React, { useCallback } from "react";
import {
  FlatList,
  RefreshControl,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { router } from "expo-router";

import { NotificationItem } from "@/api/notifications";
import { useNotifications } from "@/context/notificationcontext";

const formatTimeAgo = (iso: string) => {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diffMs = now - then;
  const minutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
};

const NotificationScreen = () => {
  const navigation = router;
  const {
    notifications,
    unreadCount,
    loading,
    refreshing,
    error,
    refresh,
    markAsRead,
    removeNotification,
    clearAll,
  } = useNotifications();

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const handlePressItem = (item: NotificationItem) => {
    if (!item.isRead) {
      markAsRead(item.id);
    }
    // Extend here to deep-link based on item.type / item.metadata
    // e.g. if (item.type === "ESCROW_FUNDED") navigation.navigate("EscrowDetailsScreen", { id: item.metadata?.escrowId })
  };

  const renderItem = ({ item }: { item: NotificationItem }) => (
    <TouchableOpacity
      onPress={() => handlePressItem(item)}
      className={`flex-row items-start px-5 py-4 border-b border-surface-border ${
        !item.isRead ? "bg-blue-50" : "bg-surface"
      }`}
    >
      <View
        className={`p-2 rounded-full mt-0.5 ${
          !item.isRead ? "bg-brand" : "bg-gray-200"
        }`}
      >
        <Bell size={16} color={!item.isRead ? "white" : "#9ca3af"} />
      </View>

      <View className="ml-3 flex-1">
        {item.title ? (
          <Text
            className={`text-sm ${
              !item.isRead
                ? "font-semibold text-ink"
                : "font-medium text-gray-600"
            }`}
          >
            {item.title}
          </Text>
        ) : null}
        <Text className="text-gray-500 text-sm mt-0.5">{item.message}</Text>
        <Text className="text-gray-400 text-xs mt-1">
          {formatTimeAgo(item.createdAt)}
        </Text>
      </View>

      {!item.isRead && (
        <View className="w-2 h-2 rounded-full bg-brand mt-1.5 mr-1" />
      )}

      <TouchableOpacity
        onPress={() => removeNotification(item.id)}
        className="p-2 -mr-2"
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Trash2 size={16} color="#d1d5db" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-surface">
      {/* Header */}
      <View className="bg-brand px-5 pt-10 pb-5">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => navigation.back()}
            className="mr-3 p-1 -ml-1"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ArrowLeft color="white" size={22} />
          </TouchableOpacity>

          <Text className="text-white text-lg font-semibold flex-1">
            Notifications
          </Text>

          {notifications.length > 0 && (
            <TouchableOpacity
              onPress={clearAll}
              className="flex-row items-center"
            >
              <CheckCheck size={16} color="white" />
              <Text className="text-white text-xs ml-1">Clear all</Text>
            </TouchableOpacity>
          )}
        </View>

        {unreadCount > 0 && (
          <Text className="text-white/70 text-xs mt-2">
            {unreadCount} unread
          </Text>
        )}
      </View>

      {/* Body */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-gray-400">Loading notifications…</Text>
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-gray-500 text-center">{error}</Text>
          <TouchableOpacity
            onPress={refresh}
            className="mt-4 bg-brand rounded-full px-5 py-2"
          >
            <Text className="text-white font-medium">Try again</Text>
          </TouchableOpacity>
        </View>
      ) : notifications.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <BellOff color="#9ca3af" size={32} />
          <Text className="text-gray-500 mt-3 text-center">
            You&rsquo;re all caught up. No notifications yet.
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} />
          }
        />
      )}
    </SafeAreaView>
  );
};

export default NotificationScreen;
