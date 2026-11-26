import Feather from "@expo/vector-icons/Feather";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { Tabs } from "expo-router";
import { Text, View } from "react-native";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,

        tabBarStyle: {
          position: "absolute",
          backgroundColor: "#FFFFFF",
          borderTopWidth: 1,
          borderTopColor: "#E2E8F0",
          height: 88,
          paddingBottom: 12,
          paddingTop: 10,
          shadowColor: "#0F172A",
          shadowOpacity: 0.06,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: -4 },
          elevation: 12,
        },

        tabBarActiveTintColor: "#1D4ED8",
        tabBarInactiveTintColor: "#64748B",

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
      {/* HOME */}
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
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
                    backgroundColor: "#1D4ED8",
                  }}
                />
              )}
              <Feather name="home" size={21} color={color} />
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
              Home
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
                    backgroundColor: "#1D4ED8",
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
                    backgroundColor: "#1D4ED8",
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
                    backgroundColor: "#1D4ED8",
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
