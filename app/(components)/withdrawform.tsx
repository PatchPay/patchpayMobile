import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Bank } from "../../constant/bank";
import { formatNGN, parseAmount } from "../../utils/withdrawal.util";
import { withdrawStyles as styles } from "../styles/withdraw.styles";

interface WithdrawFormProps {
  walletBalance: number;
  walletLoading: boolean;
  selectedBank: Bank | null;
  accountNumber: string;
  accountName: string;
  resolving: boolean;
  resolveError: string;
  amountDisplay: string;
  description: string;
  fadeAnim: Animated.Value;
  slideAnim: Animated.Value;
  onOpenBankPicker: () => void;
  onAccountNumberChange: (val: string) => void;
  onAmountChange: (val: string) => void;
  onDescriptionChange: (val: string) => void;
  onContinue: () => void;
}

const QUICK_AMOUNTS = [5000, 10_000, 20_000, 50_000];

/**
 * Step 1 — the main entry form.
 * Collects: amount, bank, account number, optional narration.
 * The Continue button is gated until every required field is valid.
 */
const WithdrawForm: React.FC<WithdrawFormProps> = ({
  walletBalance,
  walletLoading,
  selectedBank,
  accountNumber,
  accountName,
  resolving,
  resolveError,
  amountDisplay,
  description,
  fadeAnim,
  slideAnim,
  onOpenBankPicker,
  onAccountNumberChange,
  onAmountChange,
  onDescriptionChange,
  onContinue,
}) => {
  const parsedAmount = parseAmount(amountDisplay);

  const isFormValid =
    selectedBank !== null &&
    accountNumber.length === 10 &&
    accountName.length > 0 &&
    parsedAmount > 0 &&
    parsedAmount <= walletBalance;

  return (
    <Animated.View
      style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
    >
      {/* Available balance pill */}
      <View style={styles.balancePill}>
        <Text style={styles.balancePillText}>
          {walletLoading
            ? "Loading balance..."
            : `Available: ${formatNGN(walletBalance)}`}
        </Text>
      </View>

      {/* Large amount input */}
      <View style={styles.amountSection}>
        <Text style={styles.amountCurrency}>₦</Text>
        <TextInput
          style={styles.amountInput}
          value={amountDisplay}
          onChangeText={onAmountChange}
          keyboardType="number-pad"
          placeholder="0.00"
          placeholderTextColor="#d1d5db"
        />
      </View>

      {parsedAmount > walletBalance && parsedAmount > 0 && (
        <Text style={styles.errorText}>Amount exceeds available balance</Text>
      )}

      {/* Quick-select chips */}
      <View style={styles.chipsRow}>
        {QUICK_AMOUNTS.map((v) => (
          <TouchableOpacity
            key={v}
            style={styles.chip}
            onPress={() => onAmountChange(v.toLocaleString("en-NG"))}
          >
            <Text style={styles.chipText}>₦{(v / 1000).toFixed(0)}k</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Card: bank, account number, narration */}
      <View style={styles.card}>
        {/* Bank selector */}
        <Text style={styles.fieldLabel}>Bank</Text>
        <TouchableOpacity
          style={styles.bankSelector}
          onPress={onOpenBankPicker}
        >
          {selectedBank ? (
            <>
              <View style={styles.bankIconCircleSmall}>
                <Text style={styles.bankIconTextSmall}>
                  {selectedBank.name.charAt(0)}
                </Text>
              </View>
              <Text style={styles.bankSelectorValue}>{selectedBank.name}</Text>
            </>
          ) : (
            <Text style={styles.bankSelectorPlaceholder}>Select a bank</Text>
          )}
          <Feather name="chevron-down" size={16} color="#94a3b8" />
        </TouchableOpacity>

        <View style={styles.fieldDivider} />

        {/* Account number */}
        <Text style={styles.fieldLabel}>Account Number</Text>
        <View style={styles.fieldRow}>
          <TextInput
            style={[styles.fieldInput, { flex: 1 }]}
            value={accountNumber}
            onChangeText={onAccountNumberChange}
            keyboardType="number-pad"
            placeholder="10-digit account number"
            placeholderTextColor="#cbd5e1"
            editable={!!selectedBank}
            maxLength={10}
          />
          {resolving && (
            <ActivityIndicator
              size="small"
              color="#6a3de8"
              style={{ marginLeft: 8 }}
            />
          )}
        </View>

        {accountName ? (
          <View style={styles.resolvedBadge}>
            <Feather name="check-circle" size={13} color="#16a34a" />
            <Text style={styles.resolvedText}>{accountName}</Text>
          </View>
        ) : resolveError ? (
          <View style={styles.resolveErrorBadge}>
            <Feather name="alert-circle" size={13} color="#ef4444" />
            <Text style={styles.resolveErrorText}>{resolveError}</Text>
          </View>
        ) : null}

        <View style={styles.fieldDivider} />

        {/* Narration */}
        <Text style={styles.fieldLabel}>Narration (optional)</Text>
        <TextInput
          style={styles.fieldInput}
          value={description}
          onChangeText={onDescriptionChange}
          placeholder="What's this for?"
          placeholderTextColor="#cbd5e1"
          maxLength={80}
        />
      </View>

      {/* Continue button */}
      <TouchableOpacity
        style={[styles.ctaButton, !isFormValid && styles.ctaButtonDisabled]}
        onPress={onContinue}
        disabled={!isFormValid}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={isFormValid ? ["#2541c4", "#6a3de8"] : ["#e2e8f0", "#e2e8f0"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.ctaGradient}
        >
          <Text style={[styles.ctaText, !isFormValid && { color: "#94a3b8" }]}>
            Continue
          </Text>
          <Feather
            name="arrow-right"
            size={18}
            color={isFormValid ? "#fff" : "#94a3b8"}
          />
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default WithdrawForm;
