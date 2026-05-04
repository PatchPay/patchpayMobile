/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import {
  getCards,
  createCard,
  updateCard,
  deleteCard,
} from "../../api/cardapi";

// ── helpers ───────────────────────────────────────────────────────────────────
const maskCardNumber = (num: string) => {
  const clean = num.replace(/\s/g, "");
  return clean.length >= 4
    ? `•••• •••• •••• ${clean.slice(-4)}`
    : "•••• •••• •••• ••••";
};

const formatCardInput = (val: string) =>
  val
    .replace(/\D/g, "")
    .slice(0, 16)
    .replace(/(.{4})/g, "$1 ")
    .trim();

const formatExpiry = (val: string) => {
  const clean = val.replace(/\D/g, "").slice(0, 4);
  return clean.length >= 3 ? `${clean.slice(0, 2)}/${clean.slice(2)}` : clean;
};

// ── card brand detector ───────────────────────────────────────────────────────
const getCardBrand = (num: string) => {
  if (/^4/.test(num)) return "VISA";
  if (/^5[1-5]/.test(num)) return "MC";
  if (/^3[47]/.test(num)) return "AMEX";
  return "CARD";
};

// ── card gradients ────────────────────────────────────────────────────────────
const CARD_GRADIENTS = [
  "bg-blue-600",
  "bg-sky-600",
  "bg-indigo-600",
  "bg-blue-800",
];

// ── empty form ────────────────────────────────────────────────────────────────
const EMPTY_FORM = {
  card_number: "",
  card_holder_name: "",
  expiry_date: "",
  cvv: "",
  billing_address: "",
};

// ── Visual Card ───────────────────────────────────────────────────────────────
const VisualCard = ({ card, index }: { card: any; index: number }) => {
  const bg = CARD_GRADIENTS[index % CARD_GRADIENTS.length];
  const brand = getCardBrand(card.card_number ?? "");

  return (
    <View className={`${bg} rounded-3xl p-6 mx-1 w-72 shadow-lg`}>
      {/* top row */}
      <View className="flex-row justify-between items-center mb-8">
        <View className="w-10 h-7 bg-yellow-300/80 rounded-md" />
        <Text className="text-white/80 font-bold text-sm tracking-widest">
          {brand}
        </Text>
      </View>

      {/* number */}
      <Text className="text-white text-lg font-mono tracking-widest mb-6">
        {maskCardNumber(card.card_number ?? "")}
      </Text>

      {/* bottom row */}
      <View className="flex-row justify-between items-end">
        <View>
          <Text className="text-white/50 text-[9px] uppercase tracking-widest mb-0.5">
            Card Holder
          </Text>
          <Text className="text-white font-semibold text-sm tracking-wide uppercase">
            {card.card_holder_name || "—"}
          </Text>
        </View>
        <View className="items-end">
          <Text className="text-white/50 text-[9px] uppercase tracking-widest mb-0.5">
            Expires
          </Text>
          <Text className="text-white font-semibold text-sm">
            {card.expiry_date || "—"}
          </Text>
        </View>
      </View>
    </View>
  );
};

