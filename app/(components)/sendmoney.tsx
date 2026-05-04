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

const RECENTS = [
  { id: "1", name: "Akosua Amoo", initials: "AA", color: "#3a6df0", bg: "#eef2ff", bank: "GTBank" },
  { id: "2", name: "James Obi", initials: "JO", color: "#2ec4b6", bg: "#e8faf4", bank: "Access Bank" },
  { id: "3", name: "Fatima Bello", initials: "FB", color: "#e05c97", bg: "#fdf0f6", bank: "Zenith Bank" },
  { id: "4", name: "Chidi Nwosu", initials: "CN", color: "#f5a623", bg: "#fff8ec", bank: "UBA" },
];

const BANKS = ["GTBank", "Access Bank", "Zenith Bank", "UBA", "First Bank", "Kuda", "Opay"];

export default function SendMoney() {
  const [step, setStep] = useState<1 | 2>(1);
  const [accountNumber, setAccountNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [selectedBank, setSelectedBank] = useState("GTBank");
  const [selectedRecent, setSelectedRecent] = useState<string | null>(null);
  const [note, setNote] = useState("");

  return (
    <View style={{ flex: 1, backgroundColor: "#f2f4f8" }}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Header */}
      <LinearGradient
        colors={["#1a1060", "#1e2d8f", "#2541c4", "#6a3de8", "#b04fc9"]}
        locations={[0, 0.25, 0.5, 0.75, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingTop: Platform.OS === "ios" ? 58 : 46, paddingBottom: 30, paddingHorizontal: 20 }}
      >
        <View style={{ position: "absolute", top: 0, right: -20, width: 140, height: 140, borderRadius: 70, backgroundColor: "rgba(180,80,200,0.2)" }} />

        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 20 }}>
          <TouchableOpacity onPress={() => (step === 2 ? setStep(1) : router.back())}
            style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" }}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={{ color: "#fff", fontSize: 18, fontWeight: "700", marginLeft: 14 }}>Send Money</Text>

          {/* Step indicator */}
          <View style={{ flexDirection: "row", gap: 6, marginLeft: "auto" }}>
            {[1, 2].map((s) => (
              <View key={s} style={{ width: s === step ? 22 : 8, height: 8, borderRadius: 4, backgroundColor: s === step ? "#fff" : "rgba(255,255,255,0.35)" }} />
            ))}
          </View>
        </View>

        <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>
          {step === 1 ? "Who are you sending to?" : "How much are you sending?"}
        </Text>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 110 }}>

        {step === 1 ? (
          <>
            {/* Recent recipients */}
            <Text style={{ color: "#64748b", fontSize: 12, fontWeight: "600", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 14 }}>
              Recent
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 28, marginHorizontal: -20 }} contentContainerStyle={{ paddingHorizontal: 20, gap: 14 }}>
              {RECENTS.map((r) => (
                <TouchableOpacity key={r.id} onPress={() => setSelectedRecent(r.id)} activeOpacity={0.8}
                  style={{ alignItems: "center", width: 70 }}>
                  <View style={{
                    width: 58, height: 58, borderRadius: 29,
                    backgroundColor: r.bg,
                    alignItems: "center", justifyContent: "center",
                    borderWidth: 2.5,
                    borderColor: selectedRecent === r.id ? r.color : "transparent",
                    marginBottom: 6,
                  }}>
                    <Text style={{ color: r.color, fontWeight: "800", fontSize: 16 }}>{r.initials}</Text>
                  </View>
                  <Text style={{ color: "#0f1923", fontSize: 11, fontWeight: "600", textAlign: "center" }} numberOfLines={1}>{r.name.split(" ")[0]}</Text>
                  <Text style={{ color: "#94a3b8", fontSize: 10, textAlign: "center" }} numberOfLines={1}>{r.bank}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Manual input */}
            <Text style={{ color: "#64748b", fontSize: 12, fontWeight: "600", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 12 }}>
              Or enter details
            </Text>

            {/* Bank selector */}
            <View style={{ backgroundColor: "#fff", borderRadius: 14, padding: 14, marginBottom: 10, flexDirection: "row", alignItems: "center", shadowColor: "#000", shadowOpacity: 0.03, elevation: 1 }}>
              <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: "#eef2ff", alignItems: "center", justifyContent: "center", marginRight: 12 }}>
                <Feather name="home" size={18} color="#3a6df0" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: "#94a3b8", fontSize: 11, marginBottom: 2 }}>Bank</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    {BANKS.map((b) => (
                      <TouchableOpacity key={b} onPress={() => setSelectedBank(b)}
                        style={{ paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, backgroundColor: selectedBank === b ? "#3a6df0" : "#f1f5f9" }}>
                        <Text style={{ fontSize: 12, fontWeight: "600", color: selectedBank === b ? "#fff" : "#475569" }}>{b}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            </View>

            {/* Account number */}
            <View style={{ backgroundColor: "#fff", borderRadius: 14, padding: 14, marginBottom: 24, flexDirection: "row", alignItems: "center", shadowColor: "#000", shadowOpacity: 0.03, elevation: 1 }}>
              <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: "#e8faf4", alignItems: "center", justifyContent: "center", marginRight: 12 }}>
                <Feather name="hash" size={18} color="#2ec4b6" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: "#94a3b8", fontSize: 11, marginBottom: 2 }}>Account Number</Text>
                <TextInput
                  value={accountNumber}
                  onChangeText={setAccountNumber}
                  placeholder="Enter 10-digit number"
                  placeholderTextColor="#cbd5e1"
                  keyboardType="number-pad"
                  maxLength={10}
                  style={{ color: "#0f1923", fontSize: 15, fontWeight: "600", padding: 0 }}
                />
              </View>
              {accountNumber.length === 10 && <Feather name="check-circle" size={20} color="#2ec4b6" />}
            </View>

            <TouchableOpacity onPress={() => setStep(2)} activeOpacity={0.88}>
              <LinearGradient colors={["#2541c4", "#6a3de8"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={{ borderRadius: 16, paddingVertical: 17, alignItems: "center", shadowColor: "#6a3de8", shadowOpacity: 0.4, shadowRadius: 16, elevation: 8 }}>
                <Text style={{ color: "#fff", fontSize: 16, fontWeight: "800" }}>Continue</Text>
              </LinearGradient>
            </TouchableOpacity>
          </>
        ) : (
          <>
            {/* Recipient summary */}
            <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 16, flexDirection: "row", alignItems: "center", marginBottom: 24, shadowColor: "#000", shadowOpacity: 0.04, elevation: 2 }}>
              <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: "#eef2ff", alignItems: "center", justifyContent: "center", marginRight: 14 }}>
                <Text style={{ color: "#3a6df0", fontWeight: "800", fontSize: 16 }}>
                  {selectedRecent ? RECENTS.find(r => r.id === selectedRecent)?.initials : "??"}
                </Text>
              </View>
              <View>
                <Text style={{ color: "#0f1923", fontWeight: "700", fontSize: 14 }}>
                  {selectedRecent ? RECENTS.find(r => r.id === selectedRecent)?.name : "Account Holder"}
                </Text>
                <Text style={{ color: "#94a3b8", fontSize: 12 }}>{selectedBank} • {accountNumber || "0000000000"}</Text>
              </View>
              <TouchableOpacity onPress={() => setStep(1)} style={{ marginLeft: "auto" }}>
                <Text style={{ color: "#3a6df0", fontSize: 13, fontWeight: "600" }}>Change</Text>
              </TouchableOpacity>
            </View>

            {/* Amount input */}
            <View style={{ backgroundColor: "#fff", borderRadius: 20, padding: 22, marginBottom: 16, alignItems: "center", shadowColor: "#000", shadowOpacity: 0.04, elevation: 2 }}>
              <Text style={{ color: "#94a3b8", fontSize: 12, marginBottom: 10 }}>Amount to send</Text>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text style={{ color: "#cbd5e1", fontSize: 32, fontWeight: "700", marginRight: 4 }}>₦</Text>
                <TextInput
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="0.00"
                  placeholderTextColor="#cbd5e1"
                  keyboardType="numeric"
                  style={{ color: "#0f1923", fontSize: 46, fontWeight: "800", letterSpacing: -1, minWidth: 80 }}
                  autoFocus
                />
              </View>
              <Text style={{ color: "#94a3b8", fontSize: 12, marginTop: 8 }}>Fee: ₦0.00 • You pay: ₦{amount ? Number(amount).toLocaleString() : "0.00"}</Text>
            </View>

            {/* Note */}
            <View style={{ backgroundColor: "#fff", borderRadius: 14, padding: 14, marginBottom: 28, shadowColor: "#000", shadowOpacity: 0.03, elevation: 1 }}>
              <Text style={{ color: "#94a3b8", fontSize: 11, marginBottom: 6 }}>Note (optional)</Text>
              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder="What's this for?"
                placeholderTextColor="#cbd5e1"
                style={{ color: "#0f1923", fontSize: 14, padding: 0 }}
              />
            </View>

            <TouchableOpacity activeOpacity={0.88}>
              <LinearGradient colors={["#2ec4b6", "#1aaa9e"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={{ borderRadius: 16, paddingVertical: 17, alignItems: "center", shadowColor: "#2ec4b6", shadowOpacity: 0.4, shadowRadius: 16, elevation: 8 }}>
                <Text style={{ color: "#fff", fontSize: 16, fontWeight: "800" }}>
                  Send {amount ? `₦${Number(amount).toLocaleString()}` : ""}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}