import { invoiceService } from "@/api/invoiceService";
import { useAuth } from "@/hooks/useAuth";
import { Escrow } from "@/types/escrow";
import { Invoice } from "@/types/invoice";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

// ─── constants ──────────────────────────────────────────────────────────────

const PRIMARY = "#0057b8";
const PIN_LENGTH = 4;
const UNPAID_STATUSES = ["unpaid", "pending"];

const STATUS_GROUPS = {
  success: ["paid", "active", "funded", "accepted", "success"],
  error: ["failed", "cancelled", "rejected"],
};

// ─── helpers ────────────────────────────────────────────────────────────────

const statusStyles = (status?: string) => {
  const s = status?.toLowerCase() ?? "";
  const label = status?.toUpperCase();

  if (STATUS_GROUPS.success.includes(s)) {
    return { bg: "#DBEAFE", color: "#1D4ED8", label };
  }
  if (STATUS_GROUPS.error.includes(s)) {
    return { bg: "#FEF2F2", color: "#EF4444", label };
  }
  return { bg: "#FFFBEB", color: "#F59E0B", label };
};

const formatMoney = (amount?: number, currency = "NGN") =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(
    amount ?? 0,
  );

const formatDate = (
  date?: string | Date | null,
  options: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "short",
    year: "numeric",
  },
) => (date ? new Date(date).toLocaleDateString("en-GB", options) : "—");

const formatTime = (time?: string | null) =>
  time
    ? new Date(`1970-01-01T${time}`).toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      })
    : "—";

const fullName = (person?: { firstName?: string; surname?: string }) =>
  `${person?.firstName ?? ""} ${person?.surname ?? ""}`.trim() || "—";

const joinParts = (...parts: (string | undefined | null)[]) =>
  parts.filter(Boolean).join(", ") || "—";

// ─── sub-components ─────────────────────────────────────────────────────────

