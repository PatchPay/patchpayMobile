import { Feather } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";

import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const C = {
  blue: "#3F58F7",
  blueSoft: "#EEF1FF",
  surface: "#FFFFFF",
  tile: "#F4F6FB",
  ink: "#0F172A",
  text: "#334155",
  muted: "#64748B",
  faint: "#94A3B8",
  line: "#E8ECF4",
  green: "#15803D",
  greenSoft: "#DCFCE7",
  red: "#DC2626",
  redSoft: "#FEE2E2",
  white: "#FFFFFF",
} as const;

type Side = "account" | "wallet";

type Props = {
  visible: boolean;
  onClose: () => void;
  walletBalance: number;
  accountBalance: number;
  currency: string;
  hasPin: boolean;
  /** Which balance the money leaves when the sheet opens */
  initialFrom?: Side;
  /** Formats a number as money in the user's currency */
  format: (amount: number) => string;
  /** Should throw an Error with a readable message on failure */
  onSubmit: (payload: {
    from: Side;
    to: Side;
    amount: number;
    pin: string;
  }) => Promise<void>;
  onSetPin: () => void;
};

const QUICK_AMOUNTS = [1000, 5000, 10000];
const NAMES: Record<Side, string> = {
  account: "Account balance",
  wallet: "Wallet balance",
};

const withCommas = (value: string) => {
  const digits = value.replace(/\D/g, "");
  return digits ? Number(digits).toLocaleString("en-US") : "";
};

