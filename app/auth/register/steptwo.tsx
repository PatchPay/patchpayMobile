import { useEffect, useState } from "react";
import {
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  SafeAreaView,
} from "react-native";
import { router } from "expo-router";
import { useRegister } from "./registercontext";
import { InputField, PrimaryButton, ScreenShell } from "./componentsdata";
import PhoneInput, {
  getCountryByPhoneNumber,
} from "react-native-international-phone-number";
import { INDUSTRIES } from "./industries";
import { Ionicons } from "@expo/vector-icons";

// ─── Country data ─────────────────────────────────────────────────────────────

const COUNTRIES = [
  { name: "Nigeria", code: "NG", dialCode: "+234", flag: "🇳🇬" },
  { name: "Ghana", code: "GH", dialCode: "+233", flag: "🇬🇭" },
  { name: "Kenya", code: "KE", dialCode: "+254", flag: "🇰🇪" },
  { name: "South Africa", code: "ZA", dialCode: "+27", flag: "🇿🇦" },
  { name: "Uganda", code: "UG", dialCode: "+256", flag: "🇺🇬" },
  { name: "Tanzania", code: "TZ", dialCode: "+255", flag: "🇹🇿" },
  { name: "Ethiopia", code: "ET", dialCode: "+251", flag: "🇪🇹" },
  { name: "Egypt", code: "EG", dialCode: "+20", flag: "🇪🇬" },
  { name: "Morocco", code: "MA", dialCode: "+212", flag: "🇲🇦" },
  { name: "Senegal", code: "SN", dialCode: "+221", flag: "🇸🇳" },
  { name: "Cameroon", code: "CM", dialCode: "+237", flag: "🇨🇲" },
  { name: "Ivory Coast", code: "CI", dialCode: "+225", flag: "🇨🇮" },
  { name: "Rwanda", code: "RW", dialCode: "+250", flag: "🇷🇼" },
  { name: "Zambia", code: "ZM", dialCode: "+260", flag: "🇿🇲" },
  { name: "Zimbabwe", code: "ZW", dialCode: "+263", flag: "🇿🇼" },
  { name: "United States", code: "US", dialCode: "+1", flag: "🇺🇸" },
  { name: "United Kingdom", code: "GB", dialCode: "+44", flag: "🇬🇧" },
  { name: "Canada", code: "CA", dialCode: "+1", flag: "🇨🇦" },
  { name: "France", code: "FR", dialCode: "+33", flag: "🇫🇷" },
  { name: "Germany", code: "DE", dialCode: "+49", flag: "🇩🇪" },
  { name: "India", code: "IN", dialCode: "+91", flag: "🇮🇳" },
  { name: "China", code: "CN", dialCode: "+86", flag: "🇨🇳" },
  { name: "Brazil", code: "BR", dialCode: "+55", flag: "🇧🇷" },
  { name: "Australia", code: "AU", dialCode: "+61", flag: "🇦🇺" },
  { name: "UAE", code: "AE", dialCode: "+971", flag: "🇦🇪" },
  { name: "Saudi Arabia", code: "SA", dialCode: "+966", flag: "🇸🇦" },
  { name: "Turkey", code: "TR", dialCode: "+90", flag: "🇹🇷" },
  { name: "Pakistan", code: "PK", dialCode: "+92", flag: "🇵🇰" },
  { name: "Indonesia", code: "ID", dialCode: "+62", flag: "🇮🇩" },
  { name: "Mexico", code: "MX", dialCode: "+52", flag: "🇲🇽" },
] as const;

type Country = (typeof COUNTRIES)[number];

// ─── Country Selector Modal ───────────────────────────────────────────────────

