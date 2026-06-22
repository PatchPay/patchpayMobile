import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { LinearGradient } from "expo-linear-gradient";

import { Feather, Ionicons } from "@expo/vector-icons";

import { router } from "expo-router";

import { jwtDecode } from "jwt-decode";
import FieldCard from "./components/FieldCard";
import QuoteCard from "./components/quotecard";
import RecipientModal from "./components/RecipientModal";
import SelectPill from "./components/SelectPill";

import { DELIVERY_TYPES, TRADE_TYPES } from "@/constant/rfq";

import { FoundUser } from "@/types/rfq.types";

import { useRFQ } from "@/hooks/userfq";

import { getAuthToken } from "@/api/rfqapi";
import { rfqService } from "@/api/rfqService";

import DateTimePicker from "@react-native-community/datetimepicker";

import Toast from "react-native-toast-message";

type ProductItem = {
  name: string;
  quantity: string;
  unit: string;
};

export default function RFQScreen() {
  const [tab, setTab] = useState<"create" | "my">("create");

  const [recipient, setRecipient] = useState<FoundUser | null>(null);

  const [arrivalDate, setArrivalDate] = useState<Date | null>(null);
  const [arrivalTime, setArrivalTime] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const [recipientModalOpen, setRecipientModalOpen] = useState(false);
  const [products, setProducts] = useState<ProductItem[]>([
    { name: "", quantity: "", unit: "pcs" },
  ]);

  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<"NGN" | "USD" | "GBP">("NGN");

  const [deliveryType, setDeliveryType] = useState("Standard");

  const [tradeType, setTradeType] = useState("Domestic");

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

  const { quotes, loadingQuotes, quotesError, fetchQuotes } = useRFQ();

  useEffect(() => {
    const loadUser = async () => {
      const token = await getAuthToken();

      if (!token) return;

      try {
        const decoded: any = jwtDecode(token);

        setCurrentUserId(decoded.userId);
      } catch (err) {
        console.log(err);
      }
    };

    loadUser();
  }, []);

  useEffect(() => {
    if (tab === "my") {
      fetchQuotes();
    }
  }, [tab, fetchQuotes]);

  const formatDate = (d: Date) =>
    d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const formatTime = (t: Date) =>
    t.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

  const handlePublish = async () => {
    if (!recipient) {
      Toast.show({
        type: "error",
        text1: "Validation Error",
        text2: "Please select a recipient first.",
        position: "top",
        visibilityTime: 3000,
      });

      return;
    }

    // validation — replace the old check
    if (!products.some((p) => p.name.trim()) || !amount.trim()) {
      Toast.show({
        type: "error",
        text1: "Validation Error",
        text2: "Please fill in all required fields.",
        position: "top",
        visibilityTime: 3000,
      });
      return;
    }

    // build numbered description from all filled products
    const filledProducts = products.filter((p) => p.name.trim());
    const productDescription = filledProducts
      .map(
        (p, i) =>
          `${i + 1}. ${p.name.trim()}${p.quantity ? ` — ${p.quantity} ${p.unit}` : ""}`,
      )
      .join("\n");

    const totalQty = filledProducts.reduce(
      (sum, p) => sum + (parseInt(p.quantity, 10) || 0),
      0,
    );

    setSubmitting(true);

    try {
      const numAmount = parseFloat(amount.replace(/,/g, ""));

      const numQty = parseInt(totalQty.toString(), 10);

      const deliveryCharge = 0;

      const transactionCharges = numAmount * 0.015;

      const lineTotal = numAmount * numQty;

      const subtotal = lineTotal + deliveryCharge;

      const totalAmount = subtotal + transactionCharges;

      await rfqService.createRFQ({
        recipientId: recipient._id,
        product_description: productDescription,
        product_quantity: totalQty,
        amount: numAmount,
        delivery_type: deliveryType,
        trade_type: tradeType,
        delivery_address: {
          street: deliveryAddress.street.trim(),
          city: deliveryAddress.city.trim(),
          state: deliveryAddress.state.trim(),
          country: deliveryAddress.country.trim(),
          phoneNumber: recipient.phoneNumber,
          postal_code: deliveryAddress.postal_code.trim(),
        },
        currency,
        line_total: lineTotal,
        delivery_charge: deliveryCharge,
        transaction_charges: transactionCharges,
        subtotal,
        total_amount: totalAmount,

        arrival_date: arrivalDate
          ? arrivalDate.toISOString().split("T")[0]
          : "",
        arrival_time: arrivalTime ? formatTime(arrivalTime) : "",
      });

      Toast.show({
        type: "success", // "success" | "error" | "info"
        text1: "RFQ Published!",
        text2: "Your request has been sent successfully.",
        position: "top", // "top" | "bottom"
        visibilityTime: 3000,
      });

      setRecipient(null);

      setProducts([{ name: "", quantity: "", unit: "pcs" }]);

      setAmount("");

      setArrivalDate(null);
      setArrivalTime(null);

      setDeliveryType("Standard");

      setTradeType("Domestic");

      setDeliveryAddress({
        street: "",
        city: "",
        state: "",
        country: "",
        phoneNumber: "",
        postal_code: "",
      });

      setTab("my");
    } catch (e: any) {
      const message = e?.response?.data?.message || e.message;

      Toast.show({
        type: "error", // "success" | "error" | "info"
        text1: "Error",
        text2: message,
        position: "top", // "top" | "bottom"
        visibilityTime: 3000,
      });
      console.log("error message", message);
    } finally {
      setSubmitting(false);
    }
  };

  const addProduct = () => {
    setProducts((prev) => [
      ...prev,
      {
        name: "",
        quantity: "",
        unit: "pcs",
      },
    ]);
  };

  const removeProduct = (index: number) => {
    setProducts((prev) => prev.filter((_, i) => i !== index));
  };

  const updateProduct = (
    index: number,
    field: keyof ProductItem,
    value: string,
  ) => {
    setProducts((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              [field]: value,
            }
          : item,
      ),
    );
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#f2f4f8",
      }}
    >
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />

      <LinearGradient
        colors={["#1a1060", "#1e2d8f", "#2541c4", "#6a3de8"]}
        style={{
          paddingTop: Platform.OS === "ios" ? 58 : 46,

          paddingBottom: 28,

          paddingHorizontal: 20,
        }}
      >
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
            <Text
              style={{
                color: "#fff",
                fontSize: 18,
                fontWeight: "700",
              }}
            >
              Request for Quote
            </Text>

            <Text
              style={{
                color: "rgba(255,255,255,0.7)",

                fontSize: 12,
              }}
            >
              Create and manage RFQs
            </Text>
          </View>
        </View>

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
                  fontWeight: "700",
                  fontSize: 13,
                  color: tab === t ? "#2541c4" : "rgba(255,255,255,0.7)",
                }}
              >
                {t === "create" ? "Create RFQ" : "My RFQs"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          tab === "my" ? (
            <RefreshControl
              refreshing={loadingQuotes}
              onRefresh={fetchQuotes}
            />
          ) : undefined
        }
        contentContainerStyle={{
          padding: 20,
          paddingBottom: 100,
        }}
      >
        {tab === "create" ? (
          <>
            <TouchableOpacity
              onPress={() => setRecipientModalOpen(true)}
              style={{
                backgroundColor: "#fff",

                borderRadius: 14,

                padding: 16,

                marginBottom: 14,
              }}
            >
              <Text
                style={{
                  color: "#94a3b8",
                  fontSize: 11,
                  marginBottom: 4,
                }}
              >
                Recipient
              </Text>

              {recipient ? (
                <>
                  <Text
                    style={{
                      color: "#0f1923",

                      fontWeight: "700",

                      fontSize: 14,
                    }}
                  >
                    {recipient.firstName} {recipient.lastName}
                  </Text>

                  <Text
                    style={{
                      color: "#64748b",

                      fontSize: 11,
                    }}
                  >
                    {recipient.email}
                  </Text>
                </>
              ) : (
                <Text
                  style={{
                    color: "#cbd5e1",
                  }}
                >
                  Select Recipient
                </Text>
              )}
            </TouchableOpacity>

            <FieldCard
              icon="file-text"
              iconColor="#e05c97"
              iconBg="#fdf0f6"
              label="Products"
            >
              {products.map((product, index) => (
                <View
                  key={index}
                  style={{
                    marginBottom: 12,
                    padding: 12,
                    borderWidth: 1,
                    borderColor: "#e2e8f0",
                    borderRadius: 12,
                  }}
                >
                  {/* Numbered header */}
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginBottom: 8,
                      gap: 8,
                    }}
                  >
                    <View
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 12,
                        backgroundColor: "#fdf0f6",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: "700",
                          color: "#e05c97",
                        }}
                      >
                        {index + 1}
                      </Text>
                    </View>
                    <Text
                      style={{
                        fontWeight: "700",
                        color: "#0f1923",
                        fontSize: 13,
                      }}
                    >
                      Item {index + 1}
                    </Text>
                  </View>

                  {/* Product name */}
                  <TextInput
                    value={product.name}
                    onChangeText={(text) => updateProduct(index, "name", text)}
                    placeholder="Product name (e.g. Beans, Laptop)"
                    style={{
                      borderWidth: 1,
                      borderColor: "#e2e8f0",
                      borderRadius: 10,
                      padding: 12,
                      marginBottom: 10,
                      fontSize: 14,
                      color: "#0f1923",
                    }}
                  />

                  {/* Quantity + Unit row */}
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    <TextInput
                      value={product.quantity}
                      onChangeText={(text) =>
                        updateProduct(index, "quantity", text)
                      }
                      keyboardType="numeric"
                      placeholder="Qty"
                      style={{
                        flex: 1,
                        borderWidth: 1,
                        borderColor: "#e2e8f0",
                        borderRadius: 10,
                        padding: 12,
                        fontSize: 14,
                        color: "#0f1923",
                      }}
                    />

                    {/* Unit selector — scroll through options */}
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={{ flex: 2 }}
                      contentContainerStyle={{ gap: 6, alignItems: "center" }}
                    >
                      {["pcs", "kg", "bags", "cartons", "litres", "boxes"].map(
                        (u) => (
                          <TouchableOpacity
                            key={u}
                            onPress={() => updateProduct(index, "unit", u)}
                            style={{
                              paddingHorizontal: 12,
                              paddingVertical: 8,
                              borderRadius: 8,
                              borderWidth: 1,
                              borderColor:
                                product.unit === u ? "#e05c97" : "#e2e8f0",
                              backgroundColor:
                                product.unit === u ? "#fdf0f6" : "#fff",
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 12,
                                fontWeight: "600",
                                color:
                                  product.unit === u ? "#e05c97" : "#94a3b8",
                              }}
                            >
                              {u}
                            </Text>
                          </TouchableOpacity>
                        ),
                      )}
                    </ScrollView>
                  </View>

                  {products.length > 1 && (
                    <TouchableOpacity
                      onPress={() => removeProduct(index)}
                      style={{ marginTop: 10, alignSelf: "flex-end" }}
                    >
                      <Text
                        style={{
                          color: "#ef4444",
                          fontWeight: "700",
                          fontSize: 13,
                        }}
                      >
                        ✕ Remove
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}

              <TouchableOpacity
                onPress={addProduct}
                style={{
                  backgroundColor: "#2541c4",
                  paddingVertical: 12,
                  borderRadius: 12,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "700" }}>
                  + Add Another Product
                </Text>
              </TouchableOpacity>
            </FieldCard>

            <FieldCard
              icon="dollar-sign"
              iconColor="#2ec4b6"
              iconBg="#e8faf4"
              label="Amount"
            >
              <TextInput
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                placeholder="500000"
              />
            </FieldCard>
            <FieldCard
              icon="dollar-sign"
              iconColor="#16a34a"
              iconBg="#ecfdf5"
              label="Currency"
            >
              <View style={{ flexDirection: "row", gap: 10 }}>
                {["NGN", "USD", "GBP"].map((c) => (
                  <TouchableOpacity
                    key={c}
                    onPress={() => setCurrency(c as any)}
                    style={{
                      paddingVertical: 10,
                      paddingHorizontal: 14,
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: currency === c ? "#2541c4" : "#e2e8f0",
                      backgroundColor: currency === c ? "#eef2ff" : "#fff",
                    }}
                  >
                    <Text
                      style={{
                        fontWeight: "700",
                        color: currency === c ? "#2541c4" : "#94a3b8",
                      }}
                    >
                      {c}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </FieldCard>

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
                style={{
                  borderWidth: 1,
                  borderColor: "#e2e8f0",
                  borderRadius: 10,
                  padding: 12,
                  marginBottom: 10,
                  fontSize: 14,
                  color: "#0f1923",
                }}
              />

              <View style={{ flexDirection: "row", gap: 8, marginBottom: 10 }}>
                <TextInput
                  value={deliveryAddress.city}
                  onChangeText={(text) =>
                    setDeliveryAddress((prev) => ({ ...prev, city: text }))
                  }
                  placeholder="City"
                  style={{
                    flex: 1,
                    borderWidth: 1,
                    borderColor: "#e2e8f0",
                    borderRadius: 10,
                    padding: 12,
                    fontSize: 14,
                    color: "#0f1923",
                  }}
                />
                <TextInput
                  value={deliveryAddress.state}
                  onChangeText={(text) =>
                    setDeliveryAddress((prev) => ({ ...prev, state: text }))
                  }
                  placeholder="State"
                  style={{
                    flex: 1,
                    borderWidth: 1,
                    borderColor: "#e2e8f0",
                    borderRadius: 10,
                    padding: 12,
                    fontSize: 14,
                    color: "#0f1923",
                  }}
                />
              </View>

              <View style={{ flexDirection: "row", gap: 8, marginBottom: 10 }}>
                <TextInput
                  value={deliveryAddress.country}
                  onChangeText={(text) =>
                    setDeliveryAddress((prev) => ({ ...prev, country: text }))
                  }
                  placeholder="Country"
                  style={{
                    flex: 1,
                    borderWidth: 1,
                    borderColor: "#e2e8f0",
                    borderRadius: 10,
                    padding: 12,
                    fontSize: 14,
                    color: "#0f1923",
                  }}
                />
                <TextInput
                  value={deliveryAddress.postal_code}
                  onChangeText={(text) =>
                    setDeliveryAddress((prev) => ({
                      ...prev,
                      postal_code: text,
                    }))
                  }
                  placeholder="Postal code"
                  keyboardType="numeric"
                  style={{
                    flex: 1,
                    borderWidth: 1,
                    borderColor: "#e2e8f0",
                    borderRadius: 10,
                    padding: 12,
                    fontSize: 14,
                    color: "#0f1923",
                  }}
                />
              </View>
            </FieldCard>

            <FieldCard
              icon="calendar"
              iconColor="#f59e0b"
              iconBg="#fffbeb"
              label="Arrival Date & Time"
            >
              <View style={{ flexDirection: "row", gap: 8 }}>
                {/* Date picker trigger */}
                <TouchableOpacity
                  onPress={() => setShowDatePicker(true)}
                  style={{
                    flex: 1,
                    borderWidth: 1,
                    borderColor: "#e2e8f0",
                    borderRadius: 10,
                    padding: 12,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    backgroundColor: "#fff",
                  }}
                >
                  <Feather name="calendar" size={15} color="#f59e0b" />
                  <Text
                    style={{
                      fontSize: 14,
                      color: arrivalDate ? "#0f1923" : "#cbd5e1",
                    }}
                  >
                    {arrivalDate ? formatDate(arrivalDate) : "Select date"}
                  </Text>
                </TouchableOpacity>

                {/* Time picker trigger */}
                <TouchableOpacity
                  onPress={() => setShowTimePicker(true)}
                  style={{
                    flex: 1,
                    borderWidth: 1,
                    borderColor: "#e2e8f0",
                    borderRadius: 10,
                    padding: 12,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    backgroundColor: "#fff",
                  }}
                >
                  <Feather name="clock" size={15} color="#f59e0b" />
                  <Text
                    style={{
                      fontSize: 14,
                      color: arrivalTime ? "#0f1923" : "#cbd5e1",
                    }}
                  >
                    {arrivalTime ? formatTime(arrivalTime) : "Select time"}
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={{ color: "#94a3b8", fontSize: 11, marginTop: 6 }}>
                Expected arrival date and time of delivery
              </Text>

              {/* Date Picker */}
              {showDatePicker && (
                <DateTimePicker
                  value={arrivalDate || new Date()}
                  mode="date"
                  display={Platform.OS === "ios" ? "inline" : "default"}
                  minimumDate={new Date()}
                  onChange={(_, selected) => {
                    setShowDatePicker(false);
                    if (selected) setArrivalDate(selected);
                  }}
                />
              )}

              {/* Time Picker */}
              {showTimePicker && (
                <DateTimePicker
                  value={arrivalTime || new Date()}
                  mode="time"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={(_, selected) => {
                    setShowTimePicker(false);
                    if (selected) setArrivalTime(selected);
                  }}
                />
              )}
            </FieldCard>

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

            <TouchableOpacity onPress={handlePublish} disabled={submitting}>
              <LinearGradient
                colors={["#e05c97", "#c9417e"]}
                style={{
                  borderRadius: 16,
                  paddingVertical: 16,
                  alignItems: "center",
                  marginTop: 12,
                }}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text
                    style={{
                      color: "#fff",
                      fontWeight: "800",

                      fontSize: 15,
                    }}
                  >
                    Publish RFQ
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </>
        ) : (
          <>
            {loadingQuotes ? (
              [0, 1, 2].map((item) => (
                <View
                  key={item}
                  style={{
                    backgroundColor: "#fff",
                    borderRadius: 20,
                    padding: 18,
                    marginBottom: 14,
                  }}
                >
                  <View
                    style={{
                      height: 16,
                      width: "70%",
                      backgroundColor: "#e2e8f0",
                      borderRadius: 8,
                      marginBottom: 12,
                    }}
                  />
                  <View
                    style={{
                      height: 12,
                      width: "45%",
                      backgroundColor: "#eef2ff",
                      borderRadius: 6,
                      marginBottom: 18,
                    }}
                  />
                  <View style={{ flexDirection: "row", gap: 10 }}>
                    <View
                      style={{
                        flex: 1,
                        height: 44,
                        backgroundColor: "#f1f5f9",
                        borderRadius: 12,
                      }}
                    />
                    <View
                      style={{
                        flex: 1,
                        height: 44,
                        backgroundColor: "#f1f5f9",
                        borderRadius: 12,
                      }}
                    />
                  </View>
                </View>
              ))
            ) : quotesError ? (
              <View
                style={{
                  backgroundColor: "#fff1f1",
                  borderRadius: 14,
                  padding: 16,
                  marginTop: 20,
                }}
              >
                <Text style={{ color: "#ef4444", fontWeight: "700" }}>
                  Unable to load RFQs
                </Text>
                <Text style={{ color: "#64748b", marginTop: 6 }}>
                  {quotesError}
                </Text>
                <TouchableOpacity
                  onPress={fetchQuotes}
                  style={{
                    marginTop: 12,
                    backgroundColor: "#ef4444",
                    borderRadius: 10,
                    paddingVertical: 10,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: "#fff", fontWeight: "700" }}>
                    Retry
                  </Text>
                </TouchableOpacity>
              </View>
            ) : quotes.length === 0 ? (
              <View
                style={{
                  alignItems: "center",

                  marginTop: 60,
                }}
              >
                <Feather name="inbox" size={40} color="#cbd5e1" />

                <Text
                  style={{
                    color: "#94a3b8",
                    marginTop: 12,
                  }}
                >
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

      <RecipientModal
        visible={recipientModalOpen}
        onClose={() => setRecipientModalOpen(false)}
        onSelect={setRecipient}
      />
    </View>
  );
}