export default function MoveMoneySheet({
  visible,
  onClose,
  walletBalance,
  accountBalance,
  currency,
  hasPin,
  initialFrom = "account",
  format,
  onSubmit,
  onSetPin,
}: Props) {
  const [from, setFrom] = useState<Side>(initialFrom);
  const [amountText, setAmountText] = useState("");
  const [pin, setPin] = useState("");
  const [step, setStep] = useState<"amount" | "pin" | "success">("amount");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const pinRef = useRef<TextInput>(null);

  // Fresh sheet every time it opens, with the requested direction preset
  useEffect(() => {
    setFrom(initialFrom);
    if (!visible) {
      setAmountText("");
      setPin("");
      setStep("amount");
      setBusy(false);
      setError("");
    }
  }, [visible, initialFrom]);

  if (!visible) return null;

  const to: Side = from === "account" ? "wallet" : "account";
  const balances: Record<Side, number> = {
    account: accountBalance,
    wallet: walletBalance,
  };

  const amount = Number(amountText.replace(/,/g, "")) || 0;
  const available = balances[from];
  const tooMuch = amount > available;
  const canContinue = amount >= 1 && !tooMuch;

  const close = () => {
    if (!busy) onClose();
  };

  const goNext = () => {
    if (!canContinue) return;
    if (!hasPin) {
      onClose();
      onSetPin();
      return;
    }
    setError("");
    setStep("pin");
  };

  const submit = async (code: string) => {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await onSubmit({ from, to, amount, pin: code });
      setStep("success");
    } catch (e: any) {
      setError(e?.message || "We couldn't move your money. Try again.");
      setPin("");
      pinRef.current?.focus();
    } finally {
      setBusy(false);
    }
  };

  const onPinChange = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 4);
    setPin(digits);
    if (digits.length === 4) submit(digits);
  };

  return (
    <View style={styles.overlay}>
      <Pressable
        style={styles.backdrop}
        onPress={close}
        accessibilityRole="button"
        accessibilityLabel="Close move money"
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboard}
      >
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <ScrollView
            style={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.content}
          >
            {/* ── Step 1: amount ───────────────────────────── */}
            {step === "amount" && (
              <>
                <View style={styles.header}>
                  <Text style={styles.title}>Move money</Text>
                  <Pressable
                    onPress={close}
                    hitSlop={10}
                    accessibilityRole="button"
                    accessibilityLabel="Close"
                    style={styles.closeButton}
                  >
                    <Feather name="x" size={18} color={C.muted} />
                  </Pressable>
                </View>

                <View style={styles.segment}>
                  {(["account", "wallet"] as Side[]).map((side) => {
                    const active = from === side;
                    const target = side === "account" ? "Wallet" : "Account";
                    const source = side === "account" ? "Account" : "Wallet";
                    return (
                      <Pressable
                        key={side}
                        onPress={() => {
                          setFrom(side);
                          setError("");
                        }}
                        accessibilityRole="button"
                        accessibilityState={{ selected: active }}
                        accessibilityLabel={`Move from ${source} balance to ${target} balance`}
                        style={[
                          styles.segmentItem,
                          active && styles.segmentActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.segmentText,
                            active && styles.segmentTextActive,
                          ]}
                        >
                          {source} to {target}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <View style={styles.amountBlock}>
                  <Text style={styles.currency}>{currency}</Text>
                  <TextInput
                    value={amountText}
                    onChangeText={(v) => setAmountText(withCommas(v))}
                    keyboardType="number-pad"
                    placeholder="0"
                    placeholderTextColor={C.faint}
                    accessibilityLabel={`Amount in ${currency}`}
                    style={[styles.amountInput, tooMuch && { color: C.red }]}
                    maxLength={13}
                  />
                </View>

                {tooMuch ? (
                  <Text style={styles.errorText}>
                    You have {format(available)} available in your {NAMES[from]}
                    .
                  </Text>
                ) : (
                  <Text style={styles.availableText}>
                    {format(available)} available in {NAMES[from]}
                  </Text>
                )}

                <View style={styles.chips}>
                  {QUICK_AMOUNTS.map((q) => {
                    const disabled = q > available;
                    return (
                      <Pressable
                        key={q}
                        disabled={disabled}
                        onPress={() => setAmountText(withCommas(String(q)))}
                        accessibilityRole="button"
                        accessibilityLabel={`Set amount to ${q}`}
                        style={[styles.chip, disabled && styles.chipDisabled]}
                      >
                        <Text style={styles.chipText}>
                          {q.toLocaleString("en-US")}
                        </Text>
                      </Pressable>
                    );
                  })}
                  <Pressable
                    disabled={available < 1}
                    onPress={() =>
                      setAmountText(withCommas(String(Math.floor(available))))
                    }
                    accessibilityRole="button"
                    accessibilityLabel="Use the full available amount"
                    style={[
                      styles.chip,
                      styles.chipMax,
                      available < 1 && styles.chipDisabled,
                    ]}
                  >
                    <Text style={[styles.chipText, { color: C.blue }]}>
                      Max
                    </Text>
                  </Pressable>
                </View>

                {canContinue && (
                  <View style={styles.preview}>
                    {(["account", "wallet"] as Side[]).map((side) => {
                      const after =
                        side === from
                          ? balances[side] - amount
                          : balances[side] + amount;
                      return (
                        <View key={side} style={styles.previewRow}>
                          <Text style={styles.previewLabel}>
                            {NAMES[side]} after
                          </Text>
                          <Text style={styles.previewValue}>
                            {format(after)}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                )}
              </>
            )}

            {/* ── Step 2: PIN ──────────────────────────────── */}
            {step === "pin" && (
              <>
                <View style={styles.header}>
                  <Pressable
                    onPress={() => {
                      if (busy) return;
                      setPin("");
                      setError("");
                      setStep("amount");
                    }}
                    hitSlop={10}
                    accessibilityRole="button"
                    accessibilityLabel="Back"
                    style={styles.closeButton}
                  >
                    <Feather name="arrow-left" size={18} color={C.muted} />
                  </Pressable>
                  <Text style={styles.title}>Enter your PIN</Text>
                  <View style={styles.closeButton} />
                </View>

                <Text style={styles.pinDescription}>
                  Confirm moving {format(amount)} from your {NAMES[from]} to
                  your {NAMES[to]}.
                </Text>

                <Pressable
                  onPress={() => pinRef.current?.focus()}
                  style={styles.pinRow}
                  accessibilityRole="button"
                  accessibilityLabel="Enter 4-digit transaction PIN"
                >
                  {[0, 1, 2, 3].map((i) => (
                    <View
                      key={i}
                      style={[
                        styles.pinBox,
                        pin.length === i && !busy && styles.pinBoxActive,
                        !!error && styles.pinBoxError,
                      ]}
                    >
                      {pin.length > i && <View style={styles.pinDot} />}
                    </View>
                  ))}
                </Pressable>

                <TextInput
                  ref={pinRef}
                  value={pin}
                  onChangeText={onPinChange}
                  keyboardType="number-pad"
                  secureTextEntry
                  maxLength={4}
                  autoFocus
                  editable={!busy}
                  style={styles.hiddenInput}
                  accessibilityLabel="Transaction PIN"
                />

                {busy ? (
                  <View style={styles.busyRow}>
                    <ActivityIndicator size="small" color={C.blue} />
                    <Text style={styles.availableText}>
                      Moving your money...
                    </Text>
                  </View>
                ) : error ? (
                  <Text style={[styles.errorText, { textAlign: "center" }]}>
                    {error}
                  </Text>
                ) : null}
              </>
            )}

            {/* ── Step 3: success ──────────────────────────── */}
            {step === "success" && (
              <View style={styles.successWrap}>
                <View style={styles.successIcon}>
                  <Feather name="check" size={28} color={C.green} />
                </View>
                <Text style={styles.title}>Money moved</Text>
                <Text style={styles.pinDescription}>
                  {format(amount)} is on its way to your {NAMES[to]}.
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Fixed footer button so it is always visible */}
          {/* Fixed footer button */}
          {step === "amount" && (
            <View style={styles.footer}>
              <TouchableOpacity
                onPress={goNext}
                disabled={!canContinue || busy}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Continue"
                style={[
                  styles.primary,
                  (!canContinue || busy) && styles.primaryDisabled,
                ]}
              >
                {busy ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={styles.primaryText}>
                      {hasPin ? "Continue" : "Set transaction PIN to continue"}
                    </Text>
                    <Feather name="arrow-right" size={17} color="#FFFFFF" />
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          {step === "success" && (
            <View style={styles.footer}>
              <TouchableOpacity
                onPress={onClose}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Done"
                style={styles.primary}
              >
                <Text style={styles.primaryText}>Done</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15,23,42,0.55)",
  },
  keyboard: {
    height: "92%",
    justifyContent: "flex-end",
  },

  sheet: {
    flex: 1,
    backgroundColor: C.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingBottom: Platform.OS === "ios" ? 28 : 12,
    overflow: "hidden",
  },

  scroll: {
    flex: 1,
  },

  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.line,
    alignSelf: "center",
    marginTop: 10,
  },

  content: {
    paddingHorizontal: 22,
    paddingTop: 16,
    paddingBottom: 20,
  },

  footer: {
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 120,
    backgroundColor: C.surface,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  title: { color: C.ink, fontSize: 19, fontWeight: "800" },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: C.tile,
    alignItems: "center",
    justifyContent: "center",
  },

  segment: {
    flexDirection: "row",
    backgroundColor: C.tile,
    borderRadius: 14,
    padding: 4,
  },
  segmentItem: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 11,

    alignItems: "center",
  },
  segmentActive: { backgroundColor: C.white },
  segmentText: { color: C.muted, fontSize: 12, fontWeight: "700" },
  segmentTextActive: { color: C.ink },

  amountBlock: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 28,
  },
  currency: { color: C.muted, fontSize: 16, fontWeight: "700", marginTop: 8 },
  amountInput: {
    color: C.ink,
    fontSize: 42,
    fontWeight: "800",
    letterSpacing: -1,
    minWidth: 60,
    paddingVertical: 0,
  },
  availableText: {
    color: C.muted,
    fontSize: 12,
    textAlign: "center",
    marginTop: 10,
  },
  errorText: {
    color: C.red,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 10,
    textAlign: "center",
  },

  chips: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginTop: 18,
  },
  chip: {
    borderRadius: 18,
    backgroundColor: C.tile,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipMax: { backgroundColor: C.blueSoft },
  chipDisabled: { opacity: 0.35 },
  chipText: { color: C.text, fontSize: 12, fontWeight: "700" },

  preview: {
    backgroundColor: C.tile,
    borderRadius: 14,
    padding: 14,
    marginTop: 20,
    gap: 9,
  },
  previewRow: { flexDirection: "row", justifyContent: "space-between" },
  previewLabel: { color: C.muted, fontSize: 12 },
  previewValue: { color: C.ink, fontSize: 12, fontWeight: "800" },

  primary: {
    minHeight: 52,
    backgroundColor: "#3F58F7",
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
  },
  primaryDisabled: { opacity: 0.4 },
  primaryText: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" },

  pinDescription: {
    color: C.muted,
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
  },
  pinRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginTop: 28,
    marginBottom: 6,
  },
  pinBox: {
    width: 54,
    height: 60,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: C.line,
    backgroundColor: C.tile,
    alignItems: "center",
    justifyContent: "center",
  },
  pinBoxActive: { borderColor: C.blue, backgroundColor: C.white },
  pinBoxError: { borderColor: C.red },
  pinDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: C.ink },
  hiddenInput: { position: "absolute", opacity: 0, height: 1, width: 1 },
  busyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 18,
  },

  successWrap: { alignItems: "center", paddingTop: 10, paddingBottom: 6 },
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: C.greenSoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
});