function CountryModal({
  visible,
  selected,
  onSelect,
  onClose,
}: {
  visible: boolean;
  selected: Country;
  onSelect: (c: Country) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const filtered = COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      c.dialCode.includes(query),
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={modal.container}>
        {/* Header */}
        <View style={modal.header}>
          <Text style={modal.title}>Select Country</Text>
          <TouchableOpacity
            onPress={onClose}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close" size={22} color="#555" />
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={modal.searchWrap}>
          <Ionicons
            name="search-outline"
            size={16}
            color="#999"
            style={{ marginRight: 8 }}
          />
          <TextInput
            style={modal.searchInput}
            placeholder="Search country or dial code..."
            placeholderTextColor="#BDBDBD"
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
            autoFocus
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery("")}>
              <Ionicons name="close-circle" size={16} color="#BDBDBD" />
            </TouchableOpacity>
          )}
        </View>

        {/* List */}
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.code}
          keyboardShouldPersistTaps="handled"
          ItemSeparatorComponent={() => <View style={modal.separator} />}
          renderItem={({ item }) => {
            const isSelected = selected.code === item.code;
            return (
              <TouchableOpacity
                style={[modal.row, isSelected && modal.rowSelected]}
                onPress={() => {
                  onSelect(item);
                  onClose();
                }}
                activeOpacity={0.7}
              >
                <Text style={modal.flag}>{item.flag}</Text>
                <Text
                  style={[
                    modal.countryName,
                    isSelected && modal.countryNameSelected,
                  ]}
                >
                  {item.name}
                </Text>
                <Text style={modal.dialCode}>{item.dialCode}</Text>
                {isSelected && (
                  <Ionicons name="checkmark" size={16} color="#1D9E75" />
                )}
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <Text style={modal.empty}>No countries found</Text>
          }
        />
      </SafeAreaView>
    </Modal>
  );
}

const modal = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E5E5",
  },
  title: { fontSize: 16, fontWeight: "600", color: "#111" },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    margin: 16,
    paddingHorizontal: 12,
    height: 42,
    backgroundColor: "#F5F5F5",
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: "#E0E0E0",
  },
  searchInput: { flex: 1, fontSize: 14, color: "#111" },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#F0F0F0",
    marginLeft: 56,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 13,
    gap: 12,
  },
  rowSelected: { backgroundColor: "#F0FBF7" },
  flag: { fontSize: 22, width: 32 },
  countryName: { flex: 1, fontSize: 14, color: "#222" },
  countryNameSelected: { color: "#085041", fontWeight: "500" },
  dialCode: { fontSize: 13, color: "#999", marginRight: 4 },
  empty: {
    textAlign: "center",
    color: "#999",
    fontSize: 13,
    paddingVertical: 32,
  },
});

// ─── Industry Picker ──────────────────────────────────────────────────────────

function IndustryPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [query, setQuery] = useState("");
  const filtered = INDUSTRIES.filter((i) =>
    i.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <View>
      <View style={styles.searchWrap}>
        <Text style={styles.searchIcon}>⌕</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search industries..."
          placeholderTextColor="#999"
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery("")}>
            <Text style={styles.clearBtn}>×</Text>
          </TouchableOpacity>
        )}
      </View>

      {value ? (
        <View style={styles.selectedPillRow}>
          <View style={styles.selectedPill}>
            <Text style={styles.selectedPillText}>{value}</Text>
            <TouchableOpacity onPress={() => onChange("")}>
              <Text style={styles.pillX}>×</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      {filtered.length === 0 ? (
        <Text style={styles.emptyText}>No industries found</Text>
      ) : (
        <View style={styles.chipGrid}>
          {filtered.map((industry) => {
            const isSelected = value === industry;
            return (
              <TouchableOpacity
                key={industry}
                style={[styles.chip, isSelected && styles.chipSelected]}
                onPress={() => onChange(isSelected ? "" : industry)}
                activeOpacity={0.7}
              >
                <View style={[styles.dot, isSelected && styles.dotSelected]} />
                <Text
                  style={[
                    styles.chipText,
                    isSelected && styles.chipTextSelected,
                  ]}
                  numberOfLines={1}
                >
                  {industry}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}

// ─── Section Divider ──────────────────────────────────────────────────────────

function SectionDivider({ label }: { label: string }) {
  return (
    <View style={styles.dividerRow}>
      <View style={styles.dividerLine} />
      <Text style={styles.dividerLabel}>{label}</Text>
      <View style={styles.dividerLine} />
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

const DEFAULT_COUNTRY = COUNTRIES.find((c) => c.code === "NG")!;

export default function StepTwo() {
  const { formData, updateField } = useRegister();

  // PhoneInput internal country state
  const [selectedCountry, setSelectedCountry] = useState<any>(null);

  // Our custom country selector state
  const [country, setCountry] = useState<Country>(DEFAULT_COUNTRY);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    if (!formData.type) router.replace("/auth/selectuser");
  }, [formData.type]);

  // When user picks a country from modal, sync it into PhoneInput
  const handleCountrySelect = (c: Country) => {
    setCountry(c);
    // Save country name to formData for the review screen
    updateField("country", c.name);
    updateField("countryCode", c.code); // ← add this
    // Clear the phone number so the new dial code isn't mixed with old digits
    updateField("phone", "");
    // PhoneInput uses its own country object — find matching one by cca2
    setSelectedCountry({ cca2: c.code });
  };

  const isPersonal = formData.type === "personal";

  return (
    <>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <ScreenShell
          step={2}
          totalSteps={formData.type === "personal" ? 3 : 4}
          title="Personal Information"
          subtitle={
            isPersonal
              ? "Tell us a bit about yourself"
              : "Tell us about your business"
          }
        >
          {isPersonal ? (
            <>
              {/* First + Surname side by side */}
              <View style={styles.nameRow}>
                <View style={{ flex: 1 }}>
                  <InputField
                    label="First Name"
                    placeholder="Enter your first name"
                    value={formData.firstName}
                    onChangeText={(t) => updateField("firstName", t)}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <InputField
                    label="Surname"
                    placeholder="Enter your surname"
                    value={formData.surname}
                    onChangeText={(t) => updateField("surname", t)}
                  />
                </View>
              </View>

              {/* Middle name */}
              <View style={styles.labelRow}>
                <Text style={styles.fieldLabel}>Middle Name</Text>
                <Text style={styles.optionalTag}>optional</Text>
              </View>
              <InputField
                placeholder="Enter your middle name(s)"
                value={formData.middleName}
                onChangeText={(t) => updateField("middleName", t)}
                label={""}
              />

              <SectionDivider label="Contact" />

              {/* Country selector */}
              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>Country</Text>
                <TouchableOpacity
                  style={styles.countrySelector}
                  onPress={() => setModalVisible(true)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.countrySelectorFlag}>{country.flag}</Text>
                  <Text style={styles.countrySelectorName}>{country.name}</Text>
                  <Ionicons name="chevron-down" size={14} color="#999" />
                </TouchableOpacity>
              </View>

              {/* Phone — dial code auto-set from country */}
              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>Phone Number</Text>
                <View style={styles.phoneWrapper}>
                  {/* Static dial code badge derived from selected country */}
                  <View style={styles.dialBadge}>
                    <Text style={styles.dialBadgeFlag}>{country.flag}</Text>
                    <Text style={styles.dialBadgeCode}>{country.dialCode}</Text>
                  </View>
                  <View style={styles.phoneDivider} />
                  {/* PhoneInput handles formatting; we lock its country via selectedCountry */}
                  <PhoneInput
                    value={formData.phone}
                    onChangePhoneNumber={(phone) => {
                      updateField("phone", phone);
                      // Reverse sync: if user types a different dial code, update our badge
                      const detected = getCountryByPhoneNumber(phone);
                      if (detected) {
                        const match = COUNTRIES.find(
                          (c) => c.code === detected.cca2,
                        );
                        if (match && match.code !== country.code) {
                          setCountry(match);
                          updateField("country", match.name);
                          updateField("countryCode", match.code);
                        }
                      }
                    }}
                    selectedCountry={selectedCountry}
                    onChangeSelectedCountry={(c) => {
                      setSelectedCountry(c);
                      const match = COUNTRIES.find((x) => x.code === c?.cca2);
                      if (match) {
                        setCountry(match);
                        updateField("country", match.name);
                        updateField("countryCode", match.code);
                      }
                    }}
                    phoneInputStyles={{
                      container: styles.phoneInputContainer,
                      flagContainer: styles.phoneInputFlagHidden,
                      callingCode: styles.phoneInputCallingCodeHidden,
                      divider: styles.phoneInputDividerHidden,
                      input: styles.phoneInputText,
                    }}
                    placeholder="000 0000 000"
                    placeholderTextColor="#BDBDBD"
                  />
                </View>
              </View>
            </>
          ) : (
            <>
              <InputField
                label="Business Name"
                value={formData.businessName}
                onChangeText={(t) => updateField("businessName", t)}
              />
              <View style={{ marginBottom: 16 }}>
                <Text style={styles.fieldLabel}>Industry</Text>
                <IndustryPicker
                  value={formData.industry}
                  onChange={(v) => updateField("industry", v)}
                />
              </View>
            </>
          )}

          <View style={{ paddingHorizontal: 16, marginTop: 20 }}>
            <PrimaryButton
              label="Continue"
              onPress={() => router.push("/auth/register/review")}
            />
          </View>
        </ScreenShell>
      </ScrollView>

      {/* Country modal rendered outside ScrollView so it covers full screen */}
      <CountryModal
        visible={modalVisible}
        selected={country}
        onSelect={handleCountrySelect}
        onClose={() => setModalVisible(false)}
      />
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  nameRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 4,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 5,
  },
  fieldLabel: {
    fontSize: 11,
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 5,
  },
  optionalTag: {
    fontSize: 10,
    color: "#BDBDBD",
    fontStyle: "italic",
    marginBottom: 5,
  },
  fieldBlock: {
    marginBottom: 14,
  },

  // Divider
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginVertical: 18,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#E0E0E0",
  },
  dividerLabel: {
    fontSize: 11,
    color: "#BDBDBD",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },

  // Country selector button
  countrySelector: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    height: 44,
    borderWidth: 0.5,
    borderColor: "#D0D0D0",
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: "#F8F8F8",
  },
  countrySelectorFlag: { fontSize: 20 },
  countrySelectorName: { flex: 1, fontSize: 14, color: "#111" },

  // Phone wrapper
  phoneWrapper: {
    flexDirection: "row",
    alignItems: "center",
    height: 44,
    borderWidth: 0.5,
    borderColor: "#D0D0D0",
    borderRadius: 10,
    backgroundColor: "#F8F8F8",
    overflow: "hidden",
  },
  dialBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    height: "100%",
  },
  dialBadgeFlag: { fontSize: 18 },
  dialBadgeCode: { fontSize: 13, color: "#555", fontWeight: "500" },
  phoneDivider: {
    width: StyleSheet.hairlineWidth,
    height: 24,
    backgroundColor: "#D0D0D0",
  },

  // PhoneInput internal overrides — hide its built-in flag/code UI
  // since we render our own dialBadge above
  phoneInputContainer: {
    flex: 1,
    backgroundColor: "transparent",
    borderWidth: 0,
    height: 44,
  },
  phoneInputFlagHidden: {
    width: 0,
    overflow: "hidden",
    padding: 0,
    margin: 0,
  },
  phoneInputCallingCodeHidden: {
    width: 0,
    overflow: "hidden",
    fontSize: 1,
  },
  phoneInputDividerHidden: {
    width: 0,
    backgroundColor: "transparent",
  },
  phoneInputText: {
    fontSize: 14,
    color: "#111",
    backgroundColor: "transparent",
    paddingLeft: 10,
  },

  // Industry picker
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: "#D0D0D0",
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 40,
    backgroundColor: "#F8F8F8",
    marginBottom: 10,
  },
  searchIcon: { fontSize: 16, color: "#999", marginRight: 6 },
  searchInput: { flex: 1, fontSize: 14, color: "#111" },
  clearBtn: { fontSize: 18, color: "#999", paddingHorizontal: 4 },
  selectedPillRow: { flexDirection: "row", marginBottom: 10 },
  selectedPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E1F5EE",
    borderWidth: 0.5,
    borderColor: "#5DCAA5",
    borderRadius: 99,
    paddingVertical: 4,
    paddingHorizontal: 12,
    gap: 6,
  },
  selectedPillText: { fontSize: 12, color: "#085041", fontWeight: "500" },
  pillX: { fontSize: 16, color: "#085041", opacity: 0.6 },
  chipGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 0.5,
    borderColor: "#D0D0D0",
    borderRadius: 10,
    backgroundColor: "#F8F8F8",
    width: "47%",
  },
  chipSelected: { borderColor: "#1D9E75", backgroundColor: "#E1F5EE" },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 99,
    borderWidth: 1.5,
    borderColor: "#C0C0C0",
  },
  dotSelected: { backgroundColor: "#1D9E75", borderColor: "#1D9E75" },
  chipText: { fontSize: 13, color: "#333", flexShrink: 1 },
  chipTextSelected: { color: "#085041", fontWeight: "500" },
  emptyText: {
    fontSize: 13,
    color: "#999",
    textAlign: "center",
    paddingVertical: 20,
  },
});
