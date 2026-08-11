import { Feather } from "@expo/vector-icons";
import { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import ConfirmModal from "../../../model/confimmodal";
import SettingsHeader from "./components/settingsheader";
// import { getSessions, revokeSession } from "@/api/authapi";

type Session = {
  id: string;
  device: string;
  location: string;
  lastActive: string;
  current?: boolean;
};

// seed with data from your API
const MOCK_SESSIONS: Session[] = [
  {
    id: "1",
    device: "iPhone 15 Pro • Lagos",
    location: "This device",
    lastActive: "Active now",
    current: true,
  },
  {
    id: "2",
    device: "Chrome on Windows",
    location: "Lagos, Nigeria",
    lastActive: "2 hours ago",
  },
  {
    id: "3",
    device: "Samsung Galaxy S23",
    location: "Abuja, Nigeria",
    lastActive: "3 days ago",
  },
];

export default function SessionsScreen() {
  const [sessions, setSessions] = useState<Session[]>(MOCK_SESSIONS);
  const [target, setTarget] = useState<Session | null>(null);

  const handleRevoke = () => {
    if (!target) return;
    // await revokeSession(target.id);
    setSessions((prev) => prev.filter((s) => s.id !== target.id));
    setTarget(null);
  };

  return (
    <View className="flex-1 bg-white">
      <SettingsHeader title="Active Sessions & Devices" />

      <ScrollView
        className="flex-1 -mt-3 px-5"
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-10"
      >
        <View className="mt-3" />
        <View className="bg-surface-card rounded-md border border-surface-border shadow-card px-5">
          {sessions.map((session, i) => (
            <View
              key={session.id}
              className={`flex-row items-center py-4 ${
                i < sessions.length - 1 ? "border-b border-slate-100" : ""
              }`}
            >
              <View className="w-9 h-9 rounded-xl bg-sky-50 items-center justify-center mr-4">
                <Feather name="smartphone" size={16} color="#0ea5e9" />
              </View>
              <View className="flex-1">
                <Text className="text-slate-800 text-sm font-semibold">
                  {session.device}
                </Text>
                <Text className="text-slate-400 text-xs mt-0.5">
                  {session.location} · {session.lastActive}
                </Text>
              </View>
              {!session.current && (
                <TouchableOpacity onPress={() => setTarget(session)}>
                  <Text className="text-red-500 text-xs font-semibold">
                    Revoke
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
      </ScrollView>

      <ConfirmModal
        visible={!!target}
        title="Revoke Session"
        message={`Are you sure you want to log out ${target?.device ?? "this device"}?`}
        icon="log-out"
        confirmLabel="Revoke"
        onCancel={() => setTarget(null)}
        onConfirm={handleRevoke}
      />
    </View>
  );
}
