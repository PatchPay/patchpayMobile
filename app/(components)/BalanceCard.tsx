import { Feather, Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const C = {
  blue: "#3F58F7",
  blueSoft: "#EEF1FF",
  surface: "#FFFFFF",
  tile: "#F4F6FB",
  ink: "#0F172A",
  muted: "#64748B",
  faint: "#94A3B8",
  line: "#E8ECF4",
  green: "#15803D",
  greenSoft: "#DCFCE7",
  red: "#DC2626",
  redSoft: "#FEE2E2",
  white: "#FFFFFF",
} as const;

type Props = {
  loading: boolean;
  visible: boolean;
  onToggleVisible: () => void;
  walletText: string;
  walletAvailableText: string;
  currency: string;
  accountNumber: string;
  isActive: boolean;
  onTopUp: () => void;
  onSendToOther: () => void;
};

type Option = {
  icon: string;
  title: string;
  description: string;
  onPress: () => void;
};

export default function BalanceCard({
  loading,
  visible,
  onToggleVisible,
  walletText,
  walletAvailableText,
  currency,
  accountNumber,
  isActive,
  onTopUp,
  onSendToOther,
}: Props) {
  const [copied, setCopied] = useState(false);
  const [choice, setChoice] = useState<"fund" | "send" | null>(null);

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const copy = async () => {
    if (accountNumber === "—") return;

    try {
      await Clipboard.setStringAsync(accountNumber);
      setCopied(true);

      if (timer.current) clearTimeout(timer.current);

      timer.current = setTimeout(() => setCopied(false), 1800);
    } catch {
      Alert.alert("Unable to copy", "Please try copying again.");
    }
  };

  const maskAmount = (amount: string) =>
    loading ? "—" : visible ? amount : "••••••••";

  const options: Option[] =
    choice === "fund"
      ? [
          {
            icon: "briefcase",
            title: "Top up from bank",
            description: "Add money from your bank",
            onPress: onTopUp,
          },
        ]
      : [
          {
            icon: "user",
            title: "To someone else",
            description: "Send money to another person",
            onPress: onSendToOther,
          },
        ];

  const closeChoice = () => setChoice(null);

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.topRow}>
        <View style={styles.walletHeading}>
          <View style={styles.walletIcon}>
            <Feather name="credit-card" size={15} color={C.blue} />
          </View>

          <Text style={styles.walletHeadingText}>My Wallet</Text>
        </View>

        <View style={styles.topRight}>
          <Text style={styles.currencyTag}>{currency}</Text>

          <Pressable
            onPress={onToggleVisible}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={visible ? "Hide balances" : "Show balances"}
            style={styles.eyeButton}
          >
            <Ionicons
              name={visible ? "eye-outline" : "eye-off-outline"}
              size={17}
              color={C.muted}
            />
          </Pressable>
        </View>
      </View>

      {/* Available balance */}
      <View style={styles.availableCard}>
        <View style={styles.availableHeader}>
          <View style={styles.availableIcon}>
            <Feather name="check-circle" size={15} color={C.green} />
          </View>

          <Text style={styles.availableTitle}>Available Balance</Text>

          <View style={styles.availableBadge}>
            {/* <Text style={styles.availableBadgeText}>Spendable</Text> */}
          </View>
        </View>

        <Text
          style={styles.availableAmount}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {maskAmount(walletAvailableText)}
        </Text>
      </View>

      {/* Wallet balance */}
      <View style={styles.walletBottom}>
        <View style={styles.walletBalanceInfo}>
          <Text style={styles.label}>Wallet Balance</Text>

          <Text
            style={styles.walletAmount}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {maskAmount(walletText)}
          </Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            onPress={() => setChoice("fund")}
            activeOpacity={0.8}
            style={styles.fundButton}
            accessibilityRole="button"
            accessibilityLabel="Fund wallet"
          >
            <Feather name="plus" size={14} color="#FFFFFF" />
            <Text style={styles.fundText}>Fund</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setChoice("send")}
            activeOpacity={0.8}
            style={styles.sendButton}
            accessibilityRole="button"
            accessibilityLabel="Send money"
          >
            <Feather name="arrow-up-right" size={14} color={C.blue} />
            <Text style={styles.sendText}>Send</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Account number */}
      <View style={styles.strip}>
        <View style={styles.stripInfo}>
          <Text style={styles.stripLabel}>Account Number</Text>

          <Text style={styles.stripNumber} numberOfLines={1}>
            {loading ? "Loading..." : accountNumber}
          </Text>
        </View>

        {!loading && accountNumber !== "—" && (
          <Pressable
            onPress={copy}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Copy account number"
            style={styles.copyButton}
          >
            <Feather
              name={copied ? "check" : "copy"}
              size={13}
              color={copied ? C.green : C.blue}
            />

            <Text style={[styles.copyText, copied && { color: C.green }]}>
              {copied ? "Copied" : "Copy"}
            </Text>
          </Pressable>
        )}

        <View
          style={[
            styles.status,
            {
              backgroundColor: isActive ? C.greenSoft : C.redSoft,
            },
          ]}
        >
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor: isActive ? C.green : C.red,
              },
            ]}
          />

          <Text
            style={[styles.statusText, { color: isActive ? C.green : C.red }]}
          >
            {isActive ? "Active" : "Inactive"}
          </Text>
        </View>
      </View>

      {/* Fund / Send chooser */}
      <Modal
        visible={!!choice}
        transparent
        animationType="fade"
        onRequestClose={closeChoice}
      >
        <View style={styles.modalRoot}>
          <Pressable
            style={styles.backdrop}
            onPress={closeChoice}
            accessibilityRole="button"
            accessibilityLabel="Close"
          />

          <View style={styles.sheet}>
            <View style={styles.handle} />

            <Text style={styles.sheetTitle}>
              {choice === "fund" ? "Fund Wallet" : "Send Money"}
            </Text>

            <Text style={styles.sheetSubtitle}>
              {choice === "fund"
                ? "Choose how you want to add money"
                : "Choose where you want to send money"}
            </Text>

            <View style={styles.optionList}>
              {options.map((opt) => (
                <TouchableOpacity
                  key={opt.title}
                  activeOpacity={0.8}
                  onPress={() => {
                    closeChoice();
                    opt.onPress();
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={opt.title}
                  style={styles.option}
                >
                  <View style={styles.optionIcon}>
                    <Feather name={opt.icon as any} size={18} color={C.blue} />
                  </View>

                  <View style={styles.optionInfo}>
                    <Text style={styles.optionTitle}>{opt.title}</Text>

                    <Text style={styles.optionDescription}>
                      {opt.description}
                    </Text>
                  </View>

                  <Feather name="chevron-right" size={18} color={C.faint} />
                </TouchableOpacity>
              ))}
            </View>

            <Pressable onPress={closeChoice} style={styles.cancel}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 10,
    marginTop: -46,
    backgroundColor: C.surface,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 14,
    shadowColor: "#0B1030",
    shadowOpacity: 0.14,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },

  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  walletHeading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  walletIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: C.blueSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  walletHeadingText: {
    color: C.ink,
    fontSize: 14,
    fontWeight: "800",
  },
  topRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  currencyTag: {
    color: C.muted,
    fontSize: 11.5,
    fontWeight: "700",
  },
  eyeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.tile,
  },

  availableCard: {
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#DCFCE7",
    borderRadius: 16,
    paddingHorizontal: 15,
    paddingVertical: 15,
  },
  availableHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  availableIcon: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: C.white,
    alignItems: "center",
    justifyContent: "center",
  },
  availableTitle: {
    color: "#166534",
    fontSize: 12,
    fontWeight: "700",
    flex: 1,
  },
  availableBadge: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  availableBadgeText: {
    color: "#166534",
    fontSize: 9,
    fontWeight: "700",
  },
  availableAmount: {
    color: "#14532D",
    fontSize: 29,
    fontWeight: "800",
    letterSpacing: -0.7,
    marginTop: 9,
  },
  availableHint: {
    color: "#4B7A5B",
    fontSize: 10.5,
    marginTop: 4,
  },

  walletBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    paddingHorizontal: 2,
    paddingVertical: 13,
  },
  walletBalanceInfo: {
    flex: 1,
    minWidth: 0,
  },
  label: {
    color: C.muted,
    fontSize: 11.5,
    fontWeight: "600",
  },
  walletAmount: {
    color: C.ink,
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.4,
    marginTop: 4,
  },

  actions: {
    flexDirection: "row",
    gap: 6,
  },
  fundButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 17,
    backgroundColor: C.blue,
  },
  fundText: {
    color: C.white,
    fontSize: 12.5,
    fontWeight: "800",
  },
  sendButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 17,
    backgroundColor: C.blueSoft,
  },
  sendText: {
    color: C.blue,
    fontSize: 12.5,
    fontWeight: "800",
  },

  strip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: C.tile,
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 12,
  },
  stripInfo: {
    flex: 1,
    minWidth: 0,
  },
  stripLabel: {
    color: C.muted,
    fontSize: 10,
  },
  stripNumber: {
    color: C.ink,
    fontSize: 13.5,
    fontWeight: "700",
    letterSpacing: 0.4,
    marginTop: 2,
  },
  copyButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  copyText: {
    color: C.blue,
    fontSize: 11.5,
    fontWeight: "700",
  },
  status: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10.5,
    fontWeight: "700",
  },

  modalRoot: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15,23,42,0.55)",
  },
  sheet: {
    backgroundColor: C.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 30,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.line,
    alignSelf: "center",
    marginBottom: 18,
  },
  sheetTitle: {
    color: C.ink,
    fontSize: 18,
    fontWeight: "800",
  },
  sheetSubtitle: {
    color: C.muted,
    fontSize: 12.5,
    marginTop: 5,
  },
  optionList: {
    marginTop: 18,
    gap: 10,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: C.tile,
    borderRadius: 16,
    padding: 14,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: C.white,
    alignItems: "center",
    justifyContent: "center",
  },
  optionInfo: {
    flex: 1,
    minWidth: 0,
  },
  optionTitle: {
    color: C.ink,
    fontSize: 14,
    fontWeight: "700",
  },
  optionDescription: {
    color: C.muted,
    fontSize: 11.5,
    marginTop: 4,
  },
  cancel: {
    alignItems: "center",
    paddingVertical: 16,
    marginTop: 6,
  },
  cancelText: {
    color: C.muted,
    fontSize: 13,
    fontWeight: "600",
  },
});
