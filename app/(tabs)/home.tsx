import { getUser } from "@/api/authapi";
import { getUserTransactions, getWallet } from "@/api/walletapi";
import { Feather, Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

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
    return `${currency} ${amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
  }
};

// ── Transaction helpers ───────────────────────────────────────────────────────
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

const getTxLabel = (tx: any): string => {
  const type: string = tx.type?.toLowerCase() ?? "";
  if (type === "deposit") return "Wallet Top-up";
  if (type === "withdrawal") return "Withdrawal";
  if (type === "transfer")
    return tx.description?.includes("to") ? tx.description : "Transfer";
  if (type === "escrow") return "Escrow Payment";
  if (type === "payment") return "Payment";
  if (type === "refund") return "Refund";
  return tx.description ?? "Transaction";
};

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
      d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
    );
  } catch {
    return dateStr;
  }
};

const isIncomingTx = (tx: any, walletId: string): boolean => {
  const type = tx.type?.toLowerCase() ?? "";
  if (type === "deposit" || type === "refund") return true;
  if (type === "withdrawal") return false;
  return tx.recipientWallet === walletId;
};

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
    label: "Pay",
    bg: ["#2ec4b6", "#1aaa9e"] as [string, string],
    path: "/(components)/sendmoney",
    iconBg: "#e8faf8",
    iconColor: "#2ec4b6",
  },
  {
    icon: "arrow-up-circle",
    label: "Top Up",
    bg: ["#3a6df0", "#2558e8"] as [string, string],
    path: "/(components)/topupscreen",
    iconBg: "#eef2ff",
    iconColor: "#3a6df0",
  },
  {
    icon: "shield",
    label: "Escrow",
    bg: ["#f5a623", "#e8960f"] as [string, string],
    path: "/(components)/escrow",
    iconBg: "#fff8ec",
    iconColor: "#f5a623",
  },
  {
    icon: "file-text",
    label: "RFQ",
    bg: ["#e05c97", "#c9417e"] as [string, string],
    path: "/(components)/rfq",
    iconBg: "#fdf2f8",
    iconColor: "#e05c97",
  },
  {
    icon: "arrow-down-circle",
    label: "Withdraw",
    bg: ["#ef4444", "#dc2626"] as [string, string],
    path: "/(components)/withdraw",
    iconBg: "#fff1f1",
    iconColor: "#ef4444",
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
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const [u, w] = await Promise.all([getUser(), getWallet()]);
      const tx = await getUserTransactions(u._id);
      setUser(u);
      setWallet(w?.data ?? w);
      const txList = tx?.data ?? tx ?? [];
      setTransactions(Array.isArray(txList) ? txList : []);
    } catch (e) {
      console.log("Fetch error:", e);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        await fetchData();
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!loading && user && !user.hasTransactionPin) {
      setTimeout(() => setPinModalVisible(true), 800);
    }
  }, [loading, user]);

  const balance: number = wallet?.balance ?? 0;
  const currency: string = wallet?.currency ?? "NGN";
  const walletId: string = wallet?._id ?? wallet?.id ?? "";
  const accountNumber: string = wallet?.accountNumber ?? "—";
  const isActive: boolean = wallet?.isActive ?? false;
  const firstName: string = user?.firstName ?? "User";
  const surname: string = user?.surname ?? "";

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchData();
    } catch (e) {
      console.log(e);
    } finally {
      setRefreshing(false);
    }
  };

  const formattedBalance = loading
    ? "—"
    : balanceVisible
      ? formatBalance(balance, currency)
      : "••••••••";

  // ── Greeting ──────────────────────────────────────────────────────────────
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <View style={{ flex: 1, backgroundColor: "#f0f2f8" }}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 110 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* ── Hero gradient ──────────────────────────────────────────────── */}
        <LinearGradient
          colors={["#0d0a2e", "#1a1060", "#2541c4", "#6a3de8"]}
          locations={[0, 0.3, 0.65, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            paddingTop: Platform.OS === "ios" ? 58 : 46,
            paddingBottom: 110,
            paddingHorizontal: 22,
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Decorative orbs */}
          <View
            style={{
              position: "absolute",
              top: -20,
              right: -40,
              width: 200,
              height: 200,
              borderRadius: 100,
              backgroundColor: "rgba(106,61,232,0.35)",
            }}
          />
          <View
            style={{
              position: "absolute",
              bottom: 20,
              left: -50,
              width: 170,
              height: 170,
              borderRadius: 85,
              backgroundColor: "rgba(37,65,196,0.3)",
            }}
          />
          <View
            style={{
              position: "absolute",
              top: 80,
              right: 30,
              width: 60,
              height: 60,
              borderRadius: 30,
              borderWidth: 1.5,
              borderColor: "rgba(176,79,201,0.5)",
              backgroundColor: "transparent",
            }}
          />

          {/* Top bar */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 24,
            }}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
            >
              {/* Avatar placeholder */}
              <View
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 19,
                  backgroundColor: "rgba(255,255,255,0.15)",
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 1.5,
                  borderColor: "rgba(255,255,255,0.25)",
                }}
              >
                <Text
                  style={{ color: "#fff", fontWeight: "700", fontSize: 14 }}
                >
                  {firstName.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View>
                <Text
                  style={{
                    color: "rgba(255,255,255,0.55)",
                    fontSize: 11,
                    fontWeight: "500",
                  }}
                >
                  {loading ? "Hello..." : greeting}
                </Text>
                <Text
                  style={{ color: "#fff", fontSize: 14, fontWeight: "700" }}
                >
                  {loading ? "..." : `${firstName} ${surname}`.trim()}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={{
                width: 38,
                height: 38,
                borderRadius: 19,
                backgroundColor: "rgba(255,255,255,0.1)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons
                name="notifications-outline"
                size={19}
                color="rgba(255,255,255,0.85)"
              />
            </TouchableOpacity>
          </View>

          {/* Balance card */}
          <BlurView
            intensity={25}
            tint="light"
            style={{
              borderRadius: 24,
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.2)",
              backgroundColor: "rgba(255,255,255,0.1)",
              overflow: "hidden",
              padding: 22,
            }}
          >
            {/* Currency flag + label */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                marginBottom: 8,
              }}
            >
              <Text style={{ fontSize: 14 }}>
                {CURRENCY_CONFIG[currency as SupportedCurrency]?.flag ?? "🌐"}
              </Text>
              <Text
                style={{
                  color: "rgba(255,255,255,0.5)",
                  fontSize: 10,
                  letterSpacing: 2.5,
                  textTransform: "uppercase",
                  fontWeight: "600",
                }}
              >
                Total Balance · {currency}
              </Text>
            </View>

            {/* Amount row */}
            <Pressable
              onPress={() => setBalanceVisible((v) => !v)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
                marginBottom: 20,
              }}
            >
              <Text
                style={{
                  color: "#fff",
                  fontSize: 34,
                  fontWeight: "800",
                  letterSpacing: -1,
                }}
                adjustsFontSizeToFit
                numberOfLines={1}
              >
                {formattedBalance}
              </Text>
              <Ionicons
                name={balanceVisible ? "eye-outline" : "eye-off-outline"}
                size={18}
                color="rgba(255,255,255,0.4)"
              />
            </Pressable>

            <View
              style={{
                height: 1,
                backgroundColor: "rgba(255,255,255,0.12)",
                marginBottom: 16,
              }}
            />

            {/* Bottom row */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <View>
                <Text
                  style={{
                    color: "rgba(255,255,255,0.45)",
                    fontSize: 9,
                    letterSpacing: 2,
                    textTransform: "uppercase",
                    marginBottom: 3,
                    fontWeight: "600",
                  }}
                >
                  Available
                </Text>
                <Text
                  style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}
                >
                  {formattedBalance}
                </Text>
              </View>
              <View style={{ alignItems: "flex-end", gap: 6 }}>
                {!loading && accountNumber !== "—" && (
                  <View
                    style={{
                      backgroundColor: "rgba(255,255,255,0.1)",
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: 8,
                    }}
                  >
                    <Text
                      style={{
                        color: "rgba(255,255,255,0.7)",
                        fontSize: 11,
                        fontFamily:
                          Platform.OS === "ios" ? "Courier" : "monospace",
                      }}
                    >
                      #{accountNumber}
                    </Text>
                  </View>
                )}
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 5 }}
                >
                  <View
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: isActive ? "#4ade80" : "#f87171",
                    }}
                  />
                  <Text
                    style={{
                      color: "rgba(255,255,255,0.55)",
                      fontSize: 11,
                      fontWeight: "500",
                    }}
                  >
                    {isActive ? "Active" : "Inactive"}
                  </Text>
                </View>
              </View>
            </View>
          </BlurView>
        </LinearGradient>

        {/* ── Quick Actions ──────────────────────────────────────────────── */}
        <View
          style={{
            marginTop: -52,
            marginHorizontal: 18,
            backgroundColor: "#fff",
            borderRadius: 22,
            paddingTop: 18,
            paddingBottom: 20,
            paddingHorizontal: 18,
            shadowColor: "#1a1060",
            shadowOpacity: 0.12,
            shadowRadius: 20,
            shadowOffset: { width: 0, height: 6 },
            elevation: 12,
            zIndex: 10,
          }}
        >
          <Text
            style={{
              fontSize: 10,
              fontWeight: "700",
              letterSpacing: 1.8,
              textTransform: "uppercase",
              color: "#94a3b8",
              marginBottom: 16,
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
                activeOpacity={0.7}
                style={{ alignItems: "center", gap: 8 }}
              >
                <View
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 16,
                    backgroundColor: action.iconBg,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Feather
                    name={action.icon as any}
                    size={20}
                    color={action.iconColor}
                  />
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

        {/* ── Latest Transactions ────────────────────────────────────────── */}
        <View style={{ paddingHorizontal: 18, marginTop: 26 }}>
          {/* Section header */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 14,
            }}
          >
            <Text
              style={{
                color: "#0f1923",
                fontWeight: "800",
                fontSize: 18,
                letterSpacing: -0.3,
              }}
            >
              Recent
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/payments")}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                backgroundColor: "#f0f2f8",
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 20,
              }}
            >
              <Text
                style={{ color: "#6a3de8", fontSize: 12, fontWeight: "700" }}
              >
                See all
              </Text>
              <Feather name="arrow-right" size={12} color="#6a3de8" />
            </TouchableOpacity>
          </View>

          {/* Loading */}
          {loading && (
            <View style={{ alignItems: "center", paddingVertical: 28 }}>
              <ActivityIndicator size="small" color="#6a3de8" />
              <Text style={{ color: "#94a3b8", fontSize: 13, marginTop: 8 }}>
                Loading...
              </Text>
            </View>
          )}

          {/* Empty */}
          {!loading && transactions.length === 0 && (
            <View
              style={{
                alignItems: "center",
                paddingVertical: 36,
                gap: 10,
                backgroundColor: "#fff",
                borderRadius: 20,
                paddingHorizontal: 20,
              }}
            >
              <View
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 26,
                  backgroundColor: "#eef2ff",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Feather name="inbox" size={22} color="#3a6df0" />
              </View>
              <Text
                style={{ color: "#374151", fontSize: 14, fontWeight: "700" }}
              >
                No transactions yet
              </Text>
              <Text
                style={{ color: "#94a3b8", fontSize: 12, textAlign: "center" }}
              >
                Your history will appear here once you make a transaction
              </Text>
            </View>
          )}

          {/* Show only 2 transactions */}
          {!loading && transactions.length > 0 && (
            <View style={{ gap: 10 }}>
              {transactions.slice(0, 2).map((tx) => {
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

                return (
                  <TouchableOpacity
                    key={tx._id ?? tx.id}
                    activeOpacity={0.75}
                    style={{
                      backgroundColor: "#fff",
                      borderRadius: 18,
                      paddingHorizontal: 14,
                      paddingVertical: 14,
                      flexDirection: "row",
                      alignItems: "center",
                      shadowColor: "#1a1060",
                      shadowOpacity: 0.05,
                      shadowRadius: 10,
                      shadowOffset: { width: 0, height: 3 },
                      elevation: 3,
                    }}
                  >
                    {/* Icon */}
                    <View
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 15,
                        backgroundColor: meta.iconBg,
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: 13,
                      }}
                    >
                      <Feather
                        name={meta.icon as any}
                        size={20}
                        color={meta.iconColor}
                      />
                    </View>

                    {/* Label + date */}
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          color: "#0f1923",
                          fontWeight: "700",
                          fontSize: 13.5,
                          marginBottom: 3,
                        }}
                        numberOfLines={1}
                      >
                        {label}
                      </Text>
                      <Text style={{ color: "#94a3b8", fontSize: 11 }}>
                        {date}
                      </Text>
                    </View>

                    {/* Amount + badge */}
                    <View style={{ alignItems: "flex-end", gap: 5 }}>
                      <Text
                        style={{
                          fontWeight: "800",
                          fontSize: 14,
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

              {/* View all footer link */}
              {transactions.length > 2 && (
                <TouchableOpacity
                  onPress={() => router.push("/(tabs)/payments")}
                  style={{
                    alignItems: "center",
                    paddingVertical: 14,
                    backgroundColor: "#fff",
                    borderRadius: 18,
                    marginTop: 2,
                    borderWidth: 1.5,
                    borderColor: "#eef2ff",
                    borderStyle: "dashed",
                  }}
                >
                  <Text
                    style={{
                      color: "#6a3de8",
                      fontSize: 13,
                      fontWeight: "700",
                    }}
                  >
                    View all {transactions.length} transactions
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* ── PIN Modal ─────────────────────────────────────────────────────── */}
      {pinModalVisible && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 90,
            backgroundColor: "rgba(10,8,40,0.6)",
            justifyContent: "flex-end",
          }}
        >
          <Pressable
            style={{ flex: 1 }}
            onPress={() => setPinModalVisible(false)}
          />
          <View
            style={{
              backgroundColor: "#fff",
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              padding: 24,
              paddingBottom: 36,
            }}
          >
            <View
              style={{
                width: 44,
                height: 5,
                backgroundColor: "#e2e8f0",
                borderRadius: 3,
                alignSelf: "center",
                marginBottom: 20,
              }}
            />
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: "#fff8ec",
                alignItems: "center",
                justifyContent: "center",
                alignSelf: "center",
                marginBottom: 14,
              }}
            >
              <Feather name="shield" size={28} color="#f5a623" />
            </View>
            <Text
              style={{
                textAlign: "center",
                fontSize: 19,
                fontWeight: "800",
                color: "#0f1923",
              }}
            >
              Secure your account
            </Text>
            <Text
              style={{
                textAlign: "center",
                fontSize: 13,
                color: "#64748b",
                marginTop: 7,
                marginBottom: 22,
                paddingHorizontal: 12,
                lineHeight: 19,
              }}
            >
              Set a 4-digit transaction PIN to protect your payments and
              withdrawals.
            </Text>
            <TouchableOpacity
              onPress={() => {
                setPinModalVisible(false);
                router.push("/(components)/settransactionpin");
              }}
              style={{
                backgroundColor: "#6a3de8",
                paddingVertical: 15,
                borderRadius: 16,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>
                Set Transaction PIN
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setPinModalVisible(false)}
              style={{ marginTop: 14, alignItems: "center" }}
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
