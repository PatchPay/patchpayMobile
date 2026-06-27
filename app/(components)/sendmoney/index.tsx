import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import {
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import RecipientStep from "./RecipientStep";
import TransferDetailsForm from "./TransferDetailsForm";
import TransferSuccessModal from "./TransferSuccessModal";
import TransferTypeSelector, { TransferType } from "./TransferTypeSelector";

import { Bank } from "@/constant/bank";
import { AccountLookupResponse, useAccountLookup } from "@/hooks/useacctlookup";
import { Beneficiary, useBeneficiaries } from "@/hooks/usebene";
import { useTransfer } from "@/hooks/useTransfer";

type Step = "type" | "recipient" | "details";

const STEP_TITLE: Record<Step, string> = {
  type: "Send money",
  recipient: "Select recipient",
  details: "Transfer details",
};

export default function SendMoneyScreen() {
  const [step, setStep] = useState<Step>("type");
  const [transferType, setTransferType] = useState<TransferType | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const [selectedBeneficiary, setSelectedBeneficiary] =
    useState<Beneficiary | null>(null);
  const [accountNumber, setAccountNumber] = useState("");
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null);

  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [pin, setPin] = useState("");

  const { beneficiaries, loading: loadingBeneficiaries } = useBeneficiaries();
  const { transfer, loading, error, success } = useTransfer();
  const {
    lookupAccount,
    loading: lookupLoading,
    error: lookupError,
    accountInfo,
    setError: setLookupError,
  } = useAccountLookup();

  const resolvedRecipientName =
    getLookupText(accountInfo, ["accountName", "account_name", "name"]) ||
    selectedBeneficiary?.name ||
    "";

  useEffect(() => {
    if (accountNumber.length !== 10) return;
    if (transferType === "external" && !selectedBank?.code) return;

    void lookupAccount({
      accountNumber,
      bankCode: transferType === "external" ? selectedBank?.code : undefined,
    });
  }, [accountNumber, lookupAccount, selectedBank?.code, transferType]);

  const handleSelectBeneficiary = (b: Beneficiary) => {
    setSelectedBeneficiary(b);
    setAccountNumber(onlyDigits(b.accountNumber).slice(0, 10));
    setSelectedBank(b.bankCode ? { name: b.bankName, code: b.bankCode } : null);
  };

  const handleChangeAccountNumber = (value: string) => {
    setSelectedBeneficiary(null);
    setAccountNumber(onlyDigits(value).slice(0, 10));
  };

  const resetForm = () => {
    setAmount("");
    setNote("");
    setPin("");
    setAccountNumber("");
    setSelectedBank(null);
    setSelectedBeneficiary(null);
    setTransferType(null);
    setStep("type");
  };

  const handleTransfer = async () => {
    const parsedAmount = Number(amount);
    const externalBankCode = selectedBank?.code;
    const cleanAccountNumber = onlyDigits(accountNumber).slice(0, 10);

    if (cleanAccountNumber.length !== 10) {
      setLookupError("Account number must be exactly 10 digits.");
      return;
    }
    if (!parsedAmount || parsedAmount <= 0) {
      setLookupError("Amount must be greater than 0.");
      return;
    }
    if (transferType === "external" && !externalBankCode) {
      setLookupError("Bank code is required for external transfers.");
      return;
    }

    try {
      let ok = false;

      if (transferType === "external") {
        ok = await transfer("external", {
          accountNumber: cleanAccountNumber,
          bankCode: externalBankCode!,
          amount: parsedAmount,
          transactionPin: pin,
          description: note || undefined,
        });
      } else {
        ok = await transfer("internal", {
          recipientAccount: cleanAccountNumber,
          amount: parsedAmount,
          transactionPin: pin,
          description: note || undefined,
        });
      }

      if (ok) {
        setShowSuccessModal(true);
      }
    } catch (err: any) {
      console.log("Transfer error:", err?.response?.data || err);
    }
  };

  const handleSuccessDone = () => {
    setShowSuccessModal(false);
    resetForm();
    router.back();
  };

  const handleSendAnother = () => {
    setShowSuccessModal(false);
    resetForm();
  };

  const goBack = () => {
    if (step === "details") setStep("recipient");
    else if (step === "recipient") setStep("type");
    else router.back();
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#f2f4f8" }}>
      <StatusBar barStyle="light-content" translucent />

      <LinearGradient
        colors={["#1a1060", "#2541c4", "#6a3de8"]}
        style={{
          paddingTop: Platform.OS === "ios" ? 60 : 45,
          paddingBottom: 20,
          paddingHorizontal: 20,
        }}
      >
        <TouchableOpacity onPress={goBack}>
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
          {STEP_TITLE[step]}
        </Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {step === "type" && (
          <TransferTypeSelector
            selected={transferType}
            onSelect={(type) => {
              setTransferType(type);
              setSelectedBeneficiary(null);
              setAccountNumber("");
              setSelectedBank(null);
            }}
            onContinue={() => setStep("recipient")}
          />
        )}

        {step === "recipient" && transferType && (
          <RecipientStep
            type={transferType}
            beneficiaries={beneficiaries}
            loadingBeneficiaries={loadingBeneficiaries}
            selectedBeneficiaryId={selectedBeneficiary?._id ?? null}
            recipientAccount={accountNumber}
            selectedBank={selectedBank}
            lookupLoading={lookupLoading}
            lookupError={lookupError}
            accountInfo={accountInfo}
            onSelectBeneficiary={handleSelectBeneficiary}
            onChangeAccountNumber={handleChangeAccountNumber}
            onSelectBank={setSelectedBank}
            onContinue={() => setStep("details")}
            onBack={() => setStep("type")}
          />
        )}

        {step === "details" && (
          <TransferDetailsForm
            recipientName={resolvedRecipientName}
            bankName={
              transferType === "internal"
                ? "PatchPay"
                : (selectedBank?.name ?? "Bank")
            }
            recipientAccount={accountNumber}
            amount={amount}
            note={note}
            pin={pin}
            loading={loading}
            error={error || lookupError}
            success={success}
            onChangeAmount={(value) => setAmount(onlyDigits(value))}
            onChangeNote={setNote}
            onChangePin={(value) => setPin(onlyDigits(value))}
            onSubmit={handleTransfer}
            onBack={() => setStep("recipient")}
          />
        )}
      </ScrollView>

      <TransferSuccessModal
        visible={showSuccessModal}
        transferType={transferType}
        recipientName={resolvedRecipientName}
        bankName={
          transferType === "internal"
            ? "PatchPay"
            : (selectedBank?.name ?? "Bank")
        }
        recipientAccount={accountNumber}
        amount={amount}
        note={note}
        success={success}
        onDone={handleSuccessDone}
        onSendAnother={handleSendAnother}
      />
    </View>
  );
}

const onlyDigits = (value: string) => value.replace(/\D/g, "");

const getLookupText = (
  response: AccountLookupResponse | null,
  keys: string[],
): string => {
  if (!response) return "";
  const direct = findStringValue(response, keys);
  if (direct) return direct;
  const data = response.data;
  if (isRecord(data)) return findStringValue(data, keys);
  return "";
};

const findStringValue = (source: Record<string, unknown>, keys: string[]) => {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.trim()) return value;
  }
  return "";
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;
