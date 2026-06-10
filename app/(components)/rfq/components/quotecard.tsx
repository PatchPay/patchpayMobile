import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  ScrollView,
  TextInput,
  Platform,
} from "react-native";

import { useState } from "react";
import Toast from "react-native-toast-message";
import { Quote } from "@/types/rfq.types";

import { STATUS_META } from "@/constant/rfq";

import { rfqService } from "@/api/rfqService";
import { router } from "expo-router";

export default function QuoteCard({
  quote,
  currentUserId,
  onAction,
}: {
  quote: Quote;
  currentUserId: string | null;
  onAction: () => void;
}) {
  const meta = STATUS_META[quote.status] ?? STATUS_META.Pending;
  const isIssuer = quote.user?._id === currentUserId;
  const isPending = quote.status?.toLowerCase() === "pending";

  const [loading, setLoading] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const [visible, setVisible] = useState(false);
  const [pendingAction, setPendingAction] = useState<
    "cancel" | "accept" | "reject" | null
  >(null);

  // Edit form state — prefilled with quote data
  const [editAmount, setEditAmount] = useState(quote.amount.toString());
  const [editQty, setEditQty] = useState(quote.product_quantity.toString());
  const [editDescription, setEditDescription] = useState(
    quote.product_description,
  );
  const [editDeliveryType, setEditDeliveryType] = useState(
    quote.delivery_type ?? "Standard",
  );
  const [editSubmitting, setEditSubmitting] = useState(false);

  const doAction = async (action: "cancel" | "accept" | "reject") => {
    setLoading(true);
    try {
      if (action === "cancel") {
        await rfqService.cancelQuote(quote._id);
      } else if (action === "accept") {
        await rfqService.acceptQuote(quote._id);
      } else {
        await rfqService.rejectQuote(quote._id);
      }
      onAction();
    } catch (e: any) {
      const message =
        e?.response?.data?.message || e?.response?.data?.error || e.message;
      Toast.show({
        type: "error",
        text1: "Error updating RFQ",
        text2: message,
        position: "top",
        visibilityTime: 3000,
      });
      console.log("Action error:", message);
    } finally {
      setLoading(false);
    }
  };

  const confirmAction = (action: "cancel" | "accept" | "reject") => {
    setPendingAction(action);
    setVisible(true);
  };

  const handleEditSubmit = async () => {
    if (!editDescription.trim() || !editAmount.trim() || !editQty.trim()) {
      Toast.show({
        type: "error",
        text1: "Validation Error",
        text2: "Please fill all fields.",
        position: "top",
        visibilityTime: 3000,
      });
      return;
    }
    setEditSubmitting(true);
    try {
      const numAmount = parseFloat(editAmount.replace(/,/g, ""));
      const numQty = parseInt(editQty, 10);
      const deliveryCharge = 0;
      const transactionCharges = numAmount * 0.015;
      const lineTotal = numAmount * numQty;
      const subtotal = lineTotal + deliveryCharge;
      const totalAmount = subtotal + transactionCharges;

      await rfqService.updateQuote(quote._id, {
        product_description: editDescription.trim(),
        product_quantity: numQty,
        amount: numAmount,
        delivery_type: editDeliveryType,
        line_total: lineTotal,
        delivery_charge: deliveryCharge,
        transaction_charges: transactionCharges,
        subtotal,
        total_amount: totalAmount,
      });

      setEditModalOpen(false);
      onAction();
    } catch (e: any) {
      const message =
        e?.response?.data?.message || e?.response?.data?.error || e.message;
      Toast.show({
        type: "error",
        text1: "Error updating RFQ",
        text2: message,
        position: "top",
        visibilityTime: 3000,
      });
    } finally {
      setEditSubmitting(false);
    }
  };

  const inputStyle = {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: "#0f1923",
    marginBottom: 12,
    backgroundColor: "#f8fafc",
  };

  const labelStyle = {
    fontSize: 11,
    color: "#94a3b8",
    marginBottom: 4,
    fontWeight: "600" as const,
  };

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.86}
        onPress={() =>
          router.push({
            pathname: "/(components)/rfq/[quoteId]",
            params: { quoteId: quote._id },
          })
        }
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
              RFQ #{quote.quote_number ?? quote._id.slice(-6)} ·{" "}
              {quote.trade_type ?? "Trade"}
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
            <Text
              style={{ color: meta.color, fontSize: 10, fontWeight: "800" }}
            >
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
                ? `${quote.destinatary_user?.firstName ?? quote.recipient?.firstName ?? "Recipient"}`
                : `${quote.user?.firstName ?? quote.requester?.firstName ?? "Requester"}`}
            </Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={{ color: "#94a3b8", fontSize: 11 }}>Delivery</Text>
            <Text style={{ color: "#475569", fontSize: 13, fontWeight: "600" }}>
              {quote.delivery_type ?? "Standard"}
            </Text>
          </View>
        </View>

        {/* Actions */}
        {isPending && (
          <View style={{ marginTop: 14 }}>
            {loading ? (
              <ActivityIndicator color="#2541c4" />
            ) : isIssuer ? (
              // Issuer sees: Edit + Cancel
              <View style={{ flexDirection: "row", gap: 10 }}>
                <TouchableOpacity
                  onPress={() => setEditModalOpen(true)}
                  style={{
                    flex: 1,
                    backgroundColor: "#eef2ff",
                    borderRadius: 12,
                    paddingVertical: 10,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      color: "#2541c4",
                      fontWeight: "700",
                      fontSize: 13,
                    }}
                  >
                    Edit RFQ
                  </Text>
                </TouchableOpacity>
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
                    style={{
                      color: "#FF0000",
                      fontWeight: "700",
                      fontSize: 13,
                    }}
                  >
                    Cancel RFQ
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              // Recipient sees: Accept + Reject
              <View style={{ flexDirection: "row", gap: 10 }}>
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
                    style={{
                      color: "#2ec4b6",
                      fontWeight: "700",
                      fontSize: 13,
                    }}
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
                    style={{
                      color: "#FF0000",
                      fontWeight: "700",
                      fontSize: 13,
                    }}
                  >
                    Reject
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>
      {/* ── Confirm Action Modal ── */}
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(0,0,0,0.4)",
          }}
        >
          <View
            style={{
              backgroundColor: "#fff",
              borderRadius: 20,
              padding: 24,
              width: "80%",
            }}
          >
            <Text
              style={{
                fontWeight: "800",
                fontSize: 16,
                marginBottom: 8,
                color: "#0f1923",
              }}
            >
              {pendingAction === "cancel"
                ? "Cancel RFQ"
                : pendingAction === "accept"
                  ? "Accept RFQ"
                  : "Reject RFQ"}
            </Text>

            <Text style={{ color: "#64748b", marginBottom: 20, fontSize: 14 }}>
              Are you sure you want to {pendingAction} RFQ #{quote.quote_number}
              ?
            </Text>

            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity
                onPress={() => setVisible(false)}
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 12,
                  backgroundColor: "#f1f5f9",
                  alignItems: "center",
                }}
              >
                <Text style={{ fontWeight: "700", color: "#64748b" }}>No</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setVisible(false);
                  doAction(pendingAction!);
                }}
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 12,
                  backgroundColor:
                    pendingAction === "accept" ? "#2ec4b6" : "#ef4444",
                  alignItems: "center",
                }}
              >
                <Text style={{ fontWeight: "700", color: "#fff" }}>Yes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* ── Edit RFQ Modal ── */}
      <Modal
        visible={editModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setEditModalOpen(false)}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "flex-end",
            backgroundColor: "rgba(0,0,0,0.4)",
          }}
        >
          <View
            style={{
              backgroundColor: "#fff",
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingHorizontal: 20,
              paddingTop: 16,
              paddingBottom: Platform.OS === "ios" ? 40 : 24,
              maxHeight: "85%",
            }}
          >
            {/* Drag handle */}
            <View
              style={{
                width: 40,
                height: 4,
                backgroundColor: "#e2e8f0",
                borderRadius: 2,
                alignSelf: "center",
                marginBottom: 16,
              }}
            />

            {/* Modal header */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 20,
              }}
            >
              <View>
                <Text
                  style={{ fontSize: 17, fontWeight: "800", color: "#0f1923" }}
                >
                  Edit RFQ
                </Text>
                <Text style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
                  #{quote.quote_number}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setEditModalOpen(false)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: "#f1f5f9",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ fontSize: 16, color: "#64748b" }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={labelStyle}>Product Description</Text>
              <TextInput
                value={editDescription}
                onChangeText={setEditDescription}
                placeholder="Product description"
                multiline
                numberOfLines={3}
                style={[
                  inputStyle,
                  { minHeight: 80, textAlignVertical: "top" },
                ]}
              />

              <View style={{ flexDirection: "row", gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={labelStyle}>Amount</Text>
                  <TextInput
                    value={editAmount}
                    onChangeText={setEditAmount}
                    keyboardType="numeric"
                    placeholder="500000"
                    style={inputStyle}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={labelStyle}>Quantity</Text>
                  <TextInput
                    value={editQty}
                    onChangeText={setEditQty}
                    keyboardType="numeric"
                    placeholder="100"
                    style={inputStyle}
                  />
                </View>
              </View>

              <Text style={labelStyle}>Delivery Type</Text>
              <View style={{ flexDirection: "row", gap: 8, marginBottom: 20 }}>
                {["Standard", "Express", "Pickup"].map((d) => (
                  <TouchableOpacity
                    key={d}
                    onPress={() => setEditDeliveryType(d)}
                    style={{
                      flex: 1,
                      paddingVertical: 10,
                      borderRadius: 10,
                      alignItems: "center",
                      borderWidth: 1,
                      borderColor:
                        editDeliveryType === d ? "#2541c4" : "#e2e8f0",
                      backgroundColor:
                        editDeliveryType === d ? "#eef2ff" : "#f8fafc",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "700",
                        color: editDeliveryType === d ? "#2541c4" : "#94a3b8",
                      }}
                    >
                      {d}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                onPress={handleEditSubmit}
                disabled={editSubmitting}
                style={{
                  backgroundColor: "#2541c4",
                  borderRadius: 14,
                  paddingVertical: 15,
                  alignItems: "center",
                }}
              >
                {editSubmitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text
                    style={{ color: "#fff", fontWeight: "800", fontSize: 15 }}
                  >
                    Save Changes
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}
