import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StatusBar,
  Platform,
  ActivityIndicator,
  Alert,
  Modal,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather, Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { jwtDecode } from "jwt-decode";
import axios from "axios";

// ─── Config ──────────────────────────────────────────────────────────────────
const API_BASE = "https://patchpaybackend.onrender.com/api/rfq";

// Replace with your real auth token source (e.g. from context / secure store)
const getAuthToken = async (): Promise<string> => {
  const token = await AsyncStorage.getItem("token");

  return token || "";
};
const apiFetch = async (path: string, options: any = {}) => {
  const token = await getAuthToken();

  const res = await axios({
    url: `${API_BASE}${path}`,
    method: options.method || "GET",
    data: options.body ? JSON.parse(options.body) : undefined,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers ?? {}),
    },
  });

  return res.data;
};
// ─── Types ────────────────────────────────────────────────────────────────────
type SearchType = "email" | "phone" | "name";

interface FoundUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  currency: string;
  country: string;
  uniqueId: string;
}

interface Quote {
  _id: string;
  quote_number: string;
  type: string;
  product_description: string;
  product_quantity: number;
  amount: number;
  currency: string;
  total: number;
  status: "Pending" | "Accepted" | "Rejected" | "Cancelled";
  delivery_type: string;
  trade_type: string;
  createdAt: string;
  user: { _id: string; firstName: string; lastName: string; email: string };
  destinatary_user: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

// ─── Delivery / Trade options ─────────────────────────────────────────────────
const DELIVERY_TYPES = ["Standard", "Secure"];
const TRADE_TYPES = ["Domestic", "International"];

const STATUS_META: Record<Quote["status"], { color: string; bg: string }> = {
  Pending: { color: "#f5a623", bg: "#fff8ec" },
  Accepted: { color: "#2ec4b6", bg: "#e8faf4" },
  Rejected: { color: "#e05c97", bg: "#fdf0f6" },
  Cancelled: { color: "#94a3b8", bg: "#f1f5f9" },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function FieldCard({
  icon,
  iconColor,
  iconBg,
  label,
  children,
  style,
}: {
  icon: string;
  iconColor: string;
  iconBg: string;
  label: string;
  children: React.ReactNode;
  style?: object;
}) {
  return (
    <View
      style={{
        backgroundColor: "#fff",
        borderRadius: 14,
        padding: 14,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOpacity: 0.03,
        elevation: 1,
        ...style,
      }}
    >
      <View
        style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}
      >
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            backgroundColor: iconBg,
            alignItems: "center",
            justifyContent: "center",
            marginRight: 10,
          }}
        >
          <Feather name={icon as any} size={16} color={iconColor} />
        </View>
        <Text style={{ color: "#94a3b8", fontSize: 11 }}>{label}</Text>
      </View>
      {children}
    </View>
  );
}