function StatusBadge({ status }: { status?: string }) {
  const { bg, color, label } = statusStyles(status);
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <View style={[styles.badgeDot, { backgroundColor: color }]} />
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

function Divider() {
  return (
    <View style={styles.dividerRow}>
      {Array.from({ length: 28 }).map((_, i) => (
        <View key={i} style={styles.dividerDash} />
      ))}
    </View>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value ?? "—"}</Text>
    </View>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionAccent} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

type PinModalProps = {
  visible: boolean;
  amount: string;
  pin: string;
  error: string;
  paying: boolean;
  onChangePin: (value: string) => void;
  onConfirm: () => void;
  onClose: () => void;
};

function PinModal({
  visible,
  amount,
  pin,
  error,
  paying,
  onChangePin,
  onConfirm,
  onClose,
}: PinModalProps) {
  const handleClose = () => {
    if (!paying) onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.pinModalOverlay}
      >
        <View style={styles.pinModalCard}>
          <View style={styles.pinIcon}>
            <Ionicons name="shield-checkmark" size={28} color={PRIMARY} />
          </View>

          <Text style={styles.pinTitle}>Confirm Your Payment</Text>
          <Text style={styles.pinDescription}>
            Enter your 4-digit transaction PIN to authorize this wallet payment.
          </Text>

          <View style={styles.pinAmountBox}>
            <Text style={styles.pinAmountLabel}>AMOUNT TO PAY</Text>
            <Text style={styles.pinAmount}>{amount}</Text>
            <Text style={styles.pinEscrowNote}>
              <Ionicons name="lock-closed" size={12} color="#16834A" /> Funds
              will be secured in escrow.
            </Text>
          </View>

          <Text style={styles.pinInputLabel}>Transaction PIN</Text>
          <TextInput
            value={pin}
            onChangeText={onChangePin}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={PIN_LENGTH}
            placeholder="••••"
            placeholderTextColor="#A0AEC0"
            editable={!paying}
            style={[styles.pinInput, !!error && styles.pinInputError]}
          />
          {!!error && <Text style={styles.pinErrorText}>{error}</Text>}

          <TouchableOpacity
            style={[styles.confirmPayBtn, paying && { opacity: 0.7 }]}
            onPress={onConfirm}
            disabled={paying || pin.length !== PIN_LENGTH}
            activeOpacity={0.85}
          >
            {paying ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="lock-closed" size={18} color="#fff" />
                <Text style={styles.confirmPayText}>Confirm & Pay</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelPayBtn}
            disabled={paying}
            onPress={onClose}
          >
            <Text style={styles.cancelPayText}>Cancel</Text>
          </TouchableOpacity>

          <View style={styles.pinSecurityNote}>
            <Ionicons
              name="shield-checkmark-outline"
              size={15}
              color="#16834A"
            />
            <Text style={styles.pinSecurityText}>
              Your transaction PIN is securely verified.
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── main screen ────────────────────────────────────────────────────────────

export default function InvoiceScreen() {
  const { invoiceId } = useLocalSearchParams<{ invoiceId: string }>();
  const { user } = useAuth();

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [escrow, setEscrow] = useState<Escrow | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showPinModal, setShowPinModal] = useState(false);
  const [transactionPin, setTransactionPin] = useState("");
  const [pinError, setPinError] = useState("");

  // The RFQ payload is nested under `rfq` (`rfqId` is just the numeric id).
  // TODO: add `rfq` to the Invoice type so this cast can go.
  const rfq = (invoice as any)?.rfq;

  // `user_data` / `destinatary_user` are full user objects, so the plain id
  // fields must be checked first or String(object) becomes "[object Object]".
  const currentUserId = String(user?.id ?? "");
  const sellerId = String(
    rfq?.user_id ?? rfq?.user ?? rfq?.user_data?.id ?? "",
  );
  const buyerId = String(
    rfq?.destinatary_user_id ?? rfq?.destinatary_user?.id ?? "",
  );
  const isSeller = currentUserId === sellerId;
  const isBuyer = currentUserId === buyerId;

  const paymentStatus = invoice?.paymentStatus ?? invoice?.status;
  const awaitingPayment = UNPAID_STATUSES.includes(paymentStatus ?? "");

  const totalDue = rfq?.total ?? invoice?.amount;
  const totalCurrency = rfq?.currency ?? invoice?.currency;

  const escrowId =
    escrow?.id ??
    (typeof invoice?.escrowId === "object"
      ? invoice.escrowId?.id
      : invoice?.escrowId);

  const loadInvoice = useCallback(async () => {
    if (!invoiceId) return;
    setError(null);
    try {
      setInvoice(await invoiceService.getInvoice(invoiceId));
    } catch (e: any) {
      setError(e?.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  }, [invoiceId]);

  useEffect(() => {
    loadInvoice();
  }, [loadInvoice]);

  const closePinModal = () => {
    setShowPinModal(false);
    setTransactionPin("");
    setPinError("");
  };

  const openPinModal = () => {
    setTransactionPin("");
    setPinError("");
    setShowPinModal(true);
  };

  const handlePinChange = (value: string) => {
    setTransactionPin(value.replace(/\D/g, "").slice(0, PIN_LENGTH));
    setPinError("");
  };

  const confirmPayment = async () => {
    if (!invoiceId) return;

    if (!new RegExp(`^\\d{${PIN_LENGTH}}$`).test(transactionPin)) {
      setPinError(`Enter your ${PIN_LENGTH}-digit transaction PIN.`);
      return;
    }

    setPaying(true);
    setPinError("");

    try {
      const payment = await invoiceService.initiatePayment(
        invoiceId,
        transactionPin,
      );

      if (!payment?.success) {
        throw new Error(payment?.message || "Unable to complete payment.");
      }

      if (payment.data?.invoice) setInvoice(payment.data.invoice);
      if (payment.data?.escrow) setEscrow(payment.data.escrow);

      closePinModal();

      Toast.show({
        type: "success",
        text1: "Payment Successful",
        text2: "Your wallet has been debited and funds secured in escrow.",
      });

      await loadInvoice();
    } catch (e: any) {
      handlePaymentError(e);
    } finally {
      setPaying(false);
    }
  };

  const handlePaymentError = (e: any) => {
    const response = e?.response?.data;

    switch (response?.code) {
      case "INCORRECT_TRANSACTION_PIN":
        setPinError("Incorrect PIN. Please try again.");
        setTransactionPin("");
        return;

      case "INVALID_PIN_FORMAT":
        setPinError(`Please enter a valid ${PIN_LENGTH}-digit PIN.`);
        return;

      case "TRANSACTION_PIN_NOT_SET":
        closePinModal();
        Toast.show({
          type: "error",
          text1: "Transaction PIN Required",
          text2: "Please set up your transaction PIN before paying.",
        });
        // TODO: router.push to the set-transaction-PIN route.
        return;

      case "INSUFFICIENT_BALANCE": {
        closePinModal();
        const shortfall = response?.data?.shortfall;
        const currency = response?.data?.currency || invoice?.currency || "NGN";
        Toast.show({
          type: "error",
          text1: "Insufficient Wallet Balance",
          text2:
            shortfall != null
              ? `You need ${formatMoney(shortfall, currency)} more. Please fund your wallet.`
              : response?.message || "Please fund your wallet.",
          visibilityTime: 5000,
        });
        return;
      }
    }

    const message = response?.message || e?.message;
    setPinError(message || "Payment failed. Please try again.");
    Toast.show({
      type: "error",
      text1: "Payment Failed",
      text2: message || "Please try again.",
    });
  };

  const goToEscrow = () => {
    if (!escrowId) {
      Toast.show({ type: "error", text1: "Escrow ID not found" });
      return;
    }
    router.push(`/(components)/escrow/${String(escrowId)}`);
  };

  const goBackToRfq = () => {
    if (rfq?.id) {
      router.push(`/(components)/rfq/${rfq.id}`);
    } else {
      router.back();
    }
  };

  // ── render helpers ──

  const renderInvoiceCard = (inv: Invoice) => (
    <View style={styles.invoiceCard}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.cardHeaderLabel}>INVOICE</Text>
          <Text style={styles.cardHeaderId}>#{rfq?.uprn ?? inv.id}</Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={styles.cardHeaderLabel}>DATE ISSUED</Text>
          <Text style={styles.cardHeaderDate}>{formatDate(inv.createdAt)}</Text>
        </View>
      </View>

      <View style={styles.partiesRow}>
        <View style={styles.party}>
          <Text style={styles.partyRole}>FROM</Text>
          <Text style={styles.partyName}>{fullName(rfq?.user_data)}</Text>
          <Text style={styles.partyDetail}>
            {rfq?.user_data?.phoneNumber ?? "—"}
          </Text>
        </View>

        <View style={styles.partyArrow}>
          <Ionicons name="arrow-forward" size={18} color={PRIMARY} />
        </View>

        <View style={[styles.party, { alignItems: "flex-end" }]}>
          <Text style={[styles.partyRole, { textAlign: "right" }]}>
            BILL TO
          </Text>
          <Text style={styles.partyName}>
            {fullName(rfq?.destinatary_user)}
          </Text>
          <Text style={styles.partyDetail}>
            {rfq?.destinatary_user?.phoneNumber ?? "—"}
          </Text>
        </View>
      </View>

      <Divider />

      <View style={styles.lineHeader}>
        <Text style={[styles.lineCol, { flex: 3 }]}>DESCRIPTION</Text>
        <Text style={[styles.lineCol, { textAlign: "center" }]}>QTY</Text>
        <Text style={[styles.lineCol, { textAlign: "right", flex: 2 }]}>
          AMOUNT
        </Text>
      </View>

      <View style={styles.lineItem}>
        <Text style={[styles.lineItemText, { flex: 3 }]}>
          {rfq?.product_description ?? inv.description}
        </Text>
        <Text style={[styles.lineItemText, { textAlign: "center" }]}>
          {rfq?.product_quantity ?? inv.metadata?.productQuantity}
        </Text>
        <Text
          style={[
            styles.lineItemText,
            { textAlign: "right", flex: 2, fontWeight: "700" },
          ]}
        >
          {formatMoney(rfq?.subtotal ?? inv.amount, inv.currency)}
        </Text>
      </View>

      <Divider />

      <View style={styles.totalsBlock}>
        <InfoRow
          label="Subtotal"
          value={formatMoney(rfq?.subtotal ?? inv.amount, inv.currency)}
        />
        <InfoRow
          label="Delivery"
          value={
            rfq?.delivery_charge
              ? formatMoney(rfq.delivery_charge, inv.currency)
              : "Free"
          }
        />
        <InfoRow
          label="Transaction Charges"
          value={formatMoney(rfq?.transaction_charges, inv.currency)}
        />
        {rfq?.exchange_rate && rfq.exchange_rate !== 1 && (
          <InfoRow label="Exchange Rate" value={`×${rfq.exchange_rate}`} />
        )}
      </View>

      <View style={styles.totalBand}>
        <Text style={styles.totalLabel}>TOTAL DUE</Text>
        <Text style={styles.totalAmount}>
          {formatMoney(totalDue, inv.currency)}
        </Text>
      </View>
    </View>
  );

  const renderDeliveryCard = () => {
    const address = rfq?.delivery_address;
    if (!address) return null;

    return (
      <View style={styles.card}>
        <SectionHeader title="Delivery Details" />
        <View style={{ gap: 6, marginTop: 12 }}>
          <InfoRow label="Type" value={rfq.delivery_type} />
          <InfoRow label="Trade" value={rfq.trade_type} />
          <InfoRow
            label="Arrival Date"
            value={formatDate(rfq.arrival_date, {
              weekday: "short",
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          />
          <InfoRow label="Arrival Time" value={formatTime(rfq.arrival_time)} />
          <InfoRow label="Street" value={address.street} />
          <InfoRow
            label="City"
            value={joinParts(address.city, address.state)}
          />
          <InfoRow label="Country" value={address.country} />
          <InfoRow label="Post Code" value={address.postal_code} />
          <InfoRow label="Phone" value={address.phoneNumber} />

          {rfq.delivery_code && (
            <View style={styles.deliveryCodeBox}>
              <Ionicons name="lock-closed" size={14} color={PRIMARY} />
              <Text style={styles.deliveryCodeText}>
                Delivery Code: {rfq.delivery_code}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderEscrowCard = (inv: Invoice) => {
    if (!escrow && !inv.escrowId) return null;

    return (
      <View style={[styles.card, styles.escrowCard]}>
        <View style={styles.escrowHeader}>
          <Ionicons name="shield-checkmark" size={22} color={PRIMARY} />
          <Text style={styles.escrowTitle}>Escrow Active</Text>
        </View>
        <Text style={styles.escrowSub}>
          Funds are held securely until delivery is confirmed.
        </Text>

        <View style={{ gap: 6, marginTop: 14 }}>
          <InfoRow label="Escrow ID" value={escrowId ?? "—"} />
          <InfoRow
            label="Status"
            value={(
              escrow?.status ??
              inv.escrowId?.status ??
              "active"
            ).toUpperCase()}
          />
          <InfoRow
            label="Amount"
            value={formatMoney(
              escrow?.amount ??
                inv.escrowId?.amount ??
                rfq?.amount ??
                inv.amount,
              escrow?.currency ?? rfq?.currency ?? inv.currency,
            )}
          />
        </View>

        <TouchableOpacity
          onPress={goToEscrow}
          activeOpacity={0.85}
          style={styles.escrowBtn}
        >
          <Text style={styles.escrowBtnText}>Go to Escrow</Text>
          <Ionicons name="arrow-forward" size={16} color={PRIMARY} />
        </TouchableOpacity>
      </View>
    );
  };

  const renderPaymentActions = () => {
    if (!awaitingPayment) return null;

    return (
      <>
        {isBuyer && (
          <TouchableOpacity
            onPress={openPinModal}
            disabled={paying}
            activeOpacity={0.85}
            style={styles.payBtn}
          >
            {paying ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <View style={styles.payBtnInner}>
                <Ionicons
                  name="card-outline"
                  size={20}
                  color="#fff"
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.payBtnText}>
                  Pay {formatMoney(totalDue, totalCurrency)}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        )}

        {isSeller && (
          <>
            <View style={styles.waitingPaymentCard}>
              <View style={styles.waitingPaymentIcon}>
                <Ionicons name="time-outline" size={22} color="#F59E0B" />
              </View>
              <View style={styles.waitingPaymentContent}>
                <Text style={styles.waitingPaymentTitle}>
                  Waiting for Buyer Payment
                </Text>
                <Text style={styles.waitingPaymentText}>
                  The buyer has not paid this invoice yet. Once payment is
                  completed, the funds will be secured in escrow and you can
                  proceed with the order.
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={goBackToRfq}
              activeOpacity={0.85}
              style={styles.backToRfqBtn}
            >
              <Ionicons name="arrow-back-outline" size={18} color={PRIMARY} />
              <Text style={styles.backToRfqText}>Back to RFQ</Text>
            </TouchableOpacity>
          </>
        )}
      </>
    );
  };

  const renderBody = () => {
    if (loading) {
      return (
        <ActivityIndicator
          color={PRIMARY}
          style={{ marginTop: 60 }}
          size="large"
        />
      );
    }

    if (error) {
      return (
        <View style={styles.errorCard}>
          <Ionicons name="alert-circle" size={32} color="#cf1322" />
          <Text style={styles.errorTitle}>Unable to load invoice</Text>
          <Text style={styles.errorBody}>{error}</Text>
          <TouchableOpacity onPress={loadInvoice} style={styles.retryBtn}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (!invoice) return null;

    return (
      <>
        {renderInvoiceCard(invoice)}
        {renderDeliveryCard()}
        {renderEscrowCard(invoice)}
        {renderPaymentActions()}

        <Text style={styles.footer}>
          Generated on {new Date(invoice.createdAt).toLocaleString("en-GB")} ·
          Ref: {invoice.id}
        </Text>
      </>
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="dark-content"
      />

      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={PRIMARY} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.topTitle}>Invoice</Text>
          <Text style={styles.topSub}>
            Quote #{rfq?.quote_number ?? invoice?.metadata?.quoteNumber ?? "—"}
          </Text>
        </View>
        {invoice && <StatusBadge status={paymentStatus} />}
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={loadInvoice}
            tintColor={PRIMARY}
          />
        }
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {renderBody()}
      </ScrollView>

      <PinModal
        visible={showPinModal}
        amount={formatMoney(totalDue, totalCurrency || "NGN")}
        pin={transactionPin}
        error={pinError}
        paying={paying}
        onChangePin={handlePinChange}
        onConfirm={confirmPayment}
        onClose={closePinModal}
      />
    </View>
  );
}

// ─── styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f0f4fa" },
  scroll: { padding: 16, paddingBottom: 48, gap: 14 },

  // top bar
  topBar: {
    backgroundColor: "#fff",
    paddingTop: 52,
    paddingBottom: 14,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#e2eaf5",
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#e6f0ff",
    alignItems: "center",
    justifyContent: "center",
  },
  topTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0b1e3d",
    letterSpacing: 0.2,
  },
  topSub: { fontSize: 11, color: "#7a8fad", marginTop: 1 },

  // badge
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  badgeDot: { width: 6, height: 6, borderRadius: 3, marginRight: 5 },
  badgeText: { fontSize: 11, fontWeight: "800", letterSpacing: 0.4 },

  // divider
  dividerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 18,
  },
  dividerDash: {
    width: 6,
    height: 1.5,
    backgroundColor: "#d0dded",
    borderRadius: 2,
  },

  // invoice card
  invoiceCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    overflow: "hidden",
    shadowColor: PRIMARY,
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  cardHeader: {
    backgroundColor: PRIMARY,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: 20,
    paddingBottom: 22,
  },
  cardHeaderLabel: {
    fontSize: 10,
    color: "rgba(255,255,255,0.65)",
    letterSpacing: 1.5,
    fontWeight: "700",
  },
  cardHeaderId: {
    fontSize: 17,
    color: "#fff",
    fontWeight: "900",
    marginTop: 3,
    letterSpacing: 0.5,
  },
  cardHeaderDate: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "700",
    marginTop: 3,
  },

  // parties
  partiesRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    paddingBottom: 4,
    gap: 8,
  },
  party: { flex: 1 },
  partyArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#e6f0ff",
    alignItems: "center",
    justifyContent: "center",
  },
  partyRole: {
    fontSize: 9,
    color: "#7a8fad",
    letterSpacing: 1.5,
    fontWeight: "700",
    marginBottom: 4,
  },
  partyName: { fontSize: 14, fontWeight: "800", color: "#0b1e3d" },
  partyDetail: { fontSize: 11, color: "#7a8fad", marginTop: 2 },

  // line items
  lineHeader: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  lineCol: {
    fontSize: 10,
    color: "#7a8fad",
    letterSpacing: 1.2,
    fontWeight: "700",
    flex: 1,
  },
  lineItem: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingBottom: 4,
    alignItems: "flex-start",
  },
  lineItemText: { fontSize: 13, color: "#1a2d4a", flex: 1, lineHeight: 19 },

  // totals
  totalsBlock: { paddingHorizontal: 20, gap: 8 },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  infoLabel: { fontSize: 12, color: "#7a8fad", fontWeight: "500" },
  infoValue: { fontSize: 12, color: "#1a2d4a", fontWeight: "600" },
  totalBand: {
    backgroundColor: PRIMARY,
    marginTop: 18,
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.75)",
    letterSpacing: 1.5,
    fontWeight: "700",
  },
  totalAmount: {
    fontSize: 24,
    color: "#fff",
    fontWeight: "900",
    letterSpacing: 0.3,
  },

  // generic card + section header
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    shadowColor: PRIMARY,
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  sectionHeader: { flexDirection: "row", alignItems: "center" },
  sectionAccent: {
    width: 3,
    height: 16,
    borderRadius: 2,
    backgroundColor: PRIMARY,
    marginRight: 9,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0b1e3d",
    letterSpacing: 0.3,
  },

  // delivery code
  deliveryCodeBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e6f0ff",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 6,
    gap: 7,
  },
  deliveryCodeText: {
    fontSize: 13,
    color: PRIMARY,
    fontWeight: "800",
    letterSpacing: 0.5,
  },

  // escrow
  escrowCard: { borderWidth: 1.5, borderColor: "#cde3ff" },
  escrowHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  escrowTitle: { fontSize: 15, fontWeight: "900", color: PRIMARY },
  escrowSub: { fontSize: 12, color: "#7a8fad", lineHeight: 18 },
  escrowBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 10,
    borderRadius: 10,
    backgroundColor: "rgba(0,87,184,0.06)",
  },
  escrowBtnText: { color: PRIMARY, fontWeight: "700", fontSize: 14 },

  // pay button
  payBtn: {
    backgroundColor: PRIMARY,
    borderRadius: 16,
    paddingVertical: 17,
    alignItems: "center",
    shadowColor: PRIMARY,
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  payBtnInner: { flexDirection: "row", alignItems: "center" },
  payBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.3,
  },

  // waiting-for-payment (seller view)
  waitingPaymentCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: "#FDE68A",
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  waitingPaymentIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#FEF3C7",
    alignItems: "center",
    justifyContent: "center",
  },
  waitingPaymentContent: { flex: 1 },
  waitingPaymentTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#92400E",
    marginBottom: 4,
  },
  waitingPaymentText: { fontSize: 12, lineHeight: 18, color: "#A16207" },
  backToRfqBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#E6F0FF",
    borderRadius: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#CDE3FF",
  },
  backToRfqText: { color: PRIMARY, fontSize: 14, fontWeight: "800" },

  // transaction PIN modal
  pinModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(5, 20, 45, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  pinModalCard: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
  },
  pinIcon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#E6F0FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  pinTitle: { fontSize: 20, fontWeight: "900", color: "#0b1e3d" },
  pinDescription: {
    fontSize: 13,
    lineHeight: 20,
    color: "#7a8fad",
    textAlign: "center",
    marginTop: 8,
  },
  pinAmountBox: {
    width: "100%",
    backgroundColor: "#F0F6FF",
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    marginTop: 22,
    marginBottom: 22,
  },
  pinAmountLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#7a8fad",
    letterSpacing: 1.2,
  },
  pinAmount: { fontSize: 25, fontWeight: "900", color: PRIMARY, marginTop: 5 },
  pinEscrowNote: { fontSize: 11, color: "#16834A", marginTop: 7 },
  pinInputLabel: {
    alignSelf: "flex-start",
    fontSize: 12,
    fontWeight: "800",
    color: "#0b1e3d",
    marginBottom: 10,
  },
  pinInput: {
    width: "100%",
    height: 58,
    borderWidth: 1.5,
    borderColor: "#CDE3FF",
    borderRadius: 13,
    backgroundColor: "#FAFCFF",
    textAlign: "center",
    fontSize: 25,
    fontWeight: "800",
    letterSpacing: 15,
    color: "#0b1e3d",
  },
  pinInputError: { borderColor: "#EF4444" },
  pinErrorText: {
    color: "#EF4444",
    fontSize: 12,
    marginTop: 8,
    alignSelf: "flex-start",
  },
  confirmPayBtn: {
    width: "100%",
    backgroundColor: PRIMARY,
    borderRadius: 13,
    paddingVertical: 16,
    marginTop: 20,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 9,
  },
  confirmPayText: { fontSize: 15, fontWeight: "800", color: "#fff" },
  cancelPayBtn: { paddingVertical: 14 },
  cancelPayText: { fontSize: 14, fontWeight: "700", color: "#7a8fad" },
  pinSecurityNote: { flexDirection: "row", alignItems: "center", gap: 6 },
  pinSecurityText: { fontSize: 10, color: "#16834A", fontWeight: "600" },

  // error
  errorCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    gap: 10,
  },
  errorTitle: { fontSize: 15, fontWeight: "800", color: "#0b1e3d" },
  errorBody: { fontSize: 13, color: "#7a8fad", textAlign: "center" },
  retryBtn: {
    backgroundColor: PRIMARY,
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 11,
  },
  retryText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  // footer
  footer: {
    fontSize: 10,
    color: "#aab8cc",
    textAlign: "center",
    marginTop: 4,
    lineHeight: 16,
  },
});