// ── Input field ───────────────────────────────────────────────────────────────
const Field = ({
  label,
  icon,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  maxLength,
  secureTextEntry,
}: any) => (
  <View className="mb-4">
    <Text className="text-slate-500 text-[10px] uppercase tracking-widest mb-1.5">
      {label}
    </Text>
    <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 gap-3">
      <Feather name={icon} size={15} color="#94a3b8" />
      <TextInput
        className="flex-1 text-slate-800 text-sm font-medium"
        placeholder={placeholder}
        placeholderTextColor="#cbd5e1"
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType ?? "default"}
        maxLength={maxLength}
        secureTextEntry={secureTextEntry}
        autoCapitalize="characters"
      />
    </View>
  </View>
);

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function CardScreen() {
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // ── fetch ──────────────────────────────────────────────────────────────────
  const fetchCards = async () => {
    try {
      setLoading(true);
      const data = await getCards();
      setCards(Array.isArray(data) ? data : []);
    } catch (e) {
      console.log("Fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCards();
  }, []);

  // ── open modal ─────────────────────────────────────────────────────────────
  const openAdd = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setModalVisible(true);
  };

  const openEdit = (card: any) => {
    setEditTarget(card);
    setForm({
      card_number: card.card_number ?? "",
      card_holder_name: card.card_holder_name ?? "",
      expiry_date: card.expiry_date ?? "",
      cvv: card.cvv ?? "",
      billing_address: card.billing_address ?? "",
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (
      !form.card_number ||
      !form.card_holder_name ||
      !form.expiry_date ||
      !form.cvv
    ) {
      Alert.alert("Missing fields", "Please fill in all required fields.");
      return;
    }

    try {
      setSaving(true);

      if (editTarget) {
        await updateCard(editTarget._id, form);
      } else {
        await createCard(form);
      }

      setModalVisible(false);
      fetchCards();
    } catch (e) {
      console.log(e);
      Alert.alert("Error", "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  // ── delete ─────────────────────────────────────────────────────────────────
  const handleDelete = (card: any) => {
    Alert.alert(
      "Delete Card",
      `Remove card ending in ${(card.card_number ?? "").slice(-4)}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteCard(card._id);
              fetchCards();
            } catch (e) {
              Alert.alert("Error", "Could not delete card.");
            }
          },
        },
      ],
    );
  };

  return (
    <View className="flex-1 bg-white">
      <StatusBar barStyle="light-content" backgroundColor="#2563eb" />

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <View className="bg-blue-600 pt-14 pb-6 px-6 rounded-b-[32px]">
        <View className="flex-row justify-between items-center mb-1">
          <Text className="text-white text-xl font-bold">My Cards</Text>
          <TouchableOpacity
            onPress={openAdd}
            className="flex-row items-center gap-2 bg-white/20 px-4 py-2 rounded-xl"
          >
            <Feather name="plus" size={14} color="#fff" />
            <Text className="text-white text-xs font-semibold">Add Card</Text>
          </TouchableOpacity>
        </View>
        <Text className="text-sky-200 text-xs">
          {cards.length} saved card{cards.length !== 1 ? "s" : ""}
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-10"
      >
        {/* ── Card carousel ──────────────────────────────────────────────── */}
        {loading ? (
          <View className="items-center py-16">
            <ActivityIndicator size="large" color="#2563eb" />
            <Text className="text-slate-400 text-sm mt-3">Loading cards…</Text>
          </View>
        ) : cards.length === 0 ? (
          <View className="items-center py-20 px-8">
            <View className="w-16 h-16 rounded-2xl bg-sky-50 items-center justify-center mb-4">
              <Feather name="credit-card" size={28} color="#0ea5e9" />
            </View>
            <Text className="text-slate-800 font-bold text-base mb-1">
              No cards yet
            </Text>
            <Text className="text-slate-400 text-sm text-center">
              Tap &ldquo;Add Card&#34; to save your first payment card.
            </Text>
          </View>
        ) : (
          <>
            {/* Horizontal scroll of visual cards */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerClassName="px-5 pt-6 pb-4 gap-4"
            >
              {cards.map((card, i) => (
                <VisualCard key={card._id} card={card} index={i} />
              ))}
            </ScrollView>

            {/* ── Card list ──────────────────────────────────────────────── */}
            <View className="px-5 mt-2">
              <Text className="text-slate-400 text-[10px] uppercase tracking-widest mb-3">
                All Cards
              </Text>
              {cards.map((card, i) => (
                <View
                  key={card._id}
                  className="bg-white border border-slate-100 rounded-2xl px-5 py-4 mb-3 shadow-sm shadow-slate-100"
                >
                  <View className="flex-row items-center justify-between mb-3">
                    <View className="flex-row items-center gap-3">
                      <View
                        className={`w-10 h-10 rounded-xl ${
                          CARD_GRADIENTS[i % CARD_GRADIENTS.length]
                        } items-center justify-center`}
                      >
                        <Feather name="credit-card" size={16} color="#fff" />
                      </View>
                      <View>
                        <Text className="text-slate-800 font-semibold text-sm">
                          {maskCardNumber(card.card_number ?? "")}
                        </Text>
                        <Text className="text-slate-400 text-xs">
                          {card.card_holder_name || "—"}
                        </Text>
                      </View>
                    </View>
                    <View className="flex-row gap-2">
                      <TouchableOpacity
                        onPress={() => openEdit(card)}
                        className="w-8 h-8 rounded-xl bg-sky-50 items-center justify-center"
                      >
                        <Feather name="edit-2" size={13} color="#0ea5e9" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDelete(card)}
                        className="w-8 h-8 rounded-xl bg-red-50 items-center justify-center"
                      >
                        <Feather name="trash-2" size={13} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View className="flex-row gap-4 pt-3 border-t border-slate-50">
                    <View>
                      <Text className="text-slate-400 text-[9px] uppercase tracking-widest mb-0.5">
                        Expires
                      </Text>
                      <Text className="text-slate-700 text-xs font-semibold">
                        {card.expiry_date || "—"}
                      </Text>
                    </View>
                    <View>
                      <Text className="text-slate-400 text-[9px] uppercase tracking-widest mb-0.5">
                        Brand
                      </Text>
                      <Text className="text-slate-700 text-xs font-semibold">
                        {getCardBrand(card.card_number ?? "")}
                      </Text>
                    </View>
                    {card.billing_address ? (
                      <View className="flex-1">
                        <Text className="text-slate-400 text-[9px] uppercase tracking-widest mb-0.5">
                          Billing Address
                        </Text>
                        <Text
                          className="text-slate-700 text-xs font-semibold"
                          numberOfLines={1}
                        >
                          {card.billing_address}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>

      {/* ── Add / Edit Modal ─────────────────────────────────────────────── */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 bg-white">
          {/* Modal header */}
          <View className="bg-blue-600 pt-12 pb-5 px-6 flex-row justify-between items-center rounded-b-3xl">
            <Text className="text-white text-lg font-bold">
              {editTarget ? "Edit Card" : "Add New Card"}
            </Text>
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              className="w-8 h-8 rounded-full bg-white/20 items-center justify-center"
            >
              <Feather name="x" size={16} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Preview mini card */}
          <View className="mx-6 mt-6 bg-blue-600 rounded-2xl p-5 mb-6">
            <Text className="text-white font-mono text-base tracking-widest mb-3">
              {form.card_number
                ? maskCardNumber(form.card_number)
                : "•••• •••• •••• ••••"}
            </Text>
            <View className="flex-row justify-between">
              <Text className="text-sky-200 text-xs uppercase tracking-wider">
                {form.card_holder_name || "FULL NAME"}
              </Text>
              <Text className="text-sky-200 text-xs">
                {form.expiry_date || "MM/YY"}
              </Text>
            </View>
          </View>

          <ScrollView
            className="flex-1 px-6"
            showsVerticalScrollIndicator={false}
          >
            <Field
              label="Card Number *"
              icon="credit-card"
              placeholder="1234 5678 9012 3456"
              value={form.card_number}
              onChangeText={(v: string) =>
                setForm((f) => ({ ...f, card_number: formatCardInput(v) }))
              }
              keyboardType="numeric"
              maxLength={19}
            />
            <Field
              label="Card Holder Name *"
              icon="user"
              placeholder="JOHN DOE"
              value={form.card_holder_name}
              onChangeText={(v: string) =>
                setForm((f) => ({ ...f, card_holder_name: v }))
              }
            />
            <View className="flex-row gap-4">
              <View className="flex-1">
                <Field
                  label="Expiry Date *"
                  icon="calendar"
                  placeholder="MM/YY"
                  value={form.expiry_date}
                  onChangeText={(v: string) =>
                    setForm((f) => ({ ...f, expiry_date: formatExpiry(v) }))
                  }
                  keyboardType="numeric"
                  maxLength={5}
                />
              </View>
              <View className="flex-1">
                <Field
                  label="CVV *"
                  icon="lock"
                  placeholder="•••"
                  value={form.cvv}
                  onChangeText={(v: string) =>
                    setForm((f) => ({
                      ...f,
                      cvv: v.replace(/\D/g, "").slice(0, 4),
                    }))
                  }
                  keyboardType="numeric"
                  maxLength={4}
                  secureTextEntry
                />
              </View>
            </View>
            <Field
              label="Billing Address"
              icon="map-pin"
              placeholder="123 Main St, City"
              value={form.billing_address}
              onChangeText={(v: string) =>
                setForm((f) => ({ ...f, billing_address: v }))
              }
            />

            <TouchableOpacity
              onPress={handleSave}
              disabled={saving}
              className="bg-blue-600 rounded-2xl py-4 items-center mt-2 mb-8"
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white font-bold text-sm">
                  {editTarget ? "Save Changes" : "Add Card"}
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
