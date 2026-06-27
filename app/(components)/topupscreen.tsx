import API from "@/api/axiosInstance";
import { Feather, Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { WebView, WebViewNavigation } from "react-native-webview";

// ─── Types ────────────────────────────────────────────────────────────────────
type PaymentStatus = "idle" | "initiating" | "verifying" | "success" | "error";

// ─── Constants ────────────────────────────────────────────────────────────────
const QUICK_AMOUNTS = ["1000", "5000", "10000", "50000"];

const QUICK_LABELS: Record<string, string> = {
  "1000": "1,000",
  "5000": "5,000",
  "10000": "10,000",
  "50000": "50,000",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatDisplay = (raw: string) => {
  const num = Number(raw.replace(/,/g, ""));
  if (!raw || isNaN(num)) return "";
  return num.toLocaleString();
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function TopUpScreen() {
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState<PaymentStatus>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // WebView modal state
  const [showWebView, setShowWebView] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState("");
  const [currentRef, setCurrentRef] = useState<string | null>(null);
  const [webViewLoading, setWebViewLoading] = useState(true);

  const webViewRef = useRef<WebView>(null);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleQuick = (val: string) => setAmount(val);

  const handleAmountChange = (text: string) => {
    const numeric = text.replace(/[^0-9]/g, "");
    setAmount(numeric);
  };

  /**
   * Step 1 – Initiate deposit → get Squad checkout URL → open in in-app WebView
   */
  const handleTopUp = async () => {
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid amount to top up.");
      return;
    }

    try {
      setStatus("initiating");
      setErrorMsg("");

      const token = await AsyncStorage.getItem("authToken");

      const response = await API.post(
        "/payments/deposit/initiate",
        { amount: numAmount },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      const data = response.data;

      if (!data.success) {
        throw new Error(data.message || "Failed to initiate deposit");
      }

      const { checkoutUrl: url, transactionRef } = data.data;

      setCheckoutUrl(url);
      setCurrentRef(transactionRef);
      setWebViewLoading(true);
      setShowWebView(true); // ← open in-app WebView instead of browser
      setStatus("idle");
    } catch (err: any) {
      setStatus("error");
      const message =
        err?.response?.data?.message || err.message || "Something went wrong";
      setErrorMsg(message);
      Alert.alert("Error", message);
    }
  };

  /**
   * Step 2 – Intercept navigation inside the WebView.
   *
   * Squad redirects to your backend's callback_url after payment:
   *   {BACKEND_URL}/api/payments/deposit/callback?transaction_ref=PP-xxx
   *
   * We catch that URL here, close the WebView, and auto-verify —
   * the user never leaves the app.
   */
  const handleWebViewNav = (navState: WebViewNavigation) => {
    const { url } = navState;

    if (url.includes("/api/payments/deposit/callback")) {
      const urlObj = new URL(url);
      const ref =
        urlObj.searchParams.get("transaction_ref") ||
        urlObj.searchParams.get("reference") ||
        currentRef;

      setShowWebView(false);
      verifyPayment(ref ?? undefined);
    }
  };

  /**
   * Step 3 – Verify payment with backend (checks Squad API and credits wallet).
   */
  const verifyPayment = async (ref?: string) => {
    const transactionRef = ref || currentRef;

    if (!transactionRef) {
      Alert.alert("Error", "No transaction reference found.");
      return;
    }

    try {
      setStatus("verifying");

      const token = await AsyncStorage.getItem("authToken");

      const response = await API.post(
        "/payments/deposit/verify",
        { transactionRef },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      const data = response.data;

      if (!data.success) {
        throw new Error(data.message || "Payment verification failed");
      }

      setStatus("success");
      setCurrentRef(null);

      setShowSuccessModal(true);
    } catch (err: any) {
      setStatus("error");
      const message =
        err?.response?.data?.message || err.message || "Verification failed";
      setErrorMsg(message);
      console.log("this is the error message", message);
      Alert.alert("Verification Failed", message);
    }
  };

  const handleCloseWebView = () => {
    setShowWebView(false);
    if (currentRef) {
      Alert.alert(
        "Payment Incomplete?",
        "Did you finish paying? Tap Verify to check your wallet.",
        [
          {
            text: "Cancel",
            style: "destructive",
            onPress: () => setCurrentRef(null),
          },
          { text: "Verify", onPress: () => verifyPayment() },
        ],
      );
    }
  };

  const isLoading = status === "initiating" || status === "verifying";

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: "#f2f4f8" }}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />
      {/* ── In-App WebView Modal ── */}
      <Modal
        visible={showWebView}
        animationType="slide"
        onRequestClose={handleCloseWebView}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: "#1a1060" }}>
          {/* Toolbar */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 16,
              paddingVertical: 12,
              backgroundColor: "#1a1060",
            }}
          >
            <TouchableOpacity
              onPress={handleCloseWebView}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: "rgba(255,255,255,0.15)",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 12,
              }}
            >
              <Ionicons name="close" size={20} color="#fff" />
            </TouchableOpacity>
            <Text
              style={{
                color: "#fff",
                fontWeight: "700",
                fontSize: 15,
                flex: 1,
              }}
            >
              Secure Checkout
            </Text>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              <Feather name="lock" size={13} color="#2ec4b6" />
              <Text
                style={{ color: "#2ec4b6", fontSize: 12, fontWeight: "600" }}
              >
                Secured
              </Text>
            </View>
          </View>

          {/* Loading indicator bar */}
          {webViewLoading && (
            <View
              style={{ height: 3, backgroundColor: "rgba(255,255,255,0.08)" }}
            >
              <View
                style={{ height: 3, width: "55%", backgroundColor: "#6a3de8" }}
              />
            </View>
          )}

          <WebView
            ref={webViewRef}
            source={{ uri: checkoutUrl }}
            onNavigationStateChange={handleWebViewNav}
            onLoadStart={() => setWebViewLoading(true)}
            onLoadEnd={() => setWebViewLoading(false)}
            javaScriptEnabled
            domStorageEnabled
            setSupportMultipleWindows={false}
            renderLoading={() => (
              <View
                style={{
                  flex: 1,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#fff",
                }}
              >
                <ActivityIndicator size="large" color="#6a3de8" />
                <Text style={{ color: "#64748b", marginTop: 12, fontSize: 14 }}>
                  Loading payment page...
                </Text>
              </View>
            )}
            startInLoadingState
            style={{ flex: 1 }}
          />
        </SafeAreaView>
      </Modal>
      {/* ── Header ── */}
      <LinearGradient
        colors={["#1a1060", "#1e2d8f", "#2541c4", "#6a3de8", "#b04fc9"]}
        locations={[0, 0.25, 0.5, 0.75, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          paddingTop: Platform.OS === "ios" ? 58 : 46,
          paddingBottom: 36,
          paddingHorizontal: 20,
        }}
      >
        <View
          style={{
            position: "absolute",
            top: 30,
            right: -20,
            width: 130,
            height: 130,
            borderRadius: 65,
            backgroundColor: "rgba(180,80,200,0.25)",
          }}
        />
        <View
          style={{
            position: "absolute",
            bottom: -20,
            left: -30,
            width: 100,
            height: 100,
            borderRadius: 50,
            backgroundColor: "rgba(100,150,255,0.15)",
          }}
        />

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 24,
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              backgroundColor: "rgba(255,255,255,0.15)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <Text
            style={{
              color: "#fff",
              fontSize: 18,
              fontWeight: "700",
              marginLeft: 14,
            }}
          >
            Top Up
          </Text>
        </View>

        <Text
          style={{
            color: "rgba(255,255,255,0.6)",
            fontSize: 12,
            letterSpacing: 1.5,
            textTransform: "uppercase",
            marginBottom: 10,
          }}
        >
          Enter Amount
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Text
            style={{
              color: "rgba(255,255,255,0.7)",
              fontSize: 28,
              fontWeight: "700",
              marginRight: 6,
            }}
          >
            ₦
          </Text>
          <TextInput
            value={amount ? formatDisplay(amount) : ""}
            onChangeText={handleAmountChange}
            placeholder="0.00"
            placeholderTextColor="rgba(255,255,255,0.3)"
            keyboardType="numeric"
            style={{
              color: "#fff",
              fontSize: 44,
              fontWeight: "800",
              letterSpacing: -1,
              flex: 1,
            }}
          />
        </View>
      </LinearGradient>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
      >
        {/* ── Quick amounts ── */}
        <Text
          style={{
            color: "#64748b",
            fontSize: 12,
            fontWeight: "600",
            letterSpacing: 0.8,
            textTransform: "uppercase",
            marginBottom: 12,
          }}
        >
          Quick Select
        </Text>
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 28 }}>
          {QUICK_AMOUNTS.map((a) => (
            <TouchableOpacity
              key={a}
              onPress={() => handleQuick(a)}
              activeOpacity={0.8}
              style={{
                flex: 1,
                paddingVertical: 10,
                borderRadius: 12,
                alignItems: "center",
                backgroundColor: amount === a ? "#3a6df0" : "#fff",
                borderWidth: 1.5,
                borderColor: amount === a ? "#3a6df0" : "#e2e8f0",
                shadowColor: "#3a6df0",
                shadowOpacity: amount === a ? 0.25 : 0,
                shadowRadius: 8,
                elevation: amount === a ? 4 : 0,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "700",
                  color: amount === a ? "#fff" : "#475569",
                }}
              >
                ₦{QUICK_LABELS[a]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Payment method card ── */}
        <Text
          style={{
            color: "#64748b",
            fontSize: 12,
            fontWeight: "600",
            letterSpacing: 0.8,
            textTransform: "uppercase",
            marginBottom: 12,
          }}
        >
          Payment Method
        </Text>
        <View
          style={{
            backgroundColor: "#fff",
            borderRadius: 16,
            padding: 16,
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 24,
            shadowColor: "#000",
            shadowOpacity: 0.04,
            shadowRadius: 8,
            elevation: 2,
          }}
        >
          <View
            style={{
              width: 46,
              height: 46,
              borderRadius: 14,
              backgroundColor: "#eef2ff",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 14,
            }}
          >
            <Feather name="credit-card" size={20} color="#3a6df0" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: "#0f1923", fontWeight: "700", fontSize: 14 }}>
              Squad Pay
            </Text>
            <Text style={{ color: "#94a3b8", fontSize: 12, marginTop: 2 }}>
              Card • Bank Transfer • USSD
            </Text>
          </View>
          <View
            style={{
              backgroundColor: "#e8faf4",
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 8,
            }}
          >
            <Text style={{ color: "#2ec4b6", fontSize: 11, fontWeight: "700" }}>
              Secure
            </Text>
          </View>
        </View>

        {/* ── Error message ── */}
        {status === "error" && errorMsg ? (
          <View
            style={{
              backgroundColor: "#fff1f1",
              borderRadius: 12,
              padding: 14,
              marginBottom: 16,
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
            }}
          >
            <Feather name="alert-circle" size={16} color="#ef4444" />
            <Text style={{ color: "#ef4444", fontSize: 13, flex: 1 }}>
              {errorMsg}
            </Text>
          </View>
        ) : null}

        {/* ── Verify pending button (if user closed WebView early) ── */}
        {currentRef && status !== "verifying" ? (
          <TouchableOpacity
            onPress={() => verifyPayment()}
            activeOpacity={0.88}
            style={{ marginBottom: 12 }}
          >
            <View
              style={{
                borderRadius: 16,
                paddingVertical: 15,
                alignItems: "center",
                borderWidth: 2,
                borderColor: "#2ec4b6",
                backgroundColor: "#e8faf4",
              }}
            >
              <Text
                style={{ color: "#2ec4b6", fontSize: 15, fontWeight: "700" }}
              >
                Verify Pending Payment
              </Text>
            </View>
          </TouchableOpacity>
        ) : null}

        {/* ── CTA ── */}
        <TouchableOpacity
          onPress={handleTopUp}
          disabled={isLoading || !amount}
          activeOpacity={0.88}
        >
          <LinearGradient
            colors={
              isLoading || !amount
                ? ["#a0aec0", "#a0aec0"]
                : ["#2541c4", "#6a3de8"]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              borderRadius: 16,
              paddingVertical: 17,
              alignItems: "center",
              shadowColor: "#6a3de8",
              shadowOpacity: isLoading || !amount ? 0 : 0.4,
              shadowRadius: 16,
              elevation: isLoading || !amount ? 0 : 8,
            }}
          >
            {isLoading ? (
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
              >
                <ActivityIndicator color="#fff" size="small" />
                <Text
                  style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}
                >
                  {status === "initiating" ? "Initiating..." : "Verifying..."}
                </Text>
              </View>
            ) : (
              <Text
                style={{
                  color: "#fff",
                  fontSize: 16,
                  fontWeight: "800",
                  letterSpacing: 0.3,
                }}
              >
                Top Up {amount ? `₦${formatDisplay(amount)}` : ""}
              </Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <Text
          style={{
            color: "#94a3b8",
            fontSize: 11,
            textAlign: "center",
            marginTop: 14,
            lineHeight: 16,
          }}
        >
          Payment is processed securely inside the app.{"\n"}
          No redirects to external browsers.
        </Text>
      </ScrollView>
      <Modal visible={showSuccessModal} transparent animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "center",
            alignItems: "center",
            padding: 20,
          }}
        >
          <View
            style={{
              width: "100%",
              backgroundColor: "#fff",
              borderRadius: 20,
              padding: 24,
              alignItems: "center",
            }}
          >
            {/* Icon */}
            <View
              style={{
                width: 70,
                height: 70,
                borderRadius: 35,
                backgroundColor: "#e8faf4",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
              }}
            >
              <Feather name="check" size={32} color="#2ec4b6" />
            </View>

            {/* Title */}
            <Text
              style={{
                fontSize: 18,
                fontWeight: "800",
                color: "#0f172a",
                marginBottom: 6,
              }}
            >
              Payment Successful
            </Text>

            {/* Amount */}
            <Text
              style={{
                fontSize: 22,
                fontWeight: "800",
                color: "#2ec4b6",
                marginBottom: 10,
              }}
            >
              ₦{Number(amount).toLocaleString()}
            </Text>

            {/* Subtitle */}
            <Text
              style={{
                fontSize: 13,
                color: "#64748b",
                textAlign: "center",
                marginBottom: 20,
                lineHeight: 18,
              }}
            >
              Your wallet has been credited successfully.
            </Text>

            {/* Button */}
            <TouchableOpacity
              onPress={() => {
                setShowSuccessModal(false);
                router.back();
              }}
              style={{
                width: "100%",
              }}
            >
              <LinearGradient
                colors={["#2541c4", "#6a3de8"]}
                style={{
                  paddingVertical: 14,
                  borderRadius: 12,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "700" }}>Done</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
