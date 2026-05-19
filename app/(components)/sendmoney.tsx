import { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StatusBar,
  Platform,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import API from "@/api/axiosInstance";
import { Bank } from "@/constant/bank";

const createIdempotencyKey = () =>
  `transfer-${Date.now()}-${Math.random().toString(16).slice(2)}`;

export default function SendMoney() {
  const [step, setStep] = useState<1 | 2>(1);

  // beneficiaries
  const [beneficiaries, setBeneficiaries] = useState<any[]>([]);
  const [loadingBeneficiaries, setLoadingBeneficiaries] = useState(false);
  const [selectedBeneficiary, setSelectedBeneficiary] = useState<string | null>(
    null,
  );

  // form
  const [accountNumber, setAccountNumber] = useState("");
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [pin, setPin] = useState("");

  // states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<any>(null);

  // ─── FETCH BENEFICIARIES ─────────────────────────────
  useEffect(() => {
    const fetchBeneficiaries = async () => {
      try {
        setLoadingBeneficiaries(true);

        const res = await API.get("/beneficiaries");

        setBeneficiaries(res.data?.data || []);
      } catch (err) {
        console.log("beneficiaries error:", err);
        setBeneficiaries([]);
      } finally {
        setLoadingBeneficiaries(false);
      }
    };

    fetchBeneficiaries();
  }, []);

  const selectedRecipient = beneficiaries.find(
    (b) => b._id === selectedBeneficiary,
  );

  // ─── TRANSFER ─────────────────────────────
  const handleTransfer = async () => {
    try {
      setLoading(true);
      setError("");

      const payload = {
        recipientAccount: selectedRecipient?.accountNumber || accountNumber,
        amount: Number(amount),
        description: note,
        transactionPin: pin,
        idempotencyKey: createIdempotencyKey(),
      };

      const res = await API.post("/transferFunds", payload);

      setSuccess(res.data);
      setStep(1);

      // reset form
      setAmount("");
      setNote("");
      setPin("");
    } catch (err: any) {
      setError(
        err?.response?.data?.message || "Transfer failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#f2f4f8" }}>
      <StatusBar barStyle="light-content" translucent />

      {/* HEADER */}
      <LinearGradient
        colors={["#1a1060", "#2541c4", "#6a3de8"]}
        style={{
          paddingTop: Platform.OS === "ios" ? 60 : 45,
          paddingBottom: 20,
          paddingHorizontal: 20,
        }}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>

        <Text
          style={{
            color: "#fff",
            fontSize: 18,
            fontWeight: "700",
            marginTop: 10,
          }}
        >
          Send Money
        </Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {/* STEP 1 ─ BENEFICIARIES */}
        {step === 1 && (
          <>
            <Text style={{ fontWeight: "700", marginBottom: 10 }}>
              Beneficiaries
            </Text>

            {loadingBeneficiaries ? (
              <ActivityIndicator />
            ) : beneficiaries.length === 0 ? (
              <Text style={{ color: "#94a3b8", marginBottom: 10 }}>
                No beneficiaries yet
              </Text>
            ) : (
              beneficiaries.map((b) => (
                <TouchableOpacity
                  key={b._id}
                  onPress={() => {
                    setSelectedBeneficiary(b._id);
                    setAccountNumber(b.accountNumber);
                    setSelectedBank(b.bankName);
                  }}
                  style={{
                    padding: 12,
                    backgroundColor: "#fff",
                    borderRadius: 12,
                    marginBottom: 10,
                  }}
                >
                  <Text style={{ fontWeight: "700" }}>{b.name}</Text>
                  <Text style={{ color: "#94a3b8" }}>
                    {b.bankName} • {b.accountNumber}
                  </Text>
                </TouchableOpacity>
              ))
            )}

            {/* MANUAL INPUT */}
            <TextInput
              placeholder="Account number"
              value={accountNumber}
              onChangeText={setAccountNumber}
              keyboardType="numeric"
              style={{
                backgroundColor: "#fff",
                padding: 14,
                borderRadius: 12,
                marginTop: 10,
              }}
            />

            <TouchableOpacity
              onPress={() => setStep(2)}
              style={{
                backgroundColor: "#2541c4",
                padding: 15,
                borderRadius: 12,
                alignItems: "center",
                marginTop: 15,
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "700" }}>Continue</Text>
            </TouchableOpacity>
          </>
        )}

        {/* STEP 2 ─ TRANSFER */}
        {step === 2 && (
          <>
            {/* SUMMARY */}
            <View
              style={{
                backgroundColor: "#fff",
                padding: 14,
                borderRadius: 12,
                marginBottom: 15,
              }}
            >
              <Text style={{ fontWeight: "700" }}>
                {selectedRecipient?.name || "New Recipient"}
              </Text>
              <Text style={{ color: "#94a3b8" }}>
                {selectedBank?.name || "Bank"} • {accountNumber}
              </Text>
            </View>

            {/* AMOUNT */}
            <TextInput
              placeholder="Amount"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              style={{
                backgroundColor: "#fff",
                padding: 18,
                borderRadius: 14,
                fontSize: 22,
                marginBottom: 12,
              }}
            />

            {/* NOTE */}
            <TextInput
              placeholder="Note (optional)"
              value={note}
              onChangeText={setNote}
              style={{
                backgroundColor: "#fff",
                padding: 14,
                borderRadius: 12,
                marginBottom: 12,
              }}
            />

            {/* PIN */}
            <TextInput
              placeholder="Transaction PIN"
              value={pin}
              onChangeText={setPin}
              keyboardType="numeric"
              secureTextEntry
              style={{
                backgroundColor: "#fff",
                padding: 14,
                borderRadius: 12,
                marginBottom: 12,
              }}
            />

            {/* ERROR */}
            {error ? (
              <Text style={{ color: "red", marginBottom: 10 }}>{error}</Text>
            ) : null}

            {/* SUCCESS */}
            {success ? (
              <Text style={{ color: "green", marginBottom: 10 }}>
                Transfer successful ✔
              </Text>
            ) : null}

            {/* BUTTON */}
            <TouchableOpacity
              onPress={handleTransfer}
              disabled={loading}
              style={{
                backgroundColor: loading ? "#94a3b8" : "#2ec4b6",
                padding: 16,
                borderRadius: 14,
                alignItems: "center",
              }}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ color: "#fff", fontWeight: "700" }}>
                  Send Money
                </Text>
              )}
            </TouchableOpacity>

            {/* BACK */}
            <TouchableOpacity
              onPress={() => setStep(1)}
              style={{ marginTop: 10 }}
            >
              <Text style={{ color: "#2541c4" }}>← Back</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}
