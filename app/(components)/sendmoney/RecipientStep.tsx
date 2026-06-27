import { Bank } from "@/constant/bank";
import { AccountLookupResponse } from "@/hooks/useacctlookup";
import { Beneficiary } from "@/hooks/usebene";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import BankPicker from "./bankpicker"; // see below
import { TransferType } from "./TransferTypeSelector";

type Props = {
  type: TransferType;
  beneficiaries: Beneficiary[];
  loadingBeneficiaries: boolean;
  selectedBeneficiaryId: string | null;
  recipientAccount: string;
  selectedBank: Bank | null;
  lookupLoading: boolean;
  lookupError: string;
  accountInfo: AccountLookupResponse | null;
  onSelectBeneficiary: (b: Beneficiary) => void;
  onChangeAccountNumber: (v: string) => void;
  onSelectBank: (b: Bank) => void;
  onContinue: () => void;
  onBack: () => void;
};

export default function RecipientStep({
  type,
  beneficiaries,
  loadingBeneficiaries,
  selectedBeneficiaryId,
  recipientAccount,
  selectedBank,
  lookupLoading,
  lookupError,
  accountInfo,
  onSelectBeneficiary,
  onChangeAccountNumber,
  onSelectBank,
  onContinue,
  onBack,
}: Props) {
  const accountReady = recipientAccount.length === 10;
  const canContinue =
    accountReady &&
    !!accountInfo &&
    !lookupLoading &&
    (type === "internal" || !!selectedBank?.code);
  const resolvedName = getLookupText(accountInfo, [
    "accountName",
    "account_name",
    "name",
  ]);

  return (
    <View>
      <Text style={styles.sectionLabel}>Saved beneficiaries</Text>

      {loadingBeneficiaries ? (
        <ActivityIndicator style={{ marginBottom: 12 }} />
      ) : beneficiaries.length === 0 ? (
        <Text style={styles.empty}>No beneficiaries yet</Text>
      ) : (
        beneficiaries.map((b) => (
          <TouchableOpacity
            key={b._id}
            onPress={() => onSelectBeneficiary(b)}
            style={[
              styles.beneCard,
              selectedBeneficiaryId === b._id && styles.beneCardActive,
            ]}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {b.name.slice(0, 2).toUpperCase()}
              </Text>
            </View>
            <View>
              <Text style={styles.beneName}>{b.name}</Text>
              <Text style={styles.beneSub}>
                {b.bankName} • {b.accountNumber}
              </Text>
            </View>
          </TouchableOpacity>
        ))
      )}

      <View style={styles.divider} />
      <Text style={styles.sectionLabel}>Or enter manually</Text>

      {/* Only show bank picker for other-bank transfers */}
      {type === "external" && (
        <BankPicker selected={selectedBank} onSelect={onSelectBank} />
      )}

      <TextInput
        placeholder="Account number"
        value={recipientAccount}
        onChangeText={onChangeAccountNumber}
        keyboardType="numeric"
        maxLength={10}
        style={styles.input}
      />

      {lookupLoading && (
        <View style={styles.lookupRow}>
          <ActivityIndicator size="small" />
          <Text style={styles.lookupText}>Verifying account...</Text>
        </View>
      )}

      {!!resolvedName && !lookupLoading && (
        <View style={styles.lookupCard}>
          <Text style={styles.lookupName}>{resolvedName}</Text>
          {/* <Text style={styles.lookupText}>Verified by backend lookup</Text> */}
        </View>
      )}

      {!!lookupError && !lookupLoading && (
        <Text style={styles.error}>{lookupError}</Text>
      )}

      <TouchableOpacity
        onPress={onContinue}
        disabled={!canContinue}
        style={[styles.btn, !canContinue && styles.btnDisabled]}
      >
        <Text style={styles.btnText}>Continue</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={onBack} style={styles.back}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const getLookupText = (
  response: AccountLookupResponse | null,
  keys: string[],
): string => {
  if (!response) return "";

  const direct = findStringValue(response, keys);
  if (direct) return direct;

  const data = response.data;
  if (isRecord(data)) {
    return findStringValue(data, keys);
  }

  return "";
};

const findStringValue = (source: Record<string, unknown>, keys: string[]) => {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }

  return "";
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const styles = StyleSheet.create({
  sectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  empty: { color: "#94a3b8", marginBottom: 10, fontSize: 13 },
  beneCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 8,
  },
  beneCardActive: { borderColor: "#2541c4", borderWidth: 2 },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#CECBF6",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 12, fontWeight: "600", color: "#3C3489" },
  beneName: { fontSize: 14, fontWeight: "600" },
  beneSub: { fontSize: 12, color: "#94a3b8" },
  divider: { height: 1, backgroundColor: "#e2e8f0", marginVertical: 14 },
  input: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    fontSize: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 10,
  },
  btn: {
    backgroundColor: "#2541c4",
    padding: 15,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 4,
  },
  btnDisabled: { backgroundColor: "#94a3b8" },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  back: { marginTop: 12, alignItems: "center" },
  backText: { color: "#2541c4", fontSize: 14 },
  lookupRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  lookupCard: {
    backgroundColor: "#ecfdf5",
    borderColor: "#bbf7d0",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  lookupName: { color: "#166534", fontSize: 14, fontWeight: "700" },
  lookupText: { color: "#64748b", fontSize: 12, marginTop: 2 },
  error: { color: "#e24b4a", marginBottom: 10, fontSize: 13 },
});
