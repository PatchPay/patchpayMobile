import { Feather } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import {
  createCard,
  deleteCard,
  getCards,
  updateCard,
} from "../../api/cardapi";

// ─── Theme: shared with HomeScreen ───────────────────────────────────────────

const C = {
  headerBg: "#161966",
  blue: "#3F58F7",
  blueSoft: "#EEF1FF",
  barIdle: "#C9D1FD",
  tile: "#F5F7FF",
  ink: "#0F172A",
  text: "#334155",
  muted: "#64748B",
  faint: "#94A3B8",
  line: "#E2E8F0",
  bg: "#FFFFFF",
  green: "#15803D",
  red: "#DC2626",
  white: "#FFFFFF",
  whiteSoft: "rgba(255,255,255,0.72)",
  whiteChip: "rgba(255,255,255,0.14)",
} as const;

const CARD_COLORS = ["#161966", "#3F58F7", "#26348F", "#20266D"];

type CardForm = {
  card_number: string;
  card_holder_name: string;
  expiry_date: string;
  cvv: string;
  billing_address: string;
};

type CardItem = CardForm & {
  id: string;
  [key: string]: any;
};

const EMPTY_FORM: CardForm = {
  card_number: "",
  card_holder_name: "",
  expiry_date: "",
  cvv: "",
  billing_address: "",
};

// ─── Helpers ────────────────────────────────────────────────────────────────

const maskCardNumber = (num: string = "") => {
  const clean = num.replace(/\s/g, "");

  return clean.length >= 4
    ? `•••• •••• •••• ${clean.slice(-4)}`
    : "•••• •••• •••• ••••";
};

const formatCardInput = (value: string) =>
  value
    .replace(/\D/g, "")
    .slice(0, 16)
    .replace(/(.{4})/g, "$1 ")
    .trim();

const formatExpiry = (value: string) => {
  const clean = value.replace(/\D/g, "").slice(0, 4);

  return clean.length >= 3 ? `${clean.slice(0, 2)}/${clean.slice(2)}` : clean;
};

const getCardBrand = (num: string = "") => {
  const clean = num.replace(/\s/g, "");

  if (/^4/.test(clean)) return "VISA";
  if (/^5[1-5]/.test(clean)) return "MASTERCARD";
  if (/^3[47]/.test(clean)) return "AMEX";

  return "BANK CARD";
};

// ─── Reusable section heading ────────────────────────────────────────────────

