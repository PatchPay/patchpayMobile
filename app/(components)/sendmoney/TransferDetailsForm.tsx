import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { TransferResponse } from "@/hooks/useTransfer";

type Props = {
  recipientName: string;
  bankName: string;
  accountNumber: string;
  amount: string;
  note: string;
  pin: string;
  loading: boolean;
  error: string;
  success: TransferResponse | null;
  onChangeAmount: (v: string) => void;
  onChangeNote: (v: string) => void;
  onChangePin: (v: string) => void;
  onSubmit: () => void;
  onBack: () => void;
};

export default function TransferDetailsForm({
  recipientName,
  bankName,
  accountNumber,
  amount,
  note,
  pin,
  loading,
  error,
  success,
  onChangeAmount,
  onChangeNote,
  onChangePin,
  onSubmit,
  onBack,
}: Props) {
  const canSubmit =
    !loading && amount.length > 0 && Number(amount) > 0 && pin.length > 0;
  const successMessage =
    typeof success?.message === "string"
      ? success.message
      : "Transfer successful";

  return (
    <View>
      <View style={styles.summaryCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(recipientName || "?").slice(0, 2).toUpperCase()}
          </Text>
        </View>
        <View>
          <Text style={styles.recipientName}>
            {recipientName || "Verified recipient"}
          </Text>
          <Text style={styles.recipientSub}>
            {bankName} - {accountNumber}
          </Text>
        </View>
      </View>

      <TextInput
        placeholder="NGN Amount"
        value={amount}
        onChangeText={onChangeAmount}
        keyboardType="numeric"
        style={[styles.input, styles.amountInput]}
      />

      <TextInput
        placeholder="Note (optional)"
        value={note}
        onChangeText={onChangeNote}
        style={styles.input}
      />

      <TextInput
        placeholder="Transaction PIN"
        value={pin}
        onChangeText={onChangePin}
        keyboardType="numeric"
        secureTextEntry
        style={styles.input}
      />

      {!!error && <Text style={styles.error}>{error}</Text>}
      {!!success && <Text style={styles.success}>{successMessage}</Text>}

      <TouchableOpacity
        onPress={onSubmit}
        disabled={!canSubmit}
        style={[styles.btn, !canSubmit && styles.btnDisabled]}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnText}>Send money</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={onBack} style={styles.back}>
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  summaryCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 14,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#CECBF6",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 13, fontWeight: "600", color: "#3C3489" },
  recipientName: { fontSize: 15, fontWeight: "600" },
  recipientSub: { fontSize: 12, color: "#94a3b8" },
  input: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    fontSize: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 10,
  },
  amountInput: { fontSize: 22, padding: 18 },
  error: { color: "#e24b4a", marginBottom: 10, fontSize: 13 },
  success: { color: "#1d9e75", marginBottom: 10, fontSize: 13 },
  btn: {
    backgroundColor: "#2ec4b6",
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 4,
  },
  btnDisabled: { backgroundColor: "#94a3b8" },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  back: { marginTop: 12, alignItems: "center" },
  backText: { color: "#2541c4", fontSize: 14 },
});
