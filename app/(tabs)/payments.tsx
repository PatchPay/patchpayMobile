import { getUser } from "@/api/authapi";
import { getUserTransactions, getWallet } from "@/api/walletapi";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// ── Design tokens ─────────────────────────────────────────────────────────────
const T = {
  bg: "#EFF6FF",
  surface: "#FFFFFF",
  primary: "#3B82F6",
  primaryDark: "#2563EB",
  accent: "#8B5CF6",
  accentLight: "#EDE9FE",
  navy: "#0F172A",
  muted: "#64748B",
  subtle: "#CBD5E1",
  green: "#16A34A",
  greenBg: "#F0FDF4",
  greenBorder: "#BBF7D0",
  red: "#EF4444",
  redBg: "#FFF1F2",
  redBorder: "#FECACA",
  amber: "#F59E0B",
  amberBg: "#FFFBEB",
  blueBg: "#EFF6FF",
  blueBorder: "#BFDBFE",
  slate: "#94A3B8",
  slateBg: "#F8FAFC",
  shadow: "#1E40AF",
} as const;

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

// ── Helpers ───────────────────────────────────────────────────────────────────
const getTxMeta = (tx: any, walletId: string) => {
  const type: string = tx.type?.toLowerCase() ?? "";
  const isIncoming =
    tx.recipientWallet === walletId || tx.recipientId !== undefined;

  const map: Record<
    string,
    { icon: string; iconColor: string; iconBg: string }
  > = {
    deposit: { icon: "arrow-down-left", iconColor: T.green, iconBg: T.greenBg },
    withdrawal: { icon: "arrow-up-right", iconColor: T.red, iconBg: T.redBg },
    transfer: { icon: "send", iconColor: T.primary, iconBg: T.blueBg },
    escrow: { icon: "shield", iconColor: T.accent, iconBg: T.accentLight },
    payment: { icon: "credit-card", iconColor: "#EC4899", iconBg: "#FDF2F8" },
    refund: { icon: "rotate-ccw", iconColor: "#0EA5E9", iconBg: "#E0F2FE" },
  };

  return (
    map[type] ?? {
      icon: isIncoming ? "arrow-down-left" : "arrow-up-right",
      iconColor: isIncoming ? T.green : T.red,
      iconBg: isIncoming ? T.greenBg : T.redBg,
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
    textColor: T.green,
    bgColor: T.greenBg,
    dot: T.green,
  },
  pending: {
    label: "Pending",
    textColor: T.amber,
    bgColor: T.amberBg,
    dot: T.amber,
  },
  processing: {
    label: "Processing",
    textColor: T.primary,
    bgColor: T.blueBg,
    dot: T.primary,
  },
  failed: { label: "Failed", textColor: T.red, bgColor: T.redBg, dot: T.red },
  cancelled: {
    label: "Cancelled",
    textColor: T.slate,
    bgColor: T.slateBg,
    dot: T.subtle,
  },
};

const FILTER_TABS = [
  "All",
  "Deposits",
  "Withdrawals",
  "Transfers",
  "Payments",
] as const;
type FilterTab = (typeof FILTER_TABS)[number];

const filterTxByTab = (tx: any, tab: FilterTab): boolean => {
  if (tab === "All") return true;
  const type = tx.type?.toLowerCase() ?? "";
  if (tab === "Deposits") return type === "deposit" || type === "refund";
  if (tab === "Withdrawals") return type === "withdrawal";
  if (tab === "Transfers") return type === "transfer";
  if (tab === "Payments") return type === "payment" || type === "escrow";
  return true;
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function TransactionsScreen() {
  const [user, setUser] = useState<any>(null);
  const [wallet, setWallet] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<FilterTab>("All");
  const [search, setSearch] = useState("");

  const fetchData = async () => {
    try {
      const [u, w] = await Promise.all([getUser(), getWallet()]);

      setUser(u);
      setWallet(w?.data ?? w);

      const tx = await getUserTransactions(u._id);
      const txList = tx?.data ?? tx ?? [];
      setTransactions(Array.isArray(txList) ? txList : []);
    } catch (e) {
      console.log("Fetch error:", e);
    }
  };

  const fetchTransactions = async () => {
    if (!user?._id) return;

    try {
      const tx = await getUserTransactions(user._id);
      const txList = tx?.data ?? tx ?? [];
      setTransactions(Array.isArray(txList) ? txList : []);
    } catch (error) {
      console.log("Transaction fetch error:", error);
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
  const onRefresh = async () => {
    setRefreshing(true);

    try {
      await fetchTransactions();
    } finally {
      setRefreshing(false);
    }
  };

  const currency: string = wallet?.currency ?? "NGN";
  const walletId: string = wallet?._id ?? wallet?.id ?? "";

  const totalIn = transactions
    .filter((tx) => isIncomingTx(tx, walletId))
    .reduce((s, tx) => s + Math.abs(tx.amount ?? 0), 0);
  const totalOut = transactions
    .filter((tx) => !isIncomingTx(tx, walletId))
    .reduce((s, tx) => s + Math.abs(tx.amount ?? 0), 0);

  const filtered = transactions
    .filter((tx) => filterTxByTab(tx, activeTab))
    .filter((tx) => {
      if (!search.trim()) return true;
      const label = getTxLabel(tx).toLowerCase();
      return (
        label.includes(search.toLowerCase()) ||
        String(tx.amount).includes(search)
      );
    });

  // ── Transaction row ──────────────────────────────────────────────────────
  const renderTx = ({ item: tx }: { item: any; index: number }) => {
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
    const methodLabel = tx.paymentMethod
      ? tx.paymentMethod.charAt(0).toUpperCase() + tx.paymentMethod.slice(1)
      : null;

    return (
      <TouchableOpacity
        activeOpacity={0.78}
        style={{
          backgroundColor: T.surface,
          borderRadius: 20,
          paddingHorizontal: 16,
          paddingVertical: 15,
          flexDirection: "row",
          alignItems: "center",
          shadowColor: T.shadow,
          shadowOpacity: 0.07,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: 4 },
          elevation: 4,
          marginBottom: 10,
          borderWidth: 1,
          borderColor: "#EFF6FF",
        }}
      >
        {/* Icon bubble */}
        <View
          style={{
            width: 50,
            height: 50,
            borderRadius: 16,
            backgroundColor: meta.iconBg,
            alignItems: "center",
            justifyContent: "center",
            marginRight: 14,
          }}
        >
          <Feather name={meta.icon as any} size={20} color={meta.iconColor} />
        </View>

        {/* Info */}
        <View style={{ flex: 1 }}>
          <Text
            style={{
              color: T.navy,
              fontWeight: "700",
              fontSize: 13.5,
              marginBottom: 3,
            }}
            numberOfLines={1}
          >
            {label}
          </Text>
          <Text
            style={{
              color: T.muted,
              fontSize: 11,
              marginBottom: methodLabel ? 2 : 0,
            }}
          >
            {date}
          </Text>
          {methodLabel && (
            <Text style={{ color: T.subtle, fontSize: 10.5 }}>
              via {methodLabel}
            </Text>
          )}
        </View>

        {/* Amount + badge */}
        <View style={{ alignItems: "flex-end", gap: 6 }}>
          <Text
            style={{
              fontWeight: "800",
              fontSize: 14.5,
              color: incoming ? T.green : T.navy,
              letterSpacing: -0.3,
            }}
          >
            {incoming ? "+" : "−"}
            {txFormatted}
          </Text>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: sc.bgColor,
              borderRadius: 20,
              paddingHorizontal: 8,
              paddingVertical: 3,
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
                letterSpacing: 0.3,
              }}
            >
              {sc.label}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      <StatusBar barStyle="dark-content" backgroundColor={T.bg} />

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <View
        style={{
          paddingTop: Platform.OS === "ios" ? 58 : 46,
          paddingHorizontal: 20,
          paddingBottom: 16,
          backgroundColor: T.bg,
        }}
      >
        {/* Top bar */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 22,
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 13,
              backgroundColor: T.surface,
              alignItems: "center",
              justifyContent: "center",
              shadowColor: T.shadow,
              shadowOpacity: 0.08,
              shadowRadius: 10,
              elevation: 3,
              borderWidth: 1,
              borderColor: T.blueBorder,
            }}
          >
            <Feather name="arrow-left" size={18} color={T.navy} />
          </TouchableOpacity>

          <Text
            style={{
              fontSize: 17,
              fontWeight: "800",
              color: T.navy,
              letterSpacing: -0.4,
            }}
          >
            Transactions
          </Text>

          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 13,
              backgroundColor: T.accentLight,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: "#DDD6FE",
            }}
          >
            <Feather name="sliders" size={16} color={T.accent} />
          </View>
        </View>

        {/* ── Gradient summary card ─────────────────────────────────────── */}
        {!loading && (
          <LinearGradient
            colors={["#3B82F6", "#6D4ADE", "#8B5CF6"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 24,
              padding: 20,
              marginBottom: 18,
              shadowColor: "#3B82F6",
              shadowOpacity: 0.35,
              shadowRadius: 20,
              shadowOffset: { width: 0, height: 8 },
              elevation: 10,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 18,
              }}
            >
              <Text
                style={{
                  color: "rgba(255,255,255,0.75)",
                  fontSize: 11,
                  fontWeight: "600",
                  letterSpacing: 1,
                  textTransform: "uppercase",
                }}
              >
                Activity Summary
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 5,
                  backgroundColor: "rgba(255,255,255,0.15)",
                  borderRadius: 20,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                }}
              >
                <Feather name="list" size={11} color="rgba(255,255,255,0.9)" />
                <Text
                  style={{
                    color: "rgba(255,255,255,0.9)",
                    fontSize: 11,
                    fontWeight: "700",
                  }}
                >
                  {transactions.length} txns
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: "row", gap: 12 }}>
              {/* Money in */}
              <View
                style={{
                  flex: 1,
                  backgroundColor: "rgba(255,255,255,0.12)",
                  borderRadius: 16,
                  padding: 14,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 5,
                    marginBottom: 6,
                  }}
                >
                  <View
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 8,
                      backgroundColor: "rgba(22,163,74,0.25)",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Feather name="arrow-down-left" size={12} color="#86EFAC" />
                  </View>
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: "700",
                      color: "rgba(255,255,255,0.65)",
                      letterSpacing: 0.6,
                      textTransform: "uppercase",
                    }}
                  >
                    Money in
                  </Text>
                </View>
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: "800",
                    color: "#FFFFFF",
                    letterSpacing: -0.4,
                  }}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {formatBalance(totalIn, currency)}
                </Text>
              </View>

              {/* Money out */}
              <View
                style={{
                  flex: 1,
                  backgroundColor: "rgba(255,255,255,0.12)",
                  borderRadius: 16,
                  padding: 14,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 5,
                    marginBottom: 6,
                  }}
                >
                  <View
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 8,
                      backgroundColor: "rgba(239,68,68,0.25)",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Feather name="arrow-up-right" size={12} color="#FCA5A5" />
                  </View>
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: "700",
                      color: "rgba(255,255,255,0.65)",
                      letterSpacing: 0.6,
                      textTransform: "uppercase",
                    }}
                  >
                    Money out
                  </Text>
                </View>
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: "800",
                    color: "#FFFFFF",
                    letterSpacing: -0.4,
                  }}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {formatBalance(totalOut, currency)}
                </Text>
              </View>
            </View>
          </LinearGradient>
        )}

        {/* ── Search bar ────────────────────────────────────────────────── */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: T.surface,
            borderRadius: 16,
            paddingHorizontal: 15,
            paddingVertical: 12,
            gap: 10,
            shadowColor: T.shadow,
            shadowOpacity: 0.05,
            shadowRadius: 10,
            elevation: 2,
            marginBottom: 14,
            borderWidth: 1,
            borderColor: T.blueBorder,
          }}
        >
          <Feather name="search" size={16} color={T.primary} />
          <TextInput
            style={{ flex: 1, fontSize: 13.5, color: T.navy, padding: 0 }}
            placeholder="Search transactions..."
            placeholderTextColor={T.subtle}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearch("")}
              style={{
                width: 22,
                height: 22,
                borderRadius: 11,
                backgroundColor: T.accentLight,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Feather name="x" size={12} color={T.accent} />
            </TouchableOpacity>
          )}
        </View>

        {/* ── Filter tabs ───────────────────────────────────────────────── */}
        <FlatList
          data={FILTER_TABS as unknown as FilterTab[]}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item}
          contentContainerStyle={{ gap: 8 }}
          renderItem={({ item }) => {
            const active = activeTab === item;
            return (
              <TouchableOpacity
                onPress={() => setActiveTab(item)}
                style={{
                  paddingHorizontal: 18,
                  paddingVertical: 9,
                  borderRadius: 22,
                  backgroundColor: active ? T.primary : T.surface,
                  shadowColor: active ? T.primary : T.shadow,
                  shadowOpacity: active ? 0.32 : 0.04,
                  shadowRadius: active ? 12 : 4,
                  elevation: active ? 6 : 2,
                  borderWidth: 1,
                  borderColor: active ? T.primary : T.blueBorder,
                }}
              >
                <Text
                  style={{
                    fontSize: 12.5,
                    fontWeight: "700",
                    color: active ? "#fff" : T.muted,
                    letterSpacing: 0.1,
                  }}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* ── List ──────────────────────────────────────────────────────────── */}
      {loading ? (
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: T.accentLight,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 14,
            }}
          >
            <ActivityIndicator size="large" color={T.accent} />
          </View>
          <Text style={{ color: T.muted, fontSize: 13, fontWeight: "600" }}>
            Loading transactions…
          </Text>
        </View>
      ) : filtered.length === 0 ? (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 40,
          }}
        >
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              backgroundColor: T.accentLight,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
              borderWidth: 1,
              borderColor: "#DDD6FE",
            }}
          >
            <Feather name="inbox" size={28} color={T.accent} />
          </View>
          <Text
            style={{
              color: T.navy,
              fontSize: 16,
              fontWeight: "800",
              marginBottom: 8,
              letterSpacing: -0.3,
            }}
          >
            {search ? "No results found" : "No transactions yet"}
          </Text>
          <Text
            style={{
              color: T.muted,
              fontSize: 13,
              textAlign: "center",
              lineHeight: 20,
            }}
          >
            {search
              ? `Nothing matched "${search}". Try a different term.`
              : "Your transaction history will appear here once you start transacting."}
          </Text>
          {search.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearch("")}
              style={{
                marginTop: 18,
                backgroundColor: T.primary,
                paddingHorizontal: 22,
                paddingVertical: 11,
                borderRadius: 14,
                shadowColor: T.primary,
                shadowOpacity: 0.3,
                shadowRadius: 10,
                elevation: 5,
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 13 }}>
                Clear search
              </Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(tx) => tx._id ?? tx.id ?? String(Math.random())}
          renderItem={renderTx}
          contentContainerStyle={{
            paddingHorizontal: 18,
            paddingTop: 6,
            paddingBottom: 110,
          }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={T.primary}
            />
          }
          ListFooterComponent={
            filtered.length > 0 ? (
              <Text
                style={{
                  textAlign: "center",
                  color: T.subtle,
                  fontSize: 12,
                  paddingVertical: 10,
                }}
              >
                {filtered.length} transaction{filtered.length !== 1 ? "s" : ""}
              </Text>
            ) : null
          }
        />
      )}
    </View>
  );
}
