import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { WebView, WebViewNavigation } from "react-native-webview";
import Toast from "react-native-toast-message";
import { invoiceService } from "@/api/invoiceService";
import { Escrow } from "@/types/escrow";
import { Invoice } from "@/types/invoice";

// ─── helpers ────────────────────────────────────────────────────────────────

const statusStyles = (status?: string) => {
  if (
    status === "paid" ||
    status === "active" ||
    status === "funded" ||
    status === "Accepted"
  ) {
    return { bg: "#e6f4ff", color: "#0057b8", label: status?.toUpperCase() };
  }
  if (status === "failed" || status === "cancelled") {
    return { bg: "#fff1f0", color: "#cf1322", label: status?.toUpperCase() };
  }
  return { bg: "#fffbe6", color: "#d46b08", label: status?.toUpperCase() };
};

const fmt = (n?: number, currency = "GBP") =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(
    n ?? 0,
  );

// ─── sub-components ─────────────────────────────────────────────────────────

function StatusBadge({ status }: { status?: string }) {
  const s = statusStyles(status);
  return (
    <View style={[styles.badge, { backgroundColor: s.bg }]}>
      <View style={[styles.badgeDot, { backgroundColor: s.color }]} />
      <Text style={[styles.badgeText, { color: s.color }]}>{s.label}</Text>
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

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
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

// ─── main screen ────────────────────────────────────────────────────────────

export default function InvoiceScreen() {
  const { invoiceId } = useLocalSearchParams<{ invoiceId: string }>();
  const [invoice, setInvoice] = useState<Invoice | null>(null); // using `any` to cover full response shape
  const [escrow, setEscrow] = useState<Escrow | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showWebView, setShowWebView] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState("");
  const [currentRef, setCurrentRef] = useState<string | null>(null);
  const [webViewLoading, setWebViewLoading] = useState(true);

  const webViewRef = useRef<WebView>(null);

  const loadInvoice = useCallback(async () => {
    if (!invoiceId) return;
    setError(null);
    try {
      const data = await invoiceService.getInvoice(invoiceId);
      setInvoice(data);
    } catch (e: any) {
      setError(e?.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  }, [invoiceId]);

  useEffect(() => {
    loadInvoice();
  }, [loadInvoice]);

  const handlePay = async () => {
    if (!invoiceId) return;

    setPaying(true);

    try {
      const payment = await invoiceService.initiatePayment(invoiceId);

      console.log("Payment Response:", payment);

      setCurrentRef(payment.reference);
      setCheckoutUrl(payment.paymentUrl);
      setShowWebView(true);
    } catch (e: any) {
      Toast.show({
        type: "error",
        text1: "Payment Failed",
        text2: e?.response?.data?.message || e.message,
      });
    } finally {
      setPaying(false);
    }
  };

  const verifyPayment = async (reference: string) => {
    try {
      const result = await invoiceService.verifyPayment(reference);

      console.log("Verification Result:", result);

      if (result.success) {
        setInvoice(result.data.invoice);

        if (result.data.escrow) {
          setEscrow(result.data.escrow);
        }

        Toast.show({
          type: "success",
          text1: "Payment Successful",
          text2: "Escrow funded successfully",
        });

        await loadInvoice();
      }
      // success logic...
    } catch (error: any) {
      console.log("========== VERIFY PAYMENT ERROR ==========");
      console.log("Full Error:", error);
      console.log("Message:", error?.message);
      console.log("Status:", error?.response?.status);
      console.log("Response Data:", error?.response?.data);
      console.log("Backend Message:", error?.response?.data?.message);
      console.log("=========================================");

      Toast.show({
        type: "error",
        text1: "Verification Failed",
        text2: error?.response?.data?.message || error.message,
      });
    }
  };

  const handleNavigationStateChange = async (navState: WebViewNavigation) => {
    const url = navState.url;

    console.log("Current WebView URL:", url);

    // User completed payment and Squad redirected
    if (
      currentRef &&
      (url.includes("success") ||
        url.includes("successful") ||
        url.includes("callback"))
    ) {
      setShowWebView(false);

      await verifyPayment(currentRef);
    }

    if (url.includes("cancel") || url.includes("cancelled")) {
      setShowWebView(false);

      Toast.show({
        type: "info",
        text1: "Payment Cancelled",
      });
    }
  };

  const inv = invoice;

  console.log("this is the invoice data", inv?.amount);

  return (
    <View style={styles.root}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="dark-content"
      />

      {/* ── top bar ── */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color="#0057b8" />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.topTitle}>Invoice</Text>
          <Text style={styles.topSub}>
            Quote #{inv?.rfqId?.quote_number ?? "—"}
          </Text>
        </View>
        {inv && <StatusBadge status={inv.status} />}
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={loadInvoice}
            tintColor="#0057b8"
          />
        }
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <ActivityIndicator
            color="#0057b8"
            style={{ marginTop: 60 }}
            size="large"
          />
        ) : error ? (
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle" size={32} color="#cf1322" />
            <Text style={styles.errorTitle}>Unable to load invoice</Text>
            <Text style={styles.errorBody}>{error}</Text>
            <TouchableOpacity onPress={loadInvoice} style={styles.retryBtn}>
              <Text style={styles.retryText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : inv ? (
          <>
            {/* ── invoice card ── */}
            <View style={styles.invoiceCard}>
              {/* header band */}
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.cardHeaderLabel}>INVOICE</Text>
                  <Text style={styles.cardHeaderId}>#{inv.rfqId?.uprn}</Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={styles.cardHeaderLabel}>DATE ISSUED</Text>
                  <Text style={styles.cardHeaderDate}>
                    {new Date(inv.createdAt).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </Text>
                </View>
              </View>

              {/* parties */}
              <View style={styles.partiesRow}>
                <View style={styles.party}>
                  <Text style={styles.partyRole}>FROM</Text>
                  <Text style={styles.partyName}>
                    {inv.rfqId?.user?.firstName?.trim()}
                  </Text>
                  <Text style={styles.partyDetail}>
                    {inv.rfqId?.user?.email}
                  </Text>
                  <Text style={styles.partyDetail}>
                    {inv.rfqId?.user?.phoneNumber}
                  </Text>
                </View>
                <View style={styles.partyArrow}>
                  <Ionicons name="arrow-forward" size={18} color="#0057b8" />
                </View>
                <View style={[styles.party, { alignItems: "flex-end" }]}>
                  <Text style={[styles.partyRole, { textAlign: "right" }]}>
                    BILL TO
                  </Text>
                  <Text style={styles.partyName}>
                    {inv.rfqId?.destinatary_user?.firstName}
                  </Text>
                  <Text style={styles.partyDetail}>
                    {inv.rfqId?.destinatary_user?.email}
                  </Text>
                  <Text style={styles.partyDetail}>
                    {inv.rfqId?.destinatary_user?.phoneNumber}
                  </Text>
                </View>
              </View>

              <Divider />

              {/* line item */}
              <View style={styles.lineHeader}>
                <Text style={[styles.lineCol, { flex: 3 }]}>DESCRIPTION</Text>
                <Text style={[styles.lineCol, { textAlign: "center" }]}>
                  QTY
                </Text>
                <Text style={[styles.lineCol, { textAlign: "right", flex: 2 }]}>
                  AMOUNT
                </Text>
              </View>

              <View style={styles.lineItem}>
                <Text style={[styles.lineItemText, { flex: 3 }]}>
                  {inv.rfqId?.product_description}
                </Text>
                <Text style={[styles.lineItemText, { textAlign: "center" }]}>
                  {inv.rfqId?.product_quantity}
                </Text>
                <Text
                  style={[
                    styles.lineItemText,
                    { textAlign: "right", flex: 2, fontWeight: "700" },
                  ]}
                >
                  {fmt(inv.rfqId?.subtotal, inv.currency)}
                </Text>
              </View>

              <Divider />

              {/* totals */}
              <View style={styles.totalsBlock}>
                <InfoRow
                  label="Subtotal"
                  value={fmt(inv.rfqId?.subtotal, inv.currency)}
                />
                <InfoRow
                  label="Delivery"
                  value={
                    inv.rfqId?.delivery_charge
                      ? fmt(inv.rfqId?.delivery_charge, inv.currency)
                      : "Free"
                  }
                />
                <InfoRow
                  label={`Transaction Charges`}
                  value={fmt(inv.rfqId?.transaction_charges, inv.currency)}
                />
                {inv.rfqId?.exchange_rate && inv.rfqId?.exchange_rate !== 1 && (
                  <InfoRow
                    label="Exchange Rate"
                    value={`×${inv.rfqId?.exchange_rate}`}
                  />
                )}
              </View>

              <View style={styles.totalBand}>
                <Text style={styles.totalLabel}>TOTAL DUE</Text>
                <Text style={styles.totalAmount}>
                  {fmt(inv.rfqId?.total, inv.currency)}
                </Text>
              </View>
            </View>

            {/* ── delivery details ── */}
            {inv.rfqId?.delivery_address && (
              <View style={styles.card}>
                <SectionHeader title="Delivery Details" />
                <View style={{ gap: 6, marginTop: 12 }}>
                  <InfoRow label="Type" value={inv.rfqId?.delivery_type} />
                  <InfoRow label="Trade" value={inv.rfqId?.trade_type} />
                  <InfoRow
                    label="Street"
                    value={inv.rfqId?.delivery_address?.street}
                  />
                  <InfoRow
                    label="City"
                    value={`${inv.rfqId?.delivery_address?.city}, ${inv.rfqId?.delivery_address?.state}`}
                  />
                  <InfoRow
                    label="Country"
                    value={inv.rfqId?.delivery_address?.country}
                  />
                  <InfoRow
                    label="Post Code"
                    value={inv.rfqId?.delivery_address?.postal_code}
                  />
                  <InfoRow
                    label="Phone"
                    value={inv.rfqId?.delivery_address?.phoneNumber}
                  />
                  {inv.rfqId?.delivery_code && (
                    <View style={styles.deliveryCodeBox}>
                      <Ionicons name="lock-closed" size={14} color="#0057b8" />
                      <Text style={styles.deliveryCodeText}>
                        Delivery Code: {inv.rfqId?.delivery_code}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* ── escrow ── */}
            {(escrow || inv.escrowId) && (
              <View style={[styles.card, styles.escrowCard]}>
                <View style={styles.escrowHeader}>
                  <Ionicons name="shield-checkmark" size={22} color="#0057b8" />
                  <Text style={styles.escrowTitle}>Escrow Active</Text>
                </View>
                <Text style={styles.escrowSub}>
                  Funds are held securely until delivery is confirmed.
                </Text>
                <View style={{ gap: 6, marginTop: 14 }}>
                  <InfoRow
                    label="Escrow ID"
                    value={escrow?._id ?? inv.escrowId ?? ""}
                  />
                  <InfoRow
                    label="Status"
                    value={(escrow?.status ?? "active").toUpperCase()}
                  />
                  <InfoRow
                    label="Amount"
                    value={fmt(
                      escrow?.amount ?? inv.rfqId?.amount,
                      escrow?.currency ?? inv.rfqId?.currency,
                    )}
                  />
                </View>
              </View>
            )}

            {/* ── pay button ── */}
            {inv.status === "pending" && (
              <TouchableOpacity
                onPress={handlePay}
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
                      Pay {fmt(inv.rfqId?.total, inv.rfqId?.currency)}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            )}

            {/* footer note */}
            <Text style={styles.footer}>
              Generated on {new Date(inv.createdAt).toLocaleString("en-GB")} ·
              Ref: {inv._id}
            </Text>
          </>
        ) : null}
      </ScrollView>
      {showWebView && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "#fff",
            zIndex: 999,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingTop: 50,
              paddingHorizontal: 16,
              paddingBottom: 10,
              backgroundColor: "#fff",
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: "700",
              }}
            >
              Complete Payment
            </Text>

            <TouchableOpacity onPress={() => setShowWebView(false)}>
              <Ionicons name="close" size={28} color="#000" />
            </TouchableOpacity>
          </View>

          <WebView
            ref={webViewRef}
            source={{ uri: checkoutUrl }}
            startInLoadingState
            onNavigationStateChange={handleNavigationStateChange}
            onLoadStart={() => setWebViewLoading(true)}
            onLoadEnd={() => setWebViewLoading(false)}
          />

          {webViewLoading && (
            <View
              style={{
                position: "absolute",
                top: "50%",
                left: 0,
                right: 0,
                alignItems: "center",
              }}
            >
              <ActivityIndicator size="large" color="#0057b8" />
            </View>
          )}
        </View>
      )}
    </View>
  );
}

// ─── styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f0f4fa" },

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

  scroll: { padding: 16, paddingBottom: 48, gap: 14 },

  // invoice card
  invoiceCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    overflow: "hidden",
    shadowColor: "#0057b8",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  cardHeader: {
    backgroundColor: "#0057b8",
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
    backgroundColor: "#0057b8",
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

  // generic card
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    shadowColor: "#0057b8",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },

  // section headers
  sectionHeader: { flexDirection: "row", alignItems: "center" },
  sectionAccent: {
    width: 3,
    height: 16,
    borderRadius: 2,
    backgroundColor: "#0057b8",
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
    color: "#0057b8",
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
  escrowTitle: { fontSize: 15, fontWeight: "900", color: "#0057b8" },
  escrowSub: { fontSize: 12, color: "#7a8fad", lineHeight: 18 },

  // pay button
  payBtn: {
    backgroundColor: "#0057b8",
    borderRadius: 16,
    paddingVertical: 17,
    alignItems: "center",
    shadowColor: "#0057b8",
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
    backgroundColor: "#0057b8",
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
