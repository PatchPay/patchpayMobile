import {
  ActivityIndicator,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { Quote } from "@/types/rfq.types";
import { useState } from "react";
import Toast from "react-native-toast-message";

import { STATUS_META } from "@/constant/rfq";

import { rfqService } from "@/api/rfqService";
import { router } from "expo-router";

type PendingAction = "cancel" | "accept" | "reject" | "delete" | null;

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
  const quoteId = quote.id.toString();

  // user_data = sender (issuer of the RFQ), destinatary_user = recipient
  const isSender = Number(currentUserId) === quote.user_data.id;
  const isRecipient = Number(currentUserId) === quote.destinatary_user.id;

  const isPending = quote.status === "Pending";
  const isAccepted = quote.status === "Accepted";
  const isRejected = quote.status === "Rejected";
  const isCancelled = quote.status === "Cancelled";

  const hasInvoice = !!quote.invoice;

  const [loading, setLoading] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const [visible, setVisible] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);

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

  const doAction = async (
    action: "cancel" | "accept" | "reject" | "delete",
  ) => {
    setLoading(true);
    try {
      if (action === "cancel") {
        await rfqService.cancelQuote(quoteId);
      } else if (action === "accept") {
        await rfqService.acceptQuote(quoteId);
      } else if (action === "reject") {
        await rfqService.rejectQuote(quoteId);
      } else if (action === "delete") {
        // NOTE: verify this method name exists on rfqService — added to
        // support the "Delete RFQ" action requested for the sender.
        await rfqService.deleteQuote(quoteId);
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

  const confirmAction = (action: "cancel" | "accept" | "reject" | "delete") => {
    setPendingAction(action);
    setVisible(true);
  };

  const handleGenerateInvoice = async () => {
    setLoading(true);
    try {
      // NOTE: verify this method name exists on rfqService — added to
      // support the "Generate Invoice" action for accepted RFQs.
      await rfqService.generateInvoice(quoteId);
      Toast.show({
        type: "success",
        text1: "Invoice generated",
        position: "top",
        visibilityTime: 3000,
      });
      onAction();
    } catch (e: any) {
      const message =
        e?.response?.data?.message || e?.response?.data?.error || e.message;
      Toast.show({
        type: "error",
        text1: "Error generating invoice",
        text2: message,
        position: "top",
        visibilityTime: 3000,
      });
    } finally {
      setLoading(false);
    }
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

      await rfqService.updateQuote(quoteId, {
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
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: "#0b1220",
    marginBottom: 14,
    backgroundColor: "#f8fafc",
  };

  const labelStyle = {
    fontSize: 11,
    color: "#94a3b8",
    marginBottom: 6,
    fontWeight: "700" as const,
    letterSpacing: 0.3,
    textTransform: "uppercase" as const,
  };

  const formatDate = (iso?: string) => {
    if (!iso) return "N/A";
    try {
      const d = new Date(iso);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "N/A";
    }
  };

  const senderName =
    `${quote.user_data?.firstName ?? ""} ${quote.user_data?.surname ?? ""}`.trim() ||
    "Sender";
  const recipientName =
    `${quote.destinatary_user?.firstName ?? ""} ${
      quote.destinatary_user?.surname ?? ""
    }`.trim() || "Recipient";

  const confirmCopy: Record<
    Exclude<PendingAction, null>,
    { title: string; body: string; confirmColor: string }
  > = {
    cancel: {
      title: "Cancel RFQ",
      confirmColor: "#ef4444",
      body: `Are you sure you want to cancel RFQ #${quote.quote_number}? This cannot be undone.`,
    },
    accept: {
      title: "Accept RFQ",
      confirmColor: "#10b981",
      body: `Accept RFQ #${quote.quote_number}? You're agreeing to the listed terms.`,
    },
    reject: {
      title: "Reject RFQ",
      confirmColor: "#ef4444",
      body: `Reject RFQ #${quote.quote_number}? The sender will be notified.`,
    },
    delete: {
      title: "Delete RFQ",
      confirmColor: "#ef4444",
      body: `Permanently delete RFQ #${quote.quote_number}? This cannot be undone.`,
    },
  };

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() =>
          router.push({
            pathname: "/(components)/rfq/[quoteId]",
            params: { quoteId: quote.id },
          })
        }
        style={{
          backgroundColor: "#fff",
          borderRadius: 22,
          padding: 20,
          marginBottom: 16,
          borderWidth: 1,
          borderColor: "#f1f5f9",
          shadowColor: "#0f172a",
          shadowOpacity: 0.06,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 6 },
          elevation: 3,
        }}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: 4,
          }}
        >
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text
              style={{
                color: "#64748b",
                fontSize: 11,
                fontWeight: "700",
                letterSpacing: 0.4,
                marginBottom: 2,
              }}
            >
              RFQ #{quote.quote_number ?? quoteId.slice(-6)}
            </Text>
            <Text
              style={{ color: "#0b1220", fontWeight: "700", fontSize: 16 }}
              numberOfLines={2}
            >
              {quote.product_description}
            </Text>
          </View>
          <View
            style={{
              backgroundColor: meta.bg,
              borderRadius: 999,
              paddingHorizontal: 12,
              paddingVertical: 6,
            }}
          >
            <Text
              style={{
                color: meta.color,
                fontSize: 10,
                fontWeight: "800",
                letterSpacing: 0.5,
              }}
            >
              {quote.status.toUpperCase()}
            </Text>
          </View>
        </View>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 16,
            marginTop: 4,
          }}
        >
          <View
            style={{
              backgroundColor: "#f1f5f9",
              borderRadius: 999,
              paddingHorizontal: 8,
              paddingVertical: 3,
              marginRight: 6,
            }}
          >
            <Text style={{ fontSize: 10, color: "#475569", fontWeight: "600" }}>
              {quote.trade_type ?? "Trade"}
            </Text>
          </View>
          <View
            style={{
              backgroundColor: "#f1f5f9",
              borderRadius: 999,
              paddingHorizontal: 8,
              paddingVertical: 3,
            }}
          >
            <Text style={{ fontSize: 10, color: "#475569", fontWeight: "600" }}>
              {quote.delivery_type ?? "Standard"} delivery
            </Text>
          </View>
        </View>

        <View
          style={{ height: 1, backgroundColor: "#f1f5f9", marginBottom: 16 }}
        />

        {/* Amount + Total */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginBottom: 16,
          }}
        >
          <View>
            <Text style={labelStyle}>Amount</Text>
            <Text style={{ color: "#0b1220", fontWeight: "800", fontSize: 20 }}>
              {quote.currency} {quote.amount.toLocaleString()}
            </Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={labelStyle}>Total</Text>
            <Text style={{ color: "#0b1220", fontWeight: "800", fontSize: 20 }}>
              {quote.currency} {(quote.total ?? 0).toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Qty / Arrival */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginBottom: 16,
          }}
        >
          <View>
            <Text style={labelStyle}>Quantity</Text>
            <Text style={{ color: "#0b1220", fontWeight: "600", fontSize: 14 }}>
              {quote.product_quantity}
            </Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={labelStyle}>Arrival</Text>
            <Text style={{ color: "#0b1220", fontWeight: "600", fontSize: 14 }}>
              {formatDate(quote.arrival_date)}
              {quote.arrival_time ? ` · ${quote.arrival_time}` : ""}
            </Text>
          </View>
        </View>

        {/* Sender / Recipient */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            backgroundColor: "#f8fafc",
            borderRadius: 14,
            padding: 12,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text style={labelStyle}>Sender</Text>
            <Text
              style={{
                color: isSender ? "#2541c4" : "#0b1220",
                fontSize: 13,
                fontWeight: "700",
              }}
              numberOfLines={1}
            >
              {senderName}
              {isSender ? " (You)" : ""}
            </Text>
          </View>
          <View
            style={{
              width: 1,
              backgroundColor: "#e2e8f0",
              marginHorizontal: 12,
            }}
          />
          <View style={{ flex: 1, alignItems: "flex-end" }}>
            <Text style={labelStyle}>Recipient</Text>
            <Text
              style={{
                color: isRecipient ? "#2541c4" : "#0b1220",
                fontSize: 13,
                fontWeight: "700",
              }}
              numberOfLines={1}
            >
              {recipientName}
              {isRecipient ? " (You)" : ""}
            </Text>
          </View>
        </View>

        {/* Actions */}
        {loading ? (
          <View style={{ marginTop: 16, alignItems: "center" }}>
            <ActivityIndicator color="#2541c4" />
          </View>
        ) : (
          <>
            {/* Sender actions */}
            {isSender && isPending && (
              <View style={{ flexDirection: "row", gap: 10, marginTop: 16 }}>
                <TouchableOpacity
                  onPress={() => setEditModalOpen(true)}
                  style={{
                    flex: 1,
                    backgroundColor: "#eef2ff",
                    borderRadius: 14,
                    paddingVertical: 12,
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
                    backgroundColor: "#fff7ed",
                    borderRadius: 14,
                    paddingVertical: 12,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      color: "#f97316",
                      fontWeight: "700",
                      fontSize: 13,
                    }}
                  >
                    Cancel RFQ
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => confirmAction("delete")}
                  style={{
                    flex: 1,
                    backgroundColor: "#fef2f2",
                    borderRadius: 14,
                    paddingVertical: 12,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      color: "#ef4444",
                      fontWeight: "700",
                      fontSize: 13,
                    }}
                  >
                    Delete RFQ
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {isSender && isAccepted && (
              <View style={{ flexDirection: "row", gap: 10, marginTop: 16 }}>
                {!hasInvoice ? (
                  <TouchableOpacity
                    onPress={handleGenerateInvoice}
                    style={{
                      flex: 1,
                      backgroundColor: "#eef2ff",
                      borderRadius: 14,
                      paddingVertical: 12,
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
                      Generate Invoice
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <View
                    style={{
                      flex: 1,
                      backgroundColor: "#f0fdf4",
                      borderRadius: 14,
                      paddingVertical: 12,
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        color: "#16a34a",
                        fontWeight: "700",
                        fontSize: 13,
                      }}
                    >
                      Invoice Generated
                    </Text>
                  </View>
                )}
                <TouchableOpacity
                  onPress={() => confirmAction("delete")}
                  style={{
                    flex: 1,
                    backgroundColor: "#fef2f2",
                    borderRadius: 14,
                    paddingVertical: 12,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      color: "#ef4444",
                      fontWeight: "700",
                      fontSize: 13,
                    }}
                  >
                    Delete RFQ
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {isSender && (isRejected || isCancelled) && (
              <View style={{ flexDirection: "row", gap: 10, marginTop: 16 }}>
                <TouchableOpacity
                  onPress={() => confirmAction("delete")}
                  style={{
                    flex: 1,
                    backgroundColor: "#fef2f2",
                    borderRadius: 14,
                    paddingVertical: 12,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      color: "#ef4444",
                      fontWeight: "700",
                      fontSize: 13,
                    }}
                  >
                    Delete RFQ
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Recipient actions */}
            {isRecipient && isPending && (
              <View style={{ flexDirection: "row", gap: 10, marginTop: 16 }}>
                <TouchableOpacity
                  onPress={() => confirmAction("accept")}
                  style={{
                    flex: 1,
                    backgroundColor: "#e8faf4",
                    borderRadius: 14,
                    paddingVertical: 12,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      color: "#10b981",
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
                    backgroundColor: "#fef2f2",
                    borderRadius: 14,
                    paddingVertical: 12,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      color: "#ef4444",
                      fontWeight: "700",
                      fontSize: 13,
                    }}
                  >
                    Reject
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => confirmAction("cancel")}
                  style={{
                    flex: 1,
                    backgroundColor: "#fff7ed",
                    borderRadius: 14,
                    paddingVertical: 12,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      color: "#f97316",
                      fontWeight: "700",
                      fontSize: 13,
                    }}
                  >
                    Cancel RFQ
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </>
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
            backgroundColor: "rgba(15,23,42,0.5)",
          }}
        >
          <View
            style={{
              backgroundColor: "#fff",
              borderRadius: 22,
              padding: 24,
              width: "82%",
            }}
          >
            {pendingAction && (
              <>
                <Text
                  style={{
                    fontWeight: "800",
                    fontSize: 17,
                    marginBottom: 8,
                    color: "#0b1220",
                  }}
                >
                  {confirmCopy[pendingAction].title}
                </Text>

                <Text
                  style={{
                    color: "#64748b",
                    marginBottom: 22,
                    fontSize: 14,
                    lineHeight: 20,
                  }}
                >
                  {confirmCopy[pendingAction].body}
                </Text>

                <View style={{ flexDirection: "row", gap: 10 }}>
                  <TouchableOpacity
                    onPress={() => setVisible(false)}
                    style={{
                      flex: 1,
                      padding: 13,
                      borderRadius: 14,
                      backgroundColor: "#f1f5f9",
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ fontWeight: "700", color: "#64748b" }}>
                      No
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      setVisible(false);
                      doAction(pendingAction);
                    }}
                    style={{
                      flex: 1,
                      padding: 13,
                      borderRadius: 14,
                      backgroundColor: confirmCopy[pendingAction].confirmColor,
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ fontWeight: "700", color: "#fff" }}>
                      Yes
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
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
            backgroundColor: "rgba(15,23,42,0.5)",
          }}
        >
          <View
            style={{
              backgroundColor: "#fff",
              borderTopLeftRadius: 26,
              borderTopRightRadius: 26,
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
                  style={{ fontSize: 18, fontWeight: "800", color: "#0b1220" }}
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
                      borderRadius: 12,
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
                  borderRadius: 16,
                  paddingVertical: 16,
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
