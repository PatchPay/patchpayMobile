import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Animated,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Bank } from "../../constant/bank";
import { formatNGN } from "../../utils/withdrawal.util";
import { withdrawStyles as styles } from "../styles/withdraw.styles";
import SummaryRow from "./summary";

interface WithdrawConfirmProps {
  selectedBank: Bank | null;
  accountNumber: string;
  accountName: string;
  parsedAmount: number;
  description: string;
  transactionPin: string;
  submitting: boolean;
  fadeAnim: Animated.Value;
  onPinChange: (pin: string) => void;
  onSubmit: () => void;
  onBack: () => void;
}

/**
 * Step 2 — confirmation screen.
 * Shows a read-only summary + PIN entry before the final submit.
 */
const WithdrawConfirm: React.FC<WithdrawConfirmProps> = ({
  selectedBank,
  accountNumber,
  accountName,
  parsedAmount,
  description,
  transactionPin,
  submitting,
  fadeAnim,
  onPinChange,
  onSubmit,
  onBack,
}) => {
  const pinReady = transactionPin.length >= 4;

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      {/* Icon header */}
      <View style={styles.confirmIconWrap}>
        <LinearGradient
          colors={["#6a3de8", "#b04fc9"]}
          style={styles.confirmIconCircle}
        >
          <Feather name="send" size={28} color="#fff" />
        </LinearGradient>
      </View>

      <Text style={styles.confirmTitle}>Confirm Withdrawal</Text>
      <Text style={styles.confirmSubtitle}>
        Review the details below before sending
      </Text>

      {/* Summary table */}
      <View style={styles.summaryCard}>
        <SummaryRow label="Amount" value={formatNGN(parsedAmount)} accent />
        <SummaryRow label="Bank" value={selectedBank?.name ?? ""} />
        <SummaryRow label="Account Number" value={accountNumber} />
        <SummaryRow label="Account Name" value={accountName} />
        {description ? (
          <SummaryRow label="Narration" value={description} />
        ) : null}
      </View>

      {/* Warning */}
      <View style={styles.warningBox}>
        <Feather name="info" size={14} color="#d97706" />
        <Text style={styles.warningText}>
          This action cannot be undone. Ensure the details are correct.
        </Text>
      </View>

      {/* PIN entry */}
      <View style={styles.pinCard}>
        <Text style={styles.fieldLabel}>Transaction PIN</Text>
        <TextInput
          style={styles.pinInput}
          value={transactionPin}
          onChangeText={(t) => onPinChange(t.replace(/\D/g, "").slice(0, 6))}
          keyboardType="number-pad"
          placeholder="Enter your 4–6 digit PIN"
          placeholderTextColor="#cbd5e1"
          secureTextEntry
          maxLength={6}
          autoFocus
        />
      </View>

      {/* Submit */}
      <TouchableOpacity
        style={[
          styles.ctaButton,
          (!pinReady || submitting) && styles.ctaButtonDisabled,
        ]}
        onPress={onSubmit}
        disabled={!pinReady || submitting}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={pinReady ? ["#2541c4", "#6a3de8"] : ["#e2e8f0", "#e2e8f0"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.ctaGradient}
        >
          <Text style={[styles.ctaText, !pinReady && { color: "#94a3b8" }]}>
            Withdraw {formatNGN(parsedAmount)}
          </Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Back */}
      <TouchableOpacity style={styles.ghostButton} onPress={onBack}>
        <Text style={styles.ghostButtonText}>← Edit details</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default WithdrawConfirm;
