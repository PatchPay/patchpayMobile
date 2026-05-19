import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  FlatList,
  Animated,
} from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import {
  getWallet,
  initiateWithdrawal,
  resolveAccount,
} from "../../api/walletapi";
import { Bank, BANKS } from "../../constant/bank";
import {
  createIdempotencyKey,
  formatAmountInput,
  formatNGN,
  parseAmount,
} from "../../utils/withdrawal.util";
import WithdrawConfirm from "./withdrawconfirm";
import WithdrawForm from "./withdrawform";
import { withdrawStyles as styles } from "../styles/withdraw.styles";

type Step = "form" | "confirm" | "processing" | "success" | "failed";

export default function WithdrawScreen() {
  const [walletBalance, setWalletBalance] = useState(0);
  const [walletLoading, setWalletLoading] = useState(true);

  const [selectedBank, setSelectedBank] = useState<Bank | null>(null);
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [resolving, setResolving] = useState(false);
  const [resolveError, setResolveError] = useState("");
  const [amountDisplay, setAmountDisplay] = useState("");
  const [description, setDescription] = useState("");
  const [transactionPin, setTransactionPin] = useState("");

  const [bankModalVisible, setBankModalVisible] = useState(false);
  const [bankSearch, setBankSearch] = useState("");

  const [step, setStep] = useState<Step>("form");
  const [submitting, setSubmitting] = useState(false);
  const [resultData, setResultData] = useState<any>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const successScale = useRef(new Animated.Value(0)).current;
  const idempotencyKeyRef = useRef<string | null>(null);

  const parsedAmount = parseAmount(amountDisplay);

  const filteredBanks = useMemo(
    () =>
      BANKS.filter((bank) => {
        const query = bankSearch.trim().toLowerCase();
        if (!query) return true;
        return (
          bank.name.toLowerCase().includes(query) ||
          bank.code.toLowerCase().includes(query)
        );
      }),
    [bankSearch],
  );

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 260,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 260,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        setWalletLoading(true);
        const wallet = await getWallet();
        const data = wallet?.data ?? wallet;
        setWalletBalance(Number(data?.balance ?? 0));
      } catch (error) {
        console.log("❌ Wallet fetch failed:", error);
      } finally {
        setWalletLoading(false);
      }
    };

    fetchBalance();
  }, []);

  useEffect(() => {
    let active = true;

    const shouldLookup = selectedBank && accountNumber.length === 10;

    if (!shouldLookup) {
      setAccountName("");
      setResolveError("");
      return;
    }

    const lookupAccount = async () => {
      setResolving(true);
      setResolveError("");

      try {
        const res = await resolveAccount(accountNumber, selectedBank.code);

        if (!active) return;

        if (res.success && res.data?.accountName) {
          setAccountName(res.data.accountName);
          setResolveError("");
        } else {
          setAccountName("");
          setResolveError(res.message || "Unable to resolve account");
        }
      } catch (error: any) {
        if (!active) return;

        setAccountName("");
        setResolveError(
          error?.response?.data?.message ||
            error?.message ||
            "Unable to resolve account",
        );
      } finally {
        if (active) setResolving(false);
      }
    };

    const timer = setTimeout(lookupAccount, 600); // debounce (important)

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [selectedBank, accountNumber]);

  useEffect(() => {
    if (step === "success") {
      Animated.spring(successScale, {
        toValue: 1,
        friction: 5,
        useNativeDriver: true,
      }).start();
    } else {
      successScale.setValue(0);
    }
  }, [step, successScale]);

  const handleAmountChange = (value: string) => {
    setAmountDisplay(formatAmountInput(value));
  };

  const handleBankSelect = (bank: Bank) => {
    setSelectedBank(bank);
    setBankModalVisible(false);
    setBankSearch("");
    setAccountNumber("");
    setAccountName("");
    setResolveError("");
  };

  const handleContinue = () => setStep("confirm");

  const handleSubmit = async () => {
    if (!selectedBank) return;

    setSubmitting(true);
    setStep("processing");

    const idempotencyKey = createIdempotencyKey();
    idempotencyKeyRef.current = idempotencyKey;

    try {
      const withdrawal = await initiateWithdrawal({
        amount: parsedAmount,
        bankCode: selectedBank.code,
        accountNumber,
        accountName, // 👈 this now comes from resolve endpoint
        transactionPin,
        description: description.trim() || undefined,
        idempotencyKey,
      });

      setResultData(withdrawal);
      setStep(withdrawal.success ? "success" : "failed");
    } catch (error: any) {
      setResultData(
        error?.response?.data ??
          error?.message ?? {
            success: false,
            message: "Unable to complete withdrawal.",
          },
      );
      setStep("failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetry = () => {
    setStep("form");
    setResultData(null);
    setSubmitting(false);
  };

  const bankModal = (
    <Modal
      visible={bankModalVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      statusBarTranslucent
      hardwareAccelerated
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Select Bank</Text>
          <TouchableOpacity onPress={() => setBankModalVisible(false)}>
            <Ionicons name="close" size={24} color="#0f1923" />
          </TouchableOpacity>
        </View>

        <View style={styles.searchBox}>
          <Feather
            name="search"
            size={16}
            color="#94a3b8"
            style={{ marginRight: 8 }}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search banks..."
            placeholderTextColor="#94a3b8"
            value={bankSearch}
            onChangeText={setBankSearch}
            autoFocus
          />
        </View>

        <FlatList
          data={filteredBanks}
          keyExtractor={(item) => item.code}
          keyboardShouldPersistTaps="handled"
          removeClippedSubviews={false}
          initialNumToRender={20}
          maxToRenderPerBatch={20}
          windowSize={10}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.bankItem,
                selectedBank?.code === item.code && styles.bankItemSelected,
              ]}
              onPress={() => handleBankSelect(item)}
            >
              <View style={styles.bankIconCircle}>
                <Text style={styles.bankIconText}>{item.name.charAt(0)}</Text>
              </View>
              <Text style={styles.bankItemName}>{item.name}</Text>
              {selectedBank?.code === item.code && (
                <Feather name="check" size={16} color="#6a3de8" />
              )}
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      </View>
    </Modal>
  );

  const renderCurrentStep = () => {
    switch (step) {
      case "form":
        return (
          <WithdrawForm
            walletBalance={walletBalance}
            walletLoading={walletLoading}
            selectedBank={selectedBank}
            accountNumber={accountNumber}
            accountName={accountName}
            resolving={resolving}
            resolveError={resolveError}
            amountDisplay={amountDisplay}
            description={description}
            fadeAnim={fadeAnim}
            slideAnim={slideAnim}
            onOpenBankPicker={() => setBankModalVisible(true)}
            onAccountNumberChange={(value) =>
              setAccountNumber(value.replace(/\D/g, "").slice(0, 10))
            }
            onAmountChange={handleAmountChange}
            onDescriptionChange={setDescription}
            onContinue={handleContinue}
          />
        );
      case "confirm":
        return (
          <WithdrawConfirm
            selectedBank={selectedBank}
            accountNumber={accountNumber}
            accountName={accountName}
            parsedAmount={parsedAmount}
            description={description}
            transactionPin={transactionPin}
            submitting={submitting}
            fadeAnim={fadeAnim}
            onPinChange={(pin) => setTransactionPin(pin)}
            onSubmit={handleSubmit}
            onBack={() => setStep("form")}
          />
        );
      case "processing":
        return (
          <View style={styles.centeredState}>
            <View style={styles.processingRing}>
              <ActivityIndicator size="large" color="#6a3de8" />
            </View>
            <Text style={styles.stateTitle}>Processing...</Text>
            <Text style={styles.stateSubtitle}>
              Please wait while we process your withdrawal
            </Text>
          </View>
        );
      case "success":
        return (
          <View style={styles.centeredState}>
            <Animated.View style={{ transform: [{ scale: successScale }] }}>
              <LinearGradient
                colors={["#16a34a", "#22c55e"]}
                style={styles.resultCircle}
              >
                <Feather name="check" size={40} color="#fff" />
              </LinearGradient>
            </Animated.View>

            <Text style={styles.stateTitle}>Withdrawal Initiated!</Text>
            <Text style={styles.stateSubtitle}>
              {resultData?.message ?? "Your withdrawal is being processed."}
            </Text>

            <View style={[styles.summaryCard, { marginTop: 28 }]}>
              <SummaryRow
                label="Amount"
                value={formatNGN(parsedAmount)}
                accent
              />
              <SummaryRow
                label="Reference"
                value={resultData?.data?.transaction?.reference ?? "—"}
                mono
              />
              <SummaryRow
                label="Status"
                value={resultData?.data?.withdrawal?.status ?? "pending"}
              />
            </View>

            <TouchableOpacity
              style={styles.ctaButton}
              onPress={() => router.back()}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={["#16a34a", "#22c55e"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.ctaGradient}
              >
                <Text style={styles.ctaText}>Done</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        );
      case "failed":
        return (
          <View style={styles.centeredState}>
            <LinearGradient
              colors={["#ef4444", "#dc2626"]}
              style={styles.resultCircle}
            >
              <Feather name="x" size={40} color="#fff" />
            </LinearGradient>

            <Text style={styles.stateTitle}>Withdrawal Failed</Text>
            <Text style={styles.stateSubtitle}>
              {resultData?.message ??
                "Something went wrong. Your balance has not been debited."}
            </Text>

            <TouchableOpacity
              style={styles.ctaButton}
              onPress={handleRetry}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={["#2541c4", "#6a3de8"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.ctaGradient}
              >
                <Text style={styles.ctaText}>Try Again</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.ghostButton}
              onPress={() => router.back()}
            >
              <Text style={styles.ghostButtonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      <LinearGradient
        colors={["#1a1060", "#1e2d8f", "#2541c4"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Withdraw Funds</Text>
        <View style={{ width: 36 }} />
      </LinearGradient>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {renderCurrentStep()}
        </ScrollView>
      </KeyboardAvoidingView>

      {bankModal}
    </View>
  );
}

const SummaryRow = ({
  label,
  value,
  accent,
  mono,
}: {
  label: string;
  value: string;
  accent?: boolean;
  mono?: boolean;
}) => (
  <View style={styles.summaryRow}>
    <Text style={styles.summaryLabel}>{label}</Text>
    <Text
      style={[
        styles.summaryValue,
        accent && styles.summaryValueAccent,
        mono && styles.summaryValueMono,
      ]}
      numberOfLines={1}
      adjustsFontSizeToFit
    >
      {value}
    </Text>
  </View>
);
