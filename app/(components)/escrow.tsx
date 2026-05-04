import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StatusBar,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather, Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

const ACTIVE_ESCROWS = [
  {
    id: "1",
    title: "Project X Design",
    party: "Chidi Nwosu",
    initials: "CN",
    amount: "₦450,000",
    status: "IN PROGRESS",
    statusColor: "#3a6df0",
    statusBg: "#eef2ff",
    due: "Nov 12, 2023",
    progress: 0.6,
  },
  {
    id: "2",
    title: "Logo Branding",
    party: "Fatima Bello",
    initials: "FB",
    amount: "₦120,000",
    status: "AWAITING RELEASE",
    statusColor: "#f5a623",
    statusBg: "#fff8ec",
    due: "Oct 30, 2023",
    progress: 1,
  },
];

export default function EscrowScreen() {
  const [tab, setTab] = useState<"active" | "new">("active");
  const [title, setTitle] = useState("");
  const [partyEmail, setPartyEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");

  return (
    <View style={{ flex: 1, backgroundColor: "#f2f4f8" }}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Header */}
      <LinearGradient
        colors={["#1a1060", "#1e2d8f", "#2541c4", "#6a3de8", "#b04fc9"]}
        locations={[0, 0.25, 0.5, 0.75, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingTop: Platform.OS === "ios" ? 58 : 46, paddingBottom: 28, paddingHorizontal: 20 }}
      >
        <View style={{ position: "absolute", top: 0, right: -20, width: 120, height: 120, borderRadius: 60, backgroundColor: "rgba(180,80,200,0.2)" }} />

        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 20 }}>
          <TouchableOpacity onPress={() => router.back()}
            style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" }}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={{ color: "#fff", fontSize: 18, fontWeight: "700", marginLeft: 14 }}>Escrow</Text>
          <View style={{ marginLeft: "auto", flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 }}>
            <Feather name="shield" size={13} color="#4ade80" />
            <Text style={{ color: "#4ade80", fontSize: 12, fontWeight: "700" }}>Protected</Text>
          </View>
        </View>

        {/* Tab switcher */}
        <View style={{ flexDirection: "row", backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 14, padding: 4 }}>
          {(["active", "new"] as const).map((t) => (
            <TouchableOpacity key={t} onPress={() => setTab(t)} style={{ flex: 1, paddingVertical: 10, borderRadius: 11, alignItems: "center", backgroundColor: tab === t ? "#fff" : "transparent" }}>
              <Text style={{ fontSize: 13, fontWeight: "700", color: tab === t ? "#2541c4" : "rgba(255,255,255,0.7)" }}>
                {t === "active" ? "Active Escrows" : "New Escrow"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 110 }}>

        {tab === "active" ? (
          <>
            {/* Summary stats */}
            <View style={{ flexDirection: "row", gap: 12, marginBottom: 24 }}>
              {[
                { label: "Total Held", value: "₦570,000", color: "#3a6df0", bg: "#eef2ff" },
                { label: "Completed", value: "3 deals", color: "#2ec4b6", bg: "#e8faf4" },
              ].map((s) => (
                <View key={s.label} style={{ flex: 1, backgroundColor: "#fff", borderRadius: 16, padding: 16, shadowColor: "#000", shadowOpacity: 0.04, elevation: 2 }}>
                  <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: s.bg, alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
                    <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: s.color }} />
                  </View>
                  <Text style={{ color: "#94a3b8", fontSize: 11, marginBottom: 4 }}>{s.label}</Text>
                  <Text style={{ color: "#0f1923", fontWeight: "800", fontSize: 18 }}>{s.value}</Text>
                </View>
              ))}
            </View>

            {/* Escrow cards */}
            {ACTIVE_ESCROWS.map((e) => (
              <TouchableOpacity key={e.id} activeOpacity={0.8}
                style={{ backgroundColor: "#fff", borderRadius: 20, padding: 18, marginBottom: 14, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 }}>
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 14 }}>
                  <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: "#eef2ff", alignItems: "center", justifyContent: "center", marginRight: 12 }}>
                    <Text style={{ color: "#3a6df0", fontWeight: "800", fontSize: 15 }}>{e.initials}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: "#0f1923", fontWeight: "700", fontSize: 15 }}>{e.title}</Text>
                    <Text style={{ color: "#94a3b8", fontSize: 12, marginTop: 2 }}>with {e.party}</Text>
                  </View>
                  <View style={{ backgroundColor: e.statusBg, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 }}>
                    <Text style={{ color: e.statusColor, fontSize: 10, fontWeight: "800", letterSpacing: 0.5 }}>{e.status}</Text>
                  </View>
                </View>

                {/* Progress bar */}
                <View style={{ height: 6, backgroundColor: "#f1f5f9", borderRadius: 3, marginBottom: 12, overflow: "hidden" }}>
                  <LinearGradient colors={["#2541c4", "#6a3de8"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={{ width: `${e.progress * 100}%`, height: "100%", borderRadius: 3 }} />
                </View>

                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <View>
                    <Text style={{ color: "#94a3b8", fontSize: 11 }}>Amount held</Text>
                    <Text style={{ color: "#0f1923", fontWeight: "800", fontSize: 18 }}>{e.amount}</Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={{ color: "#94a3b8", fontSize: 11 }}>Due date</Text>
                    <Text style={{ color: "#0f1923", fontWeight: "600", fontSize: 13 }}>{e.due}</Text>
                  </View>
                  {e.progress === 1 && (
                    <TouchableOpacity>
                      <LinearGradient colors={["#2ec4b6", "#1aaa9e"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                        style={{ borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10 }}>
                        <Text style={{ color: "#fff", fontWeight: "700", fontSize: 13 }}>Release</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </>
        ) : (
          <>
            {/* New escrow form */}
            <Text style={{ color: "#64748b", fontSize: 12, fontWeight: "600", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 16 }}>
              Escrow Details
            </Text>

            {[
              { label: "Project / Deal Title", value: title, setter: setTitle, placeholder: "e.g. Website Redesign", icon: "briefcase", color: "#3a6df0", bg: "#eef2ff" },
              { label: "Other Party Email", value: partyEmail, setter: setPartyEmail, placeholder: "their@email.com", icon: "user", color: "#e05c97", bg: "#fdf0f6" },
              { label: "Amount (₦)", value: amount, setter: setAmount, placeholder: "0.00", icon: "dollar-sign", color: "#f5a623", bg: "#fff8ec", keyboard: "numeric" },
            ].map((field) => (
              <View key={field.label} style={{ backgroundColor: "#fff", borderRadius: 14, padding: 14, marginBottom: 12, flexDirection: "row", alignItems: "center", shadowColor: "#000", shadowOpacity: 0.03, elevation: 1 }}>
                <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: field.bg, alignItems: "center", justifyContent: "center", marginRight: 12 }}>
                  <Feather name={field.icon as any} size={18} color={field.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: "#94a3b8", fontSize: 11, marginBottom: 4 }}>{field.label}</Text>
                  <TextInput
                    value={field.value}
                    onChangeText={field.setter}
                    placeholder={field.placeholder}
                    placeholderTextColor="#cbd5e1"
                    keyboardType={(field as any).keyboard ?? "default"}
                    style={{ color: "#0f1923", fontSize: 14, fontWeight: "600", padding: 0 }}
                  />
                </View>
              </View>
            ))}

            {/* Description */}
            <View style={{ backgroundColor: "#fff", borderRadius: 14, padding: 14, marginBottom: 28, shadowColor: "#000", shadowOpacity: 0.03, elevation: 1 }}>
              <Text style={{ color: "#94a3b8", fontSize: 11, marginBottom: 6 }}>Description / Terms</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Describe the deliverables and conditions..."
                placeholderTextColor="#cbd5e1"
                multiline
                numberOfLines={4}
                style={{ color: "#0f1923", fontSize: 14, padding: 0, height: 90, textAlignVertical: "top" }}
              />
            </View>

            {/* How it works */}
            <View style={{ backgroundColor: "#eef2ff", borderRadius: 16, padding: 16, marginBottom: 28 }}>
              <Text style={{ color: "#2541c4", fontWeight: "700", fontSize: 13, marginBottom: 10 }}>How Escrow Works</Text>
              {["You deposit funds securely into escrow.", "The other party completes the agreed work.", "You release funds once satisfied."].map((step, i) => (
                <View key={i} style={{ flexDirection: "row", alignItems: "flex-start", marginBottom: 8 }}>
                  <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: "#3a6df0", alignItems: "center", justifyContent: "center", marginRight: 10, marginTop: 1 }}>
                    <Text style={{ color: "#fff", fontSize: 11, fontWeight: "800" }}>{i + 1}</Text>
                  </View>
                  <Text style={{ color: "#475569", fontSize: 13, flex: 1, lineHeight: 20 }}>{step}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity activeOpacity={0.88}>
              <LinearGradient colors={["#f5a623", "#e8960f"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={{ borderRadius: 16, paddingVertical: 17, alignItems: "center", shadowColor: "#f5a623", shadowOpacity: 0.4, shadowRadius: 16, elevation: 8 }}>
                <Text style={{ color: "#fff", fontSize: 16, fontWeight: "800" }}>Create Escrow</Text>
              </LinearGradient>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}