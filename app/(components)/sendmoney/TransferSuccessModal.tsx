import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import { TransferResponse } from "@/hooks/useTransfer";
import { TransferType } from "./TransferTypeSelector";

type Props = {
  visible: boolean;
  transferType: TransferType | null;
  recipientName: string;
  bankName: string;
  recipientAccount: string;
  amount: string;
  note: string;
  success: TransferResponse | null;
  onDone: () => void;
  onSendAnother: () => void;
};

const formatAmount = (raw: string) => {
  const num = Number(raw);
  if (!num) return "—";
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
  }).format(num);
};

export default function TransferSuccessModal({
  visible,
  transferType,
  recipientName,
  bankName,
  recipientAccount,
  amount,
  note,
  success,
  onDone,
  onSendAnother,
}: Props) {
  const isInternal = transferType === "internal";

  const reference =
    (success?.data as { transaction?: { reference?: string } } | undefined)
      ?.transaction?.reference ??
    (success?.transaction as { reference?: string } | undefined)?.reference ??
    null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* Icon */}
            <View
              style={[
                styles.iconRing,
                isInternal ? styles.iconRingTeal : styles.iconRingPurple,
              ]}
            >
              <Ionicons
                name="checkmark-circle"
                size={44}
                color={isInternal ? "#1D9E75" : "#534AB7"}
              />
            </View>

            {/* Badge */}
            <View
              style={[
                styles.badge,
                isInternal ? styles.badgeTeal : styles.badgePurple,
              ]}
            >
              <MaterialCommunityIcons
                name={isInternal ? "bank" : "swap-horizontal"}
                size={13}
                color={isInternal ? "#0F6E56" : "#534AB7"}
              />
              <Text
                style={[
                  styles.badgeText,
                  isInternal ? styles.badgeTextTeal : styles.badgeTextPurple,
                ]}
              >
                {isInternal ? "PatchPay" : "External"}
              </Text>
            </View>

            <Text style={styles.title}>Money sent</Text>
            <Text style={styles.sub}>Your transfer was processed.</Text>
            <Text style={styles.amount}>{formatAmount(amount)}</Text>

            {/* Detail rows */}
            <View style={styles.details}>
              <DetailRow label="To" value={recipientName || "—"} />
              {!isInternal && <DetailRow label="Bank" value={bankName} />}
              <DetailRow label="Account" value={recipientAccount || "—"} />
              {!!note && <DetailRow label="Note" value={note} />}
              {!!reference && (
                <DetailRow label="Reference" value={reference} last />
              )}
            </View>

            {/* Actions */}
            <TouchableOpacity
              style={[
                styles.btnPrimary,
                isInternal ? styles.btnTeal : styles.btnPurple,
              ]}
              onPress={onDone}
              activeOpacity={0.85}
            >
              <Text style={styles.btnPrimaryText}>Done</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.btnGhost}
              onPress={onSendAnother}
              activeOpacity={0.7}
            >
              <Text style={styles.btnGhostText}></Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function DetailRow({
  label,
  value,
  last = false,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.row, !last && styles.rowBorder]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    flex: 1,
  },
  content: {
    padding: 28,
    alignItems: "center",
  },
  iconRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  iconRingTeal: { backgroundColor: "#E1F5EE" },
  iconRingPurple: { backgroundColor: "#EEEDFE" },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 16,
  },
  badgeTeal: { backgroundColor: "#E1F5EE" },
  badgePurple: { backgroundColor: "#EEEDFE" },
  badgeText: { fontSize: 12, fontWeight: "600" },
  badgeTextTeal: { color: "#0F6E56" },
  badgeTextPurple: { color: "#534AB7" },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 4,
  },
  sub: {
    fontSize: 13,
    color: "#94a3b8",
    marginBottom: 16,
  },
  amount: {
    fontSize: 30,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 22,
  },
  details: {
    width: "100%",
    backgroundColor: "#f8fafc",
    borderRadius: 14,
    paddingHorizontal: 16,
    marginBottom: 22,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 11,
  },
  rowBorder: {
    borderBottomWidth: 0.5,
    borderBottomColor: "#e2e8f0",
  },
  rowLabel: { fontSize: 13, color: "#94a3b8" },
  rowValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1e293b",
    maxWidth: "60%",
    textAlign: "right",
  },
  btnPrimary: {
    width: "100%",
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 10,
  },
  btnTeal: { backgroundColor: "#2ec4b6" },
  btnPurple: { backgroundColor: "#2541c4" },
  btnPrimaryText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  btnGhost: {
    width: "100%",
    padding: 12,
    alignItems: "center",
  },
  btnGhostText: { color: "#94a3b8", fontSize: 14 },
});
