/* eslint-disable react-hooks/exhaustive-deps */
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

interface SavedCard {
  id: string | number;
  card_number: string;
  card_holder_name: string;
  expiry_date: string;
  billing_address: string;
}

interface CardForm {
  card_number: string;
  card_holder_name: string;
  expiry_date: string;
  cvv: string;
  billing_address: string;
}

const initialForm: CardForm = {
  card_number: "",
  card_holder_name: "",
  expiry_date: "",
  cvv: "",
  billing_address: "",
};

export default function SavedCardsScreen() {
  const [cards, setCards] = useState<SavedCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingCard, setEditingCard] = useState<SavedCard | null>(null);
  const [form, setForm] = useState<CardForm>(initialForm);

  const getApi = async () => {
    const token =
      (await AsyncStorage.getItem("authToken")) ||
      (await AsyncStorage.getItem("token"));

    return axios.create({
      baseURL: API_URL,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
  };

  const fetchCards = async () => {
    try {
      const api = await getApi();

      const response = await api.get("/card/card-details");

      const result =
        response.data?.data?.cards ||
        response.data?.data ||
        response.data?.cardDetails ||
        response.data;

      setCards(Array.isArray(result) ? result : []);
    } catch (error: any) {
      console.log("FETCH CARDS ERROR:", error.response?.data || error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchCards();
    }, []),
  );

  const refreshCards = () => {
    setRefreshing(true);
    fetchCards();
  };

  const updateForm = (key: keyof CardForm, value: string) => {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const openAddModal = () => {
    setEditingCard(null);
    setForm(initialForm);
    setModalVisible(true);
  };

  const openEditModal = (card: SavedCard) => {
    setEditingCard(card);

    setForm({
      card_number: card.card_number || "",
      card_holder_name: card.card_holder_name || "",
      expiry_date: card.expiry_date || "",
      cvv: "",
      billing_address: card.billing_address || "",
    });

    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingCard(null);
    setForm(initialForm);
  };

  const validateForm = () => {
    if (
      !form.card_number.trim() ||
      !form.card_holder_name.trim() ||
      !form.expiry_date.trim() ||
      !form.billing_address.trim()
    ) {
      Alert.alert("Missing information", "Please fill in all card details.");
      return false;
    }

    if (!editingCard && !form.cvv.trim()) {
      Alert.alert("Missing CVV", "Please enter your card CVV.");
      return false;
    }

    const cardNumber = form.card_number.replace(/\s/g, "");

    if (!/^\d{12,19}$/.test(cardNumber)) {
      Alert.alert("Invalid card", "Please enter a valid card number.");
      return false;
    }

    if (!/^(0[1-9]|1[0-2])\/\d{2,4}$/.test(form.expiry_date)) {
      Alert.alert("Invalid expiry date", "Use MM/YY format.");
      return false;
    }

    if (form.cvv && !/^\d{3,4}$/.test(form.cvv)) {
      Alert.alert("Invalid CVV", "Please enter a valid CVV.");
      return false;
    }

    return true;
  };

  const saveCard = async () => {
    if (!validateForm()) return;

    try {
      setSaving(true);

      const api = await getApi();

      const payload = {
        card_number: form.card_number.replace(/\s/g, ""),
        card_holder_name: form.card_holder_name.trim(),
        expiry_date: form.expiry_date.trim(),
        cvv: form.cvv.trim(),
        billing_address: form.billing_address.trim(),
      };

      if (editingCard) {
        await api.put(`/card/card-details/${editingCard.id}`, payload);

        Alert.alert("Success", "Card details updated successfully.");
      } else {
        await api.post("/card/card-details", payload);

        Alert.alert("Success", "Card added successfully.");
      }

      closeModal();
      await fetchCards();
    } catch (error: any) {
      console.log("SAVE CARD ERROR:", error?.response?.message);

      Alert.alert(
        "Unable to save card",
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Something went wrong. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteCard = (card: SavedCard) => {
    Alert.alert("Delete card", "Are you sure you want to remove this card?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const api = await getApi();

            await api.delete(`/card/card-details/${card.id}`);

            setCards((previous) =>
              previous.filter((item) => item.id !== card.id),
            );

            Alert.alert("Success", "Card deleted successfully.");
          } catch (error: any) {
            Alert.alert(
              "Error",
              error.response?.data?.message ||
                error.response?.data?.error ||
                "Unable to delete card.",
            );
          }
        },
      },
    ]);
  };

  const getCardBrand = (number: string) => {
    const value = number?.replace(/\s/g, "") || "";

    if (/^4/.test(value)) return "Visa";
    if (/^(5[1-5]|2)/.test(value)) return "Mastercard";
    if (/^506|^507|^650/.test(value)) return "Verve";

    return "Bank Card";
  };

  const getBrandColor = (brand: string) => {
    if (brand === "Visa") return "#1A1F71";
    if (brand === "Mastercard") return "#EB001B";
    if (brand === "Verve") return "#5B2C83";

    return "#25166B";
  };

  const maskCardNumber = (number: string) => {
    const digits = number?.replace(/\s/g, "") || "";

    return `•••• •••• •••• ${digits.slice(-4)}`;
  };

  const renderCard = ({ item }: { item: SavedCard }) => {
    const brand = getCardBrand(item.card_number);

    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View
            style={[
              styles.brandIcon,
              { backgroundColor: getBrandColor(brand) },
            ]}
          >
            <Ionicons name="card" size={21} color="#FFFFFF" />
          </View>

          <View style={styles.cardActions}>
            <Pressable
              style={styles.actionButton}
              onPress={() => openEditModal(item)}
            >
              <Ionicons name="create-outline" size={20} color="#25166B" />
            </Pressable>

            <Pressable
              style={styles.actionButton}
              onPress={() => deleteCard(item)}
            >
              <Ionicons name="trash-outline" size={20} color="#DC3545" />
            </Pressable>
          </View>
        </View>

        <Text style={styles.brandName}>{brand}</Text>

        <Text style={styles.cardNumber}>
          {maskCardNumber(item.card_number)}
        </Text>

        <View style={styles.cardBottom}>
          <View style={styles.cardInfo}>
            <Text style={styles.smallLabel}>CARDHOLDER</Text>
            <Text style={styles.cardHolder}>{item.card_holder_name}</Text>
          </View>

          <View>
            <Text style={styles.smallLabel}>EXPIRES</Text>
            <Text style={styles.cardHolder}>{item.expiry_date}</Text>
          </View>
        </View>

        <View style={styles.billingRow}>
          <Ionicons name="location-outline" size={15} color="#8A8797" />
          <Text style={styles.billingAddress} numberOfLines={1}>
            {item.billing_address}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Saved Cards</Text>

        <Text style={styles.subtitle}>
          Manage your payment cards and billing information.
        </Text>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>My cards</Text>

        <Text style={styles.cardCount}>
          {cards.length} {cards.length === 1 ? "card" : "cards"}
        </Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#25166B" />
        </View>
      ) : (
        <FlatList
          data={cards}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderCard}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refreshCards}
              tintColor="#25166B"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIcon}>
                <Ionicons name="card-outline" size={36} color="#25166B" />
              </View>

              <Text style={styles.emptyTitle}>No saved cards yet</Text>

              <Text style={styles.emptyDescription}>
                Add your payment card to manage your billing details here.
              </Text>
            </View>
          }
          ListFooterComponent={
            <View style={styles.footer}>
              <Pressable style={styles.addButton} onPress={openAddModal}>
                <Ionicons name="add" size={22} color="#FFFFFF" />
                <Text style={styles.addButtonText}>Add new card</Text>
              </Pressable>

              <View style={styles.securityNote}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={19}
                  color="#168451"
                />

                <Text style={styles.securityText}>
                  Use a secure, PCI-compliant payment provider to handle card
                  details.
                </Text>
              </View>
            </View>
          }
        />
      )}

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeModal}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingCard ? "Edit card details" : "Add a new card"}
              </Text>

              <Pressable onPress={closeModal}>
                <Ionicons name="close" size={24} color="#333333" />
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.modalDescription}>
                Enter your card and billing information below.
              </Text>

              <Text style={styles.inputLabel}>Cardholder name</Text>

              <TextInput
                style={styles.input}
                value={form.card_holder_name}
                onChangeText={(value) => updateForm("card_holder_name", value)}
                placeholder="Name on card"
                placeholderTextColor="#999"
                autoCapitalize="words"
              />

              <Text style={styles.inputLabel}>Card number</Text>

              <TextInput
                style={styles.input}
                value={form.card_number}
                onChangeText={(value) =>
                  updateForm(
                    "card_number",
                    value.replace(/\D/g, "").slice(0, 19),
                  )
                }
                placeholder="Enter card number"
                placeholderTextColor="#999"
                keyboardType="number-pad"
                maxLength={19}
              />

              <View style={styles.inputRow}>
                <View style={styles.inputColumn}>
                  <Text style={styles.inputLabel}>Expiry date</Text>

                  <TextInput
                    style={styles.input}
                    value={form.expiry_date}
                    onChangeText={(value) => {
                      const digits = value.replace(/\D/g, "").slice(0, 4);

                      const formatted =
                        digits.length > 2
                          ? `${digits.slice(0, 2)}/${digits.slice(2)}`
                          : digits;

                      updateForm("expiry_date", formatted);
                    }}
                    placeholder="MM/YY"
                    placeholderTextColor="#999"
                    keyboardType="number-pad"
                    maxLength={5}
                  />
                </View>

                <View style={styles.inputColumn}>
                  <Text style={styles.inputLabel}>CVV</Text>

                  <TextInput
                    style={styles.input}
                    value={form.cvv}
                    onChangeText={(value) =>
                      updateForm("cvv", value.replace(/\D/g, "").slice(0, 4))
                    }
                    placeholder="CVV"
                    placeholderTextColor="#999"
                    keyboardType="number-pad"
                    secureTextEntry
                    maxLength={4}
                  />
                </View>
              </View>

              <Text style={styles.inputLabel}>Billing address</Text>

              <TextInput
                style={[styles.input, styles.addressInput]}
                value={form.billing_address}
                onChangeText={(value) => updateForm("billing_address", value)}
                placeholder="Enter your billing address"
                placeholderTextColor="#999"
                multiline
                textAlignVertical="top"
              />

              <Pressable
                style={[styles.confirmButton, saving && { opacity: 0.6 }]}
                onPress={saveCard}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons
                      name="checkmark-circle-outline"
                      size={19}
                      color="#FFFFFF"
                    />

                    <Text style={styles.confirmButtonText}>
                      {editingCard ? "Update card" : "Save card"}
                    </Text>
                  </>
                )}
              </Pressable>

              <View style={styles.modalFootnoteContainer}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={17}
                  color="#168451"
                />

                <Text style={styles.modalFootnote}>
                  Never store your CVV or full card number on your application
                  server. Use Squad tokenization for real cards.
                </Text>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F7FB",
    paddingTop: 55,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 28,
  },
  title: {
    fontSize: 25,
    fontWeight: "800",
    color: "#19152D",
  },
  subtitle: {
    color: "#858294",
    fontSize: 13,
    marginTop: 7,
    lineHeight: 20,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#19152D",
  },
  cardCount: {
    fontSize: 12,
    color: "#858294",
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    flexGrow: 1,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#ECEBF2",
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  brandIcon: {
    width: 42,
    height: 32,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  cardActions: {
    flexDirection: "row",
    gap: 16,
  },
  actionButton: {
    padding: 4,
  },
  brandName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#29263B",
    marginTop: 17,
  },
  cardNumber: {
    fontSize: 19,
    fontWeight: "700",
    letterSpacing: 2,
    color: "#19152D",
    marginTop: 9,
  },
  cardBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 22,
  },
  cardInfo: {
    flex: 1,
    paddingRight: 10,
  },
  smallLabel: {
    color: "#9996A5",
    fontSize: 9,
    fontWeight: "700",
    marginBottom: 6,
  },
  cardHolder: {
    color: "#373448",
    fontSize: 12,
    fontWeight: "600",
  },
  billingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    borderTopWidth: 1,
    borderTopColor: "#F0EFF4",
    marginTop: 17,
    paddingTop: 13,
  },
  billingAddress: {
    flex: 1,
    color: "#8A8797",
    fontSize: 11,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 55,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    width: 75,
    height: 75,
    backgroundColor: "#EFEDFA",
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 17,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#19152D",
  },
  emptyDescription: {
    color: "#8A8797",
    fontSize: 12,
    lineHeight: 20,
    textAlign: "center",
    marginTop: 8,
  },
  footer: {
    marginTop: 10,
  },
  addButton: {
    height: 54,
    backgroundColor: "#25166B",
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 9,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  securityNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    marginTop: 18,
    paddingHorizontal: 4,
  },
  securityText: {
    flex: 1,
    fontSize: 10,
    color: "#888596",
    lineHeight: 16,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  modal: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 22,
    paddingBottom: 30,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: "#19152D",
  },
  modalDescription: {
    fontSize: 12,
    lineHeight: 19,
    color: "#858294",
    marginTop: 12,
    marginBottom: 22,
  },
  inputLabel: {
    color: "#373448",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 9,
  },
  input: {
    minHeight: 51,
    borderWidth: 1,
    borderColor: "#E5E3EC",
    borderRadius: 11,
    paddingHorizontal: 14,
    fontSize: 14,
    color: "#19152D",
    marginBottom: 17,
    backgroundColor: "#FFFFFF",
  },
  inputRow: {
    flexDirection: "row",
    gap: 12,
  },
  inputColumn: {
    flex: 1,
  },
  addressInput: {
    minHeight: 85,
    paddingTop: 13,
  },
  confirmButton: {
    height: 53,
    borderRadius: 11,
    backgroundColor: "#25166B",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    marginTop: 5,
  },
  confirmButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 13,
  },
  modalFootnoteContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginTop: 15,
  },
  modalFootnote: {
    flex: 1,
    color: "#9693A1",
    fontSize: 10,
    lineHeight: 16,
  },
});
