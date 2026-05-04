import { Tabs } from "expo-router";
import { View, Text } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,

        tabBarStyle: {
          position: "absolute",
          backgroundColor: "#fff",
          borderTopWidth: 1,
          borderTopColor: "#f1f5f9",
          height: 96,
          paddingBottom: 12,
          paddingTop: 10,
          shadowColor: "#000",
          shadowOpacity: 0.06,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: -4 },
          elevation: 12,
        },

        tabBarActiveTintColor: "#1a3fb5",
        tabBarInactiveTintColor: "#cbd5e1",

        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "500",
        },

        tabBarItemStyle: {
          alignItems: "center",
          justifyContent: "center",
        },
      }}
    >
      {/* DASHBOARD */}
      <Tabs.Screen
        name="home"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, focused }) => (
            <View style={{ alignItems: "center", gap: 4 }}>
              {focused && (
                <View
                  style={{
                    position: "absolute",
                    top: -10,
                    width: 28,
                    height: 3,
                    borderRadius: 2,
                    backgroundColor: "#1a3fb5",
                  }}
                />
              )}
              <Feather name="grid" size={21} color={color} />
            </View>
          ),
          tabBarLabel: ({ color, focused }) => (
            <Text
              style={{
                fontSize: 10,
                fontWeight: focused ? "700" : "500",
                color,
              }}
            >
              Dashboard
            </Text>
          ),
        }}
      />

      {/* WALLET */}
      <Tabs.Screen
        name="wallet"
        options={{
          title: "Wallet",
          tabBarIcon: ({ color, focused }) => (
            <View style={{ alignItems: "center", gap: 4 }}>
              {focused && (
                <View
                  style={{
                    position: "absolute",
                    top: -10,
                    width: 28,
                    height: 3,
                    borderRadius: 2,
                    backgroundColor: "#1a3fb5",
                  }}
                />
              )}
              <Feather name="credit-card" size={21} color={color} />
            </View>
          ),
          tabBarLabel: ({ color, focused }) => (
            <Text
              style={{
                fontSize: 10,
                fontWeight: focused ? "700" : "500",
                color,
              }}
            >
              Wallet
            </Text>
          ),
        }}
      />

      {/* PAYMENTS */}
      <Tabs.Screen
        name="payments"
        options={{
          title: "Payments",
          tabBarIcon: ({ color, focused }) => (
            <View style={{ alignItems: "center", gap: 4 }}>
              {focused && (
                <View
                  style={{
                    position: "absolute",
                    top: -10,
                    width: 28,
                    height: 3,
                    borderRadius: 2,
                    backgroundColor: "#1a3fb5",
                  }}
                />
              )}
              <FontAwesome6 name="repeat" size={20} color={color} />
            </View>
          ),
          tabBarLabel: ({ color, focused }) => (
            <Text
              style={{
                fontSize: 10,
                fontWeight: focused ? "700" : "500",
                color,
              }}
            >
              Payments
            </Text>
          ),
        }}
      />

      {/* PROFILE */}
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <View style={{ alignItems: "center", gap: 4 }}>
              {focused && (
                <View
                  style={{
                    position: "absolute",
                    top: -10,
                    width: 28,
                    height: 3,
                    borderRadius: 2,
                    backgroundColor: "#1a3fb5",
                  }}
                />
              )}
              <Feather name="user" size={21} color={color} />
            </View>
          ),
          tabBarLabel: ({ color, focused }) => (
            <Text
              style={{
                fontSize: 10,
                fontWeight: focused ? "700" : "500",
                color,
              }}
            >
              Profile
            </Text>
          ),
        }}
      />
    </Tabs>
  );
}
