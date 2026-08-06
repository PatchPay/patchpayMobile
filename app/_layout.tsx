import { Stack } from "expo-router";
import "./global.css";

import { NotificationProvider } from "@/context/notificationcontext";
import Toast from "react-native-toast-message";

export default function RootLayout() {
  return (
    <NotificationProvider>
      <Stack screenOptions={{ headerShown: false }} />
      <Toast />
    </NotificationProvider>
  );
}
