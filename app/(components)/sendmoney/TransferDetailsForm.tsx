import { TransferResponse } from "@/hooks/useTransfer";
import { Feather } from "@expo/vector-icons";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type Props = {
  recipientName: string;
  bankName: string;
  recipientAccount: string;
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

const NUMPAD = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  ["", "0", "del"],
];

export default function TransferDetailsForm({
  recipientName,
  bankName,
  recipientAccount,
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

  const handleNumpadPress = (key: string) => {
    if (pin.length < 4) {
      onChangePin(pin + key);
    }
  };

  const handleDelete = () => {
    onChangePin(pin.slice(0, -1));
  };

  const formattedAmount =
    amount.length > 0 ? Number(amount).toLocaleString("en-NG") : "";

  return (
    <View style={styles.screen}>
      <TouchableOpacity onPress={onBack} style={styles.back} hitSlop={8}>
        <Feather name="chevron-left" size={20} color="#64748B" />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      <View style={styles.recipientRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(recipientName || "?").slice(0, 2).toUpperCase()}
          </Text>
        </View>
        <View style={styles.recipientInfo}>
          <Text style={styles.recipientName}>
            {recipientName || "Verified recipient"}
          </Text>
          <Text style={styles.recipientSub}>
            {bankName} · {recipientAccount}
          </Text>
        </View>
        <View style={styles.verifiedPill}>
          <Feather name="check" size={11} color="#16A34A" />
          <Text style={styles.verifiedText}>Verified</Text>
        </View>
      </View>

      <View style={styles.amountBlock}>
        <Text style={styles.amountLabel}>Amount</Text>
        <View style={styles.amountRow}>
          <Text style={styles.currencyPrefix}>₦</Text>
          <TextInput
            placeholder="0"
            placeholderTextColor="#CBD5E1"
            value={formattedAmount}
            onChangeText={(v) => onChangeAmount(v.replace(/[^0-9]/g, ""))}
            keyboardType="numeric"
            style={styles.amountInput}
          />
        </View>
      </View>

      <View style={styles.noteRow}>
        <Feather name="edit-3" size={15} color="#94A3B8" />
        <TextInput
          placeholder="Add a note (optional)"
          placeholderTextColor="#94A3B8"
          value={note}
          onChangeText={onChangeNote}
          style={styles.noteInput}
        />
      </View>

      <Text style={styles.pinLabel}>Enter your PIN to confirm</Text>

      <View style={styles.pinDisplay}>
        {Array.from({ length: 4 }).map((_, i) => (
          <View
            key={i}
            style={[styles.pinDot, i < pin.length && styles.pinDotFilled]}
          />
        ))}
      </View>

      {!!error && (
        <View style={styles.errorBox}>
          <Feather name="alert-circle" size={14} color="#DC2626" />
          <Text style={styles.error}>{error}</Text>
        </View>
      )}
      {!!success && (
        <View style={styles.successBox}>
          <Feather name="check-circle" size={14} color="#16A34A" />
          <Text style={styles.success}>{successMessage}</Text>
        </View>
      )}

      <View style={styles.numpad}>
        {NUMPAD.map((row, r) => (
          <View key={r} style={styles.numRow}>
            {row.map((key, c) => {
              if (key === "") {
                return <View key={c} style={styles.keyEmpty} />;
              }

              if (key === "del") {
                return (
                  <TouchableOpacity
                    key={c}
                    style={styles.key}
                    onPress={handleDelete}
                    activeOpacity={0.6}
                  >
                    <Feather name="delete" size={19} color="#0F172A" />
                  </TouchableOpacity>
                );
              }

              return (
                <TouchableOpacity
                  key={c}
                  style={styles.key}
                  onPress={() => handleNumpadPress(key)}
                  activeOpacity={0.6}
                >
                  <Text style={styles.keyText}>{key}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>

      <TouchableOpacity
        onPress={onSubmit}
        disabled={!canSubmit}
        style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
        activeOpacity={0.85}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitText}>Send money</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const COLORS = {
  bg: "#F8FAFC",
  card: "#FFFFFF",
  border: "#E2E8F0",
  textPrimary: "#0F172A",
  textSecondary: "#64748B",
  textMuted: "#94A3B8",
  accent: "#4F46E5",
  accentMuted: "#EEF2FF",
  success: "#16A34A",
  successBg: "#F0FDF4",
  error: "#DC2626",
  errorBg: "#FEF2F2",
  disabled: "#CBD5E1",
};

const styles = StyleSheet.create({
  screen: {
    backgroundColor: COLORS.bg,
    padding: 20,
  },
  back: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },
  backText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 2,
  },

  // Recipient
  recipientRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.accentMuted,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarText: { fontSize: 13, fontWeight: "700", color: COLORS.accent },
  recipientInfo: { flex: 1 },
  recipientName: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  recipientSub: { fontSize: 12.5, color: COLORS.textSecondary, marginTop: 2 },
  verifiedPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.successBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 3,
  },
  verifiedText: { fontSize: 11, fontWeight: "600", color: COLORS.success },

  // Amount
  amountBlock: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 18,
    paddingHorizontal: 18,
    marginBottom: 12,
  },
  amountLabel: {
    fontSize: 12.5,
    color: COLORS.textSecondary,
    fontWeight: "500",
    marginBottom: 6,
  },
  amountRow: { flexDirection: "row", alignItems: "center" },
  currencyPrefix: {
    fontSize: 28,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginRight: 6,
  },
  amountInput: {
    flex: 1,
    fontSize: 28,
    fontWeight: "700",
    color: COLORS.textPrimary,
    padding: 0,
  },

  // Note
  noteRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 22,
    gap: 8,
  },
  noteInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
    padding: 0,
  },

  // PIN
  pinLabel: {
    textAlign: "center",
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: "500",
    marginBottom: 12,
  },
  pinDisplay: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 14,
    marginBottom: 16,
  },
  pinDot: {
    width: 13,
    height: 13,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: COLORS.disabled,
    backgroundColor: "transparent",
  },
  pinDotFilled: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },

  // Feedback
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.errorBg,
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  error: { color: COLORS.error, fontSize: 13, fontWeight: "500" },
  successBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.successBg,
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  success: { color: COLORS.success, fontSize: 13, fontWeight: "500" },

  // Numpad
  numpad: { marginBottom: 20 },
  numRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  key: {
    flex: 1,
    marginHorizontal: 6,
    height: 58,
    borderRadius: 16,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  keyText: {
    fontSize: 19,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  keyEmpty: {
    flex: 1,
    marginHorizontal: 6,
    height: 58,
  },

  // CTA
  submitBtn: {
    backgroundColor: COLORS.accent,
    paddingVertical: 17,
    borderRadius: 16,
    alignItems: "center",
  },
  submitBtnDisabled: { backgroundColor: COLORS.disabled },
  submitText: { color: "#fff", fontWeight: "700", fontSize: 15.5 },
});