function SelectPill({
  options,
  value,
  onChange,
  activeColor,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
  activeColor: string;
}) {
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
      {options.map((o) => (
        <TouchableOpacity
          key={o}
          onPress={() => onChange(o)}
          style={{
            paddingHorizontal: 14,
            paddingVertical: 7,
            borderRadius: 20,
            backgroundColor: value === o ? activeColor : "#f1f5f9",
          }}
        >
          <Text
            style={{
              fontSize: 12,
              fontWeight: "600",
              color: value === o ? "#fff" : "#475569",
            }}
          >
            {o}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ─── Recipient Search Modal ───────────────────────────────────────────────────
function RecipientModal({
  visible,
  onClose,
  onSelect,
}: {
  visible: boolean;
  onClose: () => void;
  onSelect: (u: FoundUser) => void;
}) {
  const searchOptions: SearchType[] = ["email", "name", "phone"];
  const [searchType, setSearchType] = useState<SearchType>("email");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FoundUser | null>(null);
  const [error, setError] = useState("");

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const data = await apiFetch(
        `/users/search?query=${encodeURIComponent(query)}&searchType=${searchType}`,
      );
      setResult(data.data);
    } catch (e: any) {
      setError(e.message ?? "User not found");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.45)",
          justifyContent: "flex-end",
        }}
      >
        <View
          style={{
            backgroundColor: "#f2f4f8",
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            padding: 24,
            paddingBottom: 40,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginBottom: 20,
            }}
          >
            <Text style={{ fontSize: 17, fontWeight: "700", color: "#0f1923" }}>
              Find Recipient
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Feather name="x" size={22} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          {/* Search type */}
          <SelectPill
            options={searchOptions}
            value={searchType}
            onChange={(v) => setSearchType(v as SearchType)}
            activeColor="#2541c4"
          />

          {/* Input */}
          <View
            style={{
              flexDirection: "row",
              backgroundColor: "#fff",
              borderRadius: 14,
              padding: 12,
              marginTop: 14,
              alignItems: "center",
              gap: 10,
            }}
          >
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={`Search by ${searchType}…`}
              placeholderTextColor="#cbd5e1"
              style={{ flex: 1, color: "#0f1923", fontSize: 14, padding: 0 }}
              onSubmitEditing={search}
              autoCapitalize="none"
            />
            <TouchableOpacity
              onPress={search}
              style={{
                backgroundColor: "#2541c4",
                borderRadius: 10,
                padding: 8,
              }}
            >
              <Feather name="search" size={16} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* States */}
          {loading && (
            <ActivityIndicator color="#2541c4" style={{ marginTop: 20 }} />
          )}
          {error ? (
            <Text
              style={{
                color: "#e05c97",
                textAlign: "center",
                marginTop: 16,
                fontSize: 13,
              }}
            >
              {error}
            </Text>
          ) : null}

          {result && (
            <View
              style={{
                backgroundColor: "#fff",
                borderRadius: 16,
                padding: 16,
                marginTop: 16,
                shadowColor: "#000",
                shadowOpacity: 0.04,
                elevation: 2,
              }}
            >
              <Text
                style={{ fontWeight: "700", color: "#0f1923", fontSize: 15 }}
              >
                {result.firstName} {result.lastName}
              </Text>
              <Text style={{ color: "#64748b", fontSize: 12, marginTop: 3 }}>
                {result.email} · {result.country}
              </Text>
              <Text style={{ color: "#94a3b8", fontSize: 11, marginTop: 2 }}>
                {result.currency} · ID: {result.uniqueId}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  onSelect(result);
                  onClose();
                }}
                style={{
                  marginTop: 14,
                  backgroundColor: "#2541c4",
                  borderRadius: 12,
                  paddingVertical: 12,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{ color: "#fff", fontWeight: "700", fontSize: 13 }}
                >
                  Select Recipient
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

// ─── Quote Card ───────────────────────────────────────────────────────────────
function QuoteCard({
  quote,
  currentUserId,
  onAction,
}: {
  quote: Quote;
  currentUserId: string | null;
  onAction: () => void;
}) {
  const meta = STATUS_META[quote.status] ?? STATUS_META.Pending;
  const isIssuer = quote.user._id === currentUserId;
  console.log("this is the thing:", isIssuer, currentUserId, quote.user._id);

  const [loading, setLoading] = useState(false);

  const doAction = async (action: "cancel" | "accept" | "reject") => {
    setLoading(true);
    try {
      if (action === "cancel") {
        await apiFetch(`/quotes/${quote._id}/cancel`, { method: "PUT" });
      } else if (action === "accept") {
        await apiFetch(`/quotes/${quote._id}/accept`, { method: "PUT" });
      } else {
        await apiFetch(`/quotes/${quote._id}/reject`, {
          method: "PUT",
          body: JSON.stringify({ reason: "" }),
        });
      }
      onAction();
    } catch (e: any) {
      console.log("FULL ERROR:", e?.response?.data);

      const message =
        e?.response?.data?.message || e?.response?.data?.error || e.message;

      Alert.alert("Error", message);
    } finally {
      setLoading(false);
    }
  };

  const confirmAction = (action: "cancel" | "accept" | "reject") => {
    const labels = { cancel: "Cancel", accept: "Accept", reject: "Reject" };
    Alert.alert(
      `${labels[action]} Quote`,
      `Are you sure you want to ${action} RFQ #${quote.quote_number}?`,
      [
        { text: "No", style: "cancel" },
        { text: "Yes", onPress: () => doAction(action) },
      ],
    );
  };

  return (
    <View
      style={{
        backgroundColor: "#fff",
        borderRadius: 20,
        padding: 18,
        marginBottom: 14,
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
      }}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-start",
          marginBottom: 12,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text style={{ color: "#0f1923", fontWeight: "700", fontSize: 15 }}>
            {quote.product_description}
          </Text>
          <Text style={{ color: "#94a3b8", fontSize: 12, marginTop: 3 }}>
            RFQ #{quote.quote_number} · {quote.trade_type}
          </Text>
        </View>
        <View
          style={{
            backgroundColor: meta.bg,
            borderRadius: 10,
            paddingHorizontal: 10,
            paddingVertical: 5,
          }}
        >
          <Text style={{ color: meta.color, fontSize: 10, fontWeight: "800" }}>
            {quote.status.toUpperCase()}
          </Text>
        </View>
      </View>

      <View
        style={{ height: 1, backgroundColor: "#f1f5f9", marginBottom: 12 }}
      />

      {/* Details */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        <View>
          <Text style={{ color: "#94a3b8", fontSize: 11 }}>Amount</Text>
          <Text style={{ color: "#0f1923", fontWeight: "800", fontSize: 17 }}>
            {quote.currency} {quote.amount.toLocaleString()}
          </Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={{ color: "#94a3b8", fontSize: 11 }}>Qty</Text>
          <Text style={{ color: "#0f1923", fontWeight: "700", fontSize: 15 }}>
            {quote.product_quantity}
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <View>
          <Text style={{ color: "#94a3b8", fontSize: 11 }}>
            {isIssuer ? "Sent to" : "From"}
          </Text>
          <Text style={{ color: "#475569", fontSize: 13, fontWeight: "600" }}>
            {isIssuer
              ? `${quote.destinatary_user.firstName}`
              : `${quote.user.firstName} `}
          </Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={{ color: "#94a3b8", fontSize: 11 }}>Delivery</Text>
          <Text style={{ color: "#475569", fontSize: 13, fontWeight: "600" }}>
            {quote.delivery_type}
          </Text>
        </View>
      </View>

      {/* Actions */}
      {quote.status === "Pending" && (
        <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
          {loading ? (
            <ActivityIndicator color="#2541c4" />
          ) : isIssuer ? (
            <TouchableOpacity
              onPress={() => confirmAction("cancel")}
              style={{
                flex: 1,
                backgroundColor: "#fdf0f6",
                borderRadius: 12,
                paddingVertical: 10,
                alignItems: "center",
              }}
            >
              <Text
                style={{ color: "#FF0000", fontWeight: "700", fontSize: 13 }}
              >
                Cancel RFQ
              </Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity
                onPress={() => confirmAction("accept")}
                style={{
                  flex: 1,
                  backgroundColor: "#e8faf4",
                  borderRadius: 12,
                  paddingVertical: 10,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{ color: "#2ec4b6", fontWeight: "700", fontSize: 13 }}
                >
                  Accept
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => confirmAction("reject")}
                style={{
                  flex: 1,
                  backgroundColor: "#fdf0f6",
                  borderRadius: 12,
                  paddingVertical: 10,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{ color: "#FF0000", fontWeight: "700", fontSize: 13 }}
                >
                  Reject
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function RFQScreen() {
  const [tab, setTab] = useState<"create" | "my">("create");

  // ── Create form state
  const [recipient, setRecipient] = useState<FoundUser | null>(null);
  const [recipientModalOpen, setRecipientModalOpen] = useState(false);
  const [productDescription, setProductDescription] = useState("");
  const [productQuantity, setProductQuantity] = useState("");
  const [amount, setAmount] = useState("");
  const [deliveryType, setDeliveryType] = useState("Standard");
  const [tradeType, setTradeType] = useState("B2B");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [deliveryAddress, setDeliveryAddress] = useState({
    street: "",
    city: "",
    state: "",
    country: "",
    phoneNumber: "",
    postal_code: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // ── My RFQs state
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loadingQuotes, setLoadingQuotes] = useState(false);
  // Replace with real currentUserId from auth context
  useEffect(() => {
    const loadUser = async () => {
      const token = await getAuthToken();

      if (!token) {
        console.log("NO TOKEN FOUND");
        return;
      }

      try {
        const decoded: any = jwtDecode(token);

        console.log("DECODED TOKEN:", decoded);

        // ⚠️ VERY IMPORTANT: check your backend payload
        setCurrentUserId(decoded.userId);
      } catch (err) {
        console.log("DECODE ERROR:", err);
      }
    };

    loadUser();
  }, []);

  const fetchQuotes = useCallback(async () => {
    setLoadingQuotes(true);

    try {
      const data = await apiFetch("/quotes");
      setQuotes(data.data ?? []);
    } catch (e: any) {
      Alert.alert("Error", e?.response?.data?.message || e.message);
    } finally {
      setLoadingQuotes(false);
    }
  }, []);

  useEffect(() => {
    if (tab === "my") fetchQuotes();
  }, [tab, fetchQuotes]);

  const handlePublish = async () => {
    if (!recipient) {
      Alert.alert("Missing recipient", "Please select a recipient first.");
      return;
    }
    if (
      !productDescription.trim() ||
      !amount.trim() ||
      !productQuantity.trim()
    ) {
      Alert.alert(
        "Missing fields",
        "Please fill in description, quantity and amount.",
      );
      return;
    }

    setSubmitting(true);
    try {
      const numAmount = parseFloat(amount.replace(/,/g, ""));
      const numQty = parseInt(productQuantity, 10);

      // Compute simple totals (mirrors backend expectations)
      const deliveryCharge = 0;
      const transactionCharges = numAmount * 0.015; // 1.5% placeholder fee
      const lineTotal = numAmount * numQty;
      const subtotal = lineTotal + deliveryCharge;
      const totalAmount = subtotal + transactionCharges;

      await apiFetch("/create", {
        method: "POST",
        body: JSON.stringify({
          recipientId: recipient._id,
          product_description: productDescription.trim(),
          product_quantity: numQty,
          amount: numAmount,
          delivery_type: deliveryType,
          trade_type: tradeType,
          delivery_address: {
            street: "" + deliveryAddress.street.trim(),
            city: "" + deliveryAddress.city.trim(),
            state: "" + deliveryAddress.state.trim(),
            country: "" + deliveryAddress.country.trim(),
            phoneNumber: recipient.phoneNumber,
            postal_code: "" + deliveryAddress.postal_code.trim(),
          },
          line_total: lineTotal,
          delivery_charge: deliveryCharge,
          transaction_charges: transactionCharges,
          subtotal,
          total_amount: totalAmount,
        }),
      });

      Alert.alert("Success", "RFQ published successfully!");
      // Reset form
      setRecipient(null);
      setProductDescription("");
      setProductQuantity("");
      setAmount("");
      setDeliveryAddress({
        street: "",
        city: "",
        state: "",
        country: "",
        phoneNumber: "",
        postal_code: "",
      });
      setDeliveryType("Standard");
      setTradeType("B2B");
      setTab("my");
    } catch (e: any) {
      console.log("FULL ERROR:", e?.response?.data);

      const message =
        e?.response?.data?.message || e?.response?.data?.error || e.message;

      Alert.alert("Error", message);
    } finally {
      setSubmitting(false);
    }
  };

  const pendingCount = quotes.filter((q) => q.status === "Pending").length;
  const acceptedCount = quotes.filter((q) => q.status === "Accepted").length;

  return (
    <View style={{ flex: 1, backgroundColor: "#f2f4f8" }}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />

      {/* Header */}
      <LinearGradient
        colors={["#1a1060", "#1e2d8f", "#2541c4", "#6a3de8", "#b04fc9"]}
        locations={[0, 0.25, 0.5, 0.75, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          paddingTop: Platform.OS === "ios" ? 58 : 46,
          paddingBottom: 28,
          paddingHorizontal: 20,
        }}
      >
        <View
          style={{
            position: "absolute",
            top: -10,
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
            bottom: -30,
            left: -20,
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
            marginBottom: 20,
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
          <View style={{ marginLeft: 14 }}>
            <Text style={{ color: "#fff", fontSize: 18, fontWeight: "700" }}>
              Request for Quote
            </Text>
            <Text
              style={{
                color: "rgba(255,255,255,0.6)",
                fontSize: 12,
                marginTop: 1,
              }}
            >
              Create and manage trade quotes
            </Text>
          </View>
        </View>

        {/* Tab switcher */}
        <View
          style={{
            flexDirection: "row",
            backgroundColor: "rgba(255,255,255,0.12)",
            borderRadius: 14,
            padding: 4,
          }}
        >
          {(["create", "my"] as const).map((t) => (
            <TouchableOpacity
              key={t}
              onPress={() => setTab(t)}
              style={{
                flex: 1,
                paddingVertical: 10,
                borderRadius: 11,
                alignItems: "center",
                backgroundColor: tab === t ? "#fff" : "transparent",
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "700",
                  color: tab === t ? "#2541c4" : "rgba(255,255,255,0.7)",
                }}
              >
                {t === "create" ? "Create RFQ" : "My RFQs"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>

      {/* ── Body ── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, paddingBottom: 110 }}
      >
        {tab === "create" ? (
          <>
            <Text
              style={{
                color: "#64748b",
                fontSize: 12,
                fontWeight: "600",
                letterSpacing: 0.8,
                textTransform: "uppercase",
                marginBottom: 16,
              }}
            >
              RFQ Information
            </Text>

            {/* Recipient */}
            <TouchableOpacity
              onPress={() => setRecipientModalOpen(true)}
              style={{
                backgroundColor: "#fff",
                borderRadius: 14,
                padding: 14,
                marginBottom: 12,
                flexDirection: "row",
                alignItems: "center",
                borderWidth: recipient ? 0 : 1.5,
                borderColor: "#e2e8f0",
                borderStyle: "dashed",
                shadowColor: "#000",
                shadowOpacity: 0.03,
                elevation: 1,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  backgroundColor: "#eef2ff",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 12,
                }}
              >
                <Feather name="user" size={18} color="#3a6df0" />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{ color: "#94a3b8", fontSize: 11, marginBottom: 3 }}
                >
                  Recipient
                </Text>
                {recipient ? (
                  <>
                    <Text
                      style={{
                        color: "#0f1923",
                        fontSize: 14,
                        fontWeight: "700",
                      }}
                    >
                      {recipient.firstName} {recipient.lastName}
                    </Text>
                    <Text style={{ color: "#64748b", fontSize: 11 }}>
                      {recipient.email} · {recipient.currency}
                    </Text>
                  </>
                ) : (
                  <Text style={{ color: "#cbd5e1", fontSize: 14 }}>
                    Tap to search for a recipient…
                  </Text>
                )}
              </View>
              <Feather name="chevron-right" size={18} color="#cbd5e1" />
            </TouchableOpacity>

            {/* Product Description */}
            <FieldCard
              icon="file-text"
              iconColor="#e05c97"
              iconBg="#fdf0f6"
              label="Product Description"
            >
              <TextInput
                value={productDescription}
                onChangeText={setProductDescription}
                placeholder="e.g. Industrial bolts, grade A"
                placeholderTextColor="#cbd5e1"
                style={{
                  color: "#0f1923",
                  fontSize: 14,
                  fontWeight: "600",
                  padding: 0,
                }}
              />
            </FieldCard>

            {/* Quantity + Amount */}
            <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
              <View
                style={{
                  flex: 1,
                  backgroundColor: "#fff",
                  borderRadius: 14,
                  padding: 14,
                  shadowColor: "#000",
                  shadowOpacity: 0.03,
                  elevation: 1,
                }}
              >
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: "#fff8ec",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 8,
                  }}
                >
                  <Feather name="hash" size={16} color="#f5a623" />
                </View>
                <Text
                  style={{ color: "#94a3b8", fontSize: 11, marginBottom: 4 }}
                >
                  Quantity
                </Text>
                <TextInput
                  value={productQuantity}
                  onChangeText={setProductQuantity}
                  placeholder="100"
                  placeholderTextColor="#cbd5e1"
                  keyboardType="numeric"
                  style={{
                    color: "#0f1923",
                    fontSize: 14,
                    fontWeight: "700",
                    padding: 0,
                  }}
                />
              </View>
              <View
                style={{
                  flex: 1,
                  backgroundColor: "#fff",
                  borderRadius: 14,
                  padding: 14,
                  shadowColor: "#000",
                  shadowOpacity: 0.03,
                  elevation: 1,
                }}
              >
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: "#e8faf4",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 8,
                  }}
                >
                  <Feather name="dollar-sign" size={16} color="#2ec4b6" />
                </View>
                <Text
                  style={{ color: "#94a3b8", fontSize: 11, marginBottom: 4 }}
                >
                  Amount ({recipient?.currency ?? "—"})
                </Text>
                <TextInput
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="500,000"
                  placeholderTextColor="#cbd5e1"
                  keyboardType="numeric"
                  style={{
                    color: "#0f1923",
                    fontSize: 14,
                    fontWeight: "700",
                    padding: 0,
                  }}
                />
              </View>
            </View>

            {/* Delivery Type */}
            <FieldCard
              icon="truck"
              iconColor="#3a6df0"
              iconBg="#eef2ff"
              label="Delivery Type"
            >
              <SelectPill
                options={DELIVERY_TYPES}
                value={deliveryType}
                onChange={setDeliveryType}
                activeColor="#3a6df0"
              />
            </FieldCard>

            {/* Trade Type */}
            <FieldCard
              icon="briefcase"
              iconColor="#6a3de8"
              iconBg="#f3eeff"
              label="Trade Type"
            >
              <SelectPill
                options={TRADE_TYPES}
                value={tradeType}
                onChange={setTradeType}
                activeColor="#6a3de8"
              />
            </FieldCard>

            {/* Delivery Address */}
            <FieldCard
              icon="map-pin"
              iconColor="#f5a623"
              iconBg="#fff8ec"
              label="Delivery Address"
            >
              <TextInput
                value={deliveryAddress.street}
                onChangeText={(text) =>
                  setDeliveryAddress((prev) => ({ ...prev, street: text }))
                }
                placeholder="Street address"
              />
              <TextInput
                value={deliveryAddress.city}
                onChangeText={(text) =>
                  setDeliveryAddress((prev) => ({ ...prev, city: text }))
                }
                placeholder="City"
              />
              <TextInput
                value={deliveryAddress.state}
                onChangeText={(text) =>
                  setDeliveryAddress((prev) => ({ ...prev, state: text }))
                }
                placeholder="State"
              />
              <TextInput
                value={deliveryAddress.country}
                onChangeText={(text) =>
                  setDeliveryAddress((prev) => ({ ...prev, country: text }))
                }
                placeholder="Country"
              />
              <TextInput
                value={deliveryAddress.phoneNumber}
                onChangeText={(text) =>
                  setDeliveryAddress((prev) => ({ ...prev, phoneNumber: text }))
                }
                placeholder="Phone number"
              />
              <TextInput
                value={deliveryAddress.postal_code}
                onChangeText={(text) =>
                  setDeliveryAddress((prev) => ({ ...prev, postal_code: text }))
                }
                placeholder="Postal code"
              />
            </FieldCard>

            {/* Tips */}
            <View
              style={{
                backgroundColor: "#fdf0f6",
                borderRadius: 16,
                padding: 16,
                marginBottom: 28,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 10,
                }}
              >
                <Feather name="info" size={15} color="#e05c97" />
                <Text
                  style={{ color: "#e05c97", fontWeight: "700", fontSize: 13 }}
                >
                  Tips for better quotes
                </Text>
              </View>
              {[
                "Search the recipient by email, phone or name",
                "Set a realistic amount for faster responses",
                "Recipient has 72 hours to respond",
              ].map((tip, i) => (
                <View
                  key={i}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 6,
                  }}
                >
                  <View
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: 3,
                      backgroundColor: "#e05c97",
                      marginRight: 10,
                    }}
                  />
                  <Text style={{ color: "#be4880", fontSize: 13 }}>{tip}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              activeOpacity={0.88}
              onPress={handlePublish}
              disabled={submitting}
            >
              <LinearGradient
                colors={["#e05c97", "#c9417e"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  borderRadius: 16,
                  paddingVertical: 17,
                  alignItems: "center",
                  shadowColor: "#e05c97",
                  shadowOpacity: 0.4,
                  shadowRadius: 16,
                  elevation: 8,
                  opacity: submitting ? 0.7 : 1,
                }}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text
                    style={{ color: "#fff", fontSize: 16, fontWeight: "800" }}
                  >
                    Publish RFQ
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </>
        ) : (
          <>
            {/* Stats */}
            <View style={{ flexDirection: "row", gap: 12, marginBottom: 24 }}>
              {[
                {
                  label: "Total RFQs",
                  value: quotes.length,
                  color: "#e05c97",
                  bg: "#fdf0f6",
                },
                {
                  label: "Pending",
                  value: pendingCount,
                  color: "#f5a623",
                  bg: "#fff8ec",
                },
                {
                  label: "Accepted",
                  value: acceptedCount,
                  color: "#2ec4b6",
                  bg: "#e8faf4",
                },
              ].map((s) => (
                <View
                  key={s.label}
                  style={{
                    flex: 1,
                    backgroundColor: "#fff",
                    borderRadius: 16,
                    padding: 14,
                    shadowColor: "#000",
                    shadowOpacity: 0.04,
                    elevation: 2,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      color: s.color,
                      fontWeight: "800",
                      fontSize: 22,
                      marginBottom: 4,
                    }}
                  >
                    {s.value}
                  </Text>
                  <Text style={{ color: "#94a3b8", fontSize: 10 }}>
                    {s.label}
                  </Text>
                </View>
              ))}
            </View>

            {loadingQuotes ? (
              <ActivityIndicator color="#2541c4" style={{ marginTop: 40 }} />
            ) : quotes.length === 0 ? (
              <View style={{ alignItems: "center", marginTop: 60 }}>
                <Feather name="inbox" size={40} color="#cbd5e1" />
                <Text style={{ color: "#94a3b8", marginTop: 12, fontSize: 14 }}>
                  No RFQs yet
                </Text>
              </View>
            ) : (
              quotes.map((q) => (
                <QuoteCard
                  key={q._id}
                  quote={q}
                  currentUserId={currentUserId}
                  onAction={fetchQuotes}
                />
              ))
            )}
          </>
        )}
      </ScrollView>

      {/* Recipient search modal */}
      <RecipientModal
        visible={recipientModalOpen}
        onClose={() => setRecipientModalOpen(false)}
        onSelect={setRecipient}
      />
    </View>
  );
}
