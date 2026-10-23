import { getUser } from "@/api/authapi";
import { getUserTransactions, getWallet } from "@/api/walletapi";
import { Feather, Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { router } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import NotificationBell from "../(components)/notification/notificationbell";

// ─── Theme ────────────────────────────────────────────────────────────────────

const C = {
  navy: "#161966",
  navyLight: "#242A85",
  blue: "#3F58F7",
  blueSoft: "#EEF1FF",
  blueMuted: "#C9D1FD",
  background: "#F7F8FC",
  surface: "#FFFFFF",
  tile: "#F5F7FF",
  ink: "#0F172A",
  text: "#334155",
  muted: "#64748B",
  faint: "#94A3B8",
  line: "#E8ECF4",
  green: "#15803D",
  greenSoft: "#DCFCE7",
  amber: "#B45309",
  amberSoft: "#FEF3C7",
  red: "#DC2626",
  redSoft: "#FEE2E2",
  white: "#FFFFFF",
  whiteSoft: "rgba(255,255,255,0.72)",
  whiteChip: "rgba(255,255,255,0.12)",
} as const;

const RECENT_LIMIT = 3;

type SupportedCurrency = "NGN" | "USD" | "EUR" | "GBP" | "TZS";

const CURRENCY_LOCALE: Record<SupportedCurrency, string> = {
  NGN: "en-NG",
  USD: "en-US",
  EUR: "de-DE",
  GBP: "en-GB",
  TZS: "en-TZ",
};

const NUM = { fontVariant: ["tabular-nums"] as const };

// ─── Formatting ───────────────────────────────────────────────────────────────

const formatMoney = (
  amount: number,
  currency: string,
  decimals = 2,
): string => {
  const locale = CURRENCY_LOCALE[currency as SupportedCurrency] ?? "en-US";

  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })}`;
  }
};

const formatBalance = (amount: number, currency: string) =>
  formatMoney(amount, currency, 2);

const formatTxDate = (dateStr?: string): string => {
  if (!dateStr) return "Date unavailable";

  const date = new Date(dateStr);

  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return (
    date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }) +
    " · " +
    date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    })
  );
};

const getGreeting = (): string => {
  const hour = new Date().getHours();

  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
};

// ─── Transaction helpers ──────────────────────────────────────────────────────

const getTxIcon = (tx: any, walletId: string): string => {
  const type = tx.type?.toLowerCase() ?? "";

  const icons: Record<string, string> = {
    deposit: "arrow-down-left",
    withdrawal: "arrow-up-right",
    transfer: "send",
    escrow: "shield",
    payment: "credit-card",
    refund: "rotate-ccw",
  };

  if (icons[type]) return icons[type];

  return tx.recipientWallet === walletId || tx.recipientId !== undefined
    ? "arrow-down-left"
    : "arrow-up-right";
};

const getTxLabel = (tx: any): string => {
  const type = tx.type?.toLowerCase() ?? "";

  const labels: Record<string, string> = {
    deposit: "Wallet Top-up",
    withdrawal: "Withdrawal",
    transfer: "Transfer",
    escrow: "Escrow Payment",
    payment: "Payment",
    refund: "Refund",
  };

  if (type === "transfer" && tx.description) {
    return tx.description;
  }

  return labels[type] ?? tx.description ?? "Transaction";
};

const isIncomingTx = (tx: any, walletId: string): boolean => {
  const type = tx.type?.toLowerCase() ?? "";

  if (type === "deposit" || type === "refund") return true;
  if (type === "withdrawal") return false;

  return Boolean(
    walletId &&
    (tx.recipientWallet === walletId || tx.recipientWallet?.id === walletId),
  );
};

const isCounted = (tx: any): boolean => {
  const status = tx.status?.toLowerCase() ?? "completed";

  return status !== "failed" && status !== "cancelled";
};

const STATUS_TEXT: Record<
  string,
  { label: string; color: string; background: string }
> = {
  pending: {
    label: "Pending",
    color: C.amber,
    background: C.amberSoft,
  },
  processing: {
    label: "Processing",
    color: C.blue,
    background: C.blueSoft,
  },
  failed: {
    label: "Failed",
    color: C.red,
    background: C.redSoft,
  },
  cancelled: {
    label: "Cancelled",
    color: C.muted,
    background: C.line,
  },
};

const sumRange = (
  transactions: any[],
  walletId: string,
  from: Date,
  to: Date,
  incoming: boolean,
): number => {
  return transactions.reduce((sum, tx) => {
    if (!isCounted(tx)) return sum;

    const date = new Date(tx.created_at);

    if (Number.isNaN(date.getTime()) || date < from || date >= to) {
      return sum;
    }

    return isIncomingTx(tx, walletId) === incoming
      ? sum + Math.abs(Number(tx.amount) || 0)
      : sum;
  }, 0);
};

const changeText = (current: number, previous: number) => {
  if (previous <= 0) return null;

  const percentage = Math.round(((current - previous) / previous) * 100);

  return `${percentage >= 0 ? "+" : "−"}${Math.abs(percentage)}% vs last month`;
};

// ─── Quick actions ────────────────────────────────────────────────────────────

const ACTIONS = [
  {
    icon: "credit-card",
    label: "Pay",
    path: "/(components)/sendmoney",
  },
  {
    icon: "arrow-up-circle",
    label: "Top up",
    path: "/(components)/topupscreen",
  },
  {
    icon: "shield",
    label: "Transactions",
    path: "/(components)/escrow/mainescrow",
  },
  {
    icon: "file-text",
    label: "RFQ",
    path: "/(components)/rfq",
  },
  {
    icon: "arrow-down-circle",
    label: "Withdraw",
    path: "/(components)/withdraw",
  },
] as const;

// ─── Reusable components ──────────────────────────────────────────────────────

function SectionTitle({
  title,
  action,
  onAction,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.sectionHeading}>
      <Text style={styles.sectionTitle}>{title}</Text>

      {action && onAction ? (
        <TouchableOpacity onPress={onAction} activeOpacity={0.7} hitSlop={8}>
          <Text style={styles.linkText}>{action}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

function StatCard({
  label,
  value,
  note,
  icon,
  iconColor,
  iconBackground,
}: {
  label: string;
  value: string;
  note?: string | null;
  icon: string;
  iconColor: string;
  iconBackground: string;
}) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statTop}>
        <View style={[styles.statIcon, { backgroundColor: iconBackground }]}>
          <Feather name={icon as any} size={17} color={iconColor} />
        </View>
        <Text style={styles.statLabel}>{label}</Text>
      </View>

      <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>

      <Text style={styles.statNote} numberOfLines={1}>
        {note || " "}
      </Text>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [wallet, setWallet] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const [fetchError, setFetchError] = useState(false);

  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pinTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchData = useCallback(async () => {
    setFetchError(false);

    try {
      const [userResponse, walletResponse] = await Promise.all([
        getUser(),
        getWallet(),
      ]);

      const currentWallet = walletResponse?.data ?? walletResponse;

      const userId =
        userResponse?.id ??
        userResponse?._id ??
        userResponse?.data?.id ??
        userResponse?.data?._id;

      let transactionList: any[] = [];

      if (userId) {
        const transactionResponse = await getUserTransactions(userId);

        const result = transactionResponse?.data ?? transactionResponse;

        transactionList = Array.isArray(result)
          ? result
          : Array.isArray(result?.transactions)
            ? result.transactions
            : Array.isArray(result?.data)
              ? result.data
              : [];
      }

      setUser(userResponse);
      setWallet(currentWallet);
      setTransactions(transactionList);
    } catch (error) {
      console.error("Dashboard fetch error:", error);
      setFetchError(true);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      await fetchData();

      if (mounted) setLoading(false);
    };

    initialize();

    return () => {
      mounted = false;

      if (copyTimer.current) {
        clearTimeout(copyTimer.current);
      }

      if (pinTimer.current) {
        clearTimeout(pinTimer.current);
      }
    };
  }, [fetchData]);

  useEffect(() => {
    if (loading || !user || user.hasTransactionPin) return;

    pinTimer.current = setTimeout(() => {
      setPinModalVisible(true);
    }, 800);

    return () => {
      if (pinTimer.current) {
        clearTimeout(pinTimer.current);
      }
    };
  }, [loading, user]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);

    try {
      await fetchData();
    } finally {
      setRefreshing(false);
    }
  }, [fetchData]);

  const balance = Number(wallet?.balance) || 0;
  const currency: string = wallet?.currency ?? "NGN";
  const walletId: string = wallet?.id ?? wallet?._id ?? wallet?.walletId ?? "";

  const accountNumber: string =
    wallet?.accountNumber ?? wallet?.account_number ?? "—";

  const isActive: boolean = wallet?.isActive ?? wallet?.is_active ?? false;

  const firstName: string = user?.firstName ?? user?.first_name ?? "User";

  const surname: string =
    user?.surname ?? user?.lastName ?? user?.last_name ?? "";

  const formattedBalance = loading
    ? "—"
    : balanceVisible
      ? formatBalance(balance, currency)
      : "••••••••";

  const greeting = getGreeting();

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const today = now.getDate();

  const monthStart = new Date(year, month, 1);
  const nextMonthStart = new Date(year, month + 1, 1);
  const previousMonthStart = new Date(year, month - 1, 1);

  const moneyIn = sumRange(
    transactions,
    walletId,
    monthStart,
    nextMonthStart,
    true,
  );

  const moneyOut = sumRange(
    transactions,
    walletId,
    monthStart,
    nextMonthStart,
    false,
  );

  const previousMoneyIn = sumRange(
    transactions,
    walletId,
    previousMonthStart,
    monthStart,
    true,
  );

  const previousMoneyOut = sumRange(
    transactions,
    walletId,
    previousMonthStart,
    monthStart,
    false,
  );

  const week = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(year, month, today - (6 - index));

    const nextDate = new Date(year, month, today - (6 - index) + 1);

    return {
      label: date.toLocaleDateString("en-US", {
        weekday: "short",
      }),
      out: sumRange(transactions, walletId, date, nextDate, false),
      isToday: index === 6,
    };
  });

  const weekMax = Math.max(...week.map((day) => day.out), 1);
  const weekTotal = week.reduce((sum, day) => sum + day.out, 0);

  const pendingCount = transactions.filter((tx) => {
    const status = tx.status?.toLowerCase();

    return status === "pending" || status === "processing";
  }).length;

  const showWidgets = !loading && transactions.length > 0;

  const copyAccountNumber = async () => {
    if (accountNumber === "—") return;

    try {
      await Clipboard.setStringAsync(accountNumber);
      setCopied(true);

      if (copyTimer.current) {
        clearTimeout(copyTimer.current);
      }

      copyTimer.current = setTimeout(() => {
        setCopied(false);
      }, 1800);
    } catch {
      Alert.alert(
        "Unable to copy",
        "Please try copying your account number again.",
      );
    }
  };

  const openPayments = () => {
    router.push("/(tabs)/payments");
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={C.navy} />

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={C.blue}
            colors={[C.blue]}
          />
        }
      >
        {/* ── Wallet header ──────────────────────────────────────── */}

        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.profileGroup}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {firstName.charAt(0).toUpperCase()}
                </Text>
              </View>

              <View style={styles.greetingGroup}>
                <Text style={styles.greeting}>
                  {loading ? "Welcome" : greeting}
                </Text>
                <Text style={styles.userName} numberOfLines={1}>
                  {loading ? "Loading..." : `${firstName} ${surname}`.trim()}
                </Text>
              </View>
            </View>

            <View style={styles.notificationButton}>
              <NotificationBell />
            </View>
          </View>

          <View style={styles.balanceHeading}>
            <View>
              <Text style={styles.balanceLabel}>Total wallet balance</Text>
              <Text style={styles.currencyLabel}>{currency}</Text>
            </View>

            <Pressable
              onPress={() => setBalanceVisible((visible) => !visible)}
              accessibilityRole="button"
              accessibilityLabel={
                balanceVisible ? "Hide wallet balance" : "Show wallet balance"
              }
              hitSlop={10}
              style={styles.eyeButton}
            >
              <Ionicons
                name={balanceVisible ? "eye-outline" : "eye-off-outline"}
                size={20}
                color={C.white}
              />
            </Pressable>
          </View>

          <Text
            style={styles.balanceValue}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {formattedBalance}
          </Text>

          <View style={styles.headerDivider} />

          <View style={styles.accountRow}>
            <View style={styles.accountInfo}>
              <Text style={styles.accountLabel}>Account number</Text>

              <View style={styles.accountNumberRow}>
                <Text style={styles.accountNumber}>
                  {loading ? "Loading..." : accountNumber}
                </Text>

                {!loading && accountNumber !== "—" && (
                  <Pressable
                    onPress={copyAccountNumber}
                    hitSlop={10}
                    accessibilityRole="button"
                    accessibilityLabel="Copy account number"
                    style={styles.copyButton}
                  >
                    <Feather
                      name={copied ? "check" : "copy"}
                      size={15}
                      color={copied ? "#86EFAC" : C.white}
                    />
                    <Text style={styles.copyText}>
                      {copied ? "Copied" : "Copy"}
                    </Text>
                  </Pressable>
                )}
              </View>
            </View>

            <View
              style={[
                styles.accountStatus,
                {
                  backgroundColor: isActive
                    ? "rgba(34,197,94,0.15)"
                    : "rgba(248,113,113,0.15)",
                },
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor: isActive ? "#4ADE80" : "#F87171",
                  },
                ]}
              />
              <Text
                style={[
                  styles.accountStatusText,
                  {
                    color: isActive ? "#BBF7D0" : "#FECACA",
                  },
                ]}
              >
                {isActive ? "Active" : "Inactive"}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Quick actions ─────────────────────────────────────── */}

        <View style={styles.quickActionsSection}>
          <SectionTitle title="Quick actions" />

          <View style={styles.actionsRow}>
            {ACTIONS.map((action) => (
              <TouchableOpacity
                key={action.label}
                onPress={() => router.push(action.path)}
                activeOpacity={0.72}
                style={styles.actionItem}
              >
                <View style={styles.actionIcon}>
                  <Feather name={action.icon as any} size={21} color={C.blue} />
                </View>

                <Text style={styles.actionLabel} numberOfLines={2}>
                  {action.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Loading error ─────────────────────────────────────── */}

        {fetchError && !loading && (
          <View style={styles.errorCard}>
            <View style={styles.errorIcon}>
              <Feather name="alert-circle" size={20} color={C.red} />
            </View>

            <View style={styles.errorContent}>
              <Text style={styles.errorTitle}>
                Couldn&lsquo;t refresh everything
              </Text>
              <Text style={styles.errorDescription}>
                Check your connection and try again.
              </Text>
            </View>

            <TouchableOpacity
              onPress={onRefresh}
              disabled={refreshing}
              style={styles.retryButton}
            >
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Overview ──────────────────────────────────────────── */}

        <View style={styles.section}>
          <SectionTitle title="Overview" />

          {loading ? (
            <View style={styles.loadingCard}>
              <ActivityIndicator size="small" color={C.blue} />
              <Text style={styles.loadingText}>Loading your overview...</Text>
            </View>
          ) : transactions.length === 0 ? (
            <View style={styles.emptyOverview}>
              <View style={styles.emptyOverviewIcon}>
                <Feather name="bar-chart-2" size={23} color={C.blue} />
              </View>
              <Text style={styles.emptyOverviewTitle}>
                Your overview starts here
              </Text>
              <Text style={styles.emptyOverviewDescription}>
                Your money-in and spending insights will appear after your first
                transaction.
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.statsRow}>
                <StatCard
                  label="Money in"
                  value={formatMoney(moneyIn, currency, 0)}
                  note={changeText(moneyIn, previousMoneyIn)}
                  icon="trending-up"
                  iconColor={C.green}
                  iconBackground={C.greenSoft}
                />

                <StatCard
                  label="Money out"
                  value={formatMoney(moneyOut, currency, 0)}
                  note={changeText(moneyOut, previousMoneyOut)}
                  icon="trending-down"
                  iconColor={C.red}
                  iconBackground={C.redSoft}
                />
              </View>

              {/* Weekly spending chart */}

              <View style={styles.chartCard}>
                <View style={styles.chartHeader}>
                  <View>
                    <Text style={styles.chartTitle}>Weekly spending</Text>
                    <Text style={styles.chartSubtitle}>Your last 7 days</Text>
                  </View>

                  <View style={styles.chartTotalContainer}>
                    <Text style={styles.chartTotalLabel}>Total spent</Text>
                    <Text
                      style={styles.chartTotal}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                    >
                      {formatMoney(weekTotal, currency, 0)}
                    </Text>
                  </View>
                </View>

                <View style={styles.chart}>
                  {week.map((day, index) => {
                    const barHeight =
                      day.out > 0 ? Math.max(6, (day.out / weekMax) * 74) : 4;

                    return (
                      <View
                        key={`${day.label}-${index}`}
                        style={styles.chartColumn}
                      >
                        <View style={styles.barTrack}>
                          <View
                            style={[
                              styles.chartBar,
                              {
                                height: barHeight,
                                backgroundColor: day.isToday
                                  ? C.blue
                                  : C.blueMuted,
                              },
                            ]}
                          />
                        </View>

                        <Text
                          style={[
                            styles.chartDay,
                            day.isToday && styles.chartDayToday,
                          ]}
                        >
                          {day.label}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>

              {/* Pending transactions */}

              {pendingCount > 0 && (
                <TouchableOpacity
                  onPress={openPayments}
                  activeOpacity={0.75}
                  style={styles.pendingCard}
                >
                  <View style={styles.pendingIcon}>
                    <Feather name="clock" size={19} color={C.amber} />
                  </View>

                  <View style={styles.pendingContent}>
                    <Text style={styles.pendingTitle}>
                      Transactions in progress
                    </Text>
                    <Text style={styles.pendingDescription}>
                      {pendingCount} transaction
                      {pendingCount !== 1 ? "s" : ""} awaiting completion
                    </Text>
                  </View>

                  <Feather name="chevron-right" size={20} color={C.faint} />
                </TouchableOpacity>
              )}
            </>
          )}
        </View>

        {/* ── Recent transactions ───────────────────────────────── */}

        <View style={styles.section}>
          <SectionTitle
            title="Recent transactions"
            action="See all"
            onAction={openPayments}
          />

          {loading ? (
            <View style={styles.transactionsLoading}>
              <ActivityIndicator size="small" color={C.blue} />
            </View>
          ) : transactions.length === 0 ? (
            <View style={styles.emptyTransactions}>
              <View style={styles.emptyTransactionIcon}>
                <Feather name="inbox" size={24} color={C.faint} />
              </View>

              <Text style={styles.emptyTransactionTitle}>
                No transactions yet
              </Text>

              <Text style={styles.emptyTransactionDescription}>
                Your transaction history will appear here when you start using
                your wallet.
              </Text>

              <TouchableOpacity
                onPress={() => router.push("/(components)/topupscreen")}
                activeOpacity={0.75}
                style={styles.emptyActionButton}
              >
                <Feather name="plus" size={16} color={C.white} />
                <Text style={styles.emptyActionText}>Top up wallet</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.transactionsCard}>
              {transactions.slice(0, RECENT_LIMIT).map((tx, index, list) => {
                const incoming = isIncomingTx(tx, walletId);

                const statusKey = tx.status?.toLowerCase() ?? "completed";

                const status = STATUS_TEXT[statusKey];

                const amount = Math.abs(Number(tx.amount) || 0);

                const amountText = formatBalance(
                  amount,
                  tx.currency ?? currency,
                );

                return (
                  <View
                    key={tx.id ?? tx._id ?? index}
                    style={[
                      styles.transactionRow,
                      index !== list.length - 1 && styles.transactionBorder,
                    ]}
                  >
                    <View
                      style={[
                        styles.transactionIcon,
                        {
                          backgroundColor: incoming ? C.greenSoft : C.blueSoft,
                        },
                      ]}
                    >
                      <Feather
                        name={getTxIcon(tx, walletId) as any}
                        size={18}
                        color={incoming ? C.green : C.blue}
                      />
                    </View>

                    <View style={styles.transactionInfo}>
                      <Text style={styles.transactionTitle} numberOfLines={1}>
                        {getTxLabel(tx)}
                      </Text>

                      <Text style={styles.transactionDate} numberOfLines={1}>
                        {formatTxDate(tx.created_at)}
                      </Text>

                      {status && (
                        <View
                          style={[
                            styles.transactionStatus,
                            {
                              backgroundColor: status.background,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.transactionStatusText,
                              { color: status.color },
                            ]}
                          >
                            {status.label}
                          </Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.transactionAmount}>
                      <Text
                        style={[
                          styles.amountText,
                          {
                            color: incoming ? C.green : C.ink,
                          },
                        ]}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                      >
                        {incoming ? "+" : "−"}
                        {amountText}
                      </Text>

                      <Text style={styles.amountType}>
                        {incoming ? "Received" : "Sent"}
                      </Text>
                    </View>
                  </View>
                );
              })}

              {transactions.length > RECENT_LIMIT && (
                <TouchableOpacity
                  onPress={openPayments}
                  activeOpacity={0.75}
                  style={styles.viewAllButton}
                >
                  <Text style={styles.viewAllText}>
                    View all {transactions.length} transactions
                  </Text>
                  <Feather name="arrow-right" size={16} color={C.blue} />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Your wallet, at a glance.</Text>
        </View>
      </ScrollView>

      {/* ── Transaction PIN prompt ──────────────────────────────── */}

      {pinModalVisible && (
        <View style={styles.modalOverlay}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setPinModalVisible(false)}
            accessibilityRole="button"
            accessibilityLabel="Dismiss PIN reminder"
          />

          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />

            <View style={styles.modalIcon}>
              <Feather name="shield" size={25} color={C.blue} />
            </View>

            <Text style={styles.modalTitle}>Secure your wallet</Text>

            <Text style={styles.modalDescription}>
              Set a 4-digit transaction PIN to help protect your transfers and
              withdrawals.
            </Text>

            <TouchableOpacity
              onPress={() => {
                setPinModalVisible(false);
                router.push("/(components)/settransactionpin");
              }}
              activeOpacity={0.8}
              style={styles.modalPrimaryButton}
            >
              <Text style={styles.modalPrimaryText}>Set transaction PIN</Text>
              <Feather name="arrow-right" size={18} color={C.white} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setPinModalVisible(false)}
              activeOpacity={0.7}
              style={styles.modalSecondaryButton}
            >
              <Text style={styles.modalSecondaryText}>Not now</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: C.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 44,
  },

  // Header
  header: {
    backgroundColor: C.navy,
    paddingTop:
      Platform.OS === "ios" ? 58 : (StatusBar.currentHeight ?? 24) + 18,
    paddingHorizontal: 22,
    paddingBottom: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  profileGroup: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.blue,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  avatarText: {
    color: C.white,
    fontSize: 17,
    fontWeight: "700",
  },
  greetingGroup: {
    flex: 1,
  },
  greeting: {
    color: C.whiteSoft,
    fontSize: 12,
    marginBottom: 4,
  },
  userName: {
    color: C.white,
    fontSize: 16,
    fontWeight: "700",
  },
  notificationButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: C.whiteChip,
    alignItems: "center",
    justifyContent: "center",
  },
  balanceHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  balanceLabel: {
    color: C.whiteSoft,
    fontSize: 13,
    fontWeight: "500",
  },
  currencyLabel: {
    color: C.whiteSoft,
    fontSize: 11,
    marginTop: 4,
  },
  eyeButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: C.whiteChip,
    alignItems: "center",
    justifyContent: "center",
  },
  balanceValue: {
    color: C.white,
    fontSize: 34,
    fontWeight: "800",
    letterSpacing: -0.8,
    marginTop: 8,
  },
  headerDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.15)",
    marginTop: 23,
    marginBottom: 17,
  },
  accountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  accountInfo: {
    flex: 1,
    marginRight: 10,
  },
  accountLabel: {
    color: C.whiteSoft,
    fontSize: 11,
    marginBottom: 6,
  },
  accountNumberRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 10,
  },
  accountNumber: {
    color: C.white,
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.5,
    fontVariant: ["tabular-nums"],
  },
  copyButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 4,
    paddingHorizontal: 7,
    borderRadius: 8,
    backgroundColor: C.whiteChip,
  },
  copyText: {
    color: C.white,
    fontSize: 11,
    fontWeight: "600",
  },
  accountStatus: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 20,
    gap: 6,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  accountStatusText: {
    fontSize: 11,
    fontWeight: "700",
  },

  // Section headings
  quickActionsSection: {
    marginTop: 27,
    paddingHorizontal: 22,
  },
  section: {
    marginTop: 29,
    paddingHorizontal: 22,
  },
  sectionHeading: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  sectionTitle: {
    color: C.ink,
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: -0.25,
  },
  linkText: {
    color: C.blue,
    fontSize: 13,
    fontWeight: "700",
  },

  // Quick actions
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  actionItem: {
    alignItems: "center",
    width: "19%",
  },
  actionIcon: {
    width: 49,
    height: 49,
    borderRadius: 16,
    backgroundColor: C.blueSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  actionLabel: {
    color: C.text,
    fontSize: 10.5,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 14,
  },

  // Statistics
  statsRow: {
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: 0,
    backgroundColor: C.surface,
    borderRadius: 18,
    padding: 15,
    borderWidth: 1,
    borderColor: C.line,
  },
  statTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statIcon: {
    width: 31,
    height: 31,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  statLabel: {
    flex: 1,
    color: C.muted,
    fontSize: 11.5,
    fontWeight: "600",
  },
  statValue: {
    color: C.ink,
    fontSize: 19,
    fontWeight: "800",
    letterSpacing: -0.6,
    marginTop: 15,
  },
  statNote: {
    color: C.muted,
    fontSize: 10.5,
    marginTop: 7,
    minHeight: 13,
  },

  // Chart
  chartCard: {
    marginTop: 13,
    padding: 17,
    backgroundColor: C.surface,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: C.line,
  },
  chartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  chartTitle: {
    color: C.ink,
    fontSize: 14,
    fontWeight: "700",
  },
  chartSubtitle: {
    color: C.muted,
    fontSize: 11.5,
    marginTop: 5,
  },
  chartTotalContainer: {
    alignItems: "flex-end",
    flexShrink: 1,
  },
  chartTotalLabel: {
    color: C.muted,
    fontSize: 10.5,
  },
  chartTotal: {
    color: C.ink,
    fontSize: 16,
    fontWeight: "800",
    marginTop: 4,
  },
  chart: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    height: 116,
    marginTop: 17,
  },
  chartColumn: {
    flex: 1,
    alignItems: "center",
    height: "100%",
  },
  barTrack: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  chartBar: {
    width: 14,
    maxWidth: "65%",
    borderRadius: 5,
  },
  chartDay: {
    color: C.muted,
    fontSize: 10,
    marginTop: 9,
  },
  chartDayToday: {
    color: C.blue,
    fontWeight: "800",
  },

  // Pending
  pendingCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.surface,
    borderRadius: 17,
    padding: 14,
    marginTop: 13,
    borderWidth: 1,
    borderColor: C.line,
    gap: 11,
  },
  pendingIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: C.amberSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  pendingContent: {
    flex: 1,
  },
  pendingTitle: {
    color: C.ink,
    fontSize: 13,
    fontWeight: "700",
  },
  pendingDescription: {
    color: C.muted,
    fontSize: 11.5,
    marginTop: 4,
  },

  // Transactions
  transactionsCard: {
    backgroundColor: C.surface,
    borderRadius: 19,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: C.line,
  },
  transactionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    gap: 11,
  },
  transactionBorder: {
    borderBottomWidth: 1,
    borderBottomColor: C.line,
  },
  transactionIcon: {
    width: 43,
    height: 43,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  transactionInfo: {
    flex: 1,
    minWidth: 0,
  },
  transactionTitle: {
    color: C.ink,
    fontSize: 13,
    fontWeight: "700",
  },
  transactionDate: {
    color: C.muted,
    fontSize: 10.5,
    marginTop: 5,
  },
  transactionStatus: {
    alignSelf: "flex-start",
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
    marginTop: 6,
  },
  transactionStatusText: {
    fontSize: 10,
    fontWeight: "700",
  },
  transactionAmount: {
    alignItems: "flex-end",
    flexShrink: 0,
    maxWidth: "43%",
  },
  amountText: {
    fontSize: 12.5,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  amountType: {
    color: C.muted,
    fontSize: 10,
    marginTop: 5,
  },
  viewAllButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: C.line,
  },
  viewAllText: {
    color: C.blue,
    fontSize: 12.5,
    fontWeight: "700",
  },

  // Empty and loading states
  loadingCard: {
    minHeight: 130,
    backgroundColor: C.surface,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: C.line,
    gap: 10,
  },
  loadingText: {
    color: C.muted,
    fontSize: 12,
  },
  emptyOverview: {
    backgroundColor: C.surface,
    borderRadius: 18,
    padding: 22,
    alignItems: "center",
    borderWidth: 1,
    borderColor: C.line,
  },
  emptyOverviewIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: C.blueSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyOverviewTitle: {
    color: C.ink,
    fontSize: 14,
    fontWeight: "700",
    marginTop: 13,
  },
  emptyOverviewDescription: {
    color: C.muted,
    fontSize: 12,
    lineHeight: 19,
    textAlign: "center",
    marginTop: 7,
  },
  transactionsLoading: {
    paddingVertical: 35,
    alignItems: "center",
  },
  emptyTransactions: {
    backgroundColor: C.surface,
    borderRadius: 19,
    paddingHorizontal: 22,
    paddingVertical: 28,
    alignItems: "center",
    borderWidth: 1,
    borderColor: C.line,
  },
  emptyTransactionIcon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: C.tile,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTransactionTitle: {
    color: C.ink,
    fontSize: 14,
    fontWeight: "700",
    marginTop: 14,
  },
  emptyTransactionDescription: {
    color: C.muted,
    fontSize: 12,
    lineHeight: 19,
    textAlign: "center",
    marginTop: 6,
  },
  emptyActionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    backgroundColor: C.blue,
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 16,
    marginTop: 18,
  },
  emptyActionText: {
    color: C.white,
    fontSize: 12,
    fontWeight: "700",
  },

  // Error
  errorCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: C.redSoft,
    borderRadius: 15,
    marginHorizontal: 22,
    marginTop: 20,
    padding: 13,
  },
  errorIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.surface,
  },
  errorContent: {
    flex: 1,
  },
  errorTitle: {
    color: C.ink,
    fontSize: 12,
    fontWeight: "700",
  },
  errorDescription: {
    color: C.text,
    fontSize: 10.5,
    marginTop: 4,
  },
  retryButton: {
    paddingHorizontal: 9,
    paddingVertical: 7,
  },
  retryText: {
    color: C.red,
    fontSize: 12,
    fontWeight: "800",
  },

  // Footer
  footer: {
    alignItems: "center",
    marginTop: 30,
  },
  footerText: {
    color: C.faint,
    fontSize: 11,
  },

  // PIN modal
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15,23,42,0.55)",
  },
  modalSheet: {
    backgroundColor: C.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 25,
    paddingTop: 13,
    paddingBottom: Platform.OS === "ios" ? 36 : 26,
  },
  modalHandle: {
    width: 42,
    height: 4,
    borderRadius: 4,
    backgroundColor: C.line,
    alignSelf: "center",
    marginBottom: 25,
  },
  modalIcon: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: C.blueSoft,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 17,
  },
  modalTitle: {
    color: C.ink,
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
  },
  modalDescription: {
    color: C.muted,
    fontSize: 13,
    lineHeight: 21,
    textAlign: "center",
    marginTop: 10,
    marginBottom: 24,
  },
  modalPrimaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: C.blue,
    paddingVertical: 16,
    borderRadius: 15,
  },
  modalPrimaryText: {
    color: C.white,
    fontSize: 14,
    fontWeight: "700",
  },
  modalSecondaryButton: {
    alignItems: "center",
    paddingVertical: 15,
    marginTop: 4,
  },
  modalSecondaryText: {
    color: C.muted,
    fontSize: 13,
    fontWeight: "600",
  },
});
