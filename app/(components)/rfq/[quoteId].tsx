import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import Toast from "react-native-toast-message";
import { invoiceService } from "@/api/invoiceService";
import { rfqService } from "@/api/rfqService";
import { Quote } from "@/types/rfq";
import { STATUS_META } from "@/constant/rfq";

const personName = (person?: { firstName?: string; lastName?: string }) =>
  `${person?.firstName ?? ""} ${person?.lastName ?? ""}`.trim() || "Unknown";

const quoteInvoiceId = (quote?: Quote | null) => {
  if (!quote?.invoice) {
    return quote?.invoiceId ?? quote?.invoice_id ?? quote?.invoiceID;
  }

  if (typeof quote.invoice === "string") return quote.invoice;

  return (
    quote.invoiceId ??
    quote.invoice_id ??
    quote.invoiceID ??
    quote.invoice._id ??
    quote.invoice.id
  );
};

export default function RFQDetailsScreen() {
  const { quoteId } = useLocalSearchParams<{ quoteId: string }>();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadQuote = useCallback(async () => {
    if (!quoteId) return;
    setError(null);
    try {
      const data = await rfqService.getQuote(quoteId);
      setQuote(data);
    } catch (e: any) {
      setError(e?.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  }, [quoteId]);

  useEffect(() => {
    loadQuote();
  }, [loadQuote]);

  const runAction = async (action: "accept" | "reject" | "cancel") => {
    if (!quoteId) return;
    setActionLoading(true);
    try {
      if (action === "accept") {
        await rfqService.acceptQuote(quoteId);
        await loadQuote();
      } else if (action === "reject") {
        await rfqService.rejectQuote(quoteId);
        await loadQuote();
      } else {
        await rfqService.cancelQuote(quoteId);
        await loadQuote();
      }
    } catch (e: any) {
      Toast.show({
        type: "error",
        text1: "RFQ update failed",
        text2: e?.response?.data?.message || e.message,
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleGenerateInvoice = async () => {
    if (!quote?._id) return;
    setInvoiceLoading(true);
    try {
      const invoice = await invoiceService.generateInvoice(quote._id);

      Toast.show({
        type: "success",
        text1: "Invoice generated",
        text2: "The invoice is ready for payment.",
      });

      await loadQuote();

      const generatedInvoiceId = invoice._id;
      if (generatedInvoiceId) {
        router.push({
          pathname: "/(components)/invoice",
          params: { invoiceId: generatedInvoiceId },
        });
      }
    } catch (e: any) {
      Toast.show({
        type: "error",
        text1: "Invoice generation failed",
        text2: e?.response?.data?.message || e.message,
      });
    } finally {
      setInvoiceLoading(false);
    }
  };

  const meta = STATUS_META[quote?.status ?? "Pending"] ?? STATUS_META.Pending;
  const isPending = quote?.status?.toLowerCase() === "pending";
  const isAccepted = quote?.status?.toLowerCase() === "accepted";
  const invoiceId = quoteInvoiceId(quote);
  const canGenerateInvoice = Boolean(isAccepted && !invoiceId);

  return (
    <View style={{ flex: 1, backgroundColor: "#f2f4f8" }}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      <LinearGradient
        colors={["#1a1060", "#1e2d8f", "#2541c4", "#6a3de8"]}
        style={{ paddingTop: 46, paddingBottom: 28, paddingHorizontal: 20 }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
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
              RFQ Details
            </Text>
            <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>
              Review request and payment readiness
            </Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadQuote} />
        }
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
      >
        {loading ? (
          <ActivityIndicator color="#2541c4" style={{ marginTop: 40 }} />
        ) : error ? (
          <View style={{ backgroundColor: "#fff1f1", borderRadius: 14, padding: 16 }}>
            <Text style={{ color: "#ef4444", fontWeight: "700" }}>
              Unable to load RFQ
            </Text>
            <Text style={{ color: "#64748b", marginTop: 6 }}>{error}</Text>
            <TouchableOpacity
              onPress={loadQuote}
              style={{
                marginTop: 12,
                backgroundColor: "#ef4444",
                borderRadius: 10,
                paddingVertical: 10,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "700" }}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : quote ? (
          <View style={{ gap: 14 }}>
            <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 18 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ color: "#0f1923", fontSize: 18, fontWeight: "800", flex: 1 }}>
                  {quote.product_description}
                </Text>
                <View style={{ backgroundColor: meta.bg, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 }}>
                  <Text style={{ color: meta.color, fontSize: 10, fontWeight: "800" }}>
                    {quote.status.toUpperCase()}
                  </Text>
                </View>
              </View>
              <Text style={{ color: "#94a3b8", marginTop: 8 }}>
                Created {new Date(quote.createdAt).toLocaleDateString()}
              </Text>
            </View>

            {[
              ["Amount", `${quote.currency} ${quote.amount.toLocaleString()}`],
              ["Quantity", String(quote.product_quantity)],
              ["Requester", personName(quote.user ?? quote.requester)],
              ["Recipient", personName(quote.destinatary_user ?? quote.recipient)],
              ["Delivery", quote.delivery_type ?? "Standard"],
              ["Trade Type", quote.trade_type ?? "Trade"],
            ].map(([label, value]) => (
              <View key={label} style={{ backgroundColor: "#fff", borderRadius: 14, padding: 16 }}>
                <Text style={{ color: "#94a3b8", fontSize: 11, marginBottom: 4 }}>
                  {label}
                </Text>
                <Text style={{ color: "#0f1923", fontWeight: "700" }}>
                  {value}
                </Text>
              </View>
            ))}

            {invoiceId && (
              <TouchableOpacity
                onPress={() =>
                  router.push({
                    pathname: "/(components)/invoice",
                    params: { invoiceId },
                  })
                }
                style={{ backgroundColor: "#eef2ff", borderRadius: 14, paddingVertical: 14, alignItems: "center" }}
              >
                <Text style={{ color: "#2541c4", fontWeight: "800" }}>
                  View Invoice
                </Text>
              </TouchableOpacity>
            )}

            {canGenerateInvoice && (
              <TouchableOpacity
                disabled={invoiceLoading}
                onPress={handleGenerateInvoice}
                style={{
                  backgroundColor: invoiceLoading ? "#94a3b8" : "#2541c4",
                  borderRadius: 14,
                  paddingVertical: 14,
                  alignItems: "center",
                }}
              >
                {invoiceLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={{ color: "#fff", fontWeight: "800" }}>
                    Generate Invoice
                  </Text>
                )}
              </TouchableOpacity>
            )}

            {isPending && (
              <View style={{ flexDirection: "row", gap: 10 }}>
                <TouchableOpacity
                  disabled={actionLoading}
                  onPress={() => runAction("accept")}
                  style={{ flex: 1, backgroundColor: "#2ec4b6", borderRadius: 14, paddingVertical: 14, alignItems: "center" }}
                >
                  <Text style={{ color: "#fff", fontWeight: "800" }}>Accept</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  disabled={actionLoading}
                  onPress={() => runAction("reject")}
                  style={{ flex: 1, backgroundColor: "#ef4444", borderRadius: 14, paddingVertical: 14, alignItems: "center" }}
                >
                  <Text style={{ color: "#fff", fontWeight: "800" }}>Reject</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  disabled={actionLoading}
                  onPress={() => runAction("cancel")}
                  style={{ flex: 1, backgroundColor: "#64748b", borderRadius: 14, paddingVertical: 14, alignItems: "center" }}
                >
                  <Text style={{ color: "#fff", fontWeight: "800" }}>Cancel</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}
