import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Pressable,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { getUser } from "@/api/authapi";
import { getUserTransactions, getWallet } from "@/api/walletapi";
import { router } from "expo-router";

// ── Currency config ───────────────────────────────────────────────────────────
type SupportedCurrency = "NGN" | "USD" | "EUR" | "GBP" | "TZS";

const CURRENCY_CONFIG: Record<
  SupportedCurrency,
  { locale: string; flag: string }
> = {
  NGN: { locale: "en-NG", flag: "🇳🇬" },
  USD: { locale: "en-US", flag: "🇺🇸" },
  EUR: { locale: "de-DE", flag: "🇪🇺" },
  GBP: { locale: "en-GB", flag: "🇬🇧" },
  TZS: { locale: "en-TZ", flag: "🇹🇿" },
};

const formatBalance = (amount: number, currency: string): string => {
  const cfg = CURRENCY_CONFIG[currency as SupportedCurrency];
  const locale = cfg?.locale ?? "en-US";
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
    })}`;
  }
};

// ── Transaction helpers ───────────────────────────────────────────────────────

/**
 * Maps a transaction type + direction to a Feather icon name and colours.
 * Covers the fields your DB actually stores.
 */
const getTxMeta = (tx: any, walletId: string) => {
  const type: string = tx.type?.toLowerCase() ?? "";
  const isIncoming =
    tx.recipientWallet === walletId || tx.recipientId !== undefined;

  const map: Record<
    string,
    { icon: string; iconColor: string; iconBg: string }
  > = {
    deposit: {
      icon: "arrow-down-left",
      iconColor: "#16a34a",
      iconBg: "#f0fdf4",
    },
    withdrawal: {
      icon: "arrow-up-right",
      iconColor: "#ef4444",
      iconBg: "#fff1f1",
    },
    transfer: { icon: "send", iconColor: "#3a6df0", iconBg: "#eef2ff" },
    escrow: { icon: "shield", iconColor: "#f5a623", iconBg: "#fff8ec" },
    payment: { icon: "credit-card", iconColor: "#e05c97", iconBg: "#fdf2f8" },
    refund: { icon: "rotate-ccw", iconColor: "#2ec4b6", iconBg: "#e8faf4" },
  };

  return (
    map[type] ?? {
      icon: isIncoming ? "arrow-down-left" : "arrow-up-right",
      iconColor: isIncoming ? "#16a34a" : "#ef4444",
      iconBg: isIncoming ? "#f0fdf4" : "#fff1f1",
    }
  );
};

/** Human-readable label from the type field */
const getTxLabel = (tx: any): string => {
  const type: string = tx.type?.toLowerCase() ?? "";
  if (type === "deposit") return "Wallet Top-up";
  if (type === "withdrawal") return "Withdrawal";
  if (type === "transfer") {
    return tx.description?.includes("to") ? tx.description : "Transfer";
  }
  if (type === "escrow") return "Escrow Payment";
  if (type === "payment") return "Payment";
  if (type === "refund") return "Refund";
  return tx.description ?? "Transaction";
};

/** Format createdAt → "Apr 14, 2026 · 12:09 AM" */
const formatTxDate = (dateStr: string): string => {
  try {
    const d = new Date(dateStr);
    return (
      d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }) +
      " · " +
      d.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      })
    );
  } catch {
    return dateStr;
  }
};

/** Whether a transaction is incoming (positive) for the current user's wallet */
const isIncomingTx = (tx: any, walletId: string): boolean => {
  const type = tx.type?.toLowerCase() ?? "";
  if (type === "deposit" || type === "refund") return true;
  if (type === "withdrawal") return false;
  // For transfers, check recipient
  return tx.recipientWallet === walletId;
};

// ── Status badge config ───────────────────────────────────────────────────────
const STATUS_CONFIG: Record<
  string,
  { label: string; textColor: string; bgColor: string; dot: string }
> = {
  completed: {
    label: "Completed",
    textColor: "#16a34a",
    bgColor: "#f0fdf4",
    dot: "#16a34a",
  },
  pending: {
    label: "Pending",
    textColor: "#f5a623",
    bgColor: "#fff8ec",
    dot: "#f5a623",
  },
  processing: {
    label: "Processing",
    textColor: "#3a6df0",
    bgColor: "#eef2ff",
    dot: "#3a6df0",
  },
  failed: {
    label: "Failed",
    textColor: "#ef4444",
    bgColor: "#fff1f1",
    dot: "#ef4444",
  },
  cancelled: {
    label: "Cancelled",
    textColor: "#94a3b8",
    bgColor: "#f8fafc",
    dot: "#cbd5e1",
  },
};

// ── Quick Actions ─────────────────────────────────────────────────────────────
const ACTIONS = [
  {
    icon: "credit-card",
    label: "Payments",
    bg: ["#2ec4b6", "#1aaa9e"] as [string, string],
    path: "/(components)/sendmoney",
    iconLib: "feather",
    iconBg: "#e8faf8",
  },
  {
    icon: "arrow-up-circle",
    label: "Top-up my\naccount",
    bg: ["#3a6df0", "#2558e8"] as [string, string],
    path: "/(components)/topupscreen",
    iconLib: "feather",
    iconBg: "#eef2ff",
  },
  {
    icon: "shield-check",
    label: "Escrow",
    bg: ["#f5a623", "#e8960f"] as [string, string],
    path: "/(components)/escrow",
    iconLib: "material",
    iconBg: "#fff1f1",
  },

  {
    icon: "file-text",
    label: "Create RFQ",
    bg: ["#e05c97", "#c9417e"] as [string, string],
    path: "/(components)/rfq",
    iconLib: "feather",
    iconBg: "#fff8ec",
  },

  {
    icon: "arrow-down-circle",
    label: "Withdraw",
    bg: ["#ef4444", "#dc2626"] as [string, string],
    path: "/(components)/withdraw",
    iconLib: "feather",
    iconBg: "#fdf2f8",
  },
] as const;

// ── Component ─────────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [wallet, setWallet] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [pinModalVisible, setPinModalVisible] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        // ✅ Fixed: was [u, w] before — tx was never assigned
        const [u, w] = await Promise.all([getUser(), getWallet()]);
        const tx = await getUserTransactions(u._id);
        setUser(u);
        setWallet(w?.data ?? w);
        // Support both { data: [...] } and plain array responses
        const txList = tx?.data ?? tx ?? [];
        setTransactions(Array.isArray(txList) ? txList : []);
      } catch (e) {
        console.log("Fetch error:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!loading && user && !user.hasTransactionPin) {
      setTimeout(() => {
        setPinModalVisible(true);
      }, 800); // slight delay feels more premium
    }
  }, [loading, user]);

  const balance: number = wallet?.balance ?? 0;
  const currency: string = wallet?.currency ?? "NGN";
  const walletId: string = wallet?._id ?? wallet?.id ?? "";
  const accountNumber: string = wallet?.accountNumber ?? "—";
  const isActive: boolean = wallet?.isActive ?? false;
  const firstName: string = user?.firstName ?? "User";
  const surname: string = user?.surname ?? "";

  const formattedBalance = loading
    ? "—"
    : balanceVisible
      ? formatBalance(balance, currency)
      : "••••••••";

  return (
    <View style={{ flex: 1, backgroundColor: "#f2f4f8" }}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 110 }}
      >
        {/* ── Hero gradient ───────────────────────────────────────── */}
        <LinearGradient
          colors={["#1a1060", "#1e2d8f", "#2541c4", "#6a3de8", "#b04fc9"]}
          locations={[0, 0.25, 0.5, 0.75, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            paddingTop: Platform.OS === "ios" ? 60 : 48,
            paddingBottom: 100,
            paddingHorizontal: 20,
            position: "relative",
          }}
        >
          {/* Decorative orbs */}
          <View
            style={{
              position: "absolute",
              top: 60,
              left: -30,
              width: 140,
              height: 140,
              borderRadius: 70,
              backgroundColor: "rgba(180, 80, 200, 0.35)",
            }}
          />
          <View
            style={{
              position: "absolute",
              top: 20,
              right: -20,
              width: 160,
              height: 160,
              borderRadius: 80,
              backgroundColor: "rgba(100, 150, 255, 0.2)",
            }}
          />
          <View
            style={{
              position: "absolute",
              top: 100,
              right: 10,
              width: 90,
              height: 90,
              borderRadius: 45,
              borderWidth: 2,
              borderColor: "rgba(200, 120, 220, 0.5)",
              backgroundColor: "transparent",
            }}
          />

          {/* Top bar */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 6,
            }}
          >
            <TouchableOpacity>
              <Ionicons name="menu" size={26} color="#fff" />
            </TouchableOpacity>
            <Text
              style={{
                color: "rgba(255,255,255,0.85)",
                fontSize: 14,
                fontWeight: "500",
              }}
            >
              {loading ? "Hello..." : `Hello ${firstName} ${surname}`.trim()}
            </Text>
            <TouchableOpacity>
              <Ionicons
                name="ellipsis-vertical"
                size={20}
                color="rgba(255,255,255,0.7)"
              />
            </TouchableOpacity>
          </View>

          {/* App name */}
          <Text
            style={{
              color: "#fff",
              fontSize: 46,
              fontWeight: "900",
              letterSpacing: -1.5,
              textAlign: "center",
              marginBottom: 22,
              marginTop: 4,
            }}
          >
            PatchPay
          </Text>

          {/* Balance card */}
          <View
            style={{ borderRadius: 20, overflow: "hidden", marginBottom: 4 }}
          >
            <BlurView
              intensity={30}
              tint="light"
              style={{
                padding: 22,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.25)",
                backgroundColor: "rgba(255,255,255,0.12)",
              }}
            >
              <View style={{ marginBottom: 14 }}>
                <Text
                  style={{
                    color: "rgba(255,255,255,0.65)",
                    fontSize: 10,
                    letterSpacing: 2,
                    textTransform: "uppercase",
                    marginBottom: 4,
                  }}
                >
                  Balance
                </Text>
                <Pressable
                  onPress={() => setBalanceVisible((v) => !v)}
                  style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
                >
                  <Text
                    style={{
                      color: "#fff",
                      fontSize: 30,
                      fontWeight: "800",
                      letterSpacing: -0.5,
                    }}
                    adjustsFontSizeToFit
                    numberOfLines={1}
                  >
                    {formattedBalance}
                  </Text>
                  <Ionicons
                    name={balanceVisible ? "eye-outline" : "eye-off-outline"}
                    size={17}
                    color="rgba(255,255,255,0.5)"
                  />
                </Pressable>
              </View>

              <View
                style={{
                  height: 1,
                  backgroundColor: "rgba(255,255,255,0.15)",
                  marginBottom: 14,
                }}
              />

              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "flex-end",
                }}
              >
                <View>
                  <Text
                    style={{
                      color: "rgba(255,255,255,0.65)",
                      fontSize: 10,
                      letterSpacing: 2,
                      textTransform: "uppercase",
                      marginBottom: 4,
                    }}
                  >
                    Available Balance
                  </Text>
                  <Text
                    style={{ color: "#fff", fontSize: 22, fontWeight: "700" }}
                  >
                    {formattedBalance}
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end", gap: 5 }}>
                  {!loading && accountNumber !== "—" && (
                    <Text
                      style={{
                        color: "rgba(255,255,255,0.55)",
                        fontSize: 11,
                        fontFamily:
                          Platform.OS === "ios" ? "Courier" : "monospace",
                      }}
                    >
                      #{accountNumber}
                    </Text>
                  )}
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 5,
                    }}
                  >
                    <View
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: 4,
                        backgroundColor: isActive ? "#4ade80" : "#f87171",
                      }}
                    />
                    <Text
                      style={{ color: "rgba(255,255,255,0.6)", fontSize: 11 }}
                    >
                      {isActive ? "Active" : "Inactive"}
                    </Text>
                  </View>
                </View>
              </View>
            </BlurView>
          </View>
        </LinearGradient>

        {/* Quick Actions Card */}
        <View
          style={{
            marginTop: -46,
            marginHorizontal: 16,
            backgroundColor: "#fff",
            borderRadius: 20,
            padding: 18,
            paddingBottom: 16,
            shadowColor: "#000",
            shadowOpacity: 0.08,
            shadowRadius: 16,
            shadowOffset: { width: 0, height: 4 },
            elevation: 10,
            zIndex: 10,
          }}
        >
          <Text
            style={{
              fontSize: 10,
              fontWeight: "700",
              letterSpacing: 1.5,
              textTransform: "uppercase",
              color: "#94a3b8",
              marginBottom: 14,
            }}
          >
            Quick actions
          </Text>
          <View
            style={{ flexDirection: "row", justifyContent: "space-between" }}
          >
            {ACTIONS.map((action) => (
              <TouchableOpacity
                key={action.label}
                onPress={() => router.push(action.path)}
                activeOpacity={0.75}
                style={{ alignItems: "center", gap: 7 }}
              >
                <View
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: 14,
                    backgroundColor: action.iconBg,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {/* your icon here */}
                </View>
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: "600",
                    color: "#374151",
                    textAlign: "center",
                  }}
                >
                  {action.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Divider */}
        <View
          style={{
            height: 1,
            backgroundColor: "#e2e8f0",
            marginHorizontal: 20,
            marginBottom: 22,
          }}
        />

        {/* ── Latest Transactions ──────────────────────────────────── */}
        <View style={{ paddingHorizontal: 20 }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <Text
              style={{
                color: "#0f1923",
                fontWeight: "800",
                fontSize: 20,
                letterSpacing: -0.3,
              }}
            >
              Latest transactions
            </Text>
            <TouchableOpacity>
              <Text
                style={{ color: "#e05c97", fontSize: 13, fontWeight: "600" }}
              >
                View all
              </Text>
            </TouchableOpacity>
          </View>

          {/* Loading state */}
          {loading && (
            <View style={{ alignItems: "center", paddingVertical: 32 }}>
              <ActivityIndicator size="small" color="#6a3de8" />
              <Text style={{ color: "#94a3b8", fontSize: 13, marginTop: 10 }}>
                Loading transactions...
              </Text>
            </View>
          )}

          {/* Empty state */}
          {!loading && transactions.length === 0 && (
            <View
              style={{ alignItems: "center", paddingVertical: 40, gap: 10 }}
            >
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: "#eef2ff",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Feather name="inbox" size={24} color="#3a6df0" />
              </View>
              <Text
                style={{ color: "#64748b", fontSize: 14, fontWeight: "600" }}
              >
                No transactions yet
              </Text>
              <Text
                style={{ color: "#94a3b8", fontSize: 12, textAlign: "center" }}
              >
                Your transaction history will appear here
              </Text>
            </View>
          )}

          {/* Transaction list */}
          {!loading && (
            <View style={{ gap: 10 }}>
              {transactions.slice(0, 10).map((tx) => {
                const meta = getTxMeta(tx, walletId);
                const incoming = isIncomingTx(tx, walletId);
                const label = getTxLabel(tx);
                const date = formatTxDate(tx.createdAt);
                const txStatus = tx.status?.toLowerCase() ?? "completed";
                const sc = STATUS_CONFIG[txStatus] ?? STATUS_CONFIG.completed;
                const txFormatted = formatBalance(
                  Math.abs(tx.amount ?? 0),
                  tx.currency ?? currency,
                );

                // Payment method badge (bank, card, ussd, etc.)
                const methodLabel = tx.paymentMethod
                  ? tx.paymentMethod.charAt(0).toUpperCase() +
                    tx.paymentMethod.slice(1)
                  : null;

                return (
                  <TouchableOpacity
                    key={tx._id ?? tx.id}
                    activeOpacity={0.75}
                    style={{
                      backgroundColor: "#fff",
                      borderRadius: 16,
                      paddingHorizontal: 14,
                      paddingVertical: 13,
                      flexDirection: "row",
                      alignItems: "center",
                      shadowColor: "#000",
                      shadowOpacity: 0.04,
                      shadowRadius: 8,
                      shadowOffset: { width: 0, height: 2 },
                      elevation: 2,
                    }}
                  >
                    {/* Icon */}
                    <View
                      style={{
                        width: 46,
                        height: 46,
                        borderRadius: 14,
                        backgroundColor: meta.iconBg,
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: 12,
                      }}
                    >
                      <Feather
                        name={meta.icon as any}
                        size={19}
                        color={meta.iconColor}
                      />
                    </View>

                    {/* Label + date + method */}
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          color: "#0f1923",
                          fontWeight: "600",
                          fontSize: 13,
                          marginBottom: 3,
                        }}
                        numberOfLines={1}
                      >
                        {label}
                      </Text>
                      <Text style={{ color: "#94a3b8", fontSize: 11 }}>
                        {date}
                      </Text>
                      {methodLabel && (
                        <Text
                          style={{
                            color: "#cbd5e1",
                            fontSize: 10,
                            marginTop: 2,
                          }}
                        >
                          via {methodLabel}
                        </Text>
                      )}
                    </View>

                    {/* Amount + status badge */}
                    <View style={{ alignItems: "flex-end", gap: 5 }}>
                      <Text
                        style={{
                          fontWeight: "700",
                          fontSize: 13,
                          color: incoming ? "#16a34a" : "#0f1923",
                        }}
                      >
                        {incoming ? "+" : "-"}
                        {txFormatted}
                      </Text>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          backgroundColor: sc.bgColor,
                          borderRadius: 8,
                          paddingHorizontal: 7,
                          paddingVertical: 2,
                          gap: 4,
                        }}
                      >
                        <View
                          style={{
                            width: 5,
                            height: 5,
                            borderRadius: 3,
                            backgroundColor: sc.dot,
                          }}
                        />
                        <Text
                          style={{
                            fontSize: 10,
                            fontWeight: "700",
                            color: sc.textColor,
                            letterSpacing: 0.2,
                          }}
                        >
                          {sc.label}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
      {pinModalVisible && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 90,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "flex-end",
          }}
        >
          {/* Backdrop */}
          <Pressable
            style={{ flex: 1 }}
            onPress={() => setPinModalVisible(false)}
          />

          {/* Bottom Sheet */}
          <View
            style={{
              backgroundColor: "#fff",
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 20,
              paddingBottom: 30,
            }}
          >
            {/* Handle bar */}
            <View
              style={{
                width: 50,
                height: 5,
                backgroundColor: "#e2e8f0",
                borderRadius: 3,
                alignSelf: "center",
                marginBottom: 15,
              }}
            />

            {/* Icon */}
            <View
              style={{
                width: 60,
                height: 60,
                borderRadius: 30,
                backgroundColor: "#fff8ec",
                alignItems: "center",
                justifyContent: "center",
                alignSelf: "center",
                marginBottom: 12,
              }}
            >
              <Feather name="shield" size={26} color="#f5a623" />
            </View>

            {/* Title */}
            <Text
              style={{
                textAlign: "center",
                fontSize: 18,
                fontWeight: "800",
                color: "#0f1923",
              }}
            >
              Secure your account
            </Text>

            {/* Subtitle */}
            <Text
              style={{
                textAlign: "center",
                fontSize: 13,
                color: "#64748b",
                marginTop: 6,
                marginBottom: 18,
                paddingHorizontal: 10,
              }}
            >
              Set a 4-digit transaction PIN to protect your payments and
              withdrawals
            </Text>

            {/* Buttons */}
            <TouchableOpacity
              onPress={() => {
                setPinModalVisible(false);
                router.push("/(components)/settransactionpin");
              }}
              style={{
                backgroundColor: "#6a3de8",
                paddingVertical: 14,
                borderRadius: 14,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "700" }}>
                Set Transaction PIN
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setPinModalVisible(false)}
              style={{ marginTop: 12, alignItems: "center" }}
            >
              <Text style={{ color: "#94a3b8", fontSize: 13 }}>
                Maybe later
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}