const SectionHeading = ({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) => (
  <View style={styles.sectionHeading}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
  </View>
);

// ─── Visual bank card ────────────────────────────────────────────────────────

const VisualCard = ({ card, index }: { card: CardItem; index: number }) => {
  const backgroundColor = CARD_COLORS[index % CARD_COLORS.length];

  return (
    <View style={[styles.visualCard, { backgroundColor }]}>
      <View style={styles.visualCardTop}>
        <View style={styles.chipOuter}>
          <View style={styles.chipLineVertical} />
          <View style={styles.chipLineHorizontal} />
        </View>

        <View style={styles.brandBadge}>
          <Text style={styles.brandText}>{getCardBrand(card.card_number)}</Text>
        </View>
      </View>

      <View style={styles.cardNumberContainer}>
        <Feather name="credit-card" size={17} color={C.whiteSoft} />

        <Text style={styles.cardNumber}>
          {maskCardNumber(card.card_number)}
        </Text>
      </View>

      <View style={styles.visualCardBottom}>
        <View style={styles.cardHolderContainer}>
          <Text style={styles.cardMetaLabel}>CARD HOLDER</Text>

          <Text style={styles.cardHolderName} numberOfLines={1}>
            {(card.card_holder_name || "YOUR NAME").toUpperCase()}
          </Text>
        </View>

        <View style={styles.expiryContainer}>
          <Text style={styles.cardMetaLabel}>EXPIRES</Text>

          <Text style={styles.expiryText}>{card.expiry_date || "MM/YY"}</Text>
        </View>
      </View>

      <View style={styles.cardDecorationOne} />
      <View style={styles.cardDecorationTwo} />
    </View>
  );
};

// ─── Reusable form field ─────────────────────────────────────────────────────

type FieldProps = {
  label: string;
  icon: React.ComponentProps<typeof Feather>["name"];
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: "default" | "numeric" | "number-pad";
  maxLength?: number;
  secureTextEntry?: boolean;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
};

const Field = ({
  label,
  icon,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
  maxLength,
  secureTextEntry = false,
  autoCapitalize = "words",
}: FieldProps) => (
  <View style={styles.fieldContainer}>
    <Text style={styles.fieldLabel}>{label}</Text>

    <View style={styles.inputContainer}>
      <Feather name={icon} size={17} color={C.muted} />

      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={C.faint}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        maxLength={maxLength}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
      />
    </View>
  </View>
);

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function CardScreen() {
  const [cards, setCards] = useState<CardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editTarget, setEditTarget] = useState<CardItem | null>(null);
  const [form, setForm] = useState<CardForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // ─── Fetch cards ──────────────────────────────────────────────────────────

  const fetchCards = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);

      const response = await getCards();

      // Supports a direct array and common API response wrappers.
      const list = Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response?.data?.content)
            ? response.data.content
            : Array.isArray(response?.data?.cards)
              ? response.data.cards
              : Array.isArray(response?.content)
                ? response.content
                : Array.isArray(response?.cards)
                  ? response.cards
                  : [];

      setCards(list);
    } catch (error) {
      console.log("Fetch cards error:", error);
      Alert.alert("Unable to load cards", "Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCards(false);
  };

  // ─── Add card ─────────────────────────────────────────────────────────────

  const openAdd = () => {
    setEditTarget(null);
    setForm({ ...EMPTY_FORM });
    setModalVisible(true);
  };

  // ─── Edit card ────────────────────────────────────────────────────────────

  const openEdit = (card: CardItem) => {
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

  // ─── Save card ────────────────────────────────────────────────────────────

  const handleSave = async () => {
    const cleanNumber = form.card_number.replace(/\s/g, "");

    if (
      !cleanNumber ||
      !form.card_holder_name.trim() ||
      !form.expiry_date ||
      !form.cvv
    ) {
      Alert.alert("Missing fields", "Please fill in all required fields.");
      return;
    }

    if (!/^\d{16}$/.test(cleanNumber)) {
      Alert.alert("Invalid card number", "Enter a valid 16-digit card number.");
      return;
    }

    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(form.expiry_date)) {
      Alert.alert(
        "Invalid expiry date",
        "Enter the expiry date in MM/YY format.",
      );
      return;
    }

    if (!/^\d{3,4}$/.test(form.cvv)) {
      Alert.alert("Invalid CVV", "Enter a valid 3 or 4 digit security code.");
      return;
    }

    const [month, year] = form.expiry_date.split("/").map(Number);
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear() % 100;

    if (year < currentYear || (year === currentYear && month < currentMonth)) {
      Alert.alert("Card expired", "Please enter a card that has not expired.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        ...form,
        card_number: cleanNumber,
        card_holder_name: form.card_holder_name.trim(),
        billing_address: form.billing_address.trim(),
      };

      if (editTarget) {
        await updateCard(editTarget.id, payload);
      } else {
        await createCard(payload);
      }

      setModalVisible(false);
      setForm({ ...EMPTY_FORM });
      setEditTarget(null);

      await fetchCards(false);

      Alert.alert(
        "Success",
        editTarget
          ? "Your card has been updated."
          : "Your card has been added.",
      );
    } catch (error) {
      console.log("Save card error:", error);

      Alert.alert(
        "Unable to save card",
        "Something went wrong. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  // ─── Delete card ──────────────────────────────────────────────────────────

  const handleDelete = (card: CardItem) => {
    Alert.alert(
      "Delete card",
      `Remove the card ending in ${(card.card_number ?? "").replace(/\s/g, "").slice(-4)}?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteCard(card.id);
              await fetchCards(false);

              Alert.alert("Card removed", "Your card has been deleted.");
            } catch (error) {
              console.log("Delete card error:", error);

              Alert.alert("Unable to delete card", "Please try again.");
            }
          },
        },
      ],
    );
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={C.headerBg} />

      <ScrollView
        style={styles.scrollView}
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
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.headerTitleContainer}>
              <View style={styles.headerIcon}>
                <Feather name="credit-card" size={22} color={C.white} />
              </View>

              <View style={styles.headerTextContainer}>
                <Text style={styles.headerEyebrow}>PAYMENT METHODS</Text>

                <Text style={styles.headerTitle}>My Cards</Text>

                <Text style={styles.headerSubtitle}>
                  Manage your saved cards
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={openAdd}
              activeOpacity={0.8}
              style={styles.addButton}
              accessibilityRole="button"
              accessibilityLabel="Add a new card"
            >
              <Feather name="plus" size={17} color={C.white} />
              <Text style={styles.addButtonText}>Add Card</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.headerStats}>
            <View>
              <Text style={styles.statLabel}>SAVED CARDS</Text>
              <Text style={styles.statValue}>
                {loading ? "—" : String(cards.length).padStart(2, "0")}
              </Text>
            </View>

            <View style={styles.headerStatIcon}>
              <Feather name="shield" size={22} color={C.white} />
            </View>
          </View>

          <View style={styles.headerDecorationOne} />
          <View style={styles.headerDecorationTwo} />
        </View>

        {/* Main content */}
        <View style={styles.content}>
          <SectionHeading
            title="Your cards"
            subtitle="A quick overview of your saved payment methods."
          />

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={C.blue} />

              <Text style={styles.loadingText}>Loading your cards...</Text>
            </View>
          ) : cards.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconContainer}>
                <Feather name="credit-card" size={30} color={C.blue} />
              </View>

              <Text style={styles.emptyTitle}>No cards yet</Text>

              <Text style={styles.emptyDescription}>
                Add a payment card to get started. Your saved cards will appear
                here.
              </Text>

              <TouchableOpacity
                onPress={openAdd}
                activeOpacity={0.8}
                style={styles.emptyButton}
              >
                <Feather name="plus" size={17} color={C.white} />
                <Text style={styles.emptyButtonText}>Add your first card</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* Card carousel */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.carouselContent}
                snapToInterval={306}
                decelerationRate="fast"
              >
                {cards.map((card, index) => (
                  <View key={card.id ?? index} style={styles.carouselItem}>
                    <VisualCard card={card} index={index} />
                  </View>
                ))}
              </ScrollView>

              {/* Saved card list */}
              <View style={styles.listHeading}>
                <Text style={styles.listTitle}>All cards</Text>

                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{cards.length}</Text>
                </View>
              </View>

              {cards.map((card, index) => (
                <View key={card.id ?? index} style={styles.cardListItem}>
                  <View style={styles.cardListTop}>
                    <View style={styles.cardInfo}>
                      <View
                        style={[
                          styles.cardListIcon,
                          {
                            backgroundColor:
                              index % 2 === 0 ? C.blueSoft : "#E8EEFF",
                          },
                        ]}
                      >
                        <Feather name="credit-card" size={19} color={C.blue} />
                      </View>

                      <View style={styles.cardInfoText}>
                        <Text style={styles.savedCardNumber}>
                          {maskCardNumber(card.card_number)}
                        </Text>

                        <Text style={styles.savedCardHolder} numberOfLines={1}>
                          {card.card_holder_name || "Card holder"}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.cardActions}>
                      <TouchableOpacity
                        onPress={() => openEdit(card)}
                        activeOpacity={0.7}
                        style={styles.editButton}
                        accessibilityRole="button"
                        accessibilityLabel="Edit card"
                      >
                        <Feather name="edit-2" size={16} color={C.blue} />
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => handleDelete(card)}
                        activeOpacity={0.7}
                        style={styles.deleteButton}
                        accessibilityRole="button"
                        accessibilityLabel="Delete card"
                      >
                        <Feather name="trash-2" size={16} color={C.red} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.cardDetailsDivider} />

                  <View style={styles.cardDetails}>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>BRAND</Text>

                      <Text style={styles.detailValue}>
                        {getCardBrand(card.card_number)}
                      </Text>
                    </View>

                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>EXPIRES</Text>

                      <Text style={styles.detailValue}>
                        {card.expiry_date || "—"}
                      </Text>
                    </View>

                    {card.billing_address ? (
                      <View style={styles.billingDetail}>
                        <Text style={styles.detailLabel}>BILLING ADDRESS</Text>

                        <Text style={styles.detailValue} numberOfLines={1}>
                          {card.billing_address}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              ))}
            </>
          )}

          {/* Security information */}
          <View style={styles.securityCard}>
            <View style={styles.securityIcon}>
              <Feather name="shield" size={20} color={C.green} />
            </View>

            <View style={styles.securityTextContainer}>
              <Text style={styles.securityTitle}>Keep your cards secure</Text>

              <Text style={styles.securityDescription}>
                Only use trusted payment services and never share your card
                security code with anyone.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Add / Edit modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          if (!saving) setModalVisible(false);
        }}
      >
        <View style={styles.modalScreen}>
          <StatusBar barStyle="light-content" backgroundColor={C.headerBg} />

          {/* Modal header */}
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderText}>
              <Text style={styles.modalEyebrow}>PAYMENT METHODS</Text>

              <Text style={styles.modalTitle}>
                {editTarget ? "Edit card" : "Add new card"}
              </Text>

              <Text style={styles.modalSubtitle}>
                Enter your card details below.
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              disabled={saving}
              activeOpacity={0.7}
              style={styles.closeButton}
              accessibilityRole="button"
              accessibilityLabel="Close modal"
            >
              <Feather name="x" size={21} color={C.white} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalScroll}
            contentContainerStyle={styles.modalContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Live preview */}
            <Text style={styles.previewLabel}>CARD PREVIEW</Text>

            <View
              style={[
                styles.previewCard,
                {
                  backgroundColor:
                    CARD_COLORS[
                      cards.findIndex((card) => card.id === editTarget?.id) >= 0
                        ? cards.findIndex(
                            (card) => card.id === editTarget?.id,
                          ) % CARD_COLORS.length
                        : 1
                    ],
                },
              ]}
            >
              <View style={styles.previewCardTop}>
                <View style={styles.chipOuter}>
                  <View style={styles.chipLineVertical} />
                  <View style={styles.chipLineHorizontal} />
                </View>

                <Text style={styles.previewBrand}>
                  {getCardBrand(form.card_number)}
                </Text>
              </View>

              <Text style={styles.previewNumber}>
                {form.card_number
                  ? maskCardNumber(form.card_number)
                  : "•••• •••• •••• ••••"}
              </Text>

              <View style={styles.previewBottom}>
                <View style={styles.previewHolderContainer}>
                  <Text style={styles.cardMetaLabel}>CARD HOLDER</Text>

                  <Text style={styles.cardHolderName} numberOfLines={1}>
                    {form.card_holder_name.toUpperCase() || "YOUR NAME"}
                  </Text>
                </View>

                <View>
                  <Text style={styles.cardMetaLabel}>EXPIRES</Text>

                  <Text style={styles.expiryText}>
                    {form.expiry_date || "MM/YY"}
                  </Text>
                </View>
              </View>
            </View>

            {/* Form */}
            <View style={styles.formSection}>
              <Text style={styles.formSectionTitle}>Card information</Text>

              <Text style={styles.formSectionSubtitle}>
                Fields marked with * are required.
              </Text>

              <Field
                label="Card number *"
                icon="credit-card"
                placeholder="1234 5678 9012 3456"
                value={form.card_number}
                onChangeText={(value) =>
                  setForm((current) => ({
                    ...current,
                    card_number: formatCardInput(value),
                  }))
                }
                keyboardType="numeric"
                maxLength={19}
                autoCapitalize="none"
              />

              <Field
                label="Cardholder name *"
                icon="user"
                placeholder="John Doe"
                value={form.card_holder_name}
                onChangeText={(value) =>
                  setForm((current) => ({
                    ...current,
                    card_holder_name: value,
                  }))
                }
                autoCapitalize="words"
              />

              <View style={styles.formRow}>
                <View style={styles.formColumn}>
                  <Field
                    label="Expiry date *"
                    icon="calendar"
                    placeholder="MM/YY"
                    value={form.expiry_date}
                    onChangeText={(value) =>
                      setForm((current) => ({
                        ...current,
                        expiry_date: formatExpiry(value),
                      }))
                    }
                    keyboardType="numeric"
                    maxLength={5}
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.formColumn}>
                  <Field
                    label="CVV *"
                    icon="lock"
                    placeholder="•••"
                    value={form.cvv}
                    onChangeText={(value) =>
                      setForm((current) => ({
                        ...current,
                        cvv: value.replace(/\D/g, "").slice(0, 4),
                      }))
                    }
                    keyboardType="numeric"
                    maxLength={4}
                    secureTextEntry
                    autoCapitalize="none"
                  />
                </View>
              </View>

              <Field
                label="Billing address"
                icon="map-pin"
                placeholder="Street, city, country"
                value={form.billing_address}
                onChangeText={(value) =>
                  setForm((current) => ({
                    ...current,
                    billing_address: value,
                  }))
                }
                autoCapitalize="sentences"
              />
            </View>

            {/* Submit */}
            <TouchableOpacity
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.85}
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            >
              {saving ? (
                <ActivityIndicator color={C.white} />
              ) : (
                <>
                  <Feather
                    name={editTarget ? "check" : "plus"}
                    size={18}
                    color={C.white}
                  />

                  <Text style={styles.saveButtonText}>
                    {editTarget ? "Save changes" : "Add card"}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              disabled={saving}
              activeOpacity={0.7}
              style={styles.cancelButton}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <View style={styles.formSecurityNote}>
              <Feather name="shield" size={15} color={C.muted} />

              <Text style={styles.formSecurityText}>
                Keep your payment information private.
              </Text>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: C.bg,
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    paddingBottom: 36,
  },

  // Header
  header: {
    backgroundColor: C.headerBg,
    paddingTop: 24,
    paddingBottom: 27,
    paddingHorizontal: 22,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: "hidden",
  },

  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },

  headerIcon: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: C.blue,
    alignItems: "center",
    justifyContent: "center",
  },

  headerTextContainer: {
    flex: 1,
  },

  headerEyebrow: {
    color: C.whiteSoft,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.6,
    marginBottom: 4,
  },

  headerTitle: {
    color: C.white,
    fontSize: 23,
    fontWeight: "700",
    letterSpacing: -0.5,
  },

  headerSubtitle: {
    color: C.whiteSoft,
    fontSize: 11,
    marginTop: 3,
  },

  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: C.blue,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: 13,
  },

  addButtonText: {
    color: C.white,
    fontSize: 11.5,
    fontWeight: "700",
  },

  headerStats: {
    marginTop: 28,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.14)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  statLabel: {
    color: C.whiteSoft,
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 1.2,
  },

  statValue: {
    color: C.white,
    fontSize: 30,
    fontWeight: "700",
    marginTop: 4,
    fontVariant: ["tabular-nums"],
  },

  headerStatIcon: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: C.whiteChip,
    alignItems: "center",
    justifyContent: "center",
  },

  headerDecorationOne: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "rgba(63,88,247,0.12)",
    top: -95,
    right: -45,
  },

  headerDecorationTwo: {
    position: "absolute",
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    bottom: -48,
    right: 65,
  },

  // Content
  content: {
    paddingHorizontal: 22,
    paddingTop: 27,
  },

  sectionHeading: {
    marginBottom: 14,
  },

  sectionTitle: {
    color: C.ink,
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.3,
  },

  sectionSubtitle: {
    color: C.muted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 5,
  },

  loadingContainer: {
    minHeight: 220,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    color: C.muted,
    fontSize: 13,
    marginTop: 12,
  },

  // Visual cards
  carouselContent: {
    paddingTop: 5,
    paddingBottom: 19,
    paddingRight: 4,
  },

  carouselItem: {
    width: 294,
    marginRight: 12,
  },

  visualCard: {
    height: 190,
    borderRadius: 22,
    padding: 20,
    justifyContent: "space-between",
    overflow: "hidden",
    elevation: 5,
    shadowColor: C.headerBg,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.17,
    shadowRadius: 10,
  },

  visualCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 1,
  },

  chipOuter: {
    width: 37,
    height: 29,
    backgroundColor: "#E8D49B",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(15,23,42,0.2)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  chipLineVertical: {
    position: "absolute",
    width: 1,
    height: "100%",
    backgroundColor: "rgba(15,23,42,0.2)",
  },

  chipLineHorizontal: {
    position: "absolute",
    width: "100%",
    height: 1,
    backgroundColor: "rgba(15,23,42,0.2)",
  },

  brandBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 8,
  },

  brandText: {
    color: C.white,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },

  cardNumberContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    zIndex: 1,
  },

  cardNumber: {
    color: C.white,
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 1.2,
    fontVariant: ["tabular-nums"],
  },

  visualCardBottom: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 12,
    zIndex: 1,
  },

  cardHolderContainer: {
    flex: 1,
  },

  cardMetaLabel: {
    color: "rgba(255,255,255,0.62)",
    fontSize: 8,
    fontWeight: "600",
    letterSpacing: 1.1,
    marginBottom: 5,
  },

  cardHolderName: {
    color: C.white,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.6,
  },

  expiryContainer: {
    alignItems: "flex-end",
  },

  expiryText: {
    color: C.white,
    fontSize: 12,
    fontWeight: "600",
  },

  cardDecorationOne: {
    position: "absolute",
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: "rgba(255,255,255,0.055)",
    right: -55,
    top: -80,
  },

  cardDecorationTwo: {
    position: "absolute",
    width: 125,
    height: 125,
    borderRadius: 63,
    backgroundColor: "rgba(255,255,255,0.045)",
    right: -20,
    bottom: -90,
  },

  // Empty state
  emptyContainer: {
    backgroundColor: C.tile,
    borderRadius: 22,
    paddingHorizontal: 25,
    paddingVertical: 34,
    alignItems: "center",
    marginTop: 4,
    marginBottom: 16,
  },

  emptyIconContainer: {
    width: 66,
    height: 66,
    borderRadius: 21,
    backgroundColor: C.blueSoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },

  emptyTitle: {
    color: C.ink,
    fontSize: 17,
    fontWeight: "700",
  },

  emptyDescription: {
    color: C.muted,
    fontSize: 12.5,
    lineHeight: 20,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 20,
  },

  emptyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: C.blue,
    borderRadius: 13,
    paddingHorizontal: 20,
    paddingVertical: 13,
  },

  emptyButtonText: {
    color: C.white,
    fontSize: 13,
    fontWeight: "700",
  },

  // Saved card list
  listHeading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    marginTop: 8,
    marginBottom: 13,
  },

  listTitle: {
    color: C.ink,
    fontSize: 16,
    fontWeight: "700",
  },

  countBadge: {
    minWidth: 24,
    height: 24,
    paddingHorizontal: 7,
    borderRadius: 8,
    backgroundColor: C.blueSoft,
    alignItems: "center",
    justifyContent: "center",
  },

  countBadgeText: {
    color: C.blue,
    fontSize: 11,
    fontWeight: "700",
  },

  cardListItem: {
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 19,
    padding: 16,
    marginBottom: 12,
  },

  cardListTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  cardInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  cardListIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  cardInfoText: {
    flex: 1,
  },

  savedCardNumber: {
    color: C.ink,
    fontSize: 13.5,
    fontWeight: "700",
    letterSpacing: 0.3,
  },

  savedCardHolder: {
    color: C.muted,
    fontSize: 11.5,
    marginTop: 5,
  },

  cardActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  editButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: C.blueSoft,
    alignItems: "center",
    justifyContent: "center",
  },

  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#FEF2F2",
    alignItems: "center",
    justifyContent: "center",
  },

  cardDetailsDivider: {
    height: 1,
    backgroundColor: C.line,
    marginVertical: 15,
  },

  cardDetails: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 20,
  },

  detailItem: {
    minWidth: 75,
  },

  billingDetail: {
    flex: 1,
    minWidth: "100%",
  },

  detailLabel: {
    color: C.faint,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.9,
    marginBottom: 6,
  },

  detailValue: {
    color: C.text,
    fontSize: 11.5,
    fontWeight: "600",
  },

  // Security note
  securityCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: C.tile,
    borderRadius: 17,
    padding: 16,
    marginTop: 16,
  },

  securityIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
  },

  securityTextContainer: {
    flex: 1,
  },

  securityTitle: {
    color: C.ink,
    fontSize: 12.5,
    fontWeight: "700",
  },

  securityDescription: {
    color: C.muted,
    fontSize: 11.5,
    lineHeight: 18,
    marginTop: 5,
  },

  // Modal
  modalScreen: {
    flex: 1,
    backgroundColor: C.bg,
  },

  modalHeader: {
    backgroundColor: C.headerBg,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 24,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  modalHeaderText: {
    flex: 1,
  },

  modalEyebrow: {
    color: C.whiteSoft,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginBottom: 6,
  },

  modalTitle: {
    color: C.white,
    fontSize: 22,
    fontWeight: "700",
  },

  modalSubtitle: {
    color: C.whiteSoft,
    fontSize: 12,
    marginTop: 5,
  },

  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: C.whiteChip,
    alignItems: "center",
    justifyContent: "center",
  },

  modalScroll: {
    flex: 1,
  },

  modalContent: {
    paddingHorizontal: 22,
    paddingTop: 23,
    paddingBottom: 35,
  },

  previewLabel: {
    color: C.muted,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.1,
    marginBottom: 12,
  },

  previewCard: {
    height: 180,
    borderRadius: 20,
    padding: 20,
    justifyContent: "space-between",
    overflow: "hidden",
    marginBottom: 28,
  },

  previewCardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  previewBrand: {
    color: C.white,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
  },

  previewNumber: {
    color: C.white,
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: 1,
    fontVariant: ["tabular-nums"],
  },

  previewBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: 12,
  },

  previewHolderContainer: {
    flex: 1,
  },

  formSection: {
    backgroundColor: C.white,
    borderRadius: 18,
  },

  formSectionTitle: {
    color: C.ink,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 5,
  },

  formSectionSubtitle: {
    color: C.muted,
    fontSize: 11.5,
    marginBottom: 20,
  },

  fieldContainer: {
    marginBottom: 17,
  },

  fieldLabel: {
    color: C.text,
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 9,
  },

  inputContainer: {
    minHeight: 51,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    backgroundColor: C.tile,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 13,
    paddingHorizontal: 14,
  },

  input: {
    flex: 1,
    color: C.ink,
    fontSize: 13,
    paddingVertical: 13,
    minWidth: 0,
  },

  formRow: {
    flexDirection: "row",
    gap: 12,
  },

  formColumn: {
    flex: 1,
    minWidth: 0,
  },

  saveButton: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    backgroundColor: C.blue,
    borderRadius: 15,
    marginTop: 10,
  },

  saveButtonDisabled: {
    opacity: 0.7,
  },

  saveButtonText: {
    color: C.white,
    fontSize: 14,
    fontWeight: "700",
  },

  cancelButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    marginTop: 3,
  },

  cancelButtonText: {
    color: C.muted,
    fontSize: 13,
    fontWeight: "600",
  },

  formSecurityNote: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 7,
    marginTop: 5,
  },

  formSecurityText: {
    color: C.muted,
    fontSize: 10.5,
  },
});
